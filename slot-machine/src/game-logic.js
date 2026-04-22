/**
 * @typedef {'ready' | 'spinning' | 'win' | 'loss' | 'bonus'} FeedbackKind
 */

/**
 * @typedef {Object} GameState
 * @property {number} wallet
 * @property {number} spent
 * @property {number} won
 * @property {number} streak
 * @property {number} spins
 * @property {number} bonusProgress
 * @property {number} lastPayout
 * @property {boolean} isSpinning
 * @property {FeedbackKind} feedbackKind
 * @property {string} feedbackText
 */

/**
 * @typedef {Object} GameConfig
 * @property {number} spinCost
 * @property {number} pityRefill
 * @property {number} bonusThreshold
 * @property {number} bonusReward
 * @property {number} pairPayout
 * @property {number} triplePayout
 * @property {number} jackpotPayout
 * @property {string} jackpotSymbol
 * @property {number} reelCount
 */

/**
 * @typedef {Object} SpinOutcome
 * @property {number} payout
 * @property {string} message
 * @property {'win' | 'loss'} kind
 */

/**
 * @typedef {Object} SpinResolution
 * @property {GameState} nextState
 * @property {SpinOutcome} outcome
 * @property {number} bonusAwarded
 * @property {number} pityRefillAwarded
 * @property {number} totalPayout
 * @property {string} statusMessage
 */

/**
 * @typedef {Object} CashOutResolution
 * @property {GameState} nextState
 * @property {number} tokensRemoved
 * @property {number} pityRefillAwarded
 * @property {string} statusMessage
 */

export const SLOT_SYMBOLS = Object.freeze([
  'LANTERN',
  'KOI',
  'DRUM',
  'FAN',
  'MASK',
  'TORII',
  'MOCHI',
  'LUCK',
]);

export const DEFAULT_GAME_CONFIG = Object.freeze({
  spinCost: 3,
  pityRefill: 12,
  bonusThreshold: 15,
  bonusReward: 75,
  pairPayout: 6,
  triplePayout: 18,
  jackpotPayout: 30,
  jackpotSymbol: 'LANTERN',
  reelCount: 3,
});

const DEFAULT_GAME_STATE = Object.freeze({
  wallet: 30,
  spent: 0,
  won: 0,
  streak: 0,
  spins: 0,
  bonusProgress: 0,
  lastPayout: 0,
  isSpinning: false,
  feedbackKind: 'ready',
  feedbackText: 'Ready to spin',
});

const VALID_FEEDBACK_KINDS = new Set(['ready', 'spinning', 'win', 'loss', 'bonus']);

/**
 * Create a normalized game state object.
 *
 * @param {Partial<GameState>} [overrides={}]
 * @returns {GameState}
 */
export function createInitialGameState(overrides = {}) {
  const safeOverrides = typeof overrides === 'object' && overrides !== null ? overrides : {};

  return {
    wallet: toWholeNumber(safeOverrides.wallet, DEFAULT_GAME_STATE.wallet),
    spent: toWholeNumber(safeOverrides.spent, DEFAULT_GAME_STATE.spent),
    won: toWholeNumber(safeOverrides.won, DEFAULT_GAME_STATE.won),
    streak: toWholeNumber(safeOverrides.streak, DEFAULT_GAME_STATE.streak),
    spins: toWholeNumber(safeOverrides.spins, DEFAULT_GAME_STATE.spins),
    bonusProgress: toWholeNumber(safeOverrides.bonusProgress, DEFAULT_GAME_STATE.bonusProgress),
    lastPayout: toWholeNumber(safeOverrides.lastPayout, DEFAULT_GAME_STATE.lastPayout),
    isSpinning: Boolean(safeOverrides.isSpinning),
    feedbackKind: normalizeFeedbackKind(safeOverrides.feedbackKind),
    feedbackText: typeof safeOverrides.feedbackText === 'string'
      ? safeOverrides.feedbackText
      : DEFAULT_GAME_STATE.feedbackText,
  };
}

/**
 * Check whether the wallet can pay for a spin.
 *
 * @param {number} wallet
 * @param {GameConfig} [config=DEFAULT_GAME_CONFIG]
 * @returns {boolean}
 */
export function canAffordSpin(wallet, config = DEFAULT_GAME_CONFIG) {
  return toWholeNumber(wallet) >= config.spinCost;
}

