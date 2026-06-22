/**
 * BOZHEMAN ≡ 777  —  Slot Machine Engine v3.0
 * ============================================
 * Architecture:
 *  - State Machine  : IDLE → SPINNING → EVALUATING → REWARDING → IDLE
 *  - Canvas Reels   : Each reel is an offscreen canvas strip rendered via rAF
 *  - Particle System: Canvas overlay for win celebrations
 *  - Audio          : Web Audio API tones (no external files needed)
 *  - State          : Persistent via localStorage (State module)
 *
 * Modules (self-contained in this file for single-script simplicity,
 *           but structured for easy extraction into separate ES6 modules):
 *  MatrixBackground, ReelEngine, ParticleSystem, AudioEngine, SlotMachine
 */

// ─────────────────────────────────────────────
// 0.  State Import  (inline fallback so the file
//     works even if js/state.js isn't loaded)
// ─────────────────────────────────────────────
let _State;
try {
  const mod = await import('./state.js');
  _State = mod.State;
} catch {
  // Inline fallback identical to state.js logic
  const KEY = 'bzp_state_v2';
  const DEFS = {
    balance: 1000, audioMuted: true, secretUnlocked: false,
    rouletteStats: { spins:0, wins:0, totalWagered:0, totalWon:0 }, lastBet: '',
  };
  _State = {
    get() { try { return { ...DEFS, ...JSON.parse(localStorage.getItem(KEY)||'{}'), rouletteStats:{...DEFS.rouletteStats,...(JSON.parse(localStorage.getItem(KEY)||'{}').rouletteStats||{})} }; } catch { return {...DEFS}; } },
    set(p) { const s={...this.get(),...p}; localStorage.setItem(KEY,JSON.stringify(s)); return s; },
    merge(k,p){ const s=this.get(); s[k]={...(s[k]||{}),...p}; localStorage.setItem(KEY,JSON.stringify(s)); return s; },
    read(k){ return this.get()[k]; },
    recordRound({wagered,won}){ const st=this.get().rouletteStats; this.merge('rouletteStats',{spins:st.spins+1,wins:st.wins+(won>0?1:0),totalWagered:st.totalWagered+wagered,totalWon:st.totalWon+won}); },
  };
}
const State = _State;


// ─────────────────────────────────────────────
// 1.  SYMBOL DEFINITIONS
// ─────────────────────────────────────────────
const SYMBOLS = [
  { id: 'seven',    glyph: '7',  color: '#ff3333', glow: '#ff0000', weight: 4  },
  { id: 'star',     glyph: '★',  color: '#ffd700', glow: '#ffaa00', weight: 7  },
  { id: 'omega',    glyph: 'Ω',  color: '#cc66ff', glow: '#aa00ff', weight: 9  },
  { id: 'triangle', glyph: '▲',  color: '#00ccff', glow: '#0088ff', weight: 12 },
  { id: 'square',   glyph: '■',  color: '#ff6699', glow: '#ff0066', weight: 14 },
  { id: 'dash',     glyph: '—',  color: '#555566', glow: '#334',    weight: 18 },
];

// Build weighted pool
const SYMBOL_POOL = (() => {
  const pool = [];
  for (const sym of SYMBOLS) {
    for (let i = 0; i < sym.weight; i++) pool.push(sym);
  }
  return pool;
})();

// Pay table: key = symbol id, value = multiplier for 3-of-a-kind
const PAY_TABLE = {
  seven:    10,
  star:      7,
  omega:     5,
  triangle:  3,
  square:    2,
  dash:      0,   // no win for three dashes
};
const PAIR_MULT = 1.5; // any two matching (not dashes) on a line

// ─────────────────────────────────────────────
// 2.  AUDIO ENGINE  (Web Audio API, no files)
// ─────────────────────────────────────────────
const AudioEngine = (() => {
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

  return {
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
  };
})();


// ─────────────────────────────────────────────
// 3.  MATRIX BACKGROUND
// ─────────────────────────────────────────────
import { setupMatrix } from './matrix.js';
setupMatrix('matrix-canvas');


