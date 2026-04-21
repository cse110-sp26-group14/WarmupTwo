import {
  DEFAULT_GAME_CONFIG,
  SLOT_SYMBOLS,
  canAffordSpin,
  createInitialGameState,
  finishSpin,
  getMoodText,
  resolveCashOut,
  startSpin,
} from './game-logic.js';

const REEL_SPIN_DURATIONS_MS = Object.freeze([700, 920, 1140]);
const REEL_TICK_INTERVAL_MS = 90;
const TOAST_DURATION_MS = 1800;
const PANEL_EFFECT_DURATION_MS = 550;

/**
 * @typedef {Object} AppElements
 * @property {HTMLElement[]} reelSymbols
 * @property {HTMLElement} walletCount
 * @property {HTMLElement} spentCount
 * @property {HTMLElement} wonCount
 * @property {HTMLElement} streakCount
 * @property {HTMLElement} spinCount
 * @property {HTMLElement} lastPayout
 * @property {HTMLElement} moodText
 * @property {HTMLElement} statusLine
 * @property {HTMLButtonElement} spinButton
 * @property {HTMLButtonElement} cashOutButton
 * @property {HTMLElement} machinePanel
 * @property {HTMLTemplateElement} toastTemplate
 * @property {HTMLElement} toastStack
 * @property {HTMLElement} bonusText
 * @property {HTMLElement} bonusFill
 * @property {HTMLElement} feedbackPill
 * @property {string[]} symbolPool
 */

let gameState = createInitialGameState();

initializeApp();

/**
 * Start the browser app when the DOM is ready.
 *
 * @returns {void}
 */
function initializeApp() {
  try {
    const elements = createAppElements();
    attachEventListeners(elements);
    renderGameState(gameState, elements);
  } catch (error) {
    console.error('Unable to initialize the slot machine UI.', error);
  }
}

/**
 * Look up and validate the DOM elements used by the app.
 *
 * @returns {AppElements}
 */
function createAppElements() {
  return {
    reelSymbols: [
      getRequiredHtmlElement('#reel0'),
      getRequiredHtmlElement('#reel1'),
      getRequiredHtmlElement('#reel2'),
    ],
    walletCount: getRequiredHtmlElement('#walletCount'),
    spentCount: getRequiredHtmlElement('#spentCount'),
    wonCount: getRequiredHtmlElement('#wonCount'),
    streakCount: getRequiredHtmlElement('#streakCount'),
    spinCount: getRequiredHtmlElement('#spinCount'),
    lastPayout: getRequiredHtmlElement('#lastPayout'),
    moodText: getRequiredHtmlElement('#moodText'),
    statusLine: getRequiredHtmlElement('#statusLine'),
    spinButton: getRequiredButton('#spinButton'),
    cashOutButton: getRequiredButton('#cashOutButton'),
    machinePanel: getRequiredHtmlElement('.machine-panel'),
    toastTemplate: getRequiredTemplate('#toastTemplate'),
    toastStack: getRequiredHtmlElement('#toastStack'),
    bonusText: getRequiredHtmlElement('#bonusText'),
    bonusFill: getRequiredHtmlElement('#bonusFill'),
    feedbackPill: getRequiredHtmlElement('#feedbackPill'),
    symbolPool: [...SLOT_SYMBOLS],
  };
}

/**
 * Wire button click handlers.
 *
 * @param {AppElements} elements
 * @returns {void}
 */
function attachEventListeners(elements) {
  elements.spinButton.addEventListener('click', () => {
    void handleSpinClick(elements);
  });

  elements.cashOutButton.addEventListener('click', () => {
    handleCashOutClick(elements);
  });
}

/**
 * Render the current state into the DOM.
 *
 * @param {ReturnType<typeof createInitialGameState>} state
 * @param {AppElements} elements
 * @returns {void}
 */
