import {
  DEFAULT_GAME_CONFIG,
  canAffordSpin,
  createInitialGameState,
  finishSpin,
  getMoodText,
  resolveCashOut,
  startSpin,
} from './game-logic.js';
import { GAME_MODES, getGameMode } from './game-modes.js';

const REEL_TICK_INTERVAL_MS = 90;
const TOAST_DURATION_MS = 1800;
const PANEL_EFFECT_DURATION_MS = 550;
const RESULT_OVERLAY_DURATION_MS = 2200;
const HELP_MODAL_AUTO_CLOSE_MS = 16000;
const THEME_STORAGE_KEY = 'lucky-spin-theme';
const MODE_STORAGE_KEY = 'lucky-spin-mode';
const VOLUME_STORAGE_KEY = 'lucky-spin-volume';
const DEFAULT_VOLUME = 0.35;

const UNIVERSAL_SYMBOLS = Object.freeze([
  { key: 'CHERRY', label: 'Cherry', icon: '\u{1F352}' },
  { key: 'DIAMOND', label: 'Diamond', icon: '\u{1F48E}' },
  { key: 'LUCKY7', label: 'Lucky 7', icon: '7\uFE0F\u20E3' },
]);

const THEME_AUDIO_LIBRARY = Object.freeze({
  festival: {
    baseFrequency: 392,
    scale: [0, 4, 7, 12],
    waveType: 'triangle',
    accentWaveType: 'sine',
    ambientMotifs: [
      [0, 4, 7, 9, 12, 9, 7, 4],
      [0, 2, 5, 7, 9, 7, 5, 2],
      [0, 4, 7, 11, 12, 11, 7, 4],
    ],
  },
  riviera: {
    baseFrequency: 330,
    scale: [0, 3, 7, 10],
    waveType: 'sine',
    accentWaveType: 'triangle',
    ambientMotifs: [
      [0, 3, 7, 10, 12, 10, 7, 3],
      [0, 5, 7, 10, 12, 10, 7, 5],
      [0, 2, 5, 7, 9, 7, 5, 2],
    ],
  },
  oasis: {
    baseFrequency: 294,
    scale: [0, 2, 5, 9],
    waveType: 'triangle',
    accentWaveType: 'sine',
    ambientMotifs: [
      [0, 2, 5, 9, 12, 9, 5, 2],
      [0, 3, 7, 10, 12, 10, 7, 3],
      [0, 5, 7, 9, 12, 14, 12, 9],
    ],
  },
});

const THEME_LIBRARY = Object.freeze({
  festival: {
    key: 'festival',
    buttonLabel: 'Lantern Festival',
    machineTitle: 'Lantern Festival Spinner',
    machineEyebrow: 'Festival lights',
    flavorText: 'Lanterns, koi, drums, and a lucky-gate jackpot.',
    guideText: 'Festival charms fill the reels. Build the vault over 24 spins, but MASK and BURST combinations can knock your climb backwards.',
    symbols: [
      ...UNIVERSAL_SYMBOLS,
      { key: 'LANTERN', label: 'Lantern', icon: '\u{1F3EE}' },
      { key: 'KOI', label: 'Koi', icon: '\u{1F38F}' },
      { key: 'DRUM', label: 'Drum', icon: '\u{1F941}' },
      { key: 'FAN', label: 'Fan', icon: '\u{1FAAD}' },
      { key: 'MASK', label: 'Mask', icon: '\u{1F3AD}' },
      { key: 'BURST', label: 'Burst', icon: '\u{1F4A5}' },
      { key: 'TORII', label: 'Gate', icon: '\u26E9\uFE0F' },
      { key: 'MOCHI', label: 'Mochi', icon: '\u{1F361}' },
      { key: 'LUCK', label: 'Lucky', icon: '\u{1F9E7}' },
    ],
    jackpotSymbol: 'LANTERN',
    progressDropSymbol: 'MASK',
    secondaryProgressDropSymbol: 'BURST',
    progressResetSymbol: 'MASK',
  },
  riviera: {
    key: 'riviera',
    buttonLabel: 'Riviera Postcards',
    machineTitle: 'Riviera Postcard Spinner',
    machineEyebrow: 'Coastal table',
    flavorText: 'Sun-washed tiles, olive branches, and postcard-blue water.',
    guideText: 'Coastal icons fill this cabinet. The vault is rich, but WAVE and STORM combinations can wash progress away before it pays out.',
    symbols: [
      ...UNIVERSAL_SYMBOLS,
      { key: 'OLIVE', label: 'Olive', icon: '\u{1FAD2}' },
      { key: 'TILE', label: 'Tile', icon: '\u{1F537}' },
      { key: 'LEMON', label: 'Lemon', icon: '\u{1F34B}' },
      { key: 'WAVE', label: 'Wave', icon: '\u{1F30A}' },
      { key: 'STORM', label: 'Storm', icon: '\u26C8\uFE0F' },
      { key: 'SUN', label: 'Sun', icon: '\u2600\uFE0F' },
      { key: 'SHELL', label: 'Shell', icon: '\u{1F41A}' },
      { key: 'SAIL', label: 'Sail', icon: '\u26F5' },
      { key: 'COAST', label: 'Coast', icon: '\u{1F3D6}\uFE0F' },
    ],
    jackpotSymbol: 'SUN',
    progressDropSymbol: 'WAVE',
    secondaryProgressDropSymbol: 'STORM',
    progressResetSymbol: 'WAVE',
  },
  oasis: {
    key: 'oasis',
    buttonLabel: 'Oasis Caravan',
    machineTitle: 'Oasis Caravan Spinner',
    machineEyebrow: 'Desert route',
    flavorText: 'Palm shade, lamp glow, and a vault hidden beyond the dunes.',
    guideText: 'Desert icons and warm golds shape this machine. The vault is huge, but MOON and DUST combinations can cut or wipe your progress.',
    symbols: [
      ...UNIVERSAL_SYMBOLS,
      { key: 'PALM', label: 'Palm', icon: '\u{1F334}' },
      { key: 'DUNE', label: 'Dune', icon: '\u{1F3DC}\uFE0F' },
      { key: 'LAMP', label: 'Lamp', icon: '\u{1FA94}' },
      { key: 'STAR', label: 'Star', icon: '\u2B50' },
      { key: 'OASIS', label: 'Spring', icon: '\u{1F4A7}' },
      { key: 'FALCON', label: 'Falcon', icon: '\u{1F985}' },
      { key: 'DUST', label: 'Dust', icon: '\u{1F4A8}' },
      { key: 'GEM', label: 'Gem', icon: '\u{1F48E}' },
      { key: 'MOON', label: 'Moon', icon: '\u{1F319}' },
    ],
    jackpotSymbol: 'LAMP',
    progressDropSymbol: 'MOON',
    secondaryProgressDropSymbol: 'DUST',
    progressResetSymbol: 'MOON',
  },
});

