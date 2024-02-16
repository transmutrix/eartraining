import {
  audioCtx, synthNoteOn, synthNoteOff, synthGameNoteOn, synthGameNoteOff,
  noteTable61, noteTable49, noteTable32, noteTable25,
  sharpsToFlats, renderOnscreenKeyboard
} from "./lib/synth.js";
import { setLabel, setError, setSelectedButton } from "./lib/util.js";

const gLogging = true;

const BaseScore = 10;
const MinScore = 1;

const GameState = Object.freeze({
  Init: Symbol("Init"),
  Playing: Symbol("Playing"),
});

let gGameState = GameState.Init;
let gNoteTable = noteTable25.slice(0, 12);
let gScore = 0;
let gPoints = 0;
let gMaxScore = 0;
let gPerfects = 0;
let gQueueNext = 0;
let gNoteIndex = 0;
let gNote = null;
let gNoteStarted = 0;
let gGameStartTime = 0;

let lastLoop = 0
let lastSecond = 0;
let lastSecondFrames = 0;

const gPlayingNotes = [];
const gGuessNotes = [];
const gEffectContainer = document.getElementById("fx");
const gEffects = [];

const gameClock = document.getElementById("game-clock");
const gameScore = document.getElementById("game-score");
const gamePerfects = document.getElementById("game-perfects");

const btnPlay = document.getElementById("btn-play");

setLabel("message", "Click the speaker or press Space ␣ to start.");

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

// Note buttons.

const guessNotes = {
  "C": gNoteTable.find(x => x.name == "C"),
  "C♯": gNoteTable.find(x => x.name == "C♯"),
  "D": gNoteTable.find(x => x.name == "D"),
  "D♯": gNoteTable.find(x => x.name == "D♯"),
  "E": gNoteTable.find(x => x.name == "E"),
  "F": gNoteTable.find(x => x.name == "F"),
  "F♯": gNoteTable.find(x => x.name == "F♯"),
  "G": gNoteTable.find(x => x.name == "G"),
  "G♯": gNoteTable.find(x => x.name == "G♯"),
  "A": gNoteTable.find(x => x.name == "A"),
  "A♯": gNoteTable.find(x => x.name == "A♯"),
  "B": gNoteTable.find(x => x.name == "B"),
}

function checkGuess(guessed) {
  if (gNote) {
    synthGameNoteOn(guessNotes[guessed].index, 127*0.75);
    gGuessNotes.push({ index: guessNotes[guessed].index, time: Date.now() });
    if (gNote.name === guessed) {
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
      gPoints = Math.max(MinScore, gPoints - 2);
      setLabel("possible-points", `Possible points: ${gPoints.toFixed(0)}`);
    }
  }
}

document.getElementById("btn-C").onclick = (el, ev) => checkGuess("C");
document.getElementById("btn-C♯").onclick = (el, ev) => checkGuess("C♯");
document.getElementById("btn-D").onclick = (el, ev) => checkGuess("D");
document.getElementById("btn-D♯").onclick = (el, ev) => checkGuess("D♯");
document.getElementById("btn-E").onclick = (el, ev) => checkGuess("E");
document.getElementById("btn-F").onclick = (el, ev) => checkGuess("F");
document.getElementById("btn-F♯").onclick = (el, ev) => checkGuess("F♯");
document.getElementById("btn-G").onclick = (el, ev) => checkGuess("G");
document.getElementById("btn-G♯").onclick = (el, ev) => checkGuess("G♯");
document.getElementById("btn-A").onclick = (el, ev) => checkGuess("A");
document.getElementById("btn-A♯").onclick = (el, ev) => checkGuess("A♯");
document.getElementById("btn-B").onclick = (el, ev) => checkGuess("B");

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
        btnPlay.innerText = "🔈";
        // note1Speaker.style.opacity = "0%";
      }
    } break;
  }

  for (let i = gPlayingNotes.length-1; i >= 0; --i) {
    if (date >= gPlayingNotes[i].time + 2000) {
      synthGameNoteOff(gPlayingNotes[i].index);
      // note1Speaker.style.opacity = "0%";
      // btnPlay.innerText = "🔈";
      gPlayingNotes.splice(i,1);
    }
  }

  for (let i = gGuessNotes.length-1; i >= 0; --i) {
    if (date >= gGuessNotes[i].time + 500) {
      synthGameNoteOff(gGuessNotes[i].index);
      gGuessNotes.splice(i,1);
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
      gEffects.splice(i,1);
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

  // showNotes();
  btnPlay.innerText = "🔊";

  setLabel("message", "Name the note!<br>Click the speaker or press Space ␣ to play it again.");
  setLabel("possible-points", `Possible points: ${gPoints.toFixed(0)}`);
}

function playNote() {
  if (!gNote) {
    return;
  }
  gNoteStarted = performance.now();
  synthGameNoteOn(gNote.index, 127*0.75);
  gPlayingNotes.push({ index: gNote.index, time: Date.now() });
  btnPlay.innerText = "🔊";
  // note1Speaker.style.opacity = "100%";
  // btnPlay.classList.add("progress");
}

function createFX(message) {
  const el = document.createElement("div");
  el.innerText = message;
  el.classList.add("perfect");
  gEffectContainer.appendChild(el);
  gEffects.push({ time: Date.now(), lifetime: 2, el: el });
}