function renderGameState(state, elements) {
  elements.walletCount.textContent = String(state.wallet);
  elements.spentCount.textContent = String(state.spent);
  elements.wonCount.textContent = String(state.won);
  elements.streakCount.textContent = `${state.streak} ${state.streak === 1 ? 'win' : 'wins'}`;
  elements.spinCount.textContent = String(state.spins);
  elements.lastPayout.textContent = `${state.lastPayout} tokens`;
  elements.moodText.textContent = getMoodText(state, DEFAULT_GAME_CONFIG);
  elements.feedbackPill.textContent = state.feedbackText;
  elements.feedbackPill.className = `feedback-pill ${state.feedbackKind}`;
  elements.bonusText.textContent = `${state.bonusProgress} / ${DEFAULT_GAME_CONFIG.bonusThreshold} spins`;
  elements.bonusFill.style.width = `${(state.bonusProgress / DEFAULT_GAME_CONFIG.bonusThreshold) * 100}%`;
  elements.spinButton.disabled = state.isSpinning || !canAffordSpin(state.wallet, DEFAULT_GAME_CONFIG);
  elements.cashOutButton.disabled = state.isSpinning;
}

/**
 * Handle the spin button and recover cleanly if animation or DOM work fails.
 *
 * @param {AppElements} elements
 * @returns {Promise<void>}
 */
async function handleSpinClick(elements) {
  if (gameState.isSpinning || !canAffordSpin(gameState.wallet, DEFAULT_GAME_CONFIG)) {
    return;
  }

  const previousState = gameState;

  try {
    const paidSpinState = startSpin(gameState, DEFAULT_GAME_CONFIG);

    gameState = {
      ...paidSpinState,
      isSpinning: true,
      feedbackKind: 'spinning',
      feedbackText: 'Spinning...',
    };

    setStatusMessage(elements, 'The reels are warming up.');
    renderGameState(gameState, elements);

    const reelSymbols = await spinAllReels(elements);
    const resolution = finishSpin(gameState, reelSymbols, DEFAULT_GAME_CONFIG);

    gameState = {
      ...resolution.nextState,
      feedbackKind: getFeedbackKindForSpin(resolution),
      feedbackText: getFeedbackTextForSpin(resolution),
    };

    playSpinEffects(resolution, elements);
    setStatusMessage(elements, resolution.statusMessage);
  } catch (error) {
    console.error('The spin action failed.', error);
    gameState = {
      ...previousState,
      isSpinning: false,
      feedbackKind: 'loss',
      feedbackText: 'Spin failed',
    };
    setStatusMessage(elements, 'The machine jammed for a second. Please try again.');
  }

  renderGameState(gameState, elements);
}

/**
 * Handle the slide-deck cash-out button.
 *
 * @param {AppElements} elements
 * @returns {void}
 */
function handleCashOutClick(elements) {
  if (gameState.isSpinning) {
    return;
  }

  const resolution = resolveCashOut(gameState, DEFAULT_GAME_CONFIG);

  gameState = {
    ...resolution.nextState,
    feedbackKind: resolution.tokensRemoved > 0 ? 'loss' : 'ready',
    feedbackText: resolution.tokensRemoved > 0 ? 'Slides acquired' : 'Wallet empty',
  };

  if (resolution.tokensRemoved > 0) {
    flashMachinePanel(elements.machinePanel, 'loss-flash');
    triggerVibration(20);
    queueToast(elements, `-${resolution.tokensRemoved} tokens for slides`);
  }

  if (resolution.pityRefillAwarded > 0) {
    queueToast(elements, `Refill +${resolution.pityRefillAwarded} tokens`);
  }

  setStatusMessage(elements, resolution.statusMessage);
  renderGameState(gameState, elements);
}

/**
 * Animate all reels and return their final symbols.
 *
 * @param {AppElements} elements
 * @returns {Promise<string[]>}
 */
function spinAllReels(elements) {
  return Promise.all(
    elements.reelSymbols.map((element, index) =>
      animateReelSymbol(element, REEL_SPIN_DURATIONS_MS[index], elements.symbolPool)
    )
  );
}

/**
 * Animate a single reel until it lands on a final symbol.
 *
 * @param {HTMLElement} reelElement
 * @param {number} durationMs
 * @param {string[]} symbolPool
 * @returns {Promise<string>}
 */
function animateReelSymbol(reelElement, durationMs, symbolPool) {
  reelElement.classList.add('spinning');

  const timerId = window.setInterval(() => {
    reelElement.textContent = pickRandomSymbol(symbolPool);
  }, REEL_TICK_INTERVAL_MS);

  return new Promise((resolve) => {
    window.setTimeout(() => {
      window.clearInterval(timerId);
      reelElement.classList.remove('spinning');
      const finalSymbol = pickRandomSymbol(symbolPool);
      reelElement.textContent = finalSymbol;
      resolve(finalSymbol);
    }, durationMs);
  });
}

