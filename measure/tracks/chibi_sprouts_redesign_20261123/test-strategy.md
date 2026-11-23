# Test strategy: Chibi Sprouts redesign — new adult base on Teacher Kim, Mom first

Track: `chibi_sprouts_redesign_20261123`. Lane: light. Nine phases, T1 to T14.
Role: `measure-strategy`, first strategy of this track. Date: 2026-11-23.
Source: `spec.md` (AC1 to AC7, decisions d to m, the measurement method), `plan.md`,
`spec-review.md` (amendments r1 to r4), `metadata.json`,
`docs/chibi-sprouts/redesign-2026-11-23.md`, `measure/workflow.md`, `measure/gates.json`,
and the existing files listed in section 4.

Every command that starts a render, a full `tsc`, or a vitest run uses this wrapper exactly:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'
```

Exit 75 from the heavy runner means wait and retry. Exit 75 is never a test result.

## 1. Base SHA and the phase_base_sha capture point

Role base recorded at session start: `641d4b3b085129e351df5e63ccbaf2f8ef771cee`.
This is the HEAD of branch `chibi-sprouts-redesign` in worktree
`/home/daniebo/Desktop/forge-worktrees/sprouts-redesign` before this strategy exists. It predates
the committed strategy. It is the `role_base_sha` for authoring only. It must not be used as
`phase_base_sha`. No SHA in this file is a `phase_base_sha`.

The orchestrator must capture the immutable `phase_base_sha` at this exact point: immediately after
the commit with message `measure(chibi_sprouts_redesign): test strategy` lands on branch
`chibi-sprouts-redesign`. The capture command is:

```
git -C /home/daniebo/Desktop/forge-worktrees/sprouts-redesign rev-parse HEAD
```

Run Red, Green, the judge, adversarial checks, and every phase acceptance against that captured
`phase_base_sha`. A remediation commit invalidates review artifacts. It requires a fresh capture
and fresh reviews. The `role_base_sha` above stays immutable as the authoring record.

## 2. Phase map, risk, and review applicability

| Phase          | Tasks    | Test files and proofs                                                                                                                                                                                                       | Risk       | Reason                                                                                                                                                                                                 |
| -------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 Red          | T1, T2   | `tests/sprout-base.test.ts`, `tests/sprout-gestures.test.ts`, `tests/sprout-gesture-offset.test.ts` (edited); `tests/render-options.test.ts` (new)                                                                          | `medium`   | T1 retires three scrapped contracts and must keep the hero assertions. T2 pins the flat pixel contract with a run-time fixture. A wrong skip hides hero coverage; an unsafe fixture overwrites a file. |
| 2 Green        | T3       | `tests/render-options.test.ts`; `src/cli/forge.ts`, `src/render/page.ts`                                                                                                                                                    | `high`     | Two new options change the camera and material path used by every render. A wrong side sign or flat material moves every measured row.                                                                 |
| 3 Red          | T4, T5   | `tests/sprout-mom-kim.test.ts` (new); `tests/mom-kim-sheet.test.ts` (new)                                                                                                                                                   | `medium`   | New pins use a dynamic import and synthetic fixtures. A collection-time error or a vacuous case would pass without proving anything.                                                                   |
| 4 Green        | T6, T7   | `scripts/proportion-check.mjs`, `assets/parts/humanoid-kim.ts`, `assets/sprout-mom-kim.ts`, `tests/fixtures/preset-pin.json`, `tests/sprout-mom-kim.test.ts`, `tests/preset-colour.test.ts`, `tests/render-options.test.ts` | `critical` | The measurement script and the new base are the whole acceptance. A wrong load order, projection, or hand normal makes Red and Green meaningless.                                                      |
| 5 Green        | T8       | `scripts/mom-kim-sheet.mjs`, `tests/mom-kim-sheet.test.ts`, full suite                                                                                                                                                      | `high`     | The sheet script is the first full-suite gate. A wrong lit-row source or Kim scan hides drift.                                                                                                         |
| 6 LATO.2 trial | T9       | `out/chibi-sprouts/redesign/lato2-gpu/trial-log.tsv`, `measure/runs/chibi_sprouts_redesign_20261123/lato2-gpu/trial-result.md`                                                                                              | `medium`   | Paid cloud spend under a USD 5 cap. The risk is teardown and data handling, not product code.                                                                                                          |
| 7 Look         | T10      | `measure/runs/chibi_sprouts_redesign_20261123/judge.json`                                                                                                                                                                   | `medium`   | One subjective gate. A wrong panel sends Kim art to a third party, which is a stop event.                                                                                                              |
| 8 PM stop      | T11, T12 | `plan.md`                                                                                                                                                                                                                   | `low`      | Read, hand off, and record. No new behavior.                                                                                                                                                           |
| 9 deferred:pm  | T13, T14 | cut-out step and `out/sprout-mom-kim/sprites/` (both not started)                                                                                                                                                           | `low`      | Deferred. The tasks start only by amendment after T12 approval. The amendment sets their gates and their later risk.                                                                                   |

Review applicability, stated for every gate:

| Review gate            | Applies                  | Reason                                                                                                                                                                                                  |
| ---------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Security review        | Phase 6 and Phase 7 only | Phase 6 spends USD 5 on our own VM and must delete the VM and disk. Phase 7 must confirm the judge panel holds no Kim art (decision k). No other phase has auth, network input, or user data.           |
| UX/API review          | Phase 2 and Phase 9      | Phase 2 adds `--ortho`, `--flat`, and two `ViewsRequest` fields. Phase 9 adds a cut-out and a sprite sample, each with a second look judge. No other phase changes a public API or a UI.                |
| Adversarial testing    | Phase 1, 3, 4, 5, 6, 7   | Attack surfaces: a pre-existing fixture path, a collection-time import, a missing asset before import, doctored rows and merged eyes, three palm mutations, a wrong Kim scan, and a wrong judge family. |
| Browser review         | Not applicable           | Forge render uses headless Chromium under the heavy runner. The lit views and the sheet are read as PNGs with the `read` tool. This track runs no manual browser review.                                |
| Phase acceptance       | Yes, last role           | Runs on the immutable `phase_base_sha` captured after the strategy commit.                                                                                                                              |
| Review A (correctness) | Yes, Phase 1 to 5        | New skip logic, a render contract, a measurement contract, a new base, and a sheet script need an independent audit.                                                                                    |

## 3. Fixed rules that leave Red and Green no decision

### 3.1 Model-family rule

Red is `opencode-go/hy4-flash-free` (muse). Green is a different family. The orchestrator picks Green
with `ra-quota` at dispatch and records the model id in T3 of `plan.md`. The AC4 judge comes from a
family other than Green's and Red's. This is decision (i). No Red or Green role picks a model.

A verification ability (vision or tool use) is not a family difference. A family difference means a
different provider family. No role calls the `openchamber_image` tool. A role uses the `read` tool to
look at an image.

### 3.2 Mid-red gate path rule

`measure_interphase_checks.py` (`non_test_paths`) accepts only `measure/`, `tests/`, and test files.
Every Red task of this plan commits `tests/` paths only. A Red commit never holds an asset, a script,
or a `src/` file. Assets, scripts, and `src/` files land in a Green task. A Red task that needs an
asset writes it at run time under the fixture rule of section 3.3 and removes it in `finally`.

### 3.3 Run-time fixture rule for the renderer pin

`tests/render-options.test.ts` is the only owner of `assets/_flat-render-pin-<pid>.ts`, where `<pid>`
is the process id of the test run. The rules are fixed:

1. Create the path with the exclusive flag `wx`. Never overwrite an existing file.
2. Set the ownership flag `created = true` only after the `wx` create succeeds.
3. A failed `wx` leaves the existing file untouched, sets `created = false`, and fails the test with
   `fixture path exists: <path>`.
4. The `finally` block removes only that one path, and only when `created` is true.
5. The asset is one box 0.40 x 1.00 x 0.20 m, bottom on y = 0, a 0.05 m block at +Z near the top,
   and two colours for the body and the block.
6. The test asserts its own fixture path is absent at the end.
7. A helper call with a pre-created path fails with `fixture path exists: <path>` and leaves that
   file in place.

The `_` prefix keeps the fixture out of `listAssets`. The preset scan skips it because it declares
no variants. A crashed run can leave one fixture file; a later run uses another pid. No role chooses
a different path or a different create flag.

### 3.4 Measurement script load order

`scripts/proportion-check.mjs` never imports the asset statically. The order is fixed:

1. Parse the arguments.
2. Check that `assets/<name>.ts` and `out/<name>/<name>.glb` exist. A missing file exits 1 with
   `asset <name>: not built`, names the missing path, and stops before any import.
3. `await import('../assets/<name>.ts')` and read `variants` from its default export.
4. Check `assets/parts/humanoid-kim.ts`, then `await import()` it for `KIM_CHIN_Y` and `KIM_HANDS`.
5. Read the two flat renders and the two lit renders, then measure.

Why: a static import fails to resolve before the module exists. The Red run must report the named
missing-asset error, not a module-resolution error. T4 expects that name; T6 proves the order.

### 3.5 PM stop before T13 and T14

Phase 9 is `deferred:pm`. T13 (the 900 px song cut-out) and T14 (the 128 px idle sprite sample)
start only by an orchestrator amendment after the PM approves the shape at T12. No earlier task
builds a cut-out or a sprite for the new base (AC6). The amendment adds the walk clip source as its
own Red task and its own Green task, because T7 builds the `idle` clip only. The idle sprite sample
does not need the walk clip. T11 hands the sheet to the PM. T12 records the PM's word. The upload to
Daniel waits for that word (AC5 rule 7). No Red or Green role opens Phase 9.

### 3.6 Task order and earlier failures at each gate

This is the order table of `plan.md`. No done-when runs the full suite before T8.

| Task | Gate command (short form; full commands in section 5 onward)                                                                               | Earlier tests that still fail                                                             |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| T1   | vitest on the three scrapped files; 3 passed, 15 skipped                                                                                   | none                                                                                      |
| T2   | vitest on `tests/render-options.test.ts`; exit 1 on the absent options                                                                     | none                                                                                      |
| T3   | vitest on `tests/render-options.test.ts`; exit 0                                                                                           | none                                                                                      |
| T4   | vitest on `tests/sprout-mom-kim.test.ts`; exit 1 on the absent script                                                                      | none                                                                                      |
| T5   | vitest on `tests/mom-kim-sheet.test.ts`; exit 1 on the absent script                                                                       | none                                                                                      |
| T6   | script exits 1 with the named missing asset; vitest on `tests/sprout-mom-kim.test.ts` with only the end-to-end and real-hand cases failing | the sheet test of T5, the measurement end-to-end case, and the measurement real-hand case |
| T7   | vitest on the measurement, preset-colour, and render-options files; exit 0                                                                 | the sheet test of T5 only                                                                 |
| T8   | vitest on the sheet test, then the full suite; exit 0 on both                                                                              | none                                                                                      |
| T9   | the trial log, the verify row, and the result note                                                                                         | none                                                                                      |
| T10  | `judge.json` with both scores                                                                                                              | none                                                                                      |
| T11  | the handoff, no command                                                                                                                    | none                                                                                      |
| T12  | the plan record                                                                                                                            | none                                                                                      |
| T13  | deferred; starts by amendment                                                                                                              | none                                                                                      |
| T14  | deferred; starts by amendment                                                                                                              | none                                                                                      |

## 4. Test layers and proof expectations

### Fixtures and mocks (unit layer)

- The three scrapped test files are read as text by the AC1 skip guard in
  `tests/sprout-mom-kim.test.ts`. No test imports a scrapped source after T1.
- `tests/render-options.test.ts` writes its own pin asset at run time under section 3.3. No other
  fixture file is written by a Red task.
- `tests/sprout-mom-kim.test.ts` builds five synthetic figures in a temporary folder. The
  mutations are: a crown 15 % higher (fails `heightInHeads`), a sole 10 % lower (fails `legShare`),
  a head 12 % wider at the temples (fails `headToShoulders`), and two eyes merged 0.060 m apart with
  a 0.064 m width (fails `eye components: found 1, expected 2`). The pass figure must pass every row.
- The palm cases use one synthetic left hand built inside the test: palm x 0.150-0.190, y
  0.450-0.520, z 0.030-0.090; thumb x 0.170-0.190, y 0.495-0.505, z 0.090-0.115; fingers x
  0.155-0.185, y 0.430-0.450, z 0.035-0.085. Each box face is split into 16 x 16 quads with outward
  winding. Landmarks: `palmCentre = [0.150, ybar, zbar]`, `thumbTip = [0.190, 0.500, 0.115]`,
  `fingerTip = [0.170, 0.430, 0.060]`. The base passes all seven checks. The three mutations give
  one named failure each: flipped winding gives check 4, a mirrored hand with reversed mirrored
  indices gives check 7, and a 180 degree turn about the finger axis gives check 6.
- `checkRows(rows)`, `palmCheck(side, mesh, landmarks)`, and `measurePixels()` are the exported
  seams. The tests call them directly. No network mock and no fake browser exist.

### Live-behavior proof (outside the unit layer)

- T2 runs a real Forge render of the pin asset and reads the output PNG pixels. A passing text scan
  does not replace this proof.
- T6 runs the real script and checks its exit text and its synthetic figures.
- T7 builds a real GLB, runs two real renders, and reads the eleven measured rows and both real
  hands. The render and the GLB are the proof, not the source text.
- T8 writes the real sheet from the real lit views and runs the full suite.
- T10 is a real look judgment on `mom-panel.png`. Its score is model evidence, not owner acceptance.

### Artifact and documentation checks (structural layer)

`node measure/tools/generate.mjs --check`, `./measure/doctor.sh --structural-only`,
`node_modules/.bin/prettier --check`, grep counts, preset-pin JSON comparison, the trial log rows,
`judge.json` fields, and plan or log lines prove format and record integrity. They never prove
runtime behavior. Source presence, a completed trial, and a numeric score do not establish
acceptance on their own. Keep these checks separate from the two layers above.

## 5. Phase 1: Red (T1, T2)

### T1 — skip the scrapped contract tests, keep the hero assertions

Files (all under `tests/`, committed by Red):
`tests/sprout-base.test.ts`, `tests/sprout-gestures.test.ts`, `tests/sprout-gesture-offset.test.ts`.

Red command (baseline at track start and again after the edit):

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-base.test.ts tests/sprout-gestures.test.ts tests/sprout-gesture-offset.test.ts'
```

