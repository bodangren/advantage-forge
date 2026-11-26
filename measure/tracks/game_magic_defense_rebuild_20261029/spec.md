# Specification: Rebuild Magic Defense as a missile defense game

## Overview

Magic Defense is a missile defense game in a side view. Today it plays on the Monster Encounters
battle stage. This track rebuilds the rules core and both views, so that the game has its own scene
and its own play.

Three castles stand on a plain. Skeleton mages on a far ridge throw missiles. Each missile shows
the Thai meaning and stops above its castle until the student answers, so no timer runs. The right
English word breaks the missile in the air. A wrong word lets the missile hit the castle (-1 heart).
The storm mends the castles.

Effort: about 2 days.

## Dates

- Ready on Forge master: 2026-11-05.
- The PM accepted this date on 2026-10-29 as a proposal. The date holds only if Daniel picks the
  look by 2026-10-31. Each day of delay moves the date by one day.
- The four rebuild tracks finish in this order: Magic Defense (2026-11-05), Paladin's Twin Soul
  (2026-11-07), Archer's Revenge (2026-11-10), and Castle Defense (2026-11-12).

## Diagnosis (accepted by the PM on 2026-10-29)

- Cause: one build batch on 2026-10-03 put the games on the Monster Encounters battle stage,
  `src/games/shared/battle/stage3d.ts`. Commit `bf62e226` extracted that stage on 2026-09-28.
- The batch commits are `1e147404` (RPG Battle and Paladin's Twin Soul), `a40b2d8c` (Archer's
  Revenge), `36f7daf4` (Magic Defense), and `991b13b5` (Castle Defense).
- The scene did not come from RPG Battle.
- `docs/apk-2d3d-program.md` puts Magic Defense in family 3, Archer's Revenge in family 4, and
  Castle Defense in family 6. The batch did not follow that table.
- No review compared frames across games.

Facts found in this tree on 2026-10-29:

- `src/games/magic-defense/view/game.ts` imports `BattleStage` from
  `src/games/shared/battle/stage3d.ts`.
- `src/games/magic-defense/view2d/game.ts` imports `BattleStage2D` from
  `src/games/shared/battle/stage2d.ts`.
- `src/games/magic-defense/manifest.ts` lists the Sunken Vault battle set in `MODELS_3D` and
  `background.monster-encounters` in `FILES_2D`.
- The core shows one missile at a time on one castle. A wrong word keeps the missile in place.
- The old track is [game_magic_defense_20260928](../game_magic_defense_20260928/spec.md). The old
  design is [game-magic-defense-3d.md](../../../docs/game-magic-defense-3d.md).

## The game after the rebuild

- The view is a side view. Three castles stand on a plain, or two in Helper mode. Skeleton mages
  stand on a far ridge.
- A skeleton mage throws a missile at a castle. The missile stops above the castle and shows the
  Thai meaning.
- The card shows English words. The student taps one word. No timer runs, and the missile waits.
- Right word: the student's avatar casts a counter spell, and the missile breaks in the air. The
  coins, the streak, and the storm mana grow.
- Wrong word: the missile hits its castle (-1 heart). The failed word stays shut for that meaning.
- When every castle has fallen, the team rests, and the castles stand again with full hearts.
- At full mana, the student calls the storm. The storm mends every castle.
- The asset `skeleton-mage` exists. The picked look decides the castle, the plain, and the ridge.

## Functional Requirements

1. **FR-1 A held missile per castle.** The state holds at most one missile above each standing
   castle. Each missile has its word, its Thai meaning, its castle, and its thrower.
2. **FR-2 No timer.** A held missile stays above its castle until the student answers. `tick`
   changes nothing. No missile falls without an answer.
3. **FR-3 One active missile.** The card shows the choices for one active missile. Default: the
   core picks the active missile in a seeded order. See open question 1.
4. **FR-4 Right word.** A right `cast` breaks the active missile. The coins, the streak, and the
   mana change as they do today. The next word of the run takes the free place above that castle.
5. **FR-5 Wrong word.** A wrong `cast` makes the active missile hit its castle (-1 heart). The
   failed word stays shut for that meaning. The meaning stays in play until the student casts the
   right word. When its castle has fallen, the meaning comes back above a standing castle.
