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




var threshold = 0.1;//alter amplitude threshold
var cutoff = 0;
var decayRate = 0.95;
//array of absolute fundamentals
var fundFreqs = [16.35, 17.32, 18.35, 19.45, 20.60, 21.83, 23.12, 24.50, 25.96, 27.50, 29.14, 30.87];
//array of corresponding notes
var pitches =   ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]; 

var playFrequencies = {"C":261.63, "C#":277.18, "D":293.66, "D#":311.13,"E": 29.63,"F": 349.23, 
"F#":369.99, "G":392, "G#":415.3, "A":440, "A#":466.16, "B":493.88};

var hitPitches = null;//keeps track of pitch hits that are in rhythm
var totalPitches = 0;
//var lastPitch = "###";
var comparePitches = [];

var setPassiveMetronome;

var playCount = 0;
var perfectArray = [];
var playExample = true;

var wrongPitches = [];
var pitchHit = null;//KEEPS TRACK WHICH PITCHES HAVE BEEN HIT IN A PHRASE

var rHasMissed = null;
var rMissedArray;


//test pitch

//our note
var noteDis = "empty";

var audioContext = null;//used for oscillators

var startTime = null;//used to calibrate timestamp array
var runningAccepted = null;//used as a running timestamp to be reinserted in the timestamp array

var hasPitchScored = false;
var pitchBasedScore = null;
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
var bpm = 80;
//EDIT SUBDIVISIONS
// 1 = quarter, 2 = eigth, 4 = sixteenth
/* The subdivisions object will contain arrays of all the 
*various subdivisions, the current being for level 0.
*To transfer this to level one just change these variables accordingly.
*/
var subdivisions = {};
subdivisions.subdivisions0 = [1, 1, 1, 1];
subdivisions.subdivisions1 = [2, 2, 2, 2, 2, 2, 1];
subdivisions.subdivisions2 = [2, 2, 1, 2, 2, 1];
subdivisions.subdivisions3 = [1, 2, 2, 1, 1];
var numSubdivisions = 3;
//EDIT ACCEPTED PITCHEST
var acceptedPitches = ["G"];
var pickDiv;
var thisDiv;
/*
*
*/

var metronomeTime = 1000;//i dont think this actually does anything

var timeStampArray = null;//will be populated with timestamps
var hitArrray = null;//timestamps that result in a rhythmic "hit"
var divcounter = 0;
var countInMetro;//metronome that controls the countin
var rhythmicScore = null;
var totalRhythmScore = 0; //total score of undivided rhythms
var runningRhythmScore = 0;//Rhythm score divided by number of phrases


// center clip nullifies samples below a clip amount
var doCenterClip = false;
var centerClipThreshold = 0.0;

// normalize pre / post autocorrelation
var preNormalize = true;
var postNormalize = true;

var freq;

//timer for listening and sending to sketch_visuals.js
var startTimeListenNote;
var timerListenNote = 50;


function setup() {
  noCanvas();
  noFill();

  audioContext = new AudioContext();
  pickDiv = Math.floor(Math.random()*((numSubdivisions) - 0)) + 1;
  thisDiv = 'subdivisions' + pickDiv;
  print(thisDiv);
  print(subdivisions[thisDiv]);
  print(subdivisions[thisDiv][1]);
  timeStampArray = new Array(subdivisions[thisDiv].length);
  hitArrray = new Array(timeStampArray.length);
  hitPitches = new Array(timeStampArray.length);
  rMissedArray = new Array(timeStampArray.length);
  pitchHit = new Array(acceptedPitches.length);

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

  timerListenNote = 50;
}

