(function () {
  /* ================= STATE ================= */
  let balance = parseInt(localStorage.getItem("bman_balance")) || 100;
  let isSpinning = false;
  let currentRotation = 0;
  let spinCount = 0;
  const history = [];
  let selectedChip = 1;
  let placedBet = null; // { choice, amount }

  /* ========= HTML REFERENCES ========= */
  const balanceSpan = document.getElementById("balance");
  const wheelImage = document.getElementById("wheel"); // <img src="wheel.png">
  const ball = document.getElementById("ball");
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

  // Обновление баланса в DOM и localStorage
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

  // Построение таблицы ставок
  function buildBetBoard() {
    // 1) Числа 0…36
    const numbers = [...Array(37).keys()];
    numbers.forEach((n) => {
      const cell = document.createElement("div");
      cell.className = "bet-cell";
      cell.dataset.choice = n.toString();
      cell.textContent = n;
      betBoard.appendChild(cell);
    });

    // 2) Дюжины (span=3)
    ["1st12", "2nd12", "3rd12"].forEach((label) => {
      const cell = document.createElement("div");
      cell.className = "bet-cell";
      cell.dataset.choice = label;
      cell.textContent = label.toUpperCase();
      cell.style.gridColumn = "span 3";
      betBoard.appendChild(cell);
    });

    // 3) Нижний ряд «1to18», «even», «redbottom», «blackbottom», «odd», «19to36»
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

  // Инициализация фишек (номиналов)
  function initChips() {
    document.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".chip")
          .forEach((c) => c.classList.remove("active"));
        btn.classList.add("active");
        selectedChip = parseInt(btn.dataset.value, 10);
      });
    });
    // По умолчанию активируем фишку «1»
    document.querySelector('.chip[data-value="1"]').classList.add("active");
  }

  // Установка ставки
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

  // Сброс всех ячеек ставок
  function resetBoard() {
    document.querySelectorAll(".bet-cell").forEach((c) => {
      c.classList.remove("chosen");
      c.innerHTML = c.dataset.choice.toUpperCase();
    });
    placedBet = null;
  }

  // Запуск спина
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

    // Снимаем ставку с баланса
    balance -= amount;
    updateBalance();
    isSpinning = true;
    spinCount++;
    resultBox.textContent = "";
    msgBox.textContent = "Крутится...";

    // Случайное число 0..36
    const resultNum = Math.floor(Math.random() * 37);
    animateWheel(resultNum);

    // Через 5.2 секунды (≈ окончание 5-секундной анимации) вычисляем результат
    setTimeout(() => {
      const color =
        resultNum === 0
          ? "green"
          : resultNum % 2 === 0
          ? "black"
          : "red";

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
    }, 5200);
  }

  // Расчёт выплаты
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

  // Логирование истории (последние 5 записей)
  function logHistory(num, color, win, bet) {
    const sign = win > 0 ? `+${win}` : `-${bet}`;
    const entry = `#${spinCount}: ${num} (${color.toUpperCase()}) — ${sign} BMAN`;
    history.unshift(entry);
    if (history.length > 5) history.pop();
    historyLog.innerHTML = history.map((h) => `<div>${h}</div>`).join("");
  }

  // Анимация вращения колеса и шарика
  function animateWheel(resultNum) {
    const sectorCount = 37;
    const sectorAngle = 360 / sectorCount;
    const extraSpins = 8 * 360; // 8 полных оборотов

    // Итоговый угол, чтобы нужный сектор оказался под указателем
    const stopAngle = (360 - resultNum * sectorAngle + sectorAngle / 2) % 360;
    currentRotation = (currentRotation + extraSpins + stopAngle) % 360;

    // Вращаем <img> колеса за 5 секунд
    wheelImage.style.transition = "transform 5s cubic-bezier(0.33,1,0.68,1)";
    wheelImage.style.transform = `rotate(${currentRotation}deg)`;

    // Шарик крутится в противоположную сторону
    ball.style.transition = "transform 5s linear";
    ball.style.transform = `rotate(${-currentRotation}deg) translateY(-120px)`;

    // Указатель мигает
    pointer.classList.add("spinning");
    setTimeout(() => pointer.classList.remove("spinning"), 5000);
  }
})();