// ─────────────────────────────────────────────
// 4.  PARTICLE SYSTEM
// ─────────────────────────────────────────────
const ParticleSystem = (() => {
  const canvas = document.getElementById('particle-canvas');
  const ctx    = canvas.getContext('2d');
  let   particles = [];
  let   rafId = null;
  let   active = false;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  class Particle {
    constructor(jackpot) {
      this.x   = Math.random() * canvas.width;
      this.y   = Math.random() * canvas.height * 0.6;
      this.vx  = (Math.random() - 0.5) * (jackpot ? 6 : 3.5);
      this.vy  = -(Math.random() * (jackpot ? 9 : 5) + 2);
      this.gravity = jackpot ? 0.18 : 0.12;
      this.size = Math.random() * (jackpot ? 10 : 6) + 3;
      this.life = 1.0;
      this.decay = Math.random() * 0.018 + 0.012;
      const palette = jackpot
        ? ['#ffd700','#ff00de','#ff3333','#ffffff','#00ff88']
        : ['#ff3333','#ff00de','#ffffff','#ff6699'];
      this.color = palette[Math.floor(Math.random() * palette.length)];
      this.shape = Math.random() > 0.5 ? 'circle' : 'rect';
      this.rot   = Math.random() * Math.PI * 2;
      this.rotV  = (Math.random() - 0.5) * 0.12;
    }
    update() {
      this.vy  += this.gravity;
      this.x   += this.vx;
      this.y   += this.vy;
      this.life -= this.decay;
      this.rot  += this.rotV;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.life);
      ctx.fillStyle   = this.color;
      ctx.shadowBlur  = 8;
      ctx.shadowColor = this.color;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rot);
      if (this.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      }
      ctx.restore();
    }
  }

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.update(); p.draw(); });
    if (particles.length > 0) {
      rafId = requestAnimationFrame(loop);
    } else {
      active = false;
      canvas.classList.remove('active');
    }
  }

  return {
    burst(count = 80, jackpot = false) {
      canvas.classList.add('active');
      for (let i = 0; i < count; i++) particles.push(new Particle(jackpot));
      if (!active) {
        active = true;
        if (rafId) cancelAnimationFrame(rafId);
        loop();
      }
    },
    stop() {
      particles = [];
      if (rafId) cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.classList.remove('active');
      active = false;
    },
  };
})();


// ─────────────────────────────────────────────
// 5.  CANVAS REEL ENGINE
// ─────────────────────────────────────────────
/**
 * Each reel is a <canvas> element.
 * The reel strip is drawn as a continuous vertical tape.
 * During spin: `velocity` drives `offset` which is the pixel scroll position.
 * Easing to final snap uses a spring-like deceleration curve.
 */
class ReelEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number}            delayMs  staggered start delay
   */
  constructor(canvas, delayMs = 0) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.delay    = delayMs;

    // Layout
    this.SYMBOL_H = 0; // set in resize()
    this.STRIP_LEN = SYMBOLS.length * 3; // 3 full cycles on the strip

    // Reel strip (pre-shuffled sequence repeated)
    this.strip = this._buildStrip();

    // Render state
    this.offset   = 0;      // current scroll offset in px (float)
    this.velocity = 0;      // px/frame
    this.targetOffset = 0;  // where we want to land
    this.finalSymbolIndex = 0;

    // State
    this.spinning  = false;
    this.snapping  = false;
    this.settled   = false;
    this.rafId     = null;
    this.onSettle  = null; // callback when snapped

    // Visual extras
    this.blurAmount = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize(), { passive: true });
    this._loop();
  }

  _buildStrip() {
    // Build a shuffled strip of length STRIP_LEN
    const arr = [];
    for (let i = 0; i < this.STRIP_LEN; i++) {
      arr.push(SYMBOLS[i % SYMBOLS.length]);
    }
    // Shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  resize() {
    const wrap   = this.canvas.parentElement;
    const w      = wrap.clientWidth;
    const h      = wrap.clientHeight;
    this.canvas.width  = w;
    this.canvas.height = h;
    this.SYMBOL_H = h;
    this.TOTAL_H  = this.SYMBOL_H * this.strip.length;
    this._render();
  }

  /** Spin: accelerate to full velocity, then coast, then snap to target */
  spin(targetSymbol, onSettle) {
    this.settled   = false;
    this.snapping  = false;
    this.onSettle  = onSettle;
    this.finalSymbolIndex = this.strip.findIndex(s => s.id === targetSymbol.id);
    if (this.finalSymbolIndex < 0) this.finalSymbolIndex = 0;

    // Delay stagger
    setTimeout(() => {
      this.spinning = true;
      this.velocity = 45 + Math.random() * 12; // px/frame ≈ ≈75fps target
    }, this.delay);
  }

  _resolveSnap() {
    // Target offset: the symbol at finalSymbolIndex should be centred in viewport
    const centreY = this.canvas.height / 2;
    const symCentre = (this.finalSymbolIndex + 0.5) * this.SYMBOL_H;
    // We want: offset such that symCentre - offset == centreY
    // => offset = symCentre - centreY
    // Add enough full rotations so target > current (always scroll forward)
    let target = symCentre - centreY;
    const fullRotation = this.TOTAL_H;
    while (target < this.offset + fullRotation * 1.5) target += fullRotation;
    this.targetOffset = target;
  }

  _loop() {
    this.rafId = requestAnimationFrame(() => this._loop());
    this._tick();
    this._render();
  }

  _tick() {
    if (this.settled) return;

    if (this.spinning && !this.snapping) {
      this.offset    += this.velocity;
      this.blurAmount = Math.min(this.velocity * 0.6, 18);
      // Coast for a bit, then resolve snap point and start decelerating
      // Snap trigger: externally via snapNow()
    } else if (this.snapping) {
      const dist  = this.targetOffset - this.offset;
      const speed = dist * 0.14; // proportional convergence (ease-out spring)
      this.offset    += speed;
      this.blurAmount = Math.abs(speed) * 0.5;

      if (Math.abs(dist) < 0.8) {
        this.offset     = this.targetOffset;
        this.velocity   = 0;
        this.blurAmount = 0;
        this.snapping   = false;
        this.spinning   = false;
        this.settled    = true;
        if (this.onSettle) this.onSettle();
      }
    }

    // Wrap offset to prevent float overflow over very long sessions
    if (this.offset > this.TOTAL_H * 10) {
      this.offset     -= this.TOTAL_H;
      this.targetOffset -= this.TOTAL_H;
    }
  }

  snapNow() {
    if (!this.spinning || this.snapping || this.settled) return;
    this._resolveSnap();
    this.snapping = true;
  }

  _render() {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Simulated motion blur via repeated semi-transparent frames
    if (this.blurAmount > 2) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      const blurOffset = this.blurAmount * 0.5;
      this._drawStrip(ctx, W, H, this.offset - blurOffset);
      ctx.globalAlpha = 0.2;
      this._drawStrip(ctx, W, H, this.offset - blurOffset * 2);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    this._drawStrip(ctx, W, H, this.offset);
  }

  _drawStrip(ctx, W, H, offset) {
    const symH   = this.SYMBOL_H;
    const total  = this.TOTAL_H;

    // Normalise offset into [0, total)
    const normOffset = ((offset % total) + total) % total;

    // Figure out which symbol is at the top of the viewport
    const startIdx = Math.floor(normOffset / symH);
    const startY   = -(normOffset % symH);

    for (let i = 0; i < Math.ceil(H / symH) + 2; i++) {
      const idx = (startIdx + i) % this.strip.length;
      const sym = this.strip[idx];
      const y   = startY + i * symH;

      this._drawSymbol(ctx, sym, W, y, symH);
    }
  }

  _drawSymbol(ctx, sym, W, y, H) {
    // Background cell
    const gradient = ctx.createLinearGradient(0, y, 0, y + H);
    gradient.addColorStop(0,   'rgba(0,0,0,0.0)');
    gradient.addColorStop(0.5, 'rgba(20,0,0,0.18)');
    gradient.addColorStop(1,   'rgba(0,0,0,0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y, W, H);

    // Glyph
    const fontSize = Math.floor(H * 0.55);
    ctx.font        = `700 ${fontSize}px "Fira Code", monospace`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';

    // Glow
    ctx.shadowBlur  = this.settled ? 18 : 6;
    ctx.shadowColor = sym.glow;

    ctx.fillStyle = sym.color;
    ctx.fillText(sym.glyph, W / 2, y + H / 2);

    // Reset shadow
    ctx.shadowBlur = 0;
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
  }
}


// ─────────────────────────────────────────────
// 6.  SLOT MACHINE — STATE MACHINE
// ─────────────────────────────────────────────
const GameState = Object.freeze({
  IDLE:       'IDLE',
  SPINNING:   'SPINNING',
  EVALUATING: 'EVALUATING',
  REWARDING:  'REWARDING',
});

