# Rebuild Paladin's Twin Soul as a chapel shooter

Status: new (2026-10-29). The [specification](./spec.md) owns the scope and the acceptance gates.
Ready on Forge master on 2026-11-07 if Daniel picks the look by 2026-10-31. Each day of delay moves
the date by one day.

## Method and ownership

- Primary owner: the Measure orchestrator for this track. Red writes the tests. Green changes the
  core, the bot, and the views.
- The `measure-strategy` role writes `test-strategy.md` in this folder before Phase 1 starts.
- Owned source path: `src/games/paladins-twin-soul/`.
- Owned test path: `tests/games/paladins-twin-soul/`.
- Owned design path: `docs/game-paladins-twin-soul-3d.md` (Phase 2).
- Owned planning path: `measure/tracks/game_paladins_twin_soul_rebuild_20261029/`.
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
  -k 30 300 node_modules/.bin/vitest run tests/games/paladins-twin-soul --maxWorkers=1'`
- `GREEN_TEST_COMMAND` (Phase 1): the same command. It must exit 0.
- `VIEW_TEST_COMMAND` (Phase 2): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
  -k 30 600 node_modules/.bin/vitest run tests/games/paladins-twin-soul
  tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1'`
- `TYPE_CHECK_COMMAND`: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30
  600 node node_modules/typescript/bin/tsc --noEmit'`. The strategy role records the baseline error
  count. The owned errors must be 0. The total must not be above the baseline.
- Frame command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node
  --import tsx scripts/apk3d-shot.ts both --game paladins-twin-soul --first'`, then the same command
  with `--2d`.
- QC run command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node
  --import tsx scripts/apk3d-shot.ts both --game paladins-twin-soul'`, then the same command with
  `--2d`.

## Phase 1: Rules core

Starts 2026-10-29. This phase does not depend on the look. Roles: Red writes the failing tests and
records the failing run. Green changes the core and the bot and runs the tests again.

The old views stay on the battle stage in this phase. Green makes only the smallest view edits that
keep the type check clean. No sync goes to the monorepo before Phase 2 ends.

- [ ] Task: Write the failing chapel shooter tests (Red).
  Owned paths: `tests/games/paladins-twin-soul/rules.test.ts`, `replay.test.ts`, `bot.test.ts`,
  `driver.test.ts`, and `helpers.ts` in that folder.
  Test these rows: the state has no monster and the core emits no `monsterAppeared`,
  `monsterDefeated`, or `heroStrike` event; one wave per word with six shades (four in Helper mode)
  and one captor; each shade has a kind from `specter`, `wraith`, and `ghost`; a right strike frees
  the soul, adds one twin, scatters the other shades, and starts the next wave; a wrong strike fades
  the shade, makes one standing shade dive, and takes one courage; the rest at 0 courage returns 3;
  the evidence per word stays as today; the same seed and commands give the same events; the bot
  plays a full run to `victory`; the driver plays every new core event.
  Run `RED_TEST_COMMAND`. Record the command, the exit code, and the number of failures.
  Commit the tests alone, by explicit paths.
- [ ] Task: Remove the battle monsters and add the dive to the core (Green).
  Owned path: `src/games/paladins-twin-soul/core/`.
  Keep the waves, the shades, the captor, and the soul count. Remove the monsters and the hero turn
  order. Add the shade kinds and the dive. Update the event order note at the top of `core/sim.ts`.
- [ ] Task: Update the QC bot for the new core (Green).
  Owned path: `src/games/paladins-twin-soul/qc/bot.ts`.
  The bot strikes the captor of each wave from the state alone.
- [ ] Task: Keep the old views compiling and run the gates (Green).
  Owned paths: `src/games/paladins-twin-soul/view/driver.ts`, and the smallest edits in `view/` and
  `view2d/` that the type check needs.
  Run `GREEN_TEST_COMMAND` and `TYPE_CHECK_COMMAND`. Record the exit codes, the test counts, the
  owned errors, and the total errors.

## Phase 2: Views

Status: blocked until Daniel picks the look of Paladin's Twin Soul from the A-28 mockups
(`out/a28-mockups/`, PNG files outside git). The PM relays the pick. Record the pick, its date, and
the mockup file name here before the first task starts.

Roles: Red writes the failing view tests. Green builds both views, runs the QC bot, renders the
frames, updates the design, and sends the report.

- [ ] Task: Write the failing view tests (Red).
  Owned paths: `tests/games/paladins-twin-soul/manifest.test.ts` and a new
  `tests/games/paladins-twin-soul/scene.test.ts`.
  Test these rows: no file in `src/games/paladins-twin-soul/` imports
  `src/games/shared/battle/stage3d.ts` or `src/games/shared/battle/stage2d.ts`; `MODELS_3D` and
  `FILES_2D` list the models and the sprites of the picked look; they do not list `dragon-fire`,
  `mimic`, `skeleton`, or `background.monster-encounters`.
  Run `VIEW_TEST_COMMAND`. Record the failing result. Commit the tests alone, by explicit paths.
- [ ] Task: Build the 3D view on the picked look (Green).
  Owned paths: `src/games/paladins-twin-soul/view/`, `manifest.ts`, `briefing.ts`, and
  `strings.en.ts`.
  Show the chapel and the shades with their words.
  Show the bolt, the dive, the free souls beside the paladin, and the student's avatar as the
  paladin. Do not mark the captor before a right strike. Register every new model in the manifest
  and in a pack.
- [ ] Task: Build the Phaser 2D view on the same core (Green).
  Owned path: `src/games/paladins-twin-soul/view2d/`.
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
  Owned path: `docs/game-paladins-twin-soul-3d.md`.
  Describe the rebuilt scene, the rules, the commands, the events, the evidence, and the screens.
- [ ] Task: Send the report to the PM (Green).
  Run `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/apk-release.ts --check'`. When it lists stale models, run it with `--commit`.
  Run `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/monorepo-handoff.ts --target <branch>'`. The PM names the branch.
  Send one status line to the PM. It names the Forge commit, the frames with SHA-256, and the
  handoff file. The PR session then rebuilds the game video, and the PM routes the cartridge sync.
