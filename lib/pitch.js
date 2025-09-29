// Pitch math & helpers

export function emaSmoother(alpha = 0.2) {
  let last = null;
  return {
    reset() { last = null; },
    push(x) {
      if (x == null) return last;
      if (last == null) { last = x; return x; }
      last = last + alpha * (x - last);
      return last;
    }
  };
}

// freq <-> midi
export function freqToMidiFloat(f) {
  return 69 + 12 * Math.log2(f / 440);
}

export function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToNoteName(midi) {
  const names = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const m = Math.round(midi);
  const note = names[(m % 12 + 12) % 12];
  const octave = Math.floor(m / 12) - 1;
  return `${note}${octave}`;
}

export function centsBetween(f1, f2) {
  return 1200 * Math.log2(f1 / f2);
}

export function nearestNoteInfo(freq) {
  const midiFloat = freqToMidiFloat(freq);
  const midi = Math.round(midiFloat);
  const noteFreq = midiToFreq(midi);
  const cents = 1200 * Math.log2(freq / noteFreq);
  return { midi, name: midiToNoteName(midi), cents };
}

// transpose helpers
export function transposeMidi(midi, semitones) {
  return midi + semitones;
}

export function keyToSemitones(keyName) {
  const map = { "C":0,"C#":1,"D":2,"D#":3,"E":4,"F":5,"F#":6,"G":7,"G#":8,"A":9,"A#":10,"B":11 };
  return map[keyName] ?? 0;
}