/**
 * Derive the mood label shown in the UI.
 *
 * @param {GameState} gameState
 * @param {GameConfig} [config=DEFAULT_GAME_CONFIG]
 * @returns {string}
 */
export function getMoodText(gameState, config = DEFAULT_GAME_CONFIG) {
  const safeState = createInitialGameState(gameState);

  if (safeState.wallet <= config.spinCost) {
    return 'Almost snack-break broke';
  }

  if (safeState.streak >= 3) {
    return 'On a friendly heater';
  }

  if (safeState.won > safeState.spent) {
    return 'Doing surprisingly well';
  }

  if (safeState.spent - safeState.won > 12) {
    return 'Still having fun, probably';
  }

  return 'Easygoing';
}

/**
 * Deduct the spin cost before reel animation begins.
 *
 * @param {GameState} gameState
 * @param {GameConfig} [config=DEFAULT_GAME_CONFIG]
 * @returns {GameState}
 */
export function startSpin(gameState, config = DEFAULT_GAME_CONFIG) {
  const safeState = createInitialGameState(gameState);

  if (!canAffordSpin(safeState.wallet, config)) {
    throw new RangeError('Not enough tokens to spin.');
  }

  return {
    ...safeState,
    wallet: safeState.wallet - config.spinCost,
    spent: safeState.spent + config.spinCost,
    lastPayout: 0,
  };
}

/**
 * Calculate the payout for a completed reel result.
 *
 * @param {string[]} reelSymbols
 * @param {GameConfig} [config=DEFAULT_GAME_CONFIG]
 * @returns {SpinOutcome}
 */
export function evaluateSpinResult(reelSymbols, config = DEFAULT_GAME_CONFIG) {
  const safeSymbols = validateReelSymbols(reelSymbols, config.reelCount);
  const symbolCounts = countSymbols(safeSymbols);
  const countValues = Object.values(symbolCounts).sort((left, right) => right - left);
  const tripleSymbol = Object.keys(symbolCounts).find((symbol) => symbolCounts[symbol] === 3);

  if (tripleSymbol === config.jackpotSymbol) {
    return {
      payout: config.jackpotPayout,
      message: `Triple ${tripleSymbol}. Theme jackpot.`,
      kind: 'win',
    };
  }

  if (countValues[0] === 3 && tripleSymbol) {
    return {
      payout: config.triplePayout,
      message: `Triple ${tripleSymbol}. Nice hit.`,
      kind: 'win',
    };
  }

  if (countValues[0] === 2) {
    const pairedSymbol = Object.keys(symbolCounts).find((symbol) => symbolCounts[symbol] === 2);

    return {
      payout: config.pairPayout,
      message: `Pair of ${pairedSymbol}. Small win, solid vibes.`,
      kind: 'win',
    };
  }

  return {
    payout: 0,
    message: 'No match this time. The machine says it is still learning.',
    kind: 'loss',
  };
}

/**
 * Resolve all state updates after the reels stop.
 *
 * @param {GameState} gameState
 * @param {string[]} reelSymbols
 * @param {GameConfig} [config=DEFAULT_GAME_CONFIG]
 * @returns {SpinResolution}
 */
export function finishSpin(gameState, reelSymbols, config = DEFAULT_GAME_CONFIG) {
  const safeState = createInitialGameState(gameState);
  const outcome = evaluateSpinResult(reelSymbols, config);
  const bonusStep = advanceBonusMeter(safeState.bonusProgress, config);
  const walletBeforeRefill = safeState.wallet + outcome.payout + bonusStep.bonusAwarded;
  const pityRefillAwarded = walletBeforeRefill < config.spinCost ? config.pityRefill : 0;

  let statusMessage = outcome.message;

  if (bonusStep.bonusAwarded > 0) {
    statusMessage = `${statusMessage} Bonus unlocked: +${bonusStep.bonusAwarded} tokens for sticking with it.`;
  }

  if (pityRefillAwarded > 0) {
    statusMessage = `${statusMessage} The machine spotted the low balance and tossed in ${pityRefillAwarded} comeback tokens.`;
  }

  return {
    nextState: {
      ...safeState,
      wallet: walletBeforeRefill + pityRefillAwarded,
      won: safeState.won + outcome.payout + bonusStep.bonusAwarded,
      streak: outcome.payout > 0 ? safeState.streak + 1 : 0,
      spins: safeState.spins + 1,
      bonusProgress: bonusStep.nextProgress,
      lastPayout: outcome.payout + bonusStep.bonusAwarded,
      isSpinning: false,
    },
    outcome,
    bonusAwarded: bonusStep.bonusAwarded,
    pityRefillAwarded,
    totalPayout: outcome.payout + bonusStep.bonusAwarded,
    statusMessage,
  };
}

