# Specification: Rebuild Paladin's Twin Soul as a chapel shooter

## Overview

Paladin's Twin Soul is a shooter in a fixed view, like the legacy space shooter. Today it plays on
the Monster Encounters battle stage, and battle monsters fight the party. This track rebuilds the
rules core and both views, so that the game has its own scene and its own play.

The paladin stands at the bottom of a haunted chapel. A formation of shades floats above, and each
shade holds an English word. A captor shade holds the twin soul. The student taps a shade, and the
paladin fires a holy bolt. Right: the captor breaks, and the soul flies down and stays beside the
paladin. Wrong: the shade fades, and a shade dives (courage -1).

Effort: 2 to 3 days.

## Dates

- Ready on Forge master: 2026-11-07.
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

- `src/games/paladins-twin-soul/view/game.ts` imports `BattleStage` from
  `src/games/shared/battle/stage3d.ts`.
- `src/games/paladins-twin-soul/view2d/game.ts` imports `BattleStage2D` from
  `src/games/shared/battle/stage2d.ts`.
- `src/games/paladins-twin-soul/manifest.ts` lists the Sunken Vault battle set in `MODELS_3D` and
  `background.monster-encounters` in `FILES_2D`.
- The core holds a battle monster (`skeleton`, `mimic`, then `dragon-fire`). A monster falls after
  4 souls. The heroes strike the monster in turn, and the monster strikes after a wrong shade.
- The old track is [game_paladins_twin_soul_20260928](../game_paladins_twin_soul_20260928/spec.md).
  The old design is [game-paladins-twin-soul-3d.md](../../../docs/game-paladins-twin-soul-3d.md).

## The game after the rebuild

- The view is a shooter view. The paladin is the student's avatar. It stands at the bottom of a
  haunted chapel.
- A formation of shades floats above the paladin. Each shade holds one English word. The assets
  `specter`, `wraith`, and `ghost` exist. The picked look decides the chapel and the shades.
- The card shows the Thai meaning. A captor shade holds the twin soul of that word.
- The student taps a shade. The paladin fires a holy bolt at it. No timer runs.
- Right shade: the captor breaks. The soul, a glowing twin of the paladin, flies down and stays
  beside the paladin. The other shades scatter, and the next wave comes.
- Wrong shade: the shade fades. A shade dives at the paladin (courage -1). At 0 courage the team
  rests and returns with 3.
- The run ends when every soul is free. No monster appears.

## Functional Requirements

1. **FR-1 Keep the waves, the shades, the captor, and the soul count.** One wave per target word.
   Six shades per wave, or four in Helper mode. One shade per wave is the captor. `twins` counts the
   free souls.
2. **FR-2 Remove the battle monsters.** The state has no monster. The core emits no
   `monsterAppeared`, `monsterDefeated`, or `heroStrike` event. The `skeleton`, `mimic`, and
   `dragon-fire` kinds leave the core.
3. **FR-3 The holy bolt.** A `strike` on a shade fires one holy bolt at that shade.
4. **FR-4 Right shade.** The captor breaks. The soul goes free, `twins` grows by 1, and the
   score grows as today. The other shades scatter, and the next wave starts.
5. **FR-5 Wrong shade.** The shade fades and stays out for this wave. One standing shade dives at
   the paladin (courage -1). Default: the core picks the diving shade in a seeded order, and the
   diving shade returns to its place. At 0 courage the team rests and returns with 3.
6. **FR-6 The shade kinds.** Each shade has a kind: `specter`, `wraith`, or `ghost`. The core sets
   the kind in a seeded order, so both views draw the same shade.
7. **FR-7 The captor looks like the other shades.** No view marks the captor before a right strike. The captor has no kind, color,
   or place that differs from the other shades.
8. **FR-8 The evidence stays.** One `word` item per story word. `attempts` counts the shades struck
   for that word. `correctFirstTry` is true when the first shade struck was the captor.
9. **FR-9 Replay.** The same input, seed, options, and commands give the same events and the same
   final state.
10. **FR-10 The QC bot.** `qc/bot.ts` plays a full run to `victory` from the state alone. It
    strikes the captor.
11. **FR-11 The 3D view.** A three.js view shows the chapel and the formation of shades with
    their words. It also shows the bolt, the dive, the free souls, and the student's avatar as the
    paladin. No file of the game imports `src/games/shared/battle/stage3d.ts`.
12. **FR-12 The 2D view.** A Phaser view shows the same scene from the same core. It does not use
    `BattleStage2D` from `src/games/shared/battle/stage2d.ts` or the
    `background.monster-encounters` file.
13. **FR-13 The manifest.** `MODELS_3D`, `FILES_2D`, and the packs list the models and the sprites
    of the picked look. They do not list `dragon-fire`, `mimic`, or `skeleton` for this game. The
    pack binding test and the budget test pass.

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
- No file in `src/games/paladins-twin-soul/` imports `src/games/shared/battle/stage3d.ts` or
  `src/games/shared/battle/stage2d.ts`.
- The QC bot plays a full run in 3D and in 2D with no page error and no diagnostic.
- One frame in 3D and one frame in 2D are in the plan with SHA-256. Beside the frames of the other
  three rebuild games and of Monster Encounters, the scene is different.
- `docs/game-paladins-twin-soul-3d.md` describes the rebuilt game.
- One report went to the PM. It names the Forge commit, the frames with SHA-256, and the handoff
  file.

## Out of Scope

- RPG Battle keeps its party battle (Daniel, 2026-10-28). Commit `1e147404` also built RPG Battle.
  This track does not change it.
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

1. Which shade dives after a wrong strike? Default: the core picks a standing shade in a seeded
   order. The shade dives, the courage falls by 1, and the shade returns to its place.