class SlotMachine {
  constructor() {
    // DOM refs
    this.dom = {
      balanceDisplay: document.getElementById('balance-display'),
      lastBetDisplay: document.getElementById('last-bet-display'),
      spinsDisplay:   document.getElementById('spins-display'),
      betInput:       document.getElementById('bet-input'),
      spinButton:     document.getElementById('btn-spin'),
      winLine:        document.getElementById('win-line'),
      historyList:    document.getElementById('history-list'),
      resultToast:    document.getElementById('result-toast'),
      toastLabel:     document.getElementById('toast-label'),
      toastAmount:    document.getElementById('toast-amount'),
      toastDesc:      document.getElementById('toast-desc'),
      errorBar:       document.getElementById('error-bar'),
      chipRow:        document.querySelector('.chip-row'),
      btnBetPlus:     document.getElementById('btn-bet-plus'),
      btnBetMinus:    document.getElementById('btn-bet-minus'),
      refillBtn:      document.getElementById('btn-refill'),
    };

    // State
    this.state   = GameState.IDLE;
    this.balance = 0;
    this.stats   = {};

    // Reels
    this.reels = [];
    // Wait for fonts before drawing canvas symbols
    document.fonts.ready.then(() => this._initReels());

    // Load persistent state
    this._loadState();

    // Wire events
    this._bindEvents();
  }

  _initReels() {
    for (let i = 0; i < 3; i++) {
      const canvas = document.getElementById(`reel-canvas-${i}`);
      const reel   = new ReelEngine(canvas, i * 160); // staggered start
      this.reels.push(reel);
    }
  }

  _loadState() {
    const s = State.get();
    this.balance = s.balance;
    this.stats   = s.rouletteStats;
    this._refreshUI();
    this._checkRefill();
  }

  _saveBalance() {
    State.set({ balance: this.balance });
  }

  _refreshUI() {
    this.dom.balanceDisplay.textContent = this.balance;
    this.dom.spinsDisplay.textContent   = this.stats.spins;
    const lb = State.read('lastBet');
    this.dom.lastBetDisplay.textContent = lb || '—';
    this._checkRefill();
  }

  _bindEvents() {
    this.dom.spinButton.addEventListener('click', () => this._handleSpin());

    // Keyboard shortcut: Space / Enter
    document.addEventListener('keydown', (e) => {
      if ((e.code === 'Space' || e.code === 'Enter') &&
          document.activeElement !== this.dom.betInput) {
        e.preventDefault();
        this._handleSpin();
      }
    });

    // +/- bet buttons
    const BET_STEP = 10;
    if (this.dom.btnBetPlus) {
      this.dom.btnBetPlus.addEventListener('click', () => {
        if (this.state !== GameState.IDLE) return;
        AudioEngine.click();
        const cur = parseInt(this.dom.betInput.value, 10) || 10;
        this.dom.betInput.value = Math.min(cur + BET_STEP, this.balance, 99999);
        State.set({ lastBet: this.dom.betInput.value });
      });
    }
    if (this.dom.btnBetMinus) {
      this.dom.btnBetMinus.addEventListener('click', () => {
        if (this.state !== GameState.IDLE) return;
        AudioEngine.click();
        const cur = parseInt(this.dom.betInput.value, 10) || 10;
        this.dom.betInput.value = Math.max(cur - BET_STEP, 10);
        State.set({ lastBet: this.dom.betInput.value });
      });
    }

    // Quick-bet chips
    this.dom.chipRow.querySelectorAll('[data-amount]').forEach(chip => {
      chip.addEventListener('click', () => {
        if (this.state !== GameState.IDLE) return;
        AudioEngine.click();
        const amount = chip.dataset.amount;
        if (amount === 'max') {
          this.dom.betInput.value = this.balance;
        } else {
          const cur = parseInt(this.dom.betInput.value, 10) || 10;
          const add = parseInt(amount, 10);
          this.dom.betInput.value = Math.min(cur + add, this.balance, 99999);
        }
        State.set({ lastBet: this.dom.betInput.value });
      });
    });

    // Persist bet on change + enforce min 10
    this.dom.betInput.addEventListener('change', () => {
      let v = parseInt(this.dom.betInput.value, 10);
      if (isNaN(v) || v < 10) v = 10;
      this.dom.betInput.value = v;
      State.set({ lastBet: String(v) });
    });

    // Pre-fill: default 10 or last bet
    const lastBet = State.read('lastBet');
    this.dom.betInput.value = lastBet && parseInt(lastBet) >= 10 ? lastBet : '10';

    // Refill button
    if (this.dom.refillBtn) {
      this.dom.refillBtn.addEventListener('click', () => {
        if (this.state !== GameState.IDLE) return;
        this.balance += 1000;
        this._saveBalance();
        this._refreshUI();
        this.dom.refillBtn.textContent = '✓ +1000 ДОБАВЛЕНО';
        setTimeout(() => {
          this.dom.refillBtn.textContent = '+ ПОЛУЧИТЬ 1000 МОНЕТ';
        }, 2000);
      });
    }
  }

