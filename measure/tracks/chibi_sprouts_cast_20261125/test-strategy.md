# Test strategy: Chibi Sprouts cast on the Kim base

Track: `chibi_sprouts_cast_20261125`. Lane: light. Four phases, T0 to T19.
Role: `measure-strategy`, first strategy of this track. Date: 2026-11-25.
Source: `spec.md` (AC1 to AC9, decisions a to t), `plan.md`, `spec-review.md`,
`measure/runs/chibi_sprouts_cast_20261125/spec-review-b58aad2.json` (F1 to F13),
`measure/workflow.md`, `measure/gates.json`, and the files named in section 4.

Every command that starts a render, a full `tsc`, or a vitest run uses this wrapper exactly:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'
```

Exit 75 from the heavy runner means wait and retry. Exit 75 is never a test result.

**No customer-facing claim is made.** No test, panel, or record in this strategy is customer-facing
material.

## 1. Base SHA and the immutable phase base

The review baseline is `b58aad29c8cd5c36cf3b1bf14e73707bb45d6a69`. Amendment round 1 answers F1 to
F13 in the commit `measure(chibi_sprouts_cast): amend spec and plan after spec review r1`.

The orchestrator must capture the immutable `phase_base_sha` immediately after that amendment
commit lands on `master`:

```
git -C /home/daniebo/Desktop/advantage-forge rev-parse HEAD
```

Run Red, Green, the judge, the adversarial round, and every phase gate against that captured
`phase_base_sha`. A remediation commit invalidates a review artifact and needs a fresh capture. No
SHA in this file is a `phase_base_sha`.

## 2. Phase map, risk, and review applicability

| Phase | Tasks              | Test files and proofs                                                                                                                                                                          | Risk       | Reason                                                                                                                          |
| ----- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1     | T0, T1, T2, T3, T4 | `tests/proportion-cast-options.test.ts`, `tests/sprout-cast-panel.test.ts`, `tests/sprout-child-base.test.ts` (Red), `tests/cast-isolation.test.ts` (Red), the Mom pin, the adversarial record | `high`     | Two scripts change. A wrong table rule, crown source, destination rule, or panel scale moves every acceptance number.           |
| 2     | T5 to T10          | Three pins, three judge records, `./forge check`, the preset pin                                                                                                                               | `medium`   | Three assets add paint and geometry over a fixed base. A base change or a wrong panel void the Mom result.                      |
| 3     | T11 to T16         | Two pins, the child base pin, two judge records, `./forge check`, the preset pin                                                                                                               | `critical` | A new base carries the skeleton, the face, and the hands. A wrong absolute landmark or a hidden bone fault fails both children. |
| 4     | T17, T18, T19      | The panel test, the sheet, the handoff, the project gate                                                                                                                                       | `low`      | Read, hash, and record. T19 is a human gate and runs no test.                                                                   |

Review applicability, stated for every gate:

| Review gate            | Applies                             | Reason                                                                                                                                                  |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security review        | Not applicable                      | No auth, no network input, no user data, no paid resource. The only hosted call is the approved judge route, and the panel hash check covers its input. |
| UX/API review          | Not applicable                      | No UI and no public package API. The two scripts are local tools, and the panel and the judge are internal artifacts.                                   |
| Adversarial testing    | Phase 1 only                        | The finding F10 permits one round, because two scripts change. It must pass before Phase 2. No other phase adds a round or a review.                    |
| Browser review         | Not applicable                      | Forge renders headless Chromium under the heavy runner. Every image is read as a PNG with `read`.                                                       |
| Phase acceptance       | Each phase gate (T4, T10, T16, T18) | Each gate is recorded against the immutable `phase_base_sha`.                                                                                           |
| Review A (correctness) | Only if the orchestrator adds it    | The spec decision (o) allows Review A in Phase 1 alone. This strategy does not require it.                                                              |
| Final acceptance       | Not applicable                      | The light lane uses the Phase 4 gate as the acceptance record and the closeout exception of spec "The closeout path".                                   |

## 3. Fixed rules that leave Red and Green no decision

### 3.1 Model-family rule

The Red family, the Green family, and the judge family are three different provider families. The
orchestrator picks Red and Green with `ra-quota` and records each model id and family in the plan.
The judge is `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia. A separate role on a
shared family is not independent. A missing route waits; it never substitutes. A vision ability is
not a family difference. No role calls `openchamber_image`; a role reads a file with `read`.

