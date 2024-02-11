import {
  audioCtx, synthNoteOn, synthNoteOff, synthGameNoteOn, synthGameNoteOff,
  noteTable61, noteTable49, noteTable32, noteTable25,
  sharpsToFlats
} from "./synth.js";

import {
  setLabel,
  setError,
  setSelectedButton,
} from "./util.js";

const gLogging = false;
const BaseScore = 10;
const MinScore = 1;

const GameState = Object.freeze({
  Init: Symbol("Init"),
  PlayNote: Symbol("PlayNote"),
  Guessed: Symbol("Guessed"),
});

const GameMode = Object.freeze({
  ShowAndPlay: Symbol("ShowAndPlay"),
  PlayOnly: Symbol("PlayOnly"),
  ShowOnly: Symbol("ShowOnly"),
});

let gMidiAccess = null;
let gMode = GameMode.ShowAndPlay;
let gRange = 49;
let gNoteTable = noteTable49;
let gGameState = GameState.Init;
let gScore = 0;
let gPoints = 0;
let gMaxScore = 0;
let gPerfects = 0;
let gQueueNext = 0;

const gEffectContainer = document.getElementById("fx");
const gEffects = [];

function createFX(message) {
  const el = document.createElement("div");
  el.innerText = message;
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
  note2Speaker.style.opacity = "100%";
  switch (gGameState) {
    case GameState.PlayNote:
    case GameState.Guessed:
    {
      gGuessed = null;
      for (const check of gNoteTable) {
        if (check.index === note) {
          gGuessed = check;
          break;
        }
      }
      if (gGuessed) {
        note2Display.textContent = `${gGuessed.name}${gGuessed.octave}`;
        if (gNote === gGuessed) {
          gScore += gPoints;
          if (gPoints === BaseScore) {
            gPerfects += 1;
            createFX("✨ PERFECT! ✨");
          } else if (gPoints >= Math.floor(BaseScore * 0.75)) {
            createFX("Nice! 👍");
          } else if (gPoints >= Math.floor(BaseScore * 0.45)) {
            createFX("Ok! 😅");
          } else {
            createFX("😬😬😬");
          }
          gNote = null;
          gGameState = GameState.Init;
          gQueueNext = Date.now() + 2000;
          setLabel("possible-points", "");
        } else {
          if (gNote.name === gGuessed.name) {
            gPoints = Math.max(MinScore, gPoints - 1);
          } else {
            gPoints = Math.max(MinScore, gPoints - 2);
          }
          setLabel("possible-points", `Possible points: ${gPoints.toFixed(0)}`);
        }
      }
    } break;
  }
}

function onNoteOff(note) {
  // setLabel("message", "Note off: " + note);
  // queueNoteOff(note);
  synthNoteOff(note);
  note2Speaker.style.opacity = "0%";
}

