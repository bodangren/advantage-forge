# Test strategy: rebuild Archer's Revenge as an aim and shoot game

Track: `game_archers_revenge_rebuild_20261029`. Phase: P1, "Phase 1: Rules core". Section 12 gives a
short outline for Phase 2. Phase 2 stays blocked until Daniel picks the look.

Role base: `bc75ba0a` (the track-opening commit). Section 14 names the point of the phase base.

## 1. Inputs and facts

- Read: `spec.md`, `plan.md`, `metadata.json`, `measure/lessons-learned.md`, `core/*.ts`,
  `qc/bot.ts`, `view/driver.ts`, the `fire` call sites in `view/` and `view2d/`, and the five test
  files in `tests/games/archers-revenge/`.
- Gap: `measure/anti-patterns.md` does not exist in this repository. This strategy uses the starter
  catalog `~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`. A1 and A8 are
  retired there.
- `build-graph` is available. `graph.db` is absent. A `grep` of the tree supplied the symbol context.
- Fact: the core imports only `src/apk3d/contracts/` and `src/apk3d/sim/`. Only the four test
  files, the bot, and the driver import the core. No file outside the game folder imports the core.
- Fact: `tests/games/shared/battle.test.ts`, `src/host/registry.ts`, `tests/apk3d/pack-bindings.test.ts`,
  and `src/apk3d/contracts/model-pack.ts` read the manifest. Phase 1 does not change the manifest.
- Fact: `toGameResults` derives `accuracy` and `xp` from the `attempts` of the evidence items. A miss
  that counts as an attempt lowers the accuracy and the XP of a student. This makes FR-7 a high risk.
- Fact: other core files in this tree call `Math.sin` and `Math.cos` (for example
  `src/games/devourer-slime/core/sim.ts`). No shared fixed sine table exists to reuse.

## 2. Contract decisions (strategy role)

FR-1 gives the strategy role the ranges. Red writes the tests against this contract. Green
implements it. A name change needs a strategy revision, not a silent rename.

| Id | Decision |
| --- | --- |
| D1 | The command is `{ type: 'fire'; angle: number; power: number }`. The `lane` field goes away. |
| D2 | `angle` is a whole degree in `[0, 80]`. `power` is a whole percent in `[10, 100]`. Both ends are valid. The core exports the four bounds (proposed: `TUNING.aim = { minAngle, maxAngle, minPower, maxPower }`). |
| D3 | A value that is not an integer, is outside its range, or is not a number gives `[{ type: 'rejected', command: 'fire' }]`. A rejected command changes no state: the snapshot before and after is equal. The core does not round or clamp a value. |
| D4 | The core exports a frozen sine table with one entry per whole degree, 0 to 90 (proposed: `SIN_DEG`, length 91). The entries are number literals in the source. `SIN_DEG[0] === 0` and `SIN_DEG[90] === 1`. The cosine of `a` is `SIN_DEG[90 - a]`. |
| D5 | The arc. `speed = maxSpeed * power / 100`. `vx = speed * SIN_DEG[90 - angle]`. `vy = speed * SIN_DEG[angle]`. Point `i` is at time `t = i * dt`: `x = ox + vx * t` and `y = oy + vy * t - gravity * t * t / 2`. The core exports `origin`, `gravity`, `dt`, `maxSpeed`, and `maxSteps` (proposed: `TUNING.arc`). The closed form at each step has no drift that accumulates. |
| D6 | The path code uses only `+`, `-`, `*`, `/`, comparisons, and the exact `Math` functions `floor`, `ceil`, `round`, `trunc`, `min`, `max`, `abs`, `sign`, and `imul`. It does not use `**`. |
| D7 | The scene layout is core data: the ground line, the hill, the tower bodies, and one target box per lane. One fixed layout exists for 3 lanes and one for 2 lanes (Helper mode). Proposed: `layoutOf(lanes)` and `state.layout`. All boxes are axis-aligned rectangles in meters. The hill counts as `ground`. The bow origin is outside every box. |
| D8 | The hit test checks each segment between two consecutive points against every box and the ground. The first contact along the path wins. The path ends at the contact point. Contact kinds: `target`, `shut`, `tower`, `ground`, `edge`. `edge` means that `x` left the scene width. No path in the full grid reaches `maxSteps` in the air. |
| D9 | A pure shot function returns the points and the contact (proposed: `shotOf(layout, blockedLanes, angle, power)`). The helper path function (proposed: `pathOf`) returns the same points. Neither function reads or changes the simulation state. |
| D10 | Event order. Right: `shot`, `scored`, [`waveCleared`, [`waveAppeared`]], then `roundShown` or `victory`. Wrong: `shot`, `enemyStrike`, [`rest`], `roundShown`. Miss: `missed` only. The `shot` event adds `angle` and `power`. The `missed` event carries `angle`, `power`, the contact kind, and the contact point. |
| D11 | `state.shots` counts every accepted `fire`, a miss included. `shots` is not evidence. A miss changes no other state field. |
| D12 | The `Presentation.showRound` callback becomes `fire(angle, power)`. In Phase 1 the old lane buttons fire the pair that the core search gives for that lane. No view code calculates a path. |

