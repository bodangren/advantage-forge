# Rebuild Magic Defense as a missile defense game

Status: new (2026-10-29). The [specification](./spec.md) owns the scope and the acceptance gates.
Ready on Forge master on 2026-11-05 if Daniel picks the look by 2026-10-31. Each day of delay moves
the date by one day.

## Method and ownership

- Primary owner: the Measure orchestrator for this track. Red writes the tests. Green changes the
  core, the bot, and the views.
- The `measure-strategy` role writes `test-strategy.md` in this folder before Phase 1 starts.
- Owned source path: `src/games/magic-defense/`.
- Owned test path: `tests/games/magic-defense/`.
- Owned design path: `docs/game-magic-defense-3d.md` (Phase 2).
- Owned planning path: `measure/tracks/game_magic_defense_rebuild_20261029/`.
- Shared paths, owned only for the part of this game: `scripts/apk3d-shot.ts` (a QC player for this
  game), `src/apk3d/contracts/model-pack.ts` and `scripts/demo-models.ts` (the models of the look),
  and the 2D scripts `scripts/apk2d-sprites.ts`, `scripts/apk2d-bake.ts`, and
  `scripts/apk2d-pack.ts`. Other sessions can work in these files. Stage and commit explicit paths.
- Do not change `src/games/shared/battle/`. Monster Encounters and RPG Battle use it.
- Do not change `src/games/rune-match/`, `src/games/rpg-battle/`, or
  `src/games/monster-encounters/`.
- Do not change `measure/tracks.md` or `measure/generated/*`. Another session owns those paths.
  The registry entry and the generator run are closeout items. `metadata.json` records them.
- Run every build, render, test, vite, or Chrome run with one command:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
- Exit code 75 means hold. Record `lock wait over 600 s` and stop the run.
- The machine has 7.1 GB of RAM. One heavy job runs at a time.
- No session writes in the monorepo. The PM routes the cartridge sync.
- The rating is G. No paid generation runs in this track.

### Gate commands

- `RED_TEST_COMMAND` (Phase 1): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
  -k 30 300 node_modules/.bin/vitest run tests/games/magic-defense --maxWorkers=1'`
- `GREEN_TEST_COMMAND` (Phase 1): the same command. It must exit 0.
- `VIEW_TEST_COMMAND` (Phase 2): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
  -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense tests/apk3d/pack-bindings.test.ts
  tests/apk3d/budget.test.ts --maxWorkers=1'`
- `TYPE_CHECK_COMMAND`: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30
  600 node node_modules/typescript/bin/tsc --noEmit'`. The strategy role records the baseline error
  count. The owned errors must be 0. The total must not be above the baseline.
- Frame command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node
  --import tsx scripts/apk3d-shot.ts both --game magic-defense --first'`, then the same command with
  `--2d`.
- QC run command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node
  --import tsx scripts/apk3d-shot.ts both --game magic-defense'`, then the same command with `--2d`.

## Phase 1: Rules core

Starts 2026-10-29. This phase does not depend on the look. Roles: Red writes the failing tests and
records the failing run. Green changes the core and the bot and runs the tests again.

The old views stay on the battle stage in this phase. Green makes only the smallest view edits that
keep the type check clean. No sync goes to the monorepo before Phase 2 ends.

- [x] Task: Write the failing held-missile tests (Red). Test commit `51d52a0b`.
  Owned paths: `tests/games/magic-defense/rules.test.ts`, `replay.test.ts`, `bot.test.ts`,
  `driver.test.ts`, and `helpers.ts` in that folder.
  Test these rows: each standing castle holds at most one missile; a held missile keeps its castle
  and its Thai meaning until an answer; `tick` changes nothing; a right word breaks the active
  missile; a wrong word takes one heart from the castle of the missile, shuts the word, and keeps
  the meaning in play; the storm mends every castle and keeps the held missiles; the rest restores
  every castle; the evidence per word stays as today; the same seed and commands give the same
  events; the bot plays a full run to `victory`; the driver plays every new core event.
  Run `RED_TEST_COMMAND`. Record the command, the exit code, and the number of failures.
  Commit the tests alone, by explicit paths.
  - Red evidence (2026-10-29, role `measure-mid-red`, role base `9c0b400e`, phase base
    `0c5e7ea2`). The test commit `51d52a0b` holds only the five owned test paths.
  - Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300
    node_modules/.bin/vitest run tests/games/magic-defense --maxWorkers=1'`. The run started at
    2026-10-29T03:03:37Z and ended at 03:04:28Z.
  - Exit code: 1. `Test Files: 4 failed, 1 passed (5)`. `Tests: 78 failed, 23 passed (101)`.
  - Every failure is an `AssertionError`. No failure is a `TypeError` or a load error.
    `manifest.test.ts` passes (6 tests).
  - The 78 failures per row: H1 2, H2 1, H3 1, H4 1, H5 1, H6 2, H7 1, H8 3, H9 1, H10 2, H11 1,
    H12 1, H13 25, H14 2, H15 4, H16 30.
  - The failure reasons: `state.missiles` is not a list (the helpers `missilesOf` and `active`),
    `missileThrown` never occurs, `MAGIC_DEFENSE_EVENT_TYPES` does not list `missileThrown`, and
    `throwMissile` is never called.
  - The 23 passing tests are the rows of today that the strategy keeps: 5 content rows, the Helper
    row, the right-spell row, the mana cap, the commands after the victory, the declared event
    types, the empty input, the evidence row, 3 replay rows, 2 driver rows, and 6 manifest rows.
  - Type check (`TYPE_CHECK_COMMAND`, 2026-10-29T03:08:23Z to 03:12:23Z): exit 2, 136 errors in
    total. The owned errors: 0 in `src/games/magic-defense/` and 35 in
    `tests/games/magic-defense/`. Each owned error names a new contract name: `HeldMissile`,
    `missiles`, `activeMissileId`, `missileThrown`, or `throwMissile`. The other 101 errors: 31
    of the baseline (`assets/` 30, `tests/part.test.ts` 1), 68 in `tests/games/castle-defense/`,
    and 2 in `src/storytime/book-pictures.ts`. Other sessions own those two paths.
  - Feasibility check: a throwaway prototype core in `/tmp/md-proto` (outside the repository)
    passed the 95 rule, replay, bot, and driver tests. The tests type-check with 0 errors against
    that prototype. The mutations M6, M8, M12, and M15 on the prototype made H5, H7, H10, and H13
    fail. No production file of the repository changed.
  - Contract names (strategy section 2, no rename): `HeldMissile`, `state.missiles`,
    `state.activeMissileId`, the event `{ type: 'missileThrown'; missile: HeldMissile }`,
    `MAGIC_DEFENSE_EVENT_TYPES` with `missileThrown`, and
    `Presentation.throwMissile(missile, enemy)`. `HeldMissile` is exported from `core/index.ts`.
  - Rules that the tests fix for Green: every held missile enters the state through one
    `missileThrown` event; after each command, the held count equals the smaller of the standing
    castles and the unsolved words of the current wave, also after a storm (ASM-4); after a right
    cast, the free place takes the first unheld word of the wave in target order (H6); after a
    wrong cast with no fall, the same missile stays (same id); when the castle of the active
    meaning falls and every standing castle holds a missile, the meaning must take the place of
    one missile, and the tests do not fix which one; `start` emits one `missileThrown` per held
    missile between `waveAppeared` and `roundShown`.
  - Logs (not committed, as for the strategy logs):
    `measure/runs/game_magic_defense_rebuild_20261029/mid-red-vitest.log` and `mid-red-tsc.log`.
