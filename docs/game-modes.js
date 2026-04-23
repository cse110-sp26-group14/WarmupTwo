/**
 * @typedef {Object} GameMode
 * @property {string} key - Stable storage key for the mode.
 * @property {string} label - Human-readable label shown in the UI.
 * @property {string} description - Short explanation of how the mode feels.
 * @property {number} reelCount - Number of visible reels in the mode.
 * @property {number[]} reelSpinDurations - Per-reel animation durations in milliseconds.
 * @property {number} jackpotMatchCount - Number of matching jackpot symbols required to pay the jackpot.
 */

/**
 * Theme-agnostic reel modes used by the cabinet.
 * @type {Readonly<Record<string, GameMode>>}
 */
export const GAME_MODES = Object.freeze({
  classic: {
    key: 'classic',
    label: 'Classic 3-Reel',
    description: 'The familiar cabinet layout with a quick, compact payoff curve.',
    reelCount: 3,
    reelSpinDurations: [700, 920, 1140],
    jackpotMatchCount: 3,
  },
  bigFive: {
    key: 'bigFive',
    label: 'Big 5-Reel',
    description: 'A longer cabinet with more reels, longer spins, and a scarier jackpot.',
    reelCount: 5,
    reelSpinDurations: [640, 820, 1000, 1180, 1360],
    jackpotMatchCount: 5,
  },
});

/**
 * Resolve a safe game mode from user input.
 *
 * @param {unknown} modeKey - Requested mode key, usually read from a button dataset.
 * @returns {GameMode} The matching game mode, or the classic mode when the key is invalid.
 */
export function getGameMode(modeKey) {
  return GAME_MODES[modeKey] || GAME_MODES.classic;
}
