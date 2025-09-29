"use client";

const KEYS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

export default function KeySelector({ value, onChange }) {
  return (
    <label className="flex items-center gap-2">
      <span className="label">Key</span>
      <select
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {KEYS.map(k => <option key={k} value={k}>{k} Major</option>)}
      </select>
    </label>
  );
}
