"use client";

import { useEffect, useMemo, useState } from "react";
import { midiToNoteName, midiToFreq, centsBetween } from "@/lib/pitch";
import TikTokScale from "@/components/TikTokScale";

export default function ScalePractice({ isListening, currentFreq, tolerance, scaleMidi }) {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState({ total: 0, correct: 0 });

  const targetMidi = useMemo(() => scaleMidi?.[step] ?? null, [scaleMidi, step]);
  const targetName = targetMidi != null ? midiToNoteName(targetMidi) : "—";
  const targetFreq = targetMidi != null ? midiToFreq(targetMidi) : null;

  const liveCents = currentFreq && targetFreq ? centsBetween(currentFreq, targetFreq) : null;
  const inTune = liveCents != null && Math.abs(liveCents) <= tolerance;

  // Auto-advance on “hit”
  useEffect(() => {
    if (inTune && isListening) {
      const id = setTimeout(() => {
        setScore(s => ({ total: s.total + 1, correct: s.correct + 1 }));
        setStep((i) => (i + 1) % scaleMidi.length);
      }, 250);
      return () => clearTimeout(id);
    }
  }, [inTune, isListening, scaleMidi?.length]);

  function miss() {
    setScore(s => ({ total: s.total + 1, correct: s.correct }));
    setStep((i) => (i + 1) % scaleMidi.length);
  }

  function reset() {
    setScore({ total: 0, correct: 0 });
    setStep(0);
  }

  const pct = score.total ? Math.round((score.correct / score.total) * 100) : 0;

  return (
    <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
      <div className="grid gap-6">
        <TikTokScale scaleMidi={scaleMidi} currentFreq={currentFreq} targetIndex={step} />
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-center justify-between">
          <div>
            <div className="label">Target</div>
            <div className="mt-1 text-2xl font-bold">{targetName}</div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${inTune ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {inTune ? "Hit" : "Adjust"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-5">
        <div className="label">Progress</div>
        <div className="mt-1 text-3xl font-bold">{pct}%</div>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {score.correct} correct out of {score.total} attempts.
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button className="button bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100" onClick={() => setStep((i) => (i + scaleMidi.length - 1) % scaleMidi.length)}>Prev</button>
          <button className="button button-primary" onClick={() => setStep((i) => (i + 1) % scaleMidi.length)}>Next</button>
          <button className="button bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100" onClick={reset}>Reset</button>
          <button className="button bg-amber-100 text-amber-800" onClick={miss}>Mark As Miss</button>
        </div>

        <div className="mt-6">
          <div className="label">Live Cents</div>
          <div className={`mt-1 text-3xl font-semibold ${inTune ? "text-green-600" : "text-red-600"}`}>
            {liveCents == null ? "—" : `${liveCents > 0 ? "+" : ""}${liveCents.toFixed(0)}¢`}
          </div>
        </div>
      </div>
    </div>
  );
}
