"use client";

import { useEffect, useRef, useState } from "react";
import MicButton from "@/components/MicButton";
import PitchDisplay from "@/components/PitchDisplay";
import NoteCanvas from "@/components/NoteCanvas";
import BeatMeter from "@/components/BeatMeter";
import KeySelector from "@/components/KeySelector";
import ScalePractice from "@/components/ScalePractice";
import Transport from "@/components/Transport";
import SongChallenge from "@/components/SongChallenge";

import {
  nearestNoteInfo,
  emaSmoother,
  keyToSemitones,
} from "@/lib/pitch";
import { OnsetDetector, BeatScheduler } from "@/lib/rhythm";
import { buildMajorScale } from "@/lib/scale";
import { demoSong, demoPhrases, SONGS } from "@/lib/songs";

const DEFAULT_BPM = 90;
const DEFAULT_TOLERANCE = 25; // cents
const SCALE_BOTTOM_MIDI = 48; // C3
the SCALE_TOP_MIDI = 72;    // C5

const TABS = ["Live Pitch", "Scale Practice", "Phrase Trainer", "Song Challenge"];

export default function HomePage() {
  const [tab, setTab] = useState(TABS[0]);

  const [isListening, setIsListening] = useState(false);
  const [freq, setFreq] = useState(null);
  const [noteName, setNoteName] = useState(null);
  const [nearestMidi, setNearestMidi] = useState(null);
  const [cents, setCents] = useState(null);
  const [inTune, setInTune] = useState(false);
  const [error, setError] = useState("");

  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [tolerance, setTolerance] = useState(DEFAULT_TOLERANCE);
  const [phaseMs, setPhaseMs] = useState(0);

  const [onBeat, setOnBeat] = useState(false);
  const [lastBeatAt, setLastBeatAt] = useState(0);
  const [lastOnsetAt, setLastOnsetAt] = useState(0);

  const [keyName, setKeyName] = useState("C");
  const [tempoScale, setTempoScale] = useState(1.0);
  const [loop, setLoop] = useState({ startIndex: 0, endIndex: 7 });

  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const rafRef = useRef(null);
  const detectorRef = useRef(null);
  const bufferRef = useRef(null);

  const smootherRef = useRef(emaSmoother(0.25));
  const onsetRef = useRef(null);
  const beatRef = useRef(null);

  async function initDetector() {
    if (!detectorRef.current) {
      const { YIN } = await import("pitchfinder");
      detectorRef.current = YIN();
    }
  }

  function stopAll() {
    setIsListening(false);
    setOnBeat(false);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (beatRef.current) beatRef.current.stop();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
    detectorRef.current = null;
    onsetRef.current = null;
  }

  async function startAll() {
    try {
      setError("");
      await initDetector();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true },
        video: false
      });
      mediaStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;

      bufferRef.current = new Float32Array(analyser.fftSize);

      onsetRef.current = new OnsetDetector(audioCtx.sampleRate);

      beatRef.current = new BeatScheduler(audioCtx, {
        bpm: Math.round(bpm * tempoScale),
        phaseMs,
        clickEnabled: true,
        onBeat: () => setLastBeatAt(performance.now()),
      });
      beatRef.current.start();

      smootherRef.current.reset();

      const loopFn = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getFloatTimeDomainData(bufferRef.current);

        // Pitch
        let f0 = null;
        try {
          const detected = detectorRef.current(bufferRef.current);
          if (detected && Number.isFinite(detected)) {
            f0 = smootherRef.current.push(detected);
          }
        } catch {
          f0 = null;
        }

        if (f0 && f0 > 40 && f0 < 2000) {
          const nn = nearestNoteInfo(f0);
          setFreq(f0);
          setNoteName(nn.name);
          setNearestMidi(nn.midi);
          setCents(nn.cents);
          setInTune(Math.abs(nn.cents) <= tolerance);
        } else {
          setFreq(null);
          setNoteName(null);
          setNearestMidi(null);
          setCents(null);
          setInTune(false);
        }

        // Onset vs beat
        if (onsetRef.current) {
          const onset = onsetRef.current.pushBuffer(bufferRef.current);
          if (onset) {
            const now = performance.now();
            setLastOnsetAt(now);
            if (beatRef.current) {
              const nearestBeatMs = beatRef.current.nearestBeatTimeMs(now);
              const diff = Math.abs(now - nearestBeatMs);
              setOnBeat(diff <= 80);
            }
          } else if (onBeat && performance.now() - lastOnsetAt > 180) {
            setOnBeat(false);
          }
        }

        rafRef.current = requestAnimationFrame(loopFn);
      };

      setIsListening(true);
      rafRef.current = requestAnimationFrame(loopFn);
    } catch (err) {
      setError(err?.message || "Microphone access failed.");
      stopAll();
    }
  }

  useEffect(() => {
    if (beatRef.current && isListening && audioCtxRef.current) {
      beatRef.current.update({ bpm: Math.round(bpm * tempoScale), phaseMs });
    }
  }, [bpm, phaseMs, tempoScale, isListening]);

  useEffect(() => () => stopAll(), []);

  const targetMidi = nearestMidi ?? null;

  const transpose = keyToSemitones(keyName);
  const scale = buildMajorScale(60 + transpose);
  const phrases = demoPhrases(demoSong, transpose);

  return (
    <main className="flex items-center justify-center min-h-screen p-6">
      <div className="card w-full max-w-6xl p-6 md:p-8 grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Sing Coach Pro</h1>
          <div className="flex items-center gap-3">
            <KeySelector value={keyName} onChange={setKeyName} />
            <div className="hidden md:block h-6 w-px bg-gray-200 dark:bg-gray-800" />
            <div className="flex items-center gap-2">
              <span className="label">Tempo</span>
              <input
                type="range"
                min={0.5}
                max={1.0}
                step={0.05}
                value={tempoScale}
                onChange={(e) => setTempoScale(parseFloat(e.target.value))}
              />
              <div className="w-12 text-right font-semibold">{Math.round(bpm * tempoScale)}</div>
              <span className="text-xs text-gray-500">BPM</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(name => (
            <button
              key={name}
              onClick={() => setTab(name)}
              className={`button px-3 py-1.5 text-sm ${tab === name ? "button-primary" : "bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-100"}`}
            >
              {name}
            </button>
          ))}
        </div>

        {/* Shared controls */}
        <div className="flex flex-wrap items-center gap-3">
          <MicButton isListening={isListening} onStart={startAll} onStop={stopAll} />
          <div className={`rounded-full px-3 py-1 text-sm font-medium ${isListening ? (inTune ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") : "bg-gray-100 text-gray-700"}`}>
            {isListening ? (inTune ? "On Pitch" : "Off Pitch") : "Idle"}
          </div>
          <div className={`rounded-full px-3 py-1 text-sm font-medium ${isListening ? (onBeat ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700") : "bg-gray-100 text-gray-700"}`}>
            {isListening ? (onBeat ? "On Beat" : "Off Beat") : "No Beat"}
          </div>

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800" />

          <div className="flex items-center gap-2">
            <span className="label">Beat Phase (ms)</span>
            <input type="range" min={-200} max={200} step={5} value={phaseMs} onChange={(e) => setPhaseMs(parseInt(e.target.value, 10))} />
            <div className="w-12 text-right font-semibold">{phaseMs}</div>
          </div>

          <div className="flex items-center gap-2">
            <span className="label">Tolerance (¢)</span>
            <input type="range" min={5} max={100} step={1} value={tolerance} onChange={(e) => setTolerance(parseInt(e.target.value, 10))} />
            <div className="w-10 text-right font-semibold">{tolerance}</div>
          </div>
        </div>

        {/* Panels */}
        {tab === "Live Pitch" && (
          <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
            <div className="grid gap-6">
              <NoteCanvas
                height={420}
                bottomMidi={SCALE_BOTTOM_MIDI}
                topMidi={SCALE_TOP_MIDI}
                currentFreq={freq}
                targetMidi={targetMidi}
              />
              <BeatMeter bpm={Math.round(bpm * tempoScale)} onBeat={onBeat} lastBeatAt={lastBeatAt} />
            </div>
            <div className="space-y-4">
              {error && <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-red-700">{error}</div>}
              <PitchDisplay freq={freq} noteName={noteName} cents={cents} tolerance={tolerance} />
              <div className="text-xs text-gray-500 dark:text-gray-400">Tip: Hold a steady vowel (“ah”).</div>
            </div>
          </div>
        )}

        {tab === "Scale Practice" && (
          <ScalePractice
            isListening={isListening}
            currentFreq={freq}
            tolerance={tolerance}
            scaleMidi={scale}
          />
        )}

        {tab === "Phrase Trainer" && (
          <div className="grid gap-6 md:grid-cols-[1.2fr,1fr]">
            <div className="grid gap-6">
              <NoteCanvas
                height={420}
                bottomMidi={SCALE_BOTTOM_MIDI}
                topMidi={SCALE_TOP_MIDI}
                currentFreq={freq}
                targetMidi={null}
              />
              <BeatMeter bpm={Math.round(bpm * tempoScale)} onBeat={onBeat} lastBeatAt={lastBeatAt} />
            </div>
            <div className="space-y-4">
              <Transport song={phrases} bpm={bpm} tempoScale={tempoScale} loop={loop} setLoop={setLoop} />
              <div className="text-xs text-gray-500 dark:text-gray-400">Loop a short phrase and slow it down to learn it.</div>
            </div>
          </div>
        )}

        {tab === "Song Challenge" && (
          <SongChallenge
            isListening={isListening}
            currentFreq={freq}
            tolerance={tolerance}
            keyName={keyName}
            bpm={Math.round(bpm * tempoScale)}
            phaseMs={phaseMs}
            songs={SONGS}
          />
        )}
      </div>
    </main>
  );
}
