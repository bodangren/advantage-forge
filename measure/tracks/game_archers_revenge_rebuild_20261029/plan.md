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

- [x] Task: Write the failing aim and arc tests (Red). Test commit: `8315f77d`.
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

  Red evidence (2026-10-29, `measure-mid-red`, Anthropic). Phase base: `e51413ef`. Role base: `9c0b400e`.

  - Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300
    node_modules/.bin/vitest run tests/games/archers-revenge --maxWorkers=1'`.
  - Exit code: 1. Lock wait: below 600 s. Duration: 4.68 s.
  - Labeled counts: `Test Files  4 failed | 1 passed (5)` and `Tests  114 failed | 17 passed (131)`.
  - Every failure is an `AssertionError`. The run has no file-level error and no `TypeError`.
  - Failing rows: R1 to R16. Each test of these rows fails. The first failed assertions name a
    missing contract part: `core export shotOf`, `core export layoutOf`, `core export SIN_DEG`,
    `TUNING.aim`, `state.layout`, `a core file defines SIN_DEG`, a lane command that is not
    rejected, a bound pair that is rejected, and `ARCHERS_REVENGE_EVENT_TYPES` without `missed`.
  - R5 part B: the fresh import under the throwing `Math` stubs works at HEAD. The bot run reaches
    `victory`. The test then fails on the missing `layoutOf` export.
  - Passing tests (17): R17 (the core boundary guard), the 5 content rows, `start shows the first
    formation`, `commands after the victory do nothing`, `an empty input is a won run`, 2 replay
    rows (same seed, deep snapshot), `ignores a shot after the end`, and the 5 manifest rows.
  - Type check: `TYPE_CHECK_COMMAND` gave exit 2. Total errors: 136. Owned errors: 0 in
    `src/games/archers-revenge/` and 0 in `tests/games/archers-revenge/`. The 31 baseline errors did
    not change. Other sessions added 105 errors: `tests/games/castle-defense/` 68,
    `tests/games/magic-defense/` 35, and `src/storytime/book-pictures.ts` 2.
  - Owner assumptions in the test names: Q1 in R9, Q2 in R11, and Q3 in R8.
  - Contract choices of Red. The types are in `tests/games/archers-revenge/helpers.ts`
    (`AimCore`, `Layout`, `Contact`, `Shot`, `MissedEvent`):
    - `layoutOf(lanes)` returns `{ lanes, width, groundY, hills, towers, targets }`. A box is
      `{ x0, y0, x1, y1 }`, with +y up. A hill box and every point with `y <= groundY` are
      `ground`. A point with `x >= width` is `edge`.
    - `shotOf(layout, blockedLanes, angle, power)` returns `{ points, contact }`. The contact is
      `{ kind, index, x, y }`. `index` is the lane for `target` and `shut`, and the tower index
      for `tower`. The last point is the contact point.
    - `pathOf(layout, angle, power)` returns the points. A shut target keeps its box, so the
      path needs no lane list.
    - `missed` is `{ type, angle, power, kind, x, y }`. `shot` adds `angle` and `power`.
    - `TUNING.aim` is `{ minAngle: 0, maxAngle: 80, minPower: 10, maxPower: 100 }`. `TUNING.arc`
      is `{ origin: { x, y }, gravity, dt, maxSpeed, maxSteps }`.
    - The `Presentation.showRound` callback is `fire(angle, power)`. `player.fire(angle, power)`
      replaces `player.fire(lane)`.
  - Scratch check (a copy in `/tmp`, not committed): a minimal implementation of this contract
    passed 130 of 131 tests in 14 s. The 1 failure was the manifest pack test, because the
    copy had no `demo/` folder. On that copy, the mutations M1, M2, M3, M6, M7, M9, M10, M11,
    M12, M13, M14, M17, and M18 each failed the row that section 5 of the strategy names.

  Red r2 (Review A RA-AR-1): commit `46814310`. The review found two loops of the rules test
  without a step limit. The loop at line 631 shot a wrong arrow while a wrong lane was open. The
  loop at line 728 shot a right arrow while the phase was playing. A core that leaves a wrong lane
  open, or that never ends the run, runs the loop without an end. The gate then ends with exit
  124, which reads as a hold. Both loops keep a limit now, and the row fails with a message that
  names the row and the fault.
  - The loop of R10 keeps `TUNING.lanes + TUNING.helperLanes` wrong shots, so 5. One wrong shot
    shuts one wrong lane, and a round holds at most `TUNING.lanes` lanes. At the limit the row
    throws "R10: a wrong lane stayed open after 5 wrong shots; the wrong lane did not shut".
  - The loop of R16 keeps `SHORT_STORY.vocabulary.length + 5` right shots, so 10. One right shot
    solves one word. At the limit the row throws "R16: the run stayed in phase \"playing\" after 10
    right shots; the run did not end".
  - The probe folder is `measure/runs/game_archers_revenge_rebuild_20261029/probe/`. Its files stay
    untracked. The log of the runs is `probe/probe-run-r2.log`.
  - PROBE_RED, the mutant that never shuts a wrong lane: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run --config measure/runs/game_archers_revenge_rebuild_20261029/probe/vitest.config.ts --maxWorkers=1'`.
    Exit code 1. Duration 10.15 s. Counts: `Test Files  4 failed | 2 passed (6)` and
    `Tests  8 failed | 126 passed (134)`. The row R10 fails in 50 ms with its message. No timeout.
  - PROBE_RED_B, the mutant that never ends the run: the same command with
    `probe/vitest-mutant-b.config.ts`. Exit code 1. Duration 107.89 s. Counts:
    `Test Files  4 failed | 2 passed (6)` and `Tests  65 failed | 69 passed (134)`. The row R16
    fails with its message. No timeout.
  - PROBE_CONTROL, the same alias pattern and the real core: the same command with
    `probe/vitest-control.config.ts`. Exit code 0. Duration 11.54 s. Counts:
    `Test Files  6 passed (6)` and `Tests  134 passed (134)`.
  - REAL_SUITE, the committed tests and the real core: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/archers-revenge --maxWorkers=1'`.
    Exit code 0. Duration 10.85 s. Counts: `Test Files  6 passed (6)` and
    `Tests  134 passed (134)`. The count of 134 tests is the count before this change.
  - The wall time of the four runs was 325 s, 141 s, 30 s, and 365 s. The heavy lock waited in the
    first run and in the last run. No run printed `lock wait over 600 s`.