### Owner assumptions (the PM asks Daniel)

These are the spec defaults. Each one is a test row. A different answer from Daniel changes the row.

| Id | Assumption | Row |
| --- | --- | --- |
| Q1 | An arrow that hits a shut target bounces and counts as a miss: no attempt and no courage loss. | R9 |
| Q2 | The core path is the full arc to the first contact. The view draws it only in Helper mode. | R11 (core), V5 (view, Phase 2) |
| Q3 | A miss (ground, tower body, edge, or shut target) counts as no attempt. | R8 |

## 3. Risks

| Risk | Effect | Level | Falsifier |
| --- | --- | --- | --- |
| The path calls `Math.sin`, `Math.cos`, or another engine-dependent function. | A replay gives a different hit on another phone. The evidence of one run differs between devices. | critical | R4 and R5 fail. |
| The sine table comes from `Math.sin` at import time. | The source scan finds the call, but a split name or an alias hides it. | high | R5 imports the module again with a `Math.sin` that throws. |
| A miss counts as an attempt. | Accuracy and XP fall for bad aim, not for bad reading. | high | R8 fails. |
| The hit test checks only the sample points. | A fast arrow passes through a thin target or a tower. | high | R7 compares the hit with an independent segment oracle on the full grid. |
| A layout hides a target behind a tower. | The student cannot hit the right word. The run cannot end. | high | R12 fails when one lane has no hitting pair. |
| The bot searches in a seeded or random order. | The QC run does not replay. | medium | R13 fails. |
| The driver drops the `missed` event. | The arrow does not fly on a miss. The student sees nothing. | medium | R15 fails. |
| An event holds a reference to the state. | The recorder and the QC hook see later changes. | medium | R14 fails. |

Phase risk: P1 is `high`. The arc and the evidence carry the risk. P2 is `high`: two new views,
a new manifest, a shared test outside the owned paths, and a real drag in the browser.

## 4. Phase 1 test rows (the plan's Red task)

The rows go into the files that the plan names. Each row has a falsifier. "Grid" means every
pair of angle and power steps: 81 angles and 91 powers, 7,371 pairs, for each of the two layouts.

