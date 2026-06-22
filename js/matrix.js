export function setupMatrix(canvasId = 'matrix-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const TARGET_FPS = 30;
  const FRAME_MS  = 1000 / TARGET_FPS;

  function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();

  const chars = 'BOZHEMAN01';
  const FONT_SIZE = 14;
  let columns = Math.floor(canvas.width / FONT_SIZE);
  let drops   = Array.from({ length: columns }).fill(1);

  let lastTime = 0;
  let rafId    = null;

  function draw(timestamp) {
    rafId = requestAnimationFrame(draw);

    const delta = timestamp - lastTime;
    if (delta < FRAME_MS) return; // throttle to 30 fps
    lastTime = timestamp - (delta % FRAME_MS);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#600000';
    ctx.font = FONT_SIZE + 'px "Fira Code", monospace';

    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * FONT_SIZE, drops[i] * FONT_SIZE);
      if (drops[i] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  rafId = requestAnimationFrame(draw);

  window.addEventListener('resize', () => {
    resizeCanvas();
    columns = Math.floor(canvas.width / FONT_SIZE);
    drops   = Array.from({ length: columns }).fill(1);
  }, { passive: true });

  return () => cancelAnimationFrame(rafId);
}