- [x] Task: Add the aim command, the arc, and the hit test to the core (Green). Implementation: `cc5f8750a0ace49e77072d503eeecb804a38248e`.
  Owned path: `src/games/archers-revenge/core/`.
  Change `fire(lane)` to `fire(angle, power)`. Add the path function with the fixed sine table, the
  target and tower places, and the hit test. Keep the evidence. Update the event order note at the
  top of `core/sim.ts`.
- [x] Task: Update the QC bot for the new core (Green). Implementation: `cc5f8750a0ace49e77072d503eeecb804a38248e`.
  Owned path: `src/games/archers-revenge/qc/bot.ts`.
  The bot searches the angle and power steps with the core path function. It fires the first pair
  that hits the right target.
- [x] Task: Keep the old views compiling and run the gates (Green). Implementation: `cc5f8750a0ace49e77072d503eeecb804a38248e`.
  Owned paths: `src/games/archers-revenge/view/driver.ts`, and the smallest edits in `view/` and
  `view2d/` that the type check needs.
  Run `GREEN_TEST_COMMAND` and `TYPE_CHECK_COMMAND`. Record the exit codes, the test counts, the
  owned errors, and the total errors.

### Green evidence (2026-10-29)

- Role: `measure-jr-green`, OpenAI. No coder delegation occurred.
- Immutable phase base: `e51413ef454bb1ee02c368f867ef4ba64f535a12`.
  Role base: `e13b835bd351d4dfbb672b2347a9bcbda12d14b2`.
- Red commit `8315f77d3f6746e37980bec636ccab63b95afa63` is inside `phase_base_sha..HEAD`.
  The five committed Red files remain byte-identical to that commit.
- The first Red rerun waited for the heavy lock. It printed `lock wait over 600 s`.
  The shell tool stopped the wait after 1000000 ms. Vitest did not start, and no command exit was captured.
  The orchestrator then directed Green to use the committed Red evidence and implement before another test run.
  That evidence records exit 1, `Test Files  4 failed | 1 passed (5)`, and `Tests  114 failed | 17 passed (131)`.
- `GREEN_TEST_COMMAND`:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/archers-revenge --maxWorkers=1'`.
  First run: exit 0; `Test Files  6 passed (6)`; `Tests  134 passed (134)`; duration 12.69 s.
  Final run: exit 0; `Test Files  6 passed (6)`; `Tests  134 passed (134)`; duration 14.76 s.
  Logs: `measure/runs/game_archers_revenge_rebuild_20261029/green-tests-1.log` and `green-tests-final.log` in that directory.
- The first Green run and the final batch each printed `lock wait over 600 s`.
  The wrapper continued waiting and later ran both jobs. Neither attempt exited 75 or 201, so no retry occurred.
  The final batch used one outer lock. Every nested test and compiler command also used `heavy-run.sh`.
