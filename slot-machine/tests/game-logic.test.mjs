import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_GAME_CONFIG,
  calculateCashOutAmount,
  canAffordSpin,
  createInitialGameState,
  evaluateSpinResult,
  finishSpin,
  resolveCashOut,
  startSpin,
} from '../src/game-logic.js';

test('evaluateSpinResult returns the configured jackpot payout', () => {
  const result = evaluateSpinResult(
    ['LANTERN', 'LANTERN', 'LANTERN'],
    { ...DEFAULT_GAME_CONFIG, jackpotSymbol: 'LANTERN' }
  );

  assert.equal(result.payout, DEFAULT_GAME_CONFIG.jackpotPayout);
  assert.equal(result.kind, 'win');
});

test('evaluateSpinResult rejects invalid reel data', () => {
  assert.throws(() => {
    evaluateSpinResult(['LANTERN']);
  }, /Expected exactly 3 reel symbols/);
});

test('startSpin deducts tokens and blocks unaffordable spins', () => {
  const startedState = startSpin(createInitialGameState({ wallet: 10 }));

  assert.equal(startedState.wallet, 7);
  assert.equal(startedState.spent, DEFAULT_GAME_CONFIG.spinCost);
  assert.equal(canAffordSpin(startedState.wallet), true);

  assert.throws(() => {
    startSpin(createInitialGameState({ wallet: 2 }));
  }, /Not enough tokens to spin/);
});

test('finishSpin applies pair payouts and the longer vault reward', () => {
  const startingState = createInitialGameState({
    wallet: 10,
    spins: DEFAULT_GAME_CONFIG.bonusThreshold - 1,
    bonusProgress: DEFAULT_GAME_CONFIG.bonusThreshold - 1,
  });
  const paidSpinState = startSpin(startingState);
  const resolution = finishSpin(paidSpinState, ['KOI', 'KOI', 'DRUM']);

  assert.equal(resolution.outcome.payout, DEFAULT_GAME_CONFIG.pairPayout);
  assert.equal(resolution.bonusAwarded, DEFAULT_GAME_CONFIG.bonusReward);
  assert.equal(resolution.nextState.wallet, 163);
  assert.equal(resolution.nextState.won, 156);
  assert.equal(resolution.nextState.spins, DEFAULT_GAME_CONFIG.bonusThreshold);
  assert.equal(resolution.nextState.bonusProgress, 0);
  assert.equal(resolution.nextState.lastPayout, 156);
});

test('pairing the drop symbol decreases vault progress', () => {
  const paidSpinState = startSpin(createInitialGameState({ wallet: 30, bonusProgress: 10 }));
  const resolution = finishSpin(paidSpinState, ['MASK', 'MASK', 'KOI']);

  assert.equal(resolution.outcome.kind, 'loss');
  assert.equal(resolution.progressLost, 4);
  assert.equal(resolution.nextState.bonusProgress, 7);
});

test('triple reset symbol wipes the vault meter', () => {
  const paidSpinState = startSpin(createInitialGameState({ wallet: 30, bonusProgress: 12 }));
  const resolution = finishSpin(paidSpinState, ['MASK', 'MASK', 'MASK']);

  assert.equal(resolution.outcome.resetsProgress, true);
  assert.equal(resolution.progressLost, 13);
  assert.equal(resolution.nextState.bonusProgress, 0);
});

test('finishSpin applies the comeback refill when the wallet is drained', () => {
  const paidSpinState = startSpin(createInitialGameState({ wallet: 3 }));
  const resolution = finishSpin(paidSpinState, ['PROMPT', 'GPU', 'TOKEN']);

  assert.equal(resolution.outcome.payout, 0);
  assert.equal(resolution.pityRefillAwarded, DEFAULT_GAME_CONFIG.pityRefill);
  assert.equal(resolution.nextState.wallet, DEFAULT_GAME_CONFIG.pityRefill);
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
  assert.equal(resolution.pityRefillAwarded, DEFAULT_GAME_CONFIG.pityRefill);
  assert.equal(resolution.nextState.wallet, 14);
  assert.equal(resolution.nextState.spent, 2);
});
