# Test strategy: rebuild Magic Defense as a missile defense game

Track: `game_magic_defense_rebuild_20261029`. Phase 1 is "Phase 1: Rules core". Phase 2 is "Phase 2:
Views" and waits for the look that Daniel picks. This file gives the full strategy for Phase 1 and an
outline for Phase 2.

The [specification](./spec.md) owns the scope. The [plan](./plan.md) owns the gate commands. This file
copies the gate commands exactly. When the two differ, the plan wins.

## 1. Baseline facts (role base `bc75ba0a`)

- The core holds one `round` at a time. `round.castle` is the castle under the missile.
- A wrong `cast` takes one heart, shuts the word, and keeps the same `round` above the same castle.
  When that castle falls, `roundOf` puts the same word above a standing castle.
- `tick()` returns `[]`. The core has no clock.
- The bot (`qc/bot.ts`) casts the open choice whose `wordId` is `round.wordId`.
- The driver (`view/driver.ts`) plays ten event types. It has no method for a held missile.
- Only the tests, `view/`, `view2d/`, `src/host/registry.ts`, and
  `src/apk3d/contracts/model-pack.ts` import the game. Only the tests and `view/` import the core
  state shape. `scripts/apk3d-shot.ts` has no player for this game.
- `tsconfig.json` includes `tests/`. A Red test that names a new field adds type errors until Green.

## 2. Proposed core contract (Red and Green use these names)

Red needs names to write the tests. The names below are a proposal. Red can rename a field in the
Red commit. The rows in section 4 stay the same after a rename.

```ts
/** One missile that a thrower holds above a standing castle. */
interface HeldMissile {
  id: string;        // unique in the run, for example `m-7`
  wordId: string;    // the target word
  prompt: string;    // the Thai meaning
  castle: number;    // the castle under the missile
  enemyId: string;   // the thrower (the enemy of that lane)
}
// MagicDefenseState adds:
//   missiles: HeldMissile[]      // at most one per standing castle
//   activeMissileId: string | null
// MagicDefenseState keeps `round`: the card of the active missile.
//   round.wordId, round.prompt, round.castle, round.enemyId equal the active missile.
// MagicDefenseEvent adds:
//   { type: 'missileThrown'; missile: HeldMissile }
// MAGIC_DEFENSE_EVENT_TYPES lists 'missileThrown'.
// Presentation adds: throwMissile(missile: HeldMissile, enemy: EnemyShown): Promise<void>
```

The `round` field stays, so the old views keep their card code. This keeps the Phase 1 view edits
small, as the plan requires.

Proposed event order (Green writes the final order in the note at the top of `core/sim.ts`):

```text
start: waveAppeared, missileThrown x (one per standing castle), roundShown
right: cast, scored, [missileThrown] or [waveCleared, [waveAppeared, missileThrown x n]],
       then roundShown or victory
wrong: cast, castleHit, [rest, missileThrown x n], [missileThrown], roundShown
storm: stormCast, [missileThrown], roundShown
```

Every held missile enters the state through one `missileThrown` event. H13 counts on this rule.

## 3. Assumptions for the PM to ask Daniel

The rows that use an assumption carry its tag. A changed answer changes only the tagged rows.

- **ASM-1 (spec open question 1).** The student does not choose the held missile. The core picks the
  active missile in a seeded order. The card shows the choices of the active missile.
- **ASM-2.** A wrong word takes one heart from the castle of the active missile. No other castle loses
  a heart.
- **ASM-3 (engineering default).** After a wrong word, the same meaning stays active. Its failed word
  stays shut. This matches the behavior today.
- **ASM-4 (engineering default).** The waves stay. A free place above a castle takes the next unheld
  word of the current wave. The place stays free when the wave has no unheld word.

## 4. Phase 1 test rows (Red task)

Phase 1 risk: `high`. The core changes the state contract of both views and the rule of a wrong word.
The evidence contract must not change.

Risk levels: `critical` breaks learning evidence or blocks a run. `high` breaks a spec rule that the
student sees. `medium` breaks replay or the view contract. `low` is a guard.

