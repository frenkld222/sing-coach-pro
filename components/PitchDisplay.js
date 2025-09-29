"use client";

export default function PitchDisplay({ freq, noteName, cents, tolerance }) {
  const color =
    cents == null
      ? "text-gray-500"
      : Math.abs(cents) <= tolerance
      ? "text-green-600"
      : "text-red-600";

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="label">Nearest Note</div>
        <div className="mt-1 text-3xl font-semibold">{noteName ?? "—"}</div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="label">Frequency (Hz)</div>
        <div className="mt-1 text-3xl font-semibold">{freq ? freq.toFixed(1) : "—"}</div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="label">Cents Error</div>
        <div className={`mt-1 text-3xl font-semibold ${color}`}>
          {cents == null ? "—" : `${cents > 0 ? "+" : ""}${cents.toFixed(0)}¢`}
        </div>
      </div>
    </div>
  );
}