| Id | Risk | File | What it proves | Falsifier (the row fails when) |
| --- | --- | --- | --- | --- |
| R1 | high | `rules.test.ts` | `fire(angle, power)` replaces `fire(lane)`. `{ type: 'fire', lane: 0 }` after `start` gives `rejected`. A valid pair gives `shot` or `missed`. | The core still reads `lane`. |
| R2 | high | `rules.test.ts` | The range check (D2, D3). Valid: angle 0 and 80, power 10 and 100. Rejected: angle -1, 81, 45.5; power 9, 101, 0; `NaN`, `Infinity`, a string, a missing field. Each rejected command leaves the snapshot equal. | One bad value gives `shot` or `missed`, or changes `shots`. |
| R3 | critical | `rules.test.ts` | The sine table (D4). Length 91, frozen, `SIN_DEG[0] === 0`, `SIN_DEG[90] === 1`, strictly rising. Each entry is within `1e-12` of the reference that the test calculates with `Math.sin`. | One entry is wrong, the table is short, or a caller can change it. |
| R4 | critical | `rules.test.ts` | The arc (D5). For 12 fixed pairs and both layouts, each point is within `1e-9` m of the closed form that the test calculates from the exported constants. The test uses `Math.cos` and `Math.sin` as a second reference for `vx` and `vy` within `1e-9`. | Sine and cosine are swapped, power is not linear, the step is not `dt`, or gravity has the wrong sign. |
| R5 | critical | `rules.test.ts` | No engine-dependent math (D6). Part A is an artifact test: it reads the raw text of every file in `core/` and `qc/bot.ts`. It finds no `Math.sin`, `Math.cos`, `Math.tan`, `Math.asin`, `Math.acos`, `Math.atan`, `Math.atan2`, `Math.exp`, `Math.log`, `Math.pow`, `Math.sqrt`, `Math.hypot`, `Math.cbrt`, `Math.random`, the `**` operator (regex `[\w)\]]\s*\*\*\s*[\w(]`, so a `/**` comment opener passes), `\bDate\b`, or `\bperformance\b`. Part B is a live test: it replaces those `Math` functions with stubs that throw. It calls `vi.resetModules()`, imports the core again, and runs a full bot run. The run reaches `victory`, and the path of 12 pairs equals the path that the normal import gives, by `Object.is` for each number. | One name appears in a core file. A call hides behind an alias. The table comes from `Math.sin` at import. |
| R6 | critical | `replay.test.ts` | The same pair gives the same path and the same contact. Two fresh imports give equal numbers by `Object.is`. Every number is finite, and no point is `-0`. | A cache, a hidden counter, or a random value changes one number. |
| R7 | high | `rules.test.ts` | The hit test (D8). On the full grid, the test runs its own segment-to-box oracle (Liang-Barsky) on the returned points. The core contact is the first oracle contact, with the same kind and box. No segment before the contact crosses a box. No grid path reaches `maxSteps` in the air. The origin is outside every box. | The core checks points only, returns the last box, or misses the ground. |
| R8 | high | `rules.test.ts` | A miss is no attempt (Q3, FR-7). One case each for `ground`, `tower`, and `edge`. The events are `[missed]`. `attempts`, `correctFirstTry`, `courage`, `streak`, `coins`, `round`, and `targets` are unchanged. Only `shots` rises by 1 (D11). After two right hits and one miss, the next right hit scores `coins + 2 * streakCoins`. | A miss changes an evidence counter, the courage, or the streak. |
| R9 | high | `rules.test.ts` | A shut target is a miss (Q1). After a wrong hit on lane L, a pair that hits lane L gives `[missed]` with kind `shut`. Attempts and courage stay. The arrow stops at the shut box and does not fly on. | The shut target counts an attempt or takes courage, or the arrow passes through it. |
| R10 | high | `rules.test.ts` | Right and wrong hits keep today's rules (FR-5, FR-6). Right: `shot` with `correct: true`, coins and streak as today, next prompt. Wrong: `shot` with `correct: false`, `enemyStrike`, courage -1, the lane shuts, the prompt stays, `attempts` = 1, `correctFirstTry` = false. At 0 courage: `rest` to 3. The event order matches D10. | One counter or one event order differs from today. |
| R11 | medium | `rules.test.ts` | The helper path (FR-8, Q2). `pathOf(angle, power)` returns the same points as the shot, by `Object.is`. The last point is the contact point. The function leaves the snapshot equal. Helper mode keeps 2 targets. | The helper path uses another `dt`, stops early, or changes the state. |
| R12 | high | `rules.test.ts` | Every target can be hit. For both layouts, each lane has at least one grid pair whose first contact is that lane's target. With the other lanes shut, the right lane still has a pair. | A tower or a target shadows one lane. |
| R13 | high | `bot.test.ts` | The bot (FR-11). The existing 24 story cases reach `victory` with 0 `missed`, 0 `rejected`, 0 `enemyStrike`, and every word `correctFirstTry`. The bot command is a `fire` with integer angle and power, and its shot hits the right target. The same state gives the same command twice. The bot takes the first hitting pair in a fixed order: angle ascending, then power ascending. | The bot fires a lane, a random pair, or a pair that misses. |
| R14 | medium | `replay.test.ts` | Replay (FR-10). One seed and a mixed command list (right, wrong, `ground` miss, `shut` miss, out of range, not an integer) give equal events and snapshots twice. The recorder replays to the same snapshot. The events survive `structuredClone` and a JSON round trip unchanged. The list contains at least one `missed`, one `rejected`, and one `enemyStrike`. | A run differs, or an event holds a state reference or a value that JSON loses. |
| R15 | medium | `driver.test.ts` | The driver plays every event (D10, D12). A recorder `Presentation` gets `fire(angle, power)`. A run with right, wrong, miss, shut, and rest hits makes one presentation call for each event type in `ARCHERS_REVENGE_EVENT_TYPES`. The silent list is exactly `roundShown` and `rejected`. `complete` runs once. A second `fire` while busy changes nothing. | The driver drops `missed`, or calls `complete` twice. |
| R16 | medium | `rules.test.ts` | The evidence stays (FR-9). One `word` item per story word. `attempts` counts only word-target hits while the word is the prompt. The schema parse passes. `results.correctAnswers` equals the word count. | A miss or a shut hit enters an item. |
| R17 | medium | `rules.test.ts` | The core boundary. The files in `core/` import only `src/apk3d/contracts/`, `src/apk3d/sim/`, and other `core/` files. This is an artifact test. | A core file imports `three`, `phaser`, `view/`, `view2d/`, or `shared/battle/`. |

