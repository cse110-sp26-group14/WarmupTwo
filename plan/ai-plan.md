# AI Plan

We will use **Codex** as our main AI tool for this project.  
We chose Codex because it fits our team workflow well for coding, supports iterative prompting, and is convenient for generating, testing, and refining code in small steps. We will keep using the **same harness consistently** during this warm-up unless we decide to change strategy, and if we do, we will explain that change in `ai-use-log.md` together with the reason for it.

Our team will use AI in **small increments** instead of asking for the whole final project at once. We want a more strategic process, where each stage builds on research, testing, and revision, instead of relying only on luck or one giant prompt. We will use our `research-overview.md`, personas, and user stories to guide later prompts so that the final product better matches user and domain needs.

After each meaningful step, we will test the result and record what happened in `ai-use-log.md`. This includes:
- the prompt we used
- what Codex changed
- what worked
- what failed
- what we learned
- what we plan to try next

If something does not work, we will first ask Codex to fix it. Only if that fails will we hand-edit the code, and we will write that clearly in the log. Hand-editing will not be our default approach. We will also make sure our own team members are the ones committing changes to the repository.

These three stages are our **starting framework**. Inside each stage, we may use multiple smaller prompts and refinements. If our process changes, we will update this file and continue documenting everything in `ai-use-log.md`.

## Step 1: Build the basic version
First, we will use the required warm-up prompt to generate the basic version of the project. This step is mainly to get a working starting point that we can improve later through iteration.

**Prompt:**

Create a slot machine app that uses vanilla web technology like HTML, CSS, JavaScript, and platform APIs. The slot machine should make fun of AI, as in you are winning tokens and spending tokens.

## Step 2: Improve the game based on our research
Next, we will ask Codex to improve the project so it better matches our user and domain research. We want the slot machine to feel more fun, casual-friendly, visually engaging, and progression-based, instead of feeling like a high-risk gambling app. We also want the design and features to reflect the direction of our research overview, personas, and user stories.

In this stage, we may use several smaller follow-up prompts instead of only one prompt. For example, we may separately improve visuals, progression, layout, feedback, or theme clarity.

**Prompt:**

Improve this slot machine app based on these goals: keep it casual-friendly, low-risk, and easy to understand; make it visually engaging with strong colors and clear feedback; keep the slot machine as the center of attention; add a simple progression system or bonus reward after several spins; and keep the AI joke/theme light and funny. Do not break the existing working features.

## Step 3: Fix, clean, test, and make the code easier to maintain
Finally, we will ask Codex to improve software engineering quality. This stage is not only about making the app work, but also about helping it better meet the project’s software engineering standards. We want cleaner structure, comments, edge-case handling, validation, and tests so the project is easier to understand, maintain, and improve over time.

In this stage, we will focus on:
- meaningful names
- smaller functions
- avoiding duplicate code
- clearer modular structure
- error and edge-case handling
- JSDoc comments with type annotations for main JavaScript functions
- basic unit tests for the core game logic
- checking code quality through linting and validation as we go

**Prompt:**

Review this slot machine app and improve its software engineering quality. Keep working features intact unless necessary. Refactor for meaningful names, smaller functions, less duplicate code, and clearer modular structure. Add JSDoc comments with type annotations for the main JavaScript functions. Help handle simple edge cases and errors. Add or suggest basic unit tests for the core game logic and token system. Also help prepare the code so it can pass linting and validation checks for HTML, CSS, and JavaScript.

## Team process during AI use
As we move through these stages, we will keep all artifacts in the repository and update the project incrementally. We want our repo history, prompts, code changes, and logs to show how the project developed over time, instead of only showing the final result.

This is our starting AI plan. If our process changes, we will update this file and continue documenting everything in `ai-use-log.md`.