  // ── Validation ──────────────────────────────
  _validate() {
    const rawBet = this.dom.betInput.value.trim();
    const bet    = parseInt(rawBet, 10);

    if (rawBet === '' || isNaN(bet)) {
      return { ok: false, msg: 'ВВЕДИТЕ РАЗМЕР СТАВКИ' };
    }
    if (!Number.isFinite(bet) || bet < 10) {
      return { ok: false, msg: 'МИНИМАЛЬНАЯ СТАВКА: 10' };
    }
    if (bet > this.balance) {
      return { ok: false, msg: 'НЕДОСТАТОЧНО СРЕДСТВ НА БАЛАНСЕ' };
    }
    if (bet > 99999) {
      return { ok: false, msg: 'МАКСИМАЛЬНАЯ СТАВКА: 99 999' };
    }
    return { ok: true, bet };
  }

  // ── State Transitions ───────────────────────
  _transition(next) {
    this.state = next;
  }

  // ── Main Spin Handler ────────────────────────
  async _handleSpin() {
    if (this.state !== GameState.IDLE) return;

    const { ok, bet, msg } = this._validate();
    if (!ok) {
      this._showError(msg);
      AudioEngine.error();
      return;
    }

    this._transition(GameState.SPINNING);
    this._setControlsDisabled(true);
    this.dom.spinButton.classList.add('spinning');

    // Deduct bet immediately
    this.balance -= bet;
    this._saveBalance();
    State.set({ lastBet: String(bet) });
    this.dom.balanceDisplay.textContent = this.balance;
    this.dom.lastBetDisplay.textContent = bet;

    AudioEngine.spinStart();

    // Roll outcomes
    const results = [
      this._pickSymbol(),
      this._pickSymbol(),
      this._pickSymbol(),
    ];

    // Start reel animations; resolve snaps with staggered timing
    const settlePromises = results.map((sym, i) =>
      new Promise(resolve => {
        this.reels[i].spin(sym, () => {
          AudioEngine.snap();
          resolve();
        });
      })
    );

    // After 1.8s send snap signals (staggered by reel delay)
    const COAST_MS = 1800;
    const SNAP_STAGGER = 220;
    for (let i = 0; i < this.reels.length; i++) {
      setTimeout(() => this.reels[i].snapNow(), COAST_MS + i * SNAP_STAGGER);
    }

    // Wait for all reels to settle
    await Promise.all(settlePromises);

    this._transition(GameState.EVALUATING);
    await this._evaluate(results, bet);
  }

  // ── Symbol Picker ────────────────────────────
  _pickSymbol() {
    return SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
  }

  // ── Evaluate & Reward ────────────────────────
  async _evaluate(results, bet) {
    this._transition(GameState.REWARDING);

    const [a, b, c] = results;
    let multiplier = 0;
    let resultType = 'loss';
    let label      = 'ПРОИГРЫШ';
    let desc       = `Выпало: ${results.map(s => s.glyph).join(' ')}`;

    const allSame  = a.id === b.id && b.id === c.id;
    const twoPairs = (a.id === b.id || b.id === c.id || a.id === c.id)
                     && !allSame && a.id !== 'dash' && b.id !== 'dash' && c.id !== 'dash';

    if (allSame && a.id !== 'dash') {
      multiplier = PAY_TABLE[a.id] || 0;
      if (multiplier > 0) {
        resultType = multiplier === PAY_TABLE.seven ? 'jackpot' : 'win';
        label      = multiplier === PAY_TABLE.seven ? '✦ JACKPOT ✦' : 'ПОБЕДА';
      }
    } else if (twoPairs) {
      multiplier = PAIR_MULT;
      resultType = 'win';
      label      = 'ПАРА!';
    }

    const winnings = Math.floor(bet * multiplier);

    // Animate win-line flash
    if (multiplier > 0) {
      this.dom.winLine.classList.add('active');
      setTimeout(() => this.dom.winLine.classList.remove('active'), 1500);
    }

    // Apply winnings
    if (winnings > 0) {
      this.balance += winnings;
      this._saveBalance();
    }

    // Record stats
    this.stats = State.get().rouletteStats;
    State.recordRound({ wagered: bet, won: winnings });
    this.stats = State.get().rouletteStats;

    // Update UI
    this._refreshUI();
    this._flashBalance(winnings > 0);

    // Feedback
    await this._showResult(resultType, label, winnings, desc, bet);

    // Add to history
    this._addHistory(results, bet, winnings, resultType);

    // Back to IDLE
    this._transition(GameState.IDLE);
    this._setControlsDisabled(false);
    this.dom.spinButton.classList.remove('spinning');
    this._checkRefill();
  }

