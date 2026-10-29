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

- [x] Task: Write the failing chapel shooter tests (Red). Test commit: `f823e87b`.
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
  - Red evidence (2026-10-29, measure-mid-red). Phase base: `4007148a`. Role base: `9c0b400e`.
    Test commit: `f823e87b` (the five owned test files only). No file in
    `src/games/paladins-twin-soul/` changed.
  - Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300
    node_modules/.bin/vitest run tests/games/paladins-twin-soul --maxWorkers=1'`.
    Log: `measure/runs/game_paladins_twin_soul_rebuild_20261029/red-vitest.log`. Lock wait: under 600 s.
  - Red exit code: 1. Red test files failed: 4. Red test files passed: 1 (`manifest.test.ts`).
    Red failed: 126. Red passed: 27. Red total: 153.
  - Every failure is an `AssertionError`. No suite failed to load. No `TypeError` occurred.
  - Failing rows by name: T1 (9 tests: state keys, event list, exports, start events, mixed run);
    T2 (3); T3 (2); T4 (36: 30 seeds, the place spread, 5 lone-captor runs); T5 (6); T6 (4 of 5);
    T7 (2); T8 (5 of 7); T9 (3 of 4); T10 (3); T12 (1); T13 (3 of 4); T14 (48 of 49); T15 (1).
  - Pass at Red, with the mutation that each row catches: the 5 kept content rows; T6 captor
    places (M24); T11 (14 tests: M35, M36); T13 rejected strike (M40, M42); T8 kept rows (2:
    target order, deep copy); T9 destroy row; T14 null row; `manifest.test.ts` (2, not a Red path).
  - Defaults in force, marked "assumption" in the test names: Q1 (T4, T8), Q2 (T6, T10), Q3 (T5, T8).
  - Contract names: the defaults of test-strategy section 5. The driver test adds the
    `Presentation` methods `bolt(shade)`, `shadeFaded(shade)`, and `shadeDived(shade)`. It removes
    the six monster methods. The header comment of `driver.test.ts` lists the full method set.
  - Type check: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node
    node_modules/typescript/bin/tsc --noEmit'`. Log: `red-tsc.log` in the same folder.
    Exit code: 2. Total errors: 88. Owned errors: 0 (`src/` and `tests/` of this game).
    The rise from 31 comes from the Red tests of other sessions:
    `tests/games/castle-defense/` (51, track `game_castle_defense_rebuild_20261029`) and
    `tests/games/magic-defense/helpers.ts` (6, track `game_magic_defense_rebuild_20261029`).
- [x] Task: Remove the battle monsters and add the dive to the core (Green). Commit: `527be9bc7ef628658f6be3d6444a6a19b062aad1`.
  Owned path: `src/games/paladins-twin-soul/core/`.
  Keep the waves, the shades, the captor, and the soul count. Remove the monsters and the hero turn
  order. Add the shade kinds and the dive. Update the event order note at the top of `core/sim.ts`.
- [x] Task: Update the QC bot for the new core (Green). Commit: `527be9bc7ef628658f6be3d6444a6a19b062aad1`.
  Owned path: `src/games/paladins-twin-soul/qc/bot.ts`.
  The bot strikes the captor of each wave from the state alone.