| Id | Risk | File | Row | Expected Red failure |
| --- | --- | --- | --- | --- |
| H1 | high | `rules.test.ts` | After `start`, `missiles.length` equals the count of standing castles (3, or 2 in Helper mode) when the wave has enough words. No two missiles share a castle. Every missile sits above a castle with hearts above 0. | `missiles` is undefined. |
| H2 | high | `rules.test.ts` | Each held missile keeps its `castle`, `prompt`, `wordId`, and `enemyId` across every command that does not answer it: a right cast on another missile, a `storm`, and a rejected command. The `prompt` equals the translation of `wordId`. | `missiles` is undefined. |
| H3 | high | `replay.test.ts` | `tick()` returns `[]` 500 times. The snapshot before and after the 500 calls is deep equal. No missile leaves `missiles` without a `cast`. | Passes today for `tick`. The missile part fails because `missiles` is undefined. |
| H4 | high | `rules.test.ts` | Exactly one held missile is active. `activeMissileId` names a member of `missiles`. `round.wordId`, `round.prompt`, `round.castle`, and `round.enemyId` equal the active missile. `round.choices` holds the right word exactly once. | `activeMissileId` is undefined. |
| H5 | medium | `rules.test.ts` | ASM-1. For 30 seeds, record the castle of the active missile after each right cast. The same seed gives the same castle list. At least two seeds give different lists. At least one seed has an active missile on a castle other than the lowest held castle. | `activeMissileId` is undefined. |
| H6 | high | `rules.test.ts` | A right cast breaks the active missile: it leaves `missiles`, and `cast` has `correct: true`. The coins, the streak, and the mana change by the `TUNING` values. The next unheld word takes the free place above the same castle (ASM-4). A `missileThrown` event names it. The other held missiles do not change. | `missileThrown` never occurs. |
| H7 | critical | `rules.test.ts` | ASM-2. A wrong cast emits `cast` with `correct: false` and one `castleHit` for the castle of the active missile. That castle loses exactly 1 heart. The sum of the other hearts does not change. The streak goes to 0. | Passes for the heart part today. The row fails on the `missiles` checks of H8. |
| H8 | critical | `rules.test.ts` | ASM-3. After a wrong cast the meaning stays in play: one held missile has the same `wordId`, it is active, and the failed choice has `blocked: true`. A second cast of that choice gives `rejected`. The right choice never shuts. When the castle has fallen, the meaning comes back above a standing castle, and the shut word stays shut. | `missiles` is undefined. |
| H9 | high | `rules.test.ts` | A fallen castle holds no missile until the rest. When every castle is at 0 hearts, `rest` occurs, every castle returns to `castleHealth`, and every castle holds a missile again when the wave has unheld words. The phase stays `playing`. | `missiles` is undefined. |
| H10 | high | `rules.test.ts` | The storm needs full mana. It sets every castle to `castleHealth` and the mana to 0. The `missiles` list before and after the storm is deep equal, and the shut choices stay shut. A storm can fill a free place above a castle that was down; the held missiles do not change. | `missiles` is undefined. |
| H11 | critical | `rules.test.ts` | The evidence stays. One `word` item per story word. `attempts` counts the casts while the word was active. `correctFirstTry` is true only when the first cast was right. A word that is held but never active has `attempts: 0` until it is active. `storyGameEvidenceSchema.parse` returns the same object. | Passes today. It becomes a guard against a Green change that counts a cast on a held word that is not active. |
| H12 | medium | `replay.test.ts` | The same input, seed, options, and commands give deep-equal events and a deep-equal snapshot. The command mix holds right, wrong, rejected, and `storm` commands. The events hold at least one `missileThrown`, one `castleHit`, and one `rejected`. The recorder replay gives the same snapshot. | `missileThrown` never occurs. |
| H13 | high | `bot.test.ts` | The bot plays 8 stories × 3 seeds to `victory` from the state alone. It reads the active missile and casts its right word. No `rejected` and no `castleHit` occur. Every word has `attempts: 1`. The count of `missileThrown` events equals the count of story words. | `missileThrown` count is 0. |
| H14 | medium | `driver.test.ts` | The driver plays every event type of `MAGIC_DEFENSE_EVENT_TYPES`. A guard row compares the list to the event types that a full run with wrong casts and a storm emits. Each type other than `rejected` makes at least one recorder call. `missileThrown` calls `throwMissile` with the missile and its thrower. | `throwMissile` is never called. |
| H15 | medium | `driver.test.ts` | The student taps through to `victory`. `complete` is called once. A wrong tap logs `mark:false`, `spell:false`, and one `hit:` line. The next card shows the same meaning with the shut word. | Fails on the `throwMissile` count. |
| H16 | low | `rules.test.ts` | The run ends only in `victory`. With 30 seeds and wrong casts on every third card, every word is solved, `missiles` is empty, `round` is `null`, and `activeMissileId` is `null`. | `missiles` is undefined. |

