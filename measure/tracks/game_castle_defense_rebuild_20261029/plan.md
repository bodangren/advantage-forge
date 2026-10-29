# Rebuild Castle Defense as a tower defense game

Status: new (2026-10-29). The [specification](./spec.md) owns the scope and the acceptance gates.
Ready on Forge master on 2026-11-12 if Daniel picks the look by 2026-10-31. Each day of delay moves
the date by one day.

## Method and ownership

- Primary owner: the Measure orchestrator for this track. Red writes the tests. Green changes the
  core, the bot, and the views.
- The `measure-strategy` role writes `test-strategy.md` in this folder before Phase 1 starts.
- Owned source path: `src/games/castle-defense/`.
- Owned test path: `tests/games/castle-defense/`.
- Owned design path: `docs/game-castle-defense-3d.md` (Phase 2).
- Owned planning paths: `measure/tracks/game_castle_defense_rebuild_20261029/`, and the dated
  correction line in `measure/tracks/game_castle_defense_20260928/spec.md`.
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
  -k 30 300 node_modules/.bin/vitest run tests/games/castle-defense --maxWorkers=1'`
- `GREEN_TEST_COMMAND` (Phase 1): the same command. It must exit 0.
- `VIEW_TEST_COMMAND` (Phase 2): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
  -k 30 600 node_modules/.bin/vitest run tests/games/castle-defense tests/apk3d/pack-bindings.test.ts
  tests/apk3d/budget.test.ts --maxWorkers=1'`
- `TYPE_CHECK_COMMAND`: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30
  600 node node_modules/typescript/bin/tsc --noEmit'`. The strategy role records the baseline error
  count. The owned errors must be 0. The total must not be above the baseline.
- Frame command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node
  --import tsx scripts/apk3d-shot.ts both --game castle-defense --first'`, then the same command
  with `--2d`.
- QC run command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node
  --import tsx scripts/apk3d-shot.ts both --game castle-defense'`, then the same command with `--2d`.

## Phase 1: Rules core

Starts 2026-10-29. This phase does not depend on the look. Roles: Red writes the failing tests and
records the failing run. Green changes the core and the bot and runs the tests again.

The old views stay on the battle stage in this phase. Green makes only the smallest view edits that
keep the type check clean. No sync goes to the monorepo before Phase 2 ends.

- [x] Task: Write the failing path, spot, and wave tests (Red). Test commit: `957d72af`.
  Owned paths: `tests/games/castle-defense/rules.test.ts`, `replay.test.ts`, `bot.test.ts`,
  `driver.test.ts`, and `helpers.ts` in that folder.
  Test these rows: the sentence building and its wrong-word rule stay as today; the core holds a
  path of steps and 5 or 6 spots, each with a range; `build(spot)` places the tower on the picked
  spot; the wave moves in steps, and only towers with an attacker in range shoot; an attacker that
  reaches the castle costs one heart; the rest at 0 hearts returns the hearts; for one fixed wave,
  two different spots give a different result; the state has no hero posts; the evidence per
  sentence stays as today; the same seed and commands give the same events; the bot plays a full
  run to `victory`; the driver plays every new core event.
  Run `RED_TEST_COMMAND`. Record the command, the exit code, and the number of failures.
  Commit the tests alone, by explicit paths.

  Red evidence (2026-10-29, role `measure-mid-red`, Anthropic):
  - `phase_base_sha`: `dde11f04c1fee76aafe7b1a3093d0bb9a1c73a60`. `role_base_sha`:
    `9c0b400e023665d3d66b8b8d044d7b4f69876772`.
  - Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300
    node_modules/.bin/vitest run tests/games/castle-defense --maxWorkers=1'`.
  - Exit code: 1. `Test Files  4 failed | 1 passed (5)`. `Tests  65 failed | 25 passed (90)`.
  - Each failure is an `AssertionError`. The log has 0 `TypeError` lines and 0 unhandled errors. No
    file failed to load.
  - The failing rows: B1 (32 cases), B2, D1 (3 cases), D2, D3, S3, L1 to L4, P1 to P3, W1 to W9 (10
    tests, W5 has 2), F1, F2, X1 to X3, E2, E3, R1, and R3.
  - The passing guard rows: S1, S2, S4, S5, E1, E4, R2, R4, B3, D4 (2 tests), A-core, 2 content
    guards, 3 run guards in `rules.test.ts`, 1 replay guard, 1 bot guard, and the 6 tests of
    `manifest.test.ts`.
  - Type check: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node
    node_modules/typescript/bin/tsc --noEmit'`. Exit code: 2. Total errors: 132.
  - Errors in `tests/games/castle-defense/`: 68 (rules 41, driver 17, helpers 4, bot 3, replay 3).
    These are the intended Red errors. Green must bring them to 0.
  - Errors in `src/games/castle-defense/`: 0.
  - The other 64 errors are not in a path of this track: the 31 of the baseline,
    `src/storytime/book-pictures.ts` 2, and `tests/games/magic-defense/` 31. Other sessions own them.
  - Run logs (not in git): `measure/runs/game_castle_defense_rebuild_20261029/red-vitest-957d72a.log`
    and `red-tsc-957d72a.log`.

  Contract details that the tests fix (the strategy names stay; these fill the open points):
  - The core exports the type `Spot` (`{ spot: number; covers: number[]; level: number }`).
  - `waveStep.moves` is a list of `{ enemyId: string; at: number }`. `at` is the position after the
    move. It has one entry for each living attacker that has not got through.
  - An attacker reaches the castle when its move gives `at === path.length`. Its `attackerThrough`
    event follows the `waveStep` event of that step.
  - On one step, the built spots shoot in ascending spot order. The `shots` list keeps that order.
  - The `Presentation` of `view/driver.ts` changes: `strike(attacker, hearts)`,
    `showSpots(spots, build)`, `hideSpots()`, `towerBuilt(spot, level)`,
    `waveStep(step, attackers, shots)`, and `through(attacker, hearts)`. `showPosts`, `hidePosts`,
    and `volley` go. `ShotShown` is `{ spot, attacker, hits, fell }`. The driver calls only
    `Presentation` methods. D1 and D2 fail on a call to another method.

  Row changes from the strategy:
  - E1 places the tower through the bot command. The row then stays a guard at Red and at Green.
  - E2 compares the heart losses (the `attackerThrough` count), not the final hearts. A rest at 0
    hearts can make two final heart values equal.
  - A-core needs at least one import in `sim.ts` and in the scan. `types.ts` has no import today, so
    the rule "one import line per file" cannot hold for a guard row.
  - The W5 note test reads the top comment of `core/sim.ts`. It needs `Event order`, `waveStep`, and
    `attackerThrough`, and no `volley`.
  - S1 also checks the Helper mode card. B2 adds two made-up spot lists for the tie rule.
  - The test names mark the defaults Q1 (S3), Q2 (P2), Q3 (L1, P3), and Q4 (W4) as assumptions.
  - Deviation: the task did not get the `[~]` mark before the work started. The test commit and this
    record came in one session.