- [x] Task: Keep the old views compiling and run the gates (Green). Commit: `527be9bc7ef628658f6be3d6444a6a19b062aad1`.
  Owned paths: `src/games/paladins-twin-soul/view/driver.ts`, and the smallest edits in `view/` and
  `view2d/` that the type check needs.
  Run `GREEN_TEST_COMMAND` and `TYPE_CHECK_COMMAND`. Record the exit codes, the test counts, the
  owned errors, and the total errors.
  - Green stopped on 2026-10-29 for a Mid Red retry. At this stop, no Green task was complete.
    The immutable test `driver.test.ts:138` removed seven characters from `faded:<shade>`.
    The prefix `faded:` has six characters. The assertion therefore compares different shade ids.
  - Red rerun exit: 1. Failed: 126. Passed: 27. Total: 153.
    Log: `measure/runs/game_paladins_twin_soul_rebuild_20261029/green-red-rerun.log`.
  - Green attempt exit: 1. Failed: 1. Passed: 152. Total: 153.
    Failure: expected `w1s2` to equal `1s2` at `driver.test.ts:138`.
    Log: `measure/runs/game_paladins_twin_soul_rebuild_20261029/green-vitest.log`.
    The implementation stayed uncommitted. The Red tests stayed unchanged.
    The type check and later gates did not run after this failure.
  - Mid Red corrected the prefix assertion in `e13b835b`. Green inspected this commit.
    It changes only the prefix lengths in `driver.test.ts:138`.
  - The next Green attempt stopped with `lock wait over 600 s`.
    The shell tool stopped the foreground call after 1200 s. The tests did not start.
    The lock holder ran the Guild Vale language-acts tests in `advantage-mmorpg`.
    Log: `measure/runs/game_paladins_twin_soul_rebuild_20261029/green-vitest-fixed-red.log`.
    No Paladin test process remained. The implementation stayed uncommitted.
    At this stop, the type check, mutations, and later gates remained pending.
  - The orchestrator authorized continued lock waits on 2026-10-29.
    Green resumed the gates through `heavy-run.sh`, with separate logs for each attempt.
  - Final Green evidence (2026-10-29, measure-jr-green).
    Phase base: `4007148a8794c33992c218f84a2f99e6aacef6fe`.
    Role base: `5e8582e0efaa941b38c6b57f6cf73ec19d96c702`.
    Red commits `f823e87b` and `e13b835b` are inside the phase range.
    Green changed no Red test. The implementation commit contains nine source files only.
  - Core: the balanced kind list and the dive use the run RNG.
    A wrong strike fades one shade, draws a standing diver, and reduces courage by one.
    The diver keeps its place. The captor stays in the draw. The event order note matches these events.
  - Bot: `nextStrike` reads the target id from the state and selects the standing captor.
    Driver: each accepted strike plays the bolt first. The driver plays the fade and the dive in event order.
    Each `ask` shade has only `id`, `term`, and `kind`. The driver calls `captured()` without an argument.
    The views retain the old stage in Phase 1. Phase 2 adds the scene and the bolt and dive animations.
  - Green command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/paladins-twin-soul --maxWorkers=1'`.
    Exit code: 0. Passed: 153. Failed: 0. Test files passed: 5.
    Log: `measure/runs/game_paladins_twin_soul_rebuild_20261029/green-resume-vitest-1.log`.
    The log records `lock wait over 600 s`. Green continued waiting under the orchestrator's instruction.
  - Type command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node node_modules/typescript/bin/tsc --noEmit'`.
    Exit code: 2. Total errors: 99. Owned errors: 0, in both the source and test paths.
    Log: `measure/runs/game_paladins_twin_soul_rebuild_20261029/green-tsc-1.log`.
    The Castle Defense track owns 68 errors in `tests/games/castle-defense/`.
    Counts: `driver.test.ts` 17, `bot.test.ts` 3, `replay.test.ts` 3, `rules.test.ts` 41, and `helpers.ts` 4.
    The remaining 31 errors match the strategy baseline.
    Baseline paths: `assets/airship.ts` 7, `assets/rowboat.ts` 8, `assets/plank.ts` 6, and `assets/mushroom-cap.ts` 3.
    Other baseline paths: `assets/waterskin.ts` 3, `assets/longship.ts` 1, `assets/merchant-cart.ts` 1, `assets/wool.ts` 1, and `tests/part.test.ts` 1.
    The baseline belongs to asset debt TD-01. No external source or test received a fix from Green.
  - Mutation command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 1800 python3 /tmp/opencode/paladin-green-mutations.py'`.
    Exit code: 0. Mutations run: 45. Mutations killed: 45. Survivors: 0.
    The runner used an isolated source copy at `/tmp/opencode/paladin-p1-mutations`.
    It copied the Red tests without edits. Each mutation changed one source file, then restored that file.
    Each targeted command used `heavy-run.sh`. Each mutation exited 1 with failed test rows.
    M44 failed the bot rows with `Error: Missing currentTargetId`. No test suite failed to load.
    Logs: `measure/runs/game_paladins_twin_soul_rebuild_20261029/green-mutation-M01.log` through `green-mutation-M45.log` in the same folder.
    Each log contains the diff, the command, the exit code, and `Restored: True`.
    Summary: `green-mutations-summary.json`. Runner copy: `green-mutation-runner.py`.
    Run log: `green-mutation-python3-1.log`. These files share the same run folder.
    The isolated baseline and restored suite each exited 0 with 153 passed and 0 failed.
    Logs: `green-mutation-baseline.log` and `green-mutation-restored.log` in the same folder.
    The first launcher exited 127 because `python` does not exist. No mutation ran in that attempt.
    Log: `green-mutation-run-1.log`. The retry used `python3`.
  - Static evidence: the core search found no forbidden name. `git diff --check` exited 0.
    Log: `measure/runs/game_paladins_twin_soul_rebuild_20261029/green-static.log`.
    Core imports use only local rules, APK contracts, and the seeded simulation helpers.
    The shared phase range contains commits from other sessions. The implementation commit touches only the assigned source paths.
    Log: `green-shared-phase-paths.log` in the same run folder. No graph database exists, so graph-aware work was skipped.
  - Doctor command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 bash measure/doctor.sh'`.
    Exit code: 1. Errors: 15.
    Log: `measure/runs/game_paladins_twin_soul_rebuild_20261029/green-doctor-1.log`.
    Six track metadata records still say `new`. Five tracks lack registry links, including this track.
    The memory file exceeds its line limit. Three generated files are stale.
    Green did not edit metadata, the registry, the memory file, or generated facts.
    The closeout steward owns those changes. The generator remains deferred to that owner, as this plan requires.
    The strategy's Phase 1 live gate passed in Node. This result does not clear the doctor errors or verify either renderer.
  - No task moved to `[b]`. Phase 2 still waits for Daniel's look selection.

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