- `TYPE_CHECK_COMMAND`:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node node_modules/typescript/bin/tsc --noEmit'`.
  Exit 2. Owned errors: 0 in the source and 0 in the tests. Total errors: 31, equal to the strategy baseline.
  Unrelated errors: `assets/airship.ts` 7, `assets/rowboat.ts` 8, `assets/plank.ts` 6,
  `assets/mushroom-cap.ts` 3, `assets/waterskin.ts` 3, `assets/longship.ts` 1,
  `assets/merchant-cart.ts` 1, `assets/wool.ts` 1, and `tests/part.test.ts` 1.
  Log: `measure/runs/game_archers_revenge_rebuild_20261029/green-typecheck.log`.
- New production files: `core/aim.ts` and `core/tuning.ts` under the owned game path.
  New implementation test: `tests/games/archers-revenge/aim-green.test.ts`.
  Its three guards cover signed zero, one distinct term, and copied cache results.
- `shotOf` owns the arc and segment contacts. `pathOf` calls it directly.
  The bot caches the first hitting pair per lane and layout in ascending angle and power order.
  Both old views use that same search to convert a lane tap into an aim command.
  The driver calls `Presentation.missed`. The old views play its sound and wait; Phase 2 owns the arc animation.
- Mutation command:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 python3 measure/runs/game_archers_revenge_rebuild_20261029/run-green-mutations.py'`.
  The runner used an isolated copy under `/tmp/opencode/archers-green/mutation-scratch`.
  Control: exit 0; `Test Files  6 passed (6)`; `Tests  134 passed (134)`.
  Runner: exit 0. Each mutation exited 1 on its assigned row. No collection failure occurred.
  Each `mutations/M*.log` records the diff, command, exit code, and restored SHA-256.
  Separate `M*.diff` files and `results.json` remain in the same evidence directory.
  A byte comparison confirmed that every scratch source file returned to the Green baseline.

| Mutation | Failing row | Exit | Labeled result |
| --- | --- | --- | --- |
| M1 | R5 A and B | 1 | Tests 2 failed |
| M2 | R5 B | 1 | Tests 1 failed |
| M3 | R2 | 1 | Tests 2 failed |
| M4 | R2 | 1 | Tests 1 failed |
| M5 | R2 | 1 | Tests 14 failed |
| M6 | R4 | 1 | Tests 2 failed |
| M7 | R4 | 1 | Tests 2 failed |
| M8 | R4 | 1 | Tests 2 failed |
| M9 | R7 | 1 | Tests 2 failed |
| M10 | R7 | 1 | Tests 2 failed |
| M11 | R8 and R16 | 1 | Tests 2 failed |
| M12 | R8 | 1 | Tests 4 failed |
| M13 | R9 | 1 | Tests 1 failed |
| M14 | R11 | 1 | Tests 2 failed |
| M15 | R12 | 1 | Tests 1 failed |
| M16 | R13 and R14 | 1 | Tests 3 failed |
| M17 | R14 | 1 | Tests 1 failed |
| M18 | R15 | 1 | Tests 1 failed |
| M19 | R17 | 1 | Tests 1 failed |

- Graph: the repository has no `graph.db` or tracked graph artifact.
  Under the heavy lock, `build-graph init /tmp/opencode/archers-green/graph.db` and `build-graph update` covered all 11 changed TypeScript files.
  Exit 0. Output: `Updated 11 files (0 → 84 nodes, 0 → 109 edges)`.
  Log: `measure/runs/game_archers_revenge_rebuild_20261029/green-graph.log`.
- Doctor command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'bash measure/doctor.sh'`.
  Exit 1. It reports four missing rebuild links in `measure/tracks.md` and 52 lines in `measure/lessons-learned.md`.
  It also reports stale `measure/generated/architecture.json`, `status.md`, and `asset-inventory.json`.
  These paths are outside Green ownership. The registry and generator remain closeout work, as this plan requires.
  Log: `measure/runs/game_archers_revenge_rebuild_20261029/green-doctor.log`.
  The documented P1 gates pass; this record does not claim a passing doctor or a passing aggregate type check.
  The final batch exited 1 because doctor failed. Its test, mutation, and graph commands exited 0.
- Anti-pattern review: no Red test, filter, registry, supervisor, shared battle file, or policy file changed.
  `measure/anti-patterns.md` is absent. The review used the strategy catalog and the canonical starter catalog.
- No task changed to `[b]`. Phase 2 still waits for Daniel's look decision. No closeout metadata changed.

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
