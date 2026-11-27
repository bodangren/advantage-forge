# Rebuild Magic Defense as a missile defense game

Status: new (2026-10-29). The [specification](./spec.md) owns the scope and the acceptance gates.
Look pick 2026-11-27, owner PM (a PM decision, not a Daniel gate): mockup c2,
`out/a28-mockups/1-magic-defense-c2.png` (four castles in a row, sunset). Phase 2 is open.
The earlier readiness note named 2026-11-05, with the look pick due by 2026-10-31. This record
replaces that gate.

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
- [x] Task: Add the held missile per castle to the core (Green). Implementation commit `2645b063c7336780ccfa10c77d40e7511adb46d6`.
  Owned path: `src/games/magic-defense/core/`.
  Keep `cast`, `storm`, the castles, and the hearts. Add the held missile per castle. Update the
  event order note at the top of `core/sim.ts`.
- [x] Task: Update the QC bot for the new core (Green). Implementation commit `2645b063c7336780ccfa10c77d40e7511adb46d6`.
  Owned path: `src/games/magic-defense/qc/bot.ts`.
  The bot reads the active missile from the state and casts its right word.
- [x] Task: Keep the old views compiling and run the gates (Green). Implementation commit `2645b063c7336780ccfa10c77d40e7511adb46d6`.
  Owned paths: `src/games/magic-defense/view/driver.ts`, and the smallest edits in `view/` and
  `view2d/` that the type check needs.
  Run `GREEN_TEST_COMMAND` and `TYPE_CHECK_COMMAND`. Record the exit codes, the test counts, the
  owned errors, and the total errors.
- [x] Task: Close Review A gaps RA-MD-1 and RA-MD-2 (Red). Test commit: `8b1fb6e0`.
  Owned path: `tests/games/magic-defense/rules.test.ts`.
  - RA-MD-1: the new row `H17: the castle that takes the place of a fallen castle comes from a
    fixed seeded order` forces the active castle to fall. The row runs 30 seeds and two falls per
    seed. A storm between the two falls gives three standing castles again. The row proves that
    the falls of one seed follow one fixed castle order. The row also proves that the castle that
    takes the place depends on the seed. A core with a constant order fails this fact.
  - RA-MD-2: the loop of the row `H8 (ASM-3): the right word never shuts, so every meaning can be
    broken` has a limit of 50 casts now. The row fails with a clear message when the limit is
    reached. The gate no longer waits for the timeout of 300 seconds.
  - Red evidence (2026-10-30, role `measure-mid-red`, round `r2`, role base `63fea8c5`, phase base
    `0c5e7ea2`). The test commit `8b1fb6e0` holds only `tests/games/magic-defense/rules.test.ts`.
  - Real suite: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300
    node_modules/.bin/vitest run tests/games/magic-defense --maxWorkers=1'`. Exit code 0.
    Test Files: 5 passed (5). Tests: 0 failed, 102 passed (102).
  - Mutant suite, the RED_TEST_COMMAND of this round: `bash
    ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest
    run --config measure/runs/game_magic_defense_rebuild_20261029/probe/vitest.config.ts
    --maxWorkers=1'`. Exit code 1. Test Files: 1 failed, 4 passed (5). Tests: 1 failed, 101 passed
    (102).
  - The failing row under the mutant: `H17: the castle that takes the place of a fallen castle comes
    from a fixed seeded order`. The message: `the castle that takes the place depends on the seed
    (0->1 1->0 2->0): expected 0 to be greater than 0`.
  - Type check: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node
    node_modules/typescript/bin/tsc --noEmit'`. Exit code 2. Total errors: 31. Owned errors: 0 in
    `src/games/magic-defense/` and 0 in `tests/games/magic-defense/`. The 31 errors are the
    baseline: 30 in `assets/` and 1 in `tests/part.test.ts`.
  - The logs of this round are in `measure/runs/game_magic_defense_rebuild_20261029/`. The
    provisional log is `mid-red-r2-provisional.log`. The final log is
    `mid-red-<short SHA of this plan commit>.log`. The logs are not committed, as for the earlier
    logs of this track.
- [x] Task: Close the Review A gaps NB-MD-1 and NB-MD-2 (Red, round r3). Test commit `ba47b241`.
  Owned path: `tests/games/magic-defense/rules.test.ts`.
  - NB-MD-1: the limit of the H8 loop at the row `H8 (ASM-3): the right word never shuts, so every
    meaning can be broken` is no longer the bare number 50. The limit is now
    `sim.state.round!.choices.length * 2`, which is 6 casts with `TUNING.choices = 3`. The card
    carries one right word and two wrong words, and every wrong word shuts after one cast, so the
    correct core needs two casts. A change of `TUNING.choices` no longer fails the row falsely.
  - NB-MD-2: the two loops that ran `while (sim.state.phase === 'playing') castRight(sim)` now use
    the helper `castRightToEnd`. The helper counts the casts and throws at the limit. The limit of
    the row `the mana never passes its maximum` is `STORY.vocabulary.length * 2`, which is 26
    casts. The limit of the row `one item per word with the attempts and the first-try flag; the
    score is the coins` is `SHORT_STORY.vocabulary.length * 2`, which is 10 casts. A correct run
    casts the right word once per word of the fixture, so the margin is one more fixture. Each
    message names the row and the fault: `the run did not end after N right casts`.
  - The M10 mutation of the earlier round now fails the H8 row with `the row did not shut every
    wrong word in 6 casts`, because the limit comes from the count of the choices. The recorded run
    of that round keeps its message and its count.
  - No assertion was removed or loosened. No file in `src/` changed.
  - Red r3 (Review A NB-MD-1, NB-MD-2): commit `ba47b241`.
  - Red evidence (2026-10-30, role `measure-mid-red`, round `r3`, role base `014514f0`, phase base
    `0c5e7ea2`). The test commit `ba47b241` holds only `tests/games/magic-defense/rules.test.ts`.
  - PROBE_RED, the mutant that never ends the run: `bash
    ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest
    run --config measure/runs/game_magic_defense_rebuild_20261029/probe/vitest-victory.config.ts
    --maxWorkers=1'`. Exit code 1. The gate did not end with 124. Test Files: 3 failed, 2 passed
    (5). Tests: 74 failed, 28 passed (102). Duration 15.48 s. The two bounded rows failed fast:
    `the mana never passes its maximum: the run did not end after 26 right casts` and `one item
    per word with the attempts and the first-try flag; the score is the coins: the run did not end
    after 10 right casts`. The probe files are `probe/sim-mutant-never-ends.ts`,
    `probe/index-mutant-never-ends.ts`, and `probe/vitest-victory.config.ts`.
  - PROBE_CONTROL, the same alias pattern with the real core: `bash
    ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest
    run --config measure/runs/game_magic_defense_rebuild_20261029/probe/vitest-control-r3.config.ts
    --maxWorkers=1'`. Exit code 0. Test Files: 5 passed (5). Tests: 0 failed, 102 passed (102).
    Duration 5.35 s.
  - REAL_SUITE: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300
    node_modules/.bin/vitest run tests/games/magic-defense --maxWorkers=1'`. Exit code 0. Test
    Files: 5 passed (5). Tests: 0 failed, 102 passed (102). Duration 5.17 s. The count of 102
    tests is the count of `jr-green-01998be4.log`, before this change.
  - The logs of this round are in `measure/runs/game_magic_defense_rebuild_20261029/probe/`:
    `probe-red-r3.log`, `probe-control-r3.log`, and `real-suite-r3.log`. The provisional log is
    `mid-red-r3-provisional.log`. The final log is `mid-red-<short SHA of this plan commit>.log`.
    The logs are not committed, as for the earlier logs of this track.
- [x] Task: Rerun the M10 mutation with the unbounded fault on the bounded loop and the gates (Green). Evidence commit: `8b1fb6e0` (Red tests; no source change needed).
  Owned path: `src/games/magic-defense/core/`. The mutation is temporary and is removed after the
  run.
  - Apply the fault of M10 without the bound of the retry. The wrong cast clears the `blocked` flag
    of the failed choice. Run `GREEN_TEST_COMMAND` with the fault.
  - The run must exit 1. It must fail the row `H8 (ASM-3): the right word never shuts, so every
    meaning can be broken`. The message must be `the row did not shut every wrong word in 50
    casts`. The run must not reach the timeout of 300 seconds.
  - M10 unbounded fault: exit 1 before timeout; 6 tests failed and 96 passed. H8 failed with
    `the row did not shut every wrong word in 50 casts`. H8 failed fast in 2 ms.
  - Remove the fault. Run `GREEN_TEST_COMMAND` and `TYPE_CHECK_COMMAND` again. Record the exit
    codes, the counts, and the owned errors here.
  - Add a mutation for the seeded castle order to the list of the strategy. The mutation makes the
    castle order a constant list. The run must exit 1 and fail the row H17. Record the exit code
    and the failing row here.
  - Constant castle-order mutation: exit 1; 1 test failed and 101 passed. H17 failed because the
    castle that takes the place did not depend on the seed. Source was restored after each mutation;
    `git diff --exit-code -- src/games/magic-defense` exited 0 before the next run and after restore.
  - Clean Green gate: exit 0; 5 test files passed and 102 tests passed. Shared battle gate: exit 0;
    1 test file and 1 test passed. Type check: exit 2 with 31 total errors, 0 in owned source and
    0 in owned tests. The 31 errors match the baseline: 30 in `assets/` and 1 in `tests/part.test.ts`.

### First Green checkpoint (2026-10-29; incomplete)

- The phase base is `0c5e7ea2d62aa67bbb00694da56fa0573eb3b451`.
  The Green role base is `5e8582e0efaa941b38c6b57f6cf73ec19d96c702`.
  Red commit `51d52a0b` is an ancestor of the role base and follows the phase base.
- The Red rerun exited 1. Test Files: 4 failed, 1 passed (5). Tests: 78 failed, 23 passed (101).
  The command was `RED_TEST_COMMAND`. The log is
  `measure/runs/game_magic_defense_rebuild_20261029/jr-green-red-rerun.log`.
- The implementation adds held missiles, seeded selection, relocation after a fall, and refill after the storm.
  The bot reads the active missile. The driver plays `missileThrown`.
  Both old views have a temporary empty `throwMissile` method. Phase 2 supplies the scene.
- `GREEN_TEST_COMMAND` exited 0. Test Files: 5 passed (5). Tests: 0 failed, 101 passed (101).
  The log is `measure/runs/game_magic_defense_rebuild_20261029/jr-green-tests.log`.
- `TYPE_CHECK_COMMAND` exited 2. Total errors: 99. Owned source errors: 0. Owned test errors: 0.
  The baseline has 31 errors: 30 in `assets/` and 1 in `tests/part.test.ts`.
  Another track has 68 errors in `tests/games/castle-defense/`:
  `bot.test.ts` (3), `driver.test.ts` (17), `helpers.ts` (4), `replay.test.ts` (3), and `rules.test.ts` (41).
  The log is `measure/runs/game_magic_defense_rebuild_20261029/jr-green-tsc.log`.
