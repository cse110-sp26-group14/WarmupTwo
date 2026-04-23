import test from 'node:test';
import assert from 'node:assert/strict';

const storage = new Map();
const storageStub = {
  getItem(key) {
    return storage.has(key) ? storage.get(key) : null;
  },
  setItem(key, value) {
    storage.set(key, String(value));
  },
};

globalThis.window = {
  localStorage: storageStub,
  AudioContext: undefined,
  webkitAudioContext: undefined,
  clearTimeout,
  setTimeout,
  clearInterval,
  setInterval,
  navigator: {},
};

const script = await import('../src/script.js');

test('clampVolume keeps values within the 0 to 1 range', () => {
  assert.equal(script.clampVolume(-4), 0);
  assert.equal(script.clampVolume(0.45), 0.45);
  assert.equal(script.clampVolume(2), 1);
});

test('loadStoredMode falls back to classic and reads valid mode keys', () => {
  storage.set('lucky-spin-mode', 'bigFive');
  assert.equal(script.loadStoredMode(), 'bigFive');

  storage.set('lucky-spin-mode', 'not-real');
  assert.equal(script.loadStoredMode(), 'classic');
});

test('loadStoredTheme and loadStoredVolume recover from storage errors', () => {
  const originalStorage = window.localStorage;
  window.localStorage = {
    getItem() {
      throw new Error('storage blocked');
    },
    setItem() {
      throw new Error('storage blocked');
    },
  };

  try {
    assert.equal(script.loadStoredTheme(), 'festival');
    assert.equal(script.loadStoredVolume(), 0.35);
  } finally {
    window.localStorage = originalStorage;
  }
});

test('loadStoredVolume clamps oversized stored percentages', () => {
  storage.set('lucky-spin-volume', '250');
  assert.equal(script.loadStoredVolume(), 1);
});

test('buildSpinHistoryLabel distinguishes the big win tiers', () => {
  assert.equal(script.buildSpinHistoryLabel({ outcome: { matchCount: 5, payout: 30 }, progressLost: 0 }), 'Five of a kind');
  assert.equal(script.buildSpinHistoryLabel({ outcome: { matchCount: 3, payout: 18 }, progressLost: 0 }), 'Three of a kind');
  assert.equal(script.buildSpinHistoryLabel({ outcome: { matchCount: 2, payout: 6 }, progressLost: 0 }), 'Small win');
  assert.equal(script.buildSpinHistoryLabel({ outcome: { matchCount: 0, payout: 0 }, progressLost: 4 }), 'Progress loss');
});

test('recordSpinHistory keeps the latest spin at the top of the trail', () => {
  const historyList = { innerHTML: '' };

  script.recordSpinHistory(['CHERRY', 'DIAMOND', 'LUCKY7'], {
    nextState: { spins: 1, bonusProgress: 1 },
    outcome: { matchCount: 3, payout: 18, kind: 'win', resetsProgress: false },
    bonusAwarded: 0,
    pityRefillAwarded: 0,
    totalPayout: 18,
    progressLost: 0,
    statusMessage: 'Nice hit',
  });

  script.renderSpinHistory({ spinHistoryList: historyList });

  assert.match(historyList.innerHTML, /Spin 1/);
  assert.match(historyList.innerHTML, /Three of a kind/);
  assert.match(historyList.innerHTML, /Cherry/);
});