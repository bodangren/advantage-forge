# Test strategy: rebuild Castle Defense as a tower defense game

Track: `game_castle_defense_rebuild_20261029`. Phase 1 is "Phase 1: Rules core". Phase 2 is "Phase 2:
Views". Phase 2 is blocked until Daniel picks the look, so section 10 gives only an outline for it.

Role base: `bc75ba0ab2b0a916e8838c734feb98f4d3d37e7d` (the track-opening commit).

## 1. Scope and the sentence evidence

Phase 1 changes the rules core (`src/games/castle-defense/core/`), the QC bot (`qc/bot.ts`), and the
event player (`view/driver.ts`). The old views get only the smallest edits that keep the type check
clean. Phase 1 has no browser surface.

Castle Defense is one of the two sentence lesson games. The sentence evidence is a contract with the
host and the monorepo. It must stay as today: one `sentence` item per sentence, `attempts` = wrong
words + 1, `correctFirstTry` = no wrong word, and `solved` = the wave of the sentence ended. The
`storyGameEvidenceSchema` parse stays in the tests. Rows E1 to E4 guard this contract.

## 2. Risks

| Risk | Effect | Level | Falsifier |
| --- | --- | --- | --- |
| The tower range has no effect on the result. | The rebuild repeats the 2026-10-03 defect: the spot does not matter. | critical | W1 and P3 fail when every built tower shoots on every step. |
| An attacker that gets through changes the sentence evidence. | The host records a wrong word that the student did not choose. | critical | E2 fails when a breach adds to `wrongs`. |
| The wave loop does not end. | The `build` command hangs the game. | high | W6 fails when the step count passes its bound. The vitest timeout is the second guard. |
| A wrong word stops costing a heart. | The sentence rule drifts from today. | high | S3 fails. |
| The core keeps hero posts or volleys. | The views keep the battle-stage model. | high | X1 to X3 fail. |
| The bot picks a spot by a different rule. | The QC run shows a different game from the spec. | medium | B2 fails. |
| The core reads a clock or `Math.random`. | A replay gives other events. | high | R1, R2, and A-core fail. |
| The driver drops a new event. | The view shows a wave with no breach or no shot. | medium | D2 fails. |
| Green breaks the old views at run time. | The local demo plays wrong until Phase 2. | medium | The type check finds the compile errors. Run-time play is not tested in Phase 1 (section 9). |

Phase risk: P1 is `high`, because it replaces the wave rules and touches the evidence path. P2 is
`high`, because it replaces both views, the manifest, and the packs.

## 3. Proposed core contract

Red writes the tests against this contract. Red can change a name. Red then records each changed name
in the plan, and the behavior rows stay the same.

- Command: `{ type: 'build'; spot: number }` replaces `{ type: 'build'; post: number }`.
- State: `path` is the list of path steps from the gate (index 0) to the last step before the castle.
- State: `spots` is a list of `{ spot: number; covers: number[]; level: number }`. `covers` holds the
  path step indexes in the range of the spot. Level 0 is an empty spot.
- State: each attacker has `at`, its path step index. An attacker that gets through leaves the path.
- The state has no `posts`. The core exports no `POSTS` and no `keeperOf`.
- Events: `towerBuilt { spot, level, coins }`, `waveStep { step, moves, shots }`, and
  `attackerThrough { enemyId, hearts }`. A shot is `{ spot, enemyId, at, hits, hitsLeft, fell }`.
- Events: `attackerStrike { enemyId, hearts }` has no `hero`. `sentenceBuilt { wave, spots }` has no
  `posts`. The event type `volley` is gone.
- Event order of `build`: `towerBuilt`, then for each step `waveStep` and its `attackerThrough` and
  `rest` events, then `waveCleared`, then `waveAppeared` and `stepShown`, or `victory`.
- On one step, the attackers move first. Then each built spot shoots the front attacker in its range.
  The front attacker is the attacker with the highest `at`. A tower of level n gives
  `min(n, hitsLeft)` hits to that one attacker, as the posts do today.
- Green writes the final order in the note at the top of `core/sim.ts`. Row W5 tests that note.

## 4. Open product questions (assumptions)

The PM asks Daniel these questions. The rows use the defaults now.

