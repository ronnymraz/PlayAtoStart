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
 *  We calculate the pitch by counting the number of samples
 *  between peaks.
 *
 *  AutoCorrelation Example by Jason Sigal and Golan Levin.
 *
 *  Edited to inclde an amplitude threshold and monophonic pitch recognition by Ronny Mraz
 *
 *  Live Rhythm Tracking and Gameplay functionality by Ronny Mraz
 */

/*
delta bpm formula:
deltaTime = ((bpm/60)/subdivision) * 1000

TURN ON CONSOLE VIEW FOR RHTYHMIC FEEDBACK

*/


var source, fft, lowPass;




var threshold = 0.1;//alter amplitude threshold
var cutoff = 0;
var decayRate = 0.95;
//array of absolute fundamentals
var fundFreqs = [16.35, 17.32, 18.35, 19.45, 20.60, 21.83, 23.12, 24.50, 25.96, 27.50, 29.14, 30.87];
//array of corresponding notes
var pitches =   ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

//no longer necessary with sample based playback
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

var rHasMissed = null; //have we missed in this window already
var rMissedArray;

var hiHatAnalog;
var hihatDigital;
var kickAcoustic;
var snare;

var samples = [];

//difference in frequencies (Hz) of absolute fundamentals
//can be used to create a more robust pitch detector
//var compFloats = [.485, .515, 1.15, 1.23, 1.29, 1.38, 1.43, 1.54, 1.64,]

//our note
var noteDis = "empty";

var audioContext = null;//used for oscillators

var startTime = null;//used to calibrate timestamp array
var runningAccepted = null;//used as a running timestamp to be reinserted in the timestamp array

var runningPitchScore = 0;//players pitch score over an entire level
var totalPitchScore = 0;//score to use as denominator to calculate overall pitch score

var hasPitchScored = false;
var pitchBasedScore = null;
var hasScored = false;//rhtyhmic score check
var isCountingIn = true;//are we countingin? don't let any amplitude pass, the array is being calibrated
var hasHit = null;//variable to account for dublicate hits

var countingint = 1;//our countin starts at one

var waitForCountIn = false;

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
// 1 = quarter, 2 = eigth, 3 = triplet 4 = sixteenth
/* The subdivisions object will contain arrays of all the
*various subdivisions, the current being for level 0.
*To transfer this to level one just change these variables accordingly.
*/
/*
var subdivisions = {};
subdivisions.subdivisions0 = [1, 1, 1, 1];
subdivisions.subdivisions1 = [2, 2, 2, 2, 2, 2, 1];
subdivisions.subdivisions2 = [2, 2, 1, 2, 2, 1];
subdivisions.subdivisions3 = [1, 2, 2, 1, 1];
var numSubdivisions = 3;
//EDIT ACCEPTED PITCHEST
var acceptedPitches = ["D", "F"]; //accepted pitches for level
var pickDiv;
var thisDiv;
*/
/*
*
*/
var acceptedPitches = ["D", "F"]; //accepted pitches for level
var thisRhythm;
//var metronomeTime = 1000;//i dont think this actually does anything

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

//are we at a warmup scene?
var warmupScene;
//track the users warmup project
var trackWarmUp = [];
//number of correct "hits" the user needs 100 felt nice
var warmupNum = 100;
var warmupStage;
var levelStage;

var bg;

function preload(){
  if(warmup){
    bg = loadImage('../assets/warmup/'+warmupStage+'.jpg');
  }else{
    bg = loadImage('../assets/levels/'+levelStage+'.jpg');
  }

  hiHatAnalog = loadSound('../assets/samples/hihat-analog.wav');
  hihatDigital = loadSound('../assets/samples/hihat-digital.wav');//used for metronome, not included in sample array
  kickAcoustic = loadSound('../assets/samples/kick-acoustic01.wav');
  snare = loadSound('../assets/samples/snare-808.wav');
}

