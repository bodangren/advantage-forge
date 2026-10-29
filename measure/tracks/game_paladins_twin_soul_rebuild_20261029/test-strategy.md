# Test strategy: rebuild Paladin's Twin Soul as a chapel shooter

Track: `game_paladins_twin_soul_rebuild_20261029`. Phase: P1, "Phase 1: Rules core".
Strategy base: `bc75ba0a` (the track-opening commit). Phase 2 has an outline only (section 10).
Phase 2 is blocked until Daniel picks the look.

## 1. Scope and the phase base

- Phase 1 changes the rules core, the QC bot, and the view driver. It has no browser surface.
- The old views stay on the battle stage in Phase 1. Green makes only the smallest view edits that
  keep the type check clean.
- The orchestrator captures `phase_base_sha` after the commit of this file. The value is the
  commit that adds this file: `git log -1 --format=%H -- measure/tracks/game_paladins_twin_soul_rebuild_20261029/test-strategy.md`.
  Capture it before the Red task starts. Do not use `bc75ba0a` as the phase base.

## 2. Gate commands (exact text from plan.md)

| Gate | Command | Pass condition |
| --- | --- | --- |
| `RED_TEST_COMMAND` (P1) | `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/games/paladins-twin-soul --maxWorkers=1'` | Exit 1. Each new row in section 4 fails by name (section 6). |
| `GREEN_TEST_COMMAND` (P1) | The same command. | Exit 0. 0 failed tests. The test count is not below the Red count. |
| `TYPE_CHECK_COMMAND` | `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node node_modules/typescript/bin/tsc --noEmit'` | 0 errors in `src/games/paladins-twin-soul/`. The total is not above the baseline (section 3). |
| `VIEW_TEST_COMMAND` (P2) | `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/games/paladins-twin-soul tests/apk3d/pack-bindings.test.ts tests/apk3d/budget.test.ts --maxWorkers=1'` | Phase 2 only. |

- Exit code 75 means hold. Record `lock wait over 600 s` and stop the run.
- Run no `tsc` and no `vitest` outside `heavy-run.sh`. One heavy job runs at a time.
- Phase 1 closeout gate: `GREEN_TEST_COMMAND` exit 0, then `TYPE_CHECK_COMMAND` within the
  baseline, then the static check in section 7. Record each exit code and each count in plan.md.

## 3. Baselines

### Type-check baseline

The strategy role ran `TYPE_CHECK_COMMAND` once on 2026-10-29 at HEAD `dde11f04`. The working
tree held uncommitted edits of other sessions.

- Exit code: 2.
- Total errors: 31.
- Owned errors (`src/games/paladins-twin-soul/`): 0.
- Files with errors: `assets/airship.ts` (7), `assets/rowboat.ts` (8), `assets/plank.ts` (6),
  `assets/mushroom-cap.ts` (3), `assets/waterskin.ts` (3), `assets/longship.ts` (1),
  `assets/merchant-cart.ts` (1), `assets/wool.ts` (1), `tests/part.test.ts` (1).
- Count rule: lines that match `^[^ ].*error TS[0-9]+`. Parse the labeled integer, not a bare digit.
- Green gate: `Owned errors: 0` and `Total errors:` at or below 31. A rise that comes only from a
  path of another session is not a Phase 1 failure. Green names the path and the owner in plan.md.

### Test baseline before Red

The strategy role ran `RED_TEST_COMMAND` once on the old tests, before Red.

- Exit code: 0.
- Test files passed: 5. Tests passed: 88. Tests failed: 0.
- This is the old battle contract. Red replaces the monster rows, so the Red count can differ.

## 4. Phase 1 test rows (risk-ranked)

The rows bind behaviors. Section 5 gives the default names of the new exports and events. Red can
pick other names. Red then records each name in the header comment of `rules.test.ts`.

Rows marked "assumption" use a default for an open product question. The PM asks Daniel (section 9).