Keep these rows of today without a change: the content rows, the Helper row, the formation row, the
mana cap, "commands after the victory do nothing", "an empty input is a won run", and the snapshot
deep copy. Red rewrites the rows of today that assert the old one-round shape. The wrong-spell row of
`rules.test.ts` and the wrong-tap row of `driver.test.ts` are the two rows in that group.

### Helpers

- `helpers.ts` adds `active(sim)`, which returns the active held missile.
- `rightChoice` and `wrongChoice` keep their names and read `round`. H4 proves that `round` is the
  card of the active missile.
- `playToEnd` keeps its limit of 400 steps. A run that does not end throws. A silent loop is not a pass.

### Fixtures and mocks

- Stories: `tests/fixtures/stories/*/story.json`, through `loadStory`. No new fixture.
- H1 and H6 need a wave with more words than castles. `pip-is-brave` has 13 words in waves of 5, 4,
  and 4. Red asserts the wave size inside the row, so a later fixture change makes the row fail.
- H16 also runs `the-new-student` (5 words, one wave) in normal mode, so the last missiles of a wave
  leave free places that stay free (ASM-4).
- H9 needs every castle to fall. Use Helper mode (2 castles) and wrong casts, as the rest row of today
  does.
- H10 sets `state.mana = state.maxMana` by direct write. This is the same method as the storm row of
  today.
- The driver uses the recorder `Presentation` of `driver.test.ts`. No three.js, no Phaser, no DOM.
- No mock of the RNG. The rows use real seeds.

## 5. Mutations for the Green gate

Green proves each row with a mutation. Apply one mutation, run `GREEN_TEST_COMMAND`, record the failing
row, and revert. Each mutation names the row that must fail.

| Id | Mutation in `src/games/magic-defense/` | Row that must fail |
| --- | --- | --- |
| M1 | Throw the next word above a fallen castle. | H1, H9 |
| M2 | Throw two missiles above one castle when the wave has spare words. | H1 |
| M3 | Move one held missile to another castle on a right cast. | H2 |
| M4 | Make `tick()` remove the oldest held missile. | H3 |
| M5 | Set `round` from the first missile while the active id names another. | H4 |
| M6 | Pick the active missile as the lowest held castle with no RNG. | H5 |
| M7 | Leave the free place empty after a right cast. | H6 |
| M8 | On a wrong cast, take the heart from castle 0. | H7 |
| M9 | On a wrong cast, drop the meaning from `missiles`. | H8 |
| M10 | On a wrong cast, clear the `blocked` flags of the meaning. | H8 |
| M11 | Skip the refill of the castles in `rest`. | H9 |
| M12 | Clear `missiles` in `storm`. | H10 |
| M13 | Add 1 to `attempts` for every held word on each cast. | H11 |
| M14 | Draw the active order from `Math.random()`. | H5, H12 |
| M15 | Make the bot cast the first open choice. | H13 |
| M16 | Remove the `missileThrown` case from the driver switch. | H14 |
| M17 | Leave `activeMissileId` set after `victory`. | H16 |

A mutation that fails no row is a finding. Green adds a row or reports the gap.

## 6. Anti-pattern coverage

`measure/anti-patterns.md` does not exist in this repository. This strategy uses the registry in
`~/Desktop/advantage-pr/measure/anti-patterns.md` (A1 to A10).

