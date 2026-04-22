import {
  DEFAULT_GAME_CONFIG,
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
const RESULT_OVERLAY_DURATION_MS = 2200;
const THEME_STORAGE_KEY = 'token-furnace-theme';

const THEME_AUDIO_LIBRARY = Object.freeze({
  festival: {
    baseFrequency: 392,
    scale: [0, 4, 7, 12],
    waveType: 'triangle',
    accentWaveType: 'sine',
  },
  riviera: {
    baseFrequency: 330,
    scale: [0, 3, 7, 10],
    waveType: 'sine',
    accentWaveType: 'triangle',
  },
  oasis: {
    baseFrequency: 294,
    scale: [0, 2, 5, 9],
    waveType: 'triangle',
    accentWaveType: 'sine',
  },
});

const THEME_LIBRARY = Object.freeze({
  festival: {
    key: 'festival',
    buttonLabel: 'Lantern Festival',
    machineTitle: 'Lantern Festival Spinner',
    machineEyebrow: 'Festival lights',
    flavorText: 'Lanterns, koi, drums, and a lucky-gate jackpot.',
    guideText: 'Festival charms fill the reels. Build the vault over 24 spins, but MASK combinations can knock your climb backwards.',
    symbols: [
      { key: 'LANTERN', label: 'Lantern', icon: '\u{1F3EE}' },
      { key: 'KOI', label: 'Koi', icon: '\u{1F38F}' },
      { key: 'DRUM', label: 'Drum', icon: '\u{1F941}' },
      { key: 'FAN', label: 'Fan', icon: '\u{1FAAD}' },
      { key: 'MASK', label: 'Mask', icon: '\u{1F3AD}' },
      { key: 'TORII', label: 'Gate', icon: '\u26E9\uFE0F' },
      { key: 'MOCHI', label: 'Mochi', icon: '\u{1F361}' },
      { key: 'LUCK', label: 'Lucky', icon: '\u{1F9E7}' },
    ],
    jackpotSymbol: 'LANTERN',
    progressDropSymbol: 'MASK',
    progressResetSymbol: 'MASK',
  },
  riviera: {
    key: 'riviera',
    buttonLabel: 'Riviera Postcards',
    machineTitle: 'Riviera Postcard Spinner',
    machineEyebrow: 'Coastal table',
    flavorText: 'Sun-washed tiles, olive branches, and postcard-blue water.',
    guideText: 'Coastal icons fill this cabinet. The vault is rich, but WAVE combinations can wash progress away before it pays out.',
    symbols: [
      { key: 'OLIVE', label: 'Olive', icon: '\u{1FAD2}' },
      { key: 'TILE', label: 'Tile', icon: '\u{1F537}' },
      { key: 'LEMON', label: 'Lemon', icon: '\u{1F34B}' },
      { key: 'WAVE', label: 'Wave', icon: '\u{1F30A}' },
      { key: 'SUN', label: 'Sun', icon: '\u2600\uFE0F' },
      { key: 'SHELL', label: 'Shell', icon: '\u{1F41A}' },
      { key: 'SAIL', label: 'Sail', icon: '\u26F5' },
      { key: 'COAST', label: 'Coast', icon: '\u{1F3D6}\uFE0F' },
    ],
    jackpotSymbol: 'SUN',
    progressDropSymbol: 'WAVE',
    progressResetSymbol: 'WAVE',
  },
  oasis: {
    key: 'oasis',
    buttonLabel: 'Oasis Caravan',
    machineTitle: 'Oasis Caravan Spinner',
    machineEyebrow: 'Desert route',
    flavorText: 'Palm shade, lamp glow, and a vault hidden beyond the dunes.',
    guideText: 'Desert icons and warm golds shape this machine. The vault is huge, but MOON combinations can cut or wipe your progress.',
    symbols: [
      { key: 'PALM', label: 'Palm', icon: '\u{1F334}' },
      { key: 'DUNE', label: 'Dune', icon: '\u{1F3DC}\uFE0F' },
      { key: 'LAMP', label: 'Lamp', icon: '\u{1FA94}' },
      { key: 'STAR', label: 'Star', icon: '\u2B50' },
      { key: 'OASIS', label: 'Spring', icon: '\u{1F4A7}' },
      { key: 'FALCON', label: 'Falcon', icon: '\u{1F985}' },
      { key: 'GEM', label: 'Gem', icon: '\u{1F48E}' },
      { key: 'MOON', label: 'Moon', icon: '\u{1F319}' },
    ],
    jackpotSymbol: 'LAMP',
    progressDropSymbol: 'MOON',
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
 * @property {HTMLElement} guideText
 * @property {HTMLElement} jackpotRule
 * @property {HTMLElement} bonusRule
 * @property {HTMLElement} setbackRule
 * @property {HTMLElement} resetRule
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
let overlayTimeoutId = null;

initializeApp();

function initializeApp() {
  try {
    const elements = createAppElements();
    applyTheme(loadStoredTheme(), elements, { playAudio: false });
    attachEventListeners(elements);
    renderGameState(gameState, elements);
  } catch (error) {
    console.error('Unable to initialize the slot machine UI.', error);
  }
}

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
    machineTitle: getRequiredHtmlElement('#machineTitle'),
    machineEyebrow: getRequiredHtmlElement('#machineEyebrow'),
    vaultPrize: getRequiredHtmlElement('#vaultPrize'),
    themeFlavor: getRequiredHtmlElement('#themeFlavor'),
    guideText: getRequiredHtmlElement('#guideText'),
    jackpotRule: getRequiredHtmlElement('#jackpotRule'),
    bonusRule: getRequiredHtmlElement('#bonusRule'),
    setbackRule: getRequiredHtmlElement('#setbackRule'),
    resetRule: getRequiredHtmlElement('#resetRule'),
    resultOverlay: getRequiredHtmlElement('#resultOverlay'),
    resultOverlayCard: getRequiredHtmlElement('#resultOverlayCard'),
    resultKicker: getRequiredHtmlElement('#resultKicker'),
    resultValue: getRequiredHtmlElement('#resultValue'),
    resultCaption: getRequiredHtmlElement('#resultCaption'),
    themeButtons: getThemeButtons(),
    symbolPool: [...activeTheme.symbols],
  };
}

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
}

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

async function handleSpinClick(elements) {
  const gameConfig = getActiveGameConfig();

  if (gameState.isSpinning || !canAffordSpin(gameState.wallet, gameConfig)) {
    return;
  }

  const previousState = gameState;
  hideResultOverlay(elements);

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

function handleCashOutClick(elements) {
  if (gameState.isSpinning) {
    return;
  }

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

function spinAllReels(elements) {
  return Promise.all(
    elements.reelSymbols.map((element, index) =>
      animateReelSymbol(element, REEL_SPIN_DURATIONS_MS[index], elements.symbolPool, index)
    )
  );
}

function animateReelSymbol(reelElement, durationMs, symbolPool, reelIndex) {
  reelElement.classList.add('spinning');

  const timerId = window.setInterval(() => {
    renderReelSymbol(reelElement, pickRandomSymbol(symbolPool));
  }, REEL_TICK_INTERVAL_MS);

  return new Promise((resolve) => {
    window.setTimeout(() => {
      window.clearInterval(timerId);
      reelElement.classList.remove('spinning');
      const finalSymbol = pickRandomSymbol(symbolPool);
      renderReelSymbol(reelElement, finalSymbol);
      audioEngine.playReelStop(activeTheme.key, reelIndex);
      resolve(finalSymbol.key);
    }, durationMs);
  });
}

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

function getFeedbackKindForSpin(resolution) {
  if (resolution.bonusAwarded > 0) {
    return 'bonus';
  }

  return resolution.outcome.kind;
}

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

function hideResultOverlay(elements) {
  if (overlayTimeoutId) {
    window.clearTimeout(overlayTimeoutId);
    overlayTimeoutId = null;
  }

  elements.resultOverlay.classList.remove('visible');
}

function setStatusMessage(elements, message) {
  elements.statusLine.textContent = message;
}

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

function flashMachinePanel(panel, effectClass) {
  panel.classList.remove('win-flash', 'loss-flash');
  panel.classList.add(effectClass);

  window.setTimeout(() => {
    panel.classList.remove(effectClass);
  }, PANEL_EFFECT_DURATION_MS);
}

function triggerVibration(pattern) {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
}

function renderReelSymbol(element, symbol) {
  element.innerHTML = `<span class="symbol-icon" aria-hidden="true">${symbol.icon}</span><span class="symbol-label">${symbol.label}</span>`;
}

function pickRandomSymbol(symbolPool) {
  const randomIndex = Math.floor(Math.random() * symbolPool.length);
  return symbolPool[randomIndex];
}

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
  elements.jackpotRule.textContent = `Three ${safeTheme.jackpotSymbol} icons: jackpot +${gameConfig.jackpotPayout} tokens`;
  elements.bonusRule.textContent = `Every ${gameConfig.bonusThreshold} spins: vault +${gameConfig.bonusReward} tokens`;
  elements.setbackRule.textContent = `Pair of ${safeTheme.progressDropSymbol} icons: lose ${gameConfig.progressDropAmount} progress`;
  elements.resetRule.textContent = `Triple ${safeTheme.progressResetSymbol} icons: reset the vault`;

  elements.themeButtons.forEach((button) => {
    button.classList.toggle('is-active', button.dataset.themeOption === safeTheme.key);
  });

  syncReelSymbolsToTheme(elements, safeTheme.symbols);
  renderGameState(gameState, elements);

  if (options.playAudio) {
    audioEngine.unlock();
    audioEngine.playThemeChange(safeTheme.key);
  }
}

function getActiveGameConfig() {
  return getConfiguredThemeGameConfig(activeTheme);
}

function getConfiguredThemeGameConfig(theme) {
  return {
    ...DEFAULT_GAME_CONFIG,
    jackpotSymbol: theme.jackpotSymbol,
    progressDropSymbol: theme.progressDropSymbol,
    progressResetSymbol: theme.progressResetSymbol,
  };
}

function syncReelSymbolsToTheme(elements, symbols) {
  elements.reelSymbols.forEach((element, index) => {
    renderReelSymbol(element, symbols[index % symbols.length]);
  });
}

function loadStoredTheme() {
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return AVAILABLE_THEMES.includes(storedTheme || '') ? storedTheme : AVAILABLE_THEMES[0];
  } catch {
    return AVAILABLE_THEMES[0];
  }
}

function persistTheme(themeName) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, themeName);
  } catch {
    // Ignore storage failures and keep the in-memory theme.
  }
}

