# Test strategy: Old-browser built-ins on iOS 15.0+ and WebView 80+

Track: `old_browser_builtins_20261122`. Lane: light. Four phases, T1 to T8.
Source: `spec.md` decisions (a) to (c), AC1 to AC6, and `plan.md`.
Role: `measure-strategy`, first strategy of this track. Date: 2026-11-23.

## 1. Base SHA and the phase capture point

Role base recorded at session start: `aaf678693732984a6adbc78af1157610e8225fd9`.
This SHA equals the spec-review audited HEAD. It predates this committed strategy. It is the
`role_base_sha` for authoring only. It must not be used as `phase_base_sha`.

The orchestrator must capture the immutable `phase_base_sha` with `git rev-parse HEAD` at this exact
point: immediately after the commit whose message is
`measure(old_browser_builtins): test strategy` lands on the branch. No SHA in this file is a
`phase_base_sha`. Run Red, Green, Reviews A, B, adversarial, and phase acceptance against the
captured `phase_base_sha`. A remediation commit invalidates review artifacts. It requires a fresh
capture and fresh reviews.

## 2. Phase map, risk, and review applicability

| Phase     | Tasks      | Test files                                                                                                                                              | Risk     | Reason                                                                                                                                       |
| --------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Red     | T1, T2, T3 | `tests/old-browser/deep-copy.test.ts`, `tests/old-browser/index-math.test.ts`, `tests/apk3d/no-unpolyfilled-builtins.test.ts` (widened, committed here) | `medium` | New behavioral pins and one text scanner. No product source changes. A wrong scanner can hide all 44 hits.                                   |
| 2 Green   | T4, T5, T6 | same three files; `tests/apk3d/imports.test.ts`; 29 game replay tests                                                                                   | `high`   | One copy helper and two index helpers replace 44 calls in 37 existing source files. A silent value or reference error changes game behavior. |
| 3 Browser | T7         | `scripts/old-browser-check.mjs`                                                                                                                         | `medium` | A real dev server and a real browser with four built-ins deleted. Startup and one move are runtime proof.                                    |
| 4 Gates   | T8         | every command of AC6                                                                                                                                    | `low`    | Read, run, and record. No new behavior.                                                                                                      |

Review applicability, stated for every gate:

| Review gate            | Applies            | Reason                                                                                                                                                           |
| ---------------------- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Review A (correctness) | Yes, Phase 1 to 4  | New copy and index semantics, a 19-label scan, and 44 replacements need an independent audit.                                                                    |
| Security review        | Not applicable     | No auth, no network input, no user data, no new dependency, and no page polyfill. The init script deletes four named built-ins in a local dev server.            |
| UX/API review          | Not applicable     | No new public API, no route, no UI change. `deepCopy`, `atIndex`, and `lastIndexWhere` are internal modules covered by Review A and the targeted tests.          |
| Adversarial testing    | Yes, Phase 1 and 3 | Attack surfaces: URL in a string, template interpolation, multi-line call, a shared nested reference, a native-method boundary value, and a false browser start. |
| Browser review         | Yes, Phase 3       | AC5 is the only runtime proof that the four deleted built-ins are absent and one move still runs.                                                                |
| Phase acceptance       | Yes, last role     | Runs on the immutable `phase_base_sha` captured after this commit.                                                                                               |

## 3. Test layers and proof expectations

### Fixtures and mocks (unit layer)

- T1 case 1 builds each game's start snapshot through `tests/games/<game>/helpers.ts`, as
  `tests/games/spellweavers-run/helpers.ts` does with `create(seed, helper, story)`. No view and no
  renderer load. The fixture is real game state, not a hand-written shape.
- T1 case 4 uses one literal fixture value that holds `Map`, `Set`, `Date`, typed array,
  `ArrayBuffer`, an own `undefined` key, `NaN`, `Infinity`, `-Infinity`, and `-0`; plus a function,
  a symbol, a `WeakMap`, a `WeakSet`, and a promise for the `TypeError` rows.
- T2 cases 1 and 2 use the AC2 rule 2 and rule 3 argument tables. The expected value is the native
  method result, computed in the test, never a hardcoded number.
- T3 control rows are fixture strings inside `tests/apk3d/no-unpolyfilled-builtins.test.ts`. No
  file is written under `src/`. The witness `stripCommentsFirst` is a deliberately wrong scanner
  used only by the control test. It is not a mock of production code and never scans `src/`.
- No network mock, no fake browser, and no fake game exist. The browser init script is live
  behavior, not a mock.

### Live-behavior proof (outside the unit layer)

