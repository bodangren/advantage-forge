# Rebuild Archer's Revenge as an aim and shoot game

Status: new (2026-10-29). The [specification](./spec.md) owns the scope and the acceptance gates.
Ready on Forge master on 2026-11-10 if Daniel picks the look by 2026-10-31. Each day of delay moves
the date by one day.

## Method and ownership

- Primary owner: the Measure orchestrator for this track. Red writes the tests. Green changes the
  core, the bot, and the views.
- The `measure-strategy` role writes `test-strategy.md` in this folder before Phase 1 starts.
- Owned source path: `src/games/archers-revenge/`.
- Owned test path: `tests/games/archers-revenge/`.
- Owned design path: `docs/game-archers-revenge-3d.md` (Phase 2).
- Owned planning path: `measure/tracks/game_archers_revenge_rebuild_20261029/`.
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
  -k 30 300 node_modules/.bin/vitest run tests/games/archers-revenge --maxWorkers=1'`
- `GREEN_TEST_COMMAND` (Phase 1): the same command. It must exit 0.
- `VIEW_TEST_COMMAND` (Phase 2): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
  -k 30 600 node_modules/.bin/vitest run tests/games/archers-revenge
  tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1'`
- `TYPE_CHECK_COMMAND`: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30
  600 node node_modules/typescript/bin/tsc --noEmit'`. The strategy role records the baseline error
  count. The owned errors must be 0. The total must not be above the baseline.
- Frame command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node
  --import tsx scripts/apk3d-shot.ts both --game archers-revenge --first'`, then the same command
  with `--2d`.
- QC run command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node
  --import tsx scripts/apk3d-shot.ts both --game archers-revenge'`, then the same command with
  `--2d`.

## Phase 1: Rules core

Starts 2026-10-29. This phase does not depend on the look. Roles: Red writes the failing tests and
records the failing run. Green changes the core and the bot and runs the tests again.

The old views stay on the battle stage in this phase. Green makes only the smallest view edits that
keep the type check clean. No sync goes to the monorepo before Phase 2 ends.

- [ ] Task: Write the failing aim and arc tests (Red).
  Owned paths: `tests/games/archers-revenge/rules.test.ts`, `replay.test.ts`, `bot.test.ts`,
  `driver.test.ts`, and `helpers.ts` in that folder.
  Test these rows: `fire(angle, power)` replaces `fire(lane)`; the core rejects a value outside its
  range; the same angle and power give the same path and the same hit; the path module calls no
  `Math.sin`, `Math.cos`, or `Math.random`; a hit on the right target breaks it; a hit on a wrong
  target bounces, counts one attempt, shuts the target, and takes one courage; a miss changes no
  evidence counter, no courage, and no streak; the helper path function returns the same points as
  the shot; the evidence per word stays as today; the same seed and commands give the same events;
  the bot plays a full run to `victory`; the driver plays every new core event.
  Run `RED_TEST_COMMAND`. Record the command, the exit code, and the number of failures.
  Commit the tests alone, by explicit paths.
- [ ] Task: Add the aim command, the arc, and the hit test to the core (Green).
  Owned path: `src/games/archers-revenge/core/`.
  Change `fire(lane)` to `fire(angle, power)`. Add the path function with the fixed sine table, the
  target and tower places, and the hit test. Keep the evidence. Update the event order note at the
  top of `core/sim.ts`.
- [ ] Task: Update the QC bot for the new core (Green).
  Owned path: `src/games/archers-revenge/qc/bot.ts`.
  The bot searches the angle and power steps with the core path function. It fires the first pair
  that hits the right target.
- [ ] Task: Keep the old views compiling and run the gates (Green).
  Owned paths: `src/games/archers-revenge/view/driver.ts`, and the smallest edits in `view/` and
  `view2d/` that the type check needs.
  Run `GREEN_TEST_COMMAND` and `TYPE_CHECK_COMMAND`. Record the exit codes, the test counts, the
  owned errors, and the total errors.

## Phase 2: Views

Status: blocked until Daniel picks the look of Archer's Revenge from the A-28 mockups
(`out/a28-mockups/`, PNG files outside git). The PM relays the pick. Record the pick, its date, and
the mockup file name here before the first task starts.

Roles: Red writes the failing view tests. Green builds both views, runs the QC bot, renders the
frames, updates the design, and sends the report.

- [ ] Task: Write the failing view tests (Red).
  Owned paths: `tests/games/archers-revenge/manifest.test.ts` and a new
  `tests/games/archers-revenge/scene.test.ts`.
  Test these rows: no file in `src/games/archers-revenge/` imports
  `src/games/shared/battle/stage3d.ts` or `src/games/shared/battle/stage2d.ts`; `MODELS_3D` and
  `FILES_2D` list the models and the sprites of the picked look; `FILES_2D` does not list
  `background.monster-encounters`; a drag converts to the angle and power steps of the core.
  Run `VIEW_TEST_COMMAND`. Record the failing result. Commit the tests alone, by explicit paths.
- [ ] Task: Build the 3D view and the drag to aim control on the picked look (Green).
  Owned paths: `src/games/archers-revenge/view/`, `manifest.ts`, `briefing.ts`, and
  `strings.en.ts`.
  Show the hill, the towers, and the skeleton archers with their word shields.
  Show the arrow on its arc and the student's avatar as the archer. Draw the dotted path in Helper
  mode. Register every new model in the manifest and in a pack.
- [ ] Task: Build the Phaser 2D view on the same core (Green).
  Owned path: `src/games/archers-revenge/view2d/`.
  Show the same scene from the same core, with the same drag to aim control. Add the 2D sprites and
  the baked background of the picked look to the 2D pack.
- [ ] Task: Run the QC bot in 3D and in 2D (Green).
  Add a QC player for this game to `scripts/apk3d-shot.ts` when it has none. The player uses a real
  drag on the canvas.
  Run the QC run command in 3D and in 2D. Record the exit codes, the page errors, and the
  diagnostics. Run `VIEW_TEST_COMMAND` and `TYPE_CHECK_COMMAND` again and record the results.
- [ ] Task: Render one frame of the game and compare it across games (Green).
  Run the frame command in 3D and in 2D. Look at each frame.
  Put each frame beside one frame of each other rebuild game and of Monster Encounters. Record that
  the scenes differ, the three largest differences from the picked mockup, and each path with its
  SHA-256.
- [ ] Task: Update the design document (Green).
  Owned path: `docs/game-archers-revenge-3d.md`.
  Describe the rebuilt scene, the rules, the aim control, the commands, the events, the evidence,
  and the screens.
- [ ] Task: Send the report to the PM (Green).
  Run `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/apk-release.ts --check'`. When it lists stale models, run it with `--commit`.
  Run `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/monorepo-handoff.ts --target <branch>'`. The PM names the branch.
  Send one status line to the PM. It names the Forge commit, the frames with SHA-256, and the
  handoff file. The PR session then rebuilds the game video, and the PM routes the cartridge sync.