- [~] Task: Add the held missile per castle to the core (Green).
  Owned path: `src/games/magic-defense/core/`.
  Keep `cast`, `storm`, the castles, and the hearts. Add the held missile per castle. Update the
  event order note at the top of `core/sim.ts`.
- [ ] Task: Update the QC bot for the new core (Green).
  Owned path: `src/games/magic-defense/qc/bot.ts`.
  The bot reads the active missile from the state and casts its right word.
- [ ] Task: Keep the old views compiling and run the gates (Green).
  Owned paths: `src/games/magic-defense/view/driver.ts`, and the smallest edits in `view/` and
  `view2d/` that the type check needs.
  Run `GREEN_TEST_COMMAND` and `TYPE_CHECK_COMMAND`. Record the exit codes, the test counts, the
  owned errors, and the total errors.

## Phase 2: Views

Status: blocked until Daniel picks the look of Magic Defense from the A-28 mockups
(`out/a28-mockups/`, PNG files outside git). The PM relays the pick. Record the pick, its date, and
the mockup file name here before the first task starts.

Roles: Red writes the failing view tests. Green builds both views, runs the QC bot, renders the
frames, updates the design, and sends the report.

- [ ] Task: Write the failing view tests (Red).
  Owned paths: `tests/games/magic-defense/manifest.test.ts` and a new
  `tests/games/magic-defense/scene.test.ts`.
  Test these rows: no file in `src/games/magic-defense/` imports
  `src/games/shared/battle/stage3d.ts` or `src/games/shared/battle/stage2d.ts`; `MODELS_3D` and
  `FILES_2D` list the models and the sprites of the picked look; `FILES_2D` does not list
  `background.monster-encounters`.
  Run `VIEW_TEST_COMMAND`. Record the failing result. Commit the tests alone, by explicit paths.
- [ ] Task: Build the 3D view on the picked look (Green).
  Owned paths: `src/games/magic-defense/view/`, `manifest.ts`, `briefing.ts`, and `strings.en.ts`.
  Show the plain, the castles, the far ridge, and the skeleton mages.
  Show the held missiles with their Thai meanings and the student's avatar. Register every new model
  in the manifest and in a pack.
- [ ] Task: Build the Phaser 2D view on the same core (Green).
  Owned path: `src/games/magic-defense/view2d/`.
  Show the same scene from the same core. Add the 2D sprites and the baked background of the picked
  look to the 2D pack.
- [ ] Task: Run the QC bot in 3D and in 2D (Green).
  Add a QC player for this game to `scripts/apk3d-shot.ts` when it has none.
  Run the QC run command in 3D and in 2D. Record the exit codes, the page errors, and the
  diagnostics. Run `VIEW_TEST_COMMAND` and `TYPE_CHECK_COMMAND` again and record the results.
- [ ] Task: Render one frame of the game and compare it across games (Green).
  Run the frame command in 3D and in 2D. Look at each frame.
  Put each frame beside one frame of each other rebuild game and of Monster Encounters. Record that
  the scenes differ, the three largest differences from the picked mockup, and each path with its
  SHA-256.
- [ ] Task: Update the design document (Green).
  Owned path: `docs/game-magic-defense-3d.md`.
  Describe the rebuilt scene, the rules, the commands, the events, the evidence, and the screens.
- [ ] Task: Send the report to the PM (Green).
  Run `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/apk-release.ts --check'`. When it lists stale models, run it with `--commit`.
  Run `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/monorepo-handoff.ts --target <branch>'`. The PM names the branch.
  Send one status line to the PM. It names the Forge commit, the frames with SHA-256, and the
  handoff file. The PR session then rebuilds the game video, and the PM routes the cartridge sync.
