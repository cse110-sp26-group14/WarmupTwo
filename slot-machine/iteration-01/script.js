const symbols = [
  "PROMPT",
  "GPU",
  "HYPE",
  "BOT",
  "PIVOT",
  "SLIDE",
  "VIBE",
  "TOKEN",
];

const spinCost = 3;
const pityRefill = 12;

const state = {
  wallet: 30,
  spent: 0,
  won: 0,
  streak: 0,
  lastPayout: 0,
  isSpinning: false,
};

const reelElements = [
  document.querySelector("#reel0"),
  document.querySelector("#reel1"),
  document.querySelector("#reel2"),
];

const walletCount = document.querySelector("#walletCount");
const spentCount = document.querySelector("#spentCount");
const wonCount = document.querySelector("#wonCount");
const streakCount = document.querySelector("#streakCount");
const lastPayout = document.querySelector("#lastPayout");
const moodText = document.querySelector("#moodText");
const statusLine = document.querySelector("#statusLine");
const spinButton = document.querySelector("#spinButton");
const cashOutButton = document.querySelector("#cashOutButton");
const machinePanel = document.querySelector(".machine-panel");
const toastTemplate = document.querySelector("#toastTemplate");

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function render() {
  walletCount.textContent = String(state.wallet);
  spentCount.textContent = String(state.spent);
  wonCount.textContent = String(state.won);
  streakCount.textContent = `${state.streak} ${state.streak === 1 ? "win" : "wins"}`;
  lastPayout.textContent = `${state.lastPayout} tokens`;
  moodText.textContent = getMood();
  spinButton.disabled = state.isSpinning || state.wallet < spinCost;
  cashOutButton.disabled = state.isSpinning;
}

function getMood() {
  if (state.wallet <= spinCost) {
    return "One buzzword from disaster";
  }

  if (state.streak >= 3) {
    return "Unreasonably bullish";
  }

  if (state.won > state.spent) {
    return "Profitably delusional";
  }

  if (state.spent - state.won > 12) {
    return "Pre-seed regret";
  }

  return "Cautiously overfunded";
}

function setStatus(message) {
  statusLine.textContent = message;
}

function pulsePanel(className) {
  machinePanel.classList.remove("win-flash", "loss-flash");
  machinePanel.classList.add(className);
  window.setTimeout(() => {
    machinePanel.classList.remove(className);
  }, 550);
}

function showToast(message) {
  const toast = toastTemplate.content.firstElementChild.cloneNode(true);
  toast.textContent = message;
  document.body.appendChild(toast);

  window.setTimeout(() => {
    toast.remove();
  }, 1800);
}

function vibrate(pattern) {
  if ("vibrate" in navigator) {
    navigator.vibrate(pattern);
  }
}

function evaluateSpin(result) {
  const counts = result.reduce((map, symbol) => {
    map[symbol] = (map[symbol] || 0) + 1;
    return map;
  }, {});

  const values = Object.values(counts).sort((a, b) => b - a);
  const tripleSymbol = Object.keys(counts).find((symbol) => counts[symbol] === 3);

  if (tripleSymbol === "BOT") {
    return {
      payout: 30,
      message: "Three BOTs. The machine achieved full automation and billed you for it.",
      kind: "jackpot",
    };
  }

  if (values[0] === 3) {
    return {
      payout: 18,
      message: `Triple ${tripleSymbol}. Investors called it product-market fit for six minutes.`,
      kind: "win",
    };
  }

  if (values[0] === 2) {
    const pairedSymbol = Object.keys(counts).find((symbol) => counts[symbol] === 2);
    return {
      payout: 6,
      message: `Pair of ${pairedSymbol}. Barely coherent, still somehow monetized.`,
      kind: "win",
    };
  }

  return {
    payout: 0,
    message: "No match. Your tokens have been reclassified as a strategic learning expense.",
    kind: "loss",
  };
}

function animateReel(element, duration) {
  element.classList.add("spinning");

  const timer = window.setInterval(() => {
    element.textContent = randomSymbol();
  }, 90);

  return new Promise((resolve) => {
    window.setTimeout(() => {
      window.clearInterval(timer);
      element.classList.remove("spinning");
      const finalSymbol = randomSymbol();
      element.textContent = finalSymbol;
      resolve(finalSymbol);
    }, duration);
  });
}

async function handleSpin() {
  if (state.isSpinning || state.wallet < spinCost) {
    return;
  }

  state.isSpinning = true;
  state.wallet -= spinCost;
  state.spent += spinCost;
  state.lastPayout = 0;
  setStatus("Spinning up the compliance-safe hype engine...");
  render();

  const result = await Promise.all(
    reelElements.map((element, index) => animateReel(element, 700 + index * 220))
  );

  const outcome = evaluateSpin(result);
  state.lastPayout = outcome.payout;
  state.wallet += outcome.payout;
  state.won += outcome.payout;
  state.streak = outcome.payout > 0 ? state.streak + 1 : 0;

  if (outcome.payout > 0) {
    pulsePanel("win-flash");
    vibrate([30, 20, 50]);
    showToast(`+${outcome.payout} tokens`);
  } else {
    pulsePanel("loss-flash");
    vibrate(25);
  }

  setStatus(outcome.message);

  if (state.wallet < spinCost) {
    state.wallet += pityRefill;
    showToast(`Pity refill: +${pityRefill} tokens`);
    setStatus(
      `${outcome.message} The machine sensed weakness and offered ${pityRefill} emergency pivot tokens.`
    );
  }

  state.isSpinning = false;
  render();
}

function handleCashOut() {
  const slideValue = Math.max(1, Math.floor(state.wallet / 2));
  state.wallet = Math.max(0, state.wallet - slideValue);
  state.spent += slideValue;
  state.streak = 0;
  state.lastPayout = 0;
  setStatus(
    `You converted ${slideValue} tokens into a premium keynote deck about responsible disruption.`
  );
  pulsePanel("loss-flash");
  vibrate(20);
  showToast(`-${slideValue} tokens for slides`);

  if (state.wallet < spinCost) {
    state.wallet += pityRefill;
    showToast(`Board-approved refill: +${pityRefill}`);
    setStatus(
      `You converted ${slideValue} tokens into a premium keynote deck about responsible disruption. The board panicked and wired ${pityRefill} replacement tokens.`
    );
  }

  render();
}

spinButton.addEventListener("click", handleSpin);
cashOutButton.addEventListener("click", handleCashOut);

render();
