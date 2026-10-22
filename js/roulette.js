/**
 * BOZHEMAN ≡ 777  —  Slot Machine Engine v3.0
 * ============================================
 * Architecture:
 *  - State Machine  : IDLE → SPINNING → EVALUATING → REWARDING → IDLE
 *  - Canvas Reels   : Managed by ReelEngine (with Turbo & HiDPI support)
 *  - Particle System: Managed by ParticleSystem (with Cyber Glyphs)
 *  - Audio          : Managed by AudioEngine (with Master Compressor)
 *  - State          : Persistent via state.js (with History, Streaks & Achievements)
 */

import { State } from './state.js';
import { SYMBOL_POOL, PAY_TABLE, PAIR_MULT } from './engine/constants.js';
import { AudioEngine } from './engine/audio.js';
import { ParticleSystem } from './engine/particles.js';
import { ReelEngine } from './engine/reel.js';
import { setupMatrix } from './matrix.js';
import { t } from './i18n.js';
import { initHUD, appendLog } from './hud.js';

setupMatrix('matrix-canvas');
initHUD();

const GameState = Object.freeze({
  IDLE:       'IDLE',
  SPINNING:   'SPINNING',
  EVALUATING: 'EVALUATING',
  REWARDING:  'REWARDING',
});

class SlotMachine {
  constructor() {
    this.dom = {
      balanceDisplay:  document.getElementById('balance-display'),
      lastBetDisplay:  document.getElementById('last-bet-display'),
      spinsDisplay:    document.getElementById('spins-display'),
      winrateDisplay:  document.getElementById('winrate-display'),
      maxwinDisplay:   document.getElementById('maxwin-display'),
      streakDisplay:   document.getElementById('streak-display'),
      betInput:        document.getElementById('bet-input'),
      spinButton:      document.getElementById('btn-spin'),
      winLine:         document.getElementById('win-line'),
      payTable:        document.getElementById('pay-table'),
      historyList:     document.getElementById('history-list'),
      clearHistoryBtn: document.getElementById('btn-clear-history'),
      resultToast:     document.getElementById('result-toast'),
      toastLabel:      document.getElementById('toast-label'),
      toastAmount:     document.getElementById('toast-amount'),
      toastDesc:       document.getElementById('toast-desc'),
      errorBar:        document.getElementById('error-bar'),
      chipRow:         document.querySelector('.chip-row'),
      btnBetPlus:      document.getElementById('btn-bet-plus'),
      btnBetMinus:     document.getElementById('btn-bet-minus'),
      btnTurbo:        document.getElementById('btn-turbo'),
      btnAuto:         document.getElementById('btn-auto'),
      btnDaily:        document.getElementById('btn-daily'),
      refillBtn:       document.getElementById('btn-refill'),
      fairSeedDisplay: document.getElementById('fair-seed-display'),
    };

    this.state    = GameState.IDLE;
    this.balance  = 0;
    this.stats    = {};
    this.turbo    = Boolean(State.read('turboSpin'));
    this.autoSpin = false;
    this._autoTimer = null;

    this.reels = [];
    document.fonts.ready.then(() => this._initReels());

    this._loadState();
    this._renderSavedHistory();
    this._rotateFairSeed();
    this._bindEvents();
  }

  _initReels() {
    for (let i = 0; i < 3; i++) {
      const canvas = document.getElementById(`reel-canvas-${i}`);
      const reel   = new ReelEngine(canvas, i * 160);
      this.reels.push(reel);
    }
  }

  _rotateFairSeed() {
    if (!this.dom.fairSeedDisplay) return;
    const hex = Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
    this.dom.fairSeedDisplay.textContent = `SHA256::${hex.slice(0, 6)}...${hex.slice(-4)}`;
  }

  _loadState() {
    const s = State.get();
    this.balance = s.balance;
    this.stats   = s.rouletteStats;
    this.turbo   = Boolean(s.turboSpin);
    this._refreshUI();
    this._syncModeButtons();
    this._checkRefill();
  }

  _saveBalance() {
    State.set({ balance: this.balance });
  }

