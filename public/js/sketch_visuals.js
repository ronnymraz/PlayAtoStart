var v = function(p){
	var w = 100;
	var h = 100;

	var canDebug = false;

	var handleNoteStartTime = p.millis();
	var handleNoteTimer = 500; //wait half a second to listen for the second note
	var canHandleNote = true;

	var squaresNum = 10;
	var squares = [];
	var polygons = [];
	var canChange = [];

	var beat_stroke = 10;
	var beat_alpha = 255;
	var down_beat_alpha = 255;

	var startTimeCorrectNote = p.millis();
	//only draw a new note every given interval
	var timerCorrectNote = 1000;

	var Square = function(){
		this.rotation = Math.random()*Math.PI*2;
		this.positionX = (Math.random()+1)*600;
		this.positionY = Math.random()*100;
		this.dimension = p.createVector(100+Math.random()*100, 300+Math.random()*400);
		this.startColor = p.color(Math.random()*55, Math.random()*55, Math.random()*55, 100);
		this.currentColor = this.startColor;
		this.targetColor = p.color(Math.random()*55 + 100, Math.random()*55 + 200, Math.random()*55 + 200, 100);
		this.alpha = 50;
		this.colorVal = 0;
		this.colorInc = 0.1;

		this.show = function(){
			p.fill(this.currentColor);
			p.noStroke();
			p.rectMode(p.CENTER);
			p.push();
			p.translate(this.dimensionX, this.dimensionY);
			p.rotate(this.rotation);
			p.rect(0, 0, this.dimension.x, this.dimension.y);
			p.pop();
		}

		this.changeColor = function(){
			this.currentColor = p.lerpColor(this.startColor, this.targetColor, this.colorVal);

			if(this.colorVal < 1)
				this.colorVal += this.colorInc;
		}
	}

	var Polygon = function(num){
		this.rotation = Math.random()*Math.PI*2;
		this.positionX = (-(squaresNum*0.5) + num) * 100;
		this.positionY = Math.random()*100;
		this.dimension = p.createVector(100+Math.random()*100, 300+Math.random()*400);
		this.startColor = p.color(Math.random()*55, Math.random()*55, Math.random()*55, 100);
		this.currentColor = this.startColor;
		this.targetColor = p.color(Math.random()*55 + 200, Math.random()*55 + 200, Math.random()*55 + 150, 200);
		this.alpha = 50;
		this.colorVal = 0;
		this.colorInc = 0.1;
		this.inc = 360/7
		this.rad = 100;

		this.show = function(){
			p.fill(this.currentColor);
			p.noStroke();
			p.rectMode(p.CENTER);
			p.push();
			p.translate(this.positionX, this.positionY);
			p.rotate(this.rotation);
			p.beginShape();
			for(var i = 0; i < 360; i += this.inc){
				p.vertex(Math.cos(p.radians(i))*this.rad, Math.sin(p.radians(i))*this.rad);
			}
			p.endShape();
			p.pop();
		}

		this.changeColor = function(){
			this.currentColor = p.lerpColor(this.startColor, this.targetColor, this.colorVal);

			if(this.colorVal < 1)
				this.colorVal += this.colorInc;
		}
	}

	setBeat = function(){
		beat_stroke = 0;
		down_beat_alpha = 155;
	}

	setDownBeat = function(){
		beat_stroke = 0;
		beat_alpha = 155;
	}

	drawBeat = function(){
		p.strokeWeight(2);
		p.stroke(150, beat_alpha);
		p.noFill();
		
		for(var i = 0; i < 5; i++){
			if(i % 2 == 0)
				p.stroke(150, beat_alpha);
			else
				p.stroke(150, down_beat_alpha);

			p.rect(0 + i*5, 0 + i*5, p.width-i*5*2, p.height-i*5*2);
		}

		p.strokeWeight(1);
		p.line(0, p.height*0.5, p.width, p.height*0.5);

		if(beat_alpha > 0){
			beat_alpha -= 10;
			beat_stroke += 3;
		}

		if(down_beat_alpha > 0)
			down_beat_alpha -= 10;
	}

	handleCorrectNote = function(note){
		if(canHandleNote){
			console.log('handling correct note',note);
			if(note == 'A')
				canChange[pickRandomIndex()] = true;

			if(note == 'G')
				canChange[pickRandomIndex()] = true;

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
		p.fill(255);
		p.text ('note: ' + noteDis, 20 - p.windowWidth*0.5, 20 - p.windowHeight*0.5);
		p.text('current draw interval: ' + timerCorrectNote, 20 - p.windowWidth*0.5, 30 - p.windowHeight*0.5);
		p.text('current listen interval: ' + timerListenNote, 20 - p.windowWidth*0.5, 40 - p.windowHeight*0.5);
	}

	instructions = function(){
		p.fill(255);
		p.textAlign(p.RIGHT);
		p.text ('reset - r', - 20 + p.windowWidth*0.5, 20 - p.windowHeight*0.5);
		p.text ('mute - m '+mute, - 20 + p.windowWidth*0.5, 30 - p.windowHeight*0.5);
		// p.text('current draw interval: ' + timerCorrectNote, 20 - p.windowWidth*0.5, 30 - p.windowHeight*0.5);
		// p.text('current listen interval: ' + timerListenNote, 20 - p.windowWidth*0.5, 40 - p.windowHeight*0.5);
	}

	p.setup = function(){
		var cnv = p.createCanvas(p.windowWidth, p.windowHeight);

		for(var i = 0; i < squaresNum; i++){
			squares[i] = new Square();
			polygons[i] = new Polygon(i);
			canChange[i] = false;
		}
		
	};

	p.draw = function(){
		p.background(50, 50, 55);

		drawBeat();

		p.fill(200);
		p.translate(p.width*0.5, p.height*0.5);
		for(var i = 0; i < squares.length; i++){
			squares[i].show();
			//polygons[i].show();
			if(canChange[i]){
				squares[i].changeColor();
				polygons[i].changeColor();
			}
		}

		p.fill(200);
		p.text('click', 0, -p.windowHeight*0.5 + 20);

		if(canDebug){
			debug();
			instructions();
		}
			
		if(p.millis() - handleNoteStartTime > handleNoteTimer)
			canHandleNote = true;

		
	};

	p.keyPressed = function(){
		if(p.key == ' '){
			var i = Math.floor(Math.random()*canChange.length);
			canChange[i] = true;
		}

		if(p.key == 'm' || p.key == 'M'){
			mute = !mute;
		}
	}

	p.mousePressed = function(){
		canDebug = !canDebug;
	}
}

var myp5 = new p5(v, 'visualsContainer');