Structural commands (not vitest):

```
grep -c 'describe.skip(' tests/sprout-base.test.ts tests/sprout-gestures.test.ts tests/sprout-gesture-offset.test.ts
grep -c 'hero clip contracts' tests/sprout-gesture-offset.test.ts
node_modules/.bin/prettier --check tests/sprout-base.test.ts tests/sprout-gestures.test.ts tests/sprout-gesture-offset.test.ts
```

Expected failing evidence at Red: none of the three files fails. T1 retires a contract; it does not
repair a failure. At the track start (2026-11-23) the baseline is 3 files and 15 passed tests, exit 0. After the Red edit the same command exits 0 with 3 files, 3 passed tests, and 15 skipped tests.
The falsification is the AC1 skip guard case of T4: if T1 is omitted, the 15 scrapped tests still run
and that guard case fails. If the hero describe is dropped, fewer than 3 tests pass and the three
hero names are absent.

The three active tests stay in a new describe `hero clip contracts (not scrapped)`:

1. `keeps the hero clip inventory: the 8 base clips` (from lines 209-210).
2. `keeps the hero default pose digest: size 8, digest 68442177` (from line 220).
3. `keeps the hero cheer wrist-to-head distance: 0.27635 m` (from lines 243-244).

The 15 skipped names, by file:

