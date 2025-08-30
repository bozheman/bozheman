document.addEventListener('DOMContentLoaded', () => {
    // --- GAME STATE & CONFIG ---
    let balance = 1000;
    let currentBets = {}; // { 'bet_type': amount }
    let selectedChipValue = 1;
    let isSpinning = false;

    const CHIP_VALUES = [1, 5, 10, 25, 100];
    const CHIP_COLORS = {
        1: '#c0c0c0',
        5: '#ff4d4d',
        10: '#4d94ff',
        25: '#33cc33',
        100: '#e6e600'
    };

    // [number, color]
    const WHEEL_NUMBERS = [
        [0, 'green'], [32, 'red'], [15, 'black'], [19, 'red'], [4, 'black'],
        [21, 'red'], [2, 'black'], [25, 'red'], [17, 'black'], [34, 'red'],
        [6, 'black'], [27, 'red'], [13, 'black'], [36, 'red'], [11, 'black'],
        [30, 'red'], [8, 'black'], [23, 'red'], [10, 'black'], [5, 'red'],
        [24, 'black'], [16, 'red'], [33, 'black'], [1, 'red'], [20, 'black'],
        [14, 'red'], [31, 'black'], [9, 'red'], [22, 'black'], [18, 'red'],
        [29, 'black'], [7, 'red'], [28, 'black'], [12, 'red'], [35, 'black'],
        [3, 'red'], [26, 'black']
    ];

    const PAYOUTS = {
        'single': 36,
        'dozen': 3,
        'column': 3,
        'half': 2,
        'even_odd': 2,
        'color': 2
    };

    // --- DOM ELEMENTS ---
    const balanceDisplay = document.getElementById('balance-display');
    const totalBetDisplay = document.getElementById('total-bet-display');
    const lastNumberDisplay = document.getElementById('last-number-display');
    const wheelImage = document.getElementById('wheel');
    const betBoard = document.getElementById('bet-board');
    const chipsSelector = document.getElementById('chips-selector');
    const spinButton = document.getElementById('spin-button');
    const clearButton = document.getElementById('clear-button');

    // --- INITIALIZATION ---
    function init() {
        createBetBoard();
        createChips();
        updateDisplays();
        
        spinButton.addEventListener('click', spin);
        clearButton.addEventListener('click', clearBets);
        betBoard.addEventListener('click', placeBet);
        chipsSelector.addEventListener('click', selectChip);
    }

    function createBetBoard() {
        betBoard.innerHTML = '';
        // Zero
        const zero = createCell('0', 'number-0');
        zero.dataset.betType = 'single_0';
        betBoard.appendChild(zero);

        // Numbers 1-36
        for (let i = 1; i <= 36; i++) {
            const numInfo = WHEEL_NUMBERS.find(n => n[0] === i);
            const cell = createCell(i.toString(), numInfo[1]);
            cell.dataset.betType = `single_${i}`;
            cell.style.gridColumn = 'span 1';
            betBoard.appendChild(cell);
        }
        
        // Special bets
        const specialBets = [
            { text: '1-12', type: '1-12' }, { text: '13-24', type: '13-24' }, { text: '25-36', type: '25-36' },
            { text: '1-18', type: '1-18' }, { text: 'EVEN', type: 'even' }, { text: 'RED', type: 'red' },
            { text: 'BLACK', type: 'black' }, { text: 'ODD', type: 'odd' }, { text: '19-36', type: '19-36' }
        ];

        specialBets.forEach(bet => {
            const cell = createCell(bet.text, 'special');
            cell.dataset.betType = bet.type;
            betBoard.appendChild(cell);
        });
    }

    function createCell(text, className) {
        const cell = document.createElement('div');
        cell.className = `bet-cell ${className}`;
        cell.textContent = text;
        return cell;
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

    // --- GAME LOGIC ---
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
        
        if (balance < selectedChipValue) {
            alert("Недостаточно средств!");
            return;
        }

        balance -= selectedChipValue;
        const betType = cell.dataset.betType;
        currentBets[betType] = (currentBets[betType] || 0) + selectedChipValue;

        updateCellChip(cell, betType);
        updateDisplays();
    }

    function spin() {
        if (isSpinning || Object.keys(currentBets).length === 0) return;
        isSpinning = true;
        spinButton.disabled = true;

        const randomIndex = Math.floor(Math.random() * WHEEL_NUMBERS.length);
        const winningNumberInfo = WHEEL_NUMBERS[randomIndex];
        const winningNumber = winningNumberInfo[0];
        const numberIndexOnWheel = WHEEL_NUMBERS.findIndex(n => n[0] === winningNumber);

        const baseRotation = 360 * 5; // 5 full spins
        const sectorAngle = 360 / WHEEL_NUMBERS.length;
        const finalAngle = baseRotation - (numberIndexOnWheel * sectorAngle);
        
        wheelImage.style.transform = `rotate(${finalAngle}deg)`;

        setTimeout(() => {
            calculateWinnings(winningNumberInfo);
            lastNumberDisplay.textContent = `${winningNumber} (${winningNumberInfo[1].toUpperCase()})`;
            clearBets(false); // Clear bets but keep balance
            isSpinning = false;
            spinButton.disabled = false;
        }, 6500); // Wait for animation to finish
    }

    function calculateWinnings(winningNumberInfo) {
        let totalWinnings = 0;
        const [number, color] = winningNumberInfo;

        for (const betType in currentBets) {
            const betAmount = currentBets[betType];
            let win = 0;

            if (betType.startsWith('single_')) {
                if (parseInt(betType.split('_')[1]) === number) win = betAmount * PAYOUTS.single;
            } else {
                if ( (betType === '1-12' && number >= 1 && number <= 12) ||
                     (betType === '13-24' && number >= 13 && number <= 24) ||
                     (betType === '25-36' && number >= 25 && number <= 36) ) {
                    win = betAmount * PAYOUTS.dozen;
                }
                if ( (betType === '1-18' && number >= 1 && number <= 18) ||
                     (betType === '19-36' && number >= 19 && number <= 36) ) {
                    win = betAmount * PAYOUTS.half;
                }
                if ( (betType === 'even' && number % 2 === 0 && number !== 0) ||
                     (betType === 'odd' && number % 2 !== 0) ) {
                    win = betAmount * PAYOUTS.even_odd;
                }
                if (betType === color) {
                    win = betAmount * PAYOUTS.color;
                }
            }
            totalWinnings += win;
        }
        
        balance += totalWinnings;
        updateDisplays();
        if (totalWinnings > 0) {
            alert(`Выигрыш: ${totalWinnings}`);
        }
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

    // --- UI UPDATES ---
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
            const highestChipValue = getHighestChipForAmount(currentBets[betType]);
            chipOnCell.style.backgroundColor = CHIP_COLORS[highestChipValue];
            cell.appendChild(chipOnCell);
        }
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

    init();
});
