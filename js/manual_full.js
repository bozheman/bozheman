// manual_full.js – Full GrowerSim (@GrowerSim_bot) Manual & Mendel Genetics Lab Simulator
import { setupMatrix } from './matrix.js';
import { t, applyTranslations } from './i18n.js';
import { State } from './state.js';
import { initHUD, appendLog } from './hud.js';
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

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && document.activeElement?.tagName !== 'INPUT') {
    window.location.href = 'games.html';
  }
});

// ─── Copy @GrowerSim_bot Link Button ───────────────────────────────────────
const copyBotBtn = document.getElementById('copy-manual-bot-btn');
if (copyBotBtn) {
  copyBotBtn.addEventListener('click', async () => {
    AudioEngine.copySuccess();
    try {
      await navigator.clipboard.writeText('https://t.me/GrowerSim_bot');
    } catch { /* fallback */ }
    const orig = copyBotBtn.textContent;
    copyBotBtn.textContent = t('qr_bot_copied');
    appendLog('> COPIED: https://t.me/GrowerSim_bot', 'highlight');
    setTimeout(() => {
      copyBotBtn.textContent = orig;
    }, 2200);
  });
}

// ─── Manual Section Search Filter ──────────────────────────────────────────
const manualSearch = document.getElementById('manual-search');
const fullTabs     = document.querySelectorAll('.full-tab');

if (manualSearch) {
  manualSearch.addEventListener('input', () => {
    AudioEngine.terminalKey();
    const q = manualSearch.value.trim().toLowerCase();
    fullTabs.forEach(sec => {
      const txt = sec.textContent.toLowerCase();
      sec.style.display = (!q || txt.includes(q)) ? 'flex' : 'none';
    });
  });
}

// ─── Interactive Harvest & Mendel Genetics Simulator ───────────────────────
const strainEl   = document.getElementById('calc-strain');
const hpEl       = document.getElementById('calc-hp');
const streakEl   = document.getElementById('calc-streak');
const lightEl    = document.getElementById('calc-light');

const lblBiomass = document.getElementById('lbl-biomass');
const valBiomass = document.getElementById('val-biomass');
const barBiomass = document.getElementById('bar-biomass');

const lblThc     = document.getElementById('lbl-thc');
const valThc     = document.getElementById('val-thc');
const barThc     = document.getElementById('bar-thc');

const lblBman    = document.getElementById('lbl-bman');
const valBman    = document.getElementById('val-bman');
const barBman    = document.getElementById('bar-bman');

const lblCup     = document.getElementById('lbl-cup');
const valCup     = document.getElementById('val-cup');
const barCup     = document.getElementById('bar-cup');

const mutationEl = document.getElementById('calc-mutation');

// Restore saved calculator settings from State
const savedCalc = State.read('calcSettings');
if (savedCalc && typeof savedCalc === 'object') {
  if (strainEl && savedCalc.strain) strainEl.value = savedCalc.strain;
  if (hpEl && savedCalc.hp !== undefined) hpEl.value = String(savedCalc.hp);
  if (streakEl && savedCalc.streak !== undefined) streakEl.value = String(savedCalc.streak);
  if (lightEl && savedCalc.light) lightEl.value = savedCalc.light;
}

function claimScholarRewardIfFirstTime() {
  State.unlockAchievement('GROWER_SCHOLAR');
  if (!State.read('scholarClaimed')) {
    const newBal = State.adjustBalance(200);
    State.set({ scholarClaimed: true });
    AudioEngine.winSmall();
    appendLog(`> GROWER_SCHOLAR UNLOCKED: +200 COINS (BAL: ${newBal})`, 'highlight');
  }
}