- `tests/sprout-base.test.ts` (2): `has the bone names, clip names, and equip sockets of the avatar
base`; `keeps the hero head and a shorter body`.
- `tests/sprout-gestures.test.ts` (4): `keeps the child clap plane and hand gap`; `keeps the child
touch points`; `keeps the child chest and hip points`; `moves each adult goal to the same place on
the grown-up body`.
- `tests/sprout-gesture-offset.test.ts` (9): `keeps the full clip inventory: 26 sprout clips plus 8
base clips`; `keeps the full default pose data per character`; `keeps the key hand distances of
point-up, picture-sway, and cheer`; `moves the point-up hand outward by the requested clearance`;
  `moves the picture-sway hands outward by the requested clearance`; `leaves the other 24 sprout
clips identical with the option`; `moves the cheer fists outward by the requested clearance on the
kind path`; `leaves the other 7 base clips identical with the kind option`; `Lily opts in: her
point-up, picture-sway, and cheer clear the bob hair`.

Skip titles end with ` — sprout base scrapped 2026-11-23 (Daniel)`. Each file holds the line
`// sprout base scrapped 2026-11-23 (Daniel)` above its first import. Four skip sites:
`sprout-base.test.ts:8`, `sprout-gestures.test.ts:11`, `sprout-gesture-offset.test.ts:199`, and
`:251`. No other test file changes. `tests/song-timeline.test.ts` stays as it is. No test is
deleted. The grep counts must be 1, 1, and 2, and 1 for the hero describe.

