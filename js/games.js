import { setupMatrix } from './matrix.js';
import {
  auth, db,
  signInWithPopup, GoogleAuthProvider,
  collection, addDoc, serverTimestamp, query, where, getDocs
} from './firebase-config.js';
import { t, applyTranslations } from './i18n.js';
import { State } from './state.js';
import { AudioEngine } from './engine/audio.js';
import { initHUD, appendLog } from './hud.js';

setupMatrix('matrix-canvas');
initHUD();

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
    border: 1px solid ${type === 'error' ? '#a30000' : '#ff3333'};
    color: var(--clr-primary, #ff3333);
    font-family: 'Fira Code', monospace; font-size: 0.85rem;
    white-space: nowrap; max-width: 90vw; text-align: center; overflow: hidden; text-overflow: ellipsis;
    opacity: 0; transition: opacity 0.25s ease, transform 0.25s ease;
    box-shadow: 0 0 20px rgba(255, 51, 51, 0.4);
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
  const launchDate = new Date('2026-12-31T20:00:00+03:00');
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

setInterval(() => {
  if (!document.hidden) updateCountdown();
}, 1000);
updateCountdown();

// ─── Filter Bar & Live Search Logic ────────────────────────────────────────
const filterBtns  = document.querySelectorAll('.filter-btn');
const gameCards   = document.querySelectorAll('.game-card');
const searchInput = document.getElementById('project-search');
let activeFilter  = 'all';

function updateFilterCounts() {
  const counts = { all: gameCards.length, bot: 0, web: 0, dev: 0 };
  gameCards.forEach(c => {
    const cat = c.dataset.category;
    if (counts[cat] !== undefined) counts[cat]++;
  });
  document.querySelectorAll('[data-count-for]').forEach(badge => {
    const key = badge.dataset.countFor;
    if (counts[key] !== undefined) badge.textContent = String(counts[key]);
  });
}

function applyFilterAndSearch() {
  const queryText = (searchInput ? searchInput.value : '').trim().toLowerCase();
  gameCards.forEach(card => {
    const matchesCat = activeFilter === 'all' || card.dataset.category === activeFilter;
    const text = card.textContent.toLowerCase();
    const matchesSearch = !queryText || text.includes(queryText);
    card.style.display = (matchesCat && matchesSearch) ? 'flex' : 'none';
  });
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    AudioEngine.click();
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter || 'all';
    applyFilterAndSearch();
  });
});

if (searchInput) {
  searchInput.addEventListener('input', () => {
    AudioEngine.terminalKey();
    applyFilterAndSearch();
  });
}

updateFilterCounts();

// ─── Modal Manual Logic ──────────────────────────────────────────────────────
const openManualBtn    = document.getElementById('open-manual-btn');
const closeManualBtn   = document.getElementById('close-manual-btn');
const modalCloseFooter = document.getElementById('modal-footer-close');
const manualModal      = document.getElementById('manual-modal');

function openModal() {
  if (manualModal) {
    AudioEngine.modalOpen();
    manualModal.classList.add('active');
    manualModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    appendLog('> GROWERSIM_MANUAL: OPENED', 'info');
  }
}

function closeModal() {
  if (manualModal) {
    AudioEngine.modalClose();
    manualModal.classList.remove('active');
    manualModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
}

if (openManualBtn) openManualBtn.addEventListener('click', openModal);

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
const manualTabs  = document.querySelectorAll('.manual-tab');
const tabContents = document.querySelectorAll('.tab-content');

manualTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    AudioEngine.click();
    manualTabs.forEach(tEl => tEl.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));

    tab.classList.add('active');
    const targetId = tab.dataset.tab;
    const targetContent = document.getElementById(targetId);
    if (targetContent) targetContent.classList.add('active');
  });
});

// ─── Firebase Auth & Email Submission (with Local Protocol Fallback) ──────────
const notifyBtn = document.getElementById('notify-btn');

if (notifyBtn) {
  if (State.read('subscribedEmail')) {
    notifyBtn.textContent = t('game_1_btn_subscribed');
    notifyBtn.disabled = true;
  }

  notifyBtn.addEventListener('click', async () => {
    if (notifyBtn.disabled) return;
    AudioEngine.click();

    notifyBtn.disabled = true;
    const originalText = notifyBtn.textContent;
    notifyBtn.textContent = t('game_1_btn_connecting');

    let success = false;
    try {
      const provider = new GoogleAuthProvider();
      const result   = await signInWithPopup(auth, provider);
      const user     = result.user;

      if (user && user.email) {
        notifyBtn.textContent = t('game_1_btn_verifying');

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
          State.set({ subscribedEmail: user.email });
          showToast(t('toast_saved', { email: user.email }), 'success');
        } else {
          State.set({ subscribedEmail: user.email });
          showToast(t('toast_already'), 'info');
          notifyBtn.textContent = t('game_1_btn_already');
        }
        success = true;
      }
    } catch (error) {
      if (error && error.code === 'auth/popup-closed-by-user') {
        showToast(t('toast_auth_closed'), 'error');
      } else {
        // Fallback local protocol subscription if popup blocked or offline
        State.set({ subscribedEmail: 'local_node@bozheman.protocol' });
        notifyBtn.textContent = t('game_1_btn_subscribed');
        showToast(t('toast_saved', { email: 'LOCAL_NODE' }), 'success');
        appendLog('> TERMINUS_NOTIFY: REGISTERED IN LOCAL NODE', 'highlight');
        success = true;
      }
    } finally {
      if (!success) {
        notifyBtn.textContent = originalText;
        notifyBtn.disabled = false;
      }
    }
  });
}

document.addEventListener('languagechange', () => {
  applyTranslations();
  updateFilterCounts();
});

// --- 3D HOVER EFFECTS (desktop only) ---
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  const cards = document.querySelectorAll('.game-card');
  cards.forEach(card => {
    card.addEventListener('mouseenter', () => AudioEngine.hover());
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(1000px) scale(1.015) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = `perspective(1000px) scale(1) rotateX(0deg) rotateY(0deg)`;
    });
  });
}
