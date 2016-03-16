var v = function(p){
	var w = 100;
	var h = 100;

	var handleNoteStartTime = p.millis();
	var handleNoteTimer = 500; //wait half a second to listen for the second note
	var canHandleNote = true;

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
		this.startColor = p.color(Math.random()*55, Math.random()*55, Math.random()*55, 10);
		this.currentColor = this.startColor;
		this.targetColor = p.color(Math.random()*55 + 100, Math.random()*55 + 200, Math.random()*55 + 200, 10);
		this.alpha = 50;
		this.colorVal = 0;
		this.colorInc = 0.1;

		this.triangle_alpha = [10, 10, 10, 10];
		this.triangle_show = [false, false, false, false];
		this.tri_r = p.red(this.targetColor);
		this.tri_g = p.green(this.targetColor);
		this.tri_b = p.blue(this.targetColor);

		this.fillRectHeight = 0;

		this.currentCorrectNote = 0;

		this.show = function(){
			p.fill(this.currentColor, 0);
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

			p.translate(this.positionX - this.dimension.x*0.5, this.positionY - this.dimension.y*0.5);
			p.fill(this.tri_r, this.tri_g, this.tri_b, this.triangle_alpha[0]);
			p.triangle(0, 0, this.dimension.x*0.5, 0, 0, this.dimension.y*0.5);

			p.translate(this.dimension.x, 0); //top right
			p.scale(-1, 1, 1);
			p.fill(this.tri_r, this.tri_g, this.tri_b, this.triangle_alpha[1]);
			p.triangle(0, 0, this.dimension.x*0.5, 0, 0, this.dimension.y*0.5);

			p.translate(0, this.dimension.y); //bottom right
			p.scale(1, -1, 1);
			p.fill(this.tri_r, this.tri_g, this.tri_b, this.triangle_alpha[2]);
			p.triangle(0, 0, this.dimension.x*0.5, 0, 0, this.dimension.y*0.5);

			p.translate(this.dimension.x, 0); //bottom right
			p.scale(-1, 1, 1);
			p.fill(this.tri_r, this.tri_g, this.tri_b, this.triangle_alpha[3]);
			p.triangle(0, 0, this.dimension.x*0.5, 0, 0, this.dimension.y*0.5);

			p.pop();

			for(var i = 0; i < this.triangle_show.length; i++){
				if(this.triangle_show[i] && this.triangle_alpha[i] < 205)
					this.triangle_alpha[i] += 5;
			}
		}

		this.receivedCorrectNote = function(){
			this.triangle_show[this.currentCorrectNote] = true;

			if(this.currentCorrectNote < 3)
				this.currentCorrectNote++;
		}
	}

	//ALWAYS HAVE A CORRECTNOTE() METHOD WHICH THEN CALLS THE DIFFERENT ANIMATIONS
	handleCorrectNote = function(note){
		if(canHandleNote){
			console.log('handling correct note',note);
			if(note == 'A')
				squareA.receivedCorrectNote();

			if(note == 'G')
				squareG.receivedCorrectNote();

			canHandleNote = false;
			handleNoteStartTime = p.millis();
		}
	}

	setBeat = function(){
		//nothing in tutorial
	}

	setDownBeat = function(){

	}

	pickRandomIndex = function(){
		var i = Math.floor(Math.random()*canChange.length);
		if(canChange[i] == true){
			i = pickRandomIndex();
		}

		return i;
	}

	showProceed = function(){
		document.getElementById('proceed').innerHTML = "great! let's test out the next level!";
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
		cnv.position(0, 0);
		for(var i = 0; i < squaresNum; i++){
			squares[i] = new Square();
			canChange[i] = false;
		}

		squareA = new Square(p.windowWidth*0.333, p.windowHeight*0.5, 'A');
		squareG = new Square(p.windowWidth*0.666, p.windowHeight*0.5, 'G');
	};

	p.draw = function(){
		p.image(bg_warmup, 0, 0);

		p.stroke(0, 30);
		p.strokeWeight(2);
		for(var i = 0; i < 7; i++){
			p.line(0, p.height*0.5 + (i-3)*p.height*0.075, p.width, p.height*0.5 + (i-3)*p.height*0.075);
		}

		squareA.show();
		squareA.showCorrectNote();
		squareG.show();
		squareG.showCorrectNote();

		p.fill(200);
		p.text('click', p.windowWidth*0.5, 20);

		if(canDebug){
			debug();
			instructions();
		}

		if(p.millis() - handleNoteStartTime > handleNoteTimer)
			canHandleNote = true;

		var canProceed = true;
		for(var i = 0; i < squareA.triangle_show.length; i++){
			if(!squareA.triangle_show[i] || !squareG.triangle_show[i])
				canProceed = false;
		}

		if(canProceed)
			showProceed();
	};

	p.keyPressed = function(){
		if(p.key == ' '){
			var i = Math.floor(Math.random()*canChange.length);
			canChange[i] = true;
		}

		if(p.key == 'h' || p.key == 'H')
			handleCorrectNote('A');

		if(p.key == 'g' || p.key == 'G')
			handleCorrectNote('G');

		console.log('key pressed',p.key);
	}

	p.mousePressed = function(){
		canDebug = !canDebug;
	}
}

var myp5 = new p5(v, 'visualsContainer');
