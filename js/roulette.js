/**
 * BOZHEMAN ≡ 777  —  Slot Machine Engine v3.0
 * ============================================
 * Architecture:
 *  - State Machine  : IDLE → SPINNING → EVALUATING → REWARDING → IDLE
 *  - Canvas Reels   : Managed by ReelEngine (imported)
 *  - Particle System: Managed by ParticleSystem (imported)
 *  - Audio          : Managed by AudioEngine (imported)
 *  - State          : Persistent via state.js (imported)
 */

import { State } from './state.js';
import { SYMBOLS, SYMBOL_POOL, PAY_TABLE, PAIR_MULT } from './engine/constants.js';
import { AudioEngine } from './engine/audio.js';
import { ParticleSystem } from './engine/particles.js';
import { ReelEngine } from './engine/reel.js';
import { setupMatrix } from './matrix.js';
import { t } from './i18n.js';
// Setup background matrix animation
setupMatrix('matrix-canvas');

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
    const formatter = new Intl.NumberFormat(document.documentElement.lang, { style: 'decimal', maximumFractionDigits: 0 });
    this.dom.balanceDisplay.textContent = formatter.format(this.balance);
    this.dom.spinsDisplay.textContent   = formatter.format(this.stats.spins);
    const lb = State.read('lastBet');
    this.dom.lastBetDisplay.textContent = lb ? formatter.format(lb) : '—';
    this._checkRefill();
  }

  _bindEvents() {
    this.dom.spinButton.addEventListener('click', () => this._handleSpin());

    // Keyboard shortcut: Space / Enter
    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if ((e.code === 'Space' || e.code === 'Enter') &&
          !['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(activeTag)) {
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
    if (this.dom.chipRow) {
      this.dom.chipRow.querySelectorAll('[data-amount]').forEach(chip => {
        chip.addEventListener('click', () => {
          if (this.state !== GameState.IDLE) return;
          AudioEngine.click();
          const amount = chip.dataset.amount;
          if (amount === 'max') {
            this.dom.betInput.value = Math.max(10, Math.min(this.balance, 99999));
          } else {
            const cur = parseInt(this.dom.betInput.value, 10) || 10;
            const add = parseInt(amount, 10);
            this.dom.betInput.value = Math.min(cur + add, this.balance, 99999);
          }
          State.set({ lastBet: this.dom.betInput.value });
        });
      });
    }

    // Persist bet on change + enforce min 10
    const sanitizeBet = () => {
      let v = parseInt(this.dom.betInput.value, 10);
      if (isNaN(v) || v < 10) v = 10;
      if (v > 99999) v = 99999;
      this.dom.betInput.value = v;
      State.set({ lastBet: String(v) });
    };
    this.dom.betInput.addEventListener('change', sanitizeBet);
    this.dom.betInput.addEventListener('blur', sanitizeBet);

    // Pre-fill: default 10 or last bet
    const lastBet = State.read('lastBet');
    this.dom.betInput.value = lastBet && parseInt(lastBet, 10) >= 10 ? lastBet : '10';

    // Refill button
    if (this.dom.refillBtn) {
      this.dom.refillBtn.addEventListener('click', () => {
        if (this.state !== GameState.IDLE) return;
        this.balance += 1000;
        this._saveBalance();
        this._refreshUI();
        this.dom.refillBtn.textContent = t('slots_refill_success');
        setTimeout(() => {
          this.dom.refillBtn.textContent = t('slots_refill_btn');
        }, 2000);
      });
    }
  }

  // ── Validation ──────────────────────────────
  _validate() {
    const rawBet = this.dom.betInput.value.trim();
    const bet    = parseInt(rawBet, 10);

    if (rawBet === '' || isNaN(bet)) {
      return { ok: false, msg: t('slots_err_enter_bet') };
    }
    if (!Number.isFinite(bet) || bet < 10) {
      return { ok: false, msg: t('slots_err_min_bet') };
    }
    if (bet > this.balance) {
      return { ok: false, msg: t('slots_err_no_funds') };
    }
    if (bet > 99999) {
      return { ok: false, msg: t('slots_err_max_bet') };
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
    const formatter = new Intl.NumberFormat(document.documentElement.lang, { style: 'decimal', maximumFractionDigits: 0 });
    this.dom.balanceDisplay.textContent = formatter.format(this.balance);
    this.dom.lastBetDisplay.textContent = formatter.format(bet);

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
    let label      = t('slots_loss');
    let desc       = t('slots_rolled', { symbols: results.map(s => s.glyph).join(' ') });

    const allSame  = a.id === b.id && b.id === c.id;
    const twoPairs = (a.id === b.id || b.id === c.id || a.id === c.id)
                     && !allSame && a.id !== 'dash' && b.id !== 'dash' && c.id !== 'dash';

    if (allSame && a.id !== 'dash') {
      multiplier = PAY_TABLE[a.id] || 0;
      if (multiplier > 0) {
        resultType = multiplier === PAY_TABLE.seven ? 'jackpot' : 'win';
        label      = multiplier === PAY_TABLE.seven ? t('slots_jackpot') : t('slots_win');
      }
    } else if (twoPairs) {
      multiplier = PAIR_MULT;
      resultType = 'win';
      label      = t('slots_pair');
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
      const formatter = new Intl.NumberFormat(document.documentElement.lang, { style: 'decimal', maximumFractionDigits: 0, signDisplay: 'always' });
      this.dom.toastAmount.textContent = winnings > 0
        ? formatter.format(winnings)
        : formatter.format(-bet);
      this.dom.toastDesc.textContent   = desc;
      this.dom.toastAmount.style.color = 'var(--clr-primary, #ff3333)';

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
    const formatter = new Intl.NumberFormat(document.documentElement.lang, { style: 'decimal', maximumFractionDigits: 0, signDisplay: 'always' });
    const net    = winnings > 0 ? formatter.format(winnings) : formatter.format(-bet);

    const spanGlyphs = document.createElement('span');
    spanGlyphs.textContent = glyphs;
    const spanNet = document.createElement('span');
    spanNet.textContent = net;
    entry.appendChild(spanGlyphs);
    entry.appendChild(spanNet);

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
    if (this.dom.chipRow) {
      this.dom.chipRow.querySelectorAll('.chip').forEach(c => c.disabled = disabled);
    }
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

// Bootstrap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SlotMachine());
} else {
  new SlotMachine();
}