| Id | Risk | File | Statement | Mutations the row must catch |
| --- | --- | --- | --- | --- |
| T1 | high | `rules.test.ts` | No monster. `createTwinSoul(...).state` has no key `monster`, `monsterIndex`, or `heroTurn`. `TWIN_SOUL_EVENT_TYPES` has no `monsterAppeared`, `monsterDefeated`, `heroStrike`, or `monsterStrike`. `import * as core` has no `MONSTER_KINDS`, `monstersOf`, or `HEROES`. A full mixed run (right, wrong, rejected strikes, 3 seeds) emits none of these four types. | M1: keep `monster: null` in the state. M2: keep `heroStrike` in the right-strike events. M3: keep `MONSTER_KINDS` exported. M4: emit `monsterAppeared` only at `start`. |
| T2 | high | `rules.test.ts` | Right strike. The events are `boltFired`, `soulFreed`, `shadesScattered`, then `waveShown` and `captured`, or `victory` after the last word. `twins` grows by 1. `score` grows by `TUNING.pointsPerSoul` (100). `shadesScattered.shades` lists every standing shade except the captor. `targetIndex` grows by 1. The new wave has new shade ids (`w2s*`). | M5: `twins` does not grow. M6: the scatter list holds the captor or a faded shade. M7: the next wave keeps the old shades. M8: points change from 100. |
| T3 | high | `rules.test.ts` | Wrong strike. The events are `boltFired`, `shadeFaded`, `shadeDived`, and `rest` only at 0 courage. The struck shade has `fallen: true` and stays out for this wave. `courage` falls by 1. `targetIndex` does not change. `misses` grows by 1. | M9: the faded shade returns in the same wave. M10: courage falls by 2, or by 0. M11: a wrong strike moves to the next wave. M12: no `shadeDived` event. |
| T4 | high | `rules.test.ts` | The dive (assumption Q1). The diving shade is a standing shade: never the faded shade, never an earlier faded shade. After the dive, it has `fallen: false` and the same index in `state.shades`. Over 30 seeds, the formation index of the first diver takes 3 or more values. When only the captor stands, the captor dives. | M13: the faded shade dives. M14: the diver is always the first standing shade (one index for all seeds). M15: the diver gets `fallen: true`. M16: the diver moves in `state.shades`. M17: the captor can never dive (the dive leaks the captor). |
| T5 | high | `rules.test.ts` | Shade kinds (assumption Q3). `SHADE_KINDS` equals `['specter', 'wraith', 'ghost']`. Every shade in the state and in `waveShown.shades` has a kind from that list, and the two kinds match by id. The same seed gives the same kinds. Over 30 seeds, the first-wave kind sequences are not all equal. Over one 8-word run, all three kinds appear. | M18: no `kind` on `ShadeShown`. M19: one kind for every shade. M20: kind by slot index without the seed. M21: `Math.random()` for the kind (T12 catches it too). |
| T6 | high | `rules.test.ts` | The captor looks like the other shades (FR-7, assumption Q2). Over 30 seeds, the captor kind takes all three values. In every six-shade wave, each kind appears twice, so the captor kind is never unique. Over 30 seeds, the captor formation index takes 4 or more values. | M22: the captor always gets `specter`. M23: the captor gets a kind that no decoy has. M24: the captor always takes slot 1. |
| T7 | high | `rules.test.ts` | Evidence stays (FR-8). One `word` item per story word with an attempt. `attempts` counts every accepted strike for the word. `correctFirstTry` is true only when the first strike hit the captor. `storyGameEvidenceSchema.parse` accepts the evidence. The duration does not change any field other than `durationMs`. | M25: a dive counts as an attempt. M26: a rejected strike counts as an attempt. M27: `correctFirstTry` turns true after a later right strike. |
| T8 | high | `replay.test.ts` | Replay (FR-9). The same seed, options, and commands give the same events and the same snapshot. The chaos run holds wrong strikes, so the dive draws enter the replay. A recorded run replays to the same snapshot. Another seed changes the target order. | M21. M28: the dive draws from a second, unseeded source. M29: the dive reads the wall clock. |
| T9 | high | `driver.test.ts` | The driver plays every new event (FR-11 and FR-12 basis). The test `Presentation` has no monster method (`spawn`, `setMonsterHp`, `heroStrike`, `monsterHit`, `monsterDefeated`, `monsterStrike`). A call to a missing method throws, so the test fails. The log holds `bolt`, `faded`, `dived`, `courage:4`, `freed`, `scatter`, and `victory`. A mixed run covers every type in `TWIN_SOUL_EVENT_TYPES` except `strikeRejected`. The test first asserts that the covered set is not empty. | M30: the driver drops `shadeDived`. M31: the driver still calls a monster method. M32: the driver skips `boltFired`. |
| T10 | high | `driver.test.ts` | No captor leak through the driver (FR-7). Each shade in the `ask` payload has the keys `id`, `term`, and `kind` only. `captured()` gets no argument. | M33: the payload holds `wordId` or a captor flag. M34: `captured(shadeId)`. |
| T11 | medium | `rules.test.ts` | Wave shape (FR-1). One wave per target word. Six shades per wave with 6 or more words, four in Helper mode. One captor per wave. Decoy terms are distinct. | M35: Helper mode gives six. M36: two captors. |
| T12 | medium | `rules.test.ts` | Rest (FR-5). Five wrong strikes give `shadeDived` courage values `[4, 3, 2, 1, 0]`, then one `rest` with 3. The phase stays `playing`. The captor still stands, so the wave can end. | M37: rest returns 5. M38: phase becomes a game over. M39: two `rest` events. |
| T13 | medium | `rules.test.ts` | The bolt (FR-3). Every accepted strike has exactly one `boltFired` as its first event, and its `shade` is the struck id. A rejected strike (unknown shade, faded shade) gives only `strikeRejected`, no bolt, and the snapshot does not change. | M40: a bolt on a rejected strike. M41: two bolts. M42: a rejected strike costs courage. |
| T14 | medium | `bot.test.ts` | The bot (FR-10). Over 8 stories, 3 seeds, and both modes, the bot plays to `victory` from the state alone. Every target has `solved` and `correctFirstTry`. The run has 0 `shadeDived` and 0 `strikeRejected`. `nextStrike` returns null after the end. | M43: the bot strikes a decoy. M44: the bot reads a field that the state does not hold. |
| T15 | low | `rules.test.ts` | Static guard. The text of `src/games/paladins-twin-soul/core/*.ts` holds no `skeleton`, `mimic`, `dragon-fire`, `heroTurn`, or `monster` word (case-insensitive). | M45: a dead `MONSTER_KINDS` constant stays in `types.ts`. |

