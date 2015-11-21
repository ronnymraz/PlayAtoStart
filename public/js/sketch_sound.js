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

/*
delta bpm formula:
deltaTime = ((bpm/60)/subdivision) * 1000

MAKE SURE CONSOLE VIEW IS ON FOR RHTYHMIC FEEDBACK

*/


var source, fft, lowPass;




var threshold = 0.05;//alter amplitude threshold
var cutoff = 0;
var decayRate = 0.95;
//array of absolute fundamentals
var fundFreqs = [16.35, 17.32, 18.35, 19.45, 20.60, 21.83, 23.12, 24.50, 25.96, 27.50, 29.14, 30.87];
//array of corresponding notes
var pitches =   ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"] 

//test pitch
var pitch1 = "A#";

//our note
var noteDis = "empty";

var audioContext = null;//used for oscillators

var startTime = null;//used to calibrate timestamp array
var runningAccepted = null;//used as a running timestamp to be reinserted in the timestamp array

var hasScored = false;//rhtyhmic score check
var isCountingIn = true;//are we countingin? don't let any amplitude pass, the array is being calibrated
var hasHit = null;//variable to account for dublicate hits

var countingint = 1;//our countin starts at one

/*
*The BPM and subdivision system is completely dynamic between
*the bpm, and subdivisions up to a sixteenth. Just make sure they make sense
* For example: [2, 2, 1] would produce 2 eigthnotes and a quarter, ending on proper downbeats
where as: [2,1] would produce an eigth and a quarter (ending on an upbeat), we dont want that type of uneven rhythm yet
(though it would still work, its not optimal for testing)
*/
//EDIT BPM
var bpm = 60;
//EDIT SUBDIVISIONS
// 1 = quarter, 2 = eigth, 4 = sixteenth
var subdivisions = [2, 2, 1, 1, 1];//eigth, eigth, quarter, quarter, qarter (4 beats total)


var metronomeTime = 1000;//i dont think this actually does anything

var timeStampArray = null;//will be populated with timestamps
var hitArrray = null;//timestamps that result in a rhythmic "hit"
var divcounter = 0;
var countInMetro;//metronome that controls the countin
var rhythmicScore = null;
// center clip nullifies samples below a clip amount
var doCenterClip = false;
var centerClipThreshold = 0.0;

// normalize pre / post autocorrelation
var preNormalize = true;
var postNormalize = true;

var freq;


function setup() {
  createCanvas(windowWidth, windowHeight);
  noFill();

  audioContext = new AudioContext();

  timeStampArray = new Array(subdivisions.length);
  hitArrray = new Array(timeStampArray.length);

  print('date: '+Date.now());

  source = new p5.AudioIn();
  //source.getSources();
  source.start();

  console.log(source);

  lowPass = new p5.LowPass();
  lowPass.disconnect();
  source.connect(lowPass);

  fft = new p5.FFT();
  fft.setInput(lowPass);
  //count in a series of quarter notes to be printed to the console
  var countInTempo = (60/bpm)*1000;
  countInMetro = setInterval(function() { counting(); }, countInTempo);
  //StartMetronome();
}

