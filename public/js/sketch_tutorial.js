var v = function(p){
	var w = 100;
	var h = 100;

	var canDebug = false;

	var squaresNum = 10;
	var squares = [];
	var polygons = [];
	var canChange = [];

	var startTimeCorrectNote = p.millis();
	//only draw a new note every given interval
	var timerCorrectNote = 1000;

	var Square = function(x, y, note){
		this.note = note;
		this.rotation = Math.random()*Math.PI*2;
		this.positionX = x;
		this.positionY = y;
		this.dimension = p.createVector(300, 400);
		this.startColor = p.color(Math.random()*55, Math.random()*55, Math.random()*55, 100);
		this.currentColor = this.startColor;
		this.targetColor = p.color(Math.random()*55 + 100, Math.random()*55 + 200, Math.random()*55 + 200, 100);
		this.alpha = 50;
		this.colorVal = 0;
		this.colorInc = 0.1;

		this.fillRectHeight = 0;

		this.show = function(){
			p.fill(this.currentColor);
			p.noStroke();
			p.rectMode(p.CENTER);
			p.push();
			p.translate(this.positionX, this.positionY);
			//p.rotate(this.rotation);
			p.rect(0, 0, this.dimension.x, this.dimension.y);
			p.fill(255);
			p.text(note, 0, 0);	
			p.pop();
		}

		this.changeColor = function(){
			this.currentColor = p.lerpColor(this.startColor, this.targetColor, this.colorVal);

			if(this.colorVal < 1)
				this.colorVal += this.colorInc;
		}

		this.showCorrectNote = function(){
			p.fill(255, 255, 255, 100);
			p.push();
			p.translate(this.positionX, this.positionY);
			p.rect(0, this.dimension.y*0.5+this.fillRectHeight*0.5, this.dimension.x, this.fillRectHeight);
			p.pop();
		}

		this.setHeight = function(inc){
			if(Math.abs(this.fillRectHeight) < this.dimension.y)
				this.fillRectHeight -= inc;
		}
	}
	
	//ALWAYS HAVE A CORRECTNOTE() METHOD WHICH THEN CALLS THE DIFFERENT ANIMATIONS
	correctNote = function(note){
		console.log('correct note for visuals');
		squareA.setHeight(10);
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
		p.text ('note: ' + noteDis, 20, 20);
		p.text('current draw interval: ' + timerCorrectNote, 20, 30);
		p.text('current listen interval: ' + timerListenNote, 20, 40);
	}

	instructions = function(){
		p.fill(255);
		p.textAlign(p.RIGHT);
		p.text ('play A', - 20 + p.windowWidth*0.5, 20 - p.windowHeight*0.5);
		// p.text('current draw interval: ' + timerCorrectNote, 20 - p.windowWidth*0.5, 30 - p.windowHeight*0.5);
		// p.text('current listen interval: ' + timerListenNote, 20 - p.windowWidth*0.5, 40 - p.windowHeight*0.5);
	}

	p.setup = function(){
		var cnv = p.createCanvas(p.windowWidth, p.windowHeight);

		for(var i = 0; i < squaresNum; i++){
			squares[i] = new Square();
			canChange[i] = false;
		}

		squareA = new Square(p.windowWidth*0.333, p.windowHeight*0.5, 'A');
		squareG = new Square(p.windowWidth*0.666, p.windowHeight*0.5, 'G');
	};

	p.draw = function(){
		p.background(50, 50, 55);

		squareA.show();
		squareA.showCorrectNote();
		squareG.show();

		p.fill(200);
		p.text('click', p.windowWidth*0.5, 20);

		if(canDebug){
			debug();
			instructions();
		}
			
	};

	p.keyPressed = function(){
		if(p.key == ' '){
			var i = Math.floor(Math.random()*canChange.length);
			canChange[i] = true;
		}
	}

	p.mousePressed = function(){
		canDebug = !canDebug;
	}
}

var myp5 = new p5(v, 'visualsContainer');