const AVAILABLE_THEMES = Object.freeze(Object.keys(THEME_LIBRARY));
const audioEngine = createAudioEngine();

/** @typedef {{ key: string, label: string, icon: string }} ThemeSymbol */
/** @typedef {typeof THEME_LIBRARY[keyof typeof THEME_LIBRARY]} ThemeDefinition */

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
 * @property {HTMLElement} machineTitle
 * @property {HTMLElement} machineEyebrow
 * @property {HTMLElement} vaultPrize
 * @property {HTMLElement} themeFlavor
 * @property {HTMLElement} modeFlavor
 * @property {HTMLElement} guideText
 * @property {HTMLElement} jackpotRule
 * @property {HTMLElement} bonusRule
 * @property {HTMLElement} setbackRule
 * @property {HTMLElement} burstRule
 * @property {HTMLElement} resetRule
 * @property {HTMLElement} helpLauncher
 * @property {HTMLElement} reels
 * @property {HTMLElement[]} reelWindows
 * @property {HTMLButtonElement[]} modeButtons
 * @property {HTMLElement} helpModal
 * @property {HTMLElement} helpMinimizeButton
 * @property {HTMLElement} helpCloseButton
 * @property {HTMLInputElement} volumeSlider
 * @property {HTMLElement} volumeValue
 * @property {HTMLElement} resultOverlay
 * @property {HTMLElement} resultOverlayCard
 * @property {HTMLElement} resultKicker
 * @property {HTMLElement} resultValue
 * @property {HTMLElement} resultCaption
 * @property {HTMLButtonElement[]} themeButtons
 * @property {ThemeSymbol[]} symbolPool
 */

let gameState = createInitialGameState();
/** @type {ThemeDefinition} */
let activeTheme = THEME_LIBRARY.festival;
let activeGameMode = getGameMode(loadStoredMode());
let overlayTimeoutId = null;
let helpTimeoutId = null;

if (typeof document !== 'undefined') {
  initializeApp();
}

export { clampVolume, loadStoredMode, loadStoredTheme, loadStoredVolume };

/**
 * Initialize the slot machine app and wire the first render.
 *
 * @returns {void}
 */
function initializeApp() {
  try {
    const elements = createAppElements();
    const storedVolume = loadStoredVolume();
    audioEngine.setVolume(storedVolume);
    applyTheme(loadStoredTheme(), elements, { playAudio: false });
    applyGameMode(loadStoredMode(), elements, { playAudio: false });
    syncVolumeUI(elements, storedVolume);
    attachEventListeners(elements);
    renderGameState(gameState, elements);
    openHelpModal(elements, { autoClose: true });
  } catch (error) {
    console.error('Unable to initialize the slot machine UI.', error);
  }
}

/**
 * Collect the required DOM nodes for the app shell.
 *
 * @returns {void}
 */
