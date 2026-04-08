const views = {
  menu: document.querySelector("#menu"),
  guess: document.querySelector("#guess-view"),
  rps: document.querySelector("#rps-view"),
  memory: document.querySelector("#memory-view"),
  snake: document.querySelector("#snake-view"),
};

const menuButtons = document.querySelectorAll("[data-open]");
const backButtons = document.querySelectorAll("[data-back]");
let activeView = "menu";

const guessInput = document.querySelector("#guess-input");
const guessTimes = document.querySelector("#guess-times");
const guessMessage = document.querySelector("#guess-message");
let guessAnswer = randomInt(1, 100);
let guessCount = 0;

const rpsScore = { win: 0, lose: 0, draw: 0 };
const rpsWin = document.querySelector("#rps-win");
const rpsLose = document.querySelector("#rps-lose");
const rpsDraw = document.querySelector("#rps-draw");
const rpsMessage = document.querySelector("#rps-message");

const memoryBoard = document.querySelector("#memory-board");
const memoryFlips = document.querySelector("#memory-flips");
const memoryMatched = document.querySelector("#memory-matched");
const memoryMessage = document.querySelector("#memory-message");
let memoryCards = [];
let memoryFirst = null;
let memorySecond = null;
let memoryLock = false;
let memoryFlipCount = 0;
let memoryMatchedCount = 0;

const GRID_SIZE = 16;
const SNAKE_TICK_MS = 120;
const INITIAL_DIRECTION = "right";
const DIRECTIONS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
const OPPOSITES = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
const KEY_TO_DIRECTION = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  W: "up",
  a: "left",
  A: "left",
  s: "down",
  S: "down",
  d: "right",
  D: "right",
};

const snakeBoard = document.querySelector("#snake-board");
const snakeScore = document.querySelector("#snake-score");
const snakeStatus = document.querySelector("#snake-status");
const snakeToggle = document.querySelector("#snake-toggle");
let snakeState = createSnakeInitialState();
let snakeRunning = false;

buildSnakeBoard();
renderSnake();
startMemoryGame();
renderRps();

const snakeTimer = window.setInterval(() => {
  if (!snakeRunning || activeView !== "snake") {
    return;
  }

  snakeState = stepSnake(snakeState);
  renderSnake();

  if (snakeState.isGameOver) {
    snakeRunning = false;
    renderSnake();
  }
}, SNAKE_TICK_MS);

menuButtons.forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.open));
});

backButtons.forEach((button) => {
  button.addEventListener("click", () => showView("menu"));
});

document.querySelector("#guess-submit").addEventListener("click", checkGuess);
document.querySelector("#guess-restart").addEventListener("click", restartGuess);
guessInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    checkGuess();
  }
});

document.querySelectorAll("[data-rps]").forEach((button) => {
  button.addEventListener("click", () => playRps(button.dataset.rps));
});
document.querySelector("#rps-reset").addEventListener("click", resetRps);

document.querySelector("#memory-restart").addEventListener("click", startMemoryGame);

snakeToggle.addEventListener("click", toggleSnakeRunning);
document.querySelector("#snake-restart").addEventListener("click", restartSnake);
snakeBoard.addEventListener("click", () => snakeBoard.focus());

document.querySelectorAll("[data-direction]").forEach((button) => {
  const move = () => {
    if (activeView !== "snake") {
      return;
    }

    snakeState = queueSnakeDirection(snakeState, button.dataset.direction);
    snakeRunning = true;
    renderSnake();
    snakeBoard.focus();
  };

  button.addEventListener("click", move);
  button.addEventListener("touchstart", move, { passive: true });
});

document.addEventListener("keydown", (event) => {
  if (activeView !== "snake") {
    return;
  }

  const direction = KEY_TO_DIRECTION[event.key];
  if (!direction) {
    if (event.code === "Space") {
      event.preventDefault();
      toggleSnakeRunning();
    }
    return;
  }

  event.preventDefault();
  snakeState = queueSnakeDirection(snakeState, direction);
  snakeRunning = true;
  renderSnake();
});

window.addEventListener("beforeunload", () => {
  window.clearInterval(snakeTimer);
});

function showView(name) {
  Object.entries(views).forEach(([key, element]) => {
    element.classList.toggle("view--active", key === name);
  });

  activeView = name;

  if (name === "guess") {
    guessInput.focus();
  }

  if (name === "memory") {
    startMemoryGame();
  }

  if (name === "snake") {
    snakeBoard.focus();
  } else {
    snakeRunning = false;
  }

  renderSnake();
}

