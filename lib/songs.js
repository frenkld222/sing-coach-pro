// Public-domain demo songs as beat-based melodies with optional lyrics.
// Each song: { bpm, notes: [{ startBeats, durBeats, midi }], lyrics?: [{startBeats, text}] }

export const SONGS = {
  "Happy Birthday": {
    bpm: 100,
    notes: [
      { startBeats: 0,  durBeats: 1, midi: 67 },
      { startBeats: 1,  durBeats: 1, midi: 67 },
      { startBeats: 2,  durBeats: 2, midi: 69 },
      { startBeats: 4,  durBeats: 2, midi: 67 },
      { startBeats: 6,  durBeats: 2, midi: 72 },
      { startBeats: 8,  durBeats: 4, midi: 71 },

      { startBeats: 12, durBeats: 1, midi: 67 },
      { startBeats: 13, durBeats: 1, midi: 67 },
      { startBeats: 14, durBeats: 2, midi: 69 },
      { startBeats: 16, durBeats: 2, midi: 67 },
      { startBeats: 18, durBeats: 2, midi: 74 },
      { startBeats: 20, durBeats: 4, midi: 72 },

      { startBeats: 24, durBeats: 1, midi: 67 },
      { startBeats: 25, durBeats: 1, midi: 67 },
      { startBeats: 26, durBeats: 2, midi: 79 },
      { startBeats: 28, durBeats: 2, midi: 76 },
      { startBeats: 30, durBeats: 2, midi: 72 },
      { startBeats: 32, durBeats: 2, midi: 71 },
      { startBeats: 34, durBeats: 4, midi: 69 },

      { startBeats: 38, durBeats: 1, midi: 77 },
      { startBeats: 39, durBeats: 1, midi: 77 },
      { startBeats: 40, durBeats: 2, midi: 76 },
      { startBeats: 42, durBeats: 2, midi: 72 },
      { startBeats: 44, durBeats: 2, midi: 74 },
      { startBeats: 46, durBeats: 4, midi: 72 },
    ],
    // Simple word timing (1 word per note). Good enough for MVP karaoke highlight.
    lyrics: [
      { startBeats: 0,  text: "Happy" },
      { startBeats: 1,  text: "birth-" },
      { startBeats: 2,  text: "day" },
      { startBeats: 4,  text: "to" },
      { startBeats: 6,  text: "you" },
      { startBeats: 8,  text: "—" },

      { startBeats: 12, text: "Happy" },
      { startBeats: 13, text: "birth-" },
      { startBeats: 14, text: "day" },
      { startBeats: 16, text: "to" },
      { startBeats: 18, text: "you" },
      { startBeats: 20, text: "—" },

      { startBeats: 24, text: "Happy" },
      { startBeats: 25, text: "birth-" },
      { startBeats: 26, text: "day" },
      { startBeats: 28, text: "dear" },
      { startBeats: 30, text: "friend" },
      { startBeats: 32, text: "—" },
      { startBeats: 34, text: "—" },

      { startBeats: 38, text: "Happy" },
      { startBeats: 39, text: "birth-" },
      { startBeats: 40, text: "day" },
      { startBeats: 42, text: "to" },
      { startBeats: 44, text: "you" },
      { startBeats: 46, text: "—" },
    ]
  },
  "Twinkle Twinkle": {
    bpm: 90,
    notes: [
      { startBeats: 0,  durBeats: 2, midi: 60 },
      { startBeats: 2,  durBeats: 2, midi: 60 },
      { startBeats: 4,  durBeats: 2, midi: 67 },
      { startBeats: 6,  durBeats: 2, midi: 67 },
      { startBeats: 8,  durBeats: 2, midi: 69 },
      { startBeats: 10, durBeats: 2, midi: 69 },
      { startBeats: 12, durBeats: 4, midi: 67 },

      { startBeats: 16, durBeats: 2, midi: 65 },
      { startBeats: 18, durBeats: 2, midi: 65 },
      { startBeats: 20, durBeats: 2, midi: 64 },
      { startBeats: 22, durBeats: 2, midi: 64 },
      { startBeats: 24, durBeats: 2, midi: 62 },
      { startBeats: 26, durBeats: 2, midi: 62 },
      { startBeats: 28, durBeats: 4, midi: 60 },
    ],
    lyrics: [
      { startBeats: 0,  text: "Twin-" },
      { startBeats: 2,  text: "kle" },
      { startBeats: 4,  text: "twin-" },
      { startBeats: 6,  text: "kle" },
      { startBeats: 8,  text: "lit-" },
      { startBeats: 10, text: "tle" },
      { startBeats: 12, text: "star" },

      { startBeats: 16, text: "How" },
      { startBeats: 18, text: "I" },
      { startBeats: 20, text: "won-" },
      { startBeats: 22, text: "der" },
      { startBeats: 24, text: "what" },
      { startBeats: 26, text: "you" },
      { startBeats: 28, text: "are" },
    ]
  }
};

// Old helpers for Phrase Trainer
export const demoSong = [
  { start: 0.0, dur: 0.6, midi: 60 },
  { start: 0.6, dur: 0.6, midi: 62 },
  { start: 1.2, dur: 0.6, midi: 64 },
  { start: 1.8, dur: 0.6, midi: 65 },
  { start: 2.4, dur: 0.6, midi: 67 },
  { start: 3.0, dur: 0.6, midi: 65 },
  { start: 3.6, dur: 0.6, midi: 64 },
  { start: 4.2, dur: 0.8, midi: 62 },
];

export function demoPhrases(song, transposeSemitones = 0) {
  return song.map(n => ({ ...n, midi: n.midi + transposeSemitones }));
}
