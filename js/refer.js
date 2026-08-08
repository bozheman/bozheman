import { setupMatrix } from './matrix.js';
import { t } from './i18n.js';
setupMatrix('matrix-canvas');

window.copyToClipboard = function(element) {
  const originalText = element.innerText;
  navigator.clipboard.writeText(originalText).then(() => {
    element.classList.add('copy-feedback');
    element.innerText = t('copied');
    setTimeout(() => {
      element.classList.remove('copy-feedback');
      element.innerText = originalText;
    }, 1500);
  }).catch(err => {
    console.error("Copy error: ", err);
    element.innerText = t('error');
    setTimeout(() => {
      element.innerText = originalText;
    }, 1500);
  });
};

const modalOverlay = document.getElementById('modal-overlay');
const qrCanvas = document.getElementById('qr-canvas');
const qrAddress = document.getElementById('qr-address');
let qrInstance = null;

window.showQR = function(address) {
  if (!qrAddress || !modalOverlay) return;
  qrAddress.textContent = address;
  
  if (typeof QRious !== 'undefined') {
    if (qrInstance) {
      qrInstance.set({ value: address });
    } else if (qrCanvas) {
      qrInstance = new QRious({
        element: qrCanvas,
        value: address,
        size: 256,
        background: 'white',
        foreground: 'black'
      });
    }
  } else if (qrCanvas) {
    // Fallback if QRious CDN failed to load
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
};

window.hideQR = function() {
  if (modalOverlay) {
    modalOverlay.classList.remove('visible');
    modalOverlay.setAttribute('aria-hidden', 'true');
  }
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalOverlay && modalOverlay.classList.contains('visible')) {
    window.hideQR();
  }
});