| Id | Question | Default in the rows | Rows |
| --- | --- | --- | --- |
| Q1 | Does a wrong word still cost a castle heart? | Yes, as today. | S3, S4 |
| Q2 | Can a student build on a spot that holds a tower? | Yes. The tower goes up one level. | P2 |
| Q3 | How many build spots does the core hold? | 6. Phase 2 sets the final layout. | L1 |
| Q4 | Does a level-n tower spread its hits to a second attacker when the first falls? | No, as the posts do today. | W4 |

Q4 is new. The spec says "A tower of level n hits n times" and does not say more.

## 5. Test rows for the Red task

Owned paths: `tests/games/castle-defense/rules.test.ts`, `replay.test.ts`, `bot.test.ts`,
`driver.test.ts`, and `helpers.ts`. `manifest.test.ts` stays unchanged in Phase 1.

The "Red" column says if the row must fail at Red. A guard row passes at Red and protects a rule that
stays. Each row has a falsifier: the change that makes it fail.

Non-empty rule (A4): a row that checks each member of a list first asserts that the list is not
empty. For example, W1 to W4 first assert at least one `waveStep` event and at least one shot. With no
shot, a "for each shot" check passes on nothing.

### Sentence building (FR-1)

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| S1 | medium | The card holds 3 words, or 2 in Helper mode. Exactly one word is right. The words have no punctuation. | guard | A card with 4 words, or with 2 right words. |
| S2 | medium | A right word joins the sentence and scores coins that grow with the streak. | guard | The coins do not grow, or `built` does not grow. |
| S3 | high | A wrong word shuts for this step and costs one heart. The event order is `picked`, `attackerStrike`, `stepShown`. The `attackerStrike` event has no `hero`. (Q1) | fail | A wrong word with no heart lost, or an event with `hero`. |
| S4 | high | At 0 hearts from wrong words, the `rest` event returns the hearts. The phase stays `playing`. | guard | Hearts at 0 after the event, or a phase other than `playing`. |
| S5 | medium | `start`, `pick`, and `build` before `start` give `rejected`. `pick` in the `place` stage gives `rejected`. | guard (adapt) | A command in the wrong stage changes the state. |

### Layout (FR-2)

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| L1 | high | `state.spots` has 6 entries with ids 0 to 5. All start at level 0. (Q3) | fail | 3 posts, 4 spots, or a duplicate id. |
| L2 | high | `state.path` has at least 2 steps. Each `covers` list is not empty, and each index is in `[0, path.length - 1]`. | fail | An empty range, or a range index outside the path. |
| L3 | high | At least two spots have a different `covers` length. At least one path step is outside the range of some spot. | fail | All spots cover the full path. Then the spot does not matter, and B2 has only ties. |
| L4 | low | `path` and `spots` are not empty, and they are equal for the seeds 1 to 4 and for Helper mode. | fail | The layout reads the random number generator. |

### Placement (FR-3)

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| P1 | critical | `build(spot)` raises the level of that spot by 1. The other spots keep their level. `towerBuilt` names the spot and the level. | fail | The tower goes to spot 0, or to a spot that the student did not pick. |
| P2 | high | A second `build` on a built spot raises it to level 2. (Q2) | fail | The core rejects the command, or it adds a second tower. |
| P3 | high | `build` with spot `-1`, `6`, or `99` gives `rejected` and changes no state. `build` with spot 5 gives `towerBuilt`. | fail | An out-of-range spot builds a tower, or spot 5 is rejected. |

