/**
 * BOZHEMAN ≡ 777  —  Audio Engine Module
 * Uses Web Audio API to synthesize retro slot machine sounds.
 */

let ctx = null;

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  return ctx;
}

function tone(freq, type, dur, gainVal, delay = 0) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ac.currentTime + delay);
    gain.gain.setValueAtTime(gainVal, ac.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + delay + dur);
    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + dur + 0.05);
  } catch { /* silently fail */ }
}

export const AudioEngine = {
  click()    { tone(220, 'square', 0.05, 0.12); },
  tick()     { tone(880, 'square', 0.03, 0.06); },
  spinStart(){ tone(180, 'sawtooth', 0.4, 0.15); tone(280, 'sawtooth', 0.3, 0.1, 0.15); },
  snap()     { tone(440, 'square', 0.08, 0.2); tone(220, 'square', 0.12, 0.15, 0.06); },
  win() {
    [[523.25,0],[659.25,0.1],[783.99,0.2],[1046.5,0.3]].forEach(([f,d]) =>
      tone(f,'sine',0.25,0.22,d));
  },
  jackpot() {
    [[523,0],[659,0.07],[784,0.14],[1047,0.21],[1319,0.28],[1568,0.35],[2093,0.45]].forEach(([f,d]) =>
      tone(f,'sine',0.35,0.28,d));
  },
  lose() {
    tone(220, 'sawtooth', 0.15, 0.18);
    tone(180, 'sawtooth', 0.2,  0.14, 0.12);
  },
  error() { tone(160, 'square', 0.1, 0.15); },
  glitch() {
    [[300, 0], [150, 0.05], [800, 0.1], [120, 0.15], [950, 0.2], [200, 0.25], [60, 0.3]].forEach(([f, d]) =>
      tone(f, 'sawtooth', 0.06, 0.25, d));
  },
};

