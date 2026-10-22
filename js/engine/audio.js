/**
 * BOZHEMAN ≡ 777  —  Procedural Cyber Audio Engine v3.0
 * Uses Web Audio API with master limiter, automatic mute state check,
 * and node cleanup to synthesize cyberpunk UI & slot machine sounds.
 */

import { State } from '../state.js';

let ctx = null;
let masterBus = null;

function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-16, ctx.currentTime);
    compressor.knee.setValueAtTime(20, ctx.currentTime);
    compressor.ratio.setValueAtTime(8, ctx.currentTime);
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);
    compressor.release.setValueAtTime(0.15, ctx.currentTime);

    masterBus = ctx.createGain();
    masterBus.gain.setValueAtTime(0.85, ctx.currentTime);
    masterBus.connect(compressor);
    compressor.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

function tone(freq, type, dur, gainVal, delay = 0, freqEnd = null) {
  if (State.get().audioMuted) return;
  try {
    const ac = getCtx();
    if (!ac || !masterBus) return;
    const startTime = ac.currentTime + delay;
    const stopTime  = startTime + dur;

    const osc  = ac.createOscillator();
    const gain = ac.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    if (freqEnd !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), stopTime);
    }

    gain.gain.setValueAtTime(Math.max(0.0001, gainVal), startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, stopTime);

    osc.connect(gain);
    gain.connect(masterBus);

    osc.onended = () => {
      try {
        osc.disconnect();
        gain.disconnect();
      } catch { /* ignore */ }
    };

    osc.start(startTime);
    osc.stop(stopTime + 0.02);
  } catch { /* silently ignore audio errors */ }
}

export const AudioEngine = {
  click() {
    tone(240, 'square', 0.045, 0.11, 0, 160);
  },
  tick() {
    tone(920, 'square', 0.025, 0.05);
  },
  hover() {
    tone(1240, 'sine', 0.02, 0.035, 0, 1480);
  },
  terminalKey() {
    const jitter = 680 + Math.random() * 240;
    tone(jitter, 'triangle', 0.018, 0.04);
  },
  reelTick() {
    tone(320 + Math.random() * 60, 'triangle', 0.022, 0.045);
  },
  cyberPulse(step = 1) {
    const base = 220 + Math.min(step, 10) * 65;
    tone(base, 'sawtooth', 0.09, 0.16, 0, base * 1.35);
    tone(base * 0.5, 'square', 0.11, 0.10, 0.02);
  },
  copy() {
    tone(660, 'sine', 0.06, 0.12, 0);
    tone(990, 'sine', 0.09, 0.14, 0.06);
  },
  modalOpen() {
    tone(220, 'sine', 0.12, 0.10, 0, 660);
  },
  modalClose() {
    tone(540, 'sine', 0.10, 0.09, 0, 180);
  },
  spinStart() {
    tone(160, 'sawtooth', 0.35, 0.14, 0, 320);
    tone(280, 'sawtooth', 0.28, 0.10, 0.12, 480);
  },
  snap() {
    tone(480, 'square', 0.06, 0.18, 0, 240);
    tone(140, 'triangle', 0.10, 0.16, 0.04);
  },
  win() {
    [[523.25, 0], [659.25, 0.09], [783.99, 0.18], [1046.5, 0.27]].forEach(([f, d]) =>
      tone(f, 'sine', 0.24, 0.20, d)
    );
  },
  jackpot() {
    [[523.25, 0], [659.25, 0.07], [783.99, 0.14], [1046.5, 0.21], [1318.5, 0.28], [1567.98, 0.35], [2093, 0.44]].forEach(([f, d]) => {
      tone(f, 'sine', 0.36, 0.24, d);
      tone(f * 0.5, 'triangle', 0.32, 0.12, d + 0.02);
    });
  },
  achievement() {
    [[440, 0], [554.37, 0.08], [659.25, 0.16], [880, 0.24]].forEach(([f, d]) =>
      tone(f, 'triangle', 0.22, 0.18, d)
    );
  },
  lose() {
    tone(220, 'sawtooth', 0.15, 0.16, 0, 170);
    tone(175, 'sawtooth', 0.22, 0.14, 0.12, 110);
  },
  error() {
    tone(150, 'square', 0.09, 0.15);
    tone(120, 'square', 0.11, 0.15, 0.09);
  },
  glitch() {
    for (let i = 0; i < 8; i++) {
      const freq = 90 + Math.random() * 920;
      tone(freq, i % 2 === 0 ? 'sawtooth' : 'square', 0.05, 0.22, i * 0.045);
    }
  },
};
