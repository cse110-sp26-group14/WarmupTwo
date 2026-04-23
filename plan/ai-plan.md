# AI Plan

## AI Model

**AI Model: Codex 4.5 High**

## Tools and Approach

- Using OpenAI Codex as our main tool.
- Work in small steps, not one big prompt.
- Keep the same direction unless we clearly log major changes.

## 3-Step Process

### 1) Build Base Version

- Generate a simple working slot machine with HTML, CSS, and JavaScript.
- In this step, we focus on getting a playable base first, not perfect visuals.
- Core features in this stage include:
  - spin button and basic reel randomization
  - token gain/loss behavior
  - clear win/loss result text
  - basic layout that can be expanded later
- We also make sure the app can run reliably before adding advanced features.
- Success condition for this step: the game loop works end-to-end (spin -> result -> token update).

### 2) Improve with Research

- Make it fun, casual, and low-risk.
- Add visuals, better feedback, and progression.
- We use our research direction to shape the experience instead of only adding random features.
- This step focuses on player-facing quality:
  - clearer UI hierarchy so players know where to look
  - stronger feedback after each spin (result overlays, status indicators, toasts)
  - better theme identity (theme-specific symbols, colors, and vibe)
  - progression pacing (bonus meter / risk-reward adjustments)
- We iterate this step many times because most usability issues appear only after playtesting.
- Success condition for this step: game feels understandable, engaging, and visually coherent.

### 3) Refactor and Test

- Clean code and improve structure.
- Handle edge cases.
- Add comments and basic tests.
- After major feature additions, we improve maintainability and stability.
- This step includes:
  - separating game logic from UI logic where possible
  - reducing duplicate code and simplifying function responsibilities
  - adding comments/JSDoc for main functions
  - adding or updating tests for key logic (spin results, payout, mode behavior)
  - validating outputs and fixing breakpoints/interaction bugs
- We also check edge cases such as invalid states, quick repeated clicks, and mode switching during spin.
- Success condition for this step: the app is easier to maintain, less error-prone, and ready for final demo/reporting.

## How We Use AI

Our process in each run:

**Prompt -> Test -> Log Results**

For each run, we track:
- what worked
- what failed
- what we learned

## Goal

Build a fun app while showing a clear, iterative AI workflow.

## Prompt Examples

### Start

Create a slot machine app that uses vanilla web technology like HTML, CSS, JavaScript, and platform APIs. The slot machine should make fun of AI, as in you are winning tokens and spending tokens.

### Run #3

Review this slot machine app and improve its software engineering quality. Keep working features intact unless necessary. Refactor for meaningful names, smaller functions, less duplicate code, and clearer modular structure. Add JSDoc comments with type annotations for the main JavaScript functions. Help handle simple edge cases and errors. Add or suggest basic unit tests for the core game logic and token system. Also help prepare the code so it can pass linting and validation checks for HTML, CSS, and JavaScript.

### Run #10

Take this application and make the following changes: For the How to Play and Mechanics Explanation section, Give it its own Icon and make it minimizable, have it as a modal that is clickable by the user in order to prompt a pop-up instead of it constantly being visible. For the theme switch section, give it its own area on the left side. For the risk board, add the icons associated with the conditions. Include a settings bar that allows the user to change the theme and volume of the game. Remove the text underneath each symbol of the reel. Universal Icons for specific case point combinations, as an example the Cherry, Diamond and Lucky 7 symbols are shared across all themes. Change the color of "Theme Slot Cabinet" so that it is more visible. Change the music based off of the given theme that is currently selected. Ensure that the theme is not 12 notes repeated constantly.

## Note on Iteration

Even though this plan is written in 3 steps for clarity (same as our PPT), our real development used 20 prompt runs and iterative refinements recorded in the AI logs.
