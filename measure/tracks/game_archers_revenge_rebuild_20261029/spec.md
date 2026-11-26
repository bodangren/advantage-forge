# Specification: Rebuild Archer's Revenge as an aim and shoot game

## Overview

Archer's Revenge is an aim and shoot game in a side view, like a slingshot game. It is in family 4
of `docs/apk-2d3d-program.md`: drag to aim, release to shoot. Today it plays on the Monster
Encounters battle stage, and the student taps a lane button. This track rebuilds the rules core and
both views, so that the game has its own scene and its own play.

The archer stands on a hill. Wooden towers hold targets: skeleton archers with word shields. The
student drags back to aim and to set the power, then releases. The arrow flies on an arc that the
core calculates, so a replay gives the same result. Helper mode shows a dotted path. The right word
breaks its target. A wrong word bounces. A miss counts as no attempt, so the evidence measures
reading, not aim.

Effort: about 4 days.

## Dates

- Ready on Forge master: 2026-11-10.
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

- `src/games/archers-revenge/view/game.ts` imports `BattleStage` from
  `src/games/shared/battle/stage3d.ts`.
- `src/games/archers-revenge/view2d/game.ts` imports `BattleStage2D` from
  `src/games/shared/battle/stage2d.ts`.
- `src/games/archers-revenge/manifest.ts` lists the Sunken Vault battle set in `MODELS_3D` and
  `background.monster-encounters` in `FILES_2D`.
- The core command is `fire(lane)`. The student taps one of 3 lane buttons (2 in Helper mode). No
  aim control exists.
- The old track is [game_archers_revenge_20260928](../game_archers_revenge_20260928/spec.md). The
  old design is [game-archers-revenge-3d.md](../../../docs/game-archers-revenge-3d.md).

## The game after the rebuild

- The view is a side view. The archer is the student's avatar. It stands on a hill.
- Wooden towers hold the targets. Each target is a skeleton archer with a word shield. The assets
  `skeleton-archer` and `tower` exist. The picked look decides the hill and the towers.
- The card shows the Thai meaning. One target shows the English word with that meaning.
- The student drags back to aim and to set the power, then releases. No timer runs.
- The arrow flies on the arc that the core calculates. In Helper mode a dotted path shows the arc.
- Right target: the arrow breaks the target. The coins and the streak grow, and the next meaning
  comes.
- Wrong target: the arrow bounces off the shield. The target shuts for this meaning, and the enemy
  strikes back (courage -1). At 0 courage the team rests and returns with 3.
- Miss: the arrow hits the ground, a tower, or nothing. Nothing else happens, and no attempt counts.

## Functional Requirements

1. **FR-1 The aim command.** `fire(lane)` becomes `fire(angle, power)`. The angle and the power
   use fixed steps. Default: the angle in whole degrees and the power in whole percent. The core
   rejects a value outside its range with a `rejected` event. The strategy role sets the ranges.
2. **FR-2 The arc.** The core calculates the arrow path from the hill, the angle, the power, and a
   fixed gravity, in fixed time steps. The same command gives the same path on every device.
3. **FR-3 Same numbers on every engine.** The path uses only addition, subtraction,
   multiplication, and division, and a fixed sine table per whole degree. The path does not call
   `Math.sin`, `Math.cos`, or `Math.random`. JavaScript engines can give different last bits for
   `Math.sin` and `Math.cos`.
4. **FR-4 The hit test.** The core finds the first object that the path touches: a target, a tower
   body, the ground, or the edge of the scene. The target and tower places are core data.
5. **FR-5 Right target.** The arrow breaks the target. The coins and the streak change as today.
6. **FR-6 Wrong target.** The arrow bounces. One attempt counts. The target shuts for this meaning,
   and the enemy strikes (courage -1). At 0 courage the team rests and returns with 3.
7. **FR-7 A miss is no attempt.** An arrow that hits the ground, a tower body, the edge, or a shut
   target changes no evidence counter, no courage, and no streak. See open question 1.
8. **FR-8 The helper path.** The core gives the path for an angle and a power as a pure function.
   In Helper mode the view draws that path as a dotted line. Helper mode keeps 2 targets, as today.
9. **FR-9 The evidence stays.** One `word` item per story word. `attempts` counts the arrows that
   hit a word target while the word was the prompt. `correctFirstTry` is true when the first such
   arrow hit the right target.
10. **FR-10 Replay.** The same input, seed, options, and commands give the same events and the same
    final state.
11. **FR-11 The QC bot.** `qc/bot.ts` plays a full run to `victory` from the state alone. It uses
    the core path function to find an angle and a power that hit the right target.
12. **FR-12 The 3D view.** A three.js side view shows the hill, the towers, and the skeleton
    archers with their word shields. It also shows the arrow on its arc and the student's avatar as
    the archer. The
    drag to aim control works with touch and with a mouse. No file of the game imports
    `src/games/shared/battle/stage3d.ts`.
13. **FR-13 The 2D view.** A Phaser view shows the same scene from the same core, with the same
    drag to aim control. It does not use `BattleStage2D` from `src/games/shared/battle/stage2d.ts`
    or the `background.monster-encounters` file.
14. **FR-14 The manifest.** `MODELS_3D`, `FILES_2D`, and the packs list the models and the sprites
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
- No file in `src/games/archers-revenge/` imports `src/games/shared/battle/stage3d.ts` or
  `src/games/shared/battle/stage2d.ts`.
- The QC bot plays a full run in 3D and in 2D with no page error and no diagnostic. The QC run
  uses a real drag on the canvas.
- One frame in 3D and one frame in 2D are in the plan with SHA-256. Beside the frames of the other
  three rebuild games and of Monster Encounters, the scene is different.
- `docs/game-archers-revenge-3d.md` describes the rebuilt game.
- One report went to the PM. It names the Forge commit, the frames with SHA-256, and the handoff
  file.

## Out of Scope

- RPG Battle keeps its party battle (Daniel, 2026-10-28).
- Monster Encounters keeps the battle stage. This track does not change
  `src/games/shared/battle/`.
- Rune Match goes on Daniel's look list. No rework starts until he asks.
- Abyssal Well, the other game of family 4. It can use the aim control later in its own track.
- Any monorepo write. The PM routes the cartridge sync to the monorepo session.
- The game video. The PR session rebuilds it after the report.
- The other three games. Each one has its own rebuild track.

## Open owner decisions

- Daniel decides whether the four games stay live in Primary until the fix. The PM asks him on
  2026-10-29. Default: keep them live.
- Daniel picks the look from the A-28 mockups (`out/a28-mockups/`, PNG files outside git).
  Phase 2 waits for the pick.
  2026-11-27 (PM): the look pick is a PM decision, recorded in plan.md Status: mockup c1.

## Open questions (the defaults apply)

1. What happens when an arrow hits a shut target? Default: the arrow bounces, and the core treats
   it as a miss. No attempt counts and no courage falls.
2. Does the dotted path show the full arc in Helper mode? Default: yes. The path does not show in
   the normal mode.
