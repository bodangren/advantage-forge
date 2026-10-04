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

- [x] Task: Add the selection by memory state next to `listGameLearningContent`, with domain tests for the order and the student scope. `listGamePracticeInput` (monorepo f7c281716): FSRS `due` ascending, then newest; at most 10 words and 8 sentences; skips malformed cards, repeats, and translations that repeat the answer. 13 domain tests.
- [x] Task: Return the number of usable items for each game, so the host can lock a game. `missingFor` in the kit (8794ebe04) and `missingItems` in the games registry. No per-game word window is needed: every sentence game falls back to all sentences when none fits its window.

## Phase 4: Monorepo host

- [x] Task: Copy the 28 student games with `port-game.mjs` (monorepo bc9fcd964). Monster Encounters left the games package.
- [x] Task: Replace the story picker with a game list, locks, and the content request (monorepo 5b7b4a6cd): `GET /api/v1/apk/practice`, locked cards with the missing count and a link to `/student/read`.
- [x] Task: Put the flashcard records in the evidence, and keep `recordGameCompletion` and server XP. Item ids are record ids; `inputId` is "saved" (74d457eb7).
- [x] Task: Update the messages for all five locales (Thai text in th; English text in en, cn, tw, and vi, as before).

## Phase 5: Verification

- [ ] Task: Run the package tests, the Primary Advantage type check and lint, and the browser QC with seeded flashcards.
- [ ] Task: Rebuild the repository graph and run `architecture-enforcement`.
