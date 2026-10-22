/**
 * BOZHEMAN ≡ PROTOCOL
 * State Management Module v3.0
 *
 * Single source of truth for all cross-page persistent state.
 * Uses localStorage with JSON serialization, strict schema validation,
 * cross-tab storage synchronization, and event broadcasting.
 */

const STATE_KEY = 'bzp_state_v2';
const MAX_SAFE = 999999999;

export const ACHIEVEMENTS_CATALOG = Object.freeze({
  FIRST_CONTACT:   { id: 'FIRST_CONTACT',   icon: '⚡', titleKey: 'ach_first_title',   descKey: 'ach_first_desc' },
  CORE_BREAKER:    { id: 'CORE_BREAKER',    icon: '🔓', titleKey: 'ach_core_title',    descKey: 'ach_core_desc' },
  WEAVER_INITIATE: { id: 'WEAVER_INITIATE', icon: '🕸️', titleKey: 'ach_weaver_title',  descKey: 'ach_weaver_desc' },
  HIGH_ROLLER:     { id: 'HIGH_ROLLER',     icon: '💎', titleKey: 'ach_roller_title',  descKey: 'ach_roller_desc' },
  JACKPOT_777:     { id: 'JACKPOT_777',     icon: '🎰', titleKey: 'ach_jackpot_title', descKey: 'ach_jackpot_desc' },
  ICE_HACKER:      { id: 'ICE_HACKER',      icon: '💻', titleKey: 'ach_hacker_title',  descKey: 'ach_hacker_desc' },
  CRYPTO_PATRON:   { id: 'CRYPTO_PATRON',   icon: '🪙', titleKey: 'ach_patron_title',  descKey: 'ach_patron_desc' },
});

const DEFAULTS = {
  balance: 1000,
  audioMuted: true,
  crtEnabled: true,
  secretUnlocked: false,
  turboSpin: false,
  matrixSpeed: 'normal', // 'slow' | 'normal' | 'fast'
  totalClicks3D: 0,
  lastDailyBonus: 0,
  hackClaimed: false,
  weaverClaimed: false,
  subscribedEmail: '',
  rouletteStats: {
    spins: 0,
    wins: 0,
    totalWagered: 0,
    totalWon: 0,
    maxWin: 0,
    currentStreak: 0,
    bestStreak: 0,
  },
  history: [],
  achievements: [],
  lastBet: '10',
  lastSeed: null,
};

function clampInt(val, fallback = 0, min = 0, max = MAX_SAFE) {
  const num = typeof val === 'string' ? parseInt(val, 10) : val;
  if (typeof num === 'number' && Number.isFinite(num) && num >= min) {
    return Math.min(Math.floor(num), max);
  }
  return fallback;
}

function validateState(state) {
  if (!state || typeof state !== 'object') return structuredCloneFallback(DEFAULTS);

  const validated = structuredCloneFallback(DEFAULTS);

  validated.balance = clampInt(state.balance, DEFAULTS.balance, 0, MAX_SAFE);
  if (typeof state.audioMuted === 'boolean') validated.audioMuted = state.audioMuted;
  if (typeof state.crtEnabled === 'boolean') validated.crtEnabled = state.crtEnabled;
  if (typeof state.secretUnlocked === 'boolean') validated.secretUnlocked = state.secretUnlocked;
  if (typeof state.turboSpin === 'boolean') validated.turboSpin = state.turboSpin;
  if (['slow', 'normal', 'fast'].includes(state.matrixSpeed)) validated.matrixSpeed = state.matrixSpeed;

  validated.totalClicks3D = clampInt(state.totalClicks3D, 0, 0, MAX_SAFE);
  validated.lastDailyBonus = clampInt(state.lastDailyBonus, 0, 0, Number.MAX_SAFE_INTEGER);
  if (typeof state.hackClaimed === 'boolean') validated.hackClaimed = state.hackClaimed;
  if (typeof state.weaverClaimed === 'boolean') validated.weaverClaimed = state.weaverClaimed;
  if (typeof state.subscribedEmail === 'string') validated.subscribedEmail = state.subscribedEmail.slice(0, 120);

  if (state.rouletteStats && typeof state.rouletteStats === 'object') {
    const s = state.rouletteStats;
    validated.rouletteStats = {
      spins:         clampInt(s.spins, 0),
      wins:          clampInt(s.wins, 0),
      totalWagered:  clampInt(s.totalWagered, 0),
      totalWon:      clampInt(s.totalWon, 0),
      maxWin:        clampInt(s.maxWin, 0),
      currentStreak: typeof s.currentStreak === 'number' && Number.isFinite(s.currentStreak) ? Math.trunc(s.currentStreak) : 0,
      bestStreak:    clampInt(s.bestStreak, 0),
    };
  }

  if (Array.isArray(state.history)) {
    validated.history = state.history
      .filter(h => h && typeof h === 'object' && typeof h.glyphs === 'string')
      .slice(0, 20)
      .map(h => ({
        glyphs: String(h.glyphs).slice(0, 16),
        bet:    clampInt(h.bet, 10),
        won:    clampInt(h.won, 0),
        mult:   typeof h.mult === 'number' && Number.isFinite(h.mult) ? h.mult : 0,
        time:   typeof h.time === 'string' ? h.time.slice(0, 16) : '',
      }));
  }

  if (Array.isArray(state.achievements)) {
    validated.achievements = Array.from(
      new Set(state.achievements.filter(id => typeof id === 'string' && id in ACHIEVEMENTS_CATALOG))
    );
  }

  if (typeof state.lastBet === 'string' || typeof state.lastBet === 'number') {
    validated.lastBet = String(clampInt(state.lastBet, 10, 10, 99999));
  }

  if (state.lastSeed !== undefined && state.lastSeed !== null) {
    validated.lastSeed = String(state.lastSeed).slice(0, 64);
  }

  return validated;
}

