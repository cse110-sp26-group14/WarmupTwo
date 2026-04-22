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
const THEME_STORAGE_KEY = 'token-furnace-theme';
const AVAILABLE_THEMES = Object.freeze(['sunset', 'midnight', 'mint']);

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
 * @property {HTMLElement} bonusCluster
 * @property {HTMLElement} bonusAlert
 * @property {HTMLElement} feedbackPill
 * @property {HTMLElement} resultBurst
 * @property {HTMLElement} resultKicker
 * @property {HTMLElement} resultValue
 * @property {HTMLElement} resultCaption
 * @property {HTMLButtonElement[]} themeButtons
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
    applyTheme(loadStoredTheme(), elements);
    attachEventListeners(elements);
    renderGameState(gameState, elements);
    showResultState(
      elements,
      {
        kind: 'ready',
        kicker: 'Next up',
        value: 'SPIN TO PLAY',
        caption: 'The machine saves the loud part for the result.',
      },
      false
    );
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
    bonusCluster: getRequiredHtmlElement('#bonusCluster'),
    bonusAlert: getRequiredHtmlElement('#bonusAlert'),
    feedbackPill: getRequiredHtmlElement('#feedbackPill'),
    resultBurst: getRequiredHtmlElement('#resultBurst'),
    resultKicker: getRequiredHtmlElement('#resultKicker'),
    resultValue: getRequiredHtmlElement('#resultValue'),
    resultCaption: getRequiredHtmlElement('#resultCaption'),
    themeButtons: getThemeButtons(),
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

  elements.themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      applyTheme(button.dataset.themeOption || AVAILABLE_THEMES[0], elements);
    });
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
  updateBonusMeterState(state, elements);
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
    showResultState(
      elements,
      {
        kind: 'spinning',
        kicker: 'Spinning',
        value: 'REELS IN MOTION',
        caption: 'This is where the machine pretends to think.',
      },
      true
    );
    renderGameState(gameState, elements);

    const reelSymbols = await spinAllReels(elements);
    const resolution = finishSpin(gameState, reelSymbols, DEFAULT_GAME_CONFIG);

    gameState = {
      ...resolution.nextState,
      feedbackKind: getFeedbackKindForSpin(resolution),
      feedbackText: getFeedbackTextForSpin(resolution),
    };

    playSpinEffects(resolution, elements);
    showResultState(elements, getResultStateForSpin(resolution), true);
    setStatusMessage(elements, resolution.statusMessage);
  } catch (error) {
    console.error('The spin action failed.', error);
    gameState = {
      ...previousState,
      isSpinning: false,
      feedbackKind: 'loss',
      feedbackText: 'Spin failed',
    };
    showResultState(
      elements,
      {
        kind: 'loss',
        kicker: 'Machine jam',
        value: 'TRY AGAIN',
        caption: 'The reels had a moment. Everything is reset now.',
      },
      true
    );
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

  showResultState(elements, getResultStateForCashOut(resolution), true);
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
 * Update the bonus meter styling and alert copy.
 *
 * @param {ReturnType<typeof createInitialGameState>} state
 * @param {AppElements} elements
 * @returns {void}
 */
function updateBonusMeterState(state, elements) {
  const remainingSpins = Math.max(0, DEFAULT_GAME_CONFIG.bonusThreshold - state.bonusProgress);
  elements.bonusCluster.classList.remove('heated', 'imminent');

  if (remainingSpins === 1) {
    elements.bonusCluster.classList.add('imminent');
  } else if (remainingSpins === 2) {
    elements.bonusCluster.classList.add('heated');
  }

  elements.bonusAlert.textContent = getBonusAlertText(state, remainingSpins);
}

/**
 * Build the bonus meter message.
 *
 * @param {ReturnType<typeof createInitialGameState>} state
 * @param {number} remainingSpins
 * @returns {string}
 */
function getBonusAlertText(state, remainingSpins) {
  if (remainingSpins === 1) {
    return 'One more spin triggers the bonus drop.';
  }

  if (remainingSpins === 2) {
    return 'Two spins left. The machine is getting twitchy.';
  }

  if (state.spins === 0 || state.bonusProgress > 0) {
    return `${remainingSpins} spins until bonus drop.`;
  }

  return 'Meter reset. Five spins until the next bonus drop.';
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
 * Create the explicit result display for a completed spin.
 *
 * @param {import('./game-logic.js').SpinResolution} resolution
 * @returns {{ kind: string, kicker: string, value: string, caption: string }}
 */
function getResultStateForSpin(resolution) {
  if (resolution.outcome.payout === DEFAULT_GAME_CONFIG.jackpotPayout) {
    return {
      kind: 'jackpot',
      kicker: 'Jackpot',
      value: `+${resolution.outcome.payout} TOKENS`,
      caption: resolution.statusMessage,
    };
  }

  if (resolution.bonusAwarded > 0) {
    return {
      kind: 'bonus',
      kicker: 'Bonus drop',
      value: `+${resolution.totalPayout} TOKENS`,
      caption: resolution.statusMessage,
    };
  }

  if (resolution.outcome.payout > 0) {
    return {
      kind: 'win',
      kicker: 'Win',
      value: `+${resolution.outcome.payout} TOKENS`,
      caption: resolution.statusMessage,
    };
  }

  if (resolution.pityRefillAwarded > 0) {
    return {
      kind: 'bonus',
      kicker: 'Comeback',
      value: `+${resolution.pityRefillAwarded} TOKENS`,
      caption: resolution.statusMessage,
    };
  }

  return {
    kind: 'loss',
    kicker: 'Miss',
    value: 'NO MATCH',
    caption: resolution.statusMessage,
  };
}

/**
 * Create the explicit result display for the cash-out action.
 *
 * @param {import('./game-logic.js').CashOutResolution} resolution
 * @returns {{ kind: string, kicker: string, value: string, caption: string }}
 */
function getResultStateForCashOut(resolution) {
  if (resolution.tokensRemoved === 0) {
    return {
      kind: 'ready',
      kicker: 'Wallet empty',
      value: 'NOTHING TO TRADE',
      caption: resolution.statusMessage,
    };
  }

  return {
    kind: 'cashout',
    kicker: 'Slides acquired',
    value: `-${resolution.tokensRemoved} TOKENS`,
    caption: resolution.statusMessage,
  };
}

/**
 * Show the large animated result card.
 *
 * @param {AppElements} elements
 * @param {{ kind: string, kicker: string, value: string, caption: string }} state
 * @param {boolean} shouldAnimate
 * @returns {void}
 */
function showResultState(elements, state, shouldAnimate) {
  elements.resultBurst.className = `result-burst ${state.kind}`;
  elements.resultKicker.textContent = state.kicker;
  elements.resultValue.textContent = state.value;
  elements.resultCaption.textContent = state.caption;

  if (!shouldAnimate) {
    return;
  }

  elements.resultBurst.classList.remove('is-animating');
  void elements.resultBurst.offsetWidth;
  elements.resultBurst.classList.add('is-animating');
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
 * Apply the selected visual theme and persist it.
 *
 * @param {string} themeName
 * @param {AppElements} elements
 * @returns {void}
 */
function applyTheme(themeName, elements) {
  const safeTheme = AVAILABLE_THEMES.includes(themeName) ? themeName : AVAILABLE_THEMES[0];
  document.body.dataset.theme = safeTheme;
  persistTheme(safeTheme);

  elements.themeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.themeOption === safeTheme);
  });
}

/**
 * Read the previously selected theme if available.
 *
 * @returns {string}
 */
function loadStoredTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return AVAILABLE_THEMES.includes(storedTheme || '') ? storedTheme : AVAILABLE_THEMES[0];
  } catch {
    return AVAILABLE_THEMES[0];
  }
}

/**
 * Save the theme selection without breaking the app if storage is unavailable.
 *
 * @param {string} themeName
 * @returns {void}
 */
function persistTheme(themeName) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeName);
  } catch {
    // Ignore storage failures and keep the in-memory theme.
  }
}

/**
 * Collect the theme picker buttons.
 *
 * @returns {HTMLButtonElement[]}
 */
function getThemeButtons() {
  return Array.from(document.querySelectorAll('[data-theme-option]')).filter(
    (element) => element instanceof HTMLButtonElement
  );
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
