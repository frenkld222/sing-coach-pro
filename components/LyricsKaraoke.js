"use client";

export default function LyricsKaraoke({ lyrics, bpm, elapsedSec }) {
  if (!lyrics || !lyrics.length) return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-sm text-gray-500">
      No lyrics for this song.
    </div>
  );

  const secPerBeat = 60 / bpm;

  // Map lyrics to absolute seconds
  const items = lyrics.map(l => ({ ...l, startSec: l.startBeats * secPerBeat }));
  const idx = currentIndex(items, elapsedSec);
  const display = items.map((l, i) => {
    const active = i === idx;
    return (
      <span
        key={i}
        className={`px-1.5 py-0.5 rounded ${active ? "bg-indigo-100 text-indigo-800 font-semibold" : ""}`}
      >
        {l.text}
      </span>
    );
  });

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-lg flex flex-wrap gap-1">
      {display}
    </div>
  );
}

function currentIndex(items, t) {
  let best = 0;
  for (let i=0;i<items.length;i++) {
    if (t >= items[i].startSec) best = i; else break;
  }
  return best;
}
