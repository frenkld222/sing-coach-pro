// Simple onset detection + metronome / beat alignment for MVP

export class OnsetDetector {
  constructor(sampleRate) {
    this.sampleRate = sampleRate;
    this.prevRms = 0;
    this.cooldown = 0;
    this.minGapSamples = Math.floor(0.09 * sampleRate); // 90ms
    this.thresholdUp = 1.8;
    this.ema = 0;
    this.emaAlpha = 0.1;
  }

  pushBuffer(buf) {
    let sum = 0;
    for (let i = 0; i < buf.length; i++) {
      const v = buf[i];
      sum += v * v;
    }
    const rms = Math.sqrt(sum / buf.length);

    if (this.ema === 0) this.ema = rms;
    else this.ema = this.ema + this.emaAlpha * (rms - this.ema);

    const risingFast = rms > (this.ema * this.thresholdUp);
    const onset = (risingFast && this.cooldown <= 0);
    if (onset) {
      this.cooldown = this.minGapSamples;
      return true;
    } else {
      this.cooldown = Math.max(0, this.cooldown - buf.length);
      return false;
    }
  }
}

export class BeatScheduler {
  constructor(audioCtx, { bpm = 90, phaseMs = 0, clickEnabled = true, onBeat = () => {} } = {}) {
    this.audioCtx = audioCtx;
    this.bpm = bpm;
    this.phaseMs = phaseMs;
    this.onBeat = onBeat;
    this.clickEnabled = clickEnabled;

    this.interval = 60 / bpm; // seconds
    this.nextTime = null;

    this.clickGain = audioCtx.createGain();
    this.clickGain.gain.value = 0.0;
    this.clickGain.connect(audioCtx.destination);
  }

  _scheduleClick(t) {
    if (!this.clickEnabled) return;
    const osc = this.audioCtx.createOscillator();
    const g = this.audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = 2000;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + 0.001);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    osc.connect(g);
    g.connect(this.audioCtx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  start() {
    const now = this.audioCtx.currentTime;
    this.nextTime = now + 0.05;
    this._loopId = setInterval(() => this._tick(), 25);
  }

  stop() {
    clearInterval(this._loopId);
  }

  update({ bpm, phaseMs }) {
    if (typeof bpm === "number" && bpm > 0 && bpm !== this.bpm) {
      this.bpm = bpm;
      this.interval = 60 / bpm;
    }
    if (typeof phaseMs === "number") {
      this.phaseMs = phaseMs;
    }
  }

  _tick() {
    const { audioCtx } = this;
    if (this.nextTime == null) return;
    const lookAhead = 0.1;
    const now = audioCtx.currentTime;

    while (this.nextTime < now + lookAhead) {
      const phaseSec = this.phaseMs / 1000;
      const t = this.nextTime + phaseSec;
      this._scheduleClick(t);
      this.onBeat(t);
      this.nextTime += this.interval;
    }
  }

  nearestBeatTimeMs(nowMs) {
    const periodMs = 60000 / this.bpm;
    const phaseMs = this.phaseMs;
    const n = Math.round((nowMs - phaseMs) / periodMs);
    return n * periodMs + phaseMs;
  }
}
