/**
 * BOZHEMAN ≡ 777  —  Canvas Reel Engine Module v3.0
 * HiDPI/Retina delta-time vertical symbol strip renderer with spring bounce,
 * cell scan dividers, and audio reel ticks.
 */

import { SYMBOLS } from './constants.js';
import { AudioEngine } from './audio.js';

export class ReelEngine {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {number}            delayMs  staggered start delay
   */
  constructor(canvas, delayMs = 0) {
    this.canvas   = canvas;
    this.ctx      = canvas.getContext('2d');
    this.delay    = delayMs;
    this.dpr      = 1;
    this.viewW    = 0;
    this.viewH    = 0;

    // Layout
    this.SYMBOL_H  = 0;
    this.STRIP_LEN = SYMBOLS.length * 3;

    // Reel strip
    this.strip = this._buildStrip();

    // Render state
    this.offset            = 0;
    this.velocity          = 0;
    this.targetOffset      = 0;
    this.finalSymbolIndex  = 0;
    this.lastTickCell      = -1;
    this.springPhase       = 0;
    this.pulsePhase        = 0;

    // State
    this.spinning  = false;
    this.snapping  = false;
    this.settled   = true;
    this.winning   = false;
    this.rafId     = null;
    this.onSettle  = null;
    this._lastTs   = 0;

    // Visual extras
    this.blurAmount = 0;

    this.resize();
    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler, { passive: true });
    window.addEventListener('orientationchange', this.resizeHandler, { passive: true });
    this._loop();
  }

  _buildStrip() {
    const arr = [];
    for (let i = 0; i < this.STRIP_LEN; i++) {
      arr.push(SYMBOLS[i % SYMBOLS.length]);
    }
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  resize() {
    const wrap = this.canvas ? this.canvas.parentElement : null;
    if (!wrap) return;
    const w = wrap.clientWidth || 100;
    const h = wrap.clientHeight || 120;
    this.dpr   = Math.min(window.devicePixelRatio || 1, 2);
    this.viewW = w;
    this.viewH = h;
    this.canvas.width  = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.SYMBOL_H = h;
    this.TOTAL_H  = this.SYMBOL_H * this.strip.length;
    this._render();
  }

  /** Spin: accelerate to full velocity, then coast, then snap to target */
  spin(targetSymbol, onSettle, turbo = false) {
    this.settled   = false;
    this.snapping  = false;
    this.winning   = false;
    this.onSettle  = onSettle;
    this.finalSymbolIndex = this.strip.findIndex(s => s.id === targetSymbol.id);
    if (this.finalSymbolIndex < 0) this.finalSymbolIndex = 0;

    const effectiveDelay = turbo ? Math.floor(this.delay * 0.35) : this.delay;
    setTimeout(() => {
      this.spinning = true;
      this.velocity = (turbo ? 62 : 46) + Math.random() * 12;
      this._lastTs  = 0;
    }, effectiveDelay);
  }

  setWinning(isWin) {
    this.winning = Boolean(isWin);
  }

  _resolveSnap() {
    const centreY   = this.viewH / 2;
    const symCentre = (this.finalSymbolIndex + 0.5) * this.SYMBOL_H;
    let target      = symCentre - centreY;
    const fullRotation = this.TOTAL_H;
    while (target < this.offset + fullRotation * 1.1) target += fullRotation;
    this.targetOffset = target;
  }

  _loop(timestamp) {
    this.rafId = requestAnimationFrame((ts) => this._loop(ts));
    if (document.hidden) return;
    const now = timestamp || performance.now();
    if (!this._lastTs) {
      this._lastTs = now;
      return;
    }
    const elapsed = now - this._lastTs;
    this._lastTs = now;

    const dt = Math.min(elapsed / 16.667, 4);
    this._tick(dt);
    this._render();
  }

  _tick(dt) {
    if (this.settled) {
      if (this.winning) {
        this.pulsePhase += 0.08 * dt;
      }
      return;
    }

    if (this.spinning && !this.snapping) {
      this.offset    += this.velocity * dt;
      this.blurAmount = Math.min(this.velocity * 0.55, 18);

      if (this.SYMBOL_H > 0) {
        const curCell = Math.floor(this.offset / this.SYMBOL_H);
        if (curCell !== this.lastTickCell) {
          this.lastTickCell = curCell;
          if (Math.random() > 0.55) AudioEngine.reelTick();
        }
      }
    } else if (this.snapping) {
      const dist = this.targetOffset - this.offset;
      const easingFactor = 1 - Math.pow(1 - 0.16, dt);
      const speed = dist * easingFactor;
      this.offset    += speed;
      this.blurAmount = Math.abs(speed) * 0.45;

      if (Math.abs(dist) < 0.75) {
        this.offset     = this.targetOffset;
        this.velocity   = 0;
        this.blurAmount = 0;
        this.snapping   = false;
        this.spinning   = false;
        this.settled    = true;
        if (this.onSettle) this.onSettle();
      }
    }

    if (this.TOTAL_H > 0 && this.offset > this.TOTAL_H * 10) {
      this.offset       -= this.TOTAL_H;
      this.targetOffset -= this.TOTAL_H;
    }
  }

  snapNow() {
    if (!this.spinning || this.snapping || this.settled) return;
    this._resolveSnap();
    this.snapping = true;
    this._lastTs  = 0;
  }

  _render() {
    const ctx = this.ctx;
    const W   = this.viewW;
    const H   = this.viewH;
    if (!W || !H) return;

    ctx.clearRect(0, 0, W, H);

    if (this.blurAmount > 2) {
      ctx.save();
      ctx.globalAlpha = 0.32;
      const blurOffset = this.blurAmount * 0.5;
      this._drawStrip(ctx, W, H, this.offset - blurOffset);
      ctx.globalAlpha = 0.18;
      this._drawStrip(ctx, W, H, this.offset - blurOffset * 2);
      ctx.restore();
    }

    ctx.globalAlpha = 1;
    this._drawStrip(ctx, W, H, this.offset);
  }

  _drawStrip(ctx, W, H, offset) {
    const symH  = this.SYMBOL_H;
    const total = this.TOTAL_H;
    if (!total || !symH) return;

    const normOffset = ((offset % total) + total) % total;
    const startIdx   = Math.floor(normOffset / symH);
    const startY     = -(normOffset % symH);

    for (let i = 0; i < Math.ceil(H / symH) + 2; i++) {
      const idx = (startIdx + i) % this.strip.length;
      const sym = this.strip[idx];
      const y   = startY + i * symH;
      this._drawSymbol(ctx, sym, W, y, symH);
    }
  }

  _drawSymbol(ctx, sym, W, y, H) {
    if (!sym) return;
    const gradient = ctx.createLinearGradient(0, y, 0, y + H);
    gradient.addColorStop(0,   'rgba(0,0,0,0.0)');
    gradient.addColorStop(0.5, this.winning ? 'rgba(55,0,0,0.35)' : 'rgba(20,0,0,0.18)');
    gradient.addColorStop(1,   'rgba(0,0,0,0.0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, y, W, H);

    // Subtle cell divider line
    ctx.fillStyle = 'rgba(255, 51, 51, 0.12)';
    ctx.fillRect(8, y, W - 16, 1);

    const pulseScale = (this.settled && this.winning) ? (1 + Math.sin(this.pulsePhase) * 0.06) : 1;
    const fontSize   = Math.floor(H * 0.55 * pulseScale);
    ctx.font         = `700 ${fontSize}px "Fira Code", monospace`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowBlur  = this.settled ? (this.winning ? 26 : 18) : 6;
    ctx.shadowColor = sym.glow;

    ctx.fillStyle = sym.color;
    ctx.fillText(sym.glyph, W / 2, y + H / 2);

    ctx.shadowBlur = 0;
  }

  destroy() {
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('resize', this.resizeHandler);
    window.removeEventListener('orientationchange', this.resizeHandler);
  }
}