### 3.2 The adversarial gate

T4 passes only when `adversarial-p1-<sha>.json` holds `verdict: "pass"` and every blocking finding
is `closed`. A `fail`, or one open blocking finding, stops the gate. The fix returns to T2 and a new
round runs on the new commit. No Phase 2 task starts before that pass.

### 3.3 Verdict binding and retries

Every judge record holds `asset_commit`, `asset_sha256`, `record_sha256`, `panel_path`,
`panel_sha256`, `round`, and both scores (spec "The judge record"). A verdict applies only to that
asset revision and that panel hash. A change to the asset source, the GLB, a render, the record, the
panel script, a table, or the measurement script voids the verdict for that character.

Two judge rounds run per character. A second score below 7.5, a third round, or a route that is still
absent at the phase gate writes
`measure/runs/chibi_sprouts_cast_20261125/escalation-<name>.json` with the rounds and both comments
and reports to the PM. The PM is the owner of that gate. No third family substitutes.

### 3.4 The output tree

`out/` is not in git. T0 builds and renders Mom in the worktree `out/` before Phase 1's Red task.
Each Green task builds and renders its own asset before its pin. T17 and T18 re-prepare a missing
cast output, but never rewrite an existing panel. A fixture stays under `/tmp` or under `--root`. A
task writes to no other worktree's `out/`.

### 3.5 The build and render order

The order is fixed (spec "Build and render sequence"): `./forge build <name> --fast`, then the flat
level render, then the lit level render. No `./forge all`, because it clears `views/`, writes the
default turnaround, and generates sprites. Every hash comparison uses the same build type on both
sides.

### 3.6 The destination rule

Both scripts resolve the destination and check every existing parent before the first `mkdir` or
write. `lstat` only, so no link is followed. A link, a directory, or a path outside the tree exits 1
with the named line of spec "The destinations". A test hashes the tree before and after and requires
it unchanged.

## 4. Test layers and proof expectations

### Fixtures and mocks (unit layer)

- `tests/fixtures/cast-baseline.json` is written at T0 from the track base commit `b58aad2`: one
  SHA-256 per scrapped source, the imported `ADULT`, `AGE5`, and `HERO` values, and Mom's preset
  entry. `tests/cast-isolation.test.ts` compares the working tree with it.
- `tests/proportion-cast-options.test.ts` builds synthetic figure objects and passes them to the
  exported `measureFigure`, `checkRows`, and `TABLES` seams. It sets `projectedTop`, `projectedSole`,
  and `chinRow` as explicit numbers. It scans no projection from a mask.
- The synthetic figures keep the five redesign figures and add:
  1. `bun-above-crown`: mask top 24 px above the rounded projected crown. It passes, and its head
     height is `chinRow - crownRow`.
  2. `wrong-crown`: projected crown 20 px above the mask top. It fails with `GUARD top on mask`.
  3. `glasses-frame`: two eyes joined by a frame in the declared glasses color. With
     `faceMarks.glasses` it finds two eye components. Without it, it fails with
     `eye components: found 1, expected 2`.
  4. `lily-hair-chin`: one hair row across the chin. It fails with
     `GUARD lily chin: hair crosses the chin at row <r>`.
- `tests/sprout-cast-panel.test.ts` builds a temporary tree under `--root`: two 256 × 256 renders
  with alpha, one 800 × 1600 drawing, and one measure record per asset. It plants a bun above the
  crown in one render and checks the 56 px headroom. It plants a linked ancestor, a linked output
  file, a directory destination, and an outside destination, and it hashes the tree before and
  after.
