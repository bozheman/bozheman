document.addEventListener('DOMContentLoaded', () => {
    // --- GAME STATE & CONFIG ---
    // ЗАГРУЗКА ИЗ ПАМЯТИ УСТРОЙСТВА
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
        // ЗАГРУЗКА ПОСЛЕДНЕЙ СТАВКИ И ЧИСЛА
        guessInput.value = localStorage.getItem('b777_lastGuess') || '';
        betInput.value = localStorage.getItem('b777_lastBet') || '';
        updateBalanceDisplay();

        // УНИВЕРСАЛЬНЫЕ СЛУШАТЕЛИ ДЛЯ ВСЕХ УСТРОЙСТВ
        spinButton.addEventListener('click', handleSpin);
        spinButton.addEventListener('touchend', handleSpin);
        modalCloseButton.addEventListener('click', hideModal);
        modalOverlay.addEventListener('click', hideModal);

        // СОХРАНЕНИЕ ВВОДА ПРИ ИЗМЕНЕНИИ
        guessInput.addEventListener('input', () => localStorage.setItem('b777_lastGuess', guessInput.value));
        betInput.addEventListener('input', () => localStorage.setItem('b777_lastBet', betInput.value));
    }

    // --- GAME LOGIC ---
    // ИСПОЛЬЗУЕМ ASYNC/AWAIT ДЛЯ НАДЕЖНОСТИ
    async function handleSpin(event) {
        if (event) event.preventDefault();
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

        try {
            balance -= bet;
            updateBalanceDisplay();

            const winningNumber = Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER;
            
            // Ждем завершения анимации
            await animateReel(winningNumber);

            if (guess === winningNumber) {
                const winnings = bet * 2;
                balance += winnings;
                showModal(`Вы угадали! Выигрыш: ${winnings}`);
            } else {
                showModal(`Проигрыш. Выпало число: ${winningNumber}`);
            }
        } catch (error) {
            console.error("Произошла ошибка во время вращения:", error);
            showModal("Произошла критическая ошибка. Попробуйте снова.");
            balance += bet; // Возвращаем ставку в случае ошибки
        } finally {
            // ЭТОТ БЛОК ВЫПОЛНИТСЯ ВСЕГДА, ГАРАНТИРУЯ РАЗБЛОКИРОВКУ
            updateBalanceDisplay();
            isSpinning = false;
            spinButton.disabled = false;
        }
    }

    // --- ANIMATION & UI ---
    function animateReel(winningNumber) {
        return new Promise((resolve, reject) => {
            let reelStripHTML = '';
            for (let i = 0; i < 30; i++) {
                const randomNum = Math.floor(Math.random() * MAX_NUMBER) + MIN_NUMBER;
                reelStripHTML += `<div class="reel-number">${randomNum}</div>`;
            }
            reelStripHTML += `<div class="reel-number">${winningNumber}</div>`;
            reel.innerHTML = reelStripHTML;
            
            reel.style.transition = 'none';
            reel.style.top = '0';

            requestAnimationFrame(() => {
                const firstReelNumber = reel.querySelector('.reel-number');
                if (!firstReelNumber) {
                    reject(new Error("Ошибка отрисовки барабана."));
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
        // СОХРАНЯЕМ БАЛАНС ПРИ КАЖДОМ ОБНОВЛЕНИИ
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