function createAppElements() {
  return {
    reelSymbols: [
      getRequiredHtmlElement('#reel0'),
      getRequiredHtmlElement('#reel1'),
      getRequiredHtmlElement('#reel2'),
      getRequiredHtmlElement('#reel3'),
      getRequiredHtmlElement('#reel4'),
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
    machineTitle: getRequiredHtmlElement('#machineTitle'),
    machineEyebrow: getRequiredHtmlElement('#machineEyebrow'),
    vaultPrize: getRequiredHtmlElement('#vaultPrize'),
    themeFlavor: getRequiredHtmlElement('#themeFlavor'),
    modeFlavor: getRequiredHtmlElement('#modeFlavor'),
    guideText: getRequiredHtmlElement('#guideText'),
    jackpotRule: getRequiredHtmlElement('#jackpotRule'),
    bonusRule: getRequiredHtmlElement('#bonusRule'),
    setbackRule: getRequiredHtmlElement('#setbackRule'),
    burstRule: getRequiredHtmlElement('#burstRule'),
    resetRule: getRequiredHtmlElement('#resetRule'),
    helpLauncher: getRequiredButton('#helpLauncher'),
    helpModal: getRequiredHtmlElement('#helpModal'),
    helpMinimizeButton: getRequiredButton('#helpMinimizeButton'),
    helpCloseButton: getRequiredButton('#helpCloseButton'),
    volumeSlider: getRequiredRangeInput('#volumeSlider'),
    volumeValue: getRequiredHtmlElement('#volumeValue'),
    resultOverlay: getRequiredHtmlElement('#resultOverlay'),
    resultOverlayCard: getRequiredHtmlElement('#resultOverlayCard'),
    resultKicker: getRequiredHtmlElement('#resultKicker'),
    resultValue: getRequiredHtmlElement('#resultValue'),
    resultCaption: getRequiredHtmlElement('#resultCaption'),
    reels: getRequiredHtmlElement('.reels'),
    reelWindows: Array.from(document.querySelectorAll('.reel-window')).filter((element) => element instanceof HTMLElement),
    themeButtons: getThemeButtons(),
    modeButtons: getModeButtons(),
    symbolPool: [...activeTheme.symbols],
  };
}

/**
 * Attach UI event handlers for spins, modes, themes, and settings.
 *
 * @param {*} elements
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
      if (gameState.isSpinning) {
        return;
      }

      hideResultOverlay(elements);
      applyTheme(button.dataset.themeOption || AVAILABLE_THEMES[0], elements, { playAudio: true });
    });
  });

  elements.modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (gameState.isSpinning) {
        return;
      }

      hideResultOverlay(elements);
      applyGameMode(button.dataset.modeOption || GAME_MODES.classic.key, elements, { playAudio: true });
    });
  });

  elements.helpLauncher.addEventListener('click', () => {
    toggleHelpModal(elements);
  });

  elements.helpCloseButton.addEventListener('click', () => {
    closeHelpModal(elements);
  });

  elements.helpMinimizeButton.addEventListener('click', () => {
    toggleHelpModalMinimized(elements);
  });

  elements.helpModal.addEventListener('click', (event) => {
    if (event.target instanceof HTMLElement && event.target.dataset.helpClose === 'true') {
      closeHelpModal(elements);
    }
  });

  elements.volumeSlider.addEventListener('input', () => {
    const volume = Number(elements.volumeSlider.value) / 100;
    audioEngine.setVolume(volume);
    persistVolume(volume);
    syncVolumeUI(elements, volume);
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !elements.helpModal.hidden) {
      closeHelpModal(elements);
    }
  });
}



/**
 * Render the current game state into the visible UI.
 *
 * @param {*} state
 * @param {*} elements
 * @returns {void}
 */
function renderGameState(state, elements) {
  const gameConfig = getActiveGameConfig();

  elements.walletCount.textContent = String(state.wallet);
  elements.spentCount.textContent = String(state.spent);
  elements.wonCount.textContent = String(state.won);
  elements.streakCount.textContent = `${state.streak} ${state.streak === 1 ? 'win' : 'wins'}`;
  elements.spinCount.textContent = String(state.spins);
  elements.lastPayout.textContent = `${state.lastPayout} tokens`;
  elements.moodText.textContent = getMoodText(state, gameConfig);
  elements.feedbackPill.textContent = state.feedbackText;
  elements.feedbackPill.className = `feedback-pill ${state.feedbackKind}`;
  elements.bonusText.textContent = `${state.bonusProgress} / ${gameConfig.bonusThreshold} spins`;
  elements.bonusFill.style.width = `${(state.bonusProgress / gameConfig.bonusThreshold) * 100}%`;
  updateBonusMeterState(state, elements, gameConfig);
  elements.spinButton.disabled = state.isSpinning || !canAffordSpin(state.wallet, gameConfig);
  elements.cashOutButton.disabled = state.isSpinning;
}

/**
 * Run the full spin flow after the spin button is clicked.
 *
 * @param {*} elements
 * @returns {void}
 */
async function handleSpinClick(elements) {
  const gameConfig = getActiveGameConfig();

  if (gameState.isSpinning || !canAffordSpin(gameState.wallet, gameConfig)) {
    return;
  }

  const previousState = gameState;
  hideResultOverlay(elements);
  closeHelpModal(elements);

  try {
    audioEngine.unlock();
    audioEngine.playSpinStart(activeTheme.key);
    const paidSpinState = startSpin(gameState, gameConfig);

    gameState = {
      ...paidSpinState,
      isSpinning: true,
      feedbackKind: 'spinning',
      feedbackText: 'Spinning...',
    };

    setStatusMessage(elements, 'The reels are warming up.');
    renderGameState(gameState, elements);

    const reelSymbols = await spinAllReels(elements);
    const resolution = finishSpin(gameState, reelSymbols, gameConfig);

    gameState = {
      ...resolution.nextState,
      feedbackKind: getFeedbackKindForSpin(resolution),
      feedbackText: getFeedbackTextForSpin(resolution),
    };

    playSpinEffects(resolution, elements);
    audioEngine.playOutcome(resolution, activeTheme.key);
    setStatusMessage(elements, resolution.statusMessage);
    renderGameState(gameState, elements);
    showResultOverlay(elements, getResultStateForSpin(resolution, gameConfig));
  } catch (error) {
    console.error('The spin action failed.', error);
    gameState = {
      ...previousState,
      isSpinning: false,
      feedbackKind: 'loss',
      feedbackText: 'Spin failed',
    };
    setStatusMessage(elements, 'The machine jammed for a second. Please try again.');
    renderGameState(gameState, elements);
  }
}

/**
 * Resolve the token-to-slides cash-out action.
 *
 * @param {*} elements
 * @returns {void}
 */
function handleCashOutClick(elements) {
  if (gameState.isSpinning) {
    return;
  }

  closeHelpModal(elements);
  const resolution = resolveCashOut(gameState, getActiveGameConfig());

  gameState = {
    ...resolution.nextState,
    feedbackKind: resolution.tokensRemoved > 0 ? 'loss' : 'ready',
    feedbackText: resolution.tokensRemoved > 0 ? 'Slides acquired' : 'Wallet empty',
  };

  if (resolution.tokensRemoved > 0) {
    flashMachinePanel(elements.machinePanel, 'loss-flash');
    triggerVibration(20);
    queueToast(elements, `-${resolution.tokensRemoved} tokens for slides`);
    audioEngine.unlock();
    audioEngine.playCashOut(activeTheme.key, resolution.tokensRemoved);
  }

  if (resolution.pityRefillAwarded > 0) {
    queueToast(elements, `Refill +${resolution.pityRefillAwarded} tokens`);
  }

  hideResultOverlay(elements);
  setStatusMessage(elements, resolution.statusMessage);
  renderGameState(gameState, elements);
}

/**
 * Spin the visible reels in parallel and wait for them to finish.
 *
 * @param {*} elements
 * @returns {void}
 */
function spinAllReels(elements) {
  const visibleReels = elements.reelSymbols.slice(0, activeGameMode.reelCount);

  return Promise.all(
    visibleReels.map((element, index) =>
      animateReelSymbol(element, activeGameMode.reelSpinDurations[index], elements.symbolPool, index)
    )
  );
}

/**
 * Animate one reel until its stop time and return the final symbol key.
 *
 * @param {*} reelElement
 * @param {*} durationMs
 * @param {*} symbolPool
 * @param {*} reelIndex
 * @returns {void}
 */
function animateReelSymbol(reelElement, durationMs, symbolPool, reelIndex) {
  const reelWindow = reelElement.closest('.reel-window');

  reelElement.classList.add('spinning');
  reelWindow?.classList.add('is-spinning');

  return new Promise((resolve) => {
    const startTime = performance.now();
    let nextTickAt = startTime;
    let stopped = false;

    const easeOutCubic = (value) => 1 - (1 - value) ** 3;

    const finishSpin = () => {
      if (stopped) {
        return;
      }

      stopped = true;
      reelElement.classList.remove('spinning');
      reelWindow?.classList.remove('is-spinning');

      const finalSymbol = pickRandomSymbol(symbolPool);
      renderReelSymbol(reelElement, finalSymbol);
      audioEngine.playReelStop(activeTheme.key, reelIndex);
      resolve(finalSymbol.key);
    };

    const step = (now) => {
      if (stopped) {
        return;
      }

      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      if (now >= nextTickAt) {
        renderReelSymbol(reelElement, pickRandomSymbol(symbolPool));

        const fastTick = 52;
        const slowTick = 190;
        nextTickAt = now + fastTick + (slowTick - fastTick) * easeOutCubic(progress);
      }

      if (progress >= 1) {
        finishSpin();
        return;
      }

      window.requestAnimationFrame(step);
    };

    window.requestAnimationFrame(step);
    window.setTimeout(finishSpin, durationMs);
  });
}

/**
 * Play UI feedback after a spin resolution is known.
 *
 * @param {*} resolution
 * @param {*} elements
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
    queueToast(elements, `Vault +${resolution.bonusAwarded} tokens`);
  }

  if (resolution.progressLost > 0) {
    queueToast(elements, `Vault -${resolution.progressLost} progress`);
  }

  if (resolution.pityRefillAwarded > 0) {
    queueToast(elements, `Comeback +${resolution.pityRefillAwarded} tokens`);
  }
}

/**
 * Update the vault progress meter styling and copy.
 *
 * @param {*} state
 * @param {*} elements
 * @param {*} gameConfig
 * @returns {void}
 */
function updateBonusMeterState(state, elements, gameConfig) {
  const remainingSpins = Math.max(0, gameConfig.bonusThreshold - state.bonusProgress);
  elements.bonusCluster.classList.remove('warm', 'heated', 'imminent');

  if (remainingSpins <= 1) {
    elements.bonusCluster.classList.add('imminent');
  } else if (remainingSpins <= 4) {
    elements.bonusCluster.classList.add('heated');
  } else if (remainingSpins <= 8) {
    elements.bonusCluster.classList.add('warm');
  }

  elements.bonusAlert.textContent = getBonusAlertText(state, remainingSpins, gameConfig);
}

/**
 * Build the bonus alert message for the current progress state.
 *
 * @param {*} state
 * @param {*} remainingSpins
 * @param {*} gameConfig
 * @returns {void}
 */
function getBonusAlertText(state, remainingSpins, gameConfig) {
  if (remainingSpins === 1) {
    return `One more spin opens the ${gameConfig.bonusReward}-token vault.`;
  }

  if (remainingSpins <= 4) {
    return `${remainingSpins} spins left. One bad combo could still wreck the climb.`;
  }

  if (remainingSpins <= 8) {
    return `${remainingSpins} spins left. The vault is finally in sight.`;
  }

  if (state.spins === 0 || state.bonusProgress > 0) {
    return `${remainingSpins} spins until the ${gameConfig.bonusReward}-token vault opens.`;
  }

  return `Vault reset. ${gameConfig.bonusThreshold} spins until the next ${gameConfig.bonusReward}-token payout.`;
}

/**
 * Map a spin resolution to a feedback pill state.
 *
 * @param {*} resolution
 * @returns {void}
 */
function getFeedbackKindForSpin(resolution) {
  if (resolution.bonusAwarded > 0) {
    return 'bonus';
  }

  return resolution.outcome.kind;
}

/**
 * Build the short feedback label for a spin resolution.
 *
 * @param {*} resolution
 * @returns {void}
 */
function getFeedbackTextForSpin(resolution) {
  if (resolution.bonusAwarded > 0) {
    return `Vault +${resolution.bonusAwarded}`;
  }

  if (resolution.outcome.payout > 0) {
    return `Win +${resolution.outcome.payout}`;
  }

  if (resolution.progressLost > 0 || resolution.outcome.resetsProgress) {
    return 'Progress hit';
  }

  return 'Try again';
}

/**
 * Build the temporary result overlay state.
 *
 * @param {*} resolution
 * @param {*} gameConfig
 * @returns {void}
 */
function getResultStateForSpin(resolution, gameConfig) {
  if (resolution.outcome.payout === gameConfig.jackpotPayout) {
    return {
      kind: 'jackpot',
      kicker: `${activeTheme.jackpotSymbol} jackpot`,
      value: `+${resolution.outcome.payout} TOKENS`,
      caption: resolution.statusMessage,
    };
  }

  if (resolution.bonusAwarded > 0) {
    return {
      kind: 'bonus',
      kicker: 'Vault opened',
      value: `+${resolution.totalPayout} TOKENS`,
      caption: resolution.statusMessage,
    };
  }

  if (resolution.outcome.resetsProgress) {
    return {
      kind: 'loss',
      kicker: 'Vault reset',
      value: `${activeTheme.progressResetSymbol} TRIO`,
      caption: resolution.statusMessage,
    };
  }

  if (resolution.progressLost > 0) {
    return {
      kind: 'loss',
      kicker: 'Progress hit',
      value: `-${resolution.progressLost} STEPS`,
      caption: resolution.statusMessage,
    };
  }

  if (resolution.outcome.payout > 0) {
    return {
      kind: 'win',
      kicker: activeTheme.buttonLabel,
      value: `+${resolution.outcome.payout} TOKENS`,
      caption: resolution.statusMessage,
    };
  }

  return {
    kind: 'loss',
    kicker: activeTheme.buttonLabel,
    value: 'NO MATCH',
    caption: resolution.statusMessage,
  };
}

/**
 * Show the temporary result overlay and auto-dismiss it.
 *
 * @param {*} elements
 * @param {*} state
 * @returns {void}
 */
function showResultOverlay(elements, state) {
  if (overlayTimeoutId) {
    window.clearTimeout(overlayTimeoutId);
  }

  elements.resultOverlay.classList.add('visible');
  elements.resultOverlayCard.className = `result-overlay-card ${state.kind}`;
  elements.resultKicker.textContent = state.kicker;
  elements.resultValue.textContent = state.value;
  elements.resultCaption.textContent = state.caption;

  overlayTimeoutId = window.setTimeout(() => {
    hideResultOverlay(elements);
  }, RESULT_OVERLAY_DURATION_MS);
}

/**
 * Hide the temporary result overlay immediately.
 *
 * @param {*} elements
 * @returns {void}
 */
function hideResultOverlay(elements) {
  if (overlayTimeoutId) {
    window.clearTimeout(overlayTimeoutId);
    overlayTimeoutId = null;
  }

  elements.resultOverlay.classList.remove('visible');
}

/**
 * Update the main status line text.
 *
 * @param {*} elements
 * @param {*} message
 * @returns {void}
 */
function setStatusMessage(elements, message) {
  elements.statusLine.textContent = message;
}

/**
 * Queue a short toast message in the corner stack.
 *
 * @param {*} elements
 * @param {*} message
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
 * Flash the cabinet panel for win and loss feedback.
 *
 * @param {*} panel
 * @param {*} effectClass
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
 * Trigger a vibration pattern when the device supports it.
 *
 * @param {*} pattern
 * @returns {void}
 */
function triggerVibration(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

/**
 * Render a single reel symbol and its accessible label.
 *
 * @param {*} element
 * @param {*} symbol
 * @returns {void}
 */
function renderReelSymbol(element, symbol) {
  element.setAttribute('aria-label', symbol.label);
  element.innerHTML = `<span class="symbol-icon" aria-hidden="true">${symbol.icon}</span>`;
}

/**
 * Pick a random symbol from the current symbol pool.
 *
 * @param {*} symbolPool
 * @returns {void}
 */
function pickRandomSymbol(symbolPool) {
  const randomIndex = Math.floor(Math.random() * symbolPool.length);
  return symbolPool[randomIndex];
}

/**
 * Apply a theme, update the cabinet copy, and sync the symbol pool.
 *
 * @param {*} themeName
 * @param {*} elements
 * @returns {void}
 */
function applyTheme(themeName, elements, options = {}) {
  const safeTheme = THEME_LIBRARY[themeName] || THEME_LIBRARY[AVAILABLE_THEMES[0]];
  const gameConfig = getConfiguredThemeGameConfig(safeTheme);

  activeTheme = safeTheme;
  audioEngine.setTheme(safeTheme.key);
  elements.symbolPool = [...safeTheme.symbols];
  document.body.dataset.theme = safeTheme.key;
  persistTheme(safeTheme.key);

  elements.machineTitle.textContent = safeTheme.machineTitle;
  elements.machineEyebrow.textContent = safeTheme.machineEyebrow;
  elements.themeFlavor.textContent = safeTheme.flavorText;
  elements.guideText.textContent = safeTheme.guideText;
  elements.vaultPrize.textContent = `${gameConfig.bonusReward} tokens`;
  elements.jackpotRule.innerHTML = createRiskLine(getThemeSymbol(safeTheme, safeTheme.jackpotSymbol)?.icon || '\u{1F3B0}', `Three ${safeTheme.jackpotSymbol} icons: jackpot +${gameConfig.jackpotPayout} tokens`);
  elements.bonusRule.innerHTML = createRiskLine('\u{1F48E}', `Every ${gameConfig.bonusThreshold} spins: vault +${gameConfig.bonusReward} tokens`);
  elements.setbackRule.innerHTML = createRiskLine(getThemeSymbol(safeTheme, safeTheme.progressDropSymbol)?.icon || '\u26A0\uFE0F', `Pair of ${safeTheme.progressDropSymbol} icons: lose ${gameConfig.progressDropAmount} progress`);
  elements.burstRule.innerHTML = createRiskLine(getThemeSymbol(safeTheme, safeTheme.secondaryProgressDropSymbol)?.icon || '\u{1F4A5}', `Pair of ${safeTheme.secondaryProgressDropSymbol} icons: lose ${gameConfig.secondaryProgressDropAmount} progress`);
  elements.resetRule.innerHTML = createRiskLine(getThemeSymbol(safeTheme, safeTheme.progressResetSymbol)?.icon || '\u{1F4A5}', `Triple ${safeTheme.progressResetSymbol} icons: reset the vault`);

  elements.themeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.themeOption === safeTheme.key);
  });

  syncReelSymbolsToTheme(elements, safeTheme.symbols);
  renderGameState(gameState, elements);

  if (options.playAudio) {
    audioEngine.unlock();
    audioEngine.playThemeChange(safeTheme.key);
  }

  syncVolumeUI(elements, audioEngine.getVolume());
}

