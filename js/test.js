import { audioCtx, synthNoteOn, synthNoteOff, noteTable } from "./synth.js";

const BaseScore = 10;
const MinScore = 1;

const GameState = Object.freeze({
  Init: Symbol("Init"),
  PlayNote: Symbol("PlayNote"),
  Guessed: Symbol("Guessed"),
});

let gMidiAccess = null;
let gGameState = GameState.Init;
let gScore = 0;
let gPoints = 0;
let gMaxScore = 0;
let gPerfects = 0;
// let gGuesses = 0;
// let gUsedHint = false;
// let gCommands = [];

let gLowestNoteIndex = 27; // 0
let gHighestNoteIndex = 75; // noteTable.length - 1;

let gQueueNext = 0;

// const queueNoteOn = (note, velocity) => gCommands.push({kind: 'note-on', note: note, velocity: velocity});
// const queueNoteOff = (note) => gCommands.push({kind: 'note-off', note: note, velocity: 0});

function setLabel(id, text) {
  const el = document.getElementById(id);
  if (el)  el.innerHTML = text;
}

function setError(text) {
  setLabel("error", text);
  throw new Error(text);
}

const gEffectContainer = document.getElementById("fx");
const gEffects = [];

function createFXPerfect() {
  const el = document.createElement("div");
  el.innerText = "✨ PERFECT! ✨";
  el.classList.add("perfect");
  gEffectContainer.appendChild(el);
  gEffects.push({ time: Date.now(), lifetime: 2, el: el });
}

function createFXNice() {
  const el = document.createElement("div");
  el.innerText = "Nice! 👍";
  el.classList.add("perfect");
  gEffectContainer.appendChild(el);
  gEffects.push({ time: Date.now(), lifetime: 2, el: el });
}

function createFXOk() {
  const el = document.createElement("div");
  el.innerText = "Ok! 😅";
  el.classList.add("perfect");
  gEffectContainer.appendChild(el);
  gEffects.push({ time: Date.now(), lifetime: 2, el: el });
}

function createFXBogey() {
  const el = document.createElement("div");
  el.innerText = "😬😬😬";
  el.classList.add("perfect");
  gEffectContainer.appendChild(el);
  gEffects.push({ time: Date.now(), lifetime: 2, el: el });
}

setLabel("game-name", "Note Match");

const midiSupported = navigator.requestMIDIAccess;
if (!midiSupported)  setError("This browser doesn't support WebMIDI!");

function onNoteOn(note, velocity) {
  // setLabel("message", "Note on: " + note);
  // queueNoteOn(note, velocity);
  synthNoteOn(note, velocity);
  switch (gGameState) {
    case GameState.PlayNote:
    case GameState.Guessed:
    {
      gGuessed = null;
      for (const check of noteTable) {
        if (check.index === note) {
          gGuessed = check;
          break;
        }
      }
      if (gGuessed) {
        note2Display.textContent = `${gGuessed.name}${gGuessed.octave}`;
        // TODO: Check correctness!
        if (gNote === gGuessed) {
          gScore += gPoints;
          if (gPoints === BaseScore) {
            gPerfects += 1;
            createFXPerfect();
          } else if (gPoints >= Math.floor(BaseScore * 0.75)) {
            createFXNice();
          } else if (gPoints >= Math.floor(BaseScore * 0.45)) {
            createFXOk();
          } else {
            createFXBogey();
          }
          gNote = null;
          gGameState = GameState.Init;
          gQueueNext = Date.now() + 2000;
        } else {
          if (gNote.name === gGuessed.name) {
            gPoints = Math.max(MinScore, gPoints - 1);
          } else {
            gPoints = Math.max(MinScore, gPoints - 2);
          }
        }
      }
    } break;
  }
}

function onNoteOff(note) {
  // setLabel("message", "Note off: " + note);
  // queueNoteOff(note);
  synthNoteOff(note);
}

