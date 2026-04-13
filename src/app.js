import { BLACK, WHITE, GameState, resetMoveCache } from "./core/engine.js";
import { createAIPlayers } from "./core/ai.js";
import { BoardView } from "./ui/board.js";

const modeSelect = document.getElementById("mode-select");
const difficultySelect = document.getElementById("difficulty-select");
const restartButton = document.getElementById("restart-btn");
const statusText = document.getElementById("status-text");
const turnText = document.getElementById("turn-text");
const thinkingText = document.getElementById("thinking-text");
const blackCount = document.getElementById("black-count");
const whiteCount = document.getElementById("white-count");

const boardElement = document.getElementById("board");

let state = new GameState();
let currentPlayer = BLACK;
let stopped = false;
let aiPlayers = { [BLACK]: null, [WHITE]: null };
let currentMoves = [];
let currentMoveSet = new Set();

const board = new BoardView(boardElement, (index) => {
  if (stopped) {
    return;
  }
  handleMove(index);
});

function colorName(player) {
  return player === BLACK ? "Black" : "White";
}

function setThinking(active, player = currentPlayer) {
  if (!active) {
    thinkingText.textContent = "";
    return;
  }
  thinkingText.textContent = `${colorName(player)} AI thinking...`;
}

function updateCounts() {
  const counts = state.getCounts();
  blackCount.textContent = String(counts.black);
  whiteCount.textContent = String(counts.white);
  return counts;
}

function updateBoard() {
  currentMoves = state.getValidMoves(currentPlayer);
  currentMoveSet = new Set(currentMoves);
  const moves = currentMoves;
  board.render(state, isHumanPlayer(currentPlayer) ? moves : []);
  turnText.textContent = `Turn: ${colorName(currentPlayer)}`;
  return moves;
}

function isHumanPlayer(player) {
  return !aiPlayers[player];
}

function setupMode() {
  const depth = Number(difficultySelect.value);
  const mode = modeSelect.value;
  const nextAI = createAIPlayers(depth);
  aiPlayers = { [BLACK]: null, [WHITE]: null };
  if (mode === "pve-black") {
    aiPlayers[WHITE] = nextAI[WHITE];
  } else if (mode === "pve-white") {
    aiPlayers[BLACK] = nextAI[BLACK];
  } else if (mode === "cvc") {
    aiPlayers[BLACK] = nextAI[BLACK];
    aiPlayers[WHITE] = nextAI[WHITE];
  }
}

function gameOver() {
  const counts = updateCounts();
  if (counts.black === counts.white) {
    statusText.textContent = "Draw";
  } else if (counts.black > counts.white) {
    statusText.textContent = "Black wins";
  } else {
    statusText.textContent = "White wins";
  }
  stopped = true;
  setThinking(false);
  board.render(state, []);
}

function stepTurn() {
  if (stopped) {
    return;
  }
  const moves = updateBoard();
  updateCounts();

  if (moves.length === 0) {
    const passingPlayer = currentPlayer;
    currentPlayer *= -1;
    const nextMoves = state.getValidMoves(currentPlayer);
    if (nextMoves.length === 0) {
      gameOver();
      return;
    }
    statusText.textContent = `${colorName(passingPlayer)} passes`;
    updateBoard();
  } else {
    statusText.textContent = `${colorName(currentPlayer)} to move`;
  }

  maybeAIMove();
}

function maybeAIMove() {
  const ai = aiPlayers[currentPlayer];
  if (!ai || stopped) {
    setThinking(false);
    return;
  }
  setThinking(true, currentPlayer);
  window.setTimeout(() => {
    if (stopped) {
      return;
    }
    const move = ai.getBestMove(state);
    setThinking(false);
    if (move === null || move === undefined) {
      currentPlayer *= -1;
      stepTurn();
      return;
    }
    handleMove(move);
  }, 10);
}

function handleMove(index) {
  if (!currentMoveSet.has(index)) {
    return;
  }
  state.applyMove(index, currentPlayer);
  currentPlayer *= -1;
  stepTurn();
}

function restartGame() {
  resetMoveCache();
  state = new GameState();
  currentPlayer = BLACK;
  stopped = false;
  setupMode();
  statusText.textContent = "Game started";
  stepTurn();
}

restartButton.addEventListener("click", restartGame);
modeSelect.addEventListener("change", restartGame);
difficultySelect.addEventListener("change", restartGame);

restartGame();
