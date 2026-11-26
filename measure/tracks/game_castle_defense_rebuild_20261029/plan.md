# Rebuild Castle Defense as a tower defense game

Status: new (2026-10-29). The [specification](./spec.md) owns the scope and the acceptance gates.
Look pick 2026-11-27, owner PM (a PM decision, not a Daniel gate): mockup c2,
`out/a28-mockups/4-castle-defense-c2.png` (high camera, the whole winding path visible). Phase 2 is
open. The earlier readiness note named 2026-11-12, with the look pick due by 2026-10-31. This record
replaces that gate.

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

  Red r2 (Review A RA-CD-1): commit `27247f07`. Role `measure-mid-red`, `claude-code/claude-sonnet-5-5#high`.
  - Two loops had no step limit: `buildSentence` in `helpers.ts` and the B3 row in `bot.test.ts`. Each
    loop now has a limit of `SENTENCE_WORDS.max + 4` (12) picks. A sentence holds 3 to 8 words, so a
    correct core needs 8 picks at most. At the limit the loop throws "the sentence did not finish
    after 12 picks" and names the helper or the row. No assertion changed.
  - Mutant (not in git): `measure/runs/game_castle_defense_rebuild_20261029/probe/sim-mutant-collect.ts`.
    A right pick never ends stage `collect`.
  - PROBE_RED, mutant config `probe/vitest.config.ts`: exit 1, not 124. `Test Files  4 failed | 1 passed (5)`.
    `Tests  63 failed | 27 passed (90)`. Test time 7.32 s. Wall time 893 s, because the heavy lock
    waited (`lock wait over 600 s`, holder PID 299156). B3 and `buildSentence` failed with their messages.
  - PROBE_CONTROL, `probe/vitest-control.config.ts`: exit 0. `Test Files  5 passed (5)`.
    `Tests  90 passed (90)`. Test time 7.69 s. Wall time 235 s.
  - REAL_SUITE `tests/games/castle-defense`: exit 0. `Test Files  5 passed (5)`. `Tests  90 passed (90)`,
    equal to the count of `jr-green-63fea8c5.log`. Test time 6.31 s. Wall time 8 s.
  - Commands: the `vitest run --config .../probe/vitest.config.ts`, `.../probe/vitest-control.config.ts`,
    and `vitest run tests/games/castle-defense` forms, each as `heavy-run.sh -c 'timeout -k 30 300
    node_modules/.bin/vitest run ... --maxWorkers=1'`. Logs: `probe/probe-red-raw.txt`,
    `probe-control-raw.txt`, and `real-suite-raw.txt`.

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
- [x] Task: Add the path, the spots, and the wave in steps to the core (Green). Commit: `bcf48f6c4f37549d013f4c9139830e51d9a8b3c6`.
  Owned path: `src/games/castle-defense/core/`.
  Keep the sentence building and the evidence. Replace the hero posts and the volleys with the
  path, the spots with a range, and the wave in steps. Update the event order note at the top of
  `core/sim.ts`.
- [x] Task: Update the QC bot for the new core (Green). Commit: `bcf48f6c4f37549d013f4c9139830e51d9a8b3c6`.
  Owned path: `src/games/castle-defense/qc/bot.ts`.
  The bot picks the right words. Then it picks the spot that covers the most path steps, with the
  lowest index on a tie.
