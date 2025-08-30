// --- GAME STATE & CONFIG ---
let balance = parseInt(localStorage.getItem('b777_balance')) || 1000;
let isSpinning = false;
const MIN_NUMBER = 1;
    const MAX_NUMBER = 7;

    // --- DOM ELEMENTS ---
    const balanceDisplay = document.getElementById('balance-display');
    const reel = document.getElementById('reel');
    const guessInput = document.getElementById('guess-input');
    const betInput = document.getElementById('bet-input');
    const spinButton = document.getElementById('spin-button');
    
    const modalOverlay = document.getElementById('message-modal-overlay');
    const modalText = document.getElementById('modal-text');
    const modalCloseButton = document.getElementById('modal-close-button');

// --- INITIALIZATION ---
function init() {
    guessInput.value = localStorage.getItem('b777_lastGuess') || '';
    betInput.value = localStorage.getItem('b777_lastBet') || '';

    updateBalanceDisplay();
    // ИЗМЕНЕНО: Добавляем (e) для передачи события
    spinButton.addEventListener('click', (e) => handleSpin(e));
    spinButton.addEventListener('touchend', (e) => handleSpin(e));
    modalCloseButton.addEventListener('click', hideModal);
    modalOverlay.addEventListener('click', hideModal);

    guessInput.addEventListener('change', () => localStorage.setItem('b777_lastGuess', guessInput.value));
    betInput.addEventListener('change', () => localStorage.setItem('b777_lastBet', betInput.value));
}

// --- GAME LOGIC ---
function handleSpin(event) {
        // ИЗМЕНЕНО: Предотвращаем случайные двойные клики на мобильных
        if (event) {
            event.preventDefault();
        }
        if (isSpinning) return;

        const guess = parseInt(guessInput.value);
        const bet = parseInt(betInput.value);

        // --- Validation ---
        if (isNaN(guess) || guess < MIN_NUMBER || guess > MAX_NUMBER) {
            showModal(`Неверное число. Введите от ${MIN_NUMBER} до ${MAX_NUMBER}.`);
            return;
        }
        if (isNaN(bet) || bet <= 0) {
            showModal('Введите корректную ставку.');
            return;
        }
        if (bet > balance) {
            showModal('Недостаточно средств.');
            return;
        }

        isSpinning = true;
        spinButton.disabled = true;
        balance -= bet;
        updateBalanceDisplay();

        const winningNumber = Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER;
        
        animateReel(winningNumber).then(() => {
            if (guess === winningNumber) {
                // Win
                const winnings = bet * 2;
                balance += winnings;
                showModal(`Вы угадали! Выигрыш: ${winnings}`);
            } else {
                // Loss
                showModal(`Проигрыш. Выпало число: ${winningNumber}`);
            }
            
            updateBalanceDisplay();
            isSpinning = false;
            spinButton.disabled = false;
        });
    }

    // --- ANIMATION & UI ---
    function animateReel(winningNumber) {
        return new Promise(resolve => {
            let reelStripHTML = '';
            for (let i = 0; i < 30; i++) {
                 const randomNum = Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER;
                 reelStripHTML += `<div class="reel-number">${randomNum}</div>`;
            }
            reelStripHTML += `<div class="reel-number">${winningNumber}</div>`;
            reel.innerHTML = reelStripHTML;
            
            reel.style.transition = 'none';
            reel.style.top = '0';

            // ИЗМЕНЕНО: Используем requestAnimationFrame для надежности
            requestAnimationFrame(() => {
                const firstReelNumber = reel.querySelector('.reel-number');
                if (!firstReelNumber) {
                    console.error("Ошибка отрисовки барабана.");
                    resolve(); // Завершаем, чтобы не блокировать кнопку
                    return;
                }
                const reelHeight = firstReelNumber.offsetHeight;
                const finalPosition = -(reel.children.length - 1) * reelHeight;
                
                reel.style.transition = 'top 3s cubic-bezier(0.25, 1, 0.5, 1)'; 
                reel.style.top = `${finalPosition}px`;

                setTimeout(resolve, 3100); 
            });
        });
    }

    function updateBalanceDisplay() {
        balanceDisplay.textContent = balance;
        localStorage.setItem('b777_balance', balance);
    }

    function showModal(message) {
        modalText.textContent = message;
        modalOverlay.classList.add('visible');
    }

    function hideModal() {
        modalOverlay.classList.remove('visible');
    }

    init();
});