Green gate: T1 has no Green source task. Its gate is the reporter line above, the four grep counts,
and a clean `prettier --check`. The AC1 skip guard of T4 confirms the structure against the three
files. Closeout gate: `plan.md` records the baseline, the three hero names, the 15 skipped names,
the four skip sites, and the command output.

### T2 — pin the renderer options

File (new, committed by Red): `tests/render-options.test.ts`.

Red command:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/render-options.test.ts'
```

Fixture and format commands:

```
git status --porcelain tests/ assets/
node_modules/.bin/prettier --check tests/render-options.test.ts
```

Expected failing evidence: exit 1. Eight of the nine cases fail inside the case on the absent option
or the absent output file. The fail-closed case passes at once, because its guard sits in the test
file. Expected texts include an unknown view `front-level`, an unknown `--ortho` or `--flat` option,
and a missing `out/_flat-render-pin-<pid>/flat/front-level.png`. The run never fails at collection,
with a `SyntaxError`, with `Cannot find module`, or at file-scope import. `git status --porcelain
tests/ assets/` shows the test file alone. The run-time fixture path is absent at the end.
`prettier --check` exits 0.

The nine cases are fixed by behavior:

1. Both flat views exist at 256 x 256.
2. The corner pixel has alpha 0.
3. The box pixel holds the box hex within 1 of 255.
4. The block pixel holds the block hex within 1 of 255.
5. The two crown-to-sole heights differ by 2 px or less.
6. On the side view the block column sits left of `W/2` by `0.02` m times `ppm` or more (decision j).
7. `--views front-level` without `--ortho` still writes the named view, and `--flat` without
   `--fast` fails with `--flat needs --fast and --bg none`.
8. The fixture ownership case: a pre-created path fails with `fixture path exists: <path>` and the
   file stays; the run's own fixture path is absent at the end.
9. The fail-closed case on the run's own fixture path: a planted file gives
   `fixture path exists: <path>`, the planted file stays, and no render result or output folder
   appears.

The flat pixel contract behind cases 2 to 4 is fixed in `spec.md`: each mesh keeps its geometry and
`visible` flag; the material becomes `MeshBasicMaterial({ color, vertexColors, toneMapped: false,
side })`; the ground is hidden; `outputColorSpace` stays `SRGBColorSpace`; a base colour renders
within 1 of 255 and a paint colour within 24 of 255; the mask uses alpha 128 and the colour rule
uses alpha 250; `--flat` needs `--fast` and `--bg none`; the original materials return after the run.

Green gate (at T3): the same Red command exits 0 with 9 cases. Closeout gate: `plan.md` records the
command, the nine case names, the failure text, and the fixture body.

### Phase 1 Green gate and closeout gate

Green gate: T1's reporter line is 3 passed and 15 skipped with the grep counts holding, and T2's
command exits 0 with 9 cases. Closeout gate: `prettier --check` passes on all four test files;
`node measure/tools/generate.mjs --check` and `./measure/doctor.sh --structural-only` exit 0 after
the T2 commit; the mid-red gate shows each Red commit held `tests/` paths only.

## 6. Phase 2: Green (T3)

Files (Green): `src/cli/forge.ts`, `src/render/page.ts`. Record the Green model id in `plan.md`.

Green command (same as the T2 Red command):

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/render-options.test.ts'
```

Type and render commands:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit'
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge render <existing-asset> --fast'
```

`src/render/page.ts` exports `ORTHO_MARGIN = 1.10`, `orthoFrame(bounds, size)` returning
`{ left, right, top, bottom, pixelsPerMetre }`, and `useFlatMaterials(root)` returning the restore
function. `ViewsRequest` gains `readonly ortho?: boolean` and `readonly flat?: boolean`.
`src/cli/forge.ts` adds `NAMED_VIEWS['front-level'] = { azimuth: 0, elevation: 0 }` and
`NAMED_VIEWS['side-level'] = { azimuth: 90, elevation: 0 }`, adds `ortho` and `flat` boolean options,
writes `join(out, 'flat', `${view}.png`)` under `--flat`, and rejects `--flat` without `--fast` and
`--bg none` with the named error.

Green gate: the vitest command exits 0 with 9 cases; `tsc --noEmit` reports no error in the two
changed files while TD-35 to TD-39 stay open; one render of an existing asset still writes `views/`
as before; `prettier --check` exits 0 on the two files. Closeout gate: `plan.md` records the exported
symbols, the option names, the test run, the Green model id and family, and the render that shows no
change to existing output.

## 7. Phase 3: Red (T4, T5)

### T4 — pin the measurement

File (new, committed by Red): `tests/sprout-mom-kim.test.ts`.

Red command:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
```

Expected failing evidence: exit 1. The AC1 skip guard case passes; it reads the three edited files
and requires the active hero describe, the three hero test names, the four skipped titles, and the
three reason comments. Every other case fails inside the case with `asset sprout-mom-kim: not built`
or the absent script `scripts/proportion-check.mjs`. No case fails at collection or file-scope
import. Each case imports the script inside the case with `await import('../scripts/proportion-check.mjs')`
or runs it through `tsx`. `prettier --check` exits 0 on the file.

Cases: the AC1 skip guard; the level and orthographic proof; the pass table; the eleven doctored
rows; the five synthetic figures with the merged-eye numbers; the synthetic palm group (base pass
and three named mutations); the real-hand case on both hands; the hand-edge cases with a named
absent row; and the side sign guard. The real-hand case stays red until T7. The table,
synthetic-figure, synthetic-palm, hand-edge, and side-sign cases turn green at T6.