function checkGuess() {
  const value = Number.parseInt(guessInput.value, 10);
  if (Number.isNaN(value)) {
    guessMessage.textContent = "請先輸入 1 到 100 的數字。";
    return;
  }

  guessCount += 1;
  guessTimes.textContent = String(guessCount);

  if (value > guessAnswer) {
    guessMessage.textContent = "太大了，再小一點。";
    return;
  }

  if (value < guessAnswer) {
    guessMessage.textContent = "太小了，再大一點。";
    return;
  }

  guessMessage.textContent = `答對了，你用了 ${guessCount} 次。`;
}

function restartGuess() {
  guessAnswer = randomInt(1, 100);
  guessCount = 0;
  guessTimes.textContent = "0";
  guessMessage.textContent = "";
  guessInput.value = "";
  guessInput.focus();
}

function playRps(playerChoice) {
  const options = ["剪刀", "石頭", "布"];
  const cpuChoice = options[randomInt(0, options.length - 1)];

  if (playerChoice === cpuChoice) {
    rpsScore.draw += 1;
    rpsMessage.textContent = `平手，${playerChoice} 對上 ${cpuChoice}。`;
  } else if (
    (playerChoice === "剪刀" && cpuChoice === "布") ||
    (playerChoice === "石頭" && cpuChoice === "剪刀") ||
    (playerChoice === "布" && cpuChoice === "石頭")
  ) {
    rpsScore.win += 1;
    rpsMessage.textContent = `你贏了，${playerChoice} 打敗 ${cpuChoice}。`;
  } else {
    rpsScore.lose += 1;
    rpsMessage.textContent = `你輸了，${cpuChoice} 克制 ${playerChoice}。`;
  }

  renderRps();
}

function resetRps() {
  rpsScore.win = 0;
  rpsScore.lose = 0;
  rpsScore.draw = 0;
  rpsMessage.textContent = "";
  renderRps();
}

function renderRps() {
  rpsWin.textContent = String(rpsScore.win);
  rpsLose.textContent = String(rpsScore.lose);
  rpsDraw.textContent = String(rpsScore.draw);
}

function startMemoryGame() {
  const values = ["🍎", "🍎", "🐶", "🐶", "🚗", "🚗", "🎈", "🎈"];
  memoryCards = shuffle(values).map((value, index) => ({
    id: index,
    value,
    isOpen: false,
    isMatched: false,
  }));
  memoryFirst = null;
  memorySecond = null;
  memoryLock = false;
  memoryFlipCount = 0;
  memoryMatchedCount = 0;
  memoryMessage.textContent = "";
  renderMemory();
}

function renderMemory() {
  memoryBoard.innerHTML = "";

  memoryCards.forEach((card) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "memory-card";
    if (card.isOpen) {
      button.classList.add("is-open");
    }
    if (card.isMatched) {
      button.classList.add("is-matched");
    }
    button.textContent = card.isOpen || card.isMatched ? card.value : "?";
    button.addEventListener("click", () => flipMemoryCard(card.id));
    memoryBoard.appendChild(button);
  });

  memoryFlips.textContent = String(memoryFlipCount);
  memoryMatched.textContent = `${memoryMatchedCount} / ${memoryCards.length}`;
}

function flipMemoryCard(cardId) {
  if (memoryLock) {
    return;
  }

  const card = memoryCards.find((item) => item.id === cardId);
  if (!card || card.isOpen || card.isMatched) {
    return;
  }

  card.isOpen = true;

  if (!memoryFirst) {
    memoryFirst = card;
    renderMemory();
    return;
  }

  memorySecond = card;
  memoryFlipCount += 1;

  if (memoryFirst.value === memorySecond.value) {
    memoryFirst.isMatched = true;
    memorySecond.isMatched = true;
    memoryMatchedCount += 2;
    memoryFirst = null;
    memorySecond = null;

    if (memoryMatchedCount === memoryCards.length) {
      memoryMessage.textContent = "全部配對完成，恭喜過關。";
    }

    renderMemory();
    return;
  }

  memoryLock = true;
  renderMemory();

  window.setTimeout(() => {
    memoryFirst.isOpen = false;
    memorySecond.isOpen = false;
    memoryFirst = null;
    memorySecond = null;
    memoryLock = false;
    renderMemory();
  }, 900);
}

