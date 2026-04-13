import { BOARD_SIZE, EMPTY, toIndex } from "../core/engine.js";

export class BoardView {
  constructor(element, onMove) {
    this.element = element;
    this.onMove = onMove;
    this.cells = [];
    this.enabledMoves = new Set();
    this.buildGrid();
  }

  buildGrid() {
    this.element.innerHTML = "";
    this.cells = [];
    for (let row = 0; row < BOARD_SIZE; row += 1) {
      for (let col = 0; col < BOARD_SIZE; col += 1) {
        const index = toIndex(row, col);
        const cell = document.createElement("button");
        cell.type = "button";
        cell.className = "cell";
        cell.dataset.index = String(index);
        cell.addEventListener("click", () => {
          if (!this.enabledMoves.has(index)) {
            return;
          }
          this.onMove(index);
        });
        this.element.appendChild(cell);
        this.cells.push(cell);
      }
    }
  }

  render(state, moves = []) {
    this.enabledMoves = new Set(moves);
    for (let i = 0; i < this.cells.length; i += 1) {
      const cell = this.cells[i];
      const value = state.board[i];
      cell.classList.toggle("playable", this.enabledMoves.has(i));
      cell.innerHTML = "";
      if (value !== EMPTY) {
        const piece = document.createElement("div");
        piece.className = `piece ${value === 1 ? "black" : "white"}`;
        cell.appendChild(piece);
      }
    }
  }
}
