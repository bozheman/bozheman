export function setupMatrix(canvasId = 'matrix-canvas') {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();

  const chars = "BOZHEMAN01";
  const font_size = 14;
  let columns = Math.floor(canvas.width / font_size);
  let drops = Array.from({ length: columns }).fill(1);

  function draw() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#600000';
    ctx.font = font_size + 'px Fira Code';
    for (let i = 0; i < drops.length; i++) {
      const text = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(text, i * font_size, drops[i] * font_size);
      if (drops[i] * font_size > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  const intervalId = setInterval(draw, 50);

  window.addEventListener('resize', () => {
    resizeCanvas();
    columns = Math.floor(canvas.width / font_size);
    drops = Array.from({ length: columns }).fill(1);
  });

  return intervalId;
}