The existing rows for content, waves, formations, rest, victory, and empty input stay. Red moves
them from `rightLane` and `wrongLane` to helpers that aim with the core shot function.

### Rules for the Red run

- `helpers.ts` gets `aimAt(sim, predicate)`. It walks the grid in the R13 order with the core shot
  function. It does not call the bot, so a bot defect cannot hide a core defect.
- Each test file imports the core as `import * as core`. A missing export then fails one test,
  not the whole file. A file-level collection error hides rows and counts as a Red defect.
- Expected Red result: R1 to R16 fail. R17 can pass today, because the core boundary holds now.
  Record R17 as a guard row that passes in Red. The existing content and wave rows can also pass.
- Record the exit code and the labeled count line `Tests  N failed | M passed (T)`. Record the
  failing row ids. Do not record a bare digit.

## 5. Mutations for the Green gate (adversarial testing)

Green or the adversarial role applies each mutation to a scratch copy. Each mutation names the
row that must fail. A mutation that no row catches is a finding.

| Id | Mutation | Row that must fail |
| --- | --- | --- |
| M1 | Calculate `vy` with `Math.sin(angle * Math.PI / 180)`. | R5 |
| M2 | Build the table at import with `Math.sin` through an alias, `const m = Math; m['si' + 'n']`. | R5 part B |
| M3 | Round 45.5 to 46 instead of a rejection. | R2 |
| M4 | Accept angle 81 or power 101 (an off-by-one bound). | R2 |
| M5 | Increment `shots` before the range check. | R2 |
| M6 | Use `SIN_DEG[angle]` for `vx` (swap sine and cosine). | R4 |
| M7 | Use `power * power` for the speed. | R4 |
| M8 | Accumulate `y += vy * dt` with the old `vy` (explicit Euler). | R4 |
| M9 | Test only the sample points against the boxes. | R7 |
| M10 | Return the last contact instead of the first. | R7 |
| M11 | Count a ground miss as an attempt. | R8 and R16 |
| M12 | Reset the streak on a miss. | R8 |
| M13 | Let a shut target take courage, or let the arrow pass through it. | R9 |
| M14 | Stop the helper path after 20 points. | R11 |
| M15 | Move a tower in front of lane 2 of the Helper layout. | R12 |
| M16 | Let the bot pick a random pair from the hitting pairs. | R13 and R14 |
| M17 | Put the state `round` object into the `shot` event by reference. | R14 |
| M18 | Remove the `missed` case from the driver switch. | R15 |
| M19 | Add an import of `three` to a core file. | R17 |