Green gate (at T7): the same command exits 0. Closeout gate: `plan.md` records the case names, the
synthetic fixture body, and the failure text.

### T5 — pin the sheet layout

File (new, committed by Red): `tests/mom-kim-sheet.test.ts`.

Red command:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/mom-kim-sheet.test.ts'
```

Expected failing evidence: exit 1 inside the cases on the absent script `scripts/mom-kim-sheet.mjs`.
No syntax or import error. `prettier --check` exits 0 on the file. Cases pin the sheet size, the two
rows and the `no side drawing` cell, one baseline and the 700 px body scale, the lit row sources,
the caption strip, and the two-cell `mom-panel.png`.

Green gate (at T8): the same command exits 0. Closeout gate: `plan.md` records the case names and
the failure text.

### Phase 3 Green gate and closeout gate

Green gate at T4 and T5 is both commands exiting 1 for the right reason. Closeout gate: both files
committed with `tests/` paths only, both `prettier --check` runs clean, and the failure text recorded.

## 8. Phase 4: Green (T6, T7)

### T6 — write the measurement script

File (Green): `scripts/proportion-check.mjs`.

Red command (the missing-asset proof; named error before import):

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/tsx scripts/proportion-check.mjs --asset sprout-mom-kim'
```

Expected failing evidence: exit 1 with `asset sprout-mom-kim: not built` and no module-resolution
error. This proves the load order of section 3.4. The script exists at T6; the asset does not.

Green gate:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'
```

Expected: exit 1 with only the end-to-end case and the real-hand case failing on the absent asset.
The table, five synthetic figures, synthetic-palm cases, hand-edge cases, and side-sign guard pass.
`prettier --check` exits 0 on the script. The script writes
`out/chibi-sprouts/redesign/measure.json` only when an asset exists. Earlier tests still failing:
the sheet test of T5, the measurement end-to-end case, and the measurement real-hand case.

Closeout gate: `plan.md` records the missing-asset text, the five synthetic results, and the three
synthetic palm mutation names. T6 creates the script only; the base and the asset arrive at T7.

### T7 — build the new base and Mom

Files (Green): `assets/parts/humanoid-kim.ts` (new), `assets/sprout-mom-kim.ts` (new),
`tests/fixtures/preset-pin.json` (one new key).

Green commands (all through the wrapper):

```
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none --size 1024
./node_modules/.bin/tsx scripts/proportion-check.mjs --asset sprout-mom-kim
node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts tests/preset-colour.test.ts tests/render-options.test.ts
./forge check sprout-mom-kim
node node_modules/typescript/bin/tsc --noEmit
```

The shape loop runs the lit render through the wrapper, then reads
`out/sprout-mom-kim/views/front-level.png` and `side-level.png` with the `read` tool. Write the
three largest differences, then fix the largest first. The pin check runs
`git show <role-baseline>:tests/fixtures/preset-pin.json > /tmp/pin-baseline.json`, then a node check
that the key sets differ by `sprout-mom-kim` alone and every baseline asset, preset, and slot value
is unchanged. Use parsed JSON, not a diff line count.

Green gate: both renders exit 0; the script prints eleven rows, each a pass; the three-file vitest
command exits 0 including the real-hand case on both hands; `forge check` ends with `result ok`;
`tsc --noEmit` reports no error in the changed files and records the TD-35 to TD-39 count; prettier
passes on every new or changed text file. Earlier test still failing: the sheet test of T5 only.
This task does not gate the full suite. No cut-out and no sprite in this task (AC6).

Closeout gate: `plan.md` records the eleven rows, the three largest differences of each look round,
the Green model id, the two render commands, the type-check counts, the palm mutation names, and the
pin key check. The new base imports only `src/index.js` (decision h).

### Phase 4 Green gate and closeout gate

Green gate: the T6 named-error proof and the T7 commands above. Closeout gate: both real hands pass
all seven palm checks, eleven rows pass, the flat and lit views exist, and the preset pin holds one
new key with no changed value.

## 9. Phase 5: Green (T8)

File (Green): `scripts/mom-kim-sheet.mjs`.

Green commands:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/mom-kim-sheet.test.ts'
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts'
```

The script reads the lit views, `measure.json` `rows.lit`, Kim's sheet, and Mom's drawing. It scans
Kim's two figure bands and requires Kim's side rows within 4 px of 102 and 1195. It runs no scan on
a Mom side drawing. It scales each panel to a 700 px crown-to-sole height on one baseline and draws
the caption. It writes `mom-kim-review.png` and `mom-panel.png`.

Green gate: both commands exit 0; both files exist with nonzero size; a role that did not write the
script reviews both with the `read` tool; `prettier --check` exits 0 on the new file. This is the
first full-suite gate. Earlier tests still failing: none.

Closeout gate: `plan.md` records the two paths, their sizes, the measured Kim rows, and the
full-suite reporter line with its file, passed, and skipped counts.

## 10. Phase 6: LATO.2 GPU trial (T9)

Files: `out/chibi-sprouts/redesign/lato2-gpu/trial-log.tsv` (not in git) and
`measure/runs/chibi_sprouts_redesign_20261123/lato2-gpu/trial-result.md` (run file, not in git).
This phase runs in an orchestrator build session, not in a Red or Green role.

Red evidence: the log and the result note do not exist before the trial. No vitest command applies.
A missing verify row blocks the task. Any render of a mesh beside Kim goes through the heavy runner.

Green gate: the log holds the header `step\tstart\tend\tminutes\testimate_usd\tnote` and one row per
step; the verify row shows the VM and disk absent; the total estimate stays at or under USD 5; the
result note holds the mesh result, the front and side render paths, the body rows of the pass table,
and the note that the face rows are not measurable. The delete and the verify run in the same
session as the create, even on failure. A failed Spot create stops the task, cleans up, and reports;
there is no fallback compute. VM time has a hard cap of 3 hours.