function draw() {
  background(200);
  var volume = source.getLevel();
  // array of values from -1 to 1
  var timeDomain = fft.waveform(1024, 'float32');
  var corrBuff = autoCorrelate(timeDomain);
  


  //only run calculations if the source amplitude is above the threshold
  if(volume > threshold + cutoff){
    if(!isCountingIn){//are we done counting in? start checking rhythm
      var newTimeStamp = Date.now();
      CheckTimestamp(newTimeStamp);
    }

    //FFT CODE
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
  	
    freq = findFrequency(corrBuff);
    text ('Fundamental Frequency: ' + freq.toFixed(2), 20, 20); 
    line (0, height/2, width, height/2);
   
   //FIND THE PITCH
    noteDis = getNote(freq);
   
    text ('Note: ' + noteDis, 20, 50); 
  }

  if(hasScored){
    fill(0);
    if(rhythmicScore != null){
      text('Rhythm Score: ' + rhythmicScore, 40, 70 ); //currently wont print if score = 0
    }
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
				//print(pitch);
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
/* This method allows the player to set their tempo and triggers
*all the calculations related to rythms. On the last beat of this count-in
*a the timestamp array is populated, we gather our starting point and
*the system knows that exactly one beat after is the first "timestamp"
*to guage the player's rythm
*/
function counting(){
  //The metronome is started on the first downbeat because of the order
  //of operations inside of the StartMetronome() function. 
  if(countingint == 5){
    //print (countingint);
    StartMetronome();
    clearInterval(countInMetro);
  }else if (countingint == 4){
    print (countingint);
    startTime = Date.now();
    PopulateTimestamps();
    isCountingIn = false;
    countingint++;
  }else{
  print (countingint);
  countingint++;
}

}
/*
*Start Metronome keeps track of the rhythmic pattern in the music, 
*this is how the program knows when to stop accepting input and
*score the player. Oscillators are present purely for reference
*and testing the subdivision array. Oscillators should be commented out 
during a live session and to preserve resources.
*/
function StartMetronome(){
  //calculates the time of the current subdivision
var deltaTime = ((60/bpm)/subdivisions[divcounter])*1000;
var osc = audioContext.createOscillator();
osc.connect( audioContext.destination );
//print(Date.now());
//print(divcounter);
//print(deltaTime);
if(subdivisions[divcounter] == 1){
print("quarter");
osc.frequency.value = 220.0;
}
if(subdivisions[divcounter] == 2){
print("eigth");
osc.frequency.value = 440.0;
}
if(subdivisions[divcounter] == 4){
print("sixteenth");
osc.frequency.value = 880.0;
}
//initial pitch matching experiment
  if(noteDis == pitch1){
  //print("got it!");
  noteDis = "empty";

}
 
osc.start(audioContext.currentTime);
osc.stop(audioContext.currentTime + 0.25);       

    
if (divcounter < subdivisions.length - 1){
divcounter++;
setTimeout(function(){StartMetronome();}, deltaTime);

}else{
  //gives the length of a quarter note before calculating the score, this is helpful if the player
  //doesnt't play on the last beat
  setTimeout(function(){RhythmScore();}, ((60/bpm)*1000));
}
}
/*
*This function isn't called anywhere in the code, not sure of its purpose right now
*
*/
function ScanNotes(givenPitch, neededPitch){
//print("called scan" + divcounter);

if (divcounter <= subdivisions.length){
divcounter++;
StartMetronome();
}
if(givenPitch == neededPitch){
  //print("got it!");
  noteDis = "empty";
}
//clearInterval(metroCall);

}
/*
*When the player's amplitude goes above a threshold, a call is made to Date.Now().
*That number is then passed through this function and compared in a range of accepted values.
*If it falls within a range based on the array of accepted time stamps, it is marked as a hit.
*/

function CheckTimestamp(givenTime){
for(var i = 0; i < timeStampArray.length; i++){
  var mintime = timeStampArray[i]-50;
  var maxtime = timeStampArray[i]+50;
  if (between(givenTime, mintime, maxtime) && hasHit != i){
    hasHit = i; //this timestamp is marked as a hit
    hitArrray[i] = "hit";
    //WHEN USING THIS DATA FOR VISUALS HIT WOULD BE RETURNED INSTEAD OF PRINTED TO THE CONSOLE
    print(i);
    print("hit!");
    break;
    //right now misses do not punish the player
  }else if(i< timeStampArray.length && givenTime < timeStampArray[i+1]){
    //print(i);
    //print("missed!");
    break;
  }else if(i == timeStampArray.length - 1){
    //print("missed!");
    //print(i);
    break;
  }

}

}
/*Each time stamp must correspond to the time difference of the previous, the
*time difference of a notes appearance in a piece of music corresponds to the 
*delta of the subdivision before it. For example, 2 eighth notes followed by a quarter.
*Though our subdivison array would read [2, 2, 1], it would take the length of an eightnote 
*for the quarter to sound, not the length of a quarter. 
*/


function PopulateTimestamps(){
  runningAccepted = startTime;
  for(var i = 0; i < subdivisions.length; i++){
    if(i>0){
      var deltaTime = ((60/bpm)/subdivisions[i-1])*1000;
    }else{
      var deltaTime = ((60/bpm)/1)*1000;
    }
   runningAccepted += deltaTime;
   timeStampArray[i] = runningAccepted;
   //print(i);
   //print(timeStampArray[i]);

  }

}
/*
*Calculates rhythm score based on the number of "hits" in the array versus the array length
*
*/

function RhythmScore(){
  var score = 0;
for(var i = 0; i < hitArrray.length; i++){
  if(hitArrray[i] == "hit"){
    score++;
    hasScored = true;
    //print(score);
  }
}
rhythmicScore = score/hitArrray.length * 100;
print(rhythmicScore);
}








	
