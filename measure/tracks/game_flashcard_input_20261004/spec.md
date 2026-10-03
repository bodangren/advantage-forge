# Games read the student's saved flashcards

## Purpose

In Primary Advantage, the 3D games must practice the student's own words and sentences: the
items that the student saved from readings. The student's memory state chooses the items.

Today `student/games/story` offers three fixed stories (the Forge demo story packs). Owner,
2026-10-04: "Students should have saved vocabulary and sentences from their readings, and those
should be used based on the mastery-advantage graph state. So while the games are imported and
(mostly) work, the input to those games is entirely incorrect."

## Facts (2026-10-04)

- **Saved items.** `userWordRecords` holds a word JSON (`vocabulary`, and `definition` with one
  translation per locale). `userSentenceRecords` holds `sentence`, `translation` per locale, and
  audio. Both tables have FSRS state: `due`, `stability`, `difficulty`, `reps`, `lapses`, `state`.
- **Existing query.** `listGameLearningContent` (`packages/domain/src/games/learning-content.ts`)
  gives the legacy APK games the saved items of the signed-in student through
  `/api/v1/apk/content`. It returns at most 50 items, most overdue first (`due` ascending).
- **Canonical product source.** `advantage-pr/05-methodology/kst-srs-explained.md` (version 1.2,
  2026-09-30): Primary Advantage uses FSRS flashcard scheduling only. The KST graph layer is not
  in the app yet. Shadow mode (evidence only) is planned for semester 2 of 2026, and adaptive
  features are targeted for May 2027.
- **Game needs.** 18 games read sentences (3 or more; four games accept 8 or 10 words at most per
  sentence). 10 games read vocabulary (4 to 6 words). Monster Encounters also reads questions,
  fill-in items, English definitions, and phonetics. All 29 games accept levels Pre-A1 to A1. The
  story `level` selects the games and labels the evidence.

## Proposed design

1. **Game input.** Each game reads the APK `VocabularyInput` or `SentenceInput` (`term`,
   `translation`) and a level, not a `StoryInput`. The Forge demo makes this input from its story
   packs with `toVocabularyInput` and `toSentenceInput`. The change is made in Forge and copied
   with `port-game.mjs`.
2. **Selection.** The server chooses the items from the memory state. Today that state is FSRS:
   due items first, then weak items (low stability, many lapses), then new items. One selection
   function has the KST outer fringe as its later source, when Primary Advantage adds the graph.
3. **Host.** Primary Advantage shows games, not stories. A game card shows how many saved items
   the game can use. When the student has too few items, the card is locked and shows the number
   that is missing. Sentence games skip a sentence that is longer than their word limit.
4. **Results.** Completion and XP stay as they are: `recordGameCompletion`, and the server
   calculates the XP. The evidence names the flashcard records instead of a story.

## Open decisions (owner)

1. KST or FSRS: the canonical source says that Primary Advantage has no KST graph yet. Proposal:
   select by FSRS state now, and add the KST fringe through the same function later.
2. FSRS write-back: does a game answer count as a flashcard review? Proposal: no. The game reads
   the state and records evidence only.
3. Too few saved items: lock the game, or add items from another source (the last article, or the
   level word list)? Proposal: lock the game and show the missing number.
4. Monster Encounters: flashcards have no questions or fill-in items. Proposal: use vocabulary
   only in Primary Advantage, or keep the game out of Primary Advantage until a question source
   exists.
5. Stories in Primary Advantage: remove the story picker, or keep stories as a second source?
   Proposal: remove it, and keep the stories in the Forge demo only.

## Acceptance criteria

- Primary Advantage has no story picker for these games.
- Each game receives only the signed-in student's saved items, or the source that decision 3 names.
- Domain tests cover the selection order and the student scope.
- The Forge games and the monorepo copies match through `port-game.mjs`.
- Browser QC passes in 3D and 2D for all games with seeded flashcards
  (`apps/primary-advantage/scripts/seed-demo-queue.ts`, local only).

## Evidence

- [Monorepo port](../../../docs/apk-port.md)
- [Platform port track](../game_platform_port_20260928/)
- Monorepo track `apk3d_games_port_20261003`

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