Closeout gate: `plan.md` records the command list, the zone, the instance name, the total minutes,
the total estimate, and the verify output. The trial feeds the PM decision at T12 and changes no
row of the SDF pass table. No image tool runs in this phase.

## 11. Phase 7: Look judge (T10)

File: `measure/runs/chibi_sprouts_redesign_20261123/judge.json` (new, run file, not in git).

Red evidence: `judge.json` does not exist before the judge runs. No vitest command applies.

Green gate: `judge.json` holds the AC4 rule 5 fields — the model id, the model family, the Green and
Red model families, the panel path and its SHA-256, the two scores, one comment per score, and a
verdict. Both scores are 7.5 or more. The judge family differs from Green's and Red's. The panel is
`out/chibi-sprouts/redesign/mom-panel.png` and holds no Kim image. A lower score records the comment
as the work list and returns the track to T7. A second judge family is not a remedy for a failed
score. A PM demand for a local-only judge stops the task (AC4 rule 7).

Closeout gate: `plan.md` records the panel SHA-256, the judge model id and family, both scores, and
the verdict. Security review applies to this gate: confirm the panel holds no Kim art.

## 12. Phase 8: PM stop (T11, T12)

T11: hand the sheet to the PM. No file changes and no command runs. The handoff names the sheet
path, its SHA-256, the eleven measured rows, the judge record, the two AC3 palm results, the
`mom-panel.png` path, the LATO.2 result note, and the fact that no cut-out and no sprite exist. Green
gate: the PM holds the handoff. The upload to Daniel waits for the PM's word (AC5 rule 7).

T12: record the handoff and the PM answer in `plan.md`. Green gate: the plan holds the handoff date,
the PM's word, and the next task. A PM answer that asks for a shape change returns the track to T7.
An approval opens Phase 9 by amendment (AC6 rule 3). The LATO.2 result informs the answer.

Closeout gate: the plan lines exist and hold the recorded words. No other file changes in this phase.

## 13. Phase 9: deferred:pm (T13, T14)

These tasks are not started. No Red command runs now. No output exists before the PM approves the
shape at T12 and an amendment lands. The amendment fixes the gates.

T13: one 900 px or taller song cut-out of Mom on the new base. Intended gate after amendment: the
cut-out is transparent at 900 px or taller, a second look judge rates it 7.5 or more, and `plan.md`
records the command, the file size, and the score. Any cut-out render goes through the wrapper and
takes a build slot.

T14: one 128 px idle sprite sample of Mom on the new base. Intended gate after amendment:
`./forge sprites sprout-mom-kim --clip idle` through the wrapper, the 128 px idle sprites exist, the
face reads in `sprites/preview.png`, and a second look judge rates them 7.5 or more. `plan.md`
records the command, the preview path, and the score.

The amendment also adds the walk clip source as its own Red task and its own Green task. The idle
sprite sample does not need the walk clip. No role opens this phase without the amendment.

## 14. Architecture guardrails and changed-contract risks

- `src/cli/forge.ts` and `src/render/page.ts` are shared with other tracks. T3 changes only the two
  named views, the `ortho` and `flat` flags, the camera choice, and the `flat/` folder. No other
  view, command, or existing output path changes.
- The new base `assets/parts/humanoid-kim.ts` imports only `src/index.js` (decision h). It must not
  import `humanoid-kind.ts`. The scrapped base holds the hero torso and the palm-forward hand code.
- No scrapped source changes: `assets/sprout-*.ts`, `assets/parts/sprout-gestures.ts`, and the ADULT
  and AGE5 sets of `assets/parts/humanoid-kind.ts` stay byte for byte. No file is deleted. No shipped
  asset, game, song page, monorepo file, or delivery folder changes.
- The frame of decision (f) is fixed: `H = max(size.x, size.y, size.z) * 1.10`, a square frame, and
  `ppm = imageSize / H`. A camera or frame change moves every row. The side sign of decision (j) is
  `u = (cz - z) * ppm + W/2`. T2 case 6 and the T4 side-sign guard pin it.
- The flat pixel contract is fixed in `spec.md`. A change to the material swap, the `--flat` flag
  requirement, the alpha rules, or the material restore breaks the colour rules and the measurement.
- `tests/preset-colour.test.ts`, `tests/song-timeline.test.ts`, and the two Storytime spec tests are
  never skipped. The preset pin changes by one new key and no changed value, compared as parsed JSON.
- The renderer pin owns one path at run time under section 3.3. No other task writes or removes that
  path. A collision leaves the existing file untouched and fails the test.
- The measurement load order of section 3.4 is a contract. A static import breaks the named
  missing-asset error and turns Red evidence into a module-resolution error.
- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. `PROJECT_TESTS` excludes
  `tests/storytime-book-pictures.test.ts` while TD-40 is open. A TD failure stays named as debt.

Changed-contract risk: edit any named symbol (`ORTHO_MARGIN`, `orthoFrame`, `useFlatMaterials`,
`ViewsRequest.ortho`, `ViewsRequest.flat`, `NAMED_VIEWS`, `KIM_CHIN_Y`, `KIM_HANDS`, `checkRows`,
`palmCheck`, `measurePixels`), any pass-table value or tolerance, any derived target, any pixel
threshold, any palm mutation arithmetic, any Kim reference row, or any preset-pin value, and every
affected gate must be re-run against a fresh `phase_base_sha`.

## 15. Intentionally-red aggregate suite