- `tests/sprout-child-base.test.ts` imports `assets/parts/humanoid-kim-child.ts` for the fixed
  landmarks and reads Tom's built GLB for the bone, clip, and body inventory. Its fixed-value cases
  pass at T12. Its inventory cases pass at T13.
- No network mock exists. The only hosted call is the judge, and it is out of the test layer.

### Live-behavior proof (outside the unit layer)

- T0 runs the real Mom build and two real level renders. The hashes are the proof that the inputs
  exist and are reproducible in the worktree.
- T2 runs the real script on the prepared Mom inputs and checks the exit text, the eleven rows, the
  two palms, and the six unchanged hashes.
- Each Green task builds a real GLB, runs two real renders, reads the eleven rows and both real
  hands, and runs `./forge check`.
- Each judge reads a real panel and its drawing. The score is model evidence, not owner acceptance.

### Artifact and documentation checks (structural layer)

`./measure/generate.sh`, `./measure/doctor.sh --structural-only`, `prettier --check`, the
preset-pin JSON comparison, the judge record fields, the panel sizes, the SHA-256 pairs, and the
handoff lines prove format and record integrity. They never prove runtime behavior on their own.

## 5. Phase 1: T0 to T4

### T0 — prepare the worktree outputs and the baseline

Commands (through the wrapper where a render runs):

```
./forge build sprout-mom-kim --fast
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none --size 1024
```

Proof: the six output paths exist, `tests/fixtures/cast-baseline.json` parses and holds every key,
and the plan records the six SHA-256 sums. A fresh worktree repeats T0 and reaches the same hashes
with the same build type.

### T1 — the Red pins

```
HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts'
HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-child-base.test.ts tests/cast-isolation.test.ts'
node_modules/.bin/prettier --check tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/sprout-child-base.test.ts tests/cast-isolation.test.ts
```

Expected red: exit 1, and every failing case fails inside the case on the absent script, option,
asset, or base. No collection error, no `Cannot find module` at file scope. The isolation test passes
at once, because its baseline exists from T0. `prettier --check` exits 0.

### T2 — the Green scripts and the aliases

```
HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts'
HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
```

Expected green: both commands exit 0; the Mom rows are unchanged; the six Mom hashes are unchanged
with `./forge build sprout-mom-kim --fast` on both sides; `prettier --check` and the type check are
clean for the changed files.

### T3 and T4 — the adversarial round and the gate

T3 writes `adversarial-p1-<sha>.json` with the audited commit, one finding per fault, a severity, and
a verdict. It attacks at least: the table selection and the row-limit rule, the base name, the record
and panel destinations and links, the crown rounding and the mask tolerance, the face-mark
exclusion, the Lily guards, the panel scale and headroom, and the linked output.

T4 passes only on `verdict: "pass"` with every blocking finding `closed`, plus the tool test
runs, the Mom pin and hash record, `./measure/generate.sh`, and
`./measure/doctor.sh --structural-only`. The plan records every disposition.

## 6. Phase 2: T5 to T10

Each Red file runs the script on the prepared asset and requires the eleven table rows, the row
limits equal to the table, and both palms. Grandma's file adds the bun case. Grandpa's file adds the
two eye components and the declared `faceMarks`. Each Green task runs the build, both renders, the
pin, `./forge check`, the panel script for one asset, and the preset pin.

T9 runs one judge per character. It computes `asset_sha256`, `record_sha256`, and `panel_sha256`
before the upload and records them. A verdict is `pass` only on both scores 7.5 or more. T10 requires
each panel hash to equal its judge record.

Commands (per character; through the wrapper):

```
./forge build <name> --fast
./forge render <name> --fast --views front-level,side-level --ortho --flat --bg none --size 1024
./forge render <name> --fast --views front-level,side-level --ortho --bg none --size 1024
node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/<name>.test.ts
./forge check <name>
node scripts/sprout-cast-panel.mjs --asset <name>
```