Hostile inputs for the adversarial role: `angle: -0`, `angle: 1e308`, `power: '50'`, `angle: true`,
an extra field, and a `fire` with no fields. `-0` is an integer in range. The core must treat it
as `0`, and the path must equal the path of `0` by `Object.is` for each point.

## 6. Gate commands

These are the commands of `plan.md`, unchanged.

- `RED_TEST_COMMAND` (Phase 1):
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/archers-revenge --maxWorkers=1'`
- `GREEN_TEST_COMMAND` (Phase 1): the same command. It must exit 0.
- `VIEW_TEST_COMMAND` (Phase 2):
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/games/archers-revenge tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1'`
- `TYPE_CHECK_COMMAND`:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node node_modules/typescript/bin/tsc --noEmit'`
- Frame command and QC run command (Phase 2): see `plan.md`, "Gate commands".
- Exit code 75 means hold. Record `lock wait over 600 s` and stop the run.

### Gates per phase

| Phase | Red gate | Green gate | Closeout gate |
| --- | --- | --- | --- |
| P1 | `RED_TEST_COMMAND` exits non-zero. R1 to R16 fail for the reason in section 4. No file-level error. | `GREEN_TEST_COMMAND` exits 0. `TYPE_CHECK_COMMAND`: 0 errors in `src/games/archers-revenge/` and `tests/games/archers-revenge/`, total not above the baseline. M1 to M19 each fail their row. | The plan quotes the commands, the exit codes, the labeled counts, and the mutation results. Reviews A and C return. |
| P2 | `VIEW_TEST_COMMAND` exits non-zero on the V rows. | `VIEW_TEST_COMMAND` exits 0. Type check as in P1. QC runs in 3D and 2D exit 0 with 0 page errors. | Frames with SHA-256 in the plan. Browser review returns. Report to the PM. |

## 7. Type-check baseline

The strategy role ran `TYPE_CHECK_COMMAND` once on 2026-10-29 at `bc75ba0a`, with other sessions'
uncommitted edits in the tree. The lock wait was below 600 s. The run took 322 s.

- Exit code: 2.
- Total errors: 31.
- Errors in `src/games/archers-revenge/`: 0.
- Errors in `tests/games/archers-revenge/`: 0.
- Files with errors: `assets/airship.ts` 7, `assets/rowboat.ts` 8, `assets/plank.ts` 6,
  `assets/mushroom-cap.ts` 3, `assets/waterskin.ts` 3, `assets/longship.ts` 1,
  `assets/merchant-cart.ts` 1, `assets/wool.ts` 1, and `tests/part.test.ts` 1.

Green gate: the owned errors are 0. The total is 31 or less. Count lines with `error TS`, by path.
When another session changes the total, Green records both numbers and names the files that changed.

## 8. Fixtures, mocks, and live proof

