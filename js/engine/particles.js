/**
 * BOZHEMAN ≡ 777  —  Particle System Module v3.0
 * Renders HiDPI celebration particles and cyber glyphs on a canvas overlay.
 */

let canvas = null;
let ctx = null;
let particles = [];
let rafId = null;
let active = false;
let dpr = 1;

const GLYPHS = ['7', '★', 'Ω', '▲', '₿', '≡'];

function initCanvas() {
  if (canvas) return;
  canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
}

class Particle {
  constructor(jackpot) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.x   = w * 0.15 + Math.random() * (w * 0.7);
    this.y   = h * 0.25 + Math.random() * (h * 0.35);
    this.vx  = (Math.random() - 0.5) * (jackpot ? 9 : 5);
    this.vy  = -(Math.random() * (jackpot ? 10 : 6) + 2.5);
    this.gravity = jackpot ? 0.17 : 0.13;
    this.size = Math.random() * (jackpot ? 12 : 7) + 4;
    this.life = 1.0;
    this.decay = Math.random() * 0.015 + 0.010;
    const palette = jackpot
      ? ['#ff3333', '#ffd700', '#ff00de', '#00ff88', '#ff4d4d']
      : ['#ff3333', '#a30000', '#ff4d4d', '#00ff88'];
    this.color = palette[Math.floor(Math.random() * palette.length)];
    const r = Math.random();
    this.shape = jackpot && r > 0.72 ? 'glyph' : (r > 0.35 ? 'rect' : 'circle');
    this.glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    this.rot   = Math.random() * Math.PI * 2;
    this.rotV  = (Math.random() - 0.5) * 0.14;
  }

  update() {
    this.vy   += this.gravity;
    this.x    += this.vx;
    this.y    += this.vy;
    this.life -= this.decay;
    this.rot  += this.rotV;
  }

  draw() {
    ctx.save();
    ctx.globalAlpha = Math.max(0, this.life);
    ctx.fillStyle   = this.color;
    ctx.shadowBlur  = 10;
    ctx.shadowColor = this.color;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);

    if (this.shape === 'glyph') {
      ctx.font = `700 ${Math.floor(this.size * 1.4)}px "Fira Code", monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.glyph, 0, 0);
    } else if (this.shape === 'circle') {
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
  const w = window.innerWidth;
  const h = window.innerHeight;
  ctx.clearRect(0, 0, w, h);
  particles = particles.filter(p => p.life > 0);
  particles.forEach(p => { p.update(); p.draw(); });
  if (particles.length > 0) {
    rafId = requestAnimationFrame(loop);
  } else {
    active = false;
    canvas.classList.remove('active');
  }
}

export const ParticleSystem = {
  burst(count = 80, jackpot = false) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      count = Math.min(count, 20);
    }
    initCanvas();
    if (!canvas) return;
    canvas.classList.add('active');
    for (let i = 0; i < count; i++) particles.push(new Particle(jackpot));
    if (!active) {
      active = true;
      if (rafId) cancelAnimationFrame(rafId);
      loop();
    }
  },
  stop() {
    initCanvas();
    if (!canvas) return;
    particles = [];
    if (rafId) cancelAnimationFrame(rafId);
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    canvas.classList.remove('active');
    active = false;
  },
};
