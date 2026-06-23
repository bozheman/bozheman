/**
 * BOZHEMAN ≡ 777  —  Slot Machine Constants
 */

export const SYMBOLS = [
  { id: 'seven',    glyph: '7',  color: '#ff3333', glow: '#ff0000', weight: 4  },
  { id: 'star',     glyph: '★',  color: '#ffd700', glow: '#ffaa00', weight: 7  },
  { id: 'omega',    glyph: 'Ω',  color: '#cc66ff', glow: '#aa00ff', weight: 9  },
  { id: 'triangle', glyph: '▲',  color: '#00ccff', glow: '#0088ff', weight: 12 },
  { id: 'square',   glyph: '■',  color: '#ff6699', glow: '#ff0066', weight: 14 },
  { id: 'dash',     glyph: '—',  color: '#555566', glow: '#334',    weight: 18 },
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
