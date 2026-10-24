/**
 * BOZHEMAN ≡ PROTOCOL — Matrix Rain Engine v3.0
 * Features:
 * - Zero CPU usage when tab is hidden (document.hidden check)
 * - Smooth column preservation on window resize
 * - Dynamic speed control via State.get().matrixSpeed ('slow' | 'normal' | 'fast')
 * - Cohesive cyber-terminal rain palette (disciplined crimson with rare highlights)
 */

import { State } from './state.js';

export function setupMatrix(canvasId = 'matrix-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d');

  const chars = 'BOZHEMAN01≡Ω★7▲■';
  const FONT_SIZE = 14;
  let columns = 0;
  let drops   = [];

  function syncColumns() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    const nextCols = Math.max(1, Math.floor(canvas.width / FONT_SIZE));
    if (nextCols > columns) {
      for (let i = columns; i < nextCols; i++) {
        drops.push(Math.floor(Math.random() * -30));
      }
    } else if (nextCols < columns) {
      drops.length = nextCols;
    }
    columns = nextCols;
  }
  syncColumns();

  let lastTime = 0;
  let rafId    = null;
  let speedMode = State.read('matrixSpeed') || 'normal';

  window.addEventListener('bzp:statechange', (e) => {
    if (e.detail && e.detail.matrixSpeed) {
      speedMode = e.detail.matrixSpeed;
    }
  });

  function getFrameMs() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return 1000 / 10;
    }
    if (speedMode === 'fast') return 1000 / 48;
    if (speedMode === 'slow') return 1000 / 16;
    return 1000 / 30;
  }

  function draw(timestamp) {
    rafId = requestAnimationFrame(draw);
    if (document.hidden) return;

    const frameMs = getFrameMs();
    const delta = timestamp - lastTime;
    if (delta < frameMs) return;
    lastTime = timestamp - (delta % frameMs);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.055)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = FONT_SIZE + 'px "Fira Code", monospace';

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      const r = Math.random();
      if (r > 0.994) {
        ctx.fillStyle = '#ffffff';
      } else if (r > 0.985) {
        ctx.fillStyle = '#ff5555';
      } else if (r > 0.976) {
        ctx.fillStyle = '#e5b842';
      } else {
        ctx.fillStyle = 'rgba(165, 20, 20, 0.65)';
      }

      ctx.fillText(text, i * FONT_SIZE, drops[i] * FONT_SIZE);
      if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  rafId = requestAnimationFrame(draw);

  window.addEventListener('resize', syncColumns, { passive: true });

  return () => cancelAnimationFrame(rafId);
}