### The wave in steps (FR-4, FR-5)

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| W1 | critical | Every shot comes from a built spot, and the `at` of the shot is in the `covers` of that spot. | fail | A tower shoots an attacker out of its range. |
| W2 | critical | On each step, each built spot with a living attacker in its range gives exactly one shot. | fail | A tower with an attacker in range is silent. |
| W3 | high | The target of each shot has the highest `at` of the living attackers in the range of the spot. | fail | The tower shoots the rear attacker. |
| W4 | high | The hits of a shot are `min(level, hitsLeft)`. A level-2 tower gives 2 hits to a 3-hit tank. (Q4) | fail | The level has no effect. |
| W5 | medium | The events of `build` follow the order of section 3. A shot target's `at` is its position after the move of that step. | fail | The towers shoot before the move, or `waveCleared` comes before the last step. |
| W6 | high | The number of `waveStep` events of one `build` is at most `path.length + attackers + 1`. Each step moves each attacker on the path by one step. | fail | The attackers do not move, or the loop does not end. |
| W7 | critical | Each `attackerThrough` event lowers the hearts by 1. The attacker leaves the path and gets no later shot. | fail | A breach with no heart lost, or a shot at a breached attacker. |
| W8 | high | When a breach brings the hearts to 0, a `rest` event follows and the hearts return to the maximum. The phase stays `playing`. | fail | Hearts at 0 after the event, or a game over. |
| W9 | high | A wave ends when no attacker is left on the path. Then `cleared` of the sentence is true, also after a breach. | fail | A breach blocks the next wave. |

### The placement changes the result (FR-6)

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| F1 | critical | Take seed 5 and build wave 1 with right words. Build it 6 times, one time on each spot. The results (the `attackerThrough` count and the hearts) show at least 2 different values. | fail | Every spot gives the same result. |
| F2 | high | Do the same on wave 2 (3 tanks) with one tower already on spot 0. At least 2 results differ. | fail | A second tower does not change the result. |

### Remove the posts (FR-7)

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| X1 | high | The state has no `posts` key. | fail | `'posts' in state` is true. |
| X2 | high | The core module exports no `POSTS` and no `keeperOf`. Check with `import * as core`. | fail | An export with one of these names. |
| X3 | high | `CASTLE_DEFENSE_EVENT_TYPES` has no `volley`. No event of a full run has the type `volley`. | fail | A `volley` event. |

### Evidence (FR-8)

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| E1 | critical | The current evidence row stays: 2 wrong words give `attempts: 3`, `correctFirstTry: false`, and the parse with `storyGameEvidenceSchema` succeeds. The results do not depend on `durationMs`. | guard | A change to the evidence fields. |
| E2 | critical | Play the same seed and the same words two times: once on the spot with the most range, once on the spot with the least range. The test asserts that the hearts differ. The evidence items are equal. | fail | A breach changes `attempts`, `correctFirstTry`, or `solved`. |
| E3 | high | A run with at least one `attackerThrough` event and no wrong word gives `correctFirstTry: true` and `attempts: 1` for each sentence. | fail | A breach counts as a wrong word. |
| E4 | medium | `itemId` and `label` come from the story sentence. Each `itemId` is unique. | guard | An item with a wrong id or label. |

### Replay (FR-9)

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| R1 | high | The same seed, options, and commands give the same events and the same snapshot. The commands mix right words, wrong words, rejected commands, and builds on random spots. The run has at least one `waveStep`, one `attackerStrike`, and one `rejected` event. | fail | `Math.random` or a clock in the core. |
| R2 | medium | The recorder replays the commands to the same snapshot. | guard (adapt) | Hidden state outside `state`. |
| R3 | medium | Two runs with the same seed and different spots give different events. | fail | The replay row passes on a core that ignores the spot. |
| R4 | low | `snapshot()` is a deep copy and `tick()` returns `[]`. | guard | A shared reference. |

### The QC bot (FR-10)

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| B1 | high | For the 8 demo stories and the seeds 1 to 4, the bot plays to `victory`. The run has no `rejected` and no `attackerStrike` event. Each wave has at least one `waveStep` event. Each sentence has one evidence item with `attempts: 1`. | fail | The bot sends a command that the core rejects. |
| B2 | high | In the `place` stage, the bot returns the spot with the longest `covers` list, with the lowest index on a tie. The test computes the expected spot from `state.spots` by itself. | fail | The bot picks spot 0, or the highest index on a tie. |
| B3 | medium | The bot sends `start` first, then right words, and returns `null` after the run. | guard (adapt) | A `pick` before `start`. |

### The driver (FR-4 through the event player)

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| D1 | high | A recorder presentation taps through to `victory` on seeds 1 to 3. `complete` runs one time. The log has one tower, one wave spawn, and one wave clear for each wave. | fail | `complete` runs two times, or a wave is missing. |
| D2 | high | For one run with at least one breach, the driver log has one `step` line for each `waveStep`, one `shot` line for each shot, and one `through` line for each `attackerThrough` event. | fail | The driver drops an event. |
| D3 | medium | The presentation gets the spots through `showSpots(spots, build)`. A tap on a spot sends `build` with that spot. | fail | The driver still shows posts. |
| D4 | medium | A wrong word is marked, the hearts fall by 1, and the same step returns with a shut word. A tap after `destroy` changes nothing. | guard (adapt) | The tap changes the state. |