- The AC5 check starts a Vite dev server, deletes four built-ins in the page before any page script
  runs, starts a 2D game, and plays one move. Passing unit tests do not replace this proof.
- The 29 game replay tests at T5 prove that each replaced state copy keeps its game deterministic.
- A passing scanner proves source text only. It does not prove runtime behavior.

### Artifact and documentation checks (structural layer)

`node_modules/.bin/prettier --check`, `node measure/tools/generate.mjs --check`, and
`./measure/doctor.sh --structural-only` prove format and record integrity. Plan and log lines prove
that a command ran. None of these proves runtime behavior. Keep them separate from the two layers
above.

## 4. Phase 1: Red (T1, T2, T3)

Each Red command below is the exact targeted command. The Red role records the reporter output and
the exit code. Exit 75 from the heavy runner means wait and retry, never a test result.

### T1 - deep-copy test

Test file: `tests/old-browser/deep-copy.test.ts` (new). It imports
`../../src/apk3d/sim/copy.js` inside each case, so case 1 runs at HEAD before the helper exists.

Red command:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run tests/old-browser/deep-copy.test.ts --maxWorkers=1'
```

Expected failing evidence: exit 1. Case 1 passes and prints the observed type set of each of the 29
games. Cases 2, 3, and 4 fail inside the case on the absent helper module. No `Failed to load`, no
`SyntaxError`, no `Cannot find module` at collection time, and no import error at file scope.
Format check: `node_modules/.bin/prettier --check tests/old-browser/deep-copy.test.ts` exits 0.

Green gate (at T4): the same command exits 0, all four cases pass, and case 1 still prints the same
type set.

### T2 - index-math test

Test file: `tests/old-browser/index-math.test.ts` (new). It reads the nine call-site files as text
and imports no view module.

Red command:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run tests/old-browser/index-math.test.ts --maxWorkers=1'
```

Expected failing evidence: exit 1. Cases 1 and 2 fail inside the case on the absent helper module.
Case 3 fails and names all nine lines:
`src/games/dragon-flight/view2d/game.ts:565`, `src/games/dragon-rider/view2d/game.ts:591`,
`src/games/spellweavers-run/view/game.ts:216`, `src/games/spellweavers-run/view2d/game.ts:311`,
`src/games/spellweavers-run/view2d/game.ts:429`, `src/storytime/book-pictures.ts:2269`,
`src/storytime/book-pictures.ts:3935`, `src/storytime/book-pictures.ts:4558`, and
`src/host/reader.ts:197`. No collection, syntax, or file-scope import error.
Format check: `node_modules/.bin/prettier --check tests/old-browser/index-math.test.ts` exits 0.

Green gate (at T5): the same command exits 0 and all three cases pass. Case 3 still names the nine
lines, now as passing site checks.

### T3 - the widened scan, two-mode rule of AC3

Test file: `tests/apk3d/no-unpolyfilled-builtins.test.ts` (existing, edited and committed in T3).
`ROOT` resolves from the file URL. The file never moves. No second scan file exists.

Two modes, both required in T3:

| Mode           | Exact command                                                                                                                                                                                                                                                                   | When                                 | Expected                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wide, failing  | `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'SCAN_WIDE=1 node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/no-unpolyfilled-builtins.test.ts' > measure/runs/old_browser_builtins_20261122/red-scan.log 2>&1` | T3 only                              | Exit 1. Exactly 44 hits: 35 `structuredClone`, 8 array `.at(`, 1 `findLastIndex`, 0 `Object.hasOwn`. Each hit is `<path>:<line>: <label>` and the line matches the source. |
| Default, green | `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/no-unpolyfilled-builtins.test.ts' > measure/runs/old_browser_builtins_20261122/red-scan-default.log 2>&1`     | T3 to T4, and every parallel session | Exit 0. One file, zero hits, `SCAN_ROOT` on `src/apk3d/audio/`.                                                                                                            |

The control test runs in both modes because it does not read `SCAN_ROOT`. In both logs the URL row,
the template row, and the argument row show 1 fixed hit and 0 witness hits. The two multi-line rows
show 1 hit for both scanners. The 19-label row shows 0 hits for both. T5 deletes the `wide` line and
the flag and sets `SCAN_ROOT = join(ROOT, 'src')` with no condition. After T5 `SCAN_WIDE=1` is a
no-op and `grep -n SCAN_WIDE tests/apk3d/no-unpolyfilled-builtins.test.ts` returns nothing.

### Phase 1 Green gate and closeout gate

Green gate: the default-mode command above exits 0 with one file and zero hits while the wide-mode
command exits 1 with the 44 labeled hits. The shared suite stays green through T4.

