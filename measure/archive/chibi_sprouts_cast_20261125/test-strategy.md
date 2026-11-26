# Test strategy: Chibi Sprouts cast on the Kim base

Track: `chibi_sprouts_cast_20261125`. Lane: light. Four phases, T0 to T19.
Role: `measure-strategy`, first strategy of this track. Date: 2026-11-25.
Source: `spec.md` (AC1 to AC9, decisions a to t), `plan.md`, `spec-review.md`,
`measure/runs/chibi_sprouts_cast_20261125/spec-review-b58aad2.json` (F1 to F13),
`measure/runs/chibi_sprouts_cast_20261125/spec-review-82a2a26.json` (F4, F5, F7 to F10, F14 to F18),
`measure/workflow.md`, `measure/gates.json`, and the files named in section 4.

Every command that starts a render, a full `tsc`, or a vitest run uses this wrapper exactly:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'
```

Exit 75 from the heavy runner means wait and retry. Exit 75 is never a test result.

**No customer-facing claim is made.** No test, panel, or record in this strategy is customer-facing
material.

## 1. Base SHA, the phase base, and the audited HEAD

The review baseline is `b58aad29c8cd5c36cf3b1bf14e73707bb45d6a69`. Amendment round 1 answers F1 to
F13 in `measure(chibi_sprouts_cast): amend spec and plan after spec review r1`. Amendment round 2
answers the second review in `measure(chibi_sprouts_cast): amend spec and plan after spec review r2`.

Two SHAs have two jobs, and they are never the same value:

1. **The phase base.** The orchestrator captures `phase_base_sha` once at the start of each phase,
   immediately after the previous phase's gate commit lands on `master`:
   `git -C /home/daniebo/Desktop/advantage-forge rev-parse HEAD`. It is kept for the phase diff
   (`git diff --stat <phase_base_sha>..HEAD`) and for the gate record.
2. **The audited HEAD.** Each Red, Green, judge, adversarial, and review result records its own
   `audited_head_sha`, taken at the moment it ran: `git rev-parse HEAD`. A result certifies only the
   commit it audited. The orchestrator never binds a verdict to the phase base, because the phase
   base predates the Green work.

A remediation commit invalidates the result that named the earlier HEAD. The next result records the
new HEAD. The phase base does not move, so the phase diff stays whole. No SHA in this file is a
captured value; the orchestrator records both in the plan.

## 2. Phase map, risk, and review applicability

| Phase | Tasks              | Test files and proofs                                                                                                                                                                          | Risk       | Reason                                                                                                                          |
| ----- | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1     | T0, T1, T2, T3, T4 | `tests/proportion-cast-options.test.ts`, `tests/sprout-cast-panel.test.ts` (Red), `tests/cast-isolation.test.ts` (Red, already passing), the Mom pin, the adversarial record | `high`     | Two scripts change. A wrong table rule, crown source, destination rule, or panel scale moves every acceptance number.           |
| 2     | T5 to T10          | Three pins, three judge records, `./forge check`, the preset pin                                                                                                                               | `medium`   | Three assets add paint and geometry over a fixed base. A base change or a wrong panel void the Mom result.                      |
| 3     | T11 to T16         | Two pins, the child base pin, two judge records, `./forge check`, the preset pin                                                                                                               | `critical` | A new base carries the skeleton, the face, and the hands. A wrong absolute landmark or a hidden bone fault fails both children. |
| 4     | T17, T18, T19      | The panel test, the sheet, the handoff, the project gate                                                                                                                                       | `low`      | Read, hash, and record. T19 is a human gate and runs no test.                                                                   |

Review applicability, stated for every gate:

| Review gate            | Applies                             | Reason                                                                                                                                                  |
| ---------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security review        | Not applicable                      | No auth, no network input, no user data, no paid resource. The only hosted call is the approved judge route, and the input hashes cover it.             |
| UX/API review          | Not applicable                      | No UI and no public package API. The two scripts are local tools, and the panel and the judge are internal artifacts.                                   |
| Adversarial testing    | Phase 1 only                        | The finding F10 permits one round, because two scripts change. It must pass before Phase 2. No other phase adds a round or a review.                    |
| Browser review         | Not applicable                      | Forge renders headless Chromium under the heavy runner. Every image is read as a PNG with `read`.                                                       |
| Phase acceptance       | Each phase gate (T4, T10, T16, T18) | Each gate is recorded against its own audited HEAD, with the captured `phase_base_sha` for the diff.                                                     |
| Review A (correctness) | Not run                             | Decision (o) forbids Review A, Review B, and Review C. The orchestrator adds no review gate.                                                            |
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

Every judge record holds `asset_path`, `asset_commit`, `base_path`, `base_commit`, `base_sha256`,
`asset_sha256`, `record_sha256`, `render_sha256`, `panel_path`, `panel_sha256`, `round`, and both
scores (spec "The judge record"). A verdict applies only to that asset revision, base revision,
record, render set, and panel hash. A change to the asset source, the base source, the GLB, a render,
the record, the panel script, a table, or the measurement script voids the verdict for that
character.

At most two judge rounds run per character. Round 2 runs only after a score below 7.5 or after a
changed input voids round 1. A passing asset with unchanged inputs keeps its one verdict. A second
score below 7.5, a third round, or a route that is still absent at the phase gate writes
`measure/runs/chibi_sprouts_cast_20261125/escalation-<name>.json` with the rounds and both comments
and reports to the PM. The PM is the owner of that gate. No third family substitutes.

Every gate that accepts a verdict re-checks all inputs at its own audited HEAD, as spec "The gate
check of the judge inputs" lists. The panel hash alone is not a gate.

### 3.4 The output tree

`out/` is not in git. T0 builds and renders Mom in the worktree `out/` before Phase 1's Red task.
Each Green task builds and renders its own asset before its pin. T17 and T18 re-prepare a missing
cast output, but never rewrite an existing panel: T17 writes the sheet with `--sheet`, and `--all`
runs only when a panel is missing. A fixture stays under `/tmp` or under `--root`. A task writes to
no other worktree's `out/`.

### 3.5 The build and render order

The order is fixed (spec "Build and render sequence"): `./forge build <name> --fast`, then the flat
level render, then the lit level render. No `./forge all`, because it clears `views/`, writes the
default turnaround, and generates sprites. Every render rebuilds the GLB and rewrites `stats.json`,
so the final hashes are taken after the lit render.

A stats comparison uses the stable projection, never the file bytes. Every `milliseconds` key is
removed at any depth, and `texture` keeps `size` only. The raw `stats.json` SHA-256 is recorded for
traceability only. The five artifact hashes are the GLB and the four level renders. Every hash
comparison uses the same build type on both sides.

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
- The existing fixture API does not change. `measurePixels()` keeps exactly its five figures with
  the same names, order, `params`, and results; it gains no sixth item. The two new fixtures are
  figure objects that the test builds and passes to `measureFigure` directly:
  1. `bun-above-crown`: mask top 24 px above the rounded projected crown. It passes, and its head
     height is `chinRow - projectedCrownRow`.
  2. `wrong-crown`: projected crown 20 px above the mask top. It fails with `GUARD top on mask`.
  3. `glasses-frame`: two eyes joined by a frame in the declared glasses colour. With
     `castMeta.faceMarks.glasses` it finds two eye components. Without it, it fails with
     `eye components: found 1, expected 2`. The exclusion drops the exact declared hex and a 1 px
     edge, so the fixture paints the frame with exactly that hex (spec rule 3). A declaration within
     24 of the iris fails with `faceMarks glasses: too close to the eye paint`.
  4. `lily-hair-chin`: one hair row across the chin. It fails with
     `GUARD lily chin: hair crosses the chin at row <r>`.
- `tests/sprout-cast-panel.test.ts` builds a temporary tree under `--root`: two 256 × 256 renders
  with alpha, one 800 × 1600 drawing, one 1600 × 1600 drawing, and one measure record per asset. It
  plants a bun above the crown in one render and checks the 56 px headroom. The 1600 px drawing
  pins the horizontal crop: the window is 440 px wide, its head band fits, and its caption says
  `cropped: yes`. A head wider than the cell fails with `figure wider than its cell: <name>`. It
  pins `--asset`, `--all`, and `--sheet`: `--sheet` writes the sheet path and no panel. It plants a
  linked ancestor, a linked output file, a directory destination, and an outside destination, and it
  hashes the tree before and after.
- `tests/sprout-child-base.test.ts` is a Phase 3 file. It imports `assets/parts/humanoid-kim-child.ts`
  for the fixed landmarks and `BASE_JOINTS`, and reads Tom's built GLB for the joints, the
  fingertip, the clip, and the body inventory. Its fixed-value cases fail at T11 and pass at T12.
  Its built-GLB cases pass at T13.
- No network mock exists. The only hosted call is the judge, and it is out of the test layer.

### Live-behavior proof (outside the unit layer)

- T0 runs the real Mom build and two real level renders. The five artifact hashes and the stable
  stats projection are the proof that the inputs exist and are reproducible in the worktree.
- T2 runs the real script on the prepared Mom inputs and checks the exit text, the eleven rows, the
  two palms, the stable stats projection, and the five unchanged artifact hashes.
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
and the plan records the five artifact SHA-256 sums (the GLB and the four level renders, after the
lit render), the stable stats projection, and the raw `stats.json` hash for traceability only. A
fresh worktree repeats T0 and reaches the same five hashes with the same build type.

### T1 — the Red pins

```
HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts'
HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/cast-isolation.test.ts'
node_modules/.bin/prettier --check tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts tests/cast-isolation.test.ts
```

Expected red: the two new files exit 1, and every failing case fails inside the case on the absent
script, option, asset, or base. No collection error, no `Cannot find module` at file scope. The
isolation test passes at once, because its baseline exists from T0; it is the passing regression
case. `prettier --check` exits 0. `tests/sprout-child-base.test.ts` is not in Phase 1; it is written
at T11.

### T2 — the Green scripts and the aliases

```
HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts'
HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
```

Expected green: both commands exit 0; the Mom rows are unchanged; the Mom stable stats projection and
her five artifact hashes are unchanged with `./forge build sprout-mom-kim --fast` and both level
renders on each side; `prettier --check` and the type check are clean for the changed files.

### T3 and T4 — the adversarial round and the gate

T3 writes `adversarial-p1-<sha>.json` with the audited commit, one finding per fault, a severity, and
a verdict. It attacks at least: the table selection and the row-limit rule, the base name, the record
and panel destinations and links, the crown rounding and the mask tolerance, the face-mark
exclusion, the Lily guards, the panel scale and headroom, the horizontal crop and the head-fit rule,
the sheet-only route, and the linked output.

T4 passes only on `verdict: "pass"` with every blocking finding `closed`, plus the tool test
runs, the Mom pin and the stats and hash record, `./measure/generate.sh`, and
`./measure/doctor.sh --structural-only`. The plan records every disposition and the gate's own
audited HEAD.

## 6. Phase 2: T5 to T10

Each Red file runs the script on the prepared asset and requires the eleven table rows, the row
limits equal to the table, and both palms. Grandma's file adds the bun case on `detail.crownRow` and
`detail.projectedCrownRow`. Grandpa's file adds the two eye components and the declared
`castMeta.faceMarks.glasses`. Each Green task runs the build, both renders, the pin, `./forge check`,
the panel script for one asset, and the preset pin.

T9 runs one judge per character. It computes the asset commit, the base commit and base hash,
`asset_sha256`, `record_sha256`, the four render hashes, and `panel_sha256` before the upload and
records them. Each render hash and the GLB hash must equal its measure record field. A verdict is
`pass` only on both scores 7.5 or more, and only round 2 may follow a failing score or a changed
input. T10 re-verifies every judge input of spec "The gate check of the judge inputs" at its own
audited HEAD.

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

T11 writes the child base pin and the two child pins. The child base pin's fixed-value cases fail on
the absent module. T12 builds the child base with 17 bones and `BASE_JOINTS`, and passes the
fixed-value cases. T13 adds Tom and passes the built-GLB cases: 17 joints, each built joint within
0.002 m of `BASE_JOINTS`, the fingertip against `BASE_HANDS.L.fingerTip`, one `idle` clip, and one
`hands` body. T14 adds Lily, her `hair` slot, and the three Lily guards. T15 judges the two children
with the T9 binding and the shared child base commit. T16 gates the two pins, the two verdicts, every
judge input, the child base import rule, and the pin diff.

Expected red at T11: exit 1 inside each case on the absent module or asset, with no collection
error. Expected green at T13 and T14: the pin, the child base pin, `./forge check`, and the panel all
pass.

## 8. Phase 4: T17 to T19

T17 does not rewrite a panel. It runs `scripts/sprout-cast-panel.mjs --sheet`, which writes
`out/chibi-sprouts/cast/cast-sheet.png` and no panel. A missing panel returns its character to Green
and to a fresh judge, and only then does `--all` run. T17 requires each panel hash to equal its judge
record, the panel size 1416 × 900, the baseline at row 780, the sheet size 1544 × 900, the one
466.667 px per metre scale, one baseline, and the crop state of every cell.

T18 runs the panel test, the real panel and sheet record, the final judge input check,
`PROJECT_TESTS` with the TD-40 exclusion, `PROJECT_LINT`, `PROJECT_CHECKS`, `./measure/generate.sh`,
and `./measure/doctor.sh`.

T19 was `[b]` with `deferred:pm` and an event trigger in the plan. The PM owned it. It records the
handoff date, the PM's word, and the next task. An approval opens the closeout; a change list returns
the named character to Green and to a fresh judge. No role started T19. The PM answered on
2026-11-27 and T19 is `[x]`; the plan holds the record.

## 9. Anti-pattern coverage and falsification

The catalog is the canonical A1 to A11 file at `/home/daniebo/Desktop/measure/measure/anti-patterns.md`.
A2 (consent-blind publish gate) does not apply: this track publishes nothing. Every case below
carries a falsification condition.

| ID                   | Defense                                                                                                                                    | Falsification                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| A3 digit-only count  | Parse labeled counts: 11 rows, 2 eye components, 5 figures, 17 bones, 1 `idle` clip, 1 `hands` body, 5 panels, 1 sheet.                    | A count read from a date, a tolerance, or a loose digit fails the equality.                           |
| A4 vacuous pass      | T4 needs `pass` with every blocking finding closed. T1 needs exit 1 inside the new cases. Each pin needs eleven rows in the named table.    | A gate that records a `fail` verdict, an open blocking finding, or an empty case list passes nothing. |
| A5 false claim       | Run the command before the plan records a result. Record the Mom rows, the stable stats projection, and the five artifact hashes from the run. | A recorded result with no run, or a hash that disagrees with the file, fails closeout.                |
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
- `stats.json` holds elapsed milliseconds. Only its stable projection is compared; the raw hash is
  traceability only.
- The shared child base is a judge input for both children, so a base change voids both verdicts.
- A panel crops each cell horizontally to 440 px. The head band always fits; the arms may crop.
- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. A task records its error count before
  and after.
