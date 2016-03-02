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
			p.translate(this.offset, 0);
			p.rotate(this.rotation);
			p.scale(0.5);
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
			p.translate(this.offset, 0);
			p.rotate(this.rotation);
			p.scale(0.5);
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
		p.stroke(150, beat_alpha);
		p.noFill();
		
		for(var i = 0; i < 30; i++){
			if(i % 2 == 0)
				p.stroke(150, beat_alpha);
			else
				p.stroke(150, down_beat_alpha);

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
		p.rect(-p.width*0.75, p.height*1.55, 250, 150);

		p.fill(5, 204, 117);
		p.ellipse(-p.width*0.7, p.height*1.55, 40, 40);
		p.pop();
		p.fill(5, 254, 167);
		p.triangle(-p.width*0.75 - 125, p.height*2, -p.width*0.75 + 125, p.height*2, -p.width*0.75, p.height*1.75);
		
	}

	showProceed = function(){
		document.getElementById('proceed').innerHTML = "great! let's test out the next level!";

		//TODO all those crazy animations for the eye + making the monster white and colored and shit
	}

	handleCorrectNote = function(note){
		if(canHandleNote){
			console.log('handling correct note',note);

			notesHit++;

			if(note == 'A'){
				canChange[pickRandomIndex()] = true;
				stroke_a = 200;
			}

			if(note == 'G'){
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
		// p.fill(150);
		// p.stroke(255, stroke_a);
		// p.strokeWeight(10);
		// p.rect(-p.width*0.45, -p.height*0.3, p.width*0.1, p.height*0.1);
		// p.fill(255);
		// p.noStroke();
		// p.text('A', -p.width*0.4, -p.height*0.25);

		p.fill(150);
		p.stroke(255, stroke_g);
		p.strokeWeight(10);
		p.rect(-p.width*0.325, -p.height*0.3, p.width*0.1, p.height*0.1);
		p.fill(255);
		p.noStroke();
		p.text('G', -p.width*0.275, -p.height*0.25);

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
		p.fill(200);
		p.noStroke();
		//head
		p.beginShape();
		p.vertex(p.width*0.1, - p.height*0.05);
		p.vertex(p.width*0.3, - p.height*0.255);
		p.vertex(p.width*0.4, p.height*0.125);
		p.vertex(p.width*0.18, p.height*0.25);
		p.endShape(CLOSE);

		//back
		p.fill(100);
		p.beginShape();
		p.vertex(p.width*0.4, p.height*0.125);
		p.vertex(p.width*0.375, p.height*0.145);
		p.vertex(p.width*0.495, p.height*0.425);
		p.endShape(CLOSE);

		//torso top
		p.fill(150);
		p.beginShape();
		p.vertex(p.width*0.375, p.height*0.145);
		p.vertex(p.width*0.425, p.height*0.27);
		p.vertex(p.width*0.375, p.height*0.425);
		p.endShape(CLOSE);

		//torso bottom
		p.fill(180);
		p.beginShape();
		p.vertex(p.width*0.495, p.height*0.425);
		p.vertex(p.width*0.426, p.height*0.27);
		p.vertex(p.width*0.377, p.height*0.425);
		p.endShape(CLOSE);

		//leg front
		p.fill(90);
		p.beginShape();
		p.vertex(p.width*0.400, p.height*0.525);
		p.vertex(p.width*0.415, p.height*0.4275);
		p.vertex(p.width*0.380, p.height*0.427);
		p.endShape(CLOSE);

		//leg back
		p.fill(90);
		p.beginShape();
		p.vertex(p.width*0.450, p.height*0.525);
		p.vertex(p.width*0.465, p.height*0.4275);
		p.vertex(p.width*0.430, p.height*0.427);
		p.endShape(CLOSE);

		//teeth
		p.fill(90);
		p.beginShape();
		p.vertex(p.width*0.185, p.height*0.2);
		p.vertex(p.width*0.25, p.height*0.15);
		p.vertex(p.width*0.26, p.height*0.19);
		p.vertex(p.width*0.24, p.height*0.17);
		p.vertex(p.width*0.235, p.height*0.205);
		p.vertex(p.width*0.22, p.height*0.185);
		p.vertex(p.width*0.215, p.height*0.215);
		//last tooth
		p.vertex(p.width*0.2, p.height*0.2);
		p.vertex(p.width*0.2, p.height*0.23);
		p.endShape(CLOSE);

	}

	p.setup = function(){
		var cnv = p.createCanvas(p.windowWidth, p.windowHeight);
		cnv.position(0, 0);
		for(var i = 0; i < squaresNum; i++){
			squares[i] = new Square(i, -p.width*0);
			squaresRight[i] = new Square(i, p.width);
			canChange[i] = false;
		}
		
	};

	p.draw = function(){
		p.background(250, 170, 185);
		drawPoints();
		p.translate(p.width*0.5, p.height*0.35);
		p.fill(0);
		p.text('click', 0, -p.windowHeight*0.5 + 20);

		drawBeat();
		drawNotes();
		drawBody();

		p.scale(0.25);
		for(var i = 0; i < squaresNum; i++){

			// var allDone = true;
			if(canChange[i]){
				// squares[i].changeColor();
				// squares[i].react();
				squaresRight[i].changeColor();
				squaresRight[i].react();
			}else{
				// allDone = false;
			}

			//squares[i].show();
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
