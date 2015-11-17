var v = function(p){
	var w = 100;
	var h = 100;

	p.setup = function(){
		var cnv = p.createCanvas(windowWidth, 400);
	};

	p.draw = function(){
		p.background(0, 255, 0);
		fill(0);
		//text ('Fundamental Frequency: ' + freq.toFixed(2), 20, 20); 
	};
}

var myp5 = new p5(v, 'visualsContainer');

console.log(metronomeTime);