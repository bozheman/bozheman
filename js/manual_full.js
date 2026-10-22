// manual_full.js – Handles full manual page interactions, Matrix rain, HUD & Harvest Calculator
import { setupMatrix } from './matrix.js';
import { applyTranslations } from './i18n.js';
import { initHUD } from './hud.js';
import { AudioEngine } from './engine/audio.js';

setupMatrix('matrix-canvas');
initHUD();

const closeBtn = document.getElementById('close-full-manual');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    AudioEngine.click();
    window.location.href = 'games.html';
  });
}

// Interactive Harvest & Mendel Genetics Simulator
const strainEl = document.getElementById('calc-strain');
const hpEl     = document.getElementById('calc-hp');
const streakEl = document.getElementById('calc-streak');
const lightEl  = document.getElementById('calc-light');
const outputEl = document.getElementById('calc-output');

function computeHarvest() {
  if (!strainEl || !hpEl || !streakEl || !lightEl || !outputEl) return;
  const strainMult = parseFloat(strainEl.value) || 1.0;
  const hp         = Math.max(10, Math.min(100, parseInt(hpEl.value, 10) || 95));
  const streak     = Math.max(0, Math.min(30, parseInt(streakEl.value, 10) || 0));
  const lightMult  = parseFloat(lightEl.value) || 1.0;

  const baseGrams  = 85;
  const streakBonus = 1 + (streak * 0.045);
  const biomass = Math.round(baseGrams * strainMult * (hp / 100) * streakBonus * lightMult);
  const thc = (16.5 * Math.pow(strainMult, 0.35) * (0.7 + 0.3 * (hp / 100)) + streak * 0.25).toFixed(1);
  const cupScore = Math.round(biomass * 3.2 + parseFloat(thc) * 14 + streak * 18);

  outputEl.textContent = `ESTIMATED BIOMASS: ${biomass}g | THC: ${thc}% | CUP SCORE: ${cupScore} PTS`;
}

[strainEl, hpEl, streakEl, lightEl].forEach(el => {
  if (el) {
    el.addEventListener('input', () => {
      AudioEngine.terminalKey();
      computeHarvest();
    });
    el.addEventListener('change', computeHarvest);
  }
});

computeHarvest();

document.addEventListener('languagechange', () => {
  applyTranslations();
});
