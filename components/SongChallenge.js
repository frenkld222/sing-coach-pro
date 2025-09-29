"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { keyToSemitones, midiToFreq, midiToNoteName } from "@/lib/pitch";

export default function SongChallenge({ isListening, currentFreq, tolerance, keyName, bpm, phaseMs, songs }) {
  const [songKey, setSongKey] = useState(Object.keys(songs)[0]);
  const [state, setState] = useState("idle"); // idle|countdown|recording|done
  const [frames, setFrames] = useState([]);   // {t,f0}
  const [result, setResult] = useState(null); // {pitchPct, timingPct, notes: [...]}

  const transpose = keyToSemitones(keyName);
  const song = songs[songKey];
  const refSong = useMemo(() => transposeSong(song, transpose, bpm), [songKey, keyName, bpm]);

  const t0Ref = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (state !== "recording") return;
    if (!isListening) return;

    const now = performance.now();
    if (t0Ref.current == null) t0Ref.current = now;

    const id = setInterval(() => {
      const t = (performance.now() - t0Ref.current) / 1000;
      setFrames(prev => prev.concat([{ t, f0: currentFreq ?? null }]));
    }, 33);

    timerRef.current = id;
    return () => clearInterval(id);
  }, [state, isListening, currentFreq]);

  function startCountdown() {
    setResult(null);
    setFrames([]);
    setState("countdown");
    setTimeout(() => setState("recording"), 1000);
    setTimeout(() => setState("done"), Math.max(1500, (refSong.durationMs + 300)) );
  }

  useEffect(() => {
    if (state !== "done") return;
    if (timerRef.current) clearInterval(timerRef.current);
    t0Ref.current = null;

    const notes = scoreAgainstSong(refSong, frames, tolerance);
    const pitchPct = avg(notes.map(n => n.pitchScore));
    const timingPct = avg(notes.map(n => n.timingScore));
    setResult({ pitchPct, timingPct, notes });
  }, [state]);

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-5">
        <div className="label">Song</div>
        <select className="input" value={songKey} onChange={(e)=>setSongKey(e.target.value)}>
          {Object.keys(songs).map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>

        <div className="text-sm text-gray-600 dark:text-gray-300">
          Key: <span className="font-semibold">{keyName} Major</span> · Tempo: <span className="font-semibold">{bpm} BPM</span> · Length: <span className="font-semibold">{(refSong.durationMs/1000).toFixed(1)}s</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            className={`button ${state === "recording" || state === "countdown" ? "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-100" : "button-primary"}`}
            onClick={startCountdown}
            disabled={!isListening || state === "recording" || state === "countdown"}
            title={!isListening ? "Start the microphone first" : ""}
          >
            {state === "idle" && "Start Challenge"}
            {state === "countdown" && "Get Ready…"}
            {state === "recording" && "Recording…"}
            {state === "done" && "Retry"}
          </button>
          {!isListening && <span className="text-xs text-red-600">Turn on the mic first.</span>}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400">
          3-2-1, then sing the melody. We’ll grade your pitch vs each note and your timing vs each note’s start.
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="label">Results</div>
        {!result && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            {state === "idle" && "Choose a song and press Start Challenge."}
            {state === "countdown" && "Get ready…"}
            {state === "recording" && "Recording… sing the melody now."}
            {state === "done" && "Processing…"}
          </div>
        )}

        {result && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="label">Pitch Accuracy</div>
                <div className="mt-1 text-3xl font-bold">{Math.round(result.pitchPct)}%</div>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
                <div className="label">Timing Accuracy</div>
                <div className="mt-1 text-3xl font-bold">{Math.round(result.timingPct)}%</div>
              </div>
            </div>

            <div className="text-sm">
              {verdict(result.pitchPct, result.timingPct)}
            </div>

            <div className="label mt-4">Per-note breakdown</div>
            <div className="max-h-64 overflow-auto rounded-xl border border-gray-100 dark:border-gray-800">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="p-2 text-left">#</th>
                    <th className="p-2 text-left">Target</th>
                    <th className="p-2 text-left">Pitch Score</th>
                    <th className="p-2 text-left">Timing Score</th>
                    <th className="p-2 text-left">Avg Cents</th>
                    <th className="p-2 text-left">Onset Δms</th>
                  </tr>
                </thead>
                <tbody>
                  {result.notes.map((n, i) => (
                    <tr key={i} className="odd:bg-white even:bg-gray-50 dark:odd:bg-gray-900 dark:even:bg-gray-800">
                      <td className="p-2">{i+1}</td>
                      <td className="p-2">{midiToNoteName(n.midi)}</td>
                      <td className="p-2">{Math.round(n.pitchScore)}%</td>
                      <td className="p-2">{Math.round(n.timingScore)}%</td>
                      <td className="p-2">{n.avgCents == null ? "—" : `${n.avgCents.toFixed(0)}¢`}</td>
                      <td className="p-2">{n.onsetDeltaMs == null ? "—" : `${Math.round(n.onsetDeltaMs)} ms`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// helpers

function transposeSong(song, semitones, bpm) {
  const secPerBeat = 60 / (bpm || song.bpm);
  const notes = song.notes.map(n => ({
    start: n.startBeats * secPerBeat,
    dur: n.durBeats * secPerBeat,
    midi: n.midi + semitones
  }));
  const durationMs = (notes.at(-1).start + notes.at(-1).dur) * 1000;
  return { ...song, notes, durationMs };
}

function scoreAgainstSong(song, frames, tolerance) {
  return song.notes.map((note) => {
    const startMs = note.start * 1000;
    const endMs = (note.start + note.dur) * 1000;

    const inWin = frames.filter(f => {
      const ms = f.t * 1000;
      return ms >= startMs && ms < endMs;
    });

    let avgCents = null, pitchScore = 0;
    const targetFreq = midiToFreq(note.midi);
    const centsArr = inWin
      .filter(f => f.f0 && f.f0 > 40 && f.f0 < 2000)
      .map(f => 1200 * Math.log2(f.f0 / targetFreq));

    if (centsArr.length) {
      avgCents = centsArr.reduce((a,b)=>a+b,0) / centsArr.length;
      const absMean = Math.abs(avgCents);
      const max = tolerance * 3;
      pitchScore = Math.max(0, Math.min(100, 100 * (1 - (absMean - tolerance) / (max - tolerance))));
      if (absMean <= tolerance) pitchScore = 100;
    } else {
      pitchScore = 0;
    }

    const onsetFrame = frames.find(f => {
      const ms = f.t * 1000;
      return ms >= (startMs - 150) && ms <= (startMs + 300) && f.f0 && f.f0 > 40 && f.f0 < 2000;
    });
    let onsetDeltaMs = null, timingScore = 0;
    if (onsetFrame) {
      const ms = onsetFrame.t * 1000;
      onsetDeltaMs = ms - startMs;
      const ad = Math.abs(onsetDeltaMs);
      timingScore = scoreWindow(ad, 60, 240);
    } else {
      timingScore = 0;
    }

    return { midi: note.midi, avgCents, pitchScore, onsetDeltaMs, timingScore };
  });
}

function scoreWindow(absMs, tight, loose) {
  if (absMs <= tight) return 100;
  if (absMs >= loose) return 0;
  return Math.round(100 * (1 - (absMs - tight) / (loose - tight)));
}

function avg(arr) {
  const good = arr.filter(x => Number.isFinite(x));
  if (!good.length) return 0;
  return good.reduce((a,b)=>a+b,0) / good.length;
}