function setup() {
  noCanvas();
  noFill();
  bg.resize(windowWidth, windowHeight);
  audioContext = new AudioContext();
  //choose our initial subdivision

  print('date: '+Date.now());

  source = new p5.AudioIn();
  source.start();

  console.log(source);

  lowPass = new p5.LowPass();
  lowPass.disconnect();
  source.connect(lowPass);

  fft = new p5.FFT();
  fft.setInput(lowPass);
  //count in a series of quarter notes to be printed to the console
  if(warmupScene){
    trackWarmUp = new Array(acceptedPitches.length);
    //calibrate our hit array for the warmup, each array slot will count towards the warmup number for the number of pitches in the level
    for(var i = 0; i < trackWarmUp.length; i++){
      trackWarmUp[i] = 0;
      console.log(trackWarmUp[i]);
    }

  }else{
    var countInTempo = (60/bpm)*1000;
    /*
    *BEGIN GAMEPLAY ********************
    */
    /*
    pickDiv = Math.floor(Math.random()*((numSubdivisions) - 0)) + 1;
    thisDiv = 'subdivisions' + pickDiv;
    print(thisDiv);
    */
    thisRhythm = SelectRhythm();
    //create our array of accepted timestamps as they correspond to this subdivision
    timeStampArray = new Array(thisRhythm.length);
    hitArrray = new Array(timeStampArray.length);
    hitPitches = new Array(timeStampArray.length);
    rMissedArray = new Array(timeStampArray.length);
    pitchHit = new Array(acceptedPitches.length);


    // hiHatAnalog = loadSound('../assets/samples/hihat-analog.wav');
    // hihatDigital = loadSound('../assets/samples/hihat-digital.wav');//used for metronome, not included in sample array
    // kickAcoustic = loadSound('../assets/samples/kick-acoustic01.wav');
    // snare = loadSound('../assets/samples/snare-808.wav');
    samples = [snare, kickAcoustic, hiHatAnalog];
    countInMetro = setInterval(function() { counting(); }, countInTempo);
    timerListenNote = 50;
    console.log(acceptedPitches.length);
  }

}

function draw() {
  // background(200);
  var volume = source.getLevel();
  // array of values from -1 to 1
  var timeDomain = fft.waveform(1024, 'float32');
  var corrBuff = autoCorrelate(timeDomain);



  //only run calculations if the source amplitude is above the threshold

  if(volume > threshold + cutoff){
    freq = findFrequency(corrBuff);
     noteDis = getNote(freq);
     if(!isCountingIn && !playExample && !hasScored && !warmupScene){//are we done counting in? start checking rhythm
      //print("passsed threshold");
        if(waitForCountIn){
          waitForCountIn = false;
          isCountingIn = true;
          var countInTempo = (60/bpm)*1000;
          countInMetro = setInterval(function() { counting(); }, countInTempo);
        }else{
          var newTimeStamp = Date.now();
          CheckTimestamp(newTimeStamp, noteDis);
        }
      }else if(warmupScene){
        WarmUpCorrectNotes(noteDis);
      }

  }

}

/*
*AUTOCORRELATION CODE
*/

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

/*
*END AUTOCORRELATE CODE
*/