- Mutations M1, M2, and M3 each exited 1. Their required rows failed: H9, H1, and H2, respectively.
  Their test failure counts were 6, 43, and 35. Each mutation log contains its diff, command, and exit code.
  The logs are `jr-green-M1.log`, `jr-green-M2.log`, and `jr-green-M3.log` in the run folder.
- M4 did not execute in the first attempt. The shared lock wait exceeded 600 seconds.
  The log records `lock wait over 600 s`. The shell tool stopped the wait at 1200 seconds.
  The gate had no exit code. The role stopped that attempt and removed its temporary mutations.
- At this checkpoint, M4 to M17 and the shared battle gate remained pending.
  The implementation and plan remained uncommitted. No Green task was complete. The Red tests remained unchanged.
- Graph-aware mode is disabled in `measure/tech-stack.md`. No graph database exists in this repository.
  The role did not change the generated files. The role did not run the doctor after the lock hold.
  The strategy defines the live gate as the core run in Vitest; that run passed before the mutations.
- The coder delegation failed because this session reached the subagent depth limit. No coder changed a file.

### Green continuation (2026-10-29; Phase 1 implementation complete)

- The orchestrator authorized one batch under the shared lock and continued waits after 600 seconds.
  The log is `measure/runs/game_magic_defense_rebuild_20261029/jr-green-mutation-batch.log`.
- M4 to M17 ran under one lock. All required rows failed except M10, which reached the external timeout.
  M10 cleared every failed choice. This fault kept the committed `while (hasWrong(sim))` loop running.
  The timeout exited 124. The log is `jr-green-M10-timeout.log` in the run folder.
- The M10 retry clears the first failed choice only. Later failed choices shut, so the Red loop can terminate.
  This bounded fault tests the same H8 rule without changing a committed Red test.
- The final batch ran the M10 retry, the clean Green gate, the shared battle gate, and the type check.
  It also ran the doctor without changing generated files.
  The log is `measure/runs/game_magic_defense_rebuild_20261029/jr-green-finish.log`.
- The implementation commit is `2645b063c7336780ccfa10c77d40e7511adb46d6`. It contains only the six assigned source files.
  These three Green tasks changed to `[x]`: the core, the bot, and the compiling views with their gates.
  No task changed to `[b]`. No production file or test file was added.
- The final `GREEN_TEST_COMMAND` started at 2026-10-29T06:20:50Z and exited 0.
  Test Files: 5 passed (5). Tests: 0 failed, 101 passed (101).
  The log is `measure/runs/game_magic_defense_rebuild_20261029/jr-green-final-tests.log`.
- The shared battle command exited 0: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c
  'timeout -k 30 300 node_modules/.bin/vitest run tests/games/shared/battle.test.ts --maxWorkers=1'`.
  Test Files: 1 passed (1). Tests: 0 failed, 1 passed (1).
  The log is `measure/runs/game_magic_defense_rebuild_20261029/jr-green-shared-battle.log`.
- The final `TYPE_CHECK_COMMAND` exited 2. Total errors: 31. Owned source errors: 0. Owned test errors: 0.
  The total equals the baseline: 30 errors in `assets/` and 1 in `tests/part.test.ts`.
  The final run has no errors in other rebuilt games. The earlier run recorded 68 castle-defense errors.
  The log is `measure/runs/game_magic_defense_rebuild_20261029/jr-green-final-tsc.log`.
- Each mutation below exited 1 and failed its required row. Each log contains the diff, command, and exit code.
  All runs used the shared lock. All temporary mutations are removed.
  Logs: `measure/runs/game_magic_defense_rebuild_20261029/jr-green-M1.log` through `jr-green-M17.log`.

| Mutation | Required failing row observed | Tests failed | Tests passed |
| --- | --- | ---: | ---: |
| M1 | H9 | 6 | 95 |
| M2 | H1 | 43 | 58 |
| M3 | H2 | 35 | 66 |
| M4 | H3 | 2 | 99 |
| M5 | H4 | 77 | 24 |
| M6 | H5 | 1 | 100 |
| M7 | H6 | 75 | 26 |
| M8 | H7 | 8 | 93 |
| M9 | H8 | 39 | 62 |
| M10, bounded retry | H8 | 4 | 97 |
| M11 | H9 | 3 | 98 |
| M12 | H10 | 3 | 98 |
| M13 | H11 | 28 | 73 |
| M14 | H5 and H12 | 4 | 97 |
| M15 | H13 | 25 | 76 |
| M16 | H14 | 5 | 96 |
| M17 | H16 | 33 | 68 |

- The doctor command was `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'bash measure/doctor.sh'`.
  It exited 1 with 15 structural errors. The log is `measure/runs/game_magic_defense_rebuild_20261029/jr-green-doctor.log`.
  Six track plans have started tasks with `new` metadata. Five tracks lack a registry link.
  `measure/lessons-learned.md` has 52 lines against its limit of 50. Three generated files are stale.
  The owning sessions and closeout role must resolve these errors. This role did not change those files.
  The strategy defines the Phase 1 live gate as the core run in Vitest. That gate exited 0.
- The logs preserve each `lock wait over 600 s` line. The successful batches needed no hold-code retry.
  The role did not use `/tmp/md-proto`. The committed Red tests remain unchanged.
  The old scenes remain a Phase 2 task. Daniel must still pick the look before Phase 2 starts.

### Green r3 mutation evidence (after Red r3 NB-MD-1, NB-MD-2)

- Red r3 test commit `ba47b241` is within the immutable phase range `0c5e7ea2..HEAD`.
  `role_base_sha` is `143e26ff`; `phase_base_sha` is
  `0c5e7ea2d62aa67bbb00694da56fa0573eb3b451`.
- Models: Red r1 `claude-code/claude-opus-5-5[1m]#high`; Red r2 and r3
  `minimax-cn-coding-plan/MiniMax-M3.1-Flash`; Green r3 `openai/gpt-6-luna#high`.
  No coder delegation occurred.
- Scratch mutation command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c
  'python3 measure/runs/game_magic_defense_rebuild_20261029/green-mutation-r3.py'`.
  The runner copied game source and tests to `/tmp/opencode/md-green-r3/`, linked their dependencies,
  and mutated only that copy. It ran every mutation against the full Magic Defense test folder.
- Scratch control exited 0 with 102 tests. M1 exited 1, H9. M2 exited 1, H1. M3 exited 1, H2.
  M4 exited 1, H3. M5 exited 1, H4. M6 exited 1, H5. M7 exited 1, H6. M8 exited 1, H7.
  M9 exited 1, H8. M10 exited 1, H8, with `the row did not shut every wrong word in 6 casts`.
  M11 exited 1, H9. M12 exited 1, H10. M13 exited 1, H11. M14 exited 1, H5.
  M15 exited 1, H13. M16 exited 1, H14. M17 exited 1, H16.
- The additional constant castle-order mutation M18 exited 1 and failed H17.
  Each test command used `timeout -k 30 300` and no `-t` scope.
- `GREEN_TEST_COMMAND`: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30
  300 node_modules/.bin/vitest run tests/games/magic-defense --maxWorkers=1'`. Exit 0.
  Test Files: 5 passed (5). Tests: 102 passed (102).
- `git diff --exit-code -- src/games/magic-defense tests/games/magic-defense` exited 0.
  No Phase 1 task changed status in this evidence round. No production file or test file changed.
- Per-mutation logs and `results.json` are under
  `measure/runs/game_magic_defense_rebuild_20261029/mutations-r3/`. The provisional and final logs
  are not committed.

### Phase 1 closing evidence (after adversarial testing)

- Adversarial test commit `9b015077` adds `tests/games/magic-defense/rules.adversarial.test.ts`.
- Gate command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/magic-defense --maxWorkers=1'`. Exit code: 0.
  ` Test Files  6 passed (6)`
  `      Tests  116 passed (116)`
- Open nonblocking items carried to Phase 2:
  - RA-MD-3: Replace the empty missile presentation adapters and old battle views; owner Green; Phase 2.
  - RA-MD-4: Remove or document the unused seeded draws in `roundOf`; owner Green; Phase 2.
  - RA-MD-5: Resolve the recorded doctor errors and stale generated files; owner closeout-steward; Phase 2.
  - NB-MD-3: Compare one derived castle order per seed in H17; owner Red; Phase 2.
  - NB-MD-4: H17 does not pin the seed-to-order mapping; owner none; Phase 2.
  - NB-MD-5: H17 was not red against the original core; plan records the mutation evidence; owner none; Phase 2.
  - NB-1: Name the changed contract in the Phase 2 report status line; owner Green; Phase 2.
  - NB-2 / ADV-MD-2: Guard the QC hooks against a null command; owner Green; Phase 2.
  - ADV-MD-4: Keep unknown-command handling and extra-field behavior documented and tested; owner Green; Phase 2.
  - RA-MD-1 and RA-MD-2: closed by Red commit `8b1fb6e0` and recorded above.
  - NB-MD-1 and NB-MD-2: closed by Red commit `ba47b241` and recorded above.
  - ADV-MD-1 and ADV-MD-3: closed by adversarial test commit `9b015077`.

## Phase 2: Views

Status: open from 2026-11-27. The PM picked mockup c2,
`out/a28-mockups/1-magic-defense-c2.png` (four castles in a row, sunset). The PM owns the look pick
as a PM decision, not a Daniel gate. The A-28 mockups stay outside git in `out/a28-mockups/`.
Phase 1 is closed, so the first task below is ready for Red.

Roles: Red writes the failing view tests. Green builds both views, runs the QC bot, renders the
frames, updates the design, and sends the report.