- [x] Task: Keep the old views compiling and run the gates (Green). Commit: `bcf48f6c4f37549d013f4c9139830e51d9a8b3c6`.
  Owned paths: `src/games/castle-defense/view/driver.ts`, and the smallest edits in `view/` and
  `view2d/` that the type check needs.
  Run `GREEN_TEST_COMMAND` and `TYPE_CHECK_COMMAND`. Record the exit codes, the test counts, the
  owned errors, and the total errors.
  - Green evidence (2026-10-29, role `measure-jr-green`).
    Phase base: `dde11f04c1fee76aafe7b1a3093d0bb9a1c73a60`.
    Role base: `222428c81b5e50f014aa0869ec203519fbc32f82`.
    The Red test commit `957d72af` is inside the phase range. Green changed no Red test.
    The implementation commit holds eight source files only.
  - Core: the state holds a path of six steps and six spots. Each spot has a range of path steps.
    The wave moves the attackers one step at a time. Each built spot shoots the front attacker in
    its range. A breach costs one heart. A rest at zero hearts returns the hearts.
    The event order note at the top of `core/sim.ts` names `waveStep` and `attackerThrough`.
    The state has no `posts`. The core exports no `POSTS` and no `keeperOf`.
  - Bot: the bot picks the right words. Then it picks the spot with the most path steps in range.
    The lowest spot index wins a tie.
  - Driver: the driver calls `showSpots`, `hideSpots`, `towerBuilt`, `waveStep`, and `through`.
    The driver plays every new core event. The old views keep the battle stage in Phase 1.
  - Green command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300
    node_modules/.bin/vitest run tests/games/castle-defense --maxWorkers=1'`.
    Exit code: 0. `Test Files 5 passed (5)`. `Tests 90 passed (90)`. Failed: 0.
    Log: `measure/runs/game_castle_defense_rebuild_20261029/green-vitest-r2.log`.
  - Type command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node
    node_modules/typescript/bin/tsc --noEmit'`.
    Exit code: 2. Total errors: 31. The strategy baseline is 31. Owned errors: 0, in the source
    path and in the test path of this track.
    Log: `measure/runs/game_castle_defense_rebuild_20261029/green-tsc-r2.log`.
    The error files match the baseline: `assets/airship.ts` 7, `assets/rowboat.ts` 8,
    `assets/plank.ts` 6, `assets/mushroom-cap.ts` 3, `assets/waterskin.ts` 3, `assets/longship.ts` 1,
    `assets/merchant-cart.ts` 1, `assets/wool.ts` 1, and `tests/part.test.ts` 1.
    The baseline belongs to asset debt TD-01. No file outside this track received a fix from Green.
  - Shared gate command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30
    300 node_modules/.bin/vitest run tests/games/shared/battle.test.ts
    tests/apk3d/pack-bindings.test.ts --maxWorkers=1'`.
    Exit code: 0. `Test Files 2 passed (2)`. `Tests 60 passed (60)`. Failed: 0.
    Log: `measure/runs/game_castle_defense_rebuild_20261029/green-shared-battle-r2.log`.
  - Mutation command: `bash /tmp/opencode/castle-mutation-gate.sh <id>`. Each run applied the
    mutation to `src/games/castle-defense/` and used `heavy-run.sh` for the test command.
    M1 to M8 each exited 1. No mutation survived.
    M1 killed W1 and F1. `Tests 11 failed | 79 passed (90)`.
    M2 killed W2. `Tests 9 failed | 81 passed (90)`.
    M3 killed W3. `Tests 1 failed | 89 passed (90)`.
    M4 killed W4. `Tests 1 failed | 89 passed (90)`.
    M5 killed W5. `Tests 4 failed | 86 passed (90)`.
    M6 killed W6. `Tests 63 failed | 27 passed (90)`.
    M7 killed W7. `Tests 2 failed | 88 passed (90)`.
    M8 killed W8. `Tests 2 failed | 88 passed (90)`.
    Logs: `measure/runs/game_castle_defense_rebuild_20261029/mutation-M1.log` through
    `mutation-M8.log` in the same folder. Each log holds the diff, the command, and the exit code.
    The first M8 run was interrupted. The second M8 run finished with exit code 1.
    Green then restored `core/sim.ts` from the baseline copy. `diff -ru` exited 0.
  - Doctor command: `bash measure/doctor.sh`. Exit code: 1. Findings: 15.
    Six track metadata records still say `new` while their plans hold started tasks. This track is
    one of the six. The finding was already in the tree before Green started.
    Five tracks lack a registry link, and this track is one of the five.
    `measure/lessons-learned.md` has 52 lines. The limit is 50.
    Three generated files are stale: `architecture.json`, `status.md`, and `asset-inventory.json`.
    Green did not edit the metadata, the registry, the memory file, or the generated facts.
    The closeout steward owns those paths. The live gate of Phase 1 passed in Node.
  - No task moved to `[b]`. No Red retry is needed. Phase 2 still waits for the look selection of
    Daniel.
  - Model deviation: the Red role ran on `claude-code/claude-opus-5-5[1m]#high`. The first Green ran
    on `openai/gpt-6.1-sol#high` and stopped when Daniel restarted OpenCode at 17:15 ICT. This Green
    run used `minimax-cn-coding-plan/MiniMax-M3.1-Flash`. The Ark plans were over quota.
  - Green r2 evidence (2026-10-30, role `measure-jr-green`, remediation round 2 after Review A).
    Review A named two items. RA-CD-1 (Red) named two unbounded collect loops. Red r2 bounded them
    in test commit `27247f07`. RA-CD-2 (Green) named the missing mutations M9 to M18. The core needed
    no change. This round ran M1 to M18 on the bounded tests and recorded each kill.
    Phase base: `dde11f04c1fee76aafe7b1a3093d0bb9a1c73a60`.
    Role base: `9b015077`.
    Model of this round: `minimax-cn-coding-plan/MiniMax-M3.1-Flash`.
    The Red models were `claude-code/claude-opus-5-5[1m]#high` (r1) and `claude-code/claude-sonnet-5-5#high`
    (r2). Both belong to the Anthropic family, and this round used another family. The first Green ran
    on `openai/gpt-6.1-sol#high`. No coder delegation ran.
    - Mutation runner: `measure/runs/game_castle_defense_rebuild_20261029/green-mutation-r2.py`.
      The model is `measure/runs/game_magic_defense_rebuild_20261029/green-mutation-r3.py`.
      The runner copied the game and its tests to `/tmp/opencode/cd-green-r2/` and mutated only that
      copy. The checkout stayed clean.
    - Mutation command: `timeout -k 30 300 node_modules/.bin/vitest run tests/games/castle-defense
      --maxWorkers=1`, run in the copy with no `-t` scope.
      The runner ran under `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'python3
      measure/runs/game_castle_defense_rebuild_20261029/green-mutation-r2.py'`. The runner called no
      `heavy-run.sh`, so the flock never nested.
    - Control run in the copy: exit 0. `Test Files 5 passed (5)`. `Tests 90 passed (90)`.
      The final control run after the last mutation also exited 0 with `Tests 90 passed (90)`.
    - Mutation results. Each mutation exited 1 and failed its row of section 6.
      M1 killed W1 and F1. `Tests 11 failed | 79 passed (90)`.
      M2 killed W2. `Tests 9 failed | 81 passed (90)`.
      M3 killed W3. `Tests 1 failed | 89 passed (90)`.
      M4 killed W4. `Tests 1 failed | 89 passed (90)`.
      M5 killed W5. `Tests 4 failed | 86 passed (90)`.
      M6 killed W6. `Tests 63 failed | 27 passed (90)`.
      M7 killed W7. `Tests 2 failed | 88 passed (90)`.
      M8 killed W8. `Tests 2 failed | 88 passed (90)`.
      M9 killed P1, F1, and R3. `Tests 9 failed | 81 passed (90)`.
      M10 killed P2. `Tests 52 failed | 38 passed (90)`.
      M11 killed E2 and E3. `Tests 2 failed | 88 passed (90)`.
      M12 killed S3. `Tests 3 failed | 87 passed (90)`.
      M13 killed X1. `Tests 1 failed | 89 passed (90)`.
      M14 killed X3. `Tests 1 failed | 89 passed (90)`.
      M15 killed B2. `Tests 1 failed | 89 passed (90)`.
      M16 killed D2. `Tests 1 failed | 89 passed (90)`.
      M17 killed R1 and A-core. `Tests 2 failed | 88 passed (90)`.
      M18 killed L1. `Tests 14 failed | 76 passed (90)`.
      No mutation survived. No mutation hung.
      Logs: `measure/runs/game_castle_defense_rebuild_20261029/mutations-r2/M1.log` through `M18.log`,
      with `control.log`, `final-control.log`, and `results.json` in the same folder.
    - Green command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300
      node_modules/.bin/vitest run tests/games/castle-defense --maxWorkers=1'`.
      Exit code: 0. `Test Files 5 passed (5)`. `Tests 90 passed (90)`. Failed: 0.
      Log: `measure/runs/game_castle_defense_rebuild_20261029/green-vitest-r3.log`.
    - Clean check: `git diff --exit-code -- src/games/castle-defense tests/games/castle-defense`.
      Exit code: 0. Green changed no source file and no test file in this round.
    - No task moved to `[b]`. Every Phase 1 task holds its `[x]` mark with its evidence commit.