Keep these rows of today as they are: `content` (targets, `VocabularyInput`, an empty run),
`start` once, a strike before `start`, `snapshot()` as a deep copy, and `tick()` returns `[]`.
Delete the rows that test the monster rules (`monstersOf`, the hero turn, `monster.hp`). T1 replaces
them. `manifest.test.ts` is not a Red path in Phase 1. It stays green, because `manifest.ts` does
not change in Phase 1.

## 5. Default contract names

Green owns the final code. These defaults keep Red and Green on one name set.

- `SHADE_KINDS = ['specter', 'wraith', 'ghost'] as const` and `type ShadeKind`.
- `Shade` and `ShadeShown` gain `kind: ShadeKind`.
- New event `boltFired { shade }`. It is the first event of each accepted strike.
- `shadeFell` becomes `shadeFaded { shade, wordId }`.
- `monsterStrike` becomes `shadeDived { shade, courage }`. The shade returns to its place.
- Event order of one `strike`. Wrong: `boltFired, shadeFaded, shadeDived, [rest]`. Right:
  `boltFired, soulFreed, shadesScattered`, then `waveShown, captured` or `victory`.
- The kinds: a balanced seeded order. The core repeats `specter, wraith, ghost` over the slots and
  shuffles the list with the run RNG. A six-shade wave holds each kind twice.
- The dive: the core draws one standing shade with the run RNG. The captor is in the draw.
- The core event `captured` keeps its `shade` field. The driver does not pass it to the view.
- Green updates the event order note at the top of `core/sim.ts`. Review A checks the note.

## 6. Red rules and the intentionally red suite

- `RED_TEST_COMMAND` runs the whole folder. The Red log must name each failing row by test name.
- A suite that fails to load hides its rows. A load failure does not count as a Red failure for a
  row. Import missing exports as namespace members (`core.SHADE_KINDS`), so that each test fails on
  its own assertion.
- Rows that can pass at Red (T11, T13 rejected part, T14 null part, the kept rows): name them in
  the Red log as "pass at Red" with the mutation that they catch. This prevents a vacuous pass (A4).
- Record the Red exit code and the failed and passed counts as labeled integers, for example
  `Red failed: 21`, `Red passed: 30`. Do not write a bare digit (A3).
- The aggregate suite (`pnpm test`) is not a Phase 1 gate. Other sessions hold red tests now
  (`tests/games/filled-shelves.test.ts` Red, Storytime Green). Do not fix and do not quote their
  failures as this track's results.
- Out-of-folder tests that import this game: `tests/games/shared/battle.test.ts` and
  `tests/apk3d/pack-bindings.test.ts` import `manifest.ts` only. Phase 1 does not change
  `manifest.ts`, so they stay as they are. Green does not run or edit them in Phase 1.

## 7. Architecture guardrails and changed-contract risks

- Owned paths only: `src/games/paladins-twin-soul/core/`, `qc/bot.ts`, `view/driver.ts`, and the
  smallest edits in `view/` and `view2d/` for the type check. Tests: `tests/games/paladins-twin-soul/`.
- No change in `src/games/shared/battle/`, `src/games/rpg-battle/`, `src/games/monster-encounters/`,
  `src/games/rune-match/`, `src/apk3d/`, or `measure/generated/*`.
- Static check at closeout:
  `git diff --name-only <phase_base_sha>..HEAD` lists only owned paths and Measure files of this track.
- The core stays pure: no `Date`, no `performance`, no `Math.random`, no DOM, no three.js, no Phaser.
  T8 catches a clock or a second random source. Review A reads the imports of `core/`.
