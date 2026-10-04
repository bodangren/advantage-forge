# Games read the student's saved flashcards

Status: completed 2026-10-04. The plan records execution state. The spec records the design and the open decisions.

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
- [x] Task: Remove "your story" from the 28 games. The briefings say "Your words" and "one of your sentences", which fit saved items and the Forge demo stories (Forge 721c687, monorepo 53831b54d). The page count names the practice set, not every saved item (monorepo e7b9ead03).

## Phase 5: Verification

- [x] Task: Run the package tests, the Primary Advantage type check and lint, and the browser QC with seeded flashcards. Forge: 135 files, 2103 tests. Games package: 120 files, 1885 tests, type check clean; `port-game.mjs --check all` and `port-kit.mjs --check` report no difference. Primary: ESLint passes on the 10 changed files; the type check has 14 errors, all in two files that this branch does not change (TD-16). Browser QC: 28 of 28 games in 3D and in 2D with no errors. App QC on the local database (seeded student, 390 x 844): the practice route gives 10 words and 8 sentences; the th and en pages open 28 games; the Labyrinth (3D) and Rune Match (2D) briefings and boards show the saved items; with 3 words and no sentences, all 28 games lock and link to `/student/read` (HTTP 200).
- [x] Task: Rebuild the repository graph and run `architecture-enforcement`. The port track records both (`game_platform_port_20260928`, Phase 4). The architecture check fails on `origin/master` with the same stale manifest hash, before this branch (TD-15).