- [x] Task: Write the failing view tests (Red). Test commit `72be75e1`.
  Owned paths: `tests/games/magic-defense/manifest.test.ts` and a new
  `tests/games/magic-defense/scene.test.ts`.
  Test these rows: no file in `src/games/magic-defense/` imports
  `src/games/shared/battle/stage3d.ts` or `src/games/shared/battle/stage2d.ts`; `MODELS_3D` and
  `FILES_2D` list the models and the sprites of the picked look; `FILES_2D` does not list
  `background.monster-encounters`.
  Red c2 contract: `MODELS_3D` holds `avatar-base`, `fireball`, `grass-ground`, `hill-slope`,
  `rampart`, and `skeleton-mage`. `FILES_2D` holds `background.magic-defense`, the three prop
  stills, `fireball.fly`, the avatar idle and cast clips, and the skeleton mage idle, attack, hit,
  and death clips. The shared `view/scene.ts` contract holds four castles in one x-ordered row,
  the far ridge, four mages, the foreground avatar, the missile height, the side camera, and the
  sunset. The spec gives no numeric camera or palette values. The tests check the stated side-view
  and warm-sunset invariants without invented float tolerances.
  Run `VIEW_TEST_COMMAND`. Record the failing result. Commit the tests alone, by explicit paths.
  - Red evidence (2026-11-27, role `measure-mid-red`, role base `8e5e893dba276cd65b2294eaaeb61e96314bc506`,
    phase base `8e5e893dba276cd65b2294eaaeb61e96314bc506`).
  - Command: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1'`.
    Exit code: 1. The raw log is `measure/runs/game_magic_defense_rebuild_20261029/red-views-vitest.log`.
    Every failure is an `AssertionError`. No collection error occurred. All other selected tests passed.
  - Failing case `manifest > lists the c2 models and binds every model from the listed packs`:
    `MODELS_3D` still holds the Sunken Vault models.
  - Failing case `manifest > the proposed c2 model load fits the 6 MB game budget`:
    the listed packs do not hold `fireball`, `grass-ground`, `hill-slope`, `rampart`, or `skeleton-mage`.
  - Failing case `manifest > lists the c2 sprites and baked background, not the Monster Encounters files`:
    `FILES_2D` still holds the party, the old monsters, and `background.monster-encounters`.
  - Failing case `c2 scene architecture > V1: no Magic Defense file imports stage3d or stage2d`:
    `view/game.ts` and `view/hud.ts` import `stage3d.js`; `view2d/game.ts` imports `stage2d.js`.
  - Failing case `c2 scene architecture > the 3D view uses the shared core, event driver, and c2 scene contract`:
    `view/game.ts` does not import `SCENE_LAYOUT` from `./scene.js`.
  - Failing case `c2 scene architecture > the 2D view uses the same core, event driver, and c2 scene contract`:
    `view2d/game.ts` does not import `SCENE_LAYOUT` from `../view/scene.js`.
  - Failing case `c2 scene architecture > the 2D projection uses the Magic Defense background`:
    `BACKGROUND_FILE` still equals `background.monster-encounters`.
  - Failing case `c2 scene architecture > the shared 3D layout puts four castles in a row under a side camera and sunset`:
    `src/games/magic-defense/view/scene.ts` does not exist.
  - Prettier check: `node_modules/.bin/prettier --check tests/games/magic-defense/manifest.test.ts tests/games/magic-defense/scene.test.ts`.
    Exit code: 0.
  - Type check: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node node_modules/typescript/bin/tsc --noEmit'`.
    Exit code: 2. Total diagnostics: 51. Owned diagnostics: 0 in `src/games/magic-defense/` and 0 in
    `tests/games/magic-defense/`. The raw log is
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-tsc.log`.
- [x] Task: Build the 3D view on the picked look (Green). Implementation commit `27675270`.
  Owned paths: `src/games/magic-defense/view/`, `manifest.ts`, `briefing.ts`, and `strings.en.ts`.
  Show the plain, the castles, the far ridge, and the skeleton mages.
  Show the held missiles with their Thai meanings and the student's avatar. Register every new model
  in the manifest and in a pack.
  - Evidence (2026-11-27, role `measure-jr-green`, phase base `8e5e893dba276cd65b2294eaaeb61e96314bc506`).
    New `view/scene.ts` (`SCENE_LAYOUT`, `SCENE_MODELS`, `placesOf`, `buildScene`), rebuilt `view/game.ts` and
    `view/hud.ts` on `Stage3D` (no import of `stage3d.ts` or `stage2d.ts` in the game). The new 3D pack
    `missile-defense` 1.0.0 (`rampart`, `hill-slope`, `skeleton-mage`, `fireball`, `avatar-base`; 1.3 MB) and
    `GAME_LOADS['magic-defense']` (1.46 MB of the 6 MB budget) in `src/apk3d/contracts/model-pack.ts`.
    The manifest packs are `missile-defense`, `flight-land`, and `heroes` (the budget check of the Red test
    counts the largest hero of the `heroes` pack).
  - Existing tests edited by Green, with the reason: `tests/games/shared/battle.test.ts` no longer lists Magic
    Defense (the Red handoff names this edit; the game leaves the shared battle stage), and
    `tests/apk3d/pack-bindings.test.ts` names the game's `SCENE_MODELS` instead of the vault models and
    skips the three preset heroes for a game that lists `avatar-base` (its hero is the student's avatar).
    The Red test files `manifest.test.ts` and `scene.test.ts` are unchanged.
  - `VIEW_TEST_COMMAND`: exit 0. Log `measure/runs/game_magic_defense_rebuild_20261029/green-views-gates-qc.log`.
    The log holds the counts. The eight Red cases pass.
    The wider command `vitest run tests/apk3d tests/games tests/old-browser tests/host --maxWorkers=1`: exit 0
    (log `measure/runs/game_magic_defense_rebuild_20261029/green-views-wide-vitest.log`).
  - `TYPE_CHECK_COMMAND`: exit 2 with the same total of diagnostics as the Red baseline (the log holds the count). Owned
    diagnostics: 0 in `src/games/magic-defense/`, `tests/games/magic-defense/`, and the changed scripts.
- [x] Task: Build the Phaser 2D view on the same core (Green). Implementation commit `92d00a01`.
  Owned path: `src/games/magic-defense/view2d/`.
  Show the same scene from the same core. Add the 2D sprites and the baked background of the picked
  look to the 2D pack.
  - Evidence: new `view2d/scene2d.ts` (`MissileStage2D`) and rebuilt `view2d/game.ts` on the shared core, the
    shared driver, and `SCENE_LAYOUT`. `BACKGROUND_FILE` is `background.magic-defense` (832 by 882 px at
    elevation 45, from `demo/bake.ts` and `scripts/apk2d-bake.ts`). The 2D pack `primary-chibi-2d` went from
    1.3.0 to 1.4.0 (19 new files: the avatar base clips, `fireball.fly`, the mage clips, `prop.rampart`,
    `prop.hill-slope`, and the background). The file `pack.json` also shows a key reorder of the background
    entries; no entry changed or left. No file of the game imports `stage2d.ts`.
- [x] Task: Run the QC bot in 3D and in 2D (Green). Implementation commit `f0b5a5f1`.
  Add a QC player for this game to `scripts/apk3d-shot.ts` when it has none.
  Run the QC run command in 3D and in 2D. Record the exit codes, the page errors, and the
  diagnostics. Run `VIEW_TEST_COMMAND` and `TYPE_CHECK_COMMAND` again and record the results.
  - Evidence: `playMagicDefense` in `scripts/apk3d-shot.ts` plays through the test hook `auto` (the core bot)
    with one wrong spell on purpose and the storm called.
  - 3D: `node --import tsx scripts/apk3d-shot.ts both --game magic-defense`. Exit code 0. Portrait and landscape:
    `wrong  one wrong spell cast on purpose`, `bot    wrong spell cast, storm called`, `diagnostics none`,
    `errors none`.
  - 2D: the same command with `--2d`. Exit code 0. Both layouts: the same four lines, no page error, no diagnostic.
  - Log: `measure/runs/game_magic_defense_rebuild_20261029/green-views-gates-qc.log`. Shots: `out/apk3d-shots/magic-defense/<layout>[-2d]/` (the held
    missiles, the castle hit, wave 2, wave 3, the storm, and the results).
  - `VIEW_TEST_COMMAND` again: exit 0. `TYPE_CHECK_COMMAND` again: exit 2, the Red baseline total, 0 owned.
    The QC hooks ignore a null command and a command during the event play (NB-2 and ADV-MD-2).
- [x] Task: Render one frame of the game and compare it across games (Green). Evidence commit is the plan-evidence commit that follows `23de33f9`.
  Run the frame command in 3D and in 2D. Look at each frame.
  Put each frame beside one frame of each other rebuild game and of Monster Encounters. Record that
  the scenes differ, the three largest differences from the picked mockup, and each path with its
  SHA-256.
  - Frame commands: `node --import tsx scripts/apk3d-shot.ts landscape --game <game> --first` and the same with
    `--2d`, for `magic-defense`, `monster-encounters`, `castle-defense`, `archers-revenge`, and
    `paladins-twin-soul`. Every exit code is 0, with `errors none` and `diagnostics none`. Log `measure/runs/game_magic_defense_rebuild_20261029/green-views-frames.log`.
    Portrait frames of the game (3D and 2D) were also rendered and looked at.
  - Look rounds: 4 (the sky shader, the ridge and plain scale, the camera span, and the 2D bake extent changed).
  - The scenes differ: the sheet `measure/runs/game_magic_defense_rebuild_20261029/views/compare-landscape.png` puts the 3D frames (top row) and the 2D
    frames (bottom row) of the five games side by side. The four other games show the same vault hall.
    Magic Defense shows a sunset plain with castles, a ridge, mages, and the avatar.
  - The three largest differences from the picked mockup `out/a28-mockups/1-magic-defense-c2.png`
    (SHA-256 `197a8a1e573b3ad9d9f63ac31337258215ed3276ccf5fd44da3099dfb22557a1`, side by side in
    `measure/runs/game_magic_defense_rebuild_20261029/views/mockup-vs-3d.png`):
    1. The mockup puts the skeleton mages on top of the castles. The scene puts them on the far ridge (spec).
    2. The mockup castle is a low, wide drum. The `rampart` model is a tall tower with a wall on one side.
    3. The mockup camera is near the ground: a thin band of grass, a big sun, and clouds. The scene camera is
       farther back, with about 40 percent grass, a smaller sun, and no clouds.
  - Paths with SHA-256 (the folder `measure/runs/game_magic_defense_rebuild_20261029/views/` holds copies; `SHA256.txt` lists all):
    - `measure/runs/game_magic_defense_rebuild_20261029/views/magic-defense-3d-landscape.png`: `ecae970a978cf41f7b05b484d4f841be71b4a33763c22fab3d16ff9afb4b69ed`
    - `measure/runs/game_magic_defense_rebuild_20261029/views/magic-defense-2d-landscape.png`: `46cf63c641742791a5da6cea4c5efff8596179b7d53bdfa11e38c85a12b41c7f`
    - `measure/runs/game_magic_defense_rebuild_20261029/views/compare-landscape.png`: `c3a91884e87650ee804cf6cd62f6fc5566b745fbafc5eaf13283a9a68c215899`
    - `measure/runs/game_magic_defense_rebuild_20261029/views/mockup-vs-3d.png`: `02c7a2becaeada040365693c9a795f785b82f60e4bb4050c8f2e65c94be79673`
    - Other games (scratch, `out/frames/` of this worktree): monster-encounters 3D `63c3efc2afb1c8697952485285d7e328de150b4bbaaeabba1fb867247c0c3470`,
      2D `fb03b7a25a8d5fa39ea6b21fa18475de67e508a39eb5e13f534d7336cbf56c66`; castle-defense 3D
      `2a20b69985e1a2db9c7142f67c09fddd6eb935c02940eb4cf1dbe3fb0555fc20`, 2D `dbd68e1f3ce3617f6c6f2b8b51e43c99941d250838c0973a2ae4c13cdca2efc2`;
      archers-revenge 3D `67725004b271b88af1e1df5704aced02425104163b2f8c0e17ce3ca4ce6d3895`, 2D
      `8f812d7e4e572e975b83c7e6db9f84d235599c1874b71402dc136721045d84cb`; paladins-twin-soul 3D
      `946fb78500f3f4846a2ee35b3f9455567eb5d41124934b0896c9a98563dcff80`, 2D `e0dcc8d84a1635c44791340c0348fb607c2b9576bfb84b08d8f67d9f63f27307`.
- [x] Task: Update the design document (Green). Commit `23de33f9`.
  Owned path: `docs/game-magic-defense-3d.md`.
  Describe the rebuilt scene, the rules, the commands, the events, the evidence, and the screens.
- [x] Task: Close Review A and C gaps (Red). Test commit `e9cc1719`.
  Owned paths: `tests/games/magic-defense/views-review.test.ts` (new) and this plan.
  Test the blocking rows: F1 the replaced missile actor is removed in both views; F2/A-F1
  flight, held, and impact are separate missile states and only held missiles bob; F3/A-F3 the
  avatar and the castles stand on the grass surface; F4 the baked 2D background shows the c2
  sunset sky past the top strip; F5 the mute and storm controls expose localized names and states
  and size from the composition minimum at 390x844 and 844x390; F6 long Thai labels stay inside
  the scene width; A-F2 `GAME_LOADS` lists `avatar-base` with no preset hero and the un-skipped
  hero binding rule holds for the other hero games. Cheap nonblocking rows: C-F8 the 2D card
  shows blocked words and marks the active missile past a scale change; A-F6 the QC player fails
  when the wrong spell or the storm is missing. No file in `src/`, `scripts/`, or `assets/` changes.
  - Red evidence (2026-11-27, role `measure-mid-red`, role base `dc2442fd43f2d30fb66ecd4561a8b212cc3a673c`,
    phase base `8e5e893dba276cd65b2294eaaeb61e96314bc506`).
  - Command: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
    -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense tests/apk3d/pack-bindings.test.ts
    tests/apk3d/budget.test.ts --maxWorkers=1'`. Exit code: 1. `Test Files: 1 failed, 9 passed (10)`.
    `Tests: 25 failed, 235 passed (260)`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r2-vitest.log` (not committed).
  - Every failure is an `AssertionError` (25 occurrences). No failure is a `TypeError` or a
    collection error. All other selected tests passed, including the 8 earlier Red view cases.
  - The 25 failing cases: F1 3D throwMissile drops the replaced actor, F1 2D throwMissile destroys
    the replaced actor, F2 3D missile flight-state field, F2 3D only held missiles bob, F2 3D flight
    leaves held state until the tween ends, F2 3D impact restores held state after re-form, F2 2D
    flight does not bob mid-flight, F3 avatar on grass surface (avatar y 0 vs surface 0.1782 m),
    F3 castles on grass surface, F4 baked sky past the top strip (deepest warm band top 5% vs 25%
    required), F4 projection below 45 degrees (got 45), F5 catalog mute name and state, F5 3D mute
    name, F5 3D storm name, F5 2D icon names, F5 2D storm ready state, F5 composition minimum,
    F6 3D tag clamp, F6 2D label clamp, A-F2 avatar-base in GAME_LOADS, A-F2 no preset hero,
    A-F2 generic rule with no skip, C-F8 2D blocked words disabled, C-F8 2D active mark, A-F6 QC
    fails on missing actions.
  - Two passing guards in the same file pin Green against regressions: the 2D background id is
    already `background.magic-defense`, and potion-rush, village-guardian, and monster-encounters
    already bind the preset heroes.
  - Prettier check: `node_modules/.bin/prettier --check
    tests/games/magic-defense/views-review.test.ts`. Exit code: 0 (`plan.md` keeps its
    pre-existing prettier drift from HEAD; not reformatted).
  - Type check: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c
    'timeout -k 30 600 node node_modules/typescript/bin/tsc --noEmit'`. Exit code: 2. Total
    diagnostics: 51. Owned diagnostics: 0 in `tests/games/magic-defense/` (none names
    `views-review.test.ts`). Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r2-tsc.log` (not committed).
  - Nonblocking findings without a cheap test go to Green or tech-debt, not to this round: Review
    A F4 (extensionless-import scan, unused-import check, settled-card capture), Review A F5 (plan
    background size 832x882 vs generated 896x769; test-strategy section 11 post-pick revision),
    Review C F7 (settled-round QC captures, Helper-mode frames, 844x390 touch layout), Review
    C F9 (design table coordinates vs final scene and pack).
- [x] Task: Close Review A and C view gaps (Green). Implementation commit `3763e339`; plan evidence
  `ee5c87cf`. Owned paths: the 3D view, HUD, scene, the 2D
  view and stage, the projection and baked background, `scripts/apk2d-bake.ts`, `scripts/apk3d-shot.ts`,
  the model-load contract, and the generic pack-binding test. Fix F1 actor replacement, F2 missile
  states, F3 actor ground, F4 the c2 sunset projection, F5 control names, states and touch targets,
  F6 wrapped clamped labels, A-F2 the avatar load, and the cheap C-F8 and A-F6 rows. The Phase 1
  core stays unchanged. No committed Red test changes.
  - Implementation commit `3763e339` (role base `e9cc1719`, phase base `8e5e893d`). Mid Red commits
    `5bca65ed` and `8f19c033` reconciled the two older rows below; their logs record the clean gate.
  - `VIEW_TEST_COMMAND` exit 1: `Test Files 2 failed, 8 passed (10)`, `Tests 2 failed, 258 passed
    (260)`. All 25 cases of `views-review.test.ts` now pass. The wider command
    `vitest run tests/apk3d tests/games tests/old-browser tests/host --maxWorkers=1` exited 1 with
    the same two failures (`2 failed, 2778 passed, 3 skipped`). Logs: `green-r2-view-tests.log` and
    `green-r2-wide-tests.log` in the run folder.
  - Two committed Red tests contradict the new Red contract. `tests/games/magic-defense/manifest.test.ts:86`
    (commit `72be75e1`) asserts `GAME_LOADS['magic-defense'].hero === true`; the new
    `views-review.test.ts:354` asserts it is `false` because the student's `avatar-base` replaces a
    preset hero. `tests/games/magic-defense/scene.test.ts:156` (commit `72be75e1`) asserts every
    castle `y === 0`; the new `views-review.test.ts:221,231` asserts `y` equals the grass-top surface
    `0.081 * SCALES.grass = 0.1782 m`. Both pairs cannot hold at once. Green did not edit either
    committed Red test. Handoff: Mid Red retry must update the two older Red rows to the c2 contract
    before Green can close this task.
  - `TYPE_CHECK_COMMAND` exit 2: 51 total diagnostics, the Red baseline; 0 owned diagnostics in
    `src/games/magic-defense/`, the changed scripts, or the changed shared files. Log:
    `green-r2-tsc.log`.
  - The c2 backdrop was rebaked at a 12-degree side projection (896x522) and packed as
    `primary-chibi-2d` 1.4.1. Only the magic-defense background, `pack.json`, the version table, and
    `projection.gen.ts` changed. Logs: `green-r2-bake.log` and `green-r2-pack.log`. The shared bake
    script keeps 45 degrees for every other game; Magic Defense alone uses the side pitch the spec
    names. The shared `hud2d.ts` gained optional word wrap, an accessible name, and a touch radius;
    `card2d.ts` gained an optional disabled choice. Both keep their old defaults for other games.
    `model-pack.ts` lists the six actual models with `hero: false`; the generic pack-binding rule no
    longer skips avatar-base games.
  - QC: `scripts/apk3d-shot.ts both --game magic-defense` exit 0 in both phone layouts, and the
    same command with `--2d` exit 0. Each layout logged `wrong one wrong spell cast on purpose`,
    `bot wrong spell cast, storm called`, `diagnostics none`, `errors none`. The new QC assertion
    (A-F6) throws when either action is missing. Logs: `green-r2-qc-3d.log` and `green-r2-qc-2d.log`.
  - One look round against mockup c2. The 3D landscape now shows the warm sky and the sun, with the
    avatar and castles on the grass. The 2D landscape shows the sunset sky and the ridge instead of
    the old top-down grass. The four settled frames and their SHA-256 are under `views/` in
    `green-r2-3d-landscape.png`, `green-r2-3d-portrait.png`, `green-r2-2d-landscape.png`, and
    `green-r2-2d-portrait.png`, summed in `views/SHA256-r2.txt`.
  - Nonblocking items left for the next owner: Review A F4 (extensionless-import scan, unused-import
    check, settled-card capture), A F5 (plan background size and test-strategy section 11), Review C
    F7 (settled-round QC captures, Helper-mode frames, an 844x390 touch layout), and C F9 (design
    table coordinates). C F8 and A F6 were fixed cheaply and are covered by the new Red cases.
- [x] Task: Reconcile older Red rows with the c2 contract (Red). Test commit `5bca65ed`.
  Owned paths: `tests/games/magic-defense/manifest.test.ts`, `tests/games/magic-defense/scene.test.ts`,
  and this plan.
  Green evidence `green-ee5c87cf.log` shows all 25 new Red cases pass and two older committed Red
  rows contradict the new contract, so no implementation can satisfy both. Decide from the spec:
  the shared avatar rule (the student's own avatar is the hero; no preset hero stands in) and
  Review A F2 make `hero: false` with `avatar-base` listed the right side; FR-10 with Review C F3
  and A F3 make the grass surface (0.1782 m) the right side. Update the two older rows to the c2
  contract and weaken nothing else. No file in `src/`, `scripts/`, or `assets/` changes.
  - Red evidence (2026-11-27, role `measure-mid-red`, role base `37abb506e782ac1709d6e831d3e4bc90b6db2942`,
    phase base `8e5e893dba276cd65b2294eaaeb61e96314bc506`). The new Red contract stands: the two
    older rows were the wrong side in each contradiction.
  - Row 1 `manifest.test.ts` "the proposed c2 model load fits the 6 MB game budget": the load is now
    `{ models: [...C2_MODELS_3D], hero: false }` (avatar-base listed, no preset hero); the row still
    asserts zero budget errors and now also asserts the registered load lists `avatar-base` and has
    `hero: false`. Nothing else in the file changed.
  - Row 2 `scene.test.ts` "the shared 3D layout puts four castles in a row under a side camera and
    sunset": the castles now stand on `GRASS_SURFACE_M` within 0.005 m (the scene module exports it;
    the row asserts it is positive first). Every other assertion of the row is unchanged: four
    x-ordered castles at one depth, the far ridge, four mages, the foreground avatar, the side
    camera, and the warm sunset.
  - `VIEW_TEST_COMMAND` exit 0: `Test Files 10 passed (10)`, `Tests 260 passed (260)`.
  - Wider `vitest run tests/apk3d tests/games tests/old-browser tests/host` exit 0: `Test Files 177
    passed, 1 skipped (178)`, `Tests 2780 passed, 3 skipped (2783)`.
  - Prettier check exit 0 on both test files (`plan.md` keeps its pre-existing drift).
  - `TYPE_CHECK_COMMAND` exit 2: 51 total diagnostics (the Red baseline), 0 owned.
- [x] Task: Pin the Review C F5, F6, and F8 gaps (Red). Test commit `8f19c033`.
  Owned paths: `tests/games/magic-defense/views-access.test.ts` (new),
  `tests/games/magic-defense/views-review.test.ts` (superseded rows removed), and this plan.
  Review C at 5bca65ed fails with F5 (2D controls have no accessible semantics; canvas icons render
  below the 44 CSS px minimum after FIT scaling) and F6 (3D keepX clamps to the full root, so long
  tags enter the answer card); F8 (active marker is color-only) is nonblocking but pinned here.
  The older F5/F6/C-F8 Red rows only inspect strings and permit these defects, so this round
  tightens them to: real DOM buttons with localized names and states in the 2D view (keyboard by
  default), a 44 CSS px minimum at 390x844 and 844x390, FIT-scale-converted touch sizes, free-scene
  and card-aware width/vertical tag clamps in 3D, and a non-color active marker. No file in `src/`,
  `scripts/`, or `assets/` changes.
  - Superseded rows removed from `views-review.test.ts` (their stronger successors live in
    `views-access.test.ts`; keeping them would false-fail a Green that replaces canvas icons with
    DOM buttons): the 2D icon-name, storm-icon-object, and composition-minimum cases; the keepX-only
    3D clamp case; the color-tolerant 2D active case. All other rows of that file are unchanged.
  - Red evidence (2026-11-27, role `measure-mid-red`, role base `5bca65edc7496fd8c011a36215413fe8e7c`,
    phase base `8e5e893dba276cd65b2294eaaeb61e96314bc506`).
  - Command: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
    -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense tests/apk3d/pack-bindings.test.ts
    tests/apk3d/budget.test.ts --maxWorkers=1'`. Exit code: 1. `Test Files: 1 failed, 10 passed (11)`.
    `Tests: 8 failed, 258 passed (266)`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r3-vitest.log` (not committed).
  - Every failure is an `AssertionError` (8 occurrences). No failure is a `TypeError` or a
    collection error. All other selected tests pass, including the 3 new guards (FIT calibration,
    longest-label wrap, 3D text marker).
  - The 8 failing cases: F5 DOM buttons, F5 names and states, F5 44 CSS px minimum, F5 FIT-scale
    conversion; F6 free-rect clamp, F6 width-aware card margin, F6 free vertical clamp; F8 non-color
    active marker.
  - Prettier check exit 0 on both test files (`plan.md` keeps its pre-existing drift).
  - Type check: exit 2, 51 total diagnostics (the Red baseline), 0 owned in
    `tests/games/magic-defense/`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r3-tsc.log` (not committed).
