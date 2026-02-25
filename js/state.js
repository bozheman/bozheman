/**
 * BOZHEMAN ≡ PROTOCOL
 * State Management Module v2.0
 *
 * Single source of truth for all cross-page persistent state.
 * Uses localStorage with JSON serialization.
 * All modules import from here — no page should read localStorage directly.
 */

const STATE_KEY = 'bzp_state_v2';

const DEFAULTS = {
  balance: 1000,
  audioMuted: true,
  secretUnlocked: false,
  rouletteStats: {
    spins: 0,
    wins: 0,
    totalWagered: 0,
    totalWon: 0,
  },
  lastBet: '',
  lastSeed: null,
};

function load() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    // Deep merge: defaults fill missing keys on old saves
    return {
      ...DEFAULTS,
      ...parsed,
      rouletteStats: { ...DEFAULTS.rouletteStats, ...(parsed.rouletteStats || {}) },
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function save(state) {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[State] localStorage write failed:', e);
  }
}

// --- Public API ---

export const State = {
  /**
   * Read the full current state object (snapshot).
   * @returns {object}
   */
  get() {
    return load();
  },

  /**
   * Shallow-merge a patch into the persisted state.
   * @param {Partial<typeof DEFAULTS>} patch
   */
  set(patch) {
    const current = load();
    const next = { ...current, ...patch };
    save(next);
    return next;
  },

  /**
   * Deep-merge a patch into a nested key.
   * @param {string} key   Top-level key (e.g. 'rouletteStats')
   * @param {object} patch
   */
  merge(key, patch) {
    const current = load();
    const next = {
      ...current,
      [key]: { ...(current[key] || {}), ...patch },
    };
    save(next);
    return next;
  },

  /** Shortcut: read a single top-level key */
  read(key) {
    return load()[key];
  },

  /** Hard reset to factory defaults */
  reset() {
    save({ ...DEFAULTS });
  },

  /** Update roulette stats after a round */
  recordRound({ wagered, won }) {
    const stats = load().rouletteStats;
    this.merge('rouletteStats', {
      spins: stats.spins + 1,
      wins: stats.wins + (won > 0 ? 1 : 0),
      totalWagered: stats.totalWagered + wagered,
      totalWon: stats.totalWon + won,
    });
  },
};
