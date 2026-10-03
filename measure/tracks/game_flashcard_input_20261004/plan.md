# Games read the student's saved flashcards

Status: in progress. The plan records execution state. The spec records the design and the open decisions.

## Phase 1: Decisions

- [x] Task: Get the owner's answers to the five open decisions in the spec. Answered 2026-10-04 (spec, "Owner decisions").

## Phase 2: Forge games

- [x] Task: Change the game input of the 28 student games from `StoryInput` to `PracticeInput` (id, level, words, and sentences with their ids). The manifests say `inputMode: 'practice'`. The evidence field `storyId` is now `inputId`. `missingFor` gives the missing item counts for a locked game.
- [x] Task: Keep the demo host on its story packs. A `StoryInput` is a valid `PracticeInput` (test: every real story); `toPracticeInput` takes its practice part.
- [x] Task: Apply the Monster Encounters decision. In Forge it stays a story game (`inputMode: 'story'`, it rejects other input). The monorepo removes it from the student games.
- [x] Task: Run the game tests in Forge: 136 files, 2120 tests pass (kit, host, all games). No browser QC in Forge: the demo input did not change.

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