- Changed contract 1: `TwinSoulEvent` loses five types and gains three. The old views use the
  `Presentation` interface only, so the view edit stays small. Risk: a view keeps a monster call
  that does nothing. The type check catches a removed method.
- Changed contract 2: `TwinSoulState` loses `monster`, `monsterIndex`, and `heroTurn`. The QC
  script `scripts/apk3d-shot.ts` has no player for this game today, so no script reads them.
- Changed contract 3: the evidence shape does not change. T7 guards it. The monorepo reads this
  shape after the Phase 2 sync.
- No sync to the monorepo in Phase 1.

## 8. Fixtures, mocks, and live-behavior proof

- Fixtures: the eight demo stories in `tests/fixtures/stories/`. `pip-is-brave` has 6 or more words.
  Use it for the six-shade rows. `the-school-garden` is the short story for the "only the captor
  stands" row.
- No mock of the core. The tests drive `createTwinSoul` and the real bot.
- The driver test uses a recording `Presentation` and `now: () => 0`. This is the only fake.
- Live behavior in Phase 1 is the core run in Node. The driver test is a live run of the event
  player without a renderer. It is not proof of a view. Phase 2 owns the browser proof.
- Artifact checks versus behavior checks: T15 and the event order note are artifact checks. They
  do not prove behavior. T1 to T14 are behavior tests.

## 9. Open questions (defaults apply, the PM asks Daniel)

- Q1 (T4): after a wrong strike, a standing shade from a seeded order dives, courage falls by 1,
  and the shade returns to its place. The captor can dive. Options: (a) default; (b) only decoys
  dive; (c) the faded shade dives.
- Q2 (T6, T10): no view marks the captor before a right strike. The captor shares its kind with
  other shades. Options: (a) default; (b) the captor has a visible mark.
- Q3 (T5): each shade gets its kind from a balanced seeded order. Options: (a) default; (b) one
  kind per wave; (c) a kind per word.

## 10. Reviews and applicability (Phase 1)

| Review | Applies | Focus |
| --- | --- | --- |
| Review A (correctness) | yes | Rows T1 to T15 against FR-1 to FR-10; the event order note; the core purity; the Red log truth (A5). |
| Review B (security) | no | No input parse change, no network, no storage, no credential. Content input stays `PracticeInput` or `VocabularyInput`. |
| Review C (UX and API) | yes, short | The event names and payloads that Phase 2 views read; no captor field in the `ask` payload; no timer. |
| Adversarial testing | yes | Apply mutations M1 to M45 one at a time after Green. Each one must turn one row red. Record each survivor as a finding. |
| UX browser review | no | Phase 1 has no browser surface. Phase 2 owns it. |

Phase risk: P1 is `medium`. The change stays local, no sync goes out, and the evidence shape stays.

## Anti-pattern coverage (Phase 1)

| Class | Defense |
| --- | --- |
| A3 | Red and Green record failed, passed, and error counts as labeled integers. Type errors: `Total errors:` and `Owned errors:`. |
| A4 | The driver coverage test asserts a non-empty covered set first. The "pass at Red" rows name their mutations. A suite load failure does not count as Red. |
| A5 | plan.md quotes the exit code of the cited command. Do not write "all pass" without exit 0. |
| A6 | No status text says "rebuilt" or "fixed" before Phase 2 ends. Phase 1 closes the core only. |
| A7 | T15 searches every core file with no exclusion filter. |
| A1, A2, A8, A9, A10 | Not applicable to a game core. A10 applies at closeout: run `./measure/generate.sh` only in the session that owns `measure/generated/*`. |

## 11. Phase 2 outline (blocked until the look)

- Risk: `high`. Views, manifest, packs, shared scripts, and the release touch other games.
- Red rows: no file in `src/games/paladins-twin-soul/` imports `stage3d.ts` or `stage2d.ts`;
  `MODELS_3D` and `FILES_2D` list the picked look; they do not list `dragon-fire`, `mimic`,
  `skeleton`, or `background.monster-encounters`; `ENEMY_CLIPS_2D` loses the monster keys
  (update `manifest.test.ts`). Gate: `VIEW_TEST_COMMAND`.
- `tests/games/shared/battle.test.ts` lists this game in `STAGE_GAMES`. Phase 2 must update that
  list. The file is outside the owned paths, so the orchestrator assigns it first.
- Live proof: the QC run command in 3D and in 2D with 0 page errors and 0 diagnostics. The frame
  command gives one frame in each renderer with a SHA-256. The cross-game frame comparison is a
  human look. Record the three largest differences from the mockup.
- Reviews: A yes; B no (no new input surface); C yes; adversarial yes (the view tests); UX browser
  review yes (phone sizes 390 x 844 and 844 x 390, per lessons-learned).
- Capture a new `phase_base_sha` after the Phase 2 strategy refresh, when the look is known.
