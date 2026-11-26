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