function getMIDIMessage(midiMessage) {
  if (gLogging)  console.log(midiMessage);

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

  if (
    command === 0b10000000 || // = 80= 128	Chan 1 Note off	Note Number (0-127)	Note Velocity
    command === 0b10000001 || // = 81= 129	Chan 2 Note off	Note Number (0-127)	Note Velocity
    command === 0b10000010 || // = 82= 130	Chan 3 Note off	Note Number (0-127)	Note Velocity
    command === 0b10000011 || // = 83= 131	Chan 4 Note off	Note Number (0-127)	Note Velocity
    command === 0b10000100 || // = 84= 132	Chan 5 Note off	Note Number (0-127)	Note Velocity
    command === 0b10000101 || // = 85= 133	Chan 6 Note off	Note Number (0-127)	Note Velocity
    command === 0b10000110 || // = 86= 134	Chan 7 Note off	Note Number (0-127)	Note Velocity
    command === 0b10000111 || // = 87= 135	Chan 8 Note off	Note Number (0-127)	Note Velocity
    command === 0b10001000 || // = 88= 136	Chan 9 Note off	Note Number (0-127)	Note Velocity
    command === 0b10001001 || // = 89= 137	Chan 10 Note off	Note Number (0-127)	Note Velocity
    command === 0b10001010 || // = 8A= 138	Chan 11 Note off	Note Number (0-127)	Note Velocity
    command === 0b10001011 || // = 8B= 139	Chan 12 Note off	Note Number (0-127)	Note Velocity
    command === 0b10001100 || // = 8C= 140	Chan 13 Note off	Note Number (0-127)	Note Velocity
    command === 0b10001101 || // = 8D= 141	Chan 14 Note off	Note Number (0-127)	Note Velocity
    command === 0b10001110 || // = 8E= 142	Chan 15 Note off	Note Number (0-127)	Note Velocity
    command === 0b10001111    // = 8F= 143	Chan 16 Note off	Note Number (0-127)	Note Velocity
  ) {
    onNoteOff(note);
  }

  if (
    command === 0b10010000 || // = 90= 144	Chan 1 Note on	Note Number (0-127)	Note Velocity
    command === 0b10010001 || // = 91= 145	Chan 2 Note on	Note Number (0-127)	Note Velocity
    command === 0b10010010 || // = 92= 146	Chan 3 Note on	Note Number (0-127)	Note Velocity
    command === 0b10010011 || // = 93= 147	Chan 4 Note on	Note Number (0-127)	Note Velocity
    command === 0b10010100 || // = 94= 148	Chan 5 Note on	Note Number (0-127)	Note Velocity
    command === 0b10010101 || // = 95= 149	Chan 6 Note on	Note Number (0-127)	Note Velocity
    command === 0b10010110 || // = 96= 150	Chan 7 Note on	Note Number (0-127)	Note Velocity
    command === 0b10010111 || // = 97= 151	Chan 8 Note on	Note Number (0-127)	Note Velocity
    command === 0b10011000 || // = 98= 152	Chan 9 Note on	Note Number (0-127)	Note Velocity
    command === 0b10011001 || // = 99= 153	Chan 10 Note on	Note Number (0-127)	Note Velocity
    command === 0b10011010 || // = 9A= 154	Chan 11 Note on	Note Number (0-127)	Note Velocity
    command === 0b10011011 || // = 9B= 155	Chan 12 Note on	Note Number (0-127)	Note Velocity
    command === 0b10011100 || // = 9C= 156	Chan 13 Note on	Note Number (0-127)	Note Velocity
    command === 0b10011101 || // = 9D= 157	Chan 14 Note on	Note Number (0-127)	Note Velocity
    command === 0b10011110 || // = 9E= 158	Chan 15 Note on	Note Number (0-127)	Note Velocity
    command === 0b10011111    // = 9F= 159	Chan 16 Note on	Note Number (0-127)	Note Velocity
  ) {
    velocity > 0?  onNoteOn(note, velocity)  :  onNoteOff(note);
  }
}

function onMIDISuccess(midiAccess) {
  if (gLogging)  console.log(midiAccess);
    // midiInputs = midiAccess.inputs;
    // cpmst outputs = midiAccess.outputs;
    gMidiAccess = midiAccess;
    setLabel("message", "Done.");

    for(const input of midiAccess.inputs.values()) {
      input.onmidimessage = getMIDIMessage;
    }

    // for (const output of midiAccess.outputs.values()) {
    //   if (gLogging)  console.log("output:", output);
    // }

    if (midiAccess.inputs.size === 0) {
      setError("No MIDI input devices detected!<br>Please connect a MIDI device and refresh the page.");
    }
}

function onMIDIFailure() {
  setError("Could not access MIDI devices!");
}

setLabel("message", "Finding MIDI devices...");
await navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);

setLabel("message", "Click 'PLAY NOTE' or press Space ␣ to start.");

let gNoteIndex = 0;
let gNote = null;
let gNoteStarted = 0;
let gGuessed = null;
let gGameStartTime = 0;

const btnPlay = document.getElementById("btn-play");
const note1Display = document.getElementById("note1");
const note2Display = document.getElementById("note2");
const note1Speaker = document.getElementById("note1-speaker");
const note2Speaker = document.getElementById("note2-speaker");
const gameClock = document.getElementById("game-clock");
const gameScore = document.getElementById("game-score");
const gamePerfects = document.getElementById("game-perfects");

const btnModeShowAndPlay = document.getElementById("btn-mode1");
const btnModePlayOnly = document.getElementById("btn-mode2");
const btnModeShowOnly = document.getElementById("btn-mode3");
const modeButtons = [btnModeShowAndPlay, btnModePlayOnly, btnModeShowOnly];

const btnRange25 = document.getElementById("btn-25");
const btnRange32 = document.getElementById("btn-32");
const btnRange49 = document.getElementById("btn-49");
const btnRange61 = document.getElementById("btn-61");
const rangeButtons = [btnRange25, btnRange32, btnRange49, btnRange61];