/**
 * Apply the active game mode and persist the selection.
 *
 * @param {*} modeName
 * @param {*} elements
 * @returns {void}
 */
function applyGameMode(modeName, elements, options = {}) {
  const safeMode = getGameMode(modeName);

  activeGameMode = safeMode;
  persistMode(safeMode.key);
  document.body.dataset.mode = safeMode.key;
  syncGameModeUI(elements, safeMode);

  if (options.playAudio) {
    audioEngine.unlock();
    audioEngine.playThemeChange(activeTheme.key);
  }

  renderGameState(gameState, elements);
}

/**
 * Return the merged config for the active theme and mode.
 *
 * @returns {void}
 */
function getActiveGameConfig() {
  return getConfiguredThemeGameConfig(activeTheme, activeGameMode);
}

/**
 * Merge the base config with theme and mode overrides.
 *
 * @param {*} theme
 * @returns {void}
 */
function getConfiguredThemeGameConfig(theme, mode = activeGameMode) {
  return {
    ...DEFAULT_GAME_CONFIG,
    reelCount: mode.reelCount,
    jackpotMatchCount: mode.jackpotMatchCount,
    jackpotSymbol: theme.jackpotSymbol,
    progressDropSymbol: theme.progressDropSymbol,
    secondaryProgressDropSymbol: theme.secondaryProgressDropSymbol,
    secondaryProgressDropAmount: theme.secondaryProgressDropAmount,
    progressResetSymbol: theme.progressResetSymbol,
  };
}

