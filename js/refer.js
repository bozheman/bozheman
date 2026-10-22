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
  const originalText = feedbackEl ? feedbackEl.textContent : '';
  writeTextWithFallback(address).then(() => {
    AudioEngine.copy();
    State.unlockAchievement('CRYPTO_PATRON');
    appendLog(`> WALLET_COPIED: ${address.slice(0, 10)}...`, 'highlight');
    if (feedbackEl) {
      feedbackEl.classList.add('copy-feedback');
      feedbackEl.textContent = t('copied');
      setTimeout(() => {
        feedbackEl.classList.remove('copy-feedback');
        feedbackEl.textContent = originalText;
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
        size: 256,
        background: 'black',
        foreground: '#ff3333'
      });
    }
  } else if (qrCanvas) {
    const ctx = qrCanvas.getContext('2d');
    if (ctx) {
      qrCanvas.width = 256;
      qrCanvas.height = 256;
      ctx.fillStyle = '#080000';
      ctx.fillRect(0, 0, 256, 256);
      ctx.fillStyle = '#ff3333';
      ctx.font = '14px "Fira Code", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[ QR ENGINE OFFLINE ]', 128, 128);
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
    const link = document.createElement('a');
    const safeName = currentQrNet.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `bozheman_${safeName}_qr.png`;
    link.href = qrCanvas.toDataURL('image/png');
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
    size: 150,
    background: 'black',
    foreground: '#ff3333'
  });
}

document.addEventListener('languagechange', () => {
  applyTranslations();
});