- [ ] Task: Add the path, the spots, and the wave in steps to the core (Green).
  Owned path: `src/games/castle-defense/core/`.
  Keep the sentence building and the evidence. Replace the hero posts and the volleys with the
  path, the spots with a range, and the wave in steps. Update the event order note at the top of
  `core/sim.ts`.
- [ ] Task: Update the QC bot for the new core (Green).
  Owned path: `src/games/castle-defense/qc/bot.ts`.
  The bot picks the right words. Then it picks the spot that covers the most path steps, with the
  lowest index on a tie.
- [ ] Task: Keep the old views compiling and run the gates (Green).
  Owned paths: `src/games/castle-defense/view/driver.ts`, and the smallest edits in `view/` and
  `view2d/` that the type check needs.
  Run `GREEN_TEST_COMMAND` and `TYPE_CHECK_COMMAND`. Record the exit codes, the test counts, the
  owned errors, and the total errors.

## Phase 2: Views

Status: blocked until Daniel picks the look of Castle Defense from the A-28 mockups
(`out/a28-mockups/`, PNG files outside git). The PM relays the pick. Record the pick, its date, and
the mockup file name here before the first task starts.

Roles: Red writes the failing view tests. Green builds both views, runs the QC bot, renders the
frames, updates the design, and sends the report.

- [ ] Task: Write the failing view tests (Red).
  Owned paths: `tests/games/castle-defense/manifest.test.ts` and a new
  `tests/games/castle-defense/scene.test.ts`.
  Test these rows: no file in `src/games/castle-defense/` imports
  `src/games/shared/battle/stage3d.ts` or `src/games/shared/battle/stage2d.ts`; `MODELS_3D` and
  `FILES_2D` list the models and the sprites of the picked look; `FILES_2D` does not list
  `background.monster-encounters`; the core layout matches the spots of the picked look.
  Run `VIEW_TEST_COMMAND`. Record the failing result. Commit the tests alone, by explicit paths.
- [ ] Task: Build the 3D view on the picked look (Green).
  Owned paths: `src/games/castle-defense/view/`, `manifest.ts`, `briefing.ts`, and
  `strings.en.ts`, and the layout data in `src/games/castle-defense/core/`.
  Show the gate, the path, the spots, and the towers.
  Show the castle with its hearts, the attackers on the path, and the student's avatar. Set the core
  layout to the spots of the picked look. Register every new model in the manifest and in a pack.
- [ ] Task: Build the Phaser 2D view on the same core (Green).
  Owned path: `src/games/castle-defense/view2d/`.
  Show the same scene from the same core. Add the 2D sprites and the baked background of the picked
  look to the 2D pack.
- [ ] Task: Run the QC bot in 3D and in 2D (Green).
  Add a QC player for this game to `scripts/apk3d-shot.ts` when it has none.
  Run the QC run command in 3D and in 2D. Record the exit codes, the page errors, and the
  diagnostics. Run `VIEW_TEST_COMMAND` and `TYPE_CHECK_COMMAND` again and record the results.
- [ ] Task: Render one frame of the game and compare it across games (Green).
  Run the frame command in 3D and in 2D. Look at each frame. The frame shows the path and the spots.
  Take one more frame from the QC run that shows at least one tower on its spot.
  Put each frame beside one frame of each other rebuild game and of Monster Encounters. Record that
  the scenes differ, the three largest differences from the picked mockup, and each path with its
  SHA-256.
- [ ] Task: Update the design document (Green).
  Owned path: `docs/game-castle-defense-3d.md`.
  Describe the rebuilt scene, the rules, the commands, the events, the evidence, and the screens.
- [ ] Task: Send the report to the PM (Green).
  Run `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/apk-release.ts --check'`. When it lists stale models, run it with `--commit`.
  Run `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/monorepo-handoff.ts --target <branch>'`. The PM names the branch.
  Send one status line to the PM. It names the Forge commit, the frames with SHA-256, and the
  handoff file. The PR session then rebuilds the game video, and the PM routes the cartridge sync.