/**
 * Apply effects after a completed spin.
 *
 * @param {import('./game-logic.js').SpinResolution} resolution
 * @param {AppElements} elements
 * @returns {void}
 */
function playSpinEffects(resolution, elements) {
  if (resolution.outcome.payout > 0) {
    flashMachinePanel(elements.machinePanel, 'win-flash');
    triggerVibration([30, 20, 50]);
    queueToast(elements, `+${resolution.outcome.payout} tokens`);
  } else {
    flashMachinePanel(elements.machinePanel, 'loss-flash');
    triggerVibration(25);
  }

  if (resolution.bonusAwarded > 0) {
    queueToast(elements, `Bonus +${resolution.bonusAwarded} tokens`);
  }

  if (resolution.pityRefillAwarded > 0) {
    queueToast(elements, `Comeback +${resolution.pityRefillAwarded} tokens`);
  }
}

/**
 * Choose the feedback style for the status pill after a spin.
 *
 * @param {import('./game-logic.js').SpinResolution} resolution
 * @returns {'win' | 'loss' | 'bonus'}
 */
function getFeedbackKindForSpin(resolution) {
  if (resolution.bonusAwarded > 0) {
    return 'bonus';
  }

  return resolution.outcome.kind;
}

/**
 * Choose the short feedback label for the status pill after a spin.
 *
 * @param {import('./game-logic.js').SpinResolution} resolution
 * @returns {string}
 */
function getFeedbackTextForSpin(resolution) {
  if (resolution.bonusAwarded > 0) {
    return `Bonus +${resolution.bonusAwarded}`;
  }

  if (resolution.outcome.payout > 0) {
    return `Win +${resolution.outcome.payout}`;
  }

  return 'Try again';
}

/**
 * Update the main status line.
 *
 * @param {AppElements} elements
 * @param {string} message
 * @returns {void}
 */
function setStatusMessage(elements, message) {
  elements.statusLine.textContent = message;
}

/**
 * Show a short toast message if the template is available.
 *
 * @param {AppElements} elements
 * @param {string} message
 * @returns {void}
 */
function queueToast(elements, message) {
  const templateChild = elements.toastTemplate.content.firstElementChild;

  if (!(templateChild instanceof HTMLElement)) {
    return;
  }

  const toast = templateChild.cloneNode(true);

  if (!(toast instanceof HTMLElement)) {
    return;
  }

  toast.textContent = message;
  elements.toastStack.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, TOAST_DURATION_MS);
}

/**
 * Flash the machine panel after a win or loss.
 *
 * @param {HTMLElement} panel
 * @param {'win-flash' | 'loss-flash'} effectClass
 * @returns {void}
 */
function flashMachinePanel(panel, effectClass) {
  panel.classList.remove('win-flash', 'loss-flash');
  panel.classList.add(effectClass);

  window.setTimeout(() => {
    panel.classList.remove(effectClass);
  }, PANEL_EFFECT_DURATION_MS);
}

/**
 * Trigger device vibration when available.
 *
 * @param {number | number[]} pattern
 * @returns {void}
 */
function triggerVibration(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Pick a random reel symbol.
 *
 * @param {string[]} symbolPool
 * @returns {string}
 */
function pickRandomSymbol(symbolPool) {
  const randomIndex = Math.floor(Math.random() * symbolPool.length);
  return symbolPool[randomIndex];
}

/**
 * Find a required HTML element and fail loudly when it is missing.
 *
 * @param {string} selector
 * @returns {HTMLElement}
 */
function getRequiredHtmlElement(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

/**
 * Find a required button element.
 *
 * @param {string} selector
 * @returns {HTMLButtonElement}
 */
function getRequiredButton(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Missing required button: ${selector}`);
  }

  return element;
}

/**
 * Find a required template element.
 *
 * @param {string} selector
 * @returns {HTMLTemplateElement}
 */
function getRequiredTemplate(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLTemplateElement)) {
    throw new Error(`Missing required template: ${selector}`);
  }

  return element;
}