  async _showResult(type, label, winnings, desc, bet) {
    return new Promise(resolve => {
      const toast = this.dom.resultToast;

      // Particles
      if (type === 'jackpot') {
        ParticleSystem.burst(180, true);
        AudioEngine.jackpot();
      } else if (type === 'win') {
        ParticleSystem.burst(90, false);
        AudioEngine.win();
      } else {
        AudioEngine.lose();
        // Screen shake on loss
        document.body.classList.add('shake');
        document.body.addEventListener('animationend', () =>
          document.body.classList.remove('shake'), { once: true });
      }

      // Toast
      toast.className = '';  // reset classes
      toast.classList.add(type);

      this.dom.toastLabel.textContent  = label;
      this.dom.toastAmount.textContent = winnings > 0
        ? `+${winnings}`
        : `-${bet}`;
      this.dom.toastDesc.textContent   = desc;
      this.dom.toastAmount.style.color = winnings > 0
        ? (type === 'jackpot' ? 'var(--clr-gold)' : 'var(--clr-success)')
        : 'var(--clr-primary)';

      toast.classList.add('visible');

      const duration = type === 'jackpot' ? 3200 : 2200;
      setTimeout(() => {
        toast.classList.remove('visible');
        resolve();
      }, duration);
    });
  }

  _addHistory(results, bet, winnings, type) {
    const list  = this.dom.historyList;
    const entry = document.createElement('div');
    entry.className = `history-entry ${winnings > 0 ? 'win-entry' : 'loss-entry'}`;

    const glyphs = results.map(s => s.glyph).join(' ');
    const net    = winnings > 0 ? `+${winnings}` : `-${bet}`;

    entry.innerHTML = `
      <span>${glyphs}</span>
      <span>${net}</span>
    `;

    list.insertBefore(entry, list.firstChild);

    // Cap history at 12 entries
    while (list.children.length > 12) {
      list.removeChild(list.lastChild);
    }
  }

  _flashBalance(isWin) {
    const el = this.dom.balanceDisplay;
    el.classList.remove('flash-win', 'flash-loss');
    void el.offsetWidth; // reflow
    el.classList.add(isWin ? 'flash-win' : 'flash-loss');
    setTimeout(() => el.classList.remove('flash-win', 'flash-loss'), 800);
  }

  _setControlsDisabled(disabled) {
    this.dom.spinButton.disabled = disabled;
    this.dom.betInput.disabled   = disabled;
    this.dom.chipRow.querySelectorAll('.chip').forEach(c => c.disabled = disabled);
  }

  _showError(msg) {
    const bar = this.dom.errorBar;
    bar.textContent = msg;
    bar.classList.add('show');
    clearTimeout(this._errorTimer);
    this._errorTimer = setTimeout(() => bar.classList.remove('show'), 3000);
  }

  _checkRefill() {
    if (!this.dom.refillBtn) return;
    const show = this.balance < 10;
    this.dom.refillBtn.style.display = show ? 'block' : 'none';
    this.dom.spinButton.style.display = show ? 'none' : 'block';
  }
}


// ─────────────────────────────────────────────
// 7.  BOOTSTRAP
// ─────────────────────────────────────────────
// Matrix is already started at top-level (import + setupMatrix call above).
// SlotMachine init must happen after DOM is ready.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SlotMachine());
} else {
  new SlotMachine();
}
