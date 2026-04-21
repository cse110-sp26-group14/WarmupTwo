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
const bonusThreshold = 5;
const bonusReward = 8;

const state = {
  wallet: 30,
  spent: 0,
  won: 0,
  streak: 0,
  spins: 0,
  bonusProgress: 0,
  lastPayout: 0,
  isSpinning: false,
  feedbackKind: "ready",
  feedbackText: "Ready to spin",
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
const spinCount = document.querySelector("#spinCount");
const lastPayout = document.querySelector("#lastPayout");
const moodText = document.querySelector("#moodText");
const statusLine = document.querySelector("#statusLine");
const spinButton = document.querySelector("#spinButton");
const cashOutButton = document.querySelector("#cashOutButton");
const machinePanel = document.querySelector(".machine-panel");
const toastTemplate = document.querySelector("#toastTemplate");
const toastStack = document.querySelector("#toastStack");
const bonusText = document.querySelector("#bonusText");
const bonusFill = document.querySelector("#bonusFill");
const feedbackPill = document.querySelector("#feedbackPill");

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function render() {
  walletCount.textContent = String(state.wallet);
  spentCount.textContent = String(state.spent);
  wonCount.textContent = String(state.won);
  streakCount.textContent = `${state.streak} ${state.streak === 1 ? "win" : "wins"}`;
  spinCount.textContent = String(state.spins);
  lastPayout.textContent = `${state.lastPayout} tokens`;
  moodText.textContent = getMood();
  feedbackPill.textContent = state.feedbackText;
  feedbackPill.className = `feedback-pill ${state.feedbackKind}`;
  bonusText.textContent = `${state.bonusProgress} / ${bonusThreshold} spins`;
  bonusFill.style.width = `${(state.bonusProgress / bonusThreshold) * 100}%`;
  spinButton.disabled = state.isSpinning || state.wallet < spinCost;
  cashOutButton.disabled = state.isSpinning;
}

function getMood() {
  if (state.wallet <= spinCost) {
    return "Almost snack-break broke";
  }

  if (state.streak >= 3) {
    return "On a friendly heater";
  }

  if (state.won > state.spent) {
    return "Doing surprisingly well";
  }

  if (state.spent - state.won > 12) {
    return "Still having fun, probably";
  }

  return "Easygoing";
}

function setStatus(message) {
  statusLine.textContent = message;
}

function setFeedback(kind, text) {
  state.feedbackKind = kind;
  state.feedbackText = text;
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
  toastStack.appendChild(toast);

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
      message: "Three BOTs. The machine says that counts as fully automated fun.",
      kind: "win",
    };
  }

  if (values[0] === 3) {
    return {
      payout: 18,
      message: `Triple ${tripleSymbol}. Nice hit.`,
      kind: "win",
    };
  }

  if (values[0] === 2) {
    const pairedSymbol = Object.keys(counts).find((symbol) => counts[symbol] === 2);
    return {
      payout: 6,
      message: `Pair of ${pairedSymbol}. Small win, solid vibes.`,
      kind: "win",
    };
  }

  return {
    payout: 0,
    message: "No match this time. The machine says it is still learning.",
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

function awardSpinBonus() {
  state.bonusProgress += 1;

  if (state.bonusProgress < bonusThreshold) {
    return null;
  }

  state.bonusProgress = 0;
  state.wallet += bonusReward;

  return {
    payout: bonusReward,
    message: `Bonus unlocked: +${bonusReward} tokens for sticking with it.`,
  };
}

async function handleSpin() {
  if (state.isSpinning || state.wallet < spinCost) {
    return;
  }

  state.isSpinning = true;
  state.wallet -= spinCost;
  state.spent += spinCost;
  state.lastPayout = 0;
  setFeedback("spinning", "Spinning...");
  setStatus("The reels are warming up.");
  render();

  const result = await Promise.all(
    reelElements.map((element, index) => animateReel(element, 700 + index * 220))
  );

  state.spins += 1;

  const outcome = evaluateSpin(result);
  const spinBonus = awardSpinBonus();

  state.lastPayout = outcome.payout + (spinBonus ? spinBonus.payout : 0);
  state.wallet += outcome.payout;
  state.won += outcome.payout;
  state.streak = outcome.payout > 0 ? state.streak + 1 : 0;

  let statusMessage = outcome.message;

  if (outcome.payout > 0) {
    pulsePanel("win-flash");
    vibrate([30, 20, 50]);
    setFeedback("win", `Win +${outcome.payout}`);
    showToast(`+${outcome.payout} tokens`);
  } else {
    pulsePanel("loss-flash");
    vibrate(25);
    setFeedback("loss", "Try again");
  }

  if (spinBonus) {
    state.won += spinBonus.payout;
    setFeedback("bonus", `Bonus +${spinBonus.payout}`);
    showToast(`Bonus +${spinBonus.payout} tokens`);
    statusMessage = `${statusMessage} ${spinBonus.message}`;
  }

  if (state.wallet < spinCost) {
    state.wallet += pityRefill;
    showToast(`Comeback +${pityRefill} tokens`);
    statusMessage = `${statusMessage} The machine spotted the low balance and tossed in ${pityRefill} comeback tokens.`;
  }

  setStatus(statusMessage);
  state.isSpinning = false;
  render();
}

function handleCashOut() {
  const slideValue = Math.max(1, Math.floor(state.wallet / 2));
  state.wallet = Math.max(0, state.wallet - slideValue);
  state.spent += slideValue;
  state.streak = 0;
  state.lastPayout = 0;
  setFeedback("loss", "Slides acquired");
  setStatus(
    `You traded ${slideValue} tokens for a cheerful slide deck about helpful automation.`
  );
  pulsePanel("loss-flash");
  vibrate(20);
  showToast(`-${slideValue} tokens for slides`);

  if (state.wallet < spinCost) {
    state.wallet += pityRefill;
    showToast(`Refill +${pityRefill} tokens`);
    setStatus(
      `You traded ${slideValue} tokens for a cheerful slide deck about helpful automation. The machine kindly added ${pityRefill} comeback tokens so the fun can continue.`
    );
  }

  render();
}

spinButton.addEventListener("click", handleSpin);
cashOutButton.addEventListener("click", handleCashOut);

render();