### Architecture guard

| Id | Risk | Row | Red | Falsifier |
| --- | --- | --- | --- | --- |
| A-core | high | The files in `src/games/castle-defense/core/` import only from `src/apk3d/contracts/`, `src/apk3d/sim/`, and `core/` itself. They contain no `Math.random`, `Date.now`, `performance.now`, `setTimeout`, or `setInterval`. | guard | An import of `three`, `phaser`, `view/`, or `src/games/shared/battle/`. A clock call. |

The test reads the core files as text and parses each `import ... from '...'` line. It needs at least
one import line per file, so an empty scan fails (A4).

## 6. Mutations for the Green gate

Green or the adversarial role applies each mutation to the Green code, runs `GREEN_TEST_COMMAND`, and
records the failing row. Then it reverts the mutation. Each mutation names the row that must fail.

| Id | Mutation | Row that must fail |
| --- | --- | --- |
| M1 | Each built spot shoots on every step, with no range check. | W1, F1 |
| M2 | The built spots do not shoot. | W2 |
| M3 | A tower shoots the attacker with the lowest `at` in its range. | W3 |
| M4 | A shot always gives 1 hit. | W4 |
| M5 | The towers shoot before the attackers move. | W5 |
| M6 | The attackers do not move. | W6 (the bound fails before the timeout) |
| M7 | A breach does not lower the hearts. | W7 |
| M8 | A breach at 0 hearts emits no `rest` event. | W8 |
| M9 | `build` always places on spot 0. | P1, F1, R3 |
| M10 | `build` on a built spot gives `rejected`. | P2 |
| M11 | A breach adds 1 to `wrongs` of the sentence. | E2, E3 |
| M12 | A wrong word costs no heart. | S3 |
| M13 | The state keeps `posts`. | X1 |
| M14 | The core keeps the `volley` event type. | X3 |
| M15 | The bot picks the highest index on a tie. | B2 |
| M16 | The driver ignores `attackerThrough`. | D2 |
| M17 | The core calls `Math.random()` for the target of a wrong-word strike. | R1, A-core |
| M18 | The layout has 4 spots. | L1 |

## 7. Gate commands

Each command comes from `plan.md` without a change.

- `RED_TEST_COMMAND` (Phase 1):
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/castle-defense --maxWorkers=1'`
- `GREEN_TEST_COMMAND` (Phase 1): the same command. It must exit 0.
- `VIEW_TEST_COMMAND` (Phase 2):
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/games/castle-defense tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1'`
- `TYPE_CHECK_COMMAND`:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node node_modules/typescript/bin/tsc --noEmit'`
- Frame command (Phase 2):
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node --import tsx scripts/apk3d-shot.ts both --game castle-defense --first'`, then the same command with `--2d`.
- QC run command (Phase 2):
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node --import tsx scripts/apk3d-shot.ts both --game castle-defense'`, then the same command with `--2d`.

Exit code 75 means hold. Record `lock wait over 600 s` and stop the run. Do not run tsc or vitest
outside `heavy-run.sh`.

### Red gate (Phase 1)

- Red runs `RED_TEST_COMMAND` and records the command, the exit code, and the labeled counts:
  `Tests <n> failed | <m> passed`.
- The exit code is 1. Each row marked "fail" in section 5 fails on its own assertion. A failure from a
  file load error does not count. Red reads new fields from the state and the events at run time, so
  one missing field fails one row only.
- The guard rows pass at Red. `manifest.test.ts` passes at Red.
- Red commits the five owned test files alone, by explicit paths.
- The type check at Red shows new errors in `tests/games/castle-defense/`. These errors are expected.
  Red records their count. Green must bring them to 0.

### Green gate (Phase 1)

- `GREEN_TEST_COMMAND` exits 0. The plan quotes the labeled counts: `Test Files 5 passed` and the
  test count. `helpers.ts` is not a test file.
