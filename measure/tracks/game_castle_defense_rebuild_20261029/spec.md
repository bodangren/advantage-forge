# Specification: Rebuild Castle Defense as a tower defense game

## Overview

Castle Defense is a tower defense game. Daniel put it in family 6 of `docs/apk-2d3d-program.md` on
2026-10-08. Today it plays on the Monster Encounters battle stage with no tower, no wall, and no
wave on a path. This track rebuilds the rules core and both views, so that the game has its own
scene and its own play.

A path runs from a gate to the castle, with 5 or 6 build spots beside it. Each built sentence gives
one tower, and the student picks its spot. The wave then moves along the path in steps, and the
towers in range shoot. An attacker that gets through costs one castle heart. At 0 hearts the heroes
rest, so no game over occurs.

Effort: 4 to 5 days.

## Dates

- Ready on Forge master: 2026-11-12.
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

- `src/games/castle-defense/view/game.ts` imports `BattleStage` from
  `src/games/shared/battle/stage3d.ts`.
- `src/games/castle-defense/view2d/game.ts` imports `BattleStage2D` from
  `src/games/shared/battle/stage2d.ts`.
- `src/games/castle-defense/manifest.ts` lists the Sunken Vault battle set in `MODELS_3D` and
  `background.monster-encounters` in `FILES_2D`.
- The core has 3 posts, one per hero, and no path. A tower shows as a burst over its hero. The
  towers fire volleys at the front attacker until the wave falls, so the post does not change the
  result of a wave.
- The 2026-10-08 note in the old spec says that the 2026-10-03 build already follows family 6. The
  note is wrong. This track adds a dated correction line below it.
- The old track is [game_castle_defense_20260928](../game_castle_defense_20260928/spec.md). The old
  design is [game-castle-defense-3d.md](../../../docs/game-castle-defense-3d.md).

## The game after the rebuild

- A path runs from a gate to the castle. Build spots stand beside the path. The assets `gate`,
  `wall-gate`, `tower`, `footpath-straight`, and `footpath-corner` exist. The picked look decides
  the scene and the camera.
- Each wave is one sentence of the story. The student builds the sentence word by word from the
  card. No timer runs.
- When the sentence is built, the student picks a spot for its tower.
- The wave then moves along the path in steps. On each step, the towers in range shoot.
- An attacker that reaches the castle costs one castle heart.
- At 0 hearts the heroes rest, and the hearts return. No game over occurs.
- The student's avatar defends the castle. Speed never gives XP.

## Functional Requirements

1. **FR-1 Keep the sentence building.** `pick(choice)` builds the sentence word by word, as today.
   The card holds 3 words, or 2 in Helper mode. A wrong word shuts for this step and costs one
   castle heart, as today.
2. **FR-2 The path and the spots.** The core holds the path from the gate to the castle as a list
   of steps, and 5 or 6 build spots beside it. Each spot has a range in path steps. The layout is
   core data. Default: 6 spots. Phase 2 sets the final layout to match the picked look.
3. **FR-3 The placement.** After the sentence is built, `build(spot)` places one tower on the spot
   that the student picks. Default: a tower on a built spot raises its level, as the posts do today.
4. **FR-4 A wave in steps.** After the placement, the wave moves along the path one step at a time.
   On each step, each tower with an attacker in range hits the front attacker in its range. A tower
   of level n hits n times. All steps of a wave play as events of one `build` command. No timer
   runs.
5. **FR-5 An attacker gets through.** An attacker that reaches the castle costs one castle heart
   and leaves the path. When the hearts reach 0, the heroes rest and the hearts return.
6. **FR-6 The placement changes the result.** For one fixed wave, two different spots give
   different numbers of attackers through, or different hearts.
7. **FR-7 Remove the posts.** The state has no hero posts and no `keeperOf`. The core emits no
   volley at the gate.
8. **FR-8 The evidence stays.** One `sentence` item per sentence. `attempts` is the wrong words
   plus 1. `correctFirstTry` is true when no word was wrong. Hearts lost to attackers do not change
   the evidence.
9. **FR-9 Replay.** The same input, seed, options, and commands give the same events and the same
   final state.
10. **FR-10 The QC bot.** `qc/bot.ts` plays a full run to `victory` from the state alone. It picks
    the right words. Then it picks the spot that covers the most path steps, with the lowest index
    on a tie.
11. **FR-11 The 3D view.** A three.js view shows the gate, the path, the build spots, and the
    towers. It also shows the castle with its hearts, the attackers on the path, and the student's
    avatar. No file of
    the game imports `src/games/shared/battle/stage3d.ts`.
12. **FR-12 The 2D view.** A Phaser view shows the same scene from the same core. It does not use
    `BattleStage2D` from `src/games/shared/battle/stage2d.ts` or the
    `background.monster-encounters` file.
13. **FR-13 The manifest.** `MODELS_3D`, `FILES_2D`, and the packs list the models and the sprites
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
- No file in `src/games/castle-defense/` imports `src/games/shared/battle/stage3d.ts` or
  `src/games/shared/battle/stage2d.ts`.
- The QC bot plays a full run in 3D and in 2D with no page error and no diagnostic.
- One frame in 3D and one frame in 2D are in the plan with SHA-256. Beside the frames of the other
  three rebuild games and of Monster Encounters, the scene is different. The frame shows the path
  and the spots. One more frame from the QC run shows at least one tower on its spot.
- `docs/game-castle-defense-3d.md` describes the rebuilt game.
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

1. Does a wrong word still cost a castle heart? Default: yes, as today. The plan says to keep the
   sentence building.
2. Can a student build on a spot that holds a tower? Default: yes. The tower gets one level higher,
   as the posts do today.
