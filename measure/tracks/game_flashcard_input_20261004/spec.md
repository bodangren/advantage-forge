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

## Design

1. **Game input.** The 28 student games read a `PracticeInput`: an id, a level, and the
   `vocabulary` and `sentences` lists with the item ids. A `StoryInput` is also a valid
   `PracticeInput`, so the Forge demo keeps its stories. The change is made in Forge and copied
   with `port-game.mjs`. The evidence field `storyId` becomes `inputId`.
2. **Selection.** The server chooses the items by FSRS state: `due` ascending (the item that is
   nearest to being forgotten comes first), then the newest. At most 10 words and 8 sentences:
   the largest round of any game.
3. **Host.** Primary Advantage shows the games, not stories. When the student has too few saved
   items, the game card is locked. It shows the number of missing items and a button that opens
   the reading page, where the student can read more and save more words.
4. **Results.** Completion and XP stay as they are: `recordGameCompletion`, and the server
   calculates the XP. The evidence names the flashcard records (their ids).

## Owner decisions (2026-10-04)

1. Selection by FSRS state now. The KST fringe comes later through the same selection function.
2. No FSRS update from the games. The games read the state and record evidence only.
3. Too few saved items: lock the game, and offer a button to read more and save more vocabulary.
4. Monster Encounters leaves the student games. It becomes a teacher-led game in the reading
   lesson, with student avatars and names. Deferred: the Forge source stays, and the game
   roadmap records it.
5. No story picker. The stories stay in the Forge demo only.

## Acceptance criteria

- Primary Advantage has no story picker for these games.
- Each game receives only the signed-in student's saved items. A game without enough items is locked and links to the reading page.
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