function computeHarvest(saveToState = false) {
  if (!strainEl || !hpEl || !streakEl || !lightEl) return;
  const strainMult = parseFloat(strainEl.value) || 1.0;
  const hp         = Math.max(10, Math.min(100, parseInt(hpEl.value, 10) || 95));
  const streak     = Math.max(0, Math.min(30, parseInt(streakEl.value, 10) || 0));
  const lightMult  = parseFloat(lightEl.value) || 1.0;

  if (saveToState) {
    State.set({
      calcSettings: {
        strain: String(strainEl.value),
        hp,
        streak,
        light: String(lightEl.value)
      }
    });
    claimScholarRewardIfFirstTime();
  }

  const baseGrams   = 85;
  const streakBonus = 1 + (streak * 0.045);
  const biomass     = Math.round(baseGrams * strainMult * (hp / 100) * streakBonus * lightMult);
  const thcNum      = 16.5 * Math.pow(strainMult, 0.35) * (0.7 + 0.3 * (hp / 100)) + streak * 0.25;
  const thc         = thcNum.toFixed(1);
  const cupScore    = Math.round(biomass * 3.2 + thcNum * 14 + streak * 18);
  const bmanValue   = Math.round(biomass * 1.85 + (strainMult >= 3.0 ? 350 : strainMult * 65) + streak * 12);
  const mutChance   = Math.min(35, (5.0 + streak * 0.65 + (lightMult > 1.3 ? 4.5 : 1.0))).toFixed(1);

  if (lblBiomass) lblBiomass.textContent = t('calc_res_biomass', { val: biomass }).split(':')[0] || 'BIOMASS';
  if (valBiomass) valBiomass.textContent = `${biomass} g`;
  if (barBiomass) barBiomass.style.width = `${Math.min(100, Math.round((biomass / 950) * 100))}%`;

  if (lblThc) lblThc.textContent = t('calc_res_thc', { val: thc }).split(':')[0] || 'THC';
  if (valThc) valThc.textContent = `${thc}%`;
  if (barThc) barThc.style.width = `${Math.min(100, Math.round((thcNum / 36) * 100))}%`;

  if (lblBman) lblBman.textContent = t('calc_res_bman', { val: bmanValue }).split(':')[0] || 'P2P BMAN';
  if (valBman) valBman.textContent = `${bmanValue} BMAN`;
  if (barBman) barBman.style.width = `${Math.min(100, Math.round((bmanValue / 2200) * 100))}%`;

  if (lblCup) lblCup.textContent = t('calc_res_cup', { val: cupScore }).split(':')[0] || 'CUP SCORE';
  if (valCup) valCup.textContent = `${cupScore} PTS`;
  if (barCup) barCup.style.width = `${Math.min(100, Math.round((cupScore / 3600) * 100))}%`;

  if (mutationEl) {
    mutationEl.textContent = t('calc_res_mutation', { val: mutChance });
  }
}

[strainEl, hpEl, streakEl, lightEl].forEach(el => {
  if (el) {
    el.addEventListener('input', () => {
      AudioEngine.terminalKey();
      computeHarvest(true);
    });
    el.addEventListener('change', () => computeHarvest(true));
  }
});

// Preset buttons
document.querySelectorAll('.calc-preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    AudioEngine.click();
    const preset = btn.dataset.preset;
    if (preset === 'starter') {
      if (strainEl) strainEl.value = '1.0';
      if (hpEl) hpEl.value = '85';
      if (streakEl) streakEl.value = '3';
      if (lightEl) lightEl.value = '1.0';
    } else if (preset === 'pro') {
      if (strainEl) strainEl.value = '1.8';
      if (hpEl) hpEl.value = '98';
      if (streakEl) streakEl.value = '14';
      if (lightEl) lightEl.value = '1.25';
    } else if (preset === 'quantum') {
      if (strainEl) strainEl.value = '3.0';
      if (hpEl) hpEl.value = '100';
      if (streakEl) streakEl.value = '30';
      if (lightEl) lightEl.value = '1.6';
    } else {
      if (strainEl) strainEl.value = '1.0';
      if (hpEl) hpEl.value = '95';
      if (streakEl) streakEl.value = '7';
      if (lightEl) lightEl.value = '1.0';
    }
    computeHarvest(true);
  });
});

computeHarvest(false);

document.addEventListener('languagechange', () => {
  applyTranslations();
  computeHarvest(false);
});
