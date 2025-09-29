"use client";

import { midiToNoteName } from "@/lib/pitch";

export default function Transport({ song, bpm, tempoScale, loop, setLoop }) {
  const total = song.length;
  const clamp = (i) => Math.max(0, Math.min(total - 1, i));

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-5">
      <div className="label">Phrase Loop</div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="flex items-center gap-2">
          <span className="label">Start (idx)</span>
          <input
            type="number"
            className="input w-24"
            min={0}
            max={total - 1}
            value={loop.startIndex}
            onChange={(e) => setLoop(l => ({ ...l, startIndex: clamp(parseInt(e.target.value||"0", 10)) }))}
          />
        </label>
        <label className="flex items-center gap-2">
          <span className="label">End (idx)</span>
          <input
            type="number"
            className="input w-24"
            min={0}
            max={total - 1}
            value={loop.endIndex}
            onChange={(e) => setLoop(l => ({ ...l, endIndex: clamp(parseInt(e.target.value||"0", 10)) }))}
          />
        </label>
      </div>

      <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-3 text-sm">
        <div className="label mb-1">Loop Preview</div>
        <div className="flex flex-wrap gap-2">
          {song.map((n, idx) => {
            const active = idx >= loop.startIndex && idx <= loop.endIndex;
            return (
              <span
                key={idx}
                className={`px-2 py-1 rounded ${active ? "bg-indigo-100 text-indigo-800" : "bg-gray-100 dark:bg-gray-800"}`}
                title={`midi:${n.midi} (${midiToNoteName(n.midi)})  dur:${n.dur}s`}
              >
                {midiToNoteName(n.midi)}
              </span>
            );
          })}
        </div>
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400">
        Play a backing track externally if you want; this MVP focuses on **visual target + metronome**. Slow the tempo with the header slider; hit the beat ring and match notes in the looped range.
      </div>
    </div>
  );
}