Closeout gate: both logs are written under `measure/runs/old_browser_builtins_20261122/`. Both exit
codes, the 44-hit list grouped by label, and the T3 commit are recorded in `plan.md`.
`node_modules/.bin/prettier --check` passes on the three test files.
`node measure/tools/generate.mjs --check` and `./measure/doctor.sh --structural-only` exit 0 after
the T3 commit. The widened test file is committed in T3, so no session sees an uncommitted failing
scan.

## 5. Phase 2: Green (T4, T5, T6)

### T4 - helpers and barrel

Source: `src/apk3d/sim/copy.ts`, `src/apk3d/sim/index-math.ts`, `src/apk3d/sim/index.ts`. The two new
modules import nothing. `apk3d/sim` may import only `apk3d/contracts`.

Green gate:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run tests/apk3d/imports.test.ts --maxWorkers=1'
```

Expected: exit 0. Also run the T1 command: cases 1, 2, and 4 pass. Run the T2 command: cases 1 and 2
pass and case 3 still fails on the nine old sites. Type check:
`node node_modules/typescript/bin/tsc --noEmit` reports no error in the two new modules; the 38
TD-35 to TD-39 baseline errors stay open.

### T5 - 44 replacements and flag removal

Source: 37 existing source files and the barrel. 35 `structuredClone` calls become `deepCopy` with
one import per file. Eight `.at(` calls become `atIndex`. The `findLastIndex` call at
`src/host/reader.ts:197` becomes `lastIndexWhere`. Call order and expression shape stay the same.

Green gate, no flag in the command:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts'
```

Expected: exit 0. All 29 snapshots pass their own game replay tests. `grep -n SCAN_WIDE
tests/apk3d/no-unpolyfilled-builtins.test.ts` returns nothing.

AC4 gate:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts'
```

Expected: exit 0. Record the reporter file count, passed test count, skipped count, and the commit
tested. No count from an earlier track is evidence here.

### T6 - scan closeout

Green gate, zero hits over `src/` with no flag:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/apk3d/no-unpolyfilled-builtins.test.ts'
```

Expected: exit 0, zero hits, control test passes all six rows. Record the three discriminating rows
by name: URL before a call on one line; call in a template interpolation; argument on the next
lines. Record audio task T6k (`0cc7b5c4`) as the met prerequisite that removed the two `Object.hasOwn`
calls before baseline `a414b406`.

### Phase 2 Green gate and closeout gate

Green gate: all three commands in this section exit 0, and the T2 case 3 failure at T4 is recorded
as expected before T5. Closeout gate: the three-file command and the AC4 command exit 0; prettier,
`generate.mjs --check`, and `doctor.sh --structural-only` pass; the plan records the 37 changed
files, the 44 replacements, the per-label file counts, and the commit that removes the flag. Both
T3 logs stay in `measure/runs/old_browser_builtins_20261122/`.

## 6. Phase 3: Browser check (T7)

Script: `scripts/old-browser-check.mjs` (new). Target game: `spellweavers-run` at
`?qc=1&renderer=phaser`. This game is fixed by AC5 rule 3 because its 2D host holds two `.at(` calls
and its core holds a `structuredClone` call. Any substitute needs a plan amendment by the
orchestrator. No Red or Green role makes that choice.

Red command, before the script exists:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/old-browser-check.mjs --game spellweavers-run'
```

Expected failing evidence: exit 1 on a missing script module. No `check.json` and no screenshots
are written by that failed run.

Green command, the entire lifecycle inside one heavy-run call:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/old-browser-check.mjs --game spellweavers-run'
```

That one call must perform, in order: start the Vite dev server in the pattern of
`scripts/apk3d-shot.ts`; install `context.addInitScript` before the first navigation so it deletes
`structuredClone`, `Array.prototype.at`, `Array.prototype.findLastIndex`, and `Object.hasOwn`;
navigate the page; assert all four values absent in the page; start with
`[data-game="spellweavers-run"]`, `[data-read]`, `[data-next]`, and `[data-start]`; play one move;
record every `pageerror` and console error; write `out/old-browser/check.json` with `game`,
`deleted`, `started`, `moves`, and `errors` plus two screenshots; stop the dev server; exit with
the derived status. The dev server never outlives the call.

Green evidence: exit 0; `check.json` holds `started: true`, `moves` of 1 or more, and `errors: []`;
both screenshots exist with nonzero size. The plan records the game, the four deleted names, the
move, and the two file paths.

Closeout gate: the same Green command exits 0 after every remediation commit. `out/old-browser/`
stays out of git. Audio task T6k (`0cc7b5c4`) stays named as the met prerequisite.

## 7. Phase 4: Gates (T8)

The AC6 three-file command is the targeted Red command that produced the baseline Red evidence. It
is recorded in T1, T2, and T3. At the current revision it is a Green gate.

Red evidence command (historical Red, current Green):

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts --maxWorkers=1'
```

At Red it exits 1 on absent helpers and 44 hits. At Green it exits 0.

Green gate: every AC6 command exits 0.

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts'
```

```
node measure/tools/generate.mjs --check
```

```
./measure/doctor.sh --structural-only
```

```
node_modules/.bin/prettier --check tests/old-browser/deep-copy.test.ts tests/old-browser/index-math.test.ts tests/apk3d/no-unpolyfilled-builtins.test.ts scripts/old-browser-check.mjs src/apk3d/sim/copy.ts src/apk3d/sim/index-math.ts src/apk3d/sim/index.ts src/games/*/core/sim.ts src/games/labyrinth/core/mazes.ts src/games/dragon-flight/view2d/game.ts src/games/dragon-rider/view2d/game.ts src/games/spellweavers-run/view/game.ts src/games/spellweavers-run/view2d/game.ts src/storytime/book-pictures.ts src/host/reader.ts measure/tracks/old_browser_builtins_20261122/test-strategy.md
```

Closeout gate: `plan.md` holds one line per AC6 command with its date, exit code, and reporter
output. The project line names the file count, passed count, skipped count, and the tested commit.
A TD-35 to TD-40 failure stays named as debt and never counts as a pass.

## 8. Architecture guardrails and changed-contract risks

- `tests/apk3d/imports.test.ts` is a gate at T4. `apk3d/sim` may import only `apk3d/contracts`.
  The new modules import nothing. `games/*/core` may import `apk3d/contracts` and `apk3d/sim`.
  Views, storytime, and host imports keep the rule table. A new import of `node:fs`, `three`, or a
  view into a core fails the gate.
- `tests/apk3d/no-unpolyfilled-builtins.test.ts` is the one scan. No second scan file. The file
  stays at its path so its URL-based root resolves the repository `src/`.
- The 19 labels, the six control rows, and the named exclusions stay in the scan file. Every
  exclusion names a file, a line, and a reason and must match a live hit. An exclusion that matches
  nothing fails the rot check.
- Keep the device gate values, the Vite target, the build output shape, and the dependency set
  unchanged. No `core-js` and no page polyfill. Write nothing in the monorepo.
- Changed-contract risks: edit the 19-label list, the control table, the 10 native-method argument
  rows, the allowed state type set, the nine call-site lines, or the 44 hit counts, and every
  affected gate must be re-run. A line shift in a named call site invalidates that site check until
  the plan records the new line.

## 9. Intentionally-red aggregate suite

The full suite `node node_modules/vitest/vitest.mjs run` is intentionally red while TD-40 is open.
`tests/storytime-book-pictures.test.ts` is excluded only in the AC4 command. At Red the three new or
widened files fail by design. Gate only on the targeted commands in sections 4 to 7. Report an
aggregate failure as baseline debt, never as a Green pass. Do not edit unrelated tests to make the
aggregate suite green.

The wide scan mode is intentionally red in T3 only. It is never a shared gate. From T3 to T5 every
parallel session sees the default audio-only scan, which is green. After T5 the unconditional
`src/` scan is green.

## 10. Anti-pattern coverage and falsification

There is no `measure/anti-patterns.md` at this repository HEAD. The catalog used here is the
canonical A1 to A11 file at `/home/daniebo/Desktop/measure/measure/anti-patterns.md`, with A1 and
A8 retired. The orchestrator copy at `/home/daniebo/Desktop/advantage-pr/measure/anti-patterns.md`
holds A1 to A10. Every case below carries a falsification condition. A case without one is not a
test in this strategy.

### Phase 1 defenses

| ID                   | Defense                                                                                                                                                                                            | Falsification                                                                                              |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| A3 digit-only count  | Parse the labeled counts of the wide run: 35, 8, 1, and 0 by label. Require the sum 44.                                                                                                            | A count read from a date, a line number, or any loose digit match fails the per-label equality.            |
| A4 vacuous pass      | Require exit 1 with cases 2 to 4 failing on the absent helper and case 1 passing with printed types. Require the wide run to report 44 hits and the default run to report one file with zero hits. | A zero-file scan, a scan with an empty root, or a Red run that fails only at collection passes no defense. |
| A5 false claim       | Record the actual reporter output and exit code for each Red command before the plan claims Red.                                                                                                   | A claim of green while any cited command exits 1 fails closeout.                                           |
| A7 over-broad filter | Exclude by receiver name and exact path and line: `this.at(`, `z.union(`, and the three `Box3.union` calls in `src/render/page.ts`. An exclusion that matches nothing fails the rot check.         | A bare-word filter or a broad `.union(` rule that hides a real Set hit fails a labeled control row.        |
| A9 archived path     | All logs and the scan file live under `measure/tracks/old_browser_builtins_20261122/` or `measure/runs/old_browser_builtins_20261122/`.                                                            | A cited path under `measure/archive/` fails the closeout check.                                            |
| A10 facts drift      | Run `generate.mjs --check` and `doctor.sh --structural-only` after the T3 commit.                                                                                                                  | Stale committed facts fail the generated-facts check.                                                      |
| A11 doc drift        | Verify every cited source path and every named line before Red: the nine call sites and the three `Box3.union` lines.                                                                              | A named path or line that does not match the source fails the case.                                        |

A2 and A8 do not apply to Phase 1. There is no publish gate and no supervisor marker regex in
scope.

### Phase 2 defenses

| ID                        | Defense                                                                                                                       | Falsification                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| A3 digit-only count       | Require the copied value set and the 29-game count by name. Parse every reporter count as a labeled integer.                  | A pass that copies only some games, or a count taken from any other digit, fails. |
| A4 vacuous pass           | At T4 require T2 case 3 to fail on the nine old sites. At T5 require all nine sites to pass and 35 `deepCopy` calls to exist. | A run that skips the site case, or zero replacements, passes no green gate.       |
| A5 false claim            | Run the three-file command and the AC4 command before the plan records a pass.                                                | A green claim with either command red fails closeout.                             |
| A6 registry overstatement | No `tracks.md` or plan claim of resolved until the scan reports zero hits without a flag.                                     | A resolved claim while a hit remains fails acceptance on the immutable HEAD.      |
| A7 over-broad filter      | Keep the receiver-specific exclusions and the 19-label control row after the flag is removed.                                 | A dropped label or a widened exclusion fails the control row.                     |
| A10 facts drift           | Regenerate and run the doctor after staging the 37 changed files and two new modules.                                         | Stale facts fail the doctor.                                                      |
| A11 doc drift             | Match the plan record to the grep of the 44 replacements and the 37 changed files.                                            | A file list or count that disagrees with the source fails closeout.               |

### Phase 3 defenses

| ID                        | Defense                                                                                                                  | Falsification                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| A3 digit-only count       | Parse `moves` as a labeled integer and require 1 or more. Require boolean `started: true`.                               | `moves: 0`, a string `"true"`, or a count read from any other field fails. |
| A4 vacuous pass           | Require `started: true`, `moves >= 1`, `errors: []`, and two nonzero screenshots in the same run.                        | A run with no move, no screenshot, or a hidden error passes no green gate. |
| A5 false claim            | Write the verified line in `plan.md` only after the Green command exits 0.                                               | A verified claim with a red browser command fails closeout.                |
| A6 registry overstatement | No browser-verified claim while `errors` is non-empty.                                                                   | Any recorded `pageerror` or console error fails the gate.                  |
| A11 doc drift             | Assert each of the four named built-ins absent in the page and present in `check.json.deleted` with the exact AC5 names. | A wrong name, a missing name, or a deletion of only three built-ins fails. |

A10 does not apply to Phase 3. `out/old-browser/` stays out of git and changes no generated fact.

### Phase 4 defenses

| ID                        | Defense                                                                                                                    | Falsification                                                                       |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A3 digit-only count       | Parse file count, passed count, and skipped count as labeled integers from the actual reporter output. Use no earlier pin. | A count from an older track, a date, or a loose regex fails.                        |
| A4 vacuous pass           | Require file count above zero and passed count above zero in every targeted run.                                           | A run that executes no test, or a run missing one of the three target files, fails. |
| A5 false claim            | Record each exit code only after running that exact command.                                                               | A recorded code with no run, or a code that disagrees with the log, fails.          |
| A6 registry overstatement | Mark the track green only when every AC6 command exits 0.                                                                  | A single red gate blocks the green claim.                                           |
| A9 archived path          | Cite only live track paths under `measure/tracks/old_browser_builtins_20261122/`.                                          | An archived path in a gate command fails.                                           |
| A10 facts drift           | Run `generate.mjs --check`, regenerate when needed, then run `doctor.sh --structural-only`.                                | Stale facts fail the doctor.                                                        |
| A11 doc drift             | Run `prettier --check` on every new and changed text file and verify every command named in AC6 exists.                    | A missing file or a removed command fails the closeout check.                       |

A2 and A8 do not apply to Phase 4 for the same reason as Phase 1.