/**
 * Return the number of tokens that should be exchanged for slides.
 *
 * @param {number} wallet
 * @returns {number}
 */
export function calculateCashOutAmount(wallet) {
  const safeWallet = toWholeNumber(wallet);

  if (safeWallet <= 0) {
    return 0;
  }

  return Math.max(1, Math.floor(safeWallet / 2));
}

/**
 * Resolve the token changes for the slide-deck cash-out action.
 *
 * @param {GameState} gameState
 * @param {GameConfig} [config=DEFAULT_GAME_CONFIG]
 * @returns {CashOutResolution}
 */
export function resolveCashOut(gameState, config = DEFAULT_GAME_CONFIG) {
  const safeState = createInitialGameState(gameState);
  const tokensRemoved = calculateCashOutAmount(safeState.wallet);

  if (tokensRemoved === 0) {
    return {
      nextState: {
        ...safeState,
        streak: 0,
        lastPayout: 0,
        isSpinning: false,
      },
      tokensRemoved: 0,
      pityRefillAwarded: 0,
      statusMessage: 'No tokens to trade right now. Spin a little more first.',
    };
  }

  const walletAfterCashOut = safeState.wallet - tokensRemoved;
  const pityRefillAwarded = walletAfterCashOut < config.spinCost ? config.pityRefill : 0;
  let statusMessage = `You traded ${tokensRemoved} tokens for a cheerful slide deck about helpful automation.`;

  if (pityRefillAwarded > 0) {
    statusMessage = `${statusMessage} The machine kindly added ${pityRefillAwarded} comeback tokens so the fun can continue.`;
  }

  return {
    nextState: {
      ...safeState,
      wallet: walletAfterCashOut + pityRefillAwarded,
      spent: safeState.spent + tokensRemoved,
      streak: 0,
      lastPayout: 0,
      isSpinning: false,
    },
    tokensRemoved,
    pityRefillAwarded,
    statusMessage,
  };
}

/**
 * Count how many times each symbol appears.
 *
 * @param {string[]} reelSymbols
 * @returns {Record<string, number>}
 */
function countSymbols(reelSymbols) {
  return reelSymbols.reduce((counts, symbol) => {
    counts[symbol] = (counts[symbol] || 0) + 1;
    return counts;
  }, /** @type {Record<string, number>} */ ({}));
}

/**
 * Advance the bonus meter by one spin.
 *
 * @param {number} currentProgress
 * @param {GameConfig} config
 * @returns {{ nextProgress: number, bonusAwarded: number }}
 */
function advanceBonusMeter(currentProgress, config) {
  const nextProgress = toWholeNumber(currentProgress) + 1;

  if (nextProgress < config.bonusThreshold) {
    return { nextProgress, bonusAwarded: 0 };
  }

  return { nextProgress: 0, bonusAwarded: config.bonusReward };
}

/**
 * Validate reel output before applying payouts.
 *
 * @param {unknown} reelSymbols
 * @param {number} reelCount
 * @returns {string[]}
 */
function validateReelSymbols(reelSymbols, reelCount) {
  if (!Array.isArray(reelSymbols) || reelSymbols.length !== reelCount) {
    throw new TypeError(`Expected exactly ${reelCount} reel symbols.`);
  }

  if (reelSymbols.some((symbol) => typeof symbol !== 'string' || symbol.trim() === '')) {
    throw new TypeError('Each reel symbol must be a non-empty string.');
  }

  return reelSymbols;
}

/**
 * Normalize a number into a safe non-negative whole number.
 *
 * @param {unknown} value
 * @param {number} [fallback=0]
 * @returns {number}
 */
function toWholeNumber(value, fallback = 0) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.floor(Number(value)));
}

/**
 * Normalize the stored feedback state.
 *
 * @param {unknown} value
 * @returns {FeedbackKind}
 */
function normalizeFeedbackKind(value) {
  return VALID_FEEDBACK_KINDS.has(value) ? value : 'ready';
}
