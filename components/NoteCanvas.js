"use client";

import { useEffect, useRef } from "react";
import { freqToMidiFloat, midiToNoteName } from "@/lib/pitch";

const TRAIL_LEN = 24;

export default function NoteCanvas({
  height = 420,
  bottomMidi = 48, // C3
  topMidi = 72,    // C5
  currentFreq,
  targetMidi,      // optional highlight line
}) {
  const canvasRef = useRef(null);
  const trailRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const dpr = Math.max(1, window.devicePixelRatio || 1);

    function resize() {
      const w = parent.clientWidth;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = height + "px";
      draw();
    }

    function draw() {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1,0,0,1,0,0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const W = canvas.width;
      const H = canvas.height;

      // background
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillRect(0, 0, W, H);

      // map midi to Y
      const midiToY = (m) => {
        const t = (m - bottomMidi) / (topMidi - bottomMidi);
        return H - t * H;
      };

      // semitone grid + labels
      for (let m = bottomMidi; m <= topMidi; m++) {
        const y = midiToY(m);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        const isOctave = (m % 12) === 0;
        ctx.strokeStyle = isOctave ? "rgba(99,102,241,0.35)" : "rgba(0,0,0,0.08)";
        ctx.lineWidth = isOctave ? 2 : 1;
        ctx.stroke();

        if (m % 2 === 0) {
          ctx.fillStyle = "rgba(17,24,39,0.8)";
          ctx.font = `${12 * (W/800 + 0.6)}px system-ui, -apple-system, sans-serif`;
          ctx.fillText(midiToNoteName(m), 8 * (W/800 + 0.6), y - 4);
        }
      }

      // target line
      if (typeof targetMidi === "number") {
        const y = midiToY(targetMidi);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.strokeStyle = "rgba(34,197,94,0.35)";
        ctx.lineWidth = 3;
        ctx.stroke();
      }

      // trail update
      if (currentFreq && currentFreq > 40 && currentFreq < 2000) {
        trailRef.current.push(freqToMidiFloat(currentFreq));
      } else {
        trailRef.current.push(null);
      }
      if (trailRef.current.length > TRAIL_LEN) trailRef.current.shift();

      // trail render
      let last = null;
      ctx.lineWidth = 3;
      for (let i = 0; i < trailRef.current.length; i++) {
        const m = trailRef.current[i];
        if (m == null) continue;
        const x = (i / (TRAIL_LEN - 1)) * (W - 24) + 12;
        const y = midiToY(m);
        if (last) {
          ctx.beginPath();
          ctx.moveTo(last.x, last.y);
          ctx.lineTo(x, y);
          ctx.strokeStyle = "rgba(99,102,241,0.8)";
          ctx.stroke();
        }
        last = { x, y };
      }

      // current marker
      if (currentFreq) {
        const m = freqToMidiFloat(currentFreq);
        const y = midiToY(m);
        const x = W - 18;
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99,102,241,1)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x, y, 16, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99,102,241,0.2)";
        ctx.fill();
      }
    }

    const obs = new ResizeObserver(resize);
    obs.observe(parent);
    const id = setInterval(draw, 50);

    return () => {
      clearInterval(id);
      obs.disconnect();
    };
  }, [height, bottomMidi, topMidi, currentFreq, targetMidi]);

  return <canvas ref={canvasRef} className="w-full rounded-2xl border border-gray-200 dark:border-gray-800" />;
}