- Fixtures: the 8 stories in `tests/fixtures/stories/` (`STORY_IDS`), `STORY` (`pip-is-brave`),
  and `SHORT_STORY` (`the-school-garden`). No new fixture file is needed.
- Mocks: `vi.spyOn(Math, …)` stubs that throw, in R5 part B only. Each test restores them in
  `afterEach`. The recorder `Presentation` in `driver.test.ts` replaces the renderer.
- No network, no browser, no WebGL, no file write, and no paid call in Phase 1.
- Live behavior tests: R1 to R4, R5 part B, and R6 to R16 run the core, the bot, or the driver.
- Artifact tests: R5 part A and R17 read the source text. They prove the absence of a name or an
  import. They do not prove behavior. R5 part B is the live twin of R5 part A.
- Limit: Phase 1 runs on one engine (V8 in Node). The cross-device claim rests on D6: `+`, `-`,
  `*`, and `/` give the same IEEE 754 result on every engine. Phase 2 row V7 compares a path digest
  in Chrome with the Node digest. No WebKit or Gecko engine is available on this machine.

## 9. Architecture guardrails and changed contracts

- The core stays pure: no `three`, no `phaser`, no DOM, no clock, and no `Math.random` (R5, R17).
- The bot can cache the grid contacts per layout. A shut target keeps its box, so the shut state
  changes the contact kind, not the geometry. Without a cache, R13 can search up to 7,371 shots for
  each command, and the 300 s gate timeout is at risk.
- One shot function owns the physics. The bot, the helper path, the driver, and the Phase 1 lane
  bridge call it. No second copy of the arc exists outside `core/` (Review A checks this).
- Do not change `src/games/shared/battle/`, `src/apk3d/sim/`, or `src/apk3d/contracts/`.
- Changed contracts in Phase 1: the `fire` command, the `shot` event, the new `missed` event,
  `ARCHERS_REVENGE_EVENT_TYPES`, the `Presentation.showRound` callback, and new core exports. The
  consumers are the bot, the driver, `view/game.ts`, `view/hud.ts`, `view2d/game.ts`, and the QC hooks
  `__apk3dGame` and `__apk3dView2d`. No consumer exists outside the game folder.
- The monorepo cartridge copies this core later. No sync goes before Phase 2 ends. The changed
  command is a contract change for that sync. The PM must know it.
- Phase 2 risk outside the owned paths: `tests/games/shared/battle.test.ts` asserts that the
  Archer's Revenge manifest binds the battle files. The Phase 2 manifest drops them, so that test
  fails. The other three rebuild tracks change the same file. See the handoff.

## 10. The aggregate suite

- The full `vitest run` is not a gate of this track. Other sessions keep red tests on purpose now:
  `tests/games/filled-shelves.test.ts` (Red) and the Storytime tests. Their failures do not block
  Phase 1 and do not count as regressions of this track.
- The Phase 1 gate is only `tests/games/archers-revenge`. No other test imports the core, so the
  scope is complete for Phase 1.
- Green must not run the full suite as a substitute for the gate. Green must not fix a red test
  outside the owned paths.

## 11. Reviews for Phase 1

| Gate | Applies | Scope |
| --- | --- | --- |
| Review A (spec and code) | Yes | D1 to D12, FR-1 to FR-11, the event order note in `core/sim.ts`, one copy of the physics, and the evidence rules. |
| Review B (security) | No | Phase 1 adds no network call, no storage, no secret, no file write, and no parsing of text. The range check (R2) covers the hostile numbers from the QC hook. Review B applies if Green adds a new window hook or reads input from the URL. |
| Review C (UX and API) | Yes, API only | The command, the events, the exported constants, and the `Presentation` interface. Phase 2 and the monorepo sync consume them. No visual UX changes in Phase 1. |
| Adversarial testing | Yes | M1 to M19 and the hostile inputs of section 5. |
| UX browser review | No | Phase 1 has no browser surface. The old views stay on the battle stage, and the lane buttons fire through the core search. Phase 2 has the browser review. |

