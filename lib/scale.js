// Build major scale (one octave) from tonic MIDI, inclusive
export function buildMajorScale(tonicMidi) {
  const steps = [0,2,4,5,7,9,11,12];
  return steps.map(s => tonicMidi + s);
}