/**
 * Find a symbol definition for the requested theme symbol key.
 *
 * @param {*} theme
 * @param {*} symbolKey
 * @returns {void}
 */
function getThemeSymbol(theme, symbolKey) {
  return theme.symbols.find((symbol) => symbol.key === symbolKey);
}

/**
 * Build a risk-board row using themed icon and copy HTML.
 *
 * @param {*} icon
 * @param {*} text
 * @returns {void}
 */
function createRiskLine(icon, text) {
  return `<span class="rule-icon" aria-hidden="true">${icon}</span><span class="rule-copy">${text}</span>`;
}

/**
 * Seed the reels with symbols from the active theme.
 *
 * @param {*} elements
 * @param {*} symbols
 * @returns {void}
 */
function syncReelSymbolsToTheme(elements, symbols) {
  elements.reelSymbols.forEach((element, index) => {
    renderReelSymbol(element, symbols[index % symbols.length]);
  });
}

/**
 * Update mode-specific UI state and visible reel count.
 *
 * @param {*} elements
 * @param {*} mode
 * @returns {void}
 */
function syncGameModeUI(elements, mode) {
  elements.reels.dataset.reelCount = String(mode.reelCount);
  elements.reels.dataset.mode = mode.key;
  elements.reels.style.removeProperty('grid-template-columns');

  elements.reelWindows.forEach((windowElement, index) => {
    windowElement.classList.toggle('is-hidden', index >= mode.reelCount);
  });

  elements.modeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.modeOption === mode.key);
  });

  elements.modeFlavor.textContent = mode.description;
}

