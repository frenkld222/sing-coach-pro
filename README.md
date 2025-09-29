# Sing Coach Pro — Pitch, Beat & Song Challenge (MVP)

A browser-only Next.js app that:
- Detects **pitch** in real time (YIN via `pitchfinder`)
- Shows a **vertical pitch scale** with your live trace (TikTok-style)
- Finds the **nearest chromatic note** and **cents** error
- Has a **metronome** with simple **on-beat** detection
- Includes **Scale Practice**, **Phrase Trainer**, and **Song Challenge** with grading

## Stack
- Next.js (App Router) + React + Tailwind
- Web Audio API (mic input + simple click synth)
- `pitchfinder` for f0

## Dev
```bash
npm install
npm run dev
