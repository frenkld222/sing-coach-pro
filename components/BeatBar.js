"use client";

import { useEffect, useRef } from "react";

export default function BeatBar({ bpm, elapsedSec, totalSec }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const W = canvas.clientWidth * dpr;
    const H = canvas.clientHeight * dpr;
    canvas.width = W; canvas.height = H;

    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = "rgba(0,0,0,0.06)";
    ctx.fillRect(0,0,W,H);

    if (!totalSec) return;

    const secPerBeat = 60 / bpm;
    const beats = Math.ceil(totalSec / secPerBeat);

    // tick marks
    for (let i=0; i<=beats; i++) {
      const x = (i*secPerBeat/totalSec)*W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.strokeStyle = i % 4 === 0 ? "rgba(99,102,241,0.45)" : "rgba(0,0,0,0.12)";
      ctx.lineWidth = i % 4 === 0 ? 2 : 1;
      ctx.stroke();
    }

    // playhead
    const px = Math.min(1, Math.max(0, elapsedSec/totalSec)) * W;
    ctx.beginPath();
    ctx.moveTo(px, 0);
    ctx.lineTo(px, H);
    ctx.strokeStyle = "rgba(34,197,94,0.8)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }, [bpm, elapsedSec, totalSec]);

  return <canvas ref={canvasRef} className="w-full h-14 rounded-xl border border-gray-200 dark:border-gray-800" />;
}
