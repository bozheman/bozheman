/**
 * BOZHEMAN ≡ 777  —  Particle System Module (Pure Red-Neon Theme)
 * Renders celebration particles on a canvas overlay.
 */

let canvas = null;
let ctx = null;
let particles = [];
let rafId = null;
let active = false;

function initCanvas() {
  if (canvas) return;
  canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  ctx = canvas.getContext('2d');
  
  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });
}

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
      ? ['#ff3333', '#ff0000', '#a30000', '#ff4d4d', '#cc0000']
      : ['#ff3333', '#a30000', '#ff1a1a', '#990000'];
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

export const ParticleSystem = {
  burst(count = 80, jackpot = false) {
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.remove('active');
    active = false;
  },
};