- The Red tests are not weakened. A diff of `tests/games/castle-defense/` between the Red commit and
  the Green commit is empty. When Green needs a test change, Red makes it in a separate commit with a
  reason in the plan.
- The note at the top of `core/sim.ts` lists the new event order.
- The mutations M1 to M18 each fail their row. The adversarial role records the result of each one.

### Closeout gate (Phase 1)

- `TYPE_CHECK_COMMAND` shows 0 errors in `src/games/castle-defense/` and in
  `tests/games/castle-defense/`. The total is not above the baseline in section 8.
- Recommended extra check, because these files import the Castle Defense manifest:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/shared/battle.test.ts tests/apk3d/pack-bindings.test.ts --maxWorkers=1'`.
  Phase 1 does not change the manifest, so both must pass as before.
- `git diff --stat <phase_base_sha>..HEAD` lists only the owned paths of Phase 1, the plan, and the run
  logs. It lists nothing in `src/games/shared/battle/`.
- No sync goes to the monorepo.

## 8. Type-check baseline

The strategy role ran `TYPE_CHECK_COMMAND` one time on 2026-10-29, with the tree at
`bc75ba0a` and the uncommitted edits of the other sessions. The log is
`measure/runs/game_castle_defense_rebuild_20261029/strategy-tsc-baseline.log`.

- Exit code: 2.
- Total errors: 31.
- Errors in `src/games/castle-defense/`: 0.
- Errors in `tests/games/castle-defense/`: 0.
- Files with errors: `assets/airship.ts` 7, `assets/longship.ts` 1, `assets/merchant-cart.ts` 1,
  `assets/mushroom-cap.ts` 3, `assets/plank.ts` 6, `assets/rowboat.ts` 8, `assets/waterskin.ts` 3,
  `assets/wool.ts` 1, and `tests/part.test.ts` 1. None is a path of this track.

Gate rule: the owned errors in `src/games/castle-defense/` and `tests/games/castle-defense/` must be 0
at Green. The total must not be above 31. When another session changes the total, the plan records the
new count and its file list, and the owned count stays 0.

## 9. Fixtures, mocks, and live-behavior proof

- Fixtures: the 8 demo stories in `tests/fixtures/stories/` through `helpers.ts`. `STORY` is
  `pip-is-brave` and `SHORT_STORY` is `the-school-garden`. No new fixture file is needed.
- Helpers: Red adds `buildOn(sim, spot)`, `widestSpot(state)`, and `narrowestSpot(state)` to
  `helpers.ts`. `widestSpot` must not import the bot, so B2 compares two separate computations.
- Mocks: the driver tests use a recorder `Presentation` with no three.js and no Phaser. `now` returns 0.
  No other mock is needed. The core runs as real code in every row.
- Live behavior: in Phase 1, the live behavior is the core and the bot. Each row runs the real core
  through `dispatch`. No row reads a source file for behavior. The architecture row A-core reads
  source text only for the import and clock guard.
- Phase 1 gap: the old views compile, but no test plays them in a browser. The local demo can show
  wrong motion until Phase 2. Phase 2 closes this gap with the QC run in 3D and in 2D.

## 10. Phase 2 outline (blocked until Daniel picks the look)

The PM relays the pick. The orchestrator asks the strategy role to refresh this section before the
Phase 2 Red task.

- Rows: no file in `src/games/castle-defense/` imports `stage3d.ts` or `stage2d.ts`. `MODELS_3D` and
  `FILES_2D` list the models and sprites of the pick. `FILES_2D` has no
  `background.monster-encounters`. The core layout matches the spots of the pick.
- `manifest.test.ts` imports `HEROES` and `battleFiles2D` from `stage2d.ts` and `vaultModels` from
  `stage3d.ts` today. Phase 2 Red must remove these imports. `tests/apk3d/pack-bindings.test.ts`
  names `vaultModels()` for Castle Defense. That shared row needs a change by explicit path.
- Gates: `VIEW_TEST_COMMAND`, `TYPE_CHECK_COMMAND`, the frame command, and the QC run command, each in
  3D and in 2D.
- Live proof: the QC run in 3D and in 2D with no page error and no diagnostic. One frame in each
  renderer and one frame with a tower on its spot, each with its SHA-256 in the plan.