function draw() {
  // background(200);
  var volume = source.getLevel();
  // array of values from -1 to 1
  var timeDomain = fft.waveform(1024, 'float32');
  var corrBuff = autoCorrelate(timeDomain);
  


  //only run calculations if the source amplitude is above the threshold


  if(volume > threshold + cutoff){


    //FFT CODE
    // beginShape();
    // for (var i = 0; i < corrBuff.length; i++) {
    //   var w = map(i, 0, corrBuff.length, 0, width);
    //   var h = map(corrBuff[i], -1, 1, height, 0);
    //   curveVertex(w, h);
    // }
    // endShape();

    // fill(0);
    // text ('Center Clip: ' + centerClipThreshold, 20, 20); 
    // line (0, height/2, width, height/2);
    
    freq = findFrequency(corrBuff);
    // text ('Fundamental Frequency: ' + freq.toFixed(2), 20, 20); 
    // line (0, height/2, width, height/2);
    
   //FIND THE PITCH

   //todo: average out / broader range of acceptable notes to account for imperfection/stutter?
   //SEE COMPARE NOTES FUNCTION
   noteDis = getNote(freq);
   if(!isCountingIn && !playExample && !hasScored){//are we done counting in? start checking rhythm
    //print("passsed threshold");
      var newTimeStamp = Date.now();
      CheckTimestamp(newTimeStamp, noteDis);
    }

  }
    
    // text ('Note: ' + noteDis, 20, 50); 
     //text ('Note: ' + noteDis, 20, 50); 
    
  
  //text ('Center Clip: ' + centerClipThreshold, 20, 20); 
  //line (0, height/2, width, height/2);
  
  
  //text ('Fundamental Frequency: ' + freq.toFixed(2), 20, 20); 
  //line (0, height/2, width, height/2);
  
 //FIND THE PITCH
 

  
   
    
    
  //}
  /*
  if(hasScored){
    fill(0);
    if(rhythmicScore != null){
      text('Rhythm Score: ' + rhythmicScore, 40, 70 ); //currently wont print if score = 0
    }
    else{
     text('Rhythm Score: ' + 0, 40, 70 );
    }
  }/*
    if(hasPitchScored){
      fill(0);
      if(pitchBasedScore!= null){
        text('Pitch Score: ' + pitchBasedScore, 40, 90);
        text('Missed Pitches: ' + missedPitch, 40, 110);
      }
      else{
        text('Pitch Score: ' + 0, 40, 90);
        text('Missed Pitches: ' + missedPitch, 40, 110);
      }
      */
    
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
  var osc = audioContext.createOscillator();
  osc.connect( audioContext.destination );
  osc.frequency.value = 1000;
  //The metronome is started on the first downbeat because of the order
  //of operations inside of the StartMetronome() function. 
  if(countingint == 5){
    //print (countingint);
    StartMetronome();
    clearInterval(countInMetro);
  }else if (countingint == 4){
    print ("Count in: " + countingint);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.25); 
    startTime = Date.now();
    PopulateTimestamps();
    isCountingIn = false;
    var passiveMetroTempo = (60/bpm)*1000;
    setPassiveMetronome = setInterval(function() { PassiveMetronome(); }, passiveMetroTempo);
    countingint++;
  }else{
    print ("Count in: " + countingint);
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.25); 
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
  var deltaTime = ((60/bpm)/subdivisions[thisDiv][divcounter])*1000 - 50;//50 second offset to account for latency that occurs with the oscillators and these calculations
  var osc = audioContext.createOscillator();
  osc.connect( audioContext.destination );
  //print(Date.now());
  //print(divcounter);
  //print(deltaTime);
  //ONLY PLAY OSCILLATORS TO DEMONSTRATE RHYTHM AND AVAILABLE PITCHES
  /**
  *In order to play the accepted notes randomly, we return a random integer
  *based on the length of the accepted notes array. We use that index to obtain
  *the notes string from the accepted notes arrayand then use that key to retrieve the "play frequeny" from the ass. array "playFrequencies"
  */
  if(playExample){
    var randomNote = Math.floor(Math.random()*((acceptedPitches.length - 1) + 1)) + 0;
    var playNote = playFrequencies[acceptedPitches[randomNote]];
    print(playNote);
    if(subdivisions[thisDiv][divcounter] == 1){
      print("quarter");
      osc.frequency.value = playNote;
    }
    if(subdivisions[thisDiv][divcounter] == 2){
      print("eigth");
      osc.frequency.value = playNote;
    }
    if(subdivisions[thisDiv][divcounter] == 4){
      print("sixteenth");
      osc.frequency.value = playNote;
    }
    osc.start(audioContext.currentTime);
    osc.stop(audioContext.currentTime + 0.25); 
  }      


