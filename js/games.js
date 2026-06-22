import { setupMatrix } from './matrix.js';
import { auth, db, signInWithPopup, GoogleAuthProvider, collection, addDoc, serverTimestamp, query, where, getDocs } from './firebase-config.js';

setupMatrix('matrix-canvas');

function updateCountdown() {
  const launchDate = new Date('2026-12-31T00:00:00');
  const now = new Date();
  const diff = launchDate - now;
  
  if (diff > 0) {
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.textContent = `${days}д ${hours}ч ${mins}м ${secs}с`;
    }
  } else {
    const timerEl = document.getElementById('timer');
    if (timerEl) {
      timerEl.textContent = 'Скоро!';
    }
  }
}

setInterval(updateCountdown, 1000);
updateCountdown();

// Firebase Auth & Email Submission
const notifyBtn = document.getElementById('notify-btn');

if (notifyBtn) {
  notifyBtn.addEventListener('click', async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (user && user.email) {
        // Check if already subscribed
        const q = query(collection(db, "interested_users"), where("email", "==", user.email));
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
          await addDoc(collection(db, "interested_users"), {
            email: user.email,
            displayName: user.displayName,
            uid: user.uid,
            timestamp: serverTimestamp()
          });
          alert('Спасибо! Ваша почта ' + user.email + ' успешно сохранена. Мы уведомим вас о релизе.');
        } else {
          alert('Ваша почта уже есть в списке ожидающих.');
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      alert('Произошла ошибка при авторизации. Попробуйте еще раз.');
    }
  });
}
