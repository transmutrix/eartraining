import {
  audioCtx, synthNoteOn, synthNoteOff, synthGameNoteOn, synthGameNoteOff,
  noteTable61, noteTable49, noteTable32, noteTable25,
  sharpsToFlats, renderOnscreenKeyboard
} from "./lib/synth.js";
import { setLabel, setError, setSelectedButton } from "./lib/util.js";
// import { gMidiAccess } from "./midi.js";

let gMidiAccess = null;

const gLogging = false;
const BaseScore = 10;
const MinScore = 1;

const GameState = Object.freeze({
  Init: Symbol("Init"),
  Playing: Symbol("Playing"),
});

const GameMode = Object.freeze({
  ShowAndPlay: Symbol("ShowAndPlay"),
  PlayOnly: Symbol("PlayOnly"),
  ShowOnly: Symbol("ShowOnly"),
});

let gMode = GameMode.ShowAndPlay;
let gNoteTable = noteTable49;
let gGameState = GameState.Init;
let gScore = 0;
let gPoints = 0;
let gMaxScore = 0;
let gPerfects = 0;
let gQueueNext = 0;
let gNoteIndex = 0;
let gNote = null;
let gNoteStarted = 0;
let gGuessed = null;
let gGameStartTime = 0;

let lastLoop = 0
let lastSecond = 0;
let lastSecondFrames = 0;

const gPlayingNotes = [];
const gEffectContainer = document.getElementById("fx");
const gEffects = [];

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
const noteTables = [noteTable25, noteTable32, noteTable49, noteTable61];

// Onscreen keyboard set-up

const onscreenKeyboard = document.getElementById("onscreen-keyboard");
initOnscreenKeyboard();

// MIDI set-up

const midiSupported = navigator.requestMIDIAccess;
if (midiSupported) {
  setLabel("message", "Finding MIDI devices...");
  await navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
} else {
  setError("This browser doesn't support WebMIDI!<br>Use the on-screen keyboard below.");
}

setLabel("message", "Click 'PLAY NOTE' or press Space ␣ to start.");

// Buttons set-up

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

rangeButtons.forEach((btn, i) => {
  btn.onclick = (el, ev) => {
    if (gNoteTable !== noteTables[i]) {
      gNoteTable = noteTables[i];
      chooseNote(true);
      playNote();
      initOnscreenKeyboard();
    }
    setSelectedButton(btn, rangeButtons);
  };
});

btnPlay.onclick = (el, ev) => {
  if (audioCtx.state === "paused")  audioCtx.resume();
  if (!gGameStartTime)              gGameStartTime = Date.now();
  if (!gNote)                       chooseNote();
  if (!gNoteStarted)                playNote();
};

document.body.onkeydown = function(e){
  if (e.keyCode === 32) { // Space bar
    btnPlay.click();
    e.preventDefault();
  }
}

// Start the game loop!

window.requestAnimationFrame(loop);

// Function definitions.

function loop(timestamp) {
  const dt = timestamp - lastLoop;
  const date = Date.now();
  const now = performance.now();

  switch (gGameState) {
    case GameState.Init: {
      if (gQueueNext && date > gQueueNext) {
        gQueueNext = 0;
        btnPlay.click();
      }
    } break;
    case GameState.Playing: {
      if (gNoteStarted && now - gNoteStarted >= 1000.0) {
        gNoteStarted = 0;
        synthGameNoteOff(gNote.index);
        note1Speaker.style.opacity = "0%";
        // btnPlay.classList.remove("progress");
      }
    } break;
  }

  for (let i = gPlayingNotes.length-1; i >= 0; --i) {
    if (date >= gPlayingNotes[i].time + 2000) {
      synthGameNoteOff(gPlayingNotes[i].index);
      note1Speaker.style.opacity = "0%";
      gPlayingNotes.splice(i);
    }
  }

  // game clock
  if (gGameStartTime !== 0) {
    const since = date - gGameStartTime;
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
  for (let i = gEffects.length-1; i >= 0; --i) {
    if (date - gEffects[i].time >= gEffects[i].lifetime * 1000.0) {
      gEffects[i].el.remove();
      gEffects.splice(i);
    }
  }

  // frame counter
  lastSecondFrames += 1;
  const seconds = Math.floor(timestamp/1000);
  if (seconds !== lastSecond) {
    lastSecond = seconds;
    setLabel("fps-display", `FPS: ${lastSecondFrames}`);
    lastSecondFrames = 0;
  }
  lastLoop = timestamp;
  window.requestAnimationFrame(loop);
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
      setError("No MIDI input devices detected!<br>Connect one and refresh, or use the on-screen keyboard below.");
    }
}

function onMIDIFailure() {
  setError("Could not access MIDI devices!<br>Use the on-screen keyboard below.");
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

function onNoteOn(note, velocity) {
  // setLabel("message", "Note on: " + note);
  // queueNoteOn(note, velocity);
  synthNoteOn(note, velocity);
  note2Speaker.style.opacity = "100%";
  switch (gGameState) {
    case GameState.Playing:
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
          setLabel("possible-points", "Possible points: -");
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

function chooseNote(skipScore = false) {
  if (gNote)  {
    synthGameNoteOff(gNote.index);
    note1Speaker.style.opacity = "0%";
  }

  gNoteIndex = Math.floor(Math.random() * gNoteTable.length);
  gNote = gNoteTable[gNoteIndex];
  // if (gLogging)  console.log(gNoteIndex, gNote);

  if (!skipScore)  gMaxScore += BaseScore;

  gPoints = BaseScore;
  gGameState = GameState.Playing;

  showNotes();

  setLabel("message", "Replicate the note!<br>Click the button or press Space ␣ to play it again.");
  setLabel("possible-points", `Possible points: ${gPoints.toFixed(0)}`);
}

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

function createFX(message) {
  const el = document.createElement("div");
  el.innerText = message;
  el.classList.add("perfect");
  gEffectContainer.appendChild(el);
  gEffects.push({ time: Date.now(), lifetime: 2, el: el });
}

function initOnscreenKeyboard() {
  onscreenKeyboard.innerHTML = renderOnscreenKeyboard(gNoteTable);
  const synth = onscreenKeyboard.querySelector("div").children[0];
  const keys = synth.children;
  for (const key of keys) {
    if (!key.classList.contains("kbBtn"))  continue;
    key.addEventListener('mousedown', (ev) => {
      onNoteOn(parseInt(ev.target.dataset.index), 127*0.5);
      // const chromePointerEvents = typeof PointerEvent === 'function';
      // if (chromePointerEvents && ev.pointerId === undefined) {
      //   return;
      // }
      // ev.target.releasePointerCapture(ev.pointerID);
    })
    // FIXME: I can't make this work quite right, so meh.
    // key.addEventListener('mouseenter', (ev) => {
    //   // console.log(ev);
    //   if (ev.buttons) {
    //     onNoteOn(parseInt(ev.target.dataset.index), 127*0.5);
    //     // FIXME: This doesn't work, and not sure how to make it work...
    //     ev.target.focus();
    //     ev.target.click();
    //   }
    // })
    key.addEventListener('mouseleave', (ev) => onNoteOff(parseInt(ev.target.dataset.index)))
    key.addEventListener('mouseup', (ev) => onNoteOff(parseInt(ev.target.dataset.index)))
    // key.addEventListener('pointercancel', (ev) => onNoteOff(parseInt(ev.target.dataset.index)))
    // key.addEventListener('mouseout', (ev) => onNoteOff(parseInt(ev.target.dataset.index)))
  }
}