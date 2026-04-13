import { BLACK, WHITE, GameState, toIndex } from "../src/core/engine.js";
import { OthelloAI } from "../src/core/ai.js";
import assert from "assert";

export function testInitialLegalMoves() {
  const state = new GameState();
  const blackMoves = state.getValidMoves(BLACK).sort((a, b) => a - b);
  const whiteMoves = state.getValidMoves(WHITE).sort((a, b) => a - b);

  assert.deepEqual(
    blackMoves,
    [toIndex(2, 3), toIndex(3, 2), toIndex(4, 5), toIndex(5, 4)].sort((a, b) => a - b)
  );
  assert.deepEqual(
    whiteMoves,
    [toIndex(2, 4), toIndex(3, 5), toIndex(4, 2), toIndex(5, 3)].sort((a, b) => a - b)
  );
}

export function testApplyMoveFlipsPieces() {
  const state = new GameState();
  state.applyMove(toIndex(2, 3), BLACK);
  assert.equal(state.getCell(2, 3), BLACK);
  assert.equal(state.getCell(3, 3), BLACK);
  const counts = state.getCounts();
  assert.equal(counts.black, 4);
  assert.equal(counts.white, 1);
}

export function testAIReturnsLegalMove() {
  const state = new GameState();
  const ai = new OthelloAI(BLACK, 2);
  const move = ai.getBestMove(state);
  assert.ok(state.getValidMoves(BLACK).includes(move));
}