function buildSnakeBoard() {
  const fragment = document.createDocumentFragment();
  for (let index = 0; index < GRID_SIZE * GRID_SIZE; index += 1) {
    const cell = document.createElement("div");
    cell.className = "snake-cell";
    fragment.appendChild(cell);
  }
  snakeBoard.appendChild(fragment);
}

function createSnakeInitialState(random = Math.random) {
  const snake = [{ x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }];
  return {
    gridSize: GRID_SIZE,
    snake,
    direction: INITIAL_DIRECTION,
    queuedDirection: INITIAL_DIRECTION,
    food: placeSnakeFood(snake, GRID_SIZE, random),
    score: 0,
    isGameOver: false,
    hasStarted: false,
  };
}

function queueSnakeDirection(state, nextDirection) {
  if (state.isGameOver || !DIRECTIONS[nextDirection]) {
    return state;
  }

  const activeDirection = state.hasStarted ? state.queuedDirection : state.direction;
  if (activeDirection === nextDirection || OPPOSITES[activeDirection] === nextDirection) {
    return state;
  }

  return { ...state, hasStarted: true, queuedDirection: nextDirection };
}

function stepSnake(state, random = Math.random) {
  if (state.isGameOver || !state.hasStarted) {
    return state;
  }

  const move = DIRECTIONS[state.queuedDirection];
  const nextHead = { x: state.snake[0].x + move.x, y: state.snake[0].y + move.y };

  if (nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= state.gridSize || nextHead.y >= state.gridSize) {
    return { ...state, direction: state.queuedDirection, isGameOver: true };
  }

  const grows = isSameCell(nextHead, state.food);
  const nextSnake = [nextHead, ...state.snake];
  if (!grows) {
    nextSnake.pop();
  }

  if (nextSnake.slice(1).some((segment) => isSameCell(segment, nextHead))) {
    return { ...state, direction: state.queuedDirection, queuedDirection: state.queuedDirection, isGameOver: true };
  }

  return {
    ...state,
    snake: nextSnake,
    direction: state.queuedDirection,
    queuedDirection: state.queuedDirection,
    food: grows ? placeSnakeFood(nextSnake, state.gridSize, random) : state.food,
    score: grows ? state.score + 1 : state.score,
    hasStarted: true,
  };
}

function placeSnakeFood(snake, gridSize, random = Math.random) {
  const openCells = [];
  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      if (!snake.some((segment) => segment.x === x && segment.y === y)) {
        openCells.push({ x, y });
      }
    }
  }
  return openCells.length ? openCells[Math.floor(random() * openCells.length)] : null;
}

function toggleSnakeRunning() {
  if (snakeState.isGameOver) {
    restartSnake();
  }
  if (!snakeState.hasStarted) {
    snakeState = queueSnakeDirection(snakeState, snakeState.direction);
  }
  snakeRunning = !snakeRunning;
  snakeBoard.focus();
  renderSnake();
}

function restartSnake() {
  snakeState = createSnakeInitialState();
  snakeRunning = false;
  snakeBoard.focus();
  renderSnake();
}

function renderSnake() {
  const cells = snakeBoard.children;
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const index = y * GRID_SIZE + x;
      const cell = cells[index];
      const position = { x, y };
      const isHead = isSameCell(position, snakeState.snake[0]);
      const isBody = snakeState.snake.some((segment) => isSameCell(segment, position));
      const isFood = isSameCell(position, snakeState.food);
      cell.className = "snake-cell";
      if (isBody) cell.classList.add("snake-cell--body");
      if (isHead) cell.classList.add("snake-cell--head");
      if (isFood) cell.classList.add("snake-cell--food");
    }
  }

  snakeScore.textContent = String(snakeState.score);
  if (activeView !== "snake") {
    snakeStatus.textContent = "待命中";
  } else if (snakeState.isGameOver) {
    snakeStatus.textContent = "遊戲結束";
  } else if (!snakeState.hasStarted) {
    snakeStatus.textContent = "準備中";
  } else {
    snakeStatus.textContent = snakeRunning ? "進行中" : "已暫停";
  }
  snakeToggle.textContent = snakeState.isGameOver ? "再玩一次" : snakeRunning ? "暫停" : "開始";
}

function isSameCell(a, b) {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

function shuffle(values) {
  const list = [...values];
  for (let index = list.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }
  return list;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
