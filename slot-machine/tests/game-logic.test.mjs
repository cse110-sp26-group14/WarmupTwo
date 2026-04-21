import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateCashOutAmount,
  canAffordSpin,
  createInitialGameState,
  evaluateSpinResult,
  finishSpin,
  resolveCashOut,
  startSpin,
} from '../src/game-logic.js';

test('evaluateSpinResult returns the BOT jackpot payout', () => {
  const result = evaluateSpinResult(['BOT', 'BOT', 'BOT']);

  assert.equal(result.payout, 30);
  assert.equal(result.kind, 'win');
});

test('evaluateSpinResult rejects invalid reel data', () => {
  assert.throws(() => {
    evaluateSpinResult(['BOT']);
  }, /Expected exactly 3 reel symbols/);
});

test('startSpin deducts tokens and blocks unaffordable spins', () => {
  const startedState = startSpin(createInitialGameState({ wallet: 10 }));

  assert.equal(startedState.wallet, 7);
  assert.equal(startedState.spent, 3);
  assert.equal(canAffordSpin(startedState.wallet), true);

  assert.throws(() => {
    startSpin(createInitialGameState({ wallet: 2 }));
  }, /Not enough tokens to spin/);
});

test('finishSpin applies pair payouts and the five-spin bonus reward', () => {
  const startingState = createInitialGameState({
    wallet: 10,
    spins: 4,
    bonusProgress: 4,
  });
  const paidSpinState = startSpin(startingState);
  const resolution = finishSpin(paidSpinState, ['GPU', 'GPU', 'TOKEN']);

  assert.equal(resolution.outcome.payout, 6);
  assert.equal(resolution.bonusAwarded, 8);
  assert.equal(resolution.nextState.wallet, 21);
  assert.equal(resolution.nextState.won, 14);
  assert.equal(resolution.nextState.spins, 5);
  assert.equal(resolution.nextState.bonusProgress, 0);
  assert.equal(resolution.nextState.lastPayout, 14);
});

test('finishSpin applies the comeback refill when the wallet is drained', () => {
  const paidSpinState = startSpin(createInitialGameState({ wallet: 3 }));
  const resolution = finishSpin(paidSpinState, ['PROMPT', 'GPU', 'TOKEN']);

  assert.equal(resolution.outcome.payout, 0);
  assert.equal(resolution.pityRefillAwarded, 12);
  assert.equal(resolution.nextState.wallet, 12);
});

test('calculateCashOutAmount never overspends an empty wallet', () => {
  assert.equal(calculateCashOutAmount(0), 0);
  assert.equal(calculateCashOutAmount(1), 1);
  assert.equal(calculateCashOutAmount(9), 4);
});

test('resolveCashOut leaves an empty wallet unchanged', () => {
  const resolution = resolveCashOut(createInitialGameState({ wallet: 0 }));

  assert.equal(resolution.tokensRemoved, 0);
  assert.equal(resolution.nextState.wallet, 0);
  assert.equal(resolution.nextState.spent, 0);
  assert.match(resolution.statusMessage, /No tokens to trade/);
});

test('resolveCashOut deducts tokens and can trigger a refill', () => {
  const resolution = resolveCashOut(createInitialGameState({ wallet: 4 }));

  assert.equal(resolution.tokensRemoved, 2);
  assert.equal(resolution.pityRefillAwarded, 12);
  assert.equal(resolution.nextState.wallet, 14);
  assert.equal(resolution.nextState.spent, 2);
});