The full suite is intentionally red while TD-40 is open. `tests/storytime-book-pictures.test.ts` is
excluded only in the `PROJECT_TESTS` command of section 9. At Red (T2 to T7) the new or widened
files fail by design. Gate only on the targeted commands of sections 5 to 9. Report an aggregate
failure as baseline debt, never as a Green pass. Do not edit unrelated tests to make the aggregate
suite green.

The sheet test of T5 stays red from T5 to T7. The measurement end-to-end case and the real-hand case
stay red from T4 to T6. From T8 the sheet test passes, and the full suite with `--exclude` must exit 0. That is the first and only full-suite gate of this track.

## 16. Anti-pattern coverage and falsification

There is no `measure/anti-patterns.md` at this repository HEAD. The catalog used here is the
canonical A1 to A11 file at `/home/daniebo/Desktop/measure/measure/anti-patterns.md`, where A1 and A8
are retired. The orchestrator copy at `/home/daniebo/Desktop/advantage-pr/measure/anti-patterns.md`
holds A1 to A10. Every case below carries a falsification condition. A case without one is not a
test in this strategy. A2 (consent-blind publish gate) does not apply: this track publishes no case
study. The Kim-art rule is enforced by decision (k), AC4 rule 7, and the Phase 7 security review.

### Phase 1 defenses

| ID                   | Defense                                                                                                  | Falsification                                                                                     |
| -------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| A3 digit-only count  | Parse the reporter as labeled integers: 3 files, 3 passed, 15 skipped; grep counts 1, 1, 2, and 1.       | A count taken from a date, a line number, or a loose digit match fails the equality.              |
| A4 vacuous pass      | Require exit 0 with 3 files, 3 passed, and 15 skipped, plus the hero describe present.                   | A run with zero tests, a missing hero describe, or fewer than three passing tests fails the gate. |
| A5 false claim       | Record the actual baseline (15 passed) and post-skip reporter line before `plan.md` claims either.       | A recorded count with no run, or a count that disagrees with the log, fails closeout.             |
| A7 over-broad filter | Skip by exact describe title and exact reason string. No bare-word filter or broad regex removes a test. | A filter that drops a hero test or skips a non-scrapped file fails the skip guard of T4.          |
| A9 archived path     | Cite only live paths under `measure/tracks/chibi_sprouts_redesign_20261123/` and `tests/`.               | A cited path under `measure/archive/` fails closeout.                                             |
| A10 facts drift      | Run `generate.mjs --check` and `doctor.sh --structural-only` after the T2 commit.                        | Stale committed facts fail the generated-facts check.                                             |
| A11 doc drift        | Verify the three test paths, the four skip sites, and all 18 test names against the files before Red.    | A missing file, a wrong line, or a renamed hero test fails the case.                              |

### Phase 2 defenses

| ID                   | Defense                                                                                                                            | Falsification                                                                    |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| A3 digit-only count  | Parse the case count as the labeled integer 9.                                                                                     | A run with eight or ten cases, or a count read from any other digit, fails.      |
| A4 vacuous pass      | Require all nine cases to pass, including the fail-closed and the ownership case.                                                  | A run that executes no case, or a skipped ownership case, passes no green gate.  |
| A5 false claim       | Run the vitest command and `tsc --noEmit` before `plan.md` records a pass.                                                         | A green claim with a red command fails closeout.                                 |
| A7 over-broad filter | The `finally` block removes only the exact created path under `created`. A collision fails and leaves the existing file untouched. | A broad removal, a removed ownership guard, or an overwritten file fails case 8. |
| A10 facts drift      | Run `generate.mjs --check` and `doctor.sh --structural-only` after the T3 commit.                                                  | Stale committed facts fail the doctor.                                           |
| A11 doc drift        | Verify the exported symbols and option names in the plan against the source.                                                       | A renamed export, a missing flag, or a wrong `flat/` path fails the case.        |

### Phase 3 defenses

| ID                   | Defense                                                                                                                                                    | Falsification                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| A3 digit-only count  | Parse reporter file and test counts as labeled integers; name each case in `plan.md`.                                                                      | A count from a date or a loose digit fails.                                                     |
| A4 vacuous pass      | At T4 require exit 1 with the skip guard passing and every other case failing inside the case. At T5 require exit 1 inside each case on the absent script. | A collection-time failure, a file-scope import error, or an empty case list passes no defense.  |
| A5 false claim       | Record each Red reporter line and exit code before the plan claims Red.                                                                                    | A claim of Red with no run, or a run that exits 0, fails closeout.                              |
| A7 over-broad filter | Match exact failure strings such as `eye components: found 1, expected 2` and the seven palm names. No loose substring replaces a named failure.           | A substring match that accepts a different failure, or a filter that hides one, fails the case. |
| A9 archived path     | All new test files live at their live `tests/` paths.                                                                                                      | A cited path under `measure/archive/` fails closeout.                                           |
| A11 doc drift        | Verify the AC1 skip guard reads the three real files and that the five figure mutations match the spec numbers.                                            | A wrong number or a missing named case fails.                                                   |

### Phase 4 defenses

| ID                        | Defense                                                                                                                                              | Falsification                                                                                                  |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A3 digit-only count       | Parse eleven rows, five figures, three palm mutations, and two hands as labeled counts.                                                              | A count read from a date, a tolerance, or a loose digit fails.                                                 |
| A4 vacuous pass           | At T6 require `asset sprout-mom-kim: not built` before any import and only two cases failing at the asset gate. At T7 require both real hands green. | A script that fails on syntax, imports the asset statically, or leaves a synthetic case red passes no defense. |
| A5 false claim            | Run the script and the three-file vitest command before the plan records a pass.                                                                     | A pass claim with a red command fails closeout.                                                                |
| A6 registry overstatement | No track or plan claim of shape-pass until eleven rows pass and both hands pass.                                                                     | A resolved claim while a row or a palm check is red fails acceptance.                                          |
| A7 over-broad filter      | Require the exact missing-asset string and the exact row names. Case 4 of the palm check uses `agreement < 0.90`, not a loose substring.             | A broad string check, or a filter that hides a named row, fails the case.                                      |
| A10 facts drift           | Run `generate.mjs --check` and `doctor.sh --structural-only` after the T7 commit.                                                                    | Stale committed facts fail the doctor.                                                                         |
| A11 doc drift             | Verify the load order of section 3.4, the three exports, the derived targets, and the palm fixture numbers against the source before Green.          | A wrong load order, a missing export, or a changed target fails the case.                                      |

