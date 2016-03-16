var v = function(p){
	var w = 100;
	var h = 100;

	var beat_alpha = 100;
	var down_beat_alpha = 100;
	var beat_stroke = 1;

	var handleNoteStartTime = p.millis();
	var handleNoteTimer = 500; //wait half a second to listen for the second note
	var canHandleNote = true;

	var canDebug = false;

	var squaresNum = 18;
	var squares = [];
	var squaresRight = [];
	var polygons = [];
	var canChange = [];

	var stroke_a = 0;
	var stroke_g = 0;

	var startTimeCorrectNote = p.millis();
	//only draw a new note every given interval
	var timerCorrectNote = 1000;

	var notesHit = 0;

	//possible rotations
	Math.radians = function(degrees) {
  		return degrees * Math.PI / 180;
	};

	var possibleRotations = [];
	var inc = 360/squaresNum;
	index = 0;
	for(var i = 0; i < 360; i += inc){
		possibleRotations[index] = i;
		index++;
	}
	//console.log('possible rotations:'+typeof possibleRotations);



	var Square = function(num, offset){
		this.offset = offset;
		this.rotation = possibleRotations[num];
		this.oscillation = 0;
		this.globalRotationInc = 0.001;
		this.positionX = (Math.random()+1)*600;
		this.positionY = Math.random()*100;
		this.dimension = p.createVector(100+Math.random()*1, 200+Math.random()*20);
		this.startColor = p.color(Math.random()*55, Math.random()*55, Math.random()*55, 100);
		this.currentColor = this.startColor;
		if(this.offset < 0)
			this.targetColor = p.color(Math.random()*55 + 190, Math.random()*55 + 160, Math.random()*55 + 60, 200);
		else
			this.targetColor = p.color(Math.random()*55 + 230, Math.random()*55 + 140, Math.random()*55 + 180, 200);
		this.alpha = 50;
		this.colorVal = 0;
		this.colorInc = 0.1;

		this.reactAlpha = 255;
		this.reactScaleVal = 0;
		this.reactScaleInc = 6;
		this.reactScaleThreshold = 200;

		this.show = function(){
			this.rotation += this.globalRotationInc;
			this.oscillation += this.globalRotationInc*40;
			p.fill(this.currentColor);
			p.noStroke();
			p.rectMode(p.CENTER);
			p.push();
			p.translate(this.offset, -height*2);
			p.rotate(this.rotation);
			p.scale(1);
			p.triangle(0, (Math.cos(this.oscillation)+4)*20, -this.dimension.x*0.75, this.dimension.y, this.dimension.x*0.75, this.dimension.y);
			p.pop();
		}

		this.react = function(){
			p.noFill();
			var reactColor = color(this.currentColor, this.reactAlpha);
			p.fill(reactColor);
			p.noStroke();
			p.rectMode(p.CENTER);
			p.push();
			p.translate(this.offset, -height*2);
			p.rotate(this.rotation);
			p.scale(1);
			p.triangle(0, (Math.cos(this.oscillation)+4)*20, -this.dimension.x*0.75-(this.reactScaleVal*0.5), this.dimension.y+this.reactScaleVal, this.dimension.x*0.75+(this.reactScaleVal*0.5), this.dimension.y+this.reactScaleVal);
			var middle = p.createVector(0, this.dimension.y);
			//p.line(0, 0, middle.x, middle.y);
			p.pop();

			if(this.reactScaleVal < this.reactScaleThreshold){
				this.reactScaleVal += this.reactScaleInc*2;
				this.reactAlpha -= this.reactScaleInc*2;
			}
		}

		this.changeColor = function(){
			this.currentColor = p.lerpColor(this.startColor, this.targetColor, this.colorVal);

			if(this.colorVal < 1)
				this.colorVal += this.colorInc;
		}
	}

	setBeat = function(){
		beat_stroke = 0;
		beat_alpha = 155;
	}

	setDownBeat = function(){
		beat_stroke = 0;
		down_beat_alpha = 155;
	}

	drawBeat = function(){
		p.strokeWeight(2);
		p.stroke(250, beat_alpha);
		p.noFill();

		for(var i = 0; i < 30; i++){
			if(i % 2 == 0)
				p.stroke(250, beat_alpha);
			else
				p.stroke(250, down_beat_alpha);

			p.strokeWeight(2);
			p.line(-p.width*0.5, p.height*0.5 + i*5 , p.width*0.5, p.height*0.5 + i*5);
		}


		if(beat_alpha > 0){
			beat_alpha -= 10;
			beat_stroke += 3;
		}

		if(down_beat_alpha > 20)
			down_beat_alpha -= 10;
	}

	drawCharacter = function(){
		p.push();
		p.translate(0, p.cos(p.millis()*0.0025)*10);
		p.fill(5, 254, 167);
		p.rect(-p.width*0.75, p.height*1.77, 150, 100);

		p.fill(5, 204, 117);
		p.ellipse(-p.width*0.72, p.height*1.77, 30, 30);
		p.pop();
		p.fill(5, 254, 167);
		p.triangle(-p.width*0.75 - 60, p.height*2, -p.width*0.75 + 60, p.height*2, -p.width*0.75, p.height*1.85);

	}

	showProceed = function(){
		document.getElementById('proceed').innerHTML = "great! let's test out the next level!";

		//TODO all those crazy animations for the eye + making the monster white and colored and shit
	}

	handleCorrectNote = function(note){
		if(canHandleNote){
			console.log('handling correct note',note);

			notesHit++;

			if(note == 'D'){
				canChange[pickRandomIndex()] = true;
				stroke_a = 200;
			}

			if(note == 'F'){
				canChange[pickRandomIndex()] = true;
				stroke_g = 200;
			}

			canHandleNote = false;
			handleNoteStartTime = p.millis();
		}
	}

	pickRandomIndex = function(){
		var i = Math.floor(Math.random()*canChange.length);
		if(canChange[i] == true){
			i = pickRandomIndex();
		}

		return i;
	}

	debug = function(){
		p.fill(0);
		p.noStroke();
		p.text ('note: ' + noteDis, 20 - p.windowWidth*0.5, 20 - p.windowHeight*0.5);
		p.text('current draw interval: ' + timerCorrectNote, 20 - p.windowWidth*0.5, 30 - p.windowHeight*0.5);
		p.text('current listen interval: ' + timerListenNote, 20 - p.windowWidth*0.5, 40 - p.windowHeight*0.5);
	}

	instructions = function(){
		p.fill(0);
		p.noStroke();
		p.textAlign(p.RIGHT);
		p.text ('reset - r', - 20 + p.windowWidth*0.5, 20 - p.windowHeight*0.5);
		// p.text('current draw interval: ' + timerCorrectNote, 20 - p.windowWidth*0.5, 30 - p.windowHeight*0.5);
		// p.text('current listen interval: ' + timerListenNote, 20 - p.windowWidth*0.5, 40 - p.windowHeight*0.5);
	}

	drawNotes = function(){
		p.textSize(18);
		p.textAlign(p.CENTER, p.CENTER);
		p.fill(5, 184, 117);
		p.stroke(255, stroke_a);
		p.strokeWeight(10);
		p.rect(-p.width*0.45, -p.height*0.3, p.width*0.1, p.height*0.1);
		p.fill(255);
		p.noStroke();
		p.text('D', -p.width*0.4, -p.height*0.25);

		p.fill(5, 184, 117);
		p.stroke(255, stroke_g);
		p.strokeWeight(10);
		p.rect(-p.width*0.325, -p.height*0.3, p.width*0.1, p.height*0.1);
		p.fill(255);
		p.noStroke();
		p.text('F', -p.width*0.275, -p.height*0.25);

		if(stroke_a > 0)
			stroke_a -= 5;

		if(stroke_g > 0)
			stroke_g -= 5;
	}

	drawPoints = function(){
		p.push();
		p.stroke(255, down_beat_alpha);
		p.strokeWeight(5);
		for(var i = 0; i < p.width; i ++){
			p.point((i*30 % p.width), (i*12) % p.height*0.85);
		}
		p.pop();
	}

	drawBody = function(){
		p.noStroke();

		//head
		p.fill(180);
		// p.rect(-width*7, -height*2.5, width*14, height*5.85);

		p.fill(0);
		//mouth
		p.rect(-width*1.5, height, width*3, height*1.1);


		//teeth
		p.fill(160);
		p.beginShape();
		p.triangle(-width*1.5+60, height, -width*1.5+120, height, -width*1.5+80, height*1.4);//top left

		p.triangle(-width*1.5+200, height, -width*1.5+250, height, -width*1.5+230, height*1.4);//top right

		p.triangle(-width*1.5+20, height*2.1, -width*1.5+60, height*2.1, -width*1.5+50, height*1.7);//bottom left

		p.triangle(-width*1.5+200, height*2.1, -width*1.5+260, height*2.1, -width*1.5+210, height*1.7);//bottom right
		p.endShape(CLOSE);

	}

	p.setup = function(){
		var cnv = p.createCanvas(p.windowWidth, p.windowHeight);
		cnv.position(0, 0);
		for(var i = 0; i < squaresNum; i++){
			squares[i] = new Square(i, -p.width*0.45);
			squaresRight[i] = new Square(i, p.width*0.45);
			canChange[i] = false;
		}

	};

	p.draw = function(){
		p.image(bg, 0, 0);
		//drawPoints();
		p.translate(p.width*0.5, p.height*0.35);
		p.fill(0);
		p.text('click', 0, -p.windowHeight*0.5 + 20);



		drawBody();

		drawNotes();
		drawBeat();

		p.scale(0.25);
		for(var i = 0; i < squaresNum; i++){

			// var allDone = true;
			if(canChange[i]){
				squares[i].changeColor();
				squares[i].react();
				squaresRight[i].changeColor();
				squaresRight[i].react();
			}else{
				// allDone = false;
			}

			squares[i].show();
			squaresRight[i].show();
		}

		drawCharacter();

		p.scale(2.75);
		if(canDebug){
			debug();
			instructions();
		}

		if(p.millis() - handleNoteStartTime > handleNoteTimer)
			canHandleNote = true;

		if(notesHit == squaresRight.length)
			showProceed();

	};

	p.keyPressed = function(){
		if(p.key == ' '){
			var i = Math.floor(Math.random()*canChange.length);
			canChange[i] = true;
		}

		if(key == 'a' || key == 'A')
			handleCorrectNote('A');

	}

	p.mousePressed = function(){
		canDebug = !canDebug;
	}
}

function SelectRhythm(){
	var subdivisions = {};
	subdivisions.subdivisions0 = [1, 1, 1, 1];
	subdivisions.subdivisions1 = [2, 2, 2, 2, 2, 2, 1];
	subdivisions.subdivisions2 = [2, 2, 1, 2, 2, 1];
	subdivisions.subdivisions3 = [1, 2, 2, 1, 1];
	var numSubdivisions = 3;
	var pickDiv = Math.floor(Math.random()*((numSubdivisions) - 0)) + 1;
	var thisDiv = 'subdivisions' + pickDiv;
	var rSelected = subdivisions[thisDiv];
	return rSelected;
}

var myp5 = new p5(v, 'visualsContainer');