### Phase 1 closing evidence (after adversarial testing)

- Adversarial test commit: `3f86c3004ebcb7a049c40b0c141d4778060019f4`, adding `tests/games/castle-defense/rules.adversarial.test.ts`.
- Gate command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/castle-defense --maxWorkers=1'`.
- Exit code: 0. `Test Files  6 passed (6)`. `Tests  119 passed (119)`.
- Open nonblocking items carried to Phase 2:
  - ADV-CD-2: Validate covers indexes and attacker start positions at runtime. Owner: Green. Phase 2.
  - ADV-CD-3: Handle `dispatch(null)` without a `TypeError`. Owner: Green. Phase 2.
  - RC-CD-N1: Remove cosmetic `posts` strings from CSS, comments, and the 2D card-state literal. Owner: Green. Phase 2.
  - RC-CD-N2: Handle `dispatch(null)` without a `TypeError`. Owner: Green. Phase 2.
  - RC-CD-N3: Replace the shared battle stages in both views. Owner: Green. Phase 2.
- Closed findings: RA-CD-1 by `27247f07` and `9ffb1f8a`; RA-CD-2 by `f5f3dcf3`; ADV-CD-1 by `3f86c300`. Review A and Review C have no blocking findings.

## Phase 2: Views

Status: open from 2026-11-27. The PM picked mockup c2,
`out/a28-mockups/4-castle-defense-c2.png` (high camera, the whole winding path visible). The PM owns
the look pick as a PM decision, not a Daniel gate. The A-28 mockups stay outside git in
`out/a28-mockups/`. Phase 1 is closed, so the first task below is ready for Red.

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
