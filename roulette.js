(function () {
  /* ========== STATE ========== */
  let balance = parseInt(localStorage.getItem("bman_balance")) || 100; // стартовый баланс
  let isSpinning = false;
  let currentRotation = 0;
  let spinCount = 0;
  const history = [];
  let selectedChip = 1; // текущий номинал фишки
  let placedBet = null; // { choice: string, amount: number }

  /* ========== HTML ELEMENT REFERENCES ========== */
  const balanceSpan = document.getElementById("balance");
  const wheel = document.getElementById("wheel");
  const ball = document.getElementById("ball");
  const pointer = document.getElementById("pointer");
  const msgBox = document.getElementById("message");
  const resultBox = document.getElementById("result-display");
  const historyLog = document.getElementById("history-log");
  const betBoard = document.getElementById("bet-board");
  const spinBtn = document.getElementById("spin-btn");
  const buyAccessBtn = document.getElementById("buy-access");

  /* ========== INITIALIZATION ========== */
  updateBalance();
  buildWheelNumbers();
  buildBetBoard();
  initChips();
  spinBtn.addEventListener("click", spin);

  /* ========== FUNCTIONS ========== */

  // Обновляем баланс в DOM и localStorage
  function updateBalance() {
    balanceSpan.textContent = balance;
    localStorage.setItem("bman_balance", balance);
    if (balance >= 1000) {
      buyAccessBtn.style.display = "inline-block";
    } else {
      buyAccessBtn.style.display = "none";
    }
  }

  // Строим разметку колеса: 37 секторов (0…36)
  function buildWheelNumbers() {
    const sectorCount = 37;
    const sectorAngle = 360 / sectorCount;
    const numbers = Array.from({ length: sectorCount }, (_, i) => i);
    const colors = [
      "green",
      ...numbers.slice(1).map((n) => (n % 2 === 0 ? "black" : "red")),
    ];

    numbers.forEach((num, i) => {
      const slice = document.createElement("div");
      slice.className = "wheel-number";
      slice.textContent = num;
      slice.style.transform = `rotate(${i * sectorAngle}deg) translateY(-130px)`;
      slice.style.color = colors[i] === "green" ? "var(--clr-green)" : colors[i];
      wheel.appendChild(slice);
    });
  }

  // Строим поле ставок: числа 0…36 + RED, BLACK, EVEN, ODD
  function buildBetBoard() {
    const numbers = [...Array(37).keys()]; // 0..36
    numbers.forEach((n) => {
      const cell = document.createElement("div");
      cell.className = "bet-cell";
      cell.dataset.choice = n.toString();
      cell.textContent = n;
      betBoard.appendChild(cell);
    });

    // Специальные ячейки
    const specials = ["RED", "BLACK", "EVEN", "ODD"];
    specials.forEach((type) => {
      const cell = document.createElement("div");
      cell.className = "bet-cell special";
      cell.dataset.choice = type.toLowerCase(); // "red", "black", "even", "odd"
      cell.textContent = type;
      betBoard.appendChild(cell);
    });

    betBoard.addEventListener("click", (e) => {
      const cell = e.target.closest(".bet-cell");
      if (!cell) return;
      placeBet(cell);
    });
  }

  // Инициализация фишек (nominals) и обработка кликов
  function initChips() {
    document.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".chip").forEach((c) => c.classList.remove("active"));
        btn.classList.add("active");
        selectedChip = parseInt(btn.dataset.value);
      });
    });
    // Делаем активной первую фишку (value=1)
    document.querySelector('.chip[data-value="1"]').classList.add("active");
  }

  // Обработка выбора ячейки ставки
  function placeBet(cell) {
    if (isSpinning) return;

    const choice = cell.dataset.choice; // число или "red"/"black"/"even"/"odd"
    if (balance < selectedChip) {
      msgBox.textContent = "Недостаточно BMAN";
      return;
    }

    // Сброс предыдущей ставки
    resetBoard();

    // Помечаем выбранную ячейку
    cell.classList.add("chosen");
    placedBet = { choice, amount: selectedChip };

    // Вставляем мини-фишку
    cell.innerHTML = `<strong>${choice.toUpperCase()}</strong><span class="mini-chip">${selectedChip}</span>`;
    msgBox.textContent = `Ставка: ${selectedChip} BMAN на ${choice.toUpperCase()}`;
  }

  // Сбрасываем все ячейки ставок
  function resetBoard() {
    document.querySelectorAll(".bet-cell").forEach((c) => {
      c.classList.remove("chosen");
      c.innerHTML = c.dataset.choice.toUpperCase();
    });
    placedBet = null;
  }

  // Запустить вращение
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

    // Генерируем случайный результат 0..36
    const resultNum = Math.floor(Math.random() * 37);

    // Запускаем анимацию
    animateWheel(resultNum);

    // Через 6.2 секунды (около окончания анимации) вычисляем результат
    setTimeout(() => {
      const color = resultNum === 0
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
    }, 6200);
  }

  // Расчет выигрыша
  function evaluateBet(choice, bet, num, color) {
    let payout = 0;
    if (choice === "red" && color === "red") payout = bet * 2;
    else if (choice === "black" && color === "black") payout = bet * 2;
    else if (choice === "even" && num !== 0 && num % 2 === 0) payout = bet * 2;
    else if (choice === "odd" && num % 2 === 1) payout = bet * 2;
    else if (parseInt(choice, 10) === num) payout = bet * 36;
    return payout;
  }

  // Запись истории 5 последних результатов
  function logHistory(num, color, win, bet) {
    const sign = win > 0 ? "+" + win : "-" + bet;
    const entry = `#${spinCount}: ${num} (${color.toUpperCase()}) — ${sign} BMAN`;
    history.unshift(entry);
    if (history.length > 5) history.pop();
    historyLog.innerHTML = history.map((h) => `<div>${h}</div>`).join("");
  }

  // Анимация колеса и шарика
  function animateWheel(resultNum) {
    const sectorCount = 37;
    const sectorAngle = 360 / sectorCount;
    const extraSpins = 8 * 360; // 8 полных оборотов

    // Рассчитываем итоговый угол, чтобы сектор оказался под указателем
    const stopAngle = (360 - resultNum * sectorAngle + sectorAngle / 2) % 360;
    currentRotation = (currentRotation + extraSpins + stopAngle) % 360;

    // Применяем анимацию к колесу
    wheel.style.transition = "transform 6s cubic-bezier(0.33, 1, 0.68, 1)";
    wheel.style.transform = `rotate(${currentRotation}deg)`;

    // Шарик крутится в противоположную сторону по окружности
    ball.style.transition = "transform 6s linear";
    ball.style.transform = `rotate(${-currentRotation}deg) translateY(-120px)`;

    // Указатель начинает мигать
    pointer.classList.add("spinning");
    setTimeout(() => pointer.classList.remove("spinning"), 6200);
  }
})();
