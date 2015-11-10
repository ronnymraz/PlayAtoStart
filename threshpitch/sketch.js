/**
 *  Pitch Detection using Auto Correlation.
 *  
 *  Auto correlation multiplies each sample in a buffer by all
 *  of the other samples. This emphasizes the fundamental
 *  frequency.
 *
 *  Running the signal through a low pass filter prior to
 *  autocorrelation helps bring out the fundamental frequency.
 *  
 *  The visualization is a correlogram, which plots
 *  the autocorrelations.
 *
 *  We calculate the pitch by counting the number of samples
 *  between peaks.
 *  
 *  Example by Jason Sigal and Golan Levin.
 *
 *  Edited to inclde an amplitude threshold and pitch recognition by: Ronny Mraz
 * 
 */

var source, fft, lowPass;

var threshold = 0.05;
var cutoff = 0;
var decayRate = 0.95;
//array of absolute fundamentals
var fundFreqs = [16.35, 17.32, 18.35, 19.45, 20.60, 21.83, 23.12, 24.50, 25.96, 27.50, 29.14, 30.87];
//array of corresponding notes
var pitches =   ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] 



// center clip nullifies samples below a clip amount
var doCenterClip = false;
var centerClipThreshold = 0.0;

// normalize pre / post autocorrelation
var preNormalize = true;
var postNormalize = true;


function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();

  source = new p5.AudioIn();
  source.start();

  lowPass = new p5.LowPass();
  lowPass.disconnect();
  source.connect(lowPass);

  fft = new p5.FFT();
  fft.setInput(lowPass);
}

function draw() {
  background(200);
  var volume = source.getLevel();
  // array of values from -1 to 1
  var timeDomain = fft.waveform(1024, 'float32');
  var corrBuff = autoCorrelate(timeDomain);
  
  //only run calculations if the source amplitude is above the threshold
if(volume > threshold + cutoff){
  beginShape();
  for (var i = 0; i < corrBuff.length; i++) {
    var w = map(i, 0, corrBuff.length, 0, width);
    var h = map(corrBuff[i], -1, 1, height, 0);
    curveVertex(w, h);
  }
  endShape();

  fill(0);
  //text ('Center Clip: ' + centerClipThreshold, 20, 20); 
  //line (0, height/2, width, height/2);
	
  var freq = findFrequency(corrBuff);
  text ('Fundamental Frequency: ' + freq.toFixed(2), 20, 20); 
  line (0, height/2, width, height/2);
 
  var noteDis = getNote(freq);

 
  text ('Note: ' + noteDis, 20, 50); 
  
}
}



// accepts a timeDomainBuffer and multiplies every value
function autoCorrelate(timeDomainBuffer) {
  
  var nSamples = timeDomainBuffer.length;

  // pre-normalize the input buffer
  if (preNormalize){
    timeDomainBuffer = normalize(timeDomainBuffer);
  }

  // zero out any values below the centerClipThreshold
  if (doCenterClip) {
    timeDomainBuffer = centerClip(timeDomainBuffer);
  }

  var autoCorrBuffer = [];
  for (var lag = 0; lag < nSamples; lag++){
    var sum = 0; 
    for (var index = 0; index < nSamples; index++){
      var indexLagged = index+lag;
      if (indexLagged < nSamples){
        var sound1 = timeDomainBuffer[index];
        var sound2 = timeDomainBuffer[indexLagged];
        var product = sound1 * sound2;
        sum += product;
      }
    }

    // average to a value between -1 and 1
    autoCorrBuffer[lag] = sum/nSamples;
  }

  // normalize the output buffer
  if (postNormalize){
    autoCorrBuffer = normalize(autoCorrBuffer);
  }

  return autoCorrBuffer;
}


// Find the biggest value in a buffer, set that value to 1.0,
// and scale every other value by the same amount.
function normalize(buffer) {
  var biggestVal = 0;
  var nSamples = buffer.length;
  for (var index = 0; index < nSamples; index++){
    if (abs(buffer[index]) > biggestVal){
      biggestVal = abs(buffer[index]);
    }
  }
  for (var index = 0; index < nSamples; index++){

    // divide each sample of the buffer by the biggest val
    buffer[index] /= biggestVal;
  }
  return buffer;
}

// Accepts a buffer of samples, and sets any samples whose
// amplitude is below the centerClipThreshold to zero.
// This factors them out of the autocorrelation.
function centerClip(buffer) {
  var nSamples = buffer.length;

  // center clip removes any samples whose abs is less than centerClipThreshold
  centerClipThreshold = map(mouseY, 0, height, 0,1); 

  if (centerClipThreshold > 0.0) {
    for (var i = 0; i < nSamples; i++) {
      var val = buffer[i];
      buffer[i] = (Math.abs(val) > centerClipThreshold) ? val : 0;
    }
  }
  return buffer;
}

// Calculate the fundamental frequency of a buffer
// by finding the peaks, and counting the distance
// between peaks in samples, and converting that
// number of samples to a frequency value.
function findFrequency(autocorr) {

  var nSamples = autocorr.length;
  var valOfLargestPeakSoFar = 0;
  var indexOfLargestPeakSoFar = -1;

  for (var index = 1; index < nSamples; index++){
    var valL = autocorr[index-1];
    var valC = autocorr[index];
    var valR = autocorr[index+1];

    var bIsPeak = ((valL < valC) && (valR < valC));
    if (bIsPeak){
      if (valC > valOfLargestPeakSoFar){
        valOfLargestPeakSoFar = valC;
        indexOfLargestPeakSoFar = index;
      }
    }
  }
  
  var distanceToNextLargestPeak = indexOfLargestPeakSoFar - 0;

  // convert sample count to frequency
  var fundamentalFrequency = sampleRate() / distanceToNextLargestPeak;
  return fundamentalFrequency;
}
//Get the pitch of the note by dividing the fundamental frequency
//of the signal by 2 until it is in the range of the absolute fundmantals
//compare this against an array of accepted frequencies, accounting for
//discrepencies in frequencies, and compare the accepted index against a corresponding
//array of accepted pitches.
function getNote(frequency){
	//print(frequency);
	
	//comparision float difference to account for quartertones and artifacts
	var compfloat = .435;
	
	//brings value to an absolute fundamental
	while(frequency > 31.735){
		frequency = frequency/2;
	}
	
		for(var i = 0; i < fundFreqs.length; i++){
			var minval = fundFreqs[i]-compfloat;
			var maxval = fundFreqs[i]+compfloat;
			if(between(frequency, minval, maxval)){
				//get the indexed pitch value against the matched index
				var pitch = pitches[i];	
				print(pitch);
				return pitch;	
				
			}
			//if we reach the end of the fundfrequency array, restart the loop with a larger comparative range
			if(i == fundFreqs.length - 1){
				i = 0;	
				compfloat = compfloat+.005;
			}
		}

	//SHOULD NOT REACH
	return "error";
}

function between(x, min, max){
	return x>= min && x <= max;
	
}


	