function getMIDIMessage(midiMessage) {
  console.log(midiMessage);

  // Note: reference - https://www.midi.org/specifications-old/item/table-2-expanded-messages-list-status-bytes

  // data is an array of 3 ints: command, note, velocity.
  // [0]
  //   144 = note on
  //   128 = note off
  // [1]
  //   60 = middle C
  //   0-127 for values.
  // [2] velocity ranges 0-127. the softest for "note on" is 1.
  //   a velocity of zero for "note on" often means "note off".
  let command = midiMessage.data[0];
  let note = midiMessage.data[1];
  let velocity = midiMessage.data[2];

  if (command === 0b10000000) { // = 80= 128	Chan 1 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10000001) { // = 81= 129	Chan 2 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10000010) { // = 82= 130	Chan 3 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10000011) { // = 83= 131	Chan 4 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10000100) { // = 84= 132	Chan 5 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10000101) { // = 85= 133	Chan 6 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10000110) { // = 86= 134	Chan 7 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10000111) { // = 87= 135	Chan 8 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10001000) { // = 88= 136	Chan 9 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10001001) { // = 89= 137	Chan 10 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10001010) { // = 8A= 138	Chan 11 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10001011) { // = 8B= 139	Chan 12 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10001100) { // = 8C= 140	Chan 13 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10001101) { // = 8D= 141	Chan 14 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10001110) { // = 8E= 142	Chan 15 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }
  if (command === 0b10001111) { // = 8F= 143	Chan 16 Note off	Note Number (0-127)	Note Velocity (0-127)
    onNoteOff(note);
  }

  if (command === 0b10010000) { // = 90= 144	Chan 1 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10010001) { // = 91= 145	Chan 2 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10010010) { // = 92= 146	Chan 3 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10010011) { // = 93= 147	Chan 4 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10010100) { // = 94= 148	Chan 5 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10010101) { // = 95= 149	Chan 6 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10010110) { // = 96= 150	Chan 7 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10010111) { // = 97= 151	Chan 8 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10011000) { // = 98= 152	Chan 9 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10011001) { // = 99= 153	Chan 10 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10011010) { // = 9A= 154	Chan 11 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10011011) { // = 9B= 155	Chan 12 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10011100) { // = 9C= 156	Chan 13 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10011101) { // = 9D= 157	Chan 14 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10011110) { // = 9E= 158	Chan 15 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
  if (command === 0b10011111) { // = 9F= 159	Chan 16 Note on	Note Number (0-127)	Note Velocity (0-127)
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
}

function onMIDISuccess(midiAccess) {
    console.log(midiAccess);
    // midiInputs = midiAccess.inputs;
    // cpmst outputs = midiAccess.outputs;
    gMidiAccess = midiAccess;
    // debugger;
    setLabel("message", "Done.");

    for(const input of midiAccess.inputs.values()) {
      input.onmidimessage = getMIDIMessage;
      // console.log(input);
    }

    // for (const output of midiAccess.outputs.values()) {
    //   console.log("output:", output);
    // }
}

function onMIDIFailure() {
  setError("Could not access MIDI devices!");
}

setLabel("message", "Finding MIDI devices...");
await navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

let gNoteIndex = 0;
let gNote = null;
let gNoteStarted = 0;
let gGuessed = null;
let gGameStartTime = 0;

setLabel("message", "Click to play.");
// document.body.addEventListener('click', (element, event) => {
//   if (audioCtx.state === 'paused') {
//     audioCtx.resume();
//   }
//   setLabel("message", "Replicate the pitch! (Click to replay)");
// }, true);

const btnPlay = document.getElementById("btn-play");
const note1Display = document.getElementById("note1");
const note2Display = document.getElementById("note2");
const gameClock = document.getElementById("game-clock");
const gameScore = document.getElementById("game-score");
const gamePerfects = document.getElementById("game-perfects");

function chooseNote() {
  const range = gHighestNoteIndex - gLowestNoteIndex;
  gNoteIndex = gLowestNoteIndex + Math.floor(Math.random() * range);
  gNote = noteTable[gNoteIndex];
  // console.log(gNoteIndex, gNote);

  gGameState = GameState.PlayNote;
  gMaxScore += BaseScore;
  gPoints = BaseScore;
  // gGuesses = 0;

  note1Display.textContent = `${gNote.name}${gNote.octave}`;
  note2Display.textContent = "?";
  setLabel("message", "Replicate the note!<br>Click the button or press Space ␣ to play it again.");
}

function playNote() {
  gNoteStarted = performance.now();
  synthNoteOn(gNote.index, 127*0.75);
  // btnPlay.classList.add("progress");
}

btnPlay.onclick = (el, ev) => {
  if (audioCtx.state === "paused")  audioCtx.resume();
  if (!gGameStartTime)              gGameStartTime = Date.now();
  if (!gNote)                       chooseNote();
  if (!gNoteStarted)                playNote();
};

document.body.onkeydown = function(e){
  if (e.keyCode == 32) { // Space bar
    btnPlay.click();
    e.preventDefault();
  }
}

function updateGame(dt) {
  const now = performance.now();
  switch (gGameState) {
    case GameState.Init: {
      if (gQueueNext && Date.now() > gQueueNext) {
        gQueueNext = 0;
        btnPlay.click();
      }
      // Choose a note.
      // gNoteIndex = Math.floor(Math.random() * noteTable.length);
      // gNote = noteTable[gNoteIndex];
      // gNoteStarted = now;
      // synthNoteOn(gNote.index, 127);
      // gGameState = GameState.PlayNote;
    } break;
    case GameState.PlayNote: {
      if (gNoteStarted && now - gNoteStarted >= 1000.0) {
        gNoteStarted = 0;
        synthNoteOff(gNote.index);
        // btnPlay.classList.remove("progress");
      }
    } break;
    case GameState.Guessed: {
    } break;
  }
  // gCommands.length = 0;
}

let lastLoop = 0
let lastSecond = 0;
let lastSecondFrames = 0;
function loop(timestamp) {
  const dt = timestamp - lastLoop;
  updateGame(dt);

  lastSecondFrames += 1;
  const seconds = Math.floor(timestamp/1000);
  if (seconds !== lastSecond) {
    lastSecond = seconds;
    setLabel("fps-display", `FPS: ${lastSecondFrames}`);
    lastSecondFrames = 0;
  }

  // game clock
  if (gGameStartTime !== 0) {
    const since = Date.now() - gGameStartTime;
    // let ms = Math.floor(since % 1000).toString();
    let seconds = Math.floor((since/1000) % 60).toString();
    let minutes = Math.floor((since/1000/60) % 60).toString();
    let hours = Math.floor(since/1000/60/60).toString();
    // while (ms.length < 3)  ms = '0' + ms;
    while (seconds.length < 2) seconds = '0' + seconds;
    while (minutes.length < 2) minutes = '0' + minutes;
    while (hours.length < 2) hours = '0' + hours;
    if (hours !== "00") {
      gameClock.textContent = `${hours}:${minutes}:${seconds}`;
    } else {
      gameClock.textContent = `${minutes}:${seconds}`;
    }
  }

  // game score
  if (gMaxScore !== 0) {
    gameScore.textContent = `${gScore}/${gMaxScore} (${(gScore/gMaxScore * 100).toFixed(0)}%)`;
  }
  if (gPerfects !== 0) {
    gamePerfects.textContent = `⭐️ ${gPerfects.toFixed(0)}`;
  }

  // effects
  const now = Date.now();
  for (let i = gEffects.length-1; i >= 0; --i) {
    if (now - gEffects[i].time >= gEffects[i].lifetime * 1000.0) {
      gEffects[i].el.remove();
      gEffects.splice(i);
    }
  }

  lastLoop = timestamp;
  window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);