function structuredCloneFallback(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function load() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return structuredCloneFallback(DEFAULTS);
    const parsed = JSON.parse(raw);
    return validateState(parsed);
  } catch {
    return structuredCloneFallback(DEFAULTS);
  }
}

function save(state) {
  const validated = validateState(state);
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(validated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bzp:statechange', { detail: validated }));
    }
  } catch (e) {
    console.warn('[State] localStorage write failed:', e);
  }
  return validated;
}

// Listen for cross-tab changes
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STATE_KEY) {
      window.dispatchEvent(new CustomEvent('bzp:statechange', { detail: load() }));
    }
  });
}

export const State = {
  get() {
    return load();
  },

  set(patch) {
    const current = load();
    const next = { ...current, ...patch };
    return save(next);
  },

  merge(key, patch) {
    const current = load();
    const next = {
      ...current,
      [key]: { ...(current[key] || {}), ...patch },
    };
    return save(next);
  },

  read(key) {
    return load()[key];
  },

  reset() {
    return save(structuredCloneFallback(DEFAULTS));
  },

  recordRound({ wagered, won, glyphs = '', mult = 0 }) {
    const current = load();
    const stats = current.rouletteStats;
    const isWin = won > 0;
    const nextStreak = isWin
      ? (stats.currentStreak > 0 ? stats.currentStreak + 1 : 1)
      : (stats.currentStreak < 0 ? stats.currentStreak - 1 : -1);
    const bestStreak = isWin ? Math.max(stats.bestStreak || 0, nextStreak) : (stats.bestStreak || 0);
    const maxWin = Math.max(stats.maxWin || 0, won);

    const now = new Date();
    const timeStr = now.toTimeString().slice(0, 8);
    const entry = { glyphs, bet: wagered, won, mult, time: timeStr };
    const history = [entry, ...(current.history || [])].slice(0, 20);

    return this.set({
      rouletteStats: {
        spins:         stats.spins + 1,
        wins:          stats.wins + (isWin ? 1 : 0),
        totalWagered:  stats.totalWagered + wagered,
        totalWon:      stats.totalWon + won,
        maxWin,
        currentStreak: nextStreak,
        bestStreak,
      },
      history,
    });
  },

  clearHistory() {
    return this.set({ history: [] });
  },

  getWinRate() {
    const { spins, wins } = load().rouletteStats;
    if (!spins) return 0;
    return Math.round((wins / spins) * 1000) / 10;
  },

  getNetProfit() {
    const { totalWon, totalWagered } = load().rouletteStats;
    return totalWon - totalWagered;
  },

  hasAchievement(id) {
    return load().achievements.includes(id);
  },

  unlockAchievement(id) {
    if (!(id in ACHIEVEMENTS_CATALOG)) return false;
    const current = load();
    if (current.achievements.includes(id)) return false;
    const achievements = [...current.achievements, id];
    save({ ...current, achievements });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bzp:achievement', { detail: ACHIEVEMENTS_CATALOG[id] }));
    }
    return true;
  },

  canClaimDailyBonus() {
    const last = load().lastDailyBonus || 0;
    return (Date.now() - last) >= 24 * 60 * 60 * 1000;
  },

  claimDailyBonus(amount = 500) {
    if (!this.canClaimDailyBonus()) return { ok: false, remainingMs: 24 * 60 * 60 * 1000 - (Date.now() - load().lastDailyBonus) };
    const current = load();
    const nextBalance = current.balance + amount;
    this.set({ balance: nextBalance, lastDailyBonus: Date.now() });
    return { ok: true, balance: nextBalance, amount };
  },

  exportData() {
    try {
      return btoa(encodeURIComponent(JSON.stringify(load())));
    } catch {
      return '';
    }
  },

  importData(encoded) {
    try {
      const json = decodeURIComponent(atob(String(encoded).trim()));
      const parsed = JSON.parse(json);
      save(parsed);
      return true;
    } catch {
      return false;
    }
  },
};