- [x] Task: Close the last Review C view gaps (Green). Implementation commit `d70fbab5`. Owned paths:
  the 2D view and its new CSS, the 3D HUD, the game's CSS, the design record, and this plan. F5
  replaces the 2D canvas icons with native DOM buttons that carry localized names, states and 44
  CSS-px touch targets. F6 clamps 3D tags to the free scene rectangle with a width-aware card margin
  and a free vertical bound. F8 adds a non-color active marker. The Phase 1 core and all committed
  Red tests stay unchanged; no test file changed in this round.
  - Role base `8f19c0331f56d2007171cb4b6423ae161abda3df`; phase base
    `8e5e893dba276cd65b2294eaaeb61e96314bc506`. Red commit `8f19c033` is inside the phase range.
    The earlier `[~]` task is closed by Red commits `5bca65ed` and `8f19c033`; its block note no
    longer applies.
  - `VIEW_TEST_COMMAND` exit 0: `Test Files 11 passed (11)`, `Tests 266 passed (266)`. Before the
    change the same command exited 1 with the 8 cases of `views-access.test.ts`. Wider
    `vitest run tests/apk3d tests/games tests/old-browser tests/host` exit 0: `Test Files 178 passed,
    1 skipped (179)`, `Tests 2786 passed, 3 skipped (2789)`. Logs: `green-r4-red-rerun.log`,
    `green-r4-view-tests.log`, and `green-r4-wide-tests.log`.
  - `TYPE_CHECK_COMMAND` exit 2 with 51 total diagnostics, the Red baseline, and 0 owned diagnostics
    in the game, the shared 2D widgets, or the QC script. Log: `green-r4-tsc.log`.
  - New file `src/games/magic-defense/view2d/magic-defense-2d.css` sizes the native buttons in CSS
    pixels; the FIT scale cannot shrink a 44 CSS-px target. The buttons use catalog names
    (`mute`, `muted`, `unmuted`, `stormButton`, `stormReady`, `stormCharging`, `story`) and real
    `disabled` and `aria-pressed` states. The 3D tag clamp reads the free fraction passed from
    `view/game.ts` and measures the tag width before bounding it. The 2D active label gains a named
    `☄ Missile` badge over a dark fill and a gold frame.
  - Cheap nonblocking fixes: F10 removes the old Thai label at the 2D replacement boundary; F11
    scopes the 3D status button rule to `.md-status button`; F9 updates the design table to the
    delivered values (grass surface 0.1782 m, castles x -2.85..2.85, ridge 2.2 m, missile 2.3 m,
    camera (0,1,6.5), 12-degree bake, 896x522, pack 1.4.1).
  - Corrected stale evidence. The earlier round named "both phone layouts" but the QC command then
    used 390x844 touch portrait and 1280x720 non-touch landscape. This round adds a touch
    `844x390` run to `scripts/apk3d-shot.ts` and captures settled frames at all three sizes.
    Helper-mode settled captures (Review C F7) remain with the UX browser auditor.
  - Corrected the A-F5 decline reason. The earlier plan copied 832x882 from an intermediate bundle,
    not from the delivered bake. The delivered projection is 12 degrees and 896x522 in
    `primary-chibi-2d` 1.4.1; the design table above now records those values. Section 11 of
    `test-strategy.md` still calls Phase 2 blocked because it predates the recorded c2 pick; the
    pick is recorded in `spec.md` and at the top of this plan.
  - QC: `apk3d-shot.ts both --game magic-defense` exit 0 in portrait and landscape, and the same
    with `--2d` exit 0. The new `touch-landscape` layout exit 0 in both renderers. Every run logged
    one deliberate wrong cast, a storm, `diagnostics none`, and `errors none`. Logs:
    `green-r4-qc-3d.log`, `green-r4-qc-2d.log`, `green-r4-qc-touch-3d.log`,
    `green-r4-qc-touch-2d.log`.
  - Three look rounds against mockup c2. The frames show the sunset scene, the 44 CSS-px DOM
    buttons, clamped Thai tags, and the named active badge at each size. Six settled frames and
    their SHA-256 are under `views/` in `green-r4-{3d,2d}-{390x844,844x390,1280x720}.png`, summed
    in `views/SHA256-r4.txt`.