btnModeShowAndPlay.onclick = (el, ev) => {
  if (gMode !== GameMode.ShowAndPlay) {
    const oldMode = gMode;
    gMode = GameMode.ShowAndPlay;
    showNotes();
    if (oldMode === GameMode.ShowOnly) {
      playNote();
    }
  }
  setSelectedButton(btnModeShowAndPlay, modeButtons);
};

btnModePlayOnly.onclick = (el, ev) => {
  if (gMode !== GameMode.PlayOnly) {
    const oldMode = gMode;
    gMode = GameMode.PlayOnly;
    showNotes();
    if (oldMode === GameMode.ShowOnly) {
      playNote();
    }
  }
  setSelectedButton(btnModePlayOnly, modeButtons);
};

btnModeShowOnly.onclick = (el, ev) => {
  if (gMode !== GameMode.ShowOnly) {
    gMode = GameMode.ShowOnly;
    showNotes();
  }
  setSelectedButton(btnModeShowOnly, modeButtons);
};

btnRange25.onclick = (el, ev) => {
  if (gRange !== 25) {
    gRange = 25;
    gNoteTable = noteTable25;
    chooseNote();
    playNote();
  }
  setSelectedButton(btnRange25, rangeButtons);
};

btnRange32.onclick = (el, ev) => {
  if (gRange !== 32) {
    gRange = 32;
    gNoteTable = noteTable32;
    chooseNote();
    playNote();
  }
  setSelectedButton(btnRange32, rangeButtons);
};

btnRange49.onclick = (el, ev) => {
  if (gRange !== 49) {
    gRange = 49;
    gNoteTable = noteTable49;
    chooseNote();
    playNote();
  }
  setSelectedButton(btnRange49, rangeButtons);
};

btnRange61.onclick = (el, ev) => {
  if (gRange !== 61) {
    gRange = 61;
    gNoteTable = noteTable61;
    chooseNote();
    playNote();
  }
  setSelectedButton(btnRange61, rangeButtons);
};

function showNotes() {
  if (!gNote) {
    return;
  }
  if (gMode === GameMode.ShowAndPlay || gMode === GameMode.ShowOnly) {
    let name = gNote.name;
    if (name.includes("♯") && Math.random() >= 0.5) {
      name = sharpsToFlats[name];
    }
    note1Display.textContent = `${name}${gNote.octave}`;
    note2Display.textContent = "?";
  } else {
    note1Display.textContent = "🤷‍♀️";
    note2Display.textContent = "?";
  }
}

function chooseNote() {
  if (gNote)  {
    synthGameNoteOff(gNote.index);
    note1Speaker.style.opacity = "0%";
  }

  gNoteIndex = Math.floor(Math.random() * gNoteTable.length);
  gNote = gNoteTable[gNoteIndex];
  // if (gLogging)  console.log(gNoteIndex, gNote);

  gGameState = GameState.PlayNote;
  gMaxScore += BaseScore;
  gPoints = BaseScore;

  showNotes();

  setLabel("message", "Replicate the note!<br>Click the button or press Space ␣ to play it again.");
  setLabel("possible-points", `Possible points: ${gPoints.toFixed(0)}`);
}

let gPlayingNotes = [];

function playNote() {
  if (!gNote || gMode === GameMode.ShowOnly) {
    return;
  }
  gNoteStarted = performance.now();
  synthGameNoteOn(gNote.index, 127*0.75);
  gPlayingNotes.push({ index: gNote.index, time: Date.now() });
  note1Speaker.style.opacity = "100%";
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
    } break;
    case GameState.PlayNote: {
      if (gNoteStarted && now - gNoteStarted >= 1000.0) {
        gNoteStarted = 0;
        synthGameNoteOff(gNote.index);
        note1Speaker.style.opacity = "0%";
        // btnPlay.classList.remove("progress");
      }
    } break;
    case GameState.Guessed: {
    } break;
  }

  const date = Date.now();
  for (let i = gPlayingNotes.length-1; i >= 0; --i) {
    if (date >= gPlayingNotes[i].time + 2000) {
      synthGameNoteOff(gPlayingNotes[i].index);
      note1Speaker.style.opacity = "0%";
      gPlayingNotes.splice(i);
    }
  }
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
