export const BLACK = 1;
export const WHITE = -1;
export const EMPTY = 0;
export const BOARD_SIZE = 8;
export const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

const moveCache = new Map();
const MAX_CACHE_SIZE = 4096;

function keyOf(board, player) {
  return `${player}|${Array.from(board).join(",")}`;
}

function trimCache() {
  if (moveCache.size <= MAX_CACHE_SIZE) {
    return;
  }
  const keys = moveCache.keys();
  for (let i = 0; i < 512; i += 1) {
    const next = keys.next();
    if (next.done) {
      break;
    }
    moveCache.delete(next.value);
  }
}

export function resetMoveCache() {
  moveCache.clear();
}

export function toIndex(row, col) {
  return row * BOARD_SIZE + col;
}

export function toRowCol(index) {
  return [Math.floor(index / BOARD_SIZE), index % BOARD_SIZE];
}

export class GameState {
  constructor(board) {
    if (board instanceof Int8Array) {
      this.board = board;
    } else if (Array.isArray(board)) {
      this.board = Int8Array.from(board);
    } else {
      this.board = new Int8Array(BOARD_CELLS);
      this.setInitial();
    }
  }

  clone() {
    return new GameState(this.board.slice());
  }

  setInitial() {
    this.board.fill(EMPTY);
    this.board[toIndex(3, 3)] = WHITE;
    this.board[toIndex(4, 4)] = WHITE;
    this.board[toIndex(3, 4)] = BLACK;
    this.board[toIndex(4, 3)] = BLACK;
  }

  getCell(row, col) {
    return this.board[toIndex(row, col)];
  }

  setCell(row, col, value) {
    this.board[toIndex(row, col)] = value;
  }

  getCounts() {
    let black = 0;
    let white = 0;
    let empty = 0;
    for (let i = 0; i < BOARD_CELLS; i += 1) {
      const value = this.board[i];
      if (value === BLACK) {
        black += 1;
      } else if (value === WHITE) {
        white += 1;
      } else {
        empty += 1;
      }
    }
    return { black, white, empty };
  }

  isValidMove(index, player) {
    if (this.board[index] !== EMPTY) {
      return false;
    }
    const [row, col] = toRowCol(index);
    for (const [dr, dc] of DIRECTIONS) {
      let r = row + dr;
      let c = col + dc;
      let seenOpponent = false;
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const value = this.board[toIndex(r, c)];
        if (value === EMPTY) {
          break;
        }
        if (value === -player) {
          seenOpponent = true;
          r += dr;
          c += dc;
          continue;
        }
        if (value === player) {
          if (seenOpponent) {
            return true;
          }
          break;
        }
      }
    }
    return false;
  }

  getValidMoves(player, withCache = true) {
    const cacheKey = keyOf(this.board, player);
    if (withCache && moveCache.has(cacheKey)) {
      return moveCache.get(cacheKey).slice();
    }

    const moves = [];
    for (let i = 0; i < BOARD_CELLS; i += 1) {
      if (this.isValidMove(i, player)) {
        moves.push(i);
      }
    }

    if (withCache) {
      moveCache.set(cacheKey, moves.slice());
      trimCache();
    }
    return moves;
  }

  applyMove(index, player) {
    this.board[index] = player;
    const [row, col] = toRowCol(index);
    const flipped = [];

    for (const [dr, dc] of DIRECTIONS) {
      let r = row + dr;
      let c = col + dc;
      const trail = [];
      while (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const idx = toIndex(r, c);
        const value = this.board[idx];
        if (value === EMPTY) {
          trail.length = 0;
          break;
        }
        if (value === -player) {
          trail.push(idx);
          r += dr;
          c += dc;
          continue;
        }
        if (value === player) {
          break;
        }
      }

      if (trail.length > 0 && r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        const endValue = this.board[toIndex(r, c)];
        if (endValue === player) {
          for (const idx of trail) {
            this.board[idx] = player;
            flipped.push(idx);
          }
        }
      }
    }

    return flipped;
  }
}

export function indexSet(moves) {
  return new Set(moves);
}
