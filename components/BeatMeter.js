"use client";

export default function BeatMeter({ bpm, onBeat }) {
  return (
    <div className="flex items-center gap-4">
      <div className={`relative h-14 w-14 rounded-full border-2 ${onBeat ? "border-emerald-500" : "border-gray-300 dark:border-gray-700"}`}>
        <div className={`absolute inset-1 rounded-full ${onBeat ? "bg-emerald-400/50 animate-pulseBeat" : "bg-gray-200 dark:bg-gray-800"}`} />
      </div>
      <div className="text-sm">
        <div className="label">Beat</div>
        <div className="font-semibold">{bpm} BPM</div>
        <div className={`text-xs ${onBeat ? "text-emerald-600" : "text-amber-600"}`}>
          {onBeat ? "On Beat" : "Try to hit the pulse"}
        </div>
      </div>
    </div>
  );
}
