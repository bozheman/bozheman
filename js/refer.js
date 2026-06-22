import { setupMatrix } from './matrix.js';

setupMatrix('matrix-canvas');

window.copyToClipboard = function(element) {
  const originalText = element.innerText;
  navigator.clipboard.writeText(originalText).then(() => {
    element.classList.add('copy-feedback');
    element.innerText = 'СКОПИРОВАНО!';
    setTimeout(() => {
      element.classList.remove('copy-feedback');
      element.innerText = originalText;
    }, 1500);
  }).catch(err => {
    console.error("Ошибка копирования: ", err);
    element.innerText = 'ОШИБКА';
     setTimeout(() => {
      element.innerText = originalText;
    }, 1500);
  });
}

const modalOverlay = document.getElementById('modal-overlay');
const qrCanvas = document.getElementById('qr-canvas');
const qrAddress = document.getElementById('qr-address');
let qrInstance = null;

window.showQR = function(address) {
    qrAddress.textContent = address;
    if(qrInstance) {
        qrInstance.set({ value: address });
    } else {
        qrInstance = new QRious({
            element: qrCanvas,
            value: address,
            size: 256,
            background: 'white',
            foreground: 'black'
        });
    }
    modalOverlay.classList.add('visible');
}

window.hideQR = function() {
    modalOverlay.classList.remove('visible');
}