  _refreshUI() {
    const formatter = new Intl.NumberFormat(document.documentElement.lang || 'ru', { style: 'decimal', maximumFractionDigits: 0 });
    if (this.dom.balanceDisplay) this.dom.balanceDisplay.textContent = formatter.format(this.balance);
    if (this.dom.spinsDisplay)   this.dom.spinsDisplay.textContent   = formatter.format(this.stats.spins || 0);
    const lb = State.read('lastBet');
    if (this.dom.lastBetDisplay) this.dom.lastBetDisplay.textContent = lb ? formatter.format(lb) : '—';
    if (this.dom.winrateDisplay) this.dom.winrateDisplay.textContent = `${State.getWinRate()}%`;
    if (this.dom.maxwinDisplay)  this.dom.maxwinDisplay.textContent  = formatter.format(this.stats.maxWin || 0);
    if (this.dom.streakDisplay)  this.dom.streakDisplay.textContent  = `${this.stats.currentStreak || 0} (★${this.stats.bestStreak || 0})`;
    this._checkRefill();
  }

  _syncModeButtons() {
    if (this.dom.btnTurbo) {
      const key = this.turbo ? 'slots_turbo_on' : 'slots_turbo_off';
      this.dom.btnTurbo.textContent = t(key);
      this.dom.btnTurbo.setAttribute('data-i18n', key);
      this.dom.btnTurbo.classList.toggle('active-mode', this.turbo);
    }
    if (this.dom.btnAuto) {
      const key = this.autoSpin ? 'slots_auto_on' : 'slots_auto_off';
      this.dom.btnAuto.textContent = t(key);
      this.dom.btnAuto.setAttribute('data-i18n', key);
      this.dom.btnAuto.classList.toggle('active-mode', this.autoSpin);
    }
  }

  _bindEvents() {
    this.dom.spinButton.addEventListener('click', () => this._handleSpin());

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName : '';
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(activeTag)) return;