- [x] Task: Pin the 2D controls-over-reader regression (Red). Test commit `76c3bbfc`.
  Owned paths: `tests/games/magic-defense/views-overlay.test.ts` (new) and this plan.
  Review A at 0f3df319 fails with A-R3-1: the new 2D DOM controls (`z-index: 30`) cover the host
  story reader (`z-index: 20`) and stay interactive while the game is paused. Pin: (1) the controls
  stack below host overlays, against the reader's own z-index; (2) controls go non-interactive
  (disabled or inert, so pointer and keyboard input stop) while paused or the reader is open;
  (3) closing the reader / resume restores them. Tests only; no `src/` edit.
  - Red evidence (2026-11-27, role `measure-mid-red`, role base `0f3df31919015183092fcd021e7b48847ffd6b5a`,
    phase base `8e5e893dba276cd65b2294eaaeb61e96314bc506`).
  - Command: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
    -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense tests/apk3d/pack-bindings.test.ts
    tests/apk3d/budget.test.ts --maxWorkers=1'`. Exit code: 1. `Test Files: 1 failed, 11 passed (12)`.
    `Tests: 3 failed, 267 passed (270)`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r4-vitest.log` (not committed).
  - Every failure is an `AssertionError` (3 occurrences). No failure is a `TypeError` or a
    collection error. All other selected tests pass.
  - The 3 failing cases: controls z 30 stays below reader z 20 (stacking, live-parsed from both
    stylesheets); suppression tied to pause or the open reader (the only `disabled` assignment is
    the storm-readiness line); restore on resume or reader close (no re-enable path exists).
  - Prettier check exit 0 on the new test file (`plan.md` keeps its pre-existing drift).
  - Type check: exit 2, 51 total diagnostics (the Red baseline), 0 owned in
    `tests/games/magic-defense/`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r4-tsc.log` (not committed).
- [x] Task: Fix the 2D controls-over-reader regression (Green). Implementation commit `780d611f`.
  Routed from Review A A-R3-1. Owned paths: `src/games/magic-defense/view2d/game.ts` and
  `magic-defense-2d.css` only.
  - Role base `6d5489ae45c2cc453181b0668b02cacab425a8f2`; phase base
    `8e5e893dba276cd65b2294eaaeb61e96314bc506`. Red commit `76c3bbfc` is inside the phase range.
  - The control layer now has `z-index: 10`, below the host reader's `.reader.over-game` z-index of
    20. A scene `pause` event, a `resume` event, and a DOM MutationObserver on `.reader.over-game`
    keep `disabled`, `aria-disabled`, and `inert` in step. The storm button also honors mana after a
    restore. Listeners and the observer are removed at shutdown.
  - `VIEW_TEST_COMMAND` exit 0: `Test Files 12 passed (12)`, `Tests 270 passed (270)`. Before the
    change the same command exited 1 with three `views-overlay.test.ts` cases. Wider
    `vitest run tests/apk3d tests/games tests/old-browser tests/host` exit 0: `Test Files 179 passed,
    1 skipped (180)`, `Tests 2790 passed, 3 skipped (2793)`. Logs: `green-r5-red-rerun.log`,
    `green-r5-view-tests.log`, and `green-r5-wide-tests.log`.
  - `TYPE_CHECK_COMMAND` exit 2 with 51 total diagnostics, the Red baseline, and 0 owned. Log:
    `green-r5-tsc.log`.
  - Live 390x844 probe through the heavy runner: controls z 10 and reader z 20 while open; controls
    inert true and all three buttons disabled with `aria-disabled="true"`; `elementFromPoint` at
    each control center returned the reader (`H1`, `H1`, `SPAN.pill`), all with `inReader: true`
    and `inControls: false`; a click with the reader open left mute `aria-pressed` at `false`.
    After closing the reader the layer was inert false, mute and story were enabled, hit test
    returned `BUTTON.md2d-control` at all three centers, and a mute click changed `aria-pressed`
    from false to true. The 44 by 44 CSS-px sizes stayed unchanged. `ERRORS none`. Log:
    `green-r5-live-probe.log`; the two frames and SHA-256 are in `views/SHA256-r5.txt`.
  - QC: `apk3d-shot.ts both --game magic-defense` exit 0 in 3D and with `--2d` in 2D. Each of the
    three sizes logged one wrong cast, a storm, `diagnostics none`, and `errors none`. Logs:
    `green-r5-qc-3d.log` and `green-r5-qc-2d.log`.
  - No committed Red test or Phase 1 core file changed. No shared source file changed in this round.