## 7. Phase 3: T11 to T16

T12 builds the child base and passes the fixed-value cases of `tests/sprout-child-base.test.ts`. T13
adds Tom and passes its inventory cases on the built GLB. T14 adds Lily and passes the three Lily
guards. T15 judges the two children with the T9 binding. T16 gates the two pins, the two verdicts,
the hash pairs, the child base import rule, and the pin diff.

Expected red at T11: exit 1 inside each case on the absent asset. Expected green at T13 and T14: the
pin, the child base pin, `./forge check`, and the panel all pass.

## 8. Phase 4: T17 to T19

T17 does not rewrite a panel. A missing panel returns its character to Green and to a fresh judge.
T17 writes only the cast sheet and the handoff. It requires each panel hash to equal its judge record,
the panel size 1416 × 900, the baseline at row 780, the sheet size 1544 × 900, the one 466.667 px per
metre scale, and one baseline.

T18 runs the panel test, the real panel and sheet record, `PROJECT_TESTS` with the TD-40 exclusion,
`PROJECT_LINT`, `PROJECT_CHECKS`, `./measure/generate.sh`, and `./measure/doctor.sh`.

T19 is `[b]` and human-gated. The PM owns it. It records the handoff date, the PM's word, and the next
task. An approval opens the closeout; a change list returns the named character to Green and to a
fresh judge. No role starts T19.

## 9. Anti-pattern coverage and falsification

The catalog is the canonical A1 to A11 file at `/home/daniebo/Desktop/measure/measure/anti-patterns.md`.
A2 (consent-blind publish gate) does not apply: this track publishes nothing. Every case below
carries a falsification condition.

| ID                   | Defense                                                                                                                                    | Falsification                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| A3 digit-only count  | Parse labeled counts: 11 rows, 2 eye components, 5 figures, 15 bones, 1 `idle` clip, 1 `hands` body, 5 panels, 1 sheet.                    | A count read from a date, a tolerance, or a loose digit fails the equality.                           |
| A4 vacuous pass      | T4 needs `pass` with every blocking finding closed. T1 needs exit 1 inside the cases. Each pin needs eleven rows in the named table.       | A gate that records a `fail` verdict, an open blocking finding, or an empty case list passes nothing. |
| A5 false claim       | Run the command before the plan records a result. Record the Mom rows and the six hashes from the run.                                     | A recorded result with no run, or a hash that disagrees with the file, fails closeout.                |
| A7 over-broad filter | Name exact failures such as `GUARD top on mask`, `eye components: found 1, expected 2`, and the three Lily lines. No loose substring.      | A substring that accepts a different failure, or a filter that hides one, fails the case.             |
| A9 archived path     | Cite only live paths under `measure/tracks/chibi_sprouts_cast_20261125/`, `measure/runs/chibi_sprouts_cast_20261125/`, and the live files. | A cited path under `measure/archive/` fails closeout.                                                 |
| A10 facts drift      | Run `./measure/generate.sh` and `./measure/doctor.sh --structural-only` at T4, T10, T16, and T18.                                          | Stale committed facts fail the check.                                                                 |
| A11 doc drift        | Verify the panel sizes, the sheet scale, the table values, and the destination lines against the source before Red.                        | A wrong number, a renamed line, or a missing file fails the case.                                     |

## 10. Intentionally red aggregate suite

The full suite is intentionally red while TD-40 is open. At T1 the new test files fail by design.
Gate only on the targeted commands of sections 5 to 8. From T18 the project gate is `PROJECT_TESTS`
with the TD-40 exclusion, and it must exit 0. Report an aggregate failure as baseline debt, never as
a Green pass.

## 11. Known limits

- The judge is one opinion. Daniel's look is the last gate.
- The child table is wide, because each drawing has one front view.
- The eye detector needs the two eyes separate from the skin, the brow, the hair, and a declared face
  mark.
- A panel caption holds its date. A later run writes different bytes and needs a fresh judge.
- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. A task records its error count before
  and after.