      if (e.code === 'Space' || e.code === 'Enter') {
        if (activeTag !== 'BUTTON') {
          e.preventDefault();
          this._handleSpin();
        }
      } else if (e.code === 'KeyT' && !e.ctrlKey && !e.metaKey) {
        this._toggleTurbo();
      } else if (e.code === 'KeyA' && !e.ctrlKey && !e.metaKey) {
        this._toggleAuto();
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        this._adjustBet(10);
      } else if (e.code === 'ArrowDown') {
        e.preventDefault();
        this._adjustBet(-10);
      }
    });

    if (this.dom.btnBetPlus) {
      this.dom.btnBetPlus.addEventListener('click', () => this._adjustBet(10));
    }
    if (this.dom.btnBetMinus) {
      this.dom.btnBetMinus.addEventListener('click', () => this._adjustBet(-10));
    }

    if (this.dom.btnTurbo) {
      this.dom.btnTurbo.addEventListener('click', () => this._toggleTurbo());
    }
    if (this.dom.btnAuto) {
      this.dom.btnAuto.addEventListener('click', () => this._toggleAuto());
    }
    if (this.dom.btnDaily) {
      this.dom.btnDaily.addEventListener('click', () => this._claimDaily());
    }
    if (this.dom.clearHistoryBtn) {
      this.dom.clearHistoryBtn.addEventListener('click', () => {
        AudioEngine.click();
        State.clearHistory();
        if (this.dom.historyList) this.dom.historyList.innerHTML = '';
      });
    }

    // Quick-bet chips
    if (this.dom.chipRow) {
      this.dom.chipRow.querySelectorAll('[data-amount]').forEach(chip => {
        chip.addEventListener('click', () => {
          if (this.state !== GameState.IDLE) return;
          AudioEngine.click();
          const amount = chip.dataset.amount;
          const cur = parseInt(this.dom.betInput.value, 10) || 10;
          let next = cur;

          if (amount === 'max') {
            next = Math.max(10, Math.min(this.balance, 99999));
          } else if (amount === 'min') {
            next = 10;
          } else if (amount === 'half') {
            next = Math.max(10, Math.floor(cur / 2));
          } else if (amount === 'double') {
            next = Math.max(10, Math.min(cur * 2, this.balance, 99999));
          } else {
            const add = parseInt(amount, 10);
            next = Math.min(cur + add, Math.max(10, this.balance), 99999);
          }
          this.dom.betInput.value = next;
          State.set({ lastBet: String(next) });
        });
      });
    }

    const sanitizeBet = () => {
      let v = parseInt(this.dom.betInput.value, 10);
      if (isNaN(v) || v < 10) v = 10;
      if (v > 99999) v = 99999;
      this.dom.betInput.value = v;
      State.set({ lastBet: String(v) });
    };
    this.dom.betInput.addEventListener('change', sanitizeBet);
    this.dom.betInput.addEventListener('blur', sanitizeBet);

    const lastBet = State.read('lastBet');
    this.dom.betInput.value = lastBet && parseInt(lastBet, 10) >= 10 ? lastBet : '10';

    if (this.dom.refillBtn) {
      this.dom.refillBtn.addEventListener('click', () => {
        if (this.state !== GameState.IDLE) return;
        AudioEngine.win();
        this.balance += 1000;
        this._saveBalance();
        this._refreshUI();
        this.dom.refillBtn.textContent = t('slots_refill_success');
        setTimeout(() => {
          this.dom.refillBtn.textContent = t('slots_refill_btn');
        }, 2000);
      });
    }

    document.addEventListener('languagechange', () => {
      this._syncModeButtons();
      this._refreshUI();
    });

    window.addEventListener('bzp:statechange', () => {
      if (this.state === GameState.IDLE) {
        const s = State.get();
        this.balance = s.balance;
        this.stats   = s.rouletteStats;
        this._refreshUI();
      }
    });
  }

  _adjustBet(delta) {
    if (this.state !== GameState.IDLE) return;
    AudioEngine.click();
    const cur = parseInt(this.dom.betInput.value, 10) || 10;
    const next = Math.max(10, Math.min(cur + delta, Math.max(10, this.balance), 99999));
    this.dom.betInput.value = next;
    State.set({ lastBet: String(next) });
  }

  _toggleTurbo() {
    this.turbo = !this.turbo;
    State.set({ turboSpin: this.turbo });
    AudioEngine.click();
    this._syncModeButtons();
  }

  _toggleAuto() {
    this.autoSpin = !this.autoSpin;
    AudioEngine.click();
    this._syncModeButtons();
    if (this.autoSpin && this.state === GameState.IDLE) {
      this._handleSpin();
    } else if (!this.autoSpin && this._autoTimer) {
      clearTimeout(this._autoTimer);
      this._autoTimer = null;
    }
  }

  _claimDaily() {
    const res = State.claimDailyBonus(500);
    if (res.ok) {
      AudioEngine.win();
      this.balance = res.balance;
      this._refreshUI();
      this._flashBalance(true);
      this._showError(t('slots_daily_claimed'));
      appendLog(`> DAILY_BONUS: +500 COINS CLAIMED`, 'highlight');
    } else {
      AudioEngine.error();
      const totalMins = Math.ceil(res.remainingMs / 60000);
      const h = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      this._showError(t('slots_daily_wait', { h, m }));
    }
  }

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

  _transition(next) {
    this.state = next;
  }

  _clearPaytableHighlights() {
    if (!this.dom.payTable) return;
    this.dom.payTable.querySelectorAll('.pay-row').forEach(r => r.classList.remove('active-win'));
  }

  _highlightPaytableRow(payKey) {
    this._clearPaytableHighlights();
    if (!payKey || !this.dom.payTable) return;
    const row = this.dom.payTable.querySelector(`[data-pay="${payKey}"]`);
    if (row) row.classList.add('active-win');
  }

  async _handleSpin() {
    if (this.state !== GameState.IDLE) return;

    const { ok, bet, msg } = this._validate();
    if (!ok) {
      if (this.autoSpin) {
        this.autoSpin = false;
        this._syncModeButtons();
      }
      this._showError(msg);
      AudioEngine.error();
      return;
    }

    this._clearPaytableHighlights();
    this.reels.forEach(r => r.setWinning(false));
    this._rotateFairSeed();

    this._transition(GameState.SPINNING);
    this._setControlsDisabled(true);
    this.dom.spinButton.classList.add('spinning');

    // Deduct bet immediately
    this.balance -= bet;
    this._saveBalance();
    State.set({ lastBet: String(bet) });
    const formatter = new Intl.NumberFormat(document.documentElement.lang || 'ru', { style: 'decimal', maximumFractionDigits: 0 });
    this.dom.balanceDisplay.textContent = formatter.format(this.balance);
    this.dom.lastBetDisplay.textContent = formatter.format(bet);

    AudioEngine.spinStart();

    const results = [
      this._pickSymbol(),
      this._pickSymbol(),
      this._pickSymbol(),
    ];

    const settlePromises = results.map((sym, i) =>
      new Promise(resolve => {
        this.reels[i].spin(sym, () => {
          AudioEngine.snap();
          resolve();
        }, this.turbo);
      })
    );

    const COAST_MS     = this.turbo ? 520 : 1650;
    const SNAP_STAGGER = this.turbo ? 90  : 210;
    for (let i = 0; i < this.reels.length; i++) {
      setTimeout(() => this.reels[i].snapNow(), COAST_MS + i * SNAP_STAGGER);
    }

    await Promise.all(settlePromises);

    this._transition(GameState.EVALUATING);
    await this._evaluate(results, bet);
  }

  _pickSymbol() {
    return SYMBOL_POOL[Math.floor(Math.random() * SYMBOL_POOL.length)];
  }

  async _evaluate(results, bet) {
    this._transition(GameState.REWARDING);

    const [a, b, c] = results;
    let multiplier = 0;
    let resultType = 'loss';
    let payKey     = null;
    let label      = t('slots_loss');
    let desc       = t('slots_rolled', { symbols: results.map(s => s.glyph).join(' ') });

    const allSame  = a.id === b.id && b.id === c.id;
    const twoPairs = (a.id === b.id || b.id === c.id || a.id === c.id)
                     && !allSame && a.id !== 'dash' && b.id !== 'dash' && c.id !== 'dash';

    if (allSame && a.id !== 'dash') {
      multiplier = PAY_TABLE[a.id] || 0;
      payKey     = a.id;
      if (multiplier > 0) {
        resultType = multiplier === PAY_TABLE.seven ? 'jackpot' : 'win';
        label      = multiplier === PAY_TABLE.seven ? t('slots_jackpot') : t('slots_win');
        if (a.id === 'seven') State.unlockAchievement('JACKPOT_777');
      }
    } else if (twoPairs) {
      multiplier = PAIR_MULT;
      payKey     = 'pair';
      resultType = 'win';
      label      = t('slots_pair');
    }

    const winnings = Math.floor(bet * multiplier);

    if (multiplier > 0) {
      this.dom.winLine.classList.add('active');
      this._highlightPaytableRow(payKey);
      this.reels.forEach(r => r.setWinning(true));
      setTimeout(() => this.dom.winLine.classList.remove('active'), 1500);
    }

    if (winnings > 0) {
      this.balance += winnings;
      this._saveBalance();
    }

    const glyphs = results.map(s => s.glyph).join(' ');
    State.recordRound({ wagered: bet, won: winnings, glyphs });
    this.stats = State.get().rouletteStats;

    appendLog(`> SPIN [${glyphs}] BET:${bet} -> ${winnings > 0 ? '+' + winnings : -bet}`, winnings > 0 ? 'highlight' : 'sys');

    this._refreshUI();
    this._flashBalance(winnings > 0);

    await this._showResult(resultType, label, winnings, desc, bet);

    this._prependHistoryDOM(glyphs, bet, winnings);

    this._transition(GameState.IDLE);
    this._setControlsDisabled(false);
    this.dom.spinButton.classList.remove('spinning');
    this._checkRefill();

    if (this.autoSpin && this.balance >= bet) {
      this._autoTimer = setTimeout(() => {
        if (this.autoSpin && this.state === GameState.IDLE) {
          this._handleSpin();
        }
      }, this.turbo ? 300 : 650);
    } else if (this.autoSpin && this.balance < bet) {
      this.autoSpin = false;
      this._syncModeButtons();
    }
  }

  async _showResult(type, label, winnings, desc, bet) {
    return new Promise(resolve => {
      const toast = this.dom.resultToast;

      if (type === 'jackpot') {
        ParticleSystem.burst(180, true);
        AudioEngine.jackpot();
      } else if (type === 'win') {
        ParticleSystem.burst(90, false);
        AudioEngine.win();
      } else {
        AudioEngine.lose();
        document.body.classList.add('shake');
        document.body.addEventListener('animationend', () =>
          document.body.classList.remove('shake'), { once: true });
      }

      toast.className = '';
      toast.classList.add(type);

      this.dom.toastLabel.textContent = label;
      const formatter = new Intl.NumberFormat(document.documentElement.lang || 'ru', { style: 'decimal', maximumFractionDigits: 0, signDisplay: 'always' });
      this.dom.toastAmount.textContent = winnings > 0
        ? formatter.format(winnings)
        : formatter.format(-bet);
      this.dom.toastDesc.textContent = desc;
      this.dom.toastAmount.style.color = winnings > 0 ? 'var(--clr-gold, #ffd700)' : 'var(--clr-primary, #ff3333)';

      toast.classList.add('visible');

      const baseDuration = type === 'jackpot' ? 2800 : 1650;
      const duration = this.turbo ? Math.min(950, baseDuration) : baseDuration;
      setTimeout(() => {
        toast.classList.remove('visible');
        resolve();
      }, duration);
    });
  }

  _renderSavedHistory() {
    const list = this.dom.historyList;
    if (!list) return;
    list.innerHTML = '';
    const history = State.get().history || [];
    history.slice(0, 12).forEach(item => {
      const entry = this._createHistoryElement(item.glyphs, item.wagered, item.won);
      list.appendChild(entry);
    });
  }

  _createHistoryElement(glyphs, bet, winnings) {
    const entry = document.createElement('div');
    entry.className = `history-entry ${winnings > 0 ? 'win-entry' : 'loss-entry'}`;
    const formatter = new Intl.NumberFormat(document.documentElement.lang || 'ru', { style: 'decimal', maximumFractionDigits: 0, signDisplay: 'always' });
    const net = winnings > 0 ? formatter.format(winnings) : formatter.format(-bet);

    const spanGlyphs = document.createElement('span');
    spanGlyphs.textContent = glyphs;
    const spanNet = document.createElement('span');
    spanNet.textContent = net;
    entry.appendChild(spanGlyphs);
    entry.appendChild(spanNet);
    return entry;
  }

  _prependHistoryDOM(glyphs, bet, winnings) {
    const list = this.dom.historyList;
    if (!list) return;
    const entry = this._createHistoryElement(glyphs, bet, winnings);
    list.insertBefore(entry, list.firstChild);
    while (list.children.length > 12) {
      list.removeChild(list.lastChild);
    }
  }

  _flashBalance(isWin) {
    const el = this.dom.balanceDisplay;
    if (!el) return;
    el.classList.remove('flash-win', 'flash-loss');
    void el.offsetWidth;
    el.classList.add(isWin ? 'flash-win' : 'flash-loss');
    setTimeout(() => el.classList.remove('flash-win', 'flash-loss'), 800);
  }

  _setControlsDisabled(disabled) {
    this.dom.spinButton.disabled = disabled;
    this.dom.betInput.disabled   = disabled;
    if (this.dom.chipRow) {
      this.dom.chipRow.querySelectorAll('.chip').forEach(c => { c.disabled = disabled; });
    }
  }

  _showError(msg) {
    const bar = this.dom.errorBar;
    if (!bar) return;
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new SlotMachine());
} else {
  new SlotMachine();
}
