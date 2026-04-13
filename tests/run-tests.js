import {
  testInitialLegalMoves,
  testApplyMoveFlipsPieces,
  testAIReturnsLegalMove,
} from "./engine.test.js";

const tests = [
  ["initial legal moves", testInitialLegalMoves],
  ["apply move flips pieces", testApplyMoveFlipsPieces],
  ["ai returns legal move", testAIReturnsLegalMove],
];

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${name}`);
    console.error(error);
  }
}

if (failed > 0) {
  process.exit(1);
}

console.log(`All tests passed (${tests.length})`);
