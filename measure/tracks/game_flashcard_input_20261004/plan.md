# Games read the student's saved flashcards

Status: new. The plan records execution state. The spec records the design and the open decisions.

## Phase 1: Decisions

- [ ] Task: Get the owner's answers to the five open decisions in the spec.

## Phase 2: Forge games

- [ ] Task: Change the game input from `StoryInput` to `VocabularyInput` or `SentenceInput` plus a level, in the kit contracts and all 29 games.
- [ ] Task: Make the demo host build that input from the story packs.
- [ ] Task: Apply the Monster Encounters decision.
- [ ] Task: Run the game tests and the browser QC in Forge.

## Phase 3: Monorepo selection

- [ ] Task: Add the selection by memory state next to `listGameLearningContent`, with domain tests for the order and the student scope.
- [ ] Task: Return the number of usable items for each game (word limits included), so the host can lock a game.

## Phase 4: Monorepo host

- [ ] Task: Copy the 29 games with `port-game.mjs`.
- [ ] Task: Replace the story picker with a game list, locks, and the content request.
- [ ] Task: Put the flashcard records in the evidence, and keep `recordGameCompletion` and server XP.
- [ ] Task: Update the messages for all five locales.

## Phase 5: Verification

- [ ] Task: Run the package tests, the Primary Advantage type check and lint, and the browser QC with seeded flashcards.
- [ ] Task: Rebuild the repository graph and run `architecture-enforcement`.
