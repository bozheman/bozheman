/**
 * BOZHEMAN ≡ 777  —  Slot Machine Constants (Pure Red-Neon Theme)
 */

export const SYMBOLS = [
  { id: 'seven',    glyph: '7',  color: '#ff3333', glow: '#ff0000', weight: 4  },
  { id: 'star',     glyph: '★',  color: '#ff4d4d', glow: '#ff3333', weight: 7  },
  { id: 'omega',    glyph: 'Ω',  color: '#cc0000', glow: '#a30000', weight: 9  },
  { id: 'triangle', glyph: '▲',  color: '#ff1a1a', glow: '#e60000', weight: 12 },
  { id: 'square',   glyph: '■',  color: '#b30000', glow: '#800000', weight: 14 },
  { id: 'dash',     glyph: '—',  color: '#660000', glow: '#330000', weight: 18 },
];

export const SYMBOL_POOL = (() => {
  const pool = [];
  for (const sym of SYMBOLS) {
    for (let i = 0; i < sym.weight; i++) pool.push(sym);
  }
  return pool;
})();

export const PAY_TABLE = {
  seven:    10,
  star:      7,
  omega:     5,
  triangle:  3,
  square:    2,
  dash:      0,   // no win for three dashes
};

export const PAIR_MULT = 1.5; // any two matching (not dashes) on a line