- Risk: `high`. The adversarial role tries a view that shows the old stage behind the new scene.

## 11. Review applicability

| Gate | Phase 1 | Reason |
| --- | --- | --- |
| Review A (spec and tests) | Yes | Check rows S1 to A-core against FR-1 to FR-10, the defaults Q1 to Q4, and the evidence contract. |
| Review B (security) | No | Phase 1 adds no network call, no secret, no login, no file write, no shell call, and no new input parse. The input contract stays `PracticeInput` or `SentenceInput`. Review B applies again if a change reads a path, a URL, or an environment value. |
| Review C (UX and API) | Yes, API only | The commands, the state, the events, the `Presentation` interface, and the evidence are the public API of the cartridge. The monorepo port depends on them. The UX part waits for Phase 2. |
| Adversarial testing | Yes | The mutations M1 to M18. Also try a spot whose `covers` holds an index outside the path, and a wave whose attackers all start at the last step. |
| UX browser review | No | Phase 1 has no browser surface. The old views only compile. The review applies in Phase 2 on the QC run and the frames. |

Phase 2: Review A yes, Review B no unless a script reads outside the repository, Review C yes (the
manifest and the packs), adversarial testing yes, and UX browser review yes.

## 12. Artifact tests and live tests

- Live behavior tests: all rows in section 5 except A-core. They run the core, the bot, and the driver.
- Artifact tests: A-core (source text), and the plan records of the Red and Green runs. An artifact
  test proves a property of a file. It does not prove that the game plays.
- The plan text is evidence only when it quotes a command, an exit code, and labeled counts.

## 13. Intentionally red suites

- At Red, `RED_TEST_COMMAND` exits 1 on purpose. The plan records the failing count. No other task
  runs while the Phase 1 tests are red, except Green work on the owned paths.
- The aggregate suite (`vitest run` with no path) is not a gate of this track. Other sessions have red
  tests now (for example `tests/games/filled-shelves.test.ts`). Do not use the aggregate result as
  evidence for or against this track.
- At Red, the type check shows new errors in `tests/games/castle-defense/`. These are intended and
  Green removes them.

## 14. Anti-pattern coverage

`measure/anti-patterns.md` does not exist in this repository. This strategy uses the canonical catalog
in `~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`. A1 and A8 are retired.

| Id | Defense in this track | Falsifier |
| --- | --- | --- |
| A3 digit-only count | The plan and the logs record labeled counts: `Tests <n> failed`, `Found <n> errors`, and the owned error count by path. A gate parses the labeled integer only. | A date or another number satisfies a gate. |
| A4 vacuous pass | R1 needs at least one `waveStep`, one `attackerStrike`, and one `rejected` event. R3 needs different events for different spots. F1 needs 2 different results. D2 needs at least one breach. A-core needs at least one import line per file. | A run with no breach or no shot passes the breach or shot row. |
| A5 false claim | The plan quotes the command, the exit code, and the labeled counts of each gate. "All tests pass" needs an exit code of 0 in the quoted output. | The plan claim and the quoted output disagree. |
| A6 registry overstatement | The track stays `new` or in progress in the registry until Phase 2 closes. The registry entry is a closeout item, because another session owns `measure/tracks.md`. | A "done" claim before the Phase 2 frames and the QC run. |
| A7 over-broad filter | A-core scans every file in `core/`. The bot row B1 covers all 8 stories and the seeds 1 to 4. No row filters events by a broad pattern. | A filter drops a story, a seed, or a core file. |
| A9 archived track paths | No test references a `measure/tracks/` path. | A grep of `tests/games/castle-defense/` prints a track path. |
| A10 generated-facts drift | The generator run and the commit of `measure/generated/*` stay closeout items, because another session owns those paths. | The generated facts disagree with the plan after closeout. |
| A2 consent-blind publish gate | Not applicable. The track publishes nothing and has no consent state. | None. |

## 15. Phase base

The orchestrator captures the immutable `phase_base_sha` at one point: after the commit that adds this
file, and before Red writes the first test line. The value is `git rev-parse HEAD` of that commit. This
file names no phase base SHA, because a SHA from before the strategy commit is not the phase base.