/**
 * Load the saved theme or fall back to the default theme.
 *
 * @returns {void}
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
 * Load the saved game mode or fall back to classic.
 *
 * @returns {void}
 */
function loadStoredMode() {
  try {
    const storedMode = window.localStorage.getItem(MODE_STORAGE_KEY);
    return getGameMode(storedMode).key;
  } catch {
    return GAME_MODES.classic.key;
  }
}

/**
 * Load the saved volume or fall back to the default level.
 *
 * @returns {void}
 */
function loadStoredVolume() {
  try {
    const storedVolume = Number(window.localStorage.getItem(VOLUME_STORAGE_KEY));
    return Number.isFinite(storedVolume) ? clampVolume(storedVolume) : DEFAULT_VOLUME;
  } catch {
    return DEFAULT_VOLUME;
  }
}

/**
 * Persist the selected theme to local storage.
 *
 * @param {*} themeName
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
 * Persist the selected mode to local storage.
 *
 * @param {*} modeName
 * @returns {void}
 */
function persistMode(modeName) {
  try {
    window.localStorage.setItem(MODE_STORAGE_KEY, modeName);
  } catch {
    // Ignore storage failures and keep the in-memory mode.
  }
}

/**
 * Persist the selected volume to local storage.
 *
 * @param {*} volume
 * @returns {void}
 */
function persistVolume(volume) {
  try {
    window.localStorage.setItem(VOLUME_STORAGE_KEY, String(volume));
  } catch {
    // Ignore storage failures and keep the in-memory volume.
  }
}

/**
 * Sync the slider and readout to the current volume.
 *
 * @param {*} elements
 * @param {*} volume
 * @returns {void}
 */
function syncVolumeUI(elements, volume) {
  const percentage = Math.round(clampVolume(volume) * 100);
  elements.volumeSlider.value = String(percentage);
  elements.volumeValue.textContent = `${percentage}%`;
}

/**
 * Clamp a volume value into the 0 to 1 range.
 *
 * @param {*} volume
 * @returns {void}
 */
function clampVolume(volume) {
  return Math.min(1, Math.max(0, volume));
}

/**
 * Collect the theme selection buttons from the DOM.
 *
 * @returns {void}
 */
function getThemeButtons() {
  return Array.from(document.querySelectorAll('[data-theme-option]')).filter(
    (element) => element instanceof HTMLButtonElement
  );
}

/**
 * Collect the game mode selection buttons from the DOM.
 *
 * @returns {void}
 */
function getModeButtons() {
  return Array.from(document.querySelectorAll('[data-mode-option]')).filter(
    (element) => element instanceof HTMLButtonElement
  );
}

/**
 * Look up a required HTML element and throw if it is missing.
 *
 * @param {*} selector
 * @returns {void}
 */
