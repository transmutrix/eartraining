
const audioCtx = new(window.AudioContext || window.webkitAudioContext);
const gainNode = audioCtx.createGain();
const notemap = new Map();
gainNode.connect(audioCtx.destination);
gainNode.gain.value = 0.22;

function createOscillator(freq, gain) {
  const oscNode = audioCtx.createOscillator();
  oscNode.type = 'square';
  oscNode.frequency.value = freq;
  const oscGain = audioCtx.createGain();
  oscGain.gain.value = gain;
  oscNode.connect(oscGain);
  oscGain.connect(gainNode);
  return oscNode;
}

const getHz = (N = 0) => 440 * Math.pow(2, N / 12);

const notes = ['A','A#','B','C','C#','D','D#','E','F','F#','G','G#'];
const sharpsToFlats = Object.freeze({
  'A#': 'B♭',
  'C#': 'D♭',
  'D#': 'E♭',
  'F#': 'G♭',
  'G#': 'A♭',
});
const flatsToSharps = Object.freeze({
  'B♭': 'A#',
  'D♭': 'C#',
  'E♭': 'D#',
  'G♭': 'F#',
  'A♭': 'G#',
});

// The start and end parameters are integers defining the number of notes to the left (start) and right (end) of A440. On a grand piano, which has 88 keys, this is the same as freqs(-48, 40)
export const noteTable = ((start, end) => {
  let black = 0;
  let white = -2;
  return Array(end - start)
    .fill()
    .map((_, i) => {
      const key = (start + i) % 12;
      const note = notes[key < 0 ? 12 + key : key];
      const octave = Math.ceil(4 + (start + i) / 12);
      if (i === 0 && note === "C")  black = -3;
      note.includes("#")
        ? ((black += 3), ["C#", "F#"].includes(note)
        && (black += 3))
        : (white += 3);

      return {
        name: note,
        index: note+60-3,
        freq: getHz(start + i),
        octave: (note === "B" || note === "A#")  ? octave - 1  :  octave,
        offset: note.includes("#") ? black : white,
      };
    });
})(-48,40);

export function synthNoteOn(note, velocity = 127) {
  // A4 (440) is our base, and zero in our getHz.
  // Middle C is 60 in Midi.
  // Middle C is one step below A4
  notemap.set(note, createOscillator(getHz(note-60+3), velocity/127));
  notemap.get(note).start(0)
  // if (!key.classList.contains('keydown')) {
  //   gainNode.gain.value = 0.33
  //   notemap.set(key.name, createOscillator(key.dataset.freq))
  //   notemap.get(key.name).start(0)
  //   key.classList.add('keydown')
  // }
}

export function synthNoteOff(note) {
  const oscNode = notemap.get(note);
  if (oscNode) {
    oscNode.stop();
  }
  notemap.delete(note);
  // key.classList.remove('keydown');
  // const oscNode = notemap.get(key.name);
  // if (oscNode) {
  //   oscNode.stop(0);
  // }
  // notemap.delete(key.name);
}

// keys.forEach(key => {
//   key.addEventListener('pointerdown', event => {
//     noteon(event.target, [{freq: event.target.dataset.freq}])
//   })
//   key.addEventListener('pointerup', event => { noteoff(event.target) })
//   key.addEventListener('pointerleave', event => { noteoff(event.target) })
// })