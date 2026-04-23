import test from 'node:test';
import assert from 'node:assert/strict';

import { GAME_MODES, getGameMode } from '../src/game-modes.js';

test('getGameMode returns the classic mode for unknown keys', () => {
  assert.equal(getGameMode('not-real').key, GAME_MODES.classic.key);
  assert.equal(getGameMode(undefined).key, GAME_MODES.classic.key);
});

test('bigFive mode defines a five reel cabinet and longer spin timings', () => {
  const mode = getGameMode('bigFive');

  assert.equal(mode.key, 'bigFive');
  assert.equal(mode.reelCount, 5);
  assert.equal(mode.jackpotMatchCount, 5);
  assert.equal(mode.reelSpinDurations.length, 5);
  assert.ok(mode.reelSpinDurations[4] > mode.reelSpinDurations[0]);
});
