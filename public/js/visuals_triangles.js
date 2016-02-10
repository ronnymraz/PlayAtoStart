var v = function(p){
	var w = 100;
	var h = 100;

	var canDebug = false;

	var squaresNum = 18;
	var squares = [];
	var squaresRight = [];
	var polygons = [];
	var canChange = [];

	var startTimeCorrectNote = p.millis();
	//only draw a new note every given interval
	var timerCorrectNote = 1000;

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
	console.log('possible rotations:'+typeof possibleRotations);

	

	var Square = function(num, offset){
		this.offset = offset;
		this.rotation = possibleRotations[num];
		this.oscillation = 0;
		console.log(this.rotation);
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
			p.triangle(0, (Math.cos(this.oscillation)+4)*20, -this.dimension.x*0.75-(this.reactScaleVal*0.5), this.dimension.y+this.reactScaleVal, this.dimension.x*0.75+(this.reactScaleVal*0.5), this.dimension.y+this.reactScaleVal);
			var middle = p.createVector(0, this.dimension.y);
			//p.line(0, 0, middle.x, middle.y);
			p.pop();

			if(this.reactScaleVal < this.reactScaleThreshold){
				this.reactScaleVal += this.reactScaleInc;
				this.reactAlpha -= this.reactScaleInc*2;
			}
		}

		this.changeColor = function(){
			this.currentColor = p.lerpColor(this.startColor, this.targetColor, this.colorVal);

			if(this.colorVal < 1)
				this.colorVal += this.colorInc;
		}
	}

	correctNote = function(note){
		console.log('correct note');
		if(p.millis() - startTimeCorrectNote > timerCorrectNote){
			var index = pickRandomIndex();
			canChange[index] = true;
			startTimeCorrectNote = p.millis();
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

	p.setup = function(){
		var cnv = p.createCanvas(p.windowWidth, p.windowHeight);

		for(var i = 0; i < squaresNum; i++){
			squares[i] = new Square(i, -p.width);
			squaresRight[i] = new Square(i, p.width);
			canChange[i] = false;
		}
		
	};

	p.draw = function(){
		p.background(230, 130, 145);
		p.translate(p.width*0.5, p.height*0.5);
		p.fill(0);
		p.text('click', 0, -p.windowHeight*0.5 + 20);

		if(canDebug){
			debug();
			instructions();
		}
		p.scale(0.25);
		for(var i = 0; i < squares.length; i++){
			if(canChange[i]){
				squares[i].changeColor();
				squares[i].react();
				squaresRight[i].changeColor();
				squaresRight[i].react();
			}

			squares[i].show();
			squaresRight[i].show();
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