| A-class | Phase 1 defense |
| --- | --- |
| A1 substring signal | No row reads an event or a state by a text match. Rows compare `type` fields and ids. |
| A3 digit-only count | Each count row compares a named number: `missiles.length` to the standing castles, `missileThrown` to the word count. Red and Green record the test counts as labeled lines: `Tests: <failed> failed, <passed> passed`. |
| A4 vacuous pass | H5 needs two seeds that differ. H9 needs one `rest`. H12 needs one `missileThrown`, one `castleHit`, and one `rejected`. H14 needs the full event list. A row that sees zero cases fails. `playToEnd` throws at its limit. |
| A5 false claim | The plan records the command, the exit code, and the failure count of each run. "All tests pass" needs exit 0 from `GREEN_TEST_COMMAND`. |
| A6 overstatement | The Phase 1 closeout does not claim that the game is rebuilt. The views stay on the battle stage until Phase 2. |
| A7 over-broad filter | No row filters events by a text pattern. H14 lists every event type by name. |
| A9 archived path | No test reads a track path. |
| A10 generated facts | Phase 1 adds no file and removes no file in `src/`. If Green adds a file in `core/`, the closeout runs the generator check. Another session owns `measure/generated/*`, so the result goes to the handoff. |

A2 (consent) and A8 (marker regex) do not apply to a rules core.

## 7. Gate commands (copied from `plan.md`)

- `RED_TEST_COMMAND` (Phase 1): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/magic-defense --maxWorkers=1'`
- `GREEN_TEST_COMMAND` (Phase 1): the same command. It must exit 0.
- `VIEW_TEST_COMMAND` (Phase 2): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/games/magic-defense tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1'`
- `TYPE_CHECK_COMMAND`: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node node_modules/typescript/bin/tsc --noEmit'`
- Frame command (Phase 2): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node --import tsx scripts/apk3d-shot.ts both --game magic-defense --first'`, then the same command with `--2d`.
- QC run command (Phase 2): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node --import tsx scripts/apk3d-shot.ts both --game magic-defense'`, then the same command with `--2d`.

Exit code 75 means hold. Record `lock wait over 600 s` and stop the run.

### Type-check baseline

The strategy role ran `TYPE_CHECK_COMMAND` once at role base `bc75ba0a`. The run started at
2026-10-29T02:44:41Z and ended at 2026-10-29T02:51:13Z. The log is
`measure/runs/game_magic_defense_rebuild_20261029/strategy-tsc-baseline.log`.

- Exit code: 2.
- Total errors: 31.
- Errors in `src/games/magic-defense/`: 0.
- Errors in `tests/games/magic-defense/`: 0.
- The 31 errors are in `assets/` (30) and `tests/part.test.ts` (1). None is in a path of this track.

Gate rule: the owned errors must be 0 after Green. The total must not be above 31. A new error in a
path of another session does not count against this track. Green names that error and its path.

### Phase 1 gates

- **Red gate.** `RED_TEST_COMMAND` exits 1. The failures include rows H1, H2, H4, H6, H8, H9, H10,
  H12, H13, H14, and H16. `manifest.test.ts` passes. Red records the command, the exit code, and the
  labeled counts. The Red commit holds only the five owned test paths.
- **Red type check.** Red may raise the owned errors in `tests/games/magic-defense/`. Red records the
  owned count and the total. The source errors in `src/games/magic-defense/` stay at the baseline.
- **Green gate.** `GREEN_TEST_COMMAND` exits 0. The counts show 0 failed. The test count is not below
  the Red count.
- **Type-check gate.** `TYPE_CHECK_COMMAND` shows 0 errors in `src/games/magic-defense/` and
  `tests/games/magic-defense/`. The total is not above the baseline.
- **Closeout gate.** Green runs mutations M1 to M17 and records each failing row. `tests/games/shared/battle.test.ts`
  still passes, because Phase 1 does not change the manifest. Green runs this one extra command:
  `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/shared/battle.test.ts --maxWorkers=1'`.

### Intentionally red aggregate suites

- The Red commit makes `tests/games/magic-defense` red on purpose. A full `vitest run` stays red until
  the Green commit. The orchestrator does not treat this red result as a regression of another track.
- Other tracks can have red suites at the same time (for example `tests/games/filled-shelves.test.ts`).
  Phase 1 gates run only the paths in this section. They do not run the full suite.

## 8. Architecture guardrails and changed contracts

