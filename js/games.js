import { setupMatrix } from './matrix.js';
import {
  auth, db,
  signInWithPopup, GoogleAuthProvider,
  collection, addDoc, serverTimestamp, query, where, getDocs
} from './firebase-config.js';
import { t } from './i18n.js';

setupMatrix('matrix-canvas');

// ─── Toast UI ──────────────────────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const existing = document.getElementById('games-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'games-toast';
  toast.textContent = msg;
  toast.style.cssText = `
    position: fixed; bottom: 2rem; left: 50%; transform: translateX(-50%) translateY(20px);
    z-index: 9999; padding: 0.8rem 1.6rem;
    background: rgba(0,0,0,0.95); backdrop-filter: blur(12px);
    border: 1px solid ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff3333' : '#a30000'};
    color: ${type === 'success' ? '#00ff88' : type === 'error' ? '#ff3333' : '#fff'};
    font-family: 'Fira Code', monospace; font-size: 0.85rem;
    white-space: nowrap; max-width: 90vw; text-align: center; overflow: hidden; text-overflow: ellipsis;
    opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease;
    box-shadow: 0 0 20px ${type === 'success' ? 'rgba(0,255,136,0.3)' : 'rgba(255,51,51,0.3)'};
  `;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ─── Countdown ─────────────────────────────────────────────────────────────
function updateCountdown() {
  const launchDate = new Date('2026-09-09T12:00:00+03:00');
  const now  = new Date();
  const diff = launchDate - now;

  const timerEl = document.getElementById('timer');
  if (!timerEl) return;

  if (diff > 0) {
    const days  = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins  = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs  = Math.floor((diff % (1000 * 60)) / 1000);
    timerEl.textContent = `${days}d ${hours}h ${mins}m ${secs}s`;
  } else {
    timerEl.textContent = t('game_1_timer_soon');
  }
}

setInterval(updateCountdown, 1000);
updateCountdown();

// ─── Filter Bar Logic ────────────────────────────────────────────────────────
const filterBtns = document.querySelectorAll('.filter-btn');
const gameCards  = document.querySelectorAll('.game-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    gameCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.style.display = 'flex';
      } else {
        card.style.display = 'none';
      }
    });
  });
});

// ─── Modal Manual Logic ──────────────────────────────────────────────────────
const openManualBtn  = document.getElementById('open-manual-btn');
const closeManualBtn = document.getElementById('close-manual-btn');
const modalCloseFooter = document.getElementById('modal-footer-close');
const manualModal    = document.getElementById('manual-modal');

function openModal() {
  if (manualModal) {
    manualModal.classList.add('active');
    manualModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  if (manualModal) {
    manualModal.classList.remove('active');
    manualModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

if (openManualBtn) openManualBtn.addEventListener('click', openModal);

// Full manual button navigation
const fullManualBtn = document.getElementById('full-manual-btn');
if (fullManualBtn) {
  fullManualBtn.addEventListener('click', () => {
    window.location.href = 'grower_manual.html';
  });
}
if (closeManualBtn) closeManualBtn.addEventListener('click', closeModal);
if (modalCloseFooter) modalCloseFooter.addEventListener('click', closeModal);

if (manualModal) {
  manualModal.addEventListener('click', (e) => {
    if (e.target === manualModal) closeModal();
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && manualModal && manualModal.classList.contains('active')) {
    closeModal();
  }
});

// ─── Modal Tab Navigation ─────────────────────────────────────────────────────
const manualTabs = document.querySelectorAll('.manual-tab');
const tabContents = document.querySelectorAll('.tab-content');

manualTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    manualTabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    const targetId = tab.dataset.tab;
    const targetContent = document.getElementById(targetId);
    if (targetContent) targetContent.classList.add('active');
  });
});

// ─── Firebase Auth & Email Submission ──────────────────────────────────────
const notifyBtn = document.getElementById('notify-btn');

if (notifyBtn) {
  notifyBtn.addEventListener('click', async () => {
    if (notifyBtn.disabled) return;

    // Loading state
    notifyBtn.disabled = true;
    const originalText = notifyBtn.textContent;
    notifyBtn.textContent = t('game_1_btn_connecting');

    try {
      const provider = new GoogleAuthProvider();
      const result   = await signInWithPopup(auth, provider);
      const user     = result.user;

      if (user && user.email) {
        notifyBtn.textContent = t('game_1_btn_verifying');

        // Check if already subscribed
        const q             = query(collection(db, 'interested_users'), where('email', '==', user.email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          await addDoc(collection(db, 'interested_users'), {
            email:       user.email,
            displayName: user.displayName,
            uid:         user.uid,
            timestamp:   serverTimestamp(),
          });
          notifyBtn.textContent = t('game_1_btn_subscribed');
          showToast(t('toast_saved', { email: user.email }), 'success');
        } else {
          showToast(t('toast_already'), 'info');
          notifyBtn.textContent = t('game_1_btn_already');
        }
        // Don't re-enable — user is subscribed
      }
    } catch (error) {
      console.error('Auth error:', error);
      const msg = error.code === 'auth/popup-closed-by-user'
        ? t('toast_auth_closed')
        : t('toast_auth_error');
      showToast(msg, 'error');
      notifyBtn.textContent = originalText;
      notifyBtn.disabled = false;
    }
  });
}