6. **FR-6 Keep the storm, the castles, and the hearts.** Keep the `cast` and `storm` commands, the
   castles, and the hearts. The storm mends every castle and keeps the held missiles. When every
   castle is at 0 hearts, the team rests and every castle returns to full hearts.
7. **FR-7 The evidence stays.** One `word` item per story word. `attempts` counts the spells cast
   while the word was active. `correctFirstTry` is true when the first spell was right.
8. **FR-8 Replay.** The same input, seed, options, and commands give the same events and the same
   final state.
9. **FR-9 The QC bot.** `qc/bot.ts` plays a full run to `victory` from the state alone. It casts
   the right word for the active missile.
10. **FR-10 The 3D view.** A three.js side view shows the plain, the castles, the ridge, the
    skeleton mages, the held missiles with their Thai meanings, and the student's avatar. No file
    of the game imports `src/games/shared/battle/stage3d.ts`.
11. **FR-11 The 2D view.** A Phaser view shows the same scene from the same core. It does not use
    `BattleStage2D` from `src/games/shared/battle/stage2d.ts` or the
    `background.monster-encounters` file.
12. **FR-12 The manifest.** `MODELS_3D`, `FILES_2D`, and the packs list the models and the sprites
    of the picked look. The pack binding test and the budget test pass.

## Shared constraints (all four rebuild tracks)

- The game has one deterministic rules core.
- A three.js 3D view and a Phaser 2D view run on that one core.
- The game keeps the APK shapes: one mount function, content through a launch context, one
  `GameResults`, and persistence through a host adapter. See
  [apk-port.md](../../../docs/apk-port.md).
- The game stops using `src/games/shared/battle/stage3d.ts`.
- No timer puts pressure on the student. Speed never gives XP. No game over occurs.
- The student's own avatar is the hero. No hero stands in for the student. When the avatar base
  does not load, the view shows a neutral silhouette.
- The characters are race-unmarked, as in the cast.
- All content is rated G.
- A game port and a local game are separate completions. This track completes the local game on
  Forge master. The monorepo port is a separate completion that the PM routes.

## Non-Functional Requirements

- Every build, render, test, vite, or Chrome run uses one command:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
- Exit code 75 means hold. Record `lock wait over 600 s` and stop the run.
- The machine has 7.1 GB of RAM. One heavy job runs at a time.
- No paid generation runs in this track.
- No session writes in the monorepo.

## Acceptance Criteria

- The Phase 1 tests pass. The Red run of the same tests failed first and is recorded in the plan.
- The type check shows 0 errors in the owned paths. The total is not above the baseline.
- No file in `src/games/magic-defense/` imports `src/games/shared/battle/stage3d.ts` or
  `src/games/shared/battle/stage2d.ts`.
- The QC bot plays a full run in 3D and in 2D with no page error and no diagnostic.
- One frame in 3D and one frame in 2D are in the plan with SHA-256. Beside the frames of the other
  three rebuild games and of Monster Encounters, the scene is different.
- `docs/game-magic-defense-3d.md` describes the rebuilt game.
- One report went to the PM. It names the Forge commit, the frames with SHA-256, and the handoff
  file.

## Out of Scope

- RPG Battle keeps its party battle (Daniel, 2026-10-28).
- Monster Encounters keeps the battle stage. This track does not change
  `src/games/shared/battle/`.
- Rune Match goes on Daniel's look list. No rework starts until he asks.
- Any monorepo write. The PM routes the cartridge sync to the monorepo session.
- The game video. The PR session rebuilds it after the report.
- The other three games. Each one has its own rebuild track.

## Open owner decisions

- Daniel decides whether the four games stay live in Primary until the fix. The PM asks him on
  2026-10-29. Default: keep them live.
- Daniel picks the look from the A-28 mockups (`out/a28-mockups/`, PNG files outside git).
  Phase 2 waits for the pick.
  2026-11-27 (PM): the look pick is a PM decision, recorded in plan.md Status: mockup c2.

## Open questions (the defaults apply)

1. Does the student choose which held missile to answer? Default: no. The core picks the active
   missile in a seeded order, and the card shows its choices.
