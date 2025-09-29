"use client";

export default function MicButton({ isListening, onStart, onStop }) {
  return (
    <button
      className={`button ${isListening ? "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700" : "button-primary"}`}
      onClick={isListening ? onStop : onStart}
      aria-pressed={isListening}
    >
      {isListening ? "Stop" : "Start"}
    </button>
  );
}