- [x] Task: Pin game-level pause suppression for the 2D controls (Red). Test commit `e376308c`.
  Owned paths: `tests/games/magic-defense/views-overlay.test.ts` and this plan.
  Review C at b3b68e62 fails with F15: the factory pauses the Phaser game before the scene pause
  event can fire, so game-only pause leaves the 2D DOM controls active (Enter activated mute
  while paused). Pin: the view subscribes to synchronous game-level pause/resume events in
  addition to the scene events (teardown on shutdown), and a pure unit test with a fake game
  event emitter fires pause on the game (not the scene) and asserts the controls go
  disabled/inert and resume restores them. Tests only; no `src/` edit.
  - Red evidence (2026-11-27, role `measure-mid-red`, role base `b3b68e62ea2c58dda01177807f10d3fbe9d4c1c5a`,
    phase base `8e5e893dba276cd65b2294eaaeb61e96314bc506`).
  - Command: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
    -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense tests/apk3d/pack-bindings.test.ts
    tests/apk3d/budget.test.ts --maxWorkers=1'`. Exit code: 1. `Test Files: 1 failed, 11 passed (12)`.
    `Tests: 4 failed, 271 passed (275)`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r5-vitest.log` (not committed).
  - Every failure is an `AssertionError` (4 occurrences). No failure is a `TypeError` or a
    collection error, and no unhandled rejection remains. All other selected tests pass.
  - The 4 failing cases: game-level pause subscription, game-level teardown on shutdown, game
    pause (not scene pause) disables with resume restoring, shutdown disconnects game-level
    listeners. The unit harness mounts the real `createGameConfig` with a fake scene, fake DOM,
    and a fake game event emitter; the scene-pause guard still passes.
  - Prettier check exit 0 on the extended test file (`plan.md` keeps its pre-existing drift).
  - Type check: exit 2, 51 total diagnostics (the Red baseline), 0 owned in
    `tests/games/magic-defense/`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r5-tsc.log` (not committed).
- [x] Task: Fix game-level pause suppression for the 2D controls (Green). Implementation commit `374aa26d`.
  Routed from Review C F15. Owned paths: `src/games/magic-defense/view2d/game.ts`
  and the browser evidence.
  - Role base `0a558ff114fc290220b0d56bcf26616b7421ae8e`; phase base
    `8e5e893dba276cd65b2294eaaeb61e96314bc506`. Red commit `e376308c` is inside the phase range.
  - The view now subscribes to `scene.game.events` pause and resume alongside the scene listeners.
    A separate `gamePaused` flag joins `scenePaused` and the reader class in `syncControls`.
    Game resume clears both pause flags, keeps the storm disabled until mana is ready, and
    shutdown removes the game-level listeners with the scene listeners and the observer.
  - `VIEW_TEST_COMMAND` exit 0: `Test Files 12 passed (12)`, `Tests 275 passed (275)`. Before the
    change the same command exited 1 with four `views-overlay.test.ts` cases. Wider
    `vitest run tests/apk3d tests/games tests/old-browser tests/host` exit 0: `Test Files 179 passed,
    1 skipped (180)`, `Tests 2795 passed, 3 skipped (2798)`. Logs: `green-r6-red-rerun.log`,
    `green-r6-view-tests.log`, and `green-r6-wide-tests.log`.
  - `TYPE_CHECK_COMMAND` exit 2 with 51 total diagnostics, the Red baseline, and 0 owned. Log:
    `green-r6-tsc.log`.
  - Live 390x844 probe used the real Phaser Game captured from the Vite-loaded module through the
    production pause call. Reader open gave controls z 10 below reader z 20, inert true, all
    buttons disabled with `aria-disabled="true"`, and hit tests in the reader. Reader close
    restored inert false, mute and story enabled, and hit tests in the controls. Game pause with
    no reader gave `gamePaused=true`, `readerOpen=false`, inert true, all buttons disabled, and
    focus null; Enter left mute `aria-pressed=false` and a click left it `false`. Game resume gave
    inert false and mute and story enabled; Enter then changed `false` to `true` with focus on
    Sound, and a click changed `true` back to `false`. Buttons stayed 44 by 44 CSS px and Storm
    stayed 84 by 44. `ERRORS none`. Log: `green-r6-live-pause.log`. Two frames and SHA-256 are in
    `views/SHA256-r6.txt`.
  - QC: `apk3d-shot.ts both --game magic-defense` exit 0 in 3D and with `--2d` in 2D. Each of
    three sizes logged one wrong cast, a storm, `diagnostics none`, and `errors none`. Logs:
    `green-r6-qc-3d.log` and `green-r6-qc-2d.log`.
  - No committed Red test or Phase 1 core file changed. No shared source file changed.
- [x] Task: Pin adversarial/UX gaps — avatar fallback, 3D key suppression, 2D answers, Thai wrap (Red). Test commit `d102c1b0`.
  Owned paths: `tests/games/magic-defense/views-adversarial.test.ts` (new) and this plan.
  Adversarial (ADV-V1 avatar-base fallback, ADV-V2 3D key cast) and UX browser review (F1 = ADV-V2,
  F2 answer targets, F3 Thai wrap) fail at a0bc6183. Pin with failing tests: (1) neutral silhouette
  fallback when avatar-base assets are missing in both views; (2) 3D keyboard suppression while
  paused/reader open with restore; (3) native DOM 2D answer buttons, 44 CSS px, keyboard
  operable; (4) Thai no-mid-word-break wrap plus mage-clear placement for the longest label at
  390x844, 844x390, 1280x720. Cheap guards for ADV-V4 (independent hero list). ADV-V3, ADV-V5,
  UX F4-F7 go to tech debt. Tests only; no `src/` edit.
  - Red evidence (2026-11-27, role `measure-mid-red`, role base `a0bc61839fb3f0d5fc2ca1bc48e80ced32f31159`,
    phase base `8e5e893dba276cd65b2294eaaeb61e96314bc506`).
  - Command: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
    -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense tests/apk3d/pack-bindings.test.ts
    tests/apk3d/budget.test.ts --maxWorkers=1'`. Exit code: 1. `Test Files: 1 failed, 12 passed (13)`.
    `Tests: 14 failed, 277 passed (291)`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r6-vitest.log` (not committed).
  - Every failure is an `AssertionError` (14 occurrences). No failure is a `TypeError` or a
    collection error, and no unhandled rejection remains. All other selected tests pass.
  - The 14 failing cases: V1 playerBody fallback unit + base-load guard; V1 2D missing-base and
    missing-sheets fallback units; F1 pause/resume implemented, HUD suppression, cast guard, and
    the Enter-suppression unit; F2 DOM answers with names and 44px, click activation, and the
    keyboard unit; F3 no-mid-word-break wrap and mage-clear placement.
  - Prettier check exit 0 on the new test file (`plan.md` keeps its pre-existing drift).
  - Type check: exit 2, 51 total diagnostics (the Red baseline), 0 owned. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r6-tsc.log` (not committed).
  - Tech debt (no failing tests left behind): ADV-V3 2D rotation recompose on orientation change;
    ADV-V5 QC assertions for heart loss, castle restoration, and fail-on-errors/diagnostics;
    UX F4 c2-vs-live composition note, F5 2D composition and blank orange area, F6 feedback card
    viewport escape, F7 strategy section 11 refresh. ADV-V6 is covered by the F2 DOM-answer pins.
- [x] Task: Fix the adversarial/UX blockers (Green). Implementation commit `2352f657`. Routed from
  ADV-V1, ADV-V2/UX F1, F2, F3. Owned paths: `src/games/magic-defense/view/` and `view2d/`,
  `src/apk3d/stage/avatar.ts`, `src/apk3d/view2d/card2d.ts`, and `scripts/apk3d-shot.ts`.
  - Role base `7ac2ae6caaa4c334eb9e944226640557a5ee972d`; phase base
    `8e5e893dba276cd65b2294eaaeb61e96314bc506`. Red commit `d102c1b0` is inside the phase range.
  - ADV-V1: `playerBody` catches a missing or failed base and returns a neutral grey `fallback`
    body with an `apk3d/avatar-fallback` warning. The 2D view supplies a neutral `FigureSource`
    when no avatar sheets load, so `Figure2D` displays its silhouette texture and the round starts.
    The shared avatar helper keeps its existing behavior when assets load.
  - ADV-V2/UX F1: `Game3DInstance.pause` and `resume` now call `MagicHud.setPaused`, and the 3D
    dispatch and auto hooks check `paused`. The HUD disables answer and status buttons while
    paused and restores them, keeping blocked choices disabled.
  - UX F2: `Card2D.choose` creates native DOM buttons with catalog text, `aria-label`, disabled
    state, 44 CSS-px minimums, and a `click` listener. They sit over the canvas chips at the card's
    final position, survive FIT scaling, and honor `setAnswersPaused` from the 2D pause/reader path.
    The shared card keeps canvas chips and pointer targets for the other games.
  - UX F3: Thai tags use `Intl.Segmenter('th')` to insert `<wbr>` at word boundaries. The CSS drops
    `overflow-wrap:anywhere`, uses `word-break:keep-all`, and sets a 96 px minimum width. The 3D
    tag point keeps the label clear of the throwing mage actor.
  - `VIEW_TEST_COMMAND` exit 0: `Test Files 13 passed (13)`, `Tests 291 passed (291)`. Before the
    change the same command exited 1 with 14 cases of `views-adversarial.test.ts`. Wider
    `vitest run tests/apk3d tests/games tests/old-browser tests/host` exit 0: `Test Files 180 passed,
    1 skipped (181)`, `Tests 2811 passed, 3 skipped (2814)`. Logs: `green-r7-red-rerun.log`,
    `green-r7-view-tests.log`, and `green-r7-wide-tests.log`.
  - `TYPE_CHECK_COMMAND` exit 2 with 51 total diagnostics, the Red baseline, and 0 owned. Log:
    `green-r7-tsc.log`.
  - Live Chromium at 390x844 and 1280x720: with `avatar-base.glb` blocked, both renderers reached a
    round (`castles=2` in Helper mode) with `apk3d/avatar-fallback` in 3D; with the avatar sheets
    blocked, 2D also reached a round. Both frames show a neutral grey figure. Log:
    `green-r7-live-fallback.log`.
  - Live 390x844 3D reader: with the reader open, Tab, Tab, Enter and Space left `casts` at 0;
    after close it was still 0. Thai tags at 390x844, 844x390 and 1280x720 carried `<wbr>`,
    `word-break: keep-all`, widths 96 to 136 CSS px, and no card overlap. 2D answer buttons were
    44 CSS px high at both touch sizes (x 19.5 / 486.3), focused as `.apk2d-answer`, and Enter
    changed casts from 0 to 1. Logs: `green-r7-live-keys.log`, `green-r7-live-fallback.log`.
    Frames and SHA-256 are in `views/SHA256-r7.txt`.
  - Cheap nonblocking fix ADV-V5: the QC player now fails when the deliberate wrong cast does not
    cost a heart or the storm does not mend the castles. QC exit 0 in 3D and 2D at three sizes, each
    with a wrong cast, a storm, no diagnostics, and no errors. Logs: `green-r7-qc-3d.log` and
    `green-r7-qc-2d.log`.
  - Tech debt left for the next owner: ADV-V3 2D rotation recompose; UX F4 c2-vs-live composition
    note, F5 2D composition and blank orange area, F6 feedback card viewport escape, F7 strategy
    section 11 refresh; ADV-V5 fail-on-page-errors and diagnostics in the shared QC runner. None
    has a failing test in this round. ADV-V4 and ADV-V6 have passing guards.
  - No committed Red test or Phase 1 core file changed. No shared source file regressed its default
    behavior for other games.
