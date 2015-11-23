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
		p.fill(255);
		p.text ('note: ' + noteDis, 20 - p.windowWidth*0.5, 20 - p.windowHeight*0.5);
		p.text('current draw interval: ' + timerCorrectNote, 20 - p.windowWidth*0.5, 30 - p.windowHeight*0.5);
		p.text('current listen interval: ' + timerListenNote, 20 - p.windowWidth*0.5, 40 - p.windowHeight*0.5);
	}

	instructions = function(){
		p.fill(255);
		p.textAlign(p.RIGHT);
		p.text ('reset - r', - 20 + p.windowWidth*0.5, 20 - p.windowHeight*0.5);
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