if (divcounter < subdivisions[thisDiv].length - 1){
  divcounter++;
  setTimeout(function(){StartMetronome();}, deltaTime);
  if(!playExample){
    //setTimeout(function(){PRScores();}, 50);
  }

}
else{
  //gives the length of a quarter note before calculating the score, this is helpful if the player
  //doesnt't play on the last beat
  if(playExample){
      playExample = false;
      isCountingIn = true;
      countingint = 1;
      divcounter = 0;
      clearInterval(setPassiveMetronome);
      var countInTempo = (60/bpm)*1000;
      countInMetro = setInterval(function() { counting(); }, countInTempo);
    }
    else{
      playCount++;
      setTimeout(function(){PRScores();}, 300);
      setTimeout(function(){NewSession();}, 350);
    }
  

  }
  
}
/*
*Compares the given note against an array of accepted. If the note hit, we keep track
*that it was hit in another array so we can know ifthe player as beat the level or not.
*On a hit rhythm, it will reward the corresponding array index with a hit. On a missed rhythm,
*this function will still be called, as the user will still get a point for hitting the pitch
*on a missed rhythm
*/
function CompareNote(givenPitch, hasMissed){
  print(givenPitch);
    //print("calledPitchLOop");
  if(hasMissed == rHasMissed){
    return;
  }
  for(var i = 0; i < hitPitches.length; i ++){
    if(TrackHitPitches(givenPitch) && hitPitches[i] != "hit"){
      hitPitches[i] = "hit";
      //DO CORRECT NOTE THINGS HERE
      //pitchHit[i]
      return;
      //break;
    }
    else if(TrackHitPitches() && hitPitches[i] == "hit"){
      //ALSO HERE
      return;
      //break;
    }

  }
  //NOTHING HAPPENS
  print("Pitch missed");
}


function TrackHitPitches(givenPitch){
  for(var i = 0; i < acceptedPitches.length; i++){
    if(givenPitch == acceptedPitches[i]){
      pitchHit[i] = "hit";
      return true;
    }
  }
  return false;
}


/*
*When the player's amplitude goes above a threshold, a call is made to Date.Now().
*That number is then passed through this function and compared in a range of accepted values.
*If it falls within a range based on the array of accepted time stamps, it is marked as a hit.
*/

