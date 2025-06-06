(function () {
  /* ================= STATE ================= */
  let balance = parseInt(localStorage.getItem("bman_balance")) || 100; // стартовый баланс
  let isSpinning = false;
  let currentRotation = 0;
  let spinCount = 0;
  const history = [];
  let selectedChip = 1; // номинал фишки
  let placedBet = null; // { choice, amount }

  // Последовательность чисел на колесе по часовой стрелке, начиная с 0 сверху
  const sectors = [
    0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8,
    23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12,
    35, 3, 26
  ];

  /* ========= HTML REFERENCES ========= */
  const balanceSpan = document.getElementById("balance");
  const wheelImage = document.getElementById("wheel");
  const pointer = document.getElementById("pointer");
  const msgBox = document.getElementById("message");
  const resultBox = document.getElementById("result-display");
  const historyLog = document.getElementById("history-log");
  const betBoard = document.getElementById("bet-board");
  const spinBtn = document.getElementById("spin-btn");
  const buyAccessBtn = document.getElementById("buy-access");

  /* ========= ИНИЦИАЛИЗАЦИЯ ========= */
  updateBalance();
  buildBetBoard();
  initChips();
  spinBtn.addEventListener("click", spin);

  /* ========= ФУНКЦИИ ========= */

  function updateBalance() {
    balanceSpan.textContent = balance;
    localStorage.setItem("bman_balance", balance);

    if (balance >= 1000) buyAccessBtn.style.display = "inline-block";
    else buyAccessBtn.style.display = "none";

    if (balance <= 0) {
      spinBtn.disabled = true;
      msgBox.textContent = "Баланс на нуле. Пополните счет.";
    } else {
      spinBtn.disabled = false;
    }
  }

  function buildBetBoard() {
    const numbers = [...Array(37).keys()];
    numbers.forEach((n) => {
      const cell = document.createElement("div");
      cell.className = "bet-cell";
      cell.dataset.choice = n.toString();
      cell.textContent = n;
      betBoard.appendChild(cell);
    });

    ["1st12", "2nd12", "3rd12"].forEach((label) => {
      const cell = document.createElement("div");
      cell.className = "bet-cell";
      cell.dataset.choice = label;
      cell.textContent = label.toUpperCase();
      cell.style.gridColumn = "span 3";
      betBoard.appendChild(cell);
    });

    const bottom = [
      { choice: "1to18", label: "1 to 18" },
      { choice: "even", label: "EVEN" },
      { choice: "redbottom", label: "RED" },
      { choice: "blackbottom", label: "BLACK" },
      { choice: "odd", label: "ODD" },
      { choice: "19to36", label: "19 to 36" },
    ];
    bottom.forEach((item) => {
      const cell = document.createElement("div");
      cell.className = "bet-cell";
      cell.dataset.choice = item.choice;
      cell.textContent = item.label.toUpperCase();
      betBoard.appendChild(cell);
    });

    betBoard.addEventListener("click", (e) => {
      const cell = e.target.closest(".bet-cell");
      if (!cell) return;
      placeBet(cell);
    });
  }

  function initChips() {
    document.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        btn.classList.add("active");
        selectedChip = parseInt(btn.dataset.value, 10);
      });
    });
    document.querySelector('.chip[data-value="1"]').classList.add("active");
  }

  function placeBet(cell) {
    if (isSpinning) return;
    const choice = cell.dataset.choice;
    if (balance < selectedChip) {
      msgBox.textContent = "Недостаточно BMAN";
      return;
    }
    resetBoard();
    cell.classList.add("chosen");
    placedBet = { choice, amount: selectedChip };
    cell.innerHTML = `<strong>${cell.textContent}</strong><span class="mini-chip">${selectedChip}</span>`;
    msgBox.textContent = `Ставка: ${selectedChip} BMAN на ${cell.textContent}`;
  }

  function resetBoard() {
    document.querySelectorAll(".bet-cell").forEach((c) => {
      c.classList.remove("chosen");
      c.innerHTML = c.dataset.choice.toString().toUpperCase();
    });
    placedBet = null;
  }

  function spin() {
    if (isSpinning) return;
    if (!placedBet) {
      msgBox.textContent = "Выберите ставку!";
      return;
    }
    const { choice, amount } = placedBet;
    if (amount > balance) {
      msgBox.textContent = "Недостаточно BMAN";
      return;
    }
    balance -= amount;
    updateBalance();
    isSpinning = true;
    spinCount++;
    resultBox.textContent = "";
    msgBox.textContent = "Крутится...";

    const resultNum = sectors[Math.floor(Math.random() * sectors.length)];
    animateWheel(resultNum);

    setTimeout(() => {
      const color =
        resultNum === 0
          ? "green"
          : [32, 19, 21, 25, 34, 27, 36, 30, 23, 5, 16, 1, 14, 9, 18, 7, 12, 3].includes(resultNum)
          ? "red"
          : "black";
      resultBox.textContent = `Выпало: ${resultNum} (${color.toUpperCase()})`;
      const win = evaluateBet(choice, amount, resultNum, color);
      if (win > 0) {
        balance += win;
        msgBox.textContent = `Поздравляем! Вы выиграли ${win} BMAN!`;
      } else {
        msgBox.textContent = "Увы, вы проиграли.";
      }
      logHistory(resultNum, color, win, amount);
      updateBalance();
      resetBoard();
      isSpinning = false;
    }, 6200);
  }

  function evaluateBet(choice, bet, num, color) {
    let payout = 0;
    if (choice === "redbottom" && color === "red") payout = bet * 2;
    else if (choice === "blackbottom" && color === "black") payout = bet * 2;
    else if (choice === "even" && num !== 0 && num % 2 === 0) payout = bet * 2;
    else if (choice === "odd" && num % 2 === 1) payout = bet * 2;
    else if (choice === "1st12" && num >= 1 && num <= 12) payout = bet * 3;
    else if (choice === "2nd12" && num >= 13 && num <= 24) payout = bet * 3;
    else if (choice === "3rd12" && num >= 25 && num <= 36) payout = bet * 3;
    else if (choice === "1to18" && num >= 1 && num <= 18) payout = bet * 2;
    else if (choice === "19to36" && num >= 19 && num <= 36) payout = bet * 2;
    else if (parseInt(choice, 10) === num) payout = bet * 36;
    return payout;
  }

  function logHistory(num, color, win, bet) {
    const sign = win > 0 ? `+${win}` : `-${bet}`;
    const entry = `#${spinCount}: ${num} (${color.toUpperCase()}) — ${sign} BMAN`;
    history.unshift(entry);
    if (history.length > 5) history.pop();
    historyLog.innerHTML = history.map((h) => `<div>${h}</div>`).join("");
  }

  function animateWheel(resultNum) {
    const sectorCount = sectors.length;
    const sectorAngle = 360 / sectorCount;
    const index = sectors.indexOf(resultNum);
    const extraSpins = 8 * 360;
    // Угол для выбранного сектора: сверху 0 => pointer показывает на сектор под углом 0, поэтому вычисляем смещение
    const stopAngle = (360 - index * sectorAngle - sectorAngle / 2 + 360) % 360;
    currentRotation = (currentRotation + extraSpins + stopAngle) % 360;

    wheelImage.style.transition = "transform 6s cubic-bezier(0.33,1,0.68,1)";
    wheelImage.style.transform = `rotate(${currentRotation}deg)`;

    pointer.classList.add("spinning");
    setTimeout(() => pointer.classList.remove("spinning"), 6200);
  }
})();
