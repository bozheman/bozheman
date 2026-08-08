// manual_full.js – Handles full manual page interactions

// Close button functionality: return to games page
const closeBtn = document.getElementById('close-full-manual');
if (closeBtn) {
  closeBtn.addEventListener('click', () => {
    window.location.href = 'games.html';
  });
}

// Additional scripts can be added here for future enhancements