- [x] Task: Pin the six review-a/c regressions (Red). Test commit `d8373d27`.
  Owned paths: `tests/games/magic-defense/views-regress.test.ts` (new) and this plan.
  Review A and C at 1a1fe424 fail with A-R7-2/F16, A-R7-1/F17, A-R7-3, F18, F19, and F20.
  The Card2D contract uses a final `{ nativeAnswers?: boolean }` option. The default stays canvas-only.
  Only Magic Defense passes `nativeAnswers: true`. No file in `src/` changes in this round.
  - Red evidence (2026-11-27, role `measure-mid-red`, role base
    `1a1fe424e7b319c3998129745367b7f7d4b40cca`, phase base
    `8e5e893dba276cd65b2294eaaeb61e96314bc506`).
  - Command: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout
    -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense tests/apk3d/pack-bindings.test.ts
    tests/apk3d/budget.test.ts --maxWorkers=1'`. Exit code: 1. Every failure is an `AssertionError` in
    `views-regress.test.ts`. No `TypeError` or collection error occurred. Counts are in
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r8-vitest.log`.
  - Failing cases: default Card2D creates DOM; Magic Defense lacks the opt-in; healthy avatar sheets
    use the silhouette; resize leaves answers offscreen; both phone layouts fail the 8 CSS px gap;
    wrong and right native feedback stay neutral; Magic Defense passes an empty correct term;
    feedback leaves native buttons behind the canvas chips; projected mage rectangles intersect tags.
  - Passing guards: the opt-in overlay detaches on shutdown; no other game opts in; failed avatar
    sheets use the silhouette.
  - Wider command: `vitest run tests/apk3d tests/games tests/old-browser tests/host --maxWorkers=1`.
    Exit code: 1. Only `views-regress.test.ts` fails; every other selected test passes. Counts are in
    `measure/runs/game_magic_defense_rebuild_20261029/red-views-r8-wide-vitest.log`.
  - Prettier check on the new test file exits 0. Type check exits 2 with the same 51 unrelated
    baseline diagnostics and 0 owned diagnostics. Log: `red-views-r8-tsc.log` in the run folder.
  - Remaining non-pinnable items: A-R7-4 independent preset-hero list; A-R7-5 exact castle-heart,
    full-restoration, and fail-on-error QC assertions; A-R7-6 settled browser capture of all tags,
    status, and card. Live Chromium verification remains with Green and UX review.
- [x] Task: Fix the six review-a/c regressions (Green). Implementation commit `8cd9a6e6`; Red
  contradiction resolution commit `2c9cf69d`.
  Owned paths: `src/apk3d/view2d/card2d.ts`, `src/games/magic-defense/view2d/game.ts`,
  `src/games/magic-defense/view2d/magic-defense-2d.css`, `src/games/magic-defense/view/game.ts`,
  `src/games/magic-defense/view/hud.ts`, and this plan.
  Keep every committed Red test unchanged. Preserve the canvas-only Card2D default for other games.
  Reposition native answers on resize, keep the 8 CSS px gap, sync feedback, and use projected actor
  rectangles with measured tag dimensions.
  - Role base `848a2224dc28dc174563e17b0876105ee78341a1`; phase base
    `8e5e893dba276cd65b2294eaaeb61e96314bc506`. Red commit `d8373d27` is inside the phase range.
  - F16/A-R7-2: `Card2D` takes an opt-in `{ nativeAnswers: true }` sixth argument, default false.
    The default creates no DOM nodes, changes no host styles, and keeps canvas pointer targets.
    Magic Defense alone passes the opt-in; resize listeners and overlay removal are registered only
    for that instance. Monster Encounters 2D remains canvas-only in the live probe.
  - F17/A-R7-1: `playerFigure` is kept when present. Without a launch avatar, the neutral figure is
    selected only when a required avatar sheet file is absent or `textures.exists` does not return
    boolean true. Healthy sheets keep the real `avatar-base.idle` texture.
  - A-R7-3: `placeAnswers` recomputes button rectangles from the current card box, canvas rect and
    FIT scale on window or scale resize. The card area is now a function of the current scale.
    Live 390x844 to 844x390 kept the round prompt and both answers inside the viewport.
  - F18: native rows reserve `(44 + 8) / scale` game pixels; column gaps use `8 / scale`. Buttons
    stay 44 CSS px high. Clamping uses the canvas parent rectangle, not the FIT letterbox height.
  - F19: `markChoice` writes right/wrong class, `data-state` and an aria suffix on the native
    buttons. Magic Defense passes the real right term. `feedback` repositions the native layer
    after the card fits; the blocked class alone carries the strike-through.
  - F20: `tagPoint` supplies the projected eight-corner rectangle of the throwing mage. The HUD
    measures the displayed tag and chooses an unobstructed placement within the free rectangle,
    with no vertical spread override.
  - `VIEW_TEST_COMMAND` exit 1 at the blocked HEAD: `Test Files 1 failed, 13 passed (14)`, `Tests
    1 failed, 304 passed (305)`. Before the change the same command exited 1 with the 11 new cases.
    Wider `vitest run tests/apk3d tests/games tests/old-browser tests/host` exit 1 with the same
    single failure at that HEAD. Logs: `green-r8-red-rerun.log`, `green-r8-view-tests.log`,
    `green-r8-wide-tests.log`.
  - The contradiction was resolved by Mid Red commit `2c9cf69d`, tests only. The older UX F2 case
    in `views-adversarial.test.ts` now passes `{ nativeAnswers: true }`, so the opt-in contract of
    F16 and the keyboard-operability contract of F2 both hold. Green made no source or test edit
    after `8cd9a6e6`.
  - Final gates at HEAD `2c9cf69d`: `VIEW_TEST_COMMAND` exit 0, `Test Files 14 passed (14)`,
    `Tests 305 passed (305)`. Wider `vitest run tests/apk3d tests/games tests/old-browser tests/host`
    exit 0, `Test Files 181 passed, 1 skipped (182)`, `Tests 2825 passed, 3 skipped (2828)`.
    Logs: `green-r9-view-tests.log` and `green-r9-wide-tests.log`.
  - `TYPE_CHECK_COMMAND` exit 2 with 51 total diagnostics, the Red baseline, and 0 owned. Log:
    `green-r8-tsc.log`.
  - Live Chromium: Magic Defense 2D answers were 351x44 CSS px with an 8 px vertical gap at
    390x844; focus landed on `.apk2d-answer` and Enter cast once. After rotation to 844x390 both
    answers stayed inside the viewport with the same prompt and an 8 px gap. Healthy sheets
    returned `idle.png` and `cast.png` with the real avatar visible; with sheets blocked the round
    still started and the neutral figure showed. Monster Encounters 2D had zero native answer
    buttons. Three 3D sizes each showed a held Thai tag. Logs: `green-r8-live-probe.log` and
    `green-r8-answer-gap.log`. Frames and SHA-256 are in `views/SHA256-r8.txt`.
  - QC: `apk3d-shot.ts both --game magic-defense` exit 0 in 3D and with `--2d` in 2D, three sizes
    each, with a wrong cast, a storm, no diagnostics and no errors. Logs: `green-r8-qc-3d.log` and
    `green-r8-qc-2d.log`.
  - Tech debt left for the next owner: A-R7-4 independent preset-hero list, A-R7-5 exact castle
    transition and fail-on-errors in the shared QC runner, A-R7-6 settled multi-tag frame geometry,
    plus the earlier UX F4-F7 and ADV-V3 items. No committed Red test or Phase 1 core changed.
- [x] Task: Pin the f8afa57 answer-layout, HUD-label, and resize-cleanup gaps (Red). Test commit `78b9d582`.
  Owned paths: `tests/games/magic-defense/views-regress.test.ts` and this plan.
  Review A and C at `f8afa57a` fail with A-R7-3/F18, F21, and A-R9-1.
  The rotation case starts from a settled, unanswered round. It keeps the logical FIT size,
  letterboxes the displayed canvas, snapshots the state, and checks the same answer nodes after
  both rotations. The desktop row pins the 8 CSS px gap. The F21 row measures the real HUD children
  and projected mage bounds. The shutdown row counts scale and window resize listeners.
  - Red evidence (2026-11-27, role `measure-mid-red`, role base
    `f8afa57aa8aa335ab981607505d0226e507c3431`, phase base
    `8e5e893dba276cd65b2294eaaeb61e96314bc506`). Commit `78b9d582` changes only the owned test file.
  - Targeted command: `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense/views-regress.test.ts --maxWorkers=1'`.
    Exit code: 1. Raw log: `measure/runs/game_magic_defense_rebuild_20261029/red-f8afa57-targeted.log`.
  - `VIEW_TEST_COMMAND`: the same heavy runner with `timeout -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1`.
    Exit code: 1. Raw log: `measure/runs/game_magic_defense_rebuild_20261029/red-f8afa57-view.log`.
  - Every failure is an `AssertionError`. No `TypeError` or collection error occurred. Only
    `views-regress.test.ts` fails; every pre-existing selected test passes.
  - Failing cases: A-R7-3 unanswered portrait-landscape-portrait rotation; F18 answers at 1280x720;
    A-R9-1 scene shutdown leaves no resize listener; F21 longest Thai label clears HUD and mages.
  - Wider command: `vitest run tests/apk3d tests/games tests/old-browser tests/host --maxWorkers=1`
    through the same heavy runner. Exit code: 1, only because `views-regress.test.ts` fails. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-f8afa57-wide.log`.
  - Prettier check on the owned test file exits 0. The plan check exits 1 with its pre-existing
    formatting drift; this round does not reformat unrelated plan prose. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-f8afa57-prettier.log`.
  - Type check through the heavy runner exits 2 with 51 baseline diagnostics and 0 owned diagnostics
    in `src/games/magic-defense/` or `tests/games/magic-defense/`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-f8afa57-tsc.log`.
  - Not pinned in this round: A-R9-2 shared canvas-only card alignment. It needs a separate shared
    `Card2D` layout regression for the other callers.
- [x] Task: Fix the f8afa57 answer-layout, HUD-label, and resize-cleanup gaps (Green).
  Implementation commits `55df38a892b56e63a3489040c9d4daf6c0fe0c82` and
  `16ca1b86f4844753b440a1dd8d258aee0e800715`.
  Owned paths: `src/apk3d/view2d/card2d.ts`, `src/games/magic-defense/view/hud.ts`,
  `src/games/magic-defense/view/magic-defense.css`, and this plan.
  Keep every committed Red test unchanged. Reflow the current card and native targets from the
  current FIT scale. Keep 44 CSS px targets and an 8 CSS px gap. Preserve the unanswered round and
  held missiles. Exclude the displayed Story, Sound, progress, and projected mage rectangles from
  every Thai tag. Remove the scale and window resize listeners at shutdown. Run `VIEW_TEST_COMMAND`,
  the wider command, the type check, and live checks at all three viewports.
  - Role base `929f49eee4ea6633977a0df6f5932221ffb3ff8c`; phase base
    `8e5e893dba276cd65b2294eaaeb61e96314bc506`. Red commit `78b9d5825d8dc8f223f5ff7a3a8d2dac0b9acfe5`
    is inside the phase range. No committed Red test changed. The Phase 1 core stayed unchanged.
  - A-R7-3 and F18: `Card2D.layoutNative` lays the canvas chips and the DOM answer buttons out from
    the current FIT scale. The button width is `max(44, chip width * scale)`, the row height is
    `max(44, chip height * scale)`, and the CSS gap is 8.5 px. The chips move with the buttons, the
    card grows with the rows, and the content under the answers keeps its height.
    `Card2D.placeAnswers` puts the buttons back on their chips, and `fit` calls it, so the buttons
    follow the card when the feedback moves it. The resize handler reflows the current card; it
    keeps the round, the held missiles, and the answer nodes.
  - A-R9-1: the scene shutdown removes the window resize listener and the scale resize listener.
  - A-R9-2: `Card2D.choose` keeps the canvas-only path in `chooseCanvas`. That path is the layout
    of the commit before `8cd9a6e6`: top-aligned chips, the `GAP` advance, and no native geometry.
    The native branch stays inside `choose`, because the committed UX F2 case reads the body of
    `choose(` and asks for the native button, its name, its 44 CSS px minimum, and its click
    listener there.
  - F21: the Thai tag excludes the displayed `.place`, `.md-castles`, `[data-storm]`, `[data-story]`
    and `[data-mute]` rectangles and the projected mage rectangle. The other tags are the second
    choice. The guess search tries every zone first, then the hard zones only.
  - The desktop scroll finding: the page never overflows and never scrolls. At 1280x720
    `documentElement.scrollWidth === clientWidth === 1280` and `body.scrollWidth === clientWidth
    === 1280`, and `window.scrollX` was 0 in every sample. The host shell `.app` is an overflow
    hidden scroll box, and the answer card slide-in transform gave it scrollable overflow, so the
    shell scrolled by the overflow and moved the whole scene with it. The trace showed
    `app.scrollLeft` 179, 434 and 544 px with the HUD root at the same offset, and 0 px everywhere
    else. The game CSS now clips the HUD layer. The trace after the fix: 455 samples, every one
    with `app.scrollLeft` 0 and the HUD root at `[0, 1280]`.
  - `VIEW_TEST_COMMAND` exit 0: `Test Files 14 passed (14)`, `Tests 309 passed (309)`. Log
    `green-r11-view-tests.log`. The wider command `vitest run tests/apk3d tests/games tests/old-browser
    tests/host` exit 0: `Test Files 181 passed, 1 skipped (182)`, `Tests 2829 passed, 3 skipped (2832)`.
    Log `green-r11-wide-tests.log`. The targeted Red command
    `vitest run tests/games/magic-defense/views-regress.test.ts` exit 0: 18 tests passed.
  - `TYPE_CHECK_COMMAND` exit 2 with 51 total diagnostics, the Red baseline, and 0 owned
    diagnostics. Log `green-r11-tsc.log`.
  - Live Chromium at the three viewports, with the longest Thai label `การทำงานเป็นทีม`:
    - The unanswered round rotates without a cast. Portrait 390x844: two answers 351x44 CSS px, gap
      8.5 px, inside the viewport, `casts` 0, 2 missiles, prompt unchanged. Landscape 844x390: two
      answers 175.5x44 CSS px, gap 8.5 px, inside the viewport, the same prompt, `casts` 0, 2
      missiles, the same two DOM nodes. Back to portrait: two answers 351x44 CSS px, gap 8.5 px,
      the same prompt and the same two nodes.
    - A fresh desktop 1280x720: two answers 496.97x63 CSS px, gap 8.5 px.
    - The Thai tags against the status controls and the projected mages: 0 control collisions, 0
      mage collisions, and 0 tag collisions at 390x844, 844x390 and 1280x720. At 1280x720 the
      scroll was 0, the document scroll width equalled the client width, and the HUD root and the
      canvas both filled 0 to 1280.
    - The avatar: the real sheets load; with the sheets blocked the round starts and the neutral
      silhouette shows. Monster Encounters 2D reports 0 native answer buttons. No page error.
    - Log `green-r11-live-probe.log`. The scroll probes are `green-r11-scroll-probe.log`,
      `green-r11-hud-offset-probe.log`, `green-r11-hud-trace.log` and `green-r11-hud-trace-fixed.log`.
  - QC: `apk3d-shot.ts both --game magic-defense` exit 0 in 3D and the same command with `--2d`
    exit 0, at the three sizes. Each run logged one wrong spell, the storm, `diagnostics none`, and
    `errors none`. Logs `green-r11-qc-3d.log` and `green-r11-qc-2d.log`.
  - 23 frames and their SHA-256 are under `views/` in `green-r11-*.png`, summed in
    `views/SHA256-r11.txt`.
  - Dispositions of the routed findings: A-R7-3 FIX, F18 FIX, F21 FIX, A-R9-1 FIX, A-R9-2 FIX.
    A-R9-2 had no Red case; the canvas-only path now keeps the old layout. The other 3D games keep
    their canvas-only card.
  - Tech debt left for the next owner: the shared kit CSS `src/apk3d/hud/hud.css` gives the same
    slide overflow to every other 3D game; owner next owner of the shared HUD kit.
    A-R7-4 independent preset-hero list, A-R7-5 exact castle transition and fail-on-errors in the
    shared QC runner, A-R7-6 settled multi-tag frame geometry, the earlier UX F4-F7 and ADV-V3
    items. No committed Red test or Phase 1 core file changed in this round.
- [x] Task: Pin the A-R8 CSS isolation gap (Red). Test commit `bfafce98`.
  Owned paths: `tests/games/magic-defense/views-regress.test.ts` and this plan.
  Review A at 887394d1 fails with A-R8-CSS: the rule `.apk3d-layer { overflow: hidden }` in
  `src/games/magic-defense/view/magic-defense.css` (commit 16ca1b86) matches every 3D cartridge
  layer, so loading Magic Defense CSS changes the layout of every other 3D game. Pin the
  contract at source level: no top-level rule with the bare `.apk3d-layer` selector sets
  overflow; every overflow rule on `.apk3d-layer` is scoped to the Magic Defense root marker;
  the view adds that marker to its mount element; a bare layer outside the marker keeps no
  `overflow: hidden` from this stylesheet. Tests only; no `src/` edit.
  - Red evidence (2026-11-28, role `measure-mid-red`, role base `887394d1`, phase base `8e5e893d`).
    Test commit changes only the owned test file; plan commit changes only this plan.
  - Targeted command: `HEAVY_MIN_AVAIL_MB=1500 bash
    /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600
    node_modules/.bin/vitest run tests/games/magic-defense/views-regress.test.ts --maxWorkers=1'`.
    Exit code: 1. `Test Files: 1 failed (1)`. `Tests: 4 failed, 18 passed (22)`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-a-r8-targeted.log` (not committed).
  - `VIEW_TEST_COMMAND` exit 1: `Test Files: 1 failed, 13 passed (14)`.
    `Tests: 4 failed, 309 passed (313)`. Every failure is an `AssertionError`. No `TypeError`
    or collection error occurred. All 309 pre-existing selected tests pass. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-a-r8-view.log` (not committed).
  - The 4 failing cases: bare `.apk3d-layer` selector sets overflow; unscoped overflow rule on
    `.apk3d-layer`; no root marker named or added by the view; a foreign `.apk3d-layer`
    matches `.apk3d-layer { overflow: hidden; }`. Each names the leaking declaration.
  - Wider `vitest run tests/apk3d tests/games tests/old-browser tests/host` exit 1 only
    because `views-regress.test.ts` fails: `4 failed, 2829 passed, 3 skipped (2836)`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-a-r8-wide.log` (not committed).
  - Prettier check on the owned test file exits 0 (the file was reformatted with
    `prettier --write`; `plan.md` keeps its pre-existing drift).
  - `TYPE_CHECK_COMMAND` exit 2 with 51 total diagnostics, the Red baseline, and 0 owned
    diagnostics in `src/games/magic-defense/` or `tests/games/magic-defense/`. Raw log:
    `measure/runs/game_magic_defense_rebuild_20261029/red-a-r8-tsc.log` (not committed).
  - A-R8-PROBE is not pinned in this round: the fake scene harness has no
    `requestAnimationFrame`, so `Card2D.onResize` reflows synchronously and the settled
    rotation geometry already passes per A-R7-3. No mid-slide resize case fails now for the
    right reason with these helpers. Mid-slide timing stays with the live browser probe that
    Review C already ran at 887394d1.
- [~] Task: Scope the Magic Defense scroll-clip rule to the Magic Defense layer (Green).
  Routed from Review A A-R8-CSS. Owned paths: `src/games/magic-defense/view/` and this plan.
  Keep every committed Red test unchanged. The Phase 1 core stays unchanged.
- [ ] Task: Send the report to the PM (Green). The orchestrator sends it after review and acceptance
  Run `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/apk-release.ts --check'`. When it lists stale models, run it with `--commit`.
  Run `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx
  scripts/monorepo-handoff.ts --target <branch>'`. The PM names the branch.
  Send one status line to the PM. It names the Forge commit, the frames with SHA-256, and the
  handoff file. The PR session then rebuilds the game video, and the PM routes the cartridge sync.
