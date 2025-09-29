"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import BeatBar from "@/components/BeatBar";
import LyricsKaraoke from "@/components/LyricsKaraoke";
import { keyToSemitones, midiToFreq, midiToNoteName } from "@/lib/pitch";

export default function SongChallenge({ isListening, currentFreq, tolerance, keyName, bpm, phaseMs, songs }) {
  const [songKey, setSongKey] = useState(Object.keys(songs)[0]);
  const [state, setState] = useState("idle"); // idle|countdown|recording|done
  const [frames, setFrames] = useState([]);   // {t,f0}
  const [result, setResult] = useState(null); // {pitchPct, timingPct, notes: [...]}
  const [elapsedSec, setElapsedSec] = useState(0);

  const transpose = keyToSemitones(keyName);
  const song = songs[songKey];
  const refSong = useMemo(() => transposeSong(song, transpose, bpm), [songKey, keyName, bpm]);
  const totalSec = useMemo(() => refSong.notes.length ? (refSong.notes.at(-1).start + refSong.notes.at(-1).dur) : 0, [refSong]);

  const rafRef = useRef(null);
  const t0Ref = useRef(null);
  const framesTimerRef = useRef(null);

  // Drive an internal clock during countdown/recording
  useEffect(() => {
    if (state === "idle" || state === "done") return;
    const tick = () => {
      if (t0Ref.current == null) t0Ref.current = performance.now();
      const t = (performance.now() - t0Ref.current) / 1000;
      setElapsedSec(t);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => rafRef.current && cancelAnimationFrame(rafRef.current);
  }, [state]);

  // Collect pitch frames while recording
  useEffect(() => {
    if (state !== "recording" || !isListening) return;
    const id = setInterval(() => {
      const t = (performance.now() - (t0Ref.current ?? performance.now())) / 1000;
      setFrames(prev => prev.concat([{ t, f0: currentFreq ?? null }]));
    }, 33);
    framesTimerRef.current = id;
    return () => clearInterval(id);
  }, [state, isListening, currentFreq]);

  function startChallenge() {
    setResult(null);
    setFrames([]);
    setElapsedSec(0);
    t0Ref.current = null;
    setState("countdown");

    // 1 second countdown -> start
    setTimeout(() => {
      setState("recording");
      // force a fresh t0 for stable timing
      t0Ref.current = performance.now();
      // end after song length + tiny pad
      const endMs = totalSec * 1000 + 200;
      setTimeout(() => setState("done"), Math.max(1000, endMs));
    }, 1000);
  }

  // Compute score when done
  useEffect(() => {
    if (state !== "done") return;
    if (framesTimerRef.current) clearInterval(framesTimerRef.current);

    const notes = scoreAgainstSong(refSong, frames, tolerance);
    const pitchPct = avg(notes.map(n => n.pitchScore));
    const timingPct = avg(notes.map(n => n.timingScore));
    setResult({ pitchPct, timingPct, notes });
  }, [state]);

  const lyrics = useMemo(() => song.lyrics ?? [], [songKey]);

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
      {/* LEFT: Transport + visuals */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <div className="flex items-center gap-3">
            <label className="label">Song</label>
            <select className="input" value={songKey} onChange={(e)=>setSongKey(e.target.value)}>
              {Object.keys(songs).map(k => (<option key={k} value={k}>{k}</option>))}
            </select>
            <div className="text-sm text-gray-600 dark:text-gray-300 ml-auto">
              Key: <span className="font-semibold">{keyName} Major</span> · Tempo: <span className="font-semibold">{bpm} BPM</span> · Length: <span className="font-semibold">{totalSec.toFixed(1)}s</span>
            </div>
          </div>

          <BeatBar bpm={bpm} elapsedSec={state==="done" ? totalSec : elapsedSec} totalSec={totalSec} />
          <LyricsKaraoke lyrics={lyrics} bpm={bpm} elapsedSec={state==="done" ? totalSec : elapsedSec} />

          <div className="flex items-center gap-3">
            <button
              className={`button ${state === "recording" || state === "countdown" ? "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-100" : "button-primary"}`}
              onClick={startChallenge}
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
            After countdown, sing with the beat and words. We grade pitch (cents) and timing (ms) per note.
          </div>
        </div>
      </div>

      {/* RIGHT: Results */}
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
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 grid grid-cols-2 gap-4">
              <div>
                <div className="label">Pitch Accuracy</div>
                <div className="mt-1 text-4xl font-extrabold">{Math.round(result.pitchPct)}%</div>
              </div>
              <div>
                <div className="label">Timing Accuracy</div>
                <div className="mt-1 text-4xl font-extrabold">{Math.round(result.timingPct)}%</div>
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
                    <th className="p-2 text-left">Pitch</th>
                    <th className="p-2 text-left">Timing</th>
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

// —— helpers ——

function transposeSong(song, semitones, bpm) {
  const secPerBeat = 60 / (bpm || song.bpm);
  const notes = song.notes.map(n => ({
    start: n.startBeats * secPerBeat,
    dur: n.durBeats * secPerBeat,
    midi: n.midi + semitones
  }));
  const durationMs = notes.length ? (notes[notes.length-1].start + notes[notes.length-1].dur) * 1000 : 0;
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

function verdict(pitch, timing) {
  if (pitch >= 90 && timing >= 90) return "🔥 Nailed it! Pro-level control.";
  if (pitch >= 75 && timing >= 75) return "👍 Solid! Keep polishing transitions.";
  if (pitch >= 60 || timing >= 60) return "🙂 Getting there. Focus on breath and entrances.";
  return "💪 Keep practicing. Try slowing the tempo and using the Scale Game.";
}

