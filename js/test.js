import { synthNoteOn, synthNoteOff } from "./synth.js";

const GameState = Object.freeze({
  Init: Symbol("Init"),
  PlayNote: Symbol("PlayNote"),
  Guessed: Symbol("Guessed"),
});


let gMidiAccess = null;
let gGameState = GameState.Init;
let gCommands = [];

const queueNoteOn = (note, velocity) => gCommands.push({kind: 'note-on', note: note, velocity: velocity});
const queueNoteOff = (note) => gCommands.push({kind: 'note-off', note: note, velocity: 0});

function setLabel(id, text) {
  const el = document.getElementById(id);
  if (el)  el.textContent = text;
}

function setError(text) {
  setLabel("error", text);
  throw new Error(text);
}

setLabel("game-name", "Note Match");

const midiSupported = navigator.requestMIDIAccess;
if (!midiSupported)  setError("This browser doesn't support WebMIDI!");

function onNoteOn(note, velocity) {
  setLabel("message", "Note on: " + note);
  queueNoteOn(note, velocity);
  synthNoteOn(note, velocity);
}

function onNoteOff(note) {
  setLabel("message", "Note off: " + note);
  queueNoteOff(note);
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

function updateGame(dt) {
  // TODO
  switch (gGameState) {
    case GameState.Init: {
      // TODO: Choose a note.
    } break;
    case GameState.PlayNote: {
      // TODO: Go to guess mode.
    } break;
    case GameState.Guessed: {
      // TODO: Compare, set values.
    } break;
  }
  gCommands.length = 0;
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

  lastLoop = timestamp;
  window.requestAnimationFrame(loop);
}
window.requestAnimationFrame(loop);


