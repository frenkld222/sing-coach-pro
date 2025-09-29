"use client";

import { useEffect, useRef } from "react";
import { midiToNoteName, freqToMidiFloat } from "@/lib/pitch";

// Simple animated ladder: target climbs each step; your pitch shows as a dot.
export default function TikTokScale({
  width = 360,
  height = 420,
  scaleMidi = [],          // e.g., [C4..C5]
  currentFreq = null,
  targetIndex = 0          // which degree we’re on
}) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;

    const bottom = scaleMidi[0] ?? 60;
    const top = scaleMidi[scaleMidi.length - 1] ?? (bottom + 12);
    const midiToY = (m) => {
      const t = (m - bottom) / (top - bottom);
      return H - t * H;
    };

    // bg
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillRect(0,0,W,H);

    // rails
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W*0.33, 0); ctx.lineTo(W*0.33, H);
    ctx.moveTo(W*0.66, 0); ctx.lineTo(W*0.66, H);
    ctx.stroke();

    // steps (scale degrees)
    scaleMidi.forEach((m, i) => {
      const y = midiToY(m);
      // step line
      ctx.strokeStyle = i === targetIndex ? "rgba(34,197,94,0.5)" : "rgba(99,102,241,0.25)";
      ctx.lineWidth = i === targetIndex ? 4 : 2;
      ctx.beginPath();
      ctx.moveTo(W*0.2, y);
      ctx.lineTo(W*0.8, y);
      ctx.stroke();

      // label
      ctx.fillStyle = "rgba(17,24,39,0.9)";
      ctx.font = `${14 * (W/360 + 0.5)}px system-ui, -apple-system, sans-serif`;
      ctx.fillText(`${i+1} • ${midiToNoteName(m)}`, 10 * (W/360 + 0.5), y - 6);
    });

    // target glow
    if (scaleMidi[targetIndex] != null) {
      const ty = midiToY(scaleMidi[targetIndex]);
      ctx.beginPath();
      ctx.arc(W*0.5, ty, 14, 0, Math.PI*2);
      ctx.fillStyle = "rgba(34,197,94,0.25)";
      ctx.fill();
    }

    // your pitch
    if (currentFreq) {
      const mf = freqToMidiFloat(currentFreq);
      const y = midiToY(mf);
      ctx.beginPath();
      ctx.arc(W*0.5, y, 8, 0, Math.PI*2);
      ctx.fillStyle = "rgba(99,102,241,1)";
      ctx.fill();
    }
  }, [width, height, scaleMidi, currentFreq, targetIndex]);

  return <canvas ref={ref} className="w-full rounded-2xl border border-gray-200 dark:border-gray-800" />;
}
