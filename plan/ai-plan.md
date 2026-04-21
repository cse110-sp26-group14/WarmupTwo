# AI Plan

We will use **Codex** as our main AI tool for this project.  
Our team will use AI in small steps instead of asking for the whole final project at once.  
After each step, we will test the result and record what happened in `ai-use-log.md`.  
If something does not work, we will first ask Codex to fix it. Only if that fails will we hand-edit the code, and we will write that in the log.

## Step 1: Build the basic version

First, we will use the required warm-up prompt to generate the basic version of the project.

**Prompt:**
> Create a slot machine app that uses vanilla web technology like HTML, CSS, JavaScript, and platform APIs. The slot machine should make fun of AI, as in you are winning tokens and spending tokens.

## Step 2: Improve the game based on our research

Next, we will ask Codex to improve the project so it better matches our user and domain research. We want the slot machine to feel more fun, casual-friendly, visually engaging, and progression-based, instead of feeling like a high-risk gambling app.

**Prompt:**
> Improve this slot machine app based on these goals: keep it casual-friendly, low-risk, and easy to understand; make it visually engaging with strong colors and clear feedback; keep the slot machine as the center of attention; add a simple progression system or bonus reward after several spins; and keep the AI joke/theme light and funny. Do not break the existing working features.

## Step 3: Fix, clean, and make the code easier to maintain

Finally, we will ask Codex to help us improve code quality and reliability. We want cleaner structure, comments, edge-case handling, and basic tests so the project is easier to understand and maintain.

**Prompt:**
> Review this slot machine app and improve its code quality. Help fix bugs, clean up the structure, avoid duplicate code, add clear comments for the main JavaScript functions, handle simple edge cases, and suggest basic unit tests for the core game logic and token system. Do not change working features unless necessary.

This is our starting AI plan. If our process changes, we will update this file and continue documenting everything in `ai-use-log.md`.
