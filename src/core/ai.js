import { BLACK, WHITE, BOARD_SIZE, GameState, toIndex } from "./engine.js";

const CORNER_WEIGHT = 10;
const NO_PIECE_PENALTY = 64;

function scoreStability(state) {
  let stability = 0;
  const edgeCoords = [0, BOARD_SIZE - 1];
  for (const row of edgeCoords) {
    for (const col of edgeCoords) {
      const cornerValue = state.getCell(row, col);
      stability += cornerValue;
      const idx = toIndex(row, col);
      if (state.isValidMove(idx, BLACK)) {
        stability += 1;
      } else if (state.isValidMove(idx, WHITE)) {
        stability -= 1;
      }
    }
  }
  return stability;
}

function moveOrderScore(index) {
  if (index === 0 || index === 7 || index === 56 || index === 63) {
    return 30;
  }
  return 0;
}

export class OthelloAI {
  constructor(player, depth = 4) {
    this.player = player;
    this.depth = depth;
    this.searchCache = new Map();
  }

  setDepth(depth) {
    this.depth = depth;
  }

  getBestMove(state) {
    this.searchCache.clear();
    const result = this.alphaBeta(state, this.depth, -Infinity, Infinity, this.player);
    return typeof result === "number" ? result : null;
  }

  alphaBeta(state, depth, alpha, beta, currentPlayer) {
    const key = `${currentPlayer}|${depth}|${Array.from(state.board).join(",")}`;
    if (this.searchCache.has(key)) {
      return this.searchCache.get(key);
    }

    const moves = state.getValidMoves(currentPlayer);
    if (depth === 0 || moves.length === 0) {
      const score = this.evaluate(state);
      this.searchCache.set(key, score);
      return score;
    }

    const orderedMoves = moves.slice().sort((a, b) => moveOrderScore(b) - moveOrderScore(a));
    if (currentPlayer === this.player) {
      let bestMove = orderedMoves[0];
      for (const move of orderedMoves) {
        const child = state.clone();
        child.applyMove(move, currentPlayer);
        const value = this.alphaBeta(child, depth - 1, alpha, beta, -currentPlayer);
        if (value > alpha) {
          alpha = value;
          bestMove = move;
        }
        if (beta <= alpha) {
          break;
        }
      }
      const result = depth === this.depth ? bestMove : alpha;
      this.searchCache.set(key, result);
      return result;
    }

    for (const move of orderedMoves) {
      const child = state.clone();
      child.applyMove(move, currentPlayer);
      const value = this.alphaBeta(child, depth - 1, alpha, beta, -currentPlayer);
      beta = Math.min(beta, value);
      if (beta <= alpha) {
        break;
      }
    }
    this.searchCache.set(key, beta);
    return beta;
  }

  evaluate(state) {
    const counts = state.getCounts();
    const parity =
      ((counts.black + 1) / (counts.white + 1)) *
      (counts.empty < 20 ? 1 : -1);

    const blackTurn = counts.empty % 2 === 0;
    const mobility =
      (state.getValidMoves(BLACK, blackTurn).length + 0.01) /
      (state.getValidMoves(WHITE, !blackTurn).length + 0.01);

    const stability = scoreStability(state);
    const score = mobility + CORNER_WEIGHT * stability + parity;
    const noPiecePenalty =
      (this.player === BLACK && counts.black === 0) ||
      (this.player === WHITE && counts.white === 0)
        ? NO_PIECE_PENALTY
        : 0;

    return score * this.player - noPiecePenalty;
  }
}

export function createAIPlayers(depth) {
  return {
    [BLACK]: new OthelloAI(BLACK, depth),
    [WHITE]: new OthelloAI(WHITE, depth),
  };
}

export function simulateMove(state, index, player) {
  const clone = new GameState(state.board.slice());
  clone.applyMove(index, player);
  return clone;
}
