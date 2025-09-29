"use client";

import { useEffect, useRef, useState } from "react";
import { midiToNoteName, centsBetween, midiToFreq } from "@/lib/pitch";

export default function ScaleGame({ isListening, currentFreq, tolerance, scaleMidi }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState({ hits: 0, total: 0 });

  // simple repeating sequence of scale notes
  const sequence = Array.from({length: 16}, (_,i) => scaleMidi[i % scaleMidi.length]);
  const SPEED = 120; // pixels per second
  const HIT_Y = 200;
