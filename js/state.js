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

function validateState(state) {
  if (!state || typeof state !== 'object') return { ...DEFAULTS };
  
  const validated = { ...DEFAULTS };
  
  // 1. Balance validation
  if (typeof state.balance === 'number' && Number.isFinite(state.balance) && state.balance >= 0) {
    validated.balance = Math.floor(state.balance);
  } else if (typeof state.balance === 'string') {
    const parsedBal = parseInt(state.balance, 10);
    if (!isNaN(parsedBal) && Number.isFinite(parsedBal) && parsedBal >= 0) {
      validated.balance = Math.floor(parsedBal);
    }
  }
  
  // 2. audioMuted
  if (typeof state.audioMuted === 'boolean') {
    validated.audioMuted = state.audioMuted;
  }
  
  // 3. secretUnlocked
  if (typeof state.secretUnlocked === 'boolean') {
    validated.secretUnlocked = state.secretUnlocked;
  }
  
  // 4. rouletteStats
  if (state.rouletteStats && typeof state.rouletteStats === 'object') {
    const stats = state.rouletteStats;
    validated.rouletteStats = {
      spins: typeof stats.spins === 'number' && Number.isFinite(stats.spins) && stats.spins >= 0 ? Math.floor(stats.spins) : DEFAULTS.rouletteStats.spins,
      wins: typeof stats.wins === 'number' && Number.isFinite(stats.wins) && stats.wins >= 0 ? Math.floor(stats.wins) : DEFAULTS.rouletteStats.wins,
      totalWagered: typeof stats.totalWagered === 'number' && Number.isFinite(stats.totalWagered) && stats.totalWagered >= 0 ? Math.floor(stats.totalWagered) : DEFAULTS.rouletteStats.totalWagered,
      totalWon: typeof stats.totalWon === 'number' && Number.isFinite(stats.totalWon) && stats.totalWon >= 0 ? Math.floor(stats.totalWon) : DEFAULTS.rouletteStats.totalWon,
    };
  }
  
  // 5. lastBet
  if (typeof state.lastBet === 'string' || typeof state.lastBet === 'number') {
    validated.lastBet = String(state.lastBet);
  }
  
  // 6. lastSeed
  if (state.lastSeed !== undefined) {
    validated.lastSeed = state.lastSeed;
  }
  
  return validated;
}

function load() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return validateState(parsed);
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