## 12. Phase 2 outline (blocked until Daniel picks the look)

Phase 2 strategy needs a revision after the pick. Risk: `high`. Red rows for
`manifest.test.ts` and `scene.test.ts`:

| Id | Row |
| --- | --- |
| V1 | No file reached from `src/games/archers-revenge/index.ts` imports `src/games/shared/battle/stage3d.ts` or `stage2d.ts`. The test walks the import graph, not only direct imports. |
| V2 | `MODELS_3D` and `FILES_2D` list the models and sprites of the picked look. `FILES_2D` does not list `background.monster-encounters`. |
| V3 | The pack binding test and the budget test pass for the new models. |
| V4 | A drag converts to whole angle and power steps inside D2. A drag past a bound gives the bound. A tiny drag gives no shot. Both views use one conversion function. |
| V5 | The dotted path shows only in Helper mode, and it shows the full `pathOf` points (Q2). |
| V6 | The arrow animation uses the `pathOf` points of the event pair. No view code calculates physics. |
| V7 | The QC run calculates a digest of `pathOf` for 12 fixed pairs in the page and compares it with the Node digest. Phase 2 Red pins the digest of the Phase 1 core. |
| V8 | The avatar is the archer. When the avatar base does not load, a neutral silhouette shows. No hero stands in. |
| V9 | The QC run uses a real drag on the canvas, also at 390 × 844 and 844 × 390 with touch (lessons: phone QC). |

Phase 2 reviews: A yes, B no (same reason as Phase 1), C yes (the drag control on touch and mouse),
adversarial yes (a drag that leaves the canvas, two touches, a drag during the animation), and
browser review yes (frames in 3D and 2D beside the other rebuild games and Monster Encounters).

## 13. Anti-pattern coverage

| Id | Phase | Defense | Falsifier |
| --- | --- | --- | --- |
| A3 digit-only count | P1, P2 | The plan records labeled values: `Tests  N failed`, `owned errors`, `total errors`, `exit`. The rows assert named fields, not digits in text. | A record cites a bare digit, or a row passes on any number. |
| A4 vacuous pass | P1, P2 | R7 and R12 run on the full grid of 7,371 pairs per layout and assert a non-zero count of checked pairs. R14 asserts at least one `missed`, `rejected`, and `enemyStrike`. R15 asserts the exact silent list. The Red run must show R1 to R16 failing per test, not one file error. | An empty grid, an empty event list, or a collection error passes. |
| A5 false claim | P1, P2 | The plan quotes each command, exit code, and labeled count. The mutation table records the row that failed for each mutation. | A plan claim disagrees with the quoted output. |
| A6 registry overstatement | P1, P2 | The registry entry is a closeout item (another session owns `measure/tracks.md`). No note calls the arc "deterministic on every device" beyond the section 8 limit. | A note claims a cross-engine proof that no run gave. |
| A7 over-broad filter | P1 | R5 part A scans every file in `core/` and `qc/bot.ts`, comments included. It fails closed on a name in a comment. R5 part B catches what a text filter misses. | A filter skips a file or a hidden call passes. |
| A9 archived track paths | P1, P2 | No test reads a `measure/tracks/` path. | A `grep` of the tests prints a track path. |
| A10 generated-facts drift | P2 closeout | `./measure/generate.sh` and the registry entry stay closeout items, as `metadata.json` records. | The generated facts disagree with the plan. |
| A2 consent-blind publish | none | Not applicable. The track publishes no case study and changes no consent state. | None. |

## 14. Phase base

The orchestrator captures the immutable `phase_base_sha` at one point: after the commit that adds
this file, and before Red writes the first line of a Phase 1 test. The value is the
`git rev-parse HEAD` of that commit. This file names no phase base SHA, because a SHA from before
the strategy commit is not the phase base.