function getRequiredHtmlElement(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

/**
 * Look up a required button element and throw if it is missing.
 *
 * @param {*} selector
 * @returns {void}
 */
function getRequiredButton(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Missing required button: ${selector}`);
  }

  return element;
}

/**
 * Look up a required range input and throw if it is missing.
 *
 * @param {*} selector
 * @returns {void}
 */
function getRequiredRangeInput(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLInputElement)) {
    throw new Error(`Missing required input: ${selector}`);
  }

  return element;
}

/**
 * Clear any pending auto-close timer for the guide modal.
 *
 * @returns {void}
 */
function clearHelpTimer() {
  if (helpTimeoutId) {
    window.clearTimeout(helpTimeoutId);
    helpTimeoutId = null;
  }
}

/**
 * Open the guide modal and optionally arm the auto-close timer.
 *
 * @param {*} elements
 * @returns {void}
 */
function openHelpModal(elements, options = {}) {
  clearHelpTimer();

  elements.helpModal.hidden = false;
  elements.helpModal.classList.remove('is-minimized');
  elements.helpMinimizeButton.textContent = 'Minimize';
  elements.helpLauncher.setAttribute('aria-expanded', 'true');

  if (options.autoClose !== false) {
    helpTimeoutId = window.setTimeout(() => {
      closeHelpModal(elements);
    }, HELP_MODAL_AUTO_CLOSE_MS);
  }
}

/**
 * Close the guide modal and clear any pending timer.
 *
 * @param {*} elements
 * @returns {void}
 */
function closeHelpModal(elements) {
  clearHelpTimer();

  elements.helpModal.hidden = true;
  elements.helpModal.classList.remove('is-minimized');
  elements.helpMinimizeButton.textContent = 'Minimize';
  elements.helpLauncher.setAttribute('aria-expanded', 'false');
}

/**
 * Toggle the guide modal open or closed.
 *
 * @param {*} elements
 * @returns {void}
 */
function toggleHelpModal(elements) {
  if (elements.helpModal.hidden) {
    openHelpModal(elements, { autoClose: false });
    return;
  }

  closeHelpModal(elements);
}

/**
 * Toggle the guide modal between minimized and expanded states.
 *
 * @param {*} elements
 * @returns {void}
 */
function toggleHelpModalMinimized(elements) {
  if (elements.helpModal.hidden) {
    openHelpModal(elements);
    return;
  }

  const minimized = elements.helpModal.classList.toggle('is-minimized');
  elements.helpMinimizeButton.textContent = minimized ? 'Expand' : 'Minimize';
}

/**
 * Creates a lightweight theme-aware audio engine using the Web Audio API.
 * @returns {{
 *   unlock: () => void,
 *   setTheme: (themeKey: string) => void,
 *   playSpinStart: (themeKey: string) => void,
 *   playReelStop: (themeKey: string, reelIndex: number) => void,
 *   playOutcome: (resolution: { outcome: { payout: number, kind: string, resetsProgress?: boolean }, bonusAwarded: number, progressLost: number }, themeKey: string) => void,
 *   playCashOut: (themeKey: string, tokensRemoved: number) => void,
 *   playThemeChange: (themeKey: string) => void,
 * }}
 */
/**
 * Create the theme-aware Web Audio engine used by the cabinet.
 *
 * @returns {void}
 */
function createAudioEngine() {
  /** @type {AudioContext | null} */
  let context = null;
  /** @type {GainNode | null} */
  let masterGain = null;
  let themeKey = AVAILABLE_THEMES[0];
  let pendingVolume = DEFAULT_VOLUME;
  let ambientTimerId = null;
  let ambientThemeKey = null;
  let ambientPhraseIndex = 0;

  /**
 * Helper for ensure context.
 *
 * @returns {void}
 */
  function ensureContext() {
    if (typeof window.AudioContext === 'undefined' && typeof window.webkitAudioContext === 'undefined') {
      return null;
    }

    if (!context) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      context = new AudioCtor();
      masterGain = context.createGain();
      masterGain.gain.value = pendingVolume;
      masterGain.connect(context.destination);
    }

    return context;
  }

  /**
 * Helper for unlock.
 *
 * @returns {void}
 */
  function unlock() {
    const audioContext = ensureContext();

    if (!audioContext) {
      return;
    }

    if (audioContext.state !== 'running') {
      void audioContext.resume();
    }

    playAmbient(themeKey);
  }

  /**
 * Helper for set theme.
 *
 * @param {*} nextThemeKey
 * @returns {void}
 */
  function setTheme(nextThemeKey) {
    themeKey = THEME_AUDIO_LIBRARY[nextThemeKey] ? nextThemeKey : AVAILABLE_THEMES[0];
  }

  /**
 * Helper for set volume.
 *
 * @param {*} volume
 * @returns {void}
 */
  function setVolume(volume) {
    pendingVolume = clampVolume(volume);

    if (masterGain) {
      masterGain.gain.setTargetAtTime(pendingVolume, masterGain.context.currentTime, 0.02);
    }
  }

  /**
 * Helper for get volume.
 *
 * @returns {void}
 */
  function getVolume() {
    return pendingVolume;
  }

  /**
 * Helper for get profile.
 *
 * @returns {void}
 */
  function getProfile(nextThemeKey = themeKey) {
    return THEME_AUDIO_LIBRARY[nextThemeKey] || THEME_AUDIO_LIBRARY[AVAILABLE_THEMES[0]];
  }

  /**
 * Helper for semitone to frequency.
 *
 * @param {*} baseFrequency
 * @param {*} semitoneOffset
 * @returns {void}
 */
  function semitoneToFrequency(baseFrequency, semitoneOffset) {
    return baseFrequency * 2 ** (semitoneOffset / 12);
  }

  /**
 * Helper for play tone.
 *
 * @returns {void}
 */
  function playTone({
    frequency,
    waveType,
    duration,
    gain,
    delay = 0,
    detune = 0,
  }) {
    const audioContext = ensureContext();

    if (!audioContext) {
      return;
    }

    const osc = audioContext.createOscillator();
    const amp = audioContext.createGain();

    osc.type = waveType;
    osc.frequency.value = frequency;
    osc.detune.value = detune;
    amp.gain.value = 0;

    osc.connect(amp);
    amp.connect(masterGain || audioContext.destination);

    const startTime = audioContext.currentTime + delay;
    const attack = Math.min(0.02, duration / 4);
    const release = Math.min(0.06, duration / 3);

    amp.gain.setValueAtTime(0, startTime);
    amp.gain.linearRampToValueAtTime(gain, startTime + attack);
    amp.gain.setValueAtTime(gain, Math.max(startTime + attack, startTime + duration - release));
    amp.gain.linearRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  }

  /**
 * Helper for play scale.
 *
 * @param {*} themeProfile
 * @param {*} steps
 * @param {*} noteDuration
 * @param {*} gain
 * @returns {void}
 */
  function playScale(themeProfile, steps, noteDuration, gain, delayStep = 0.1, detune = 0) {
    steps.forEach((step, index) => {
      playTone({
        frequency: semitoneToFrequency(themeProfile.baseFrequency, step),
        waveType: index % 2 === 0 ? themeProfile.waveType : themeProfile.accentWaveType,
        duration: noteDuration,
        gain,
        delay: index * delayStep,
        detune,
      });
    });
  }

  /**
 * Helper for stop ambient.
 *
 * @returns {void}
 */
  function stopAmbient() {
    if (ambientTimerId !== null) {
      window.clearTimeout(ambientTimerId);
      ambientTimerId = null;
    }
  }

  /**
 * Helper for schedule ambient phrase.
 *
 * @param {*} profile
 * @returns {void}
 */
  function scheduleAmbientPhrase(profile) {
    const motif = profile.ambientMotifs[ambientPhraseIndex % profile.ambientMotifs.length];
    const transpose = (ambientPhraseIndex % 4) * 2;
    const noteSpacing = 0.22;
    const phraseLengthMs = motif.length * 220 + 900;

    motif.forEach((step, index) => {
      const delay = index * noteSpacing;
      const isAccent = index % 3 === 0;

      playTone({
        frequency: semitoneToFrequency(profile.baseFrequency, step + transpose - 12),
        waveType: isAccent ? 'sine' : profile.waveType,
        duration: isAccent ? 0.28 : 0.22,
        gain: isAccent ? 0.015 : 0.011,
        delay,
        detune: index % 2 === 0 ? -3 : 3,
      });

      if (index % 2 === 0) {
        playTone({
          frequency: semitoneToFrequency(profile.baseFrequency, step + transpose - 24),
          waveType: 'triangle',
          duration: 0.34,
          gain: 0.008,
          delay: delay + 0.05,
        });
      }
    });

    ambientTimerId = window.setTimeout(() => {
      if (ambientThemeKey !== themeKey) {
        return;
      }

      ambientPhraseIndex += 1;
      scheduleAmbientPhrase(profile);
    }, phraseLengthMs);
  }

  /**
 * Helper for play ambient.
 *
 * @returns {void}
 */
  function playAmbient(nextThemeKey = themeKey) {
    const audioContext = ensureContext();

    if (!audioContext || audioContext.state !== 'running') {
      return;
    }

    if (ambientThemeKey === nextThemeKey && ambientTimerId !== null) {
      return;
    }

    stopAmbient();
    ambientThemeKey = nextThemeKey;
    ambientPhraseIndex = 0;
    scheduleAmbientPhrase(getProfile(nextThemeKey));
  }


  /**
 * Helper for play spin start.
 *
 * @returns {void}
 */
  function playSpinStart(nextThemeKey = themeKey) {
    const profile = getProfile(nextThemeKey);
    playAmbient(nextThemeKey);
    playScale(profile, [0, 4, 7, 12], 0.11, 0.04, 0.08, -2);
  }

  /**
 * Helper for play reel stop.
 *
 * @returns {void}
 */
  function playReelStop(nextThemeKey = themeKey, reelIndex = 0) {
    const profile = getProfile(nextThemeKey);
    playTone({
      frequency: semitoneToFrequency(profile.baseFrequency, profile.scale[(reelIndex + 1) % profile.scale.length]),
      waveType: profile.accentWaveType,
      duration: 0.09,
      gain: 0.045,
      detune: reelIndex * 4,
    });
  }

  /**
 * Helper for play outcome.
 *
 * @param {*} resolution
 * @returns {void}
 */
  function playOutcome(resolution, nextThemeKey = themeKey) {
    const profile = getProfile(nextThemeKey);

    if (resolution.bonusAwarded > 0) {
      playScale(profile, [0, 4, 7, 12, 16], 0.14, 0.055, 0.11);
      playTone({
        frequency: semitoneToFrequency(profile.baseFrequency, 16),
        waveType: 'sine',
        duration: 0.24,
        gain: 0.04,
        delay: 0.16,
      });
      return;
    }

    if (resolution.outcome.payout > 0) {
      playScale(profile, [0, 5, 9, 12, 14], 0.14, 0.05, 0.1);
      playTone({
        frequency: semitoneToFrequency(profile.baseFrequency, 19),
        waveType: 'triangle',
        duration: 0.18,
        gain: 0.034,
        delay: 0.18,
      });
      return;
    }

    if (resolution.progressLost > 0 || resolution.outcome.resetsProgress) {
      playScale(profile, [0, -2, -5, -9, -12], 0.13, 0.04, 0.09);
      playTone({
        frequency: semitoneToFrequency(profile.baseFrequency, -14),
        waveType: 'sine',
        duration: 0.2,
        gain: 0.028,
        delay: 0.16,
      });
      return;
    }

    playScale(profile, [0, -3, -7], 0.1, 0.035, 0.08);
    playTone({
      frequency: semitoneToFrequency(profile.baseFrequency, -12),
      waveType: 'triangle',
      duration: 0.16,
      gain: 0.025,
      delay: 0.12,
    });
  }

  /**
 * Helper for play cash out.
 *
 * @returns {void}
 */
  function playCashOut(nextThemeKey = themeKey, tokensRemoved = 0) {
    const profile = getProfile(nextThemeKey);
    const descent = tokensRemoved > 0 ? [-2, -5, -9] : [-7, -12, -15];
    playScale(profile, descent, 0.1, 0.03, 0.08);
  }

  /**
 * Helper for play theme change.
 *
 * @returns {void}
 */
  function playThemeChange(nextThemeKey = themeKey) {
    const profile = getProfile(nextThemeKey);
    playAmbient(nextThemeKey);
    playScale(profile, [0, 5, 9, 12], 0.09, 0.035, 0.07, 2);
  }

  return {
    unlock,
    setTheme,
    setVolume,
    getVolume,
    playSpinStart,
    playReelStop,
    playOutcome,
    playCashOut,
    playThemeChange,
  };
}

/**
 * Look up a required template element and throw if it is missing.
 *
 * @param {*} selector
 * @returns {void}
 */
function getRequiredTemplate(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLTemplateElement)) {
    throw new Error(`Missing required template: ${selector}`);
  }

  return element;
}



