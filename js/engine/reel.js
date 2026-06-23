/**
 * BOZHEMAN ≡ 777  —  Canvas Reel Engine Module
 * Uses delta-time (frame-rate independent physics) to animate vertical symbol strips.
 */

import { SYMBOLS } from './constants.js';

export class ReelEngine {
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
    this.velocity = 0;      // px/frame base (at 60fps)
    this.targetOffset = 0;  // where we want to land
    this.finalSymbolIndex = 0;

    // State
    this.spinning  = false;
    this.snapping  = false;
    this.settled   = false;
    this.rafId     = null;
    this.onSettle  = null; // callback when snapped
    this._lastTs   = 0;     // Timestamp for delta time

    // Visual extras
    this.blurAmount = 0;

    this.resize();
    this.resizeHandler = () => this.resize();
    window.addEventListener('resize', this.resizeHandler, { passive: true });
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
    if (!wrap) return;
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
      this.velocity = 45 + Math.random() * 12; // px/frame @ 60fps base
      this._lastTs = 0; // reset timestamp on spin start to prevent physics jump
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

  _loop(timestamp) {
    this.rafId = requestAnimationFrame((ts) => this._loop(ts));
    const now = timestamp || performance.now();
    if (!this._lastTs) {
      this._lastTs = now;
      return;
    }
    const elapsed = now - this._lastTs;
    this._lastTs = now;
    
    // Normalize to 60fps base (16.667 ms = dt of 1.0)
    // Cap dt to prevent massive jumps when tab is inactive
    const dt = Math.min(elapsed / 16.667, 4);
    
    this._tick(dt);
    this._render();
  }

  _tick(dt) {
    if (this.settled) return;

    if (this.spinning && !this.snapping) {
      this.offset    += this.velocity * dt;
      this.blurAmount = Math.min(this.velocity * 0.6, 18);
    } else if (this.snapping) {
      const dist  = this.targetOffset - this.offset;
      // Normal snap convergence speed at 60fps was: dist * 0.14
      // Scale with delta time: speed = dist * (1 - (1 - 0.14)^dt)
      const easingFactor = 1 - Math.pow(1 - 0.14, dt);
      const speed = dist * easingFactor;
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
    this._lastTs = 0; // reset timestamp on snap start to prevent physics jump
  }

  _render() {
    const ctx = this.ctx;
    const W   = this.canvas.width;
    const H   = this.canvas.height;

    ctx.clearRect(0, 0, W, H);

    // Simulated motion blur
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
    if (!total || !symH) return;

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
    if (!sym) return;
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
    window.removeEventListener('resize', this.resizeHandler);
  }
}