### Phase 5 defenses

| ID                        | Defense                                                                                                                                     | Falsification                                                                       |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| A3 digit-only count       | Parse the full-suite file, passed, and skipped counts as labeled integers from the actual reporter line. Use no earlier pin.                | A count from an older track, a date, or a loose regex fails.                        |
| A4 vacuous pass           | Require the sheet command and the full-suite command to exit 0 with more than zero files and more than zero passed tests.                   | A run that executes no test, or that omits a target file, fails.                    |
| A5 false claim            | Record both reporter lines and exit codes before the plan claims the full suite green.                                                      | A recorded line with no run, or a line that disagrees with the log, fails closeout. |
| A6 registry overstatement | Mark the shape gate green only when the T8 commands and the T7 rows and palms are all green.                                                | A green claim with any red gate blocks acceptance.                                  |
| A9 archived path          | Cite only live paths under `measure/tracks/chibi_sprouts_redesign_20261123/`.                                                               | An archived path in a gate command fails.                                           |
| A10 facts drift           | Run `generate.mjs --check`, regenerate when needed, then `doctor.sh --structural-only`.                                                     | Stale facts fail the doctor.                                                        |
| A11 doc drift             | Verify both sheet paths, the two row sources, the 700 px scale, the 4 px Kim check, and the caption fields against the script and the PNGs. | A missing file, a wrong reference row, or an absent caption field fails the case.   |

### Phase 6 defenses

| ID                        | Defense                                                                                  | Falsification                                                                          |
| ------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| A3 digit-only count       | Parse each step's `minutes` and `estimate_usd` as labeled numbers; sum the estimates.    | A value read from a date, a zone, or a loose digit fails the sum check.                |
| A4 vacuous pass           | Require one log row per step and a verify row that shows the VM and disk absent.         | A missing verify row, a step with no row, or a present VM fails the gate.              |
| A5 false claim            | Record the actual log rows and the verify output before the plan claims the trial ran.   | A claim with no log, or a log that disagrees with the recorded output, fails closeout. |
| A6 registry overstatement | No trial-success claim while the estimate exceeds USD 5 or the VM or disk remains.       | An over-cap estimate or a surviving resource blocks the claim.                         |
| A11 doc drift             | Verify the log header, the five step names, and the result-note fields against the spec. | A wrong header, a missing step, or an absent face-row note fails.                      |

### Phase 7 defenses

| ID                        | Defense                                                                                                                       | Falsification                                                                              |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| A3 digit-only count       | Parse both scores as labeled numbers and require each at or above 7.5.                                                        | A score read from a model id, a date, or a loose digit fails.                              |
| A4 vacuous pass           | Require both scores, one comment per score, a verdict, and the panel SHA-256.                                                 | A single score, a missing verdict, or an absent SHA fails.                                 |
| A5 false claim            | Record the actual scores and verdict before the plan cites them.                                                              | A recorded score with no `judge.json` fails closeout.                                      |
| A6 registry overstatement | No look-pass claim while either score is under 7.5.                                                                           | A score under 7.5 returns the track to T7.                                                 |
| A11 doc drift             | Verify the panel path, the Green and Red families, the judge family, and the AC4 rule 5 fields. The panel holds no Kim image. | A wrong family, a wrong panel, or Kim art in the panel fails the gate and is a stop event. |

### Phase 8 defenses

| ID                        | Defense                                                                               | Falsification                                      |
| ------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------- |
| A3 digit-only count       | Parse the eleven row count and the two palm results as labeled values in the handoff. | A count from a date or a loose digit fails.        |
| A5 false claim            | Record the PM's word only after T11 hands off the named items.                        | A handoff claim with no T11 record fails closeout. |
| A6 registry overstatement | No approval claim before the PM answer is recorded.                                   | An approval written before T12 fails.              |
| A11 doc drift             | Verify the handoff date, the PM word, and the next task in `plan.md`.                 | A missing field fails the gate.                    |

### Phase 9 defenses (active only after amendment)

| ID                        | Defense                                                                                    | Falsification                                          |
| ------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| A4 vacuous pass           | Require the amendment and the PM approval before any cut-out or sprite command runs.       | An output built before the amendment fails AC6.        |
| A5 false claim            | Record the render command, file size or preview path, and judge score before a plan claim. | A claim with no run or no judge record fails closeout. |
| A6 registry overstatement | No cut-out or sprite acceptance claim before the second judge scores 7.5 or more.          | A score under 7.5 blocks the claim.                    |
| A11 doc drift             | Verify the amendment fields and the named output paths against the files.                  | A missing file or a wrong path fails the gate.         |

## 17. Measure structural checks run by this role

Both checks ran in the worktree before this commit:

- `node measure/tools/generate.mjs --check` -> exit 0, `Measure facts are current (4 files).`
- `./measure/doctor.sh --structural-only` -> exit 0, `Measure doctor found no structural errors.`

Rerun both after the strategy commit and after each task commit. A fail from the untracked
`assets/wizard-argon-trial.ts` in `generated/asset-inventory.json` is an environment artifact of a
parallel build session, not a fact of this track; it did not fire in this run.
