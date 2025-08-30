document.addEventListener('DOMContentLoaded', () => {
    // --- GAME STATE & CONFIG ---
    let balance = 1000;
    let currentBets = {};
    let selectedChipValue = 1;
    let isSpinning = false;
    let sigilUnlocked = false;

    const WHEEL_NUMBERS_IN_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
    const NUMBER_COLORS = { 0: '#008000', 32: '#8B0000', 15: '#222', 19: '#8B0000', 4: '#222', 21: '#8B0000', 2: '#222', 25: '#8B0000', 17: '#222', 34: '#8B0000', 6: '#222', 27: '#8B0000', 13: '#222', 36: '#8B0000', 11: '#222', 30: '#8B0000', 8: '#222', 23: '#8B0000', 10: '#222', 5: '#8B0000', 24: '#222', 16: '#8B0000', 33: '#222', 1: '#8B0000', 20: '#222', 14: '#8B0000', 31: '#222', 9: '#8B0000', 22: '#222', 18: '#8B0000', 29: '#222', 7: '#8B0000', 28: '#222', 12: '#8B0000', 35: '#222', 3: '#8B0000', 26: '#222' };
    const NUMBER_TYPE = { 0: 'green', 32: 'red', 15: 'black', 19: 'red', 4: 'black', 21: 'red', 2: 'black', 25: 'red', 17: 'black', 34: 'red', 6: 'black', 27: 'red', 13: 'black', 36: 'red', 11: 'black', 30: 'red', 8: 'black', 23: 'red', 10: 'black', 5: 'red', 24: 'black', 16: 'red', 33: 'black', 1: 'red', 20: 'black', 14: 'red', 31: 'black', 9: 'red', 22: 'black', 18: 'red', 29: 'black', 7: 'red', 28: 'black', 12: 'red', 35: 'black', 3: 'red', 26: 'black' };
    
    const CHIP_VALUES = [1, 5, 10, 25, 100];
    const CHIP_COLORS = { 1: '#c0c0c0', 5: '#ff4d4d', 10: '#4d94ff', 25: '#33cc33', 100: '#e6e600' };
    const PAYOUTS = { single: 36, dozen: 3, half: 2, even_odd: 2, color: 2 };

    // --- CANVAS & DRAWING ---
    const canvas = document.getElementById('wheel-canvas');
    const ctx = canvas.getContext('2d');
    const arc = Math.PI * 2 / WHEEL_NUMBERS_IN_ORDER.length;
    let currentAngle = 0;

    // --- DOM ELEMENTS ---
    const balanceDisplay = document.getElementById('balance-display');
    const totalBetDisplay = document.getElementById('total-bet-display');
    const lastNumberDisplay = document.getElementById('last-number-display');
    const betBoard = document.getElementById('bet-board');
    const chipsSelector = document.getElementById('chips-selector');
    const spinButton = document.getElementById('spin-button');
    const clearButton = document.getElementById('clear-button');
    const sigilModal = document.getElementById('sigil-modal-overlay');

    // --- INITIALIZATION ---
    function init() {
        drawWheel();
        createBetBoard();
        createChips();
        updateDisplays();
        
        spinButton.addEventListener('click', spin);
        clearButton.addEventListener('click', clearBets);
        betBoard.addEventListener('click', placeBet);
        chipsSelector.addEventListener('click', selectChip);
    }

    function drawWheel() {
        const radius = canvas.width / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(currentAngle);

        for (let i = 0; i < WHEEL_NUMBERS_IN_ORDER.length; i++) {
            const num = WHEEL_NUMBERS_IN_ORDER[i];
            const startAngle = i * arc - arc / 2;
            
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius - 10, startAngle, startAngle + arc);
            ctx.closePath();
            ctx.fillStyle = NUMBER_COLORS[num];
            ctx.fill();
            ctx.strokeStyle = '#444';
            ctx.stroke();

            ctx.save();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Fira Code';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.rotate(startAngle + arc / 2);
            ctx.fillText(num, radius - 30, 0);
            ctx.restore();
        }
        ctx.restore();
    }

    function createBetBoard() {
        betBoard.innerHTML = '';
        const zero = createCell('0', 'number-0');
        zero.dataset.betType = 'single_0';
        betBoard.appendChild(zero);

        for (let i = 1; i <= 36; i++) {
            const colorClass = NUMBER_TYPE[i];
            const cell = createCell(i.toString(), colorClass);
            cell.dataset.betType = `single_${i}`;
            betBoard.appendChild(cell);
        }
        
        const specialBets = [
            { text: '1-12', type: '1-12' }, 
            { text: '13-24', type: '13-24' }, 
            { text: '25-36', type: '25-36' },
            { text: '1-18', type: '1-18' }, 
            { text: '19-36', type: '19-36' },
            { text: 'EVEN', type: 'even' }, 
            { text: 'RED', type: 'red-bet' },
            { text: 'BLACK', type: 'black-bet' },
            { text: 'ODD', type: 'odd' }
        ];

        specialBets.forEach(bet => {
            const cell = createCell(bet.text, 'special');
            cell.dataset.betType = bet.type;
            betBoard.appendChild(cell);
        });
    }

    function createChips() {
        chipsSelector.innerHTML = '';
        CHIP_VALUES.forEach(value => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.textContent = value;
            chip.dataset.value = value;
            chip.style.backgroundColor = CHIP_COLORS[value];
            chip.style.borderColor = CHIP_COLORS[value];
            if (value === selectedChipValue) chip.classList.add('active');
            chipsSelector.appendChild(chip);
        });
    }
    
    function selectChip(event) {
        const chip = event.target.closest('.chip');
        if (!chip) return;
        selectedChipValue = parseInt(chip.dataset.value);
        document.querySelector('.chip.active').classList.remove('active');
        chip.classList.add('active');
    }
    
    function placeBet(event) {
        if (isSpinning) return;
        const cell = event.target.closest('.bet-cell');
        if (!cell) return;
        if (balance < selectedChipValue) { return; }
        balance -= selectedChipValue;
        const betType = cell.dataset.betType;
        currentBets[betType] = (currentBets[betType] || 0) + selectedChipValue;
        updateCellChip(cell, betType);
        updateDisplays();
    }

    function spin() {
        if (isSpinning || Object.keys(currentBets).length === 0) return;
        isSpinning = true;

        const targetIndex = Math.floor(Math.random() * WHEEL_NUMBERS_IN_ORDER.length);
        const targetAngle = targetIndex * arc;
        
        const fullSpins = Math.PI * 2 * (Math.floor(Math.random() * 5) + 5);
        const finalAngle = fullSpins - targetAngle;

        let start = null;
        const duration = 6000;

        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const easeOutProgress = 1 - Math.pow(1 - Math.min(progress / duration, 1), 4);
            
            currentAngle = easeOutProgress * finalAngle;
            drawWheel();

            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                currentAngle = finalAngle;
                drawWheel();
                endSpin(WHEEL_NUMBERS_IN_ORDER[targetIndex]);
            }
        }
        requestAnimationFrame(animate);
    }
    
    function endSpin(winningNumber) {
        const winningColor = NUMBER_TYPE[winningNumber];
        lastNumberDisplay.textContent = `${winningNumber} (${winningColor.toUpperCase()})`;
        calculateWinnings(winningNumber, winningColor);
        clearBets(false);
        isSpinning = false;
        
        if (balance >= 5000 && !sigilUnlocked) {
            sigilUnlocked = true;
            setTimeout(() => {
                if(sigilModal) sigilModal.classList.add('visible');
            }, 500);
        }
    }

    function calculateWinnings(number, color) {
        let totalWinnings = 0;
        for (const betType in currentBets) {
            const betAmount = currentBets[betType];
            let win = 0;

            if (betType.startsWith('single_')) {
                if (parseInt(betType.split('_')[1]) === number) win = betAmount * PAYOUTS.single;
            } else {
                if ((betType === '1-12' && number >= 1 && number <= 12) ||
                    (betType === '13-24' && number >= 13 && number <= 24) ||
                    (betType === '25-36' && number >= 25 && number <= 36)) {
                    win = betAmount * PAYOUTS.dozen;
                }
                if ((betType === '1-18' && number >= 1 && number <= 18) ||
                    (betType === '19-36' && number >= 19 && number <= 36)) {
                    win = betAmount * PAYOUTS.half;
                }
                if ((betType === 'even' && number % 2 === 0 && number !== 0) ||
                    (betType === 'odd' && number % 2 !== 0)) {
                    win = betAmount * PAYOUTS.even_odd;
                }
                if ((betType === 'red-bet' && color === 'red') || (betType === 'black-bet' && color === 'black')) {
                    win = betAmount * PAYOUTS.color;
                }
            }
            totalWinnings += win;
        }
        
        balance += totalWinnings;
        updateDisplays();
    }
    
    function clearBets(refund = true) {
        if (isSpinning) return;
        if (refund) {
            const totalBet = Object.values(currentBets).reduce((sum, amount) => sum + amount, 0);
            balance += totalBet;
        }
        currentBets = {};
        document.querySelectorAll('.chip-on-cell').forEach(chip => chip.remove());
        updateDisplays();
    }
    
    function updateDisplays() {
        balanceDisplay.textContent = balance;
        const totalBet = Object.values(currentBets).reduce((sum, amount) => sum + amount, 0);
        totalBetDisplay.textContent = totalBet;
    }

    function updateCellChip(cell, betType) {
        let chipOnCell = cell.querySelector('.chip-on-cell');
        if (!chipOnCell) {
            chipOnCell = document.createElement('div');
            chipOnCell.className = 'chip-on-cell';
            cell.appendChild(chipOnCell);
        }
        const highestChipValue = getHighestChipForAmount(currentBets[betType]);
        chipOnCell.style.backgroundColor = CHIP_COLORS[highestChipValue];
        chipOnCell.textContent = currentBets[betType];
    }

    function getHighestChipForAmount(amount) {
        let highestChip = 1;
        for (const value of CHIP_VALUES) {
            if (amount >= value) {
                highestChip = value;
            }
        }
        return highestChip;
    }

    function createCell(text, className) {
        const cell = document.createElement('div');
        cell.className = `bet-cell ${className}`;
        cell.textContent = text;
        return cell;
    }

    init();
});