function getThemeButtons() {
  return Array.from(document.querySelectorAll('[data-theme-option]')).filter(
    (element) => element instanceof HTMLButtonElement
  );
}

function getRequiredHtmlElement(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLElement)) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

function getRequiredButton(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Missing required button: ${selector}`);
  }

  return element;
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
function createAudioEngine() {
  /** @type {AudioContext | null} */
  let context = null;
  let themeKey = AVAILABLE_THEMES[0];

  function ensureContext() {
    if (typeof window.AudioContext === 'undefined' && typeof window.webkitAudioContext === 'undefined') {
      return null;
    }

    if (!context) {
      const AudioCtor = window.AudioContext || window.webkitAudioContext;
      context = new AudioCtor();
    }

    return context;
  }

  function unlock() {
    const audioContext = ensureContext();

    if (!audioContext || audioContext.state === 'running') {
      return;
    }

    void audioContext.resume();
  }

  function setTheme(nextThemeKey) {
    themeKey = THEME_AUDIO_LIBRARY[nextThemeKey] ? nextThemeKey : AVAILABLE_THEMES[0];
  }

  function getProfile(nextThemeKey = themeKey) {
    return THEME_AUDIO_LIBRARY[nextThemeKey] || THEME_AUDIO_LIBRARY[AVAILABLE_THEMES[0]];
  }

  function semitoneToFrequency(baseFrequency, semitoneOffset) {
    return baseFrequency * 2 ** (semitoneOffset / 12);
  }

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
    amp.connect(audioContext.destination);

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

  function playSpinStart(nextThemeKey = themeKey) {
    const profile = getProfile(nextThemeKey);
    playScale(profile, [0, 4, 7], 0.11, 0.04, 0.08, -2);
  }

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

  function playOutcome(resolution, nextThemeKey = themeKey) {
    const profile = getProfile(nextThemeKey);

    if (resolution.bonusAwarded > 0) {
      playScale(profile, [0, 4, 7, 12], 0.14, 0.055, 0.11);
      return;
    }

    if (resolution.outcome.payout > 0) {
      playScale(profile, [0, 3, 7], 0.13, 0.05, 0.1);
      return;
    }

    if (resolution.progressLost > 0 || resolution.outcome.resetsProgress) {
      playScale(profile, [0, -2, -5], 0.11, 0.045, 0.09);
      return;
    }

    playScale(profile, [0, -3], 0.1, 0.04, 0.08);
  }

  function playCashOut(nextThemeKey = themeKey, tokensRemoved = 0) {
    const profile = getProfile(nextThemeKey);
    const descent = tokensRemoved > 0 ? [-2, -5, -9] : [-7, -12];
    playScale(profile, descent, 0.1, 0.04, 0.08);
  }

  function playThemeChange(nextThemeKey = themeKey) {
    const profile = getProfile(nextThemeKey);
    playScale(profile, [0, 5, 9], 0.09, 0.035, 0.07, 2);
  }

  return {
    unlock,
    setTheme,
    playSpinStart,
    playReelStop,
    playOutcome,
    playCashOut,
    playThemeChange,
  };
}

function getRequiredTemplate(selector) {
  const element = document.querySelector(selector);

  if (!(element instanceof HTMLTemplateElement)) {
    throw new Error(`Missing required template: ${selector}`);
  }

  return element;
}



