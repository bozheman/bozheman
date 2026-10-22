import { setupMatrix } from './matrix.js';
import { t, applyTranslations } from './i18n.js';
import { State } from './state.js';
import { AudioEngine } from './engine/audio.js';
import { initHUD, appendLog } from './hud.js';

setupMatrix('matrix-canvas');
initHUD();

let currentQrAddress = '';
let currentQrNet     = 'CRYPTO';

async function writeTextWithFallback(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  ta.remove();
}

function copyAddress(address, feedbackEl) {
  if (!address) return;
  const isBtn = feedbackEl && feedbackEl.tagName === 'BUTTON';
  const originalText = feedbackEl ? feedbackEl.textContent : '';
  writeTextWithFallback(address).then(() => {
    AudioEngine.copy();
    State.unlockAchievement('CRYPTO_PATRON');
    appendLog(`> COPIED: ${address.slice(0, 14)}...`, 'highlight');
    if (feedbackEl) {
      feedbackEl.classList.add('copy-feedback');
      feedbackEl.textContent = t('copied');
      setTimeout(() => {
        feedbackEl.classList.remove('copy-feedback');
        feedbackEl.textContent = isBtn ? t('copy_btn') : originalText;
      }, 1500);
    }
  }).catch(() => {
    AudioEngine.error();
    if (feedbackEl) {
      feedbackEl.textContent = t('error');
      setTimeout(() => {
        feedbackEl.textContent = originalText;
      }, 1500);
    }
  });
}

const modalOverlay  = document.getElementById('modal-overlay');
const qrCanvas      = document.getElementById('qr-canvas');
const qrAddress     = document.getElementById('qr-address');
const qrNetTitle    = document.getElementById('qr-net-title');
const qrModal       = document.getElementById('qr-modal');
const qrCopyBtn     = document.getElementById('qr-copy-btn');
const qrDownloadBtn = document.getElementById('qr-download-btn');
const qrCloseBtn    = document.getElementById('qr-close-btn');
let qrInstance      = null;

function showQR(address, netLabel = 'CRYPTO GATEWAY') {
  if (!qrAddress || !modalOverlay) return;
  currentQrAddress = address;
  currentQrNet     = netLabel;
  qrAddress.textContent = address;
  if (qrNetTitle) qrNetTitle.textContent = netLabel;

  AudioEngine.modalOpen();
  State.unlockAchievement('CRYPTO_PATRON');

  if (typeof QRious !== 'undefined') {
    if (qrInstance) {
      qrInstance.set({ value: address });
    } else if (qrCanvas) {
      qrInstance = new QRious({
        element: qrCanvas,
        value: address,
        size: 240,
        background: 'black',
        foreground: '#ff3333'
      });
    }
  } else if (qrCanvas) {
    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      qrCanvas.width = 240;
      qrCanvas.height = 240;
      ctx.fillStyle = '#080000';
      ctx.fillRect(0, 0, 240, 240);
      ctx.fillStyle = '#ff3333';
      ctx.font = '14px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ QR ENGINE OFFLINE ]', 120, 120);
    }
  }

  modalOverlay.classList.add('visible');
  modalOverlay.setAttribute('aria-hidden', 'false');
}

function hideQR() {
  if (modalOverlay && modalOverlay.classList.contains('visible')) {
    AudioEngine.modalClose();
    modalOverlay.classList.remove('visible');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }
}

// Bind wallet address clicks & keyboard Enter/Space
document.querySelectorAll('.wallet-address').forEach(el => {
  const addr = el.getAttribute('data-address') || el.textContent.trim();
  el.addEventListener('click', () => copyAddress(addr, el));
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      copyAddress(addr, el);
    }
  });
});

// Bind explicit COPY buttons
document.querySelectorAll('.copy-btn[data-copy-address]').forEach(btn => {
  btn.addEventListener('click', () => {
    const addr = btn.getAttribute('data-copy-address');
    copyAddress(addr, btn);
  });
});

// Bind QR buttons
document.querySelectorAll('.qr-btn[data-address]').forEach(btn => {
  btn.addEventListener('click', () => {
    const address = btn.getAttribute('data-address');
    const net     = btn.getAttribute('data-net') || 'CRYPTO GATEWAY';
    if (address) showQR(address, net);
  });
});

if (qrCopyBtn) {
  qrCopyBtn.addEventListener('click', () => copyAddress(currentQrAddress, qrCopyBtn));
}

if (qrDownloadBtn) {
  qrDownloadBtn.addEventListener('click', () => {
    if (!qrCanvas) return;
    AudioEngine.click();
    // Create branded PNG canvas with BOZHEMAN header & network label
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width  = 320;
    exportCanvas.height = 380;
    const ctx = exportCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#050000';
      ctx.fillRect(0, 0, 320, 380);
      ctx.strokeStyle = '#ff3333';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, 312, 372);

      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 14px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`BOZHEMAN ≡ ${currentQrNet}`, 160, 32);

      ctx.drawImage(qrCanvas, 40, 50, 240, 240);

      ctx.fillStyle = '#ff3333';
      ctx.font = '10px "Fira Code", monospace';
      const shortAddr = currentQrAddress.length > 34
        ? `${currentQrAddress.slice(0, 18)}...${currentQrAddress.slice(-14)}`
        : currentQrAddress;
      ctx.fillText(shortAddr, 160, 320);
      ctx.fillStyle = '#00ff88';
      ctx.fillText('BOZHEMAN.COM • @GrowerSim_bot', 160, 350);
    }

    const link = document.createElement('a');
    const safeName = currentQrNet.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `bozheman_${safeName}_qr.png`;
    link.href = (ctx ? exportCanvas : qrCanvas).toDataURL('image/png');
    link.click();
  });
}

if (qrCloseBtn) {
  qrCloseBtn.addEventListener('click', hideQR);
}

if (modalOverlay) {
  modalOverlay.addEventListener('click', hideQR);
}

if (qrModal) {
  qrModal.addEventListener('click', (e) => e.stopPropagation());
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('visible')) {
    hideQR();
  }
});

// Init main site QR
const mainQrCanvas = document.getElementById('main-qr-canvas');
if (mainQrCanvas && typeof QRious !== 'undefined') {
  new QRious({
    element: mainQrCanvas,
    value: 'https://bozheman.com',
    size: 140,
    background: 'black',
    foreground: '#ff3333'
  });
}

document.addEventListener('languagechange', () => {
  applyTranslations();
});