function CheckTimestamp(givenTime, givenPitch){
  //print("CheckTimestamp");
  for(var i = 0; i < timeStampArray.length; i++){
    var mintime = timeStampArray[i]-70;
    var maxtime = timeStampArray[i]+70;
    if (between(givenTime, mintime, maxtime) && hasHit != i){
      hasHit = i; //this timestamp is marked as a hit
      hitArrray[i] = "hit";
      //print(givenTime);
      //print(timeStampArray[i]);
      //WHEN USING THIS DATA FOR VISUALS HIT WOULD BE RETURNED INSTEAD OF PRINTED TO THE CONSOLE
      print(i);
      print("Rhythm hit!");
      CompareNote(givenPitch, i);
      break;
    
    }
    else if(i< timeStampArray.length && givenTime < timeStampArray[i+1]){
      //print("called missed: " + i);
        if(hitArrray[i] == "hit"){
          break;
        }
        else if(rHasMissed == i){
          break;
        }
        else if(i == timeStampArray.length - 1){
          print("Rhythm missed!");
          print(i);
          CompareNote(givenPitch, i);
          rHasMissed = i; //accounts for duplicates
          break;
        }
        else{
          print(i);
          print("Rhythm missed!");
          CompareNote(givenPitch, i);
          rHasMissed = i;  //accounts for duplicates
        }
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
  for(var i = 0; i < subdivisions[thisDiv].length; i++){
    if(i>0){
      var deltaTime = ((60/bpm)/subdivisions[thisDiv][i-1])*1000;
    }
    else{
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
      //hasScored = true;
    //print(score);
    }
  }
  rhythmicScore = score/hitArrray.length * 100;
  
  totalRhythmScore += rhythmicScore;
  print(rhythmicScore);

}

function PitchScore(){
  var pScore = 0;
  var missedPitch = ""
  
  for(var i = 0; i < hitPitches.length; i++){
    if(hitPitches[i] == "hit"){
      pScore++;
      //hasPitchScored = true;
    //print(score);
    } 
  }
  for(var i = 0; i < pitchHit.length; i++){
    //keeps track of the pitches the user missed to give valuable feedback
      if(pitchHit[i] != "hit"){
      missedPitch += acceptedPitches[i] + " ";
    }
  }
  pitchBasedScore = pScore/hitPitches.length * 100;
  print(pitchBasedScore);
  print("Missed Pitches: " + missedPitch);
}

function RunningScore(){
  runningRhythmScore = totalRhythmScore/playCount;
}

function PRScores(){
  clearInterval(setPassiveMetronome);
  RhythmScore();
  PitchScore();
  if(rhythmicScore == 100 && pitchBasedScore == 100){
    perfectArray[playCount] = "perfect";
  }

}

function ScanPerfect(){
  var perfectCount = 0;
  for(var i = 0; i<perfectArray.length; i++){
    if(perfectArray[i] == "perfect"){
      perfectCount ++;
    }
  }
  return perfectCount;
}
function PassiveMetronome(){
  //CUE METRO VISUALS HERE
  print("Metronome downbeat");

}
function NewSession(){
  RunningScore();
  print("Running Score = " + runningRhythmScore);
  if(playCount == 4 && runningRhythmScore >= 75 && pitchBasedScore >= 75){
    print("Complete!")
    var perectRhythms = ScanPerfect();
    print("You Had " + perectRhythms + " perfect rounds!");
  }
  else if(playCount == 6 && runningRhythmScore >= 75 && pitchBasedScore >= 100){
    print("Complete!")
    var perectRhythms = ScanPerfect();
    print("You Had " + perectRhythms + " perfect rounds!");
  }
  else if(playCount >= 6 && (runningRhythmScore <= 75 || pitchBasedScore != 100)){
    print("Level Failed! RhythmScore = " + runningRhythmScore + "PitchScore = " + pitchBasedScore );

  }
  else{
    pickDiv = Math.floor(Math.random()*((numSubdivisions) - 0)) + 1;
    thisDiv = 'subdivisions' + pickDiv;
    // print(thisDiv);
    // print(subdivisions[thisDiv]);
    // print(subdivisions[thisDiv][1]);
    timeStampArray = new Array(subdivisions[thisDiv].length);
    hitArrray = new Array(timeStampArray.length);
    hitPitches = new Array(timeStampArray.length);
    rMissedArray = new Array(timeStampArray.length);
    countingint = 1;
    playExample = true;
    isCountingIn = true;
    divcounter = 0;
    var countInTempo = (60/bpm)*1000;
    countInMetro = setInterval(function() { counting(); }, countInTempo);
  }

}
/*
*
*NOT CALLED YET, this is showing all the audio variables that will be reset when we call a restart
*/

function Restart(){
  rhythmicScore = 0;
  playCount = 0;
  totalRhythmScore = 0;
  runningRhythmScore = 0;
  pitchBasedScore = 0;
  pickDiv = Math.floor(Math.random()*((numSubdivisions) - 0)) + 1;
  thisDiv = 'subdivisions' + pickDiv;
  // print(thisDiv);
  // print(subdivisions[thisDiv]);
  // print(subdivisions[thisDiv][1]);
  timeStampArray = new Array(subdivisions[thisDiv].length);
  hitArrray = new Array(timeStampArray.length);
  hitPitches = new Array(timeStampArray.length);
  rMissedArray = new Array(timeStampArray.length);
  countingint = 1;
  playExample = true;
  isCountingIn = true;
  divcounter = 0;
  var countInTempo = (60/bpm)*1000;
  countInMetro = setInterval(function() { counting(); }, countInTempo);
}