//Get the pitch of the note by dividing the fundamental frequency
//of the signal by 2 until it is in the range of the absolute fundmantals
//compare this against an array of accepted frequencies, accounting for
//discrepencies in frequencies, and compare the accepted index against a corresponding
//array of accepted pitches.
function getNote(frequency){
	//print(frequency);

	//comparision float difference to account for quartertones and artifacts
	var compfloat = .465;


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
    print ("Count in: " + countingint);
    hihatDigital.play();
    startTime = Date.now();
    PopulateTimestamps();
    isCountingIn = false;
    var passiveMetroTempo = (60/bpm)*1000;
    setPassiveMetronome = setInterval(function() { PassiveMetronome(); }, passiveMetroTempo); //basic downbeat metronome
    countingint++;
  }else{
    print ("Count in: " + countingint);
    hihatDigital.play();
    countingint++;
  }

}
/*
*Start Metronome keeps track of the rhythmic pattern in the music,
*this is how the program knows when to stop accepting input and
*score the player.
*/
function StartMetronome(){
  //calculates the time of the current subdivision
  var deltaTime = ((60/bpm)/thisRhythm[divcounter])*1000 - 50;//50 second offset to account for latency that occurs with sample playback
  /**
  *In order to play the accepted notes randomly, we return a random integer
  *based on the length of the accepted notes array. We use that index to obtain
  *the notes string from the accepted notes arrayand then use that key to retrieve the "play frequency" from the ass. array "playFrequencies"
  */
  if(playExample){
    var randomSample = Math.floor(Math.random()*((samples.length - 1) + 1)) + 0;
    var playSample = samples[randomSample];
    playSample.play();
  }


if (divcounter < thisRhythm.length - 1){
  divcounter++;
  setTimeout(function(){StartMetronome();}, deltaTime);
  if(!playExample){
    //setTimeout(function(){PRScores();}, 50);
  }

}
else{
  //delays calculations by the length of a quarter note before calculating the score, this is helpful if the player
  //doesnt't play on the last beat
  if(playExample){
      playExample = false;
      isCountingIn = false;
      waitForCountIn = true;
      countingint = 1;
      divcounter = 0;
      clearInterval(setPassiveMetronome);
      var countInTempo = (60/bpm)*1000;
      //countInMetro = setInterval(function() { counting(); }, countInTempo);
    }
    else{
      playCount++;
      setTimeout(function(){PRScores();}, 400);
      setTimeout(function(){NewSession();}, 450);
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
  if(hasMissed == rHasMissed){
    return;
  }
  for(var i = 0; i < hitPitches.length; i ++){
    if(TrackHitPitches(givenPitch) && hitPitches[i] != "hit"){
      hitPitches[i] = "hit";
      //INITIALIZE POSSITIVE VISUALS
      handleCorrectNote(givenPitch);
      return;
    }
    else if(TrackHitPitches() && hitPitches[i] == "hit"){
      //ALSO HERE
      return;
    }

  }
  //NOTHING HAPPENS
  print("Pitch missed");
  //TODO we need a way to bypass rhythm tracking for debug purposes
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
* Iterate through our array of accepted pitches to check for matches.
* each time we hit the pitch, increase the counter in the corresping (1:1)
* trackWarmUp array, check this array after every registered pitch
*/
function WarmUpCorrectNotes(givenPitch){
  for(var i = 0; i < acceptedPitches.length; i++){
    if(givenPitch == acceptedPitches[i]){
      trackWarmUp[i] += 1;
      console.log("Warmup Pitch! " + givenPitch);
      console.log(trackWarmUp[i]);
    }
  }
  CheckWarmup();

}
/*
*Checks if each array index has has reached the warmup number,
*until we reach the last index in the array.If any index has not reached
*the value stored in warmUpNum, we break out of the for loop
*/
function CheckWarmup(){
  console.log("Checking warmup!");
  for(var j = 0; j < trackWarmUp.length; j++){
    console.log("Warmup number: " + j);
    if(trackWarmUp[j] > warmupNum){
      if(j == trackWarmUp.length - 1){
        console.log("Warmup Complete!");
        warmupScene = false;
        Restart(); //sets parameters for gameplay
      }else{
        continue;
      }
    }else{
      break;
    }
  }
}

/*
*When the player's amplitude goes above a threshold, a call is made to Date.Now().
*That number is then passed through this function and compared in a range of accepted values.
*If it falls within a range based on the array of accepted time stamps, it is marked as a hit.
*/

function CheckTimestamp(givenTime, givenPitch){
  //print("CheckTimestamp");
  for(var i = 0; i < timeStampArray.length; i++){
    var mintime = timeStampArray[i]-100;
    var maxtime = timeStampArray[i]+100;
    if (between(givenTime, mintime, maxtime) && hasHit != i){
      hasHit = i; //this timestamp is marked as a hit
      hitArrray[i] = "hit";
      //print(givenTime);
      //print(timeStampArray[i]);
      //WHEN USING THIS DATA FOR VISUALS, HIT WOULD BE RETURNED INSTEAD OF PRINTED TO THE CONSOLE
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
  for(var i = 0; i < thisRhythm.length; i++){
    if(i>0){
      var deltaTime = ((60/bpm)/thisRhythm[i-1])*1000;
    }
    else{
      var deltaTime = ((60/bpm)/1)*1000;
    }
    runningAccepted += deltaTime;
    timeStampArray[i] = runningAccepted;

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
    }
  }
  for(var i = 0; i < pitchHit.length; i++){
    //keeps track of the pitches the user missed to give valuable feedback
      if(pitchHit[i] != "hit"){
      missedPitch += acceptedPitches[i] + " ";
    }
  }
  pitchBasedScore = pScore/hitPitches.length * 100;
  totalPitchScore += pitchBasedScore;
  print(pitchBasedScore);
  print("Missed Pitches: " + missedPitch);
}
//Overall scores throughout the level
function RunningScore(){
  runningRhythmScore = totalRhythmScore/playCount;
  runningPitchScore = totalPitchScore/playCount;
}
//clear the downbeat metronome, calculate individual scores, check for a perfect round
function PRScores(){
  clearInterval(setPassiveMetronome);
  RhythmScore();
  PitchScore();
  //Was this a perfect round?
  if(rhythmicScore == 100 && pitchBasedScore == 100){
    perfectArray[playCount] = "perfect";
  }

}
//In the level, how many perfect rounds were there
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
  //CUE DOWNBEAT METRO VISUALS HERE
  print("Metronome downbeat");
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

//If the player has played through 4 rounds and has rhythm and pitch scores above 55, they win
//if the score is not above 55 after 4 rounds, the player continues for 2 more rounds
//if the player fails to reach this score after 6 rounds in total, they fail the level
function NewSession(){
  RunningScore();
  print("Running Rhythm Score = " + runningRhythmScore);
  print("Running Pitch Score = " + runningPitchScore);
  if(playCount == 4 && runningRhythmScore >= 55 && runningPitchScore >= 55){
    print("Complete!")
    var perectRhythms = ScanPerfect();
    print("You Had " + perectRhythms + " perfect rounds!");
    print("RhythmScore = " + runningRhythmScore + "PitchScore = " + runningPitchScore );
  }
  else if(playCount == 6 && runningRhythmScore >= 55 && runningPitchScore >= 55){
    print("Complete!")
    var perectRhythms = ScanPerfect();
    print("You Had " + perectRhythms + " perfect rounds!");
  }
  else if(playCount >= 6 && (runningRhythmScore <= 55 || runningPitchScore != 55)){
    print("Level Failed! RhythmScore = " + runningRhythmScore + "PitchScore = " + runningPitchScore);

  }
  //reset variables for a new round
  else{
    /*
    pickDiv = Math.floor(Math.random()*((numSubdivisions) - 0)) + 1;
    thisDiv = 'subdivisions' + pickDiv;
    */
    thisRhythm = SelectRhythm();
    timeStampArray = new Array(thisRhythm.length);
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
*NOT CALLED YET, this is all the audio variables that will be reset when we call a restart on the level
*/

function Restart(){
  rhythmicScore = 0;
  playCount = 0;
  totalRhythmScore = 0;
  runningRhythmScore = 0;
  pitchBasedScore = 0;
  var countInTempo = (60/bpm)*1000;

  /*
  pickDiv = Math.floor(Math.random()*((numSubdivisions) - 0)) + 1;
  thisDiv = 'subdivisions' + pickDiv;
  */
  thisRhythm = SelectRhythm();
  print(thisDiv);
  //create our array of accepted timestamps as they correspond to this subdivision
  timeStampArray = new Array(thisRhythm.length);
  hitArrray = new Array(timeStampArray.length);
  hitPitches = new Array(timeStampArray.length);
  rMissedArray = new Array(timeStampArray.length);
  pitchHit = new Array(acceptedPitches.length);


  hiHatAnalog= loadSound('hihat-analog.wav');
  hihatDigital = loadSound('hihat-digital.wav');//used for metronome, not included in sample array
  kickAcoustic = loadSound('kick-acoustic01.wav');
  snare = loadSound('snare-808.wav');
  samples = [snare, kickAcoustic, hiHatAnalog];
  countInMetro = setInterval(function() { counting(); }, countInTempo);
  timerListenNote = 50;
  console.log(acceptedPitches.length);
}