- The core imports only `src/apk3d/contracts/` and `src/apk3d/sim/`. It has no DOM, no three.js, no
  Phaser, no `Date`, no `Math.random()`, and no timer. Review A checks the imports of `core/`.
- All random choices use the one seeded `Rng` of `createMagicDefense`. A new RNG call changes the
  replay of old seeds. That is acceptable in this track, because no stored replay exists.
- Phase 1 changes no path in `src/games/shared/battle/`, `src/games/rune-match/`,
  `src/games/rpg-battle/`, or `src/games/monster-encounters/`.
- Changed contracts: `MagicDefenseState`, `MagicDefenseEvent`, `MAGIC_DEFENSE_EVENT_TYPES`, and
  `Presentation`. The callers are `view/game.ts` and `view2d/game.ts`. The window hook
  `__apk3dGame.test.state` exposes the state to QC scripts. No script in this tree reads the
  Magic Defense state today.
- The evidence contract (`StoryGameEvidence`, `GameResults`) does not change. H11 guards it.
- The monorepo has a copy of this game. Phase 1 sends no sync. The PM routes the sync after Phase 2.

## 9. Review applicability (Phase 1)

| Review | Applies | Scope |
| --- | --- | --- |
| Review A (spec and rules) | Yes | Rows H1 to H16 against FR-1 to FR-9, the event order note at the top of `core/sim.ts`, the guardrails of section 8, and the mutation results. |
| Review B (security) | No | The core adds no network call, no secret, no file read, no storage write, and no input parse. The evidence goes through the existing schema. Review B applies only if Green adds a parse of an external value or a host call. |
| Review C (UX and API) | Yes, for the API | The new state fields, the new event, and the new `Presentation` method are the contract of the two views in Phase 2. Review C checks the names, the event order, and that each event carries ids and plain values. |
| Adversarial testing | Yes | The mutations M1 to M17. Also: 1 word in a run of 3 castles, 2 words with the same term, a run where every castle falls twice, a storm at full mana with a fallen castle, and 200 rejected commands in a row. |
| UX browser review | No | Phase 1 has no browser surface. The old views stay on the battle stage. The browser review is a Phase 2 gate. |

Live-behavior proof in Phase 1 is the core run in vitest. The driver rows use a recorder, so they prove
the event order, not the picture. A Phase 1 claim names "rules core", not "game".

## 10. Phase base SHA

The orchestrator captures the immutable `phase_base_sha` from `git rev-parse HEAD` after the commit of
this file and before Red writes the first line of a test. This file names no SHA for it.

## 11. Phase 2 outline (blocked until Daniel picks the look)

Risk: `high`. The scene is the visible fix of the track.

| Id | Row | File |
| --- | --- | --- |
| V1 | No file in `src/games/magic-defense/` imports `src/games/shared/battle/stage3d.ts` or `stage2d.ts`. The row reads the import lines of each file with a TypeScript-aware match on the module path. | `scene.test.ts` |
| V2 | `MODELS_3D` and `FILES_2D` list the models and the sprites of the picked look. `FILES_2D` does not list `background.monster-encounters`. | `manifest.test.ts` |
| V3 | The pack binding test and the budget test pass for the game. | `tests/apk3d/*` |
| V4 | The QC bot plays a full run in 3D and in 2D with no page error and no diagnostic. | QC run command |
| V5 | One frame in 3D and one frame in 2D, each with SHA-256, differ from the frames of the other three rebuild games and Monster Encounters. A person looks at each frame. | Frame command |

- `tests/games/shared/battle.test.ts` lists Magic Defense in `STAGE_GAMES`. After V1 the game binds no
  battle files, so that test fails. Another session owns `tests/games/shared/`. The PM must route the
  removal of `magicDefense` from `STAGE_GAMES` before the Phase 2 Green gate.
- `scripts/apk3d-shot.ts` has no player for this game. Phase 2 adds one in its own block.
- Review B: no, unless the QC player opens a port other than the local vite server. Review C: yes.
  Adversarial testing: yes, for the frame compare and the missing avatar silhouette. UX browser review:
  yes, at 1280 × 720, 390 × 844, and 844 × 390 with touch.
- The Phase 2 strategy is a new revision of this file after the pick. It names the models and the
  sprites.
