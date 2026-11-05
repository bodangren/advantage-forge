# Test strategy: Storytime Level 2 unit 1 book pictures

Revision: written at `9667438f` for "Phase 2: Tests and calibrated model pre-checks" (P2).
Amended at `b63755bc` for the line-art twins and the A3 teacher print (Daniel's PM relays of
2026-10-25, about 21:10 and 21:25 ICT). Amended at `f271dce6` for the still engine hook task,
after the section 8 guardrail fired in Green. Amended at `5ffdbf6e` for the Review A remediation
(Phase 2 tasks 5 and 6). Amended at `c2353433` for the Review B security remediation (Phase 2
task 7). Amended from `84c8ffdb` for the second security remediation (Phase 2 task 8).
Amended from `cf5743b7` for the decoded-value remediation (Phase 2 task 9).
Amended from `53cc3ada` for the decoded-layer remediation (Phase 2 task 10).
Amended from `3f604b62` for the token-layer remediation (Phase 2 task 11).
Amended from `bb4e11f0` for the malformed-string remediation (Phase 2 task 12).
Amended at `60892a38` for "Phase 4: Remaining pictures and cover" (P4) under the Muse path
(subsection "Phase 4 under the Muse path (2026-11-02)" in section 7).
Amended for "Phase 3: Week 1 pictures" (P3) after the plan amendments `010dcc16` and `0d620a43`.
The amendment covers picture list v3, picture specification v1, 30 week 1 rows, 60 week 1 files,
the 2026-11-02 date, the machine limits, the shared-asset check, and the classroom map record.
The [specification](./spec.md), [plan](./plan.md), and [contract](./contract.md) own scope and
gates. This file owns test commands, gates, fixtures, and review applicability.

## 1. Inputs and gaps

- Inputs read: `measure/index.md`, `measure/tracks.md`, `spec.md`, `plan.md`, `contract.md`,
  `metadata.json`, `src/song/timeline.ts`, `src/song/main.ts`, `scripts/song-record.ts`,
  `scripts/heavy-lock.ts`, and `advantage-pr/scripts/jobs/heavy-preflight.sh`.
- Gap: `measure/anti-patterns.md` does not exist in this repository. This strategy uses the
  starter catalog `~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`.
  A1 and A8 are retired there. Section 9 lists project candidates for a future local catalog.
- Task 9 rechecked this gap and read the canonical catalog. No local catalog was available.
- Task 9 inspected `jsonObjects`, `parseModelReview`, `decodedReviewFindings`, `reportedModel`, `runPaidCall`, and both provider paths.
  `build-graph` is available, but `graph.db` is absent. Direct source inspection supplied the symbol context without a graph scan.
- Task 10 rechecked the catalog gap. No local catalog was available.
- Task 10 read plan tasks 8 and 9, contract.md security rules, and the three review JSON files at `53cc3ada`.
- Task 10 inspected `jsonObjects`, `decodedAnswerFindings`, `decodedReviewFindings`, `secretFindings`, `envCredentialPatterns`, `precheckMiniMax`, and `precheckKimi`.
  `build-graph` is on PATH. `graph.db` is absent. No graph scan ran.
- Task 10 ran one local node probe. It was not a heavy job. It made no paid call, render, or smoke run.
  A rebuild of 1200 rules across 5426 keys took 6629 ms. One scan of that shape took 271 ms.
- Task 11 rechecked the catalog gap. No local `measure/anti-patterns.md` was available.
  The strategy uses the canonical catalog at `~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`.
- Task 11 read plan task 10, contract.md security rules, the three review JSON files at `3f604b62`,
  the task 10 Green log `jr-green-3f604b62.log`, and the lessons entry on synchronous CPU work.
- Task 11 inspected `jsonObjects`, `decodedAnswerFindings`, `secretFindings`, `redactSecrets`,
  `envCredentialPatterns`, `CREDENTIAL_PATTERNS`, `runPaidCall`, and both provider paths.
  `build-graph` is on PATH. `graph.db` is absent. No graph scan ran.
- Fact: `../Workbooks/content/storytime/l2/` holds `w01.json` to `w08.json`. This track reads
  `w01` to `w07` only. The `w08` file is a real trap for a glob-based loader.
- Fact: `out/` is git-ignored. Pictures, logs, the ledger, and the manifest are not in git. The
  plan must quote the labeled values (counts, SHA-256 values, verdicts) as durable evidence.
- Fact: `tsconfig.json` does not include `scripts/`. The type check covers
  `scripts/storytime-book-pictures.ts` only through the test import. The test must keep that import.
- Fact: the song page exposes only `window.__song` with `ready`, `portrait`, `load`, and `seek`.
  It exposes no scene, camera, or renderer. A line-art pass of the same scene must get them in
  another way, or it needs a song-engine change (section 8). Green confirmed this in `fafa82dc`.
  Phase 2 task 3 adds the hook.

## 2. Untracked draft files

A general subagent wrote three untracked files outside the Red and Green chain. A later revision
stopped at 20:46 on 2026-10-25. Their state is unknown, and they have no Red or Green evidence.

- `tests/storytime-book-pictures.test.ts`: Red owns this path. Red may keep, rewrite, or replace
  any part. The committed Red file is the only test authority. Draft assertions have no standing.
- `src/storytime/book-pictures.ts` and `scripts/storytime-book-pictures.ts`: Green owns these
  paths. Green may reuse or replace them. Red must not edit them.
- The draft source exists in the working tree during Red. Some Red tests can pass against it.
  Section 4 gives the rule for those tests.
- The draft source predates the line-art change. It has no line-art twin. Green must add it.
- The draft source contains a placeholder model name `mmx-vision-default`. A review log must
  record the model that the provider reports, or label the value as declared (A5). Review A found
  this rule broken (RA-N6). Task 5 adds `modelSource` (T68).

## 3. Heavy-job and gate command rules

These rules apply to every role and subagent in this track.

- Heavy jobs: vitest, tsc, Playwright or Chrome, vite, and Forge renders.
- Every heavy command runs as `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
  The script takes the shared lock and runs the pre-flight check inside the lock.
- Never use a plain `flock` for a heavy command. Never wrap `heavy-run.sh` in a plain `flock`.
- In this file, "the pre-flight check and the lock" means one `heavy-run.sh` call.
- A `heavy-preflight` hold line or exit code `75` stops the gate. Record `status: blocked` with
  the hold line. A hold is never a Red result.
- Never delete the lock file. Report a lock wait over ten minutes to the PM in one line.
- Use `node_modules/.bin/vitest` and `node node_modules/typescript/bin/tsc`. Do not use pnpm.
- Vitest runs the changed test files only, with `--maxWorkers=1`.
- This strategy role ran no heavy job.

### RED_TEST_COMMAND

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'
```

### GREEN_TEST_COMMAND

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'
```

From Phase 2 task 3, `ENGINE_HOOK_TEST_COMMAND` replaces both commands for every gate.

Green then runs the type check. Each `heavy-run.sh` call runs its own pre-flight check.

```sh
L=measure/runs/asset_storytime_l2_unit1_pictures_20261025/green-tsc.log
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json' > "$L" 2>&1; echo "tsc exit: $?"
echo "owned tsc errors: $(grep -cE '^(src/storytime/|scripts/storytime-book-pictures\.ts|tests/storytime-book-pictures\.test\.ts)' "$L")"
echo "baseline tsc errors: $(grep -c 'error TS' "$L")"
```

From task 3, the owned-error pattern also matches `src/song/still-hook.ts`,
`src/storytime/line-art-pass.ts`, `tests/song-still-hook.test.ts`, and
`tests/storytime-line-art-pass.test.ts`. The total `error TS` count must stay at 31 or less.

### ENGINE_HOOK_TEST_COMMAND (Phase 2 task 3 Red and Green, then every later gate)

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'
```

### LINEART_SMOKE_COMMAND (Phase 2 task 3, one run only)

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx scripts/storytime-book-pictures.ts lineart-smoke --job <nan-window-job-id>'
```

Green takes `<nan-window-job-id>` from `jobs.json` and quotes it in the plan note. Any later change
in `src/song/` keeps `tests/song-timeline.test.ts` in the vitest command.

Phase 2 task 5 uses the same `LINEART_SMOKE_COMMAND` once more, with `--job w01-readalong-p05`
(smoke run 2, T74). After task 5, `lineart-smoke` takes its stage pair from `captureBookStill`.

Phase 2 task 5 keeps `ENGINE_HOOK_TEST_COMMAND` as its Red and Green gate. Its tests go into the
three existing test files, so the command needs no new file.

Phase 2 task 7 also keeps `ENGINE_HOOK_TEST_COMMAND` as its Red and Green gate. Its tests go into
`tests/storytime-book-pictures.test.ts`. Smoke run 4 (T86) uses `LINEART_SMOKE_COMMAND` once, with
`--job w01-readalong-p05`.

Phase 2 task 8 keeps `ENGINE_HOOK_TEST_COMMAND`. Its tests also go into
`tests/storytime-book-pictures.test.ts`. Smoke run 6 (T92) uses `LINEART_SMOKE_COMMAND` once, with
`--job w01-readalong-p05`. T95 is a documentation gate, not a vitest row.

### ARGUMENT_PROBE_COMMAND (Phase 2 task 7 gate row T87, once)

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh printf '%s\n' '$(printf RB_SUBSTITUTION_EXECUTED)'
```

This call uses the argument form of `heavy-run.sh`. It starts no vitest, tsc, Chrome, or render.

### TASK9_TYPECHECK_COMMAND

```sh
L=measure/runs/asset_storytime_l2_unit1_pictures_20261025/task9-tsc.log
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json' > "$L" 2>&1
code=$?
echo "tsc exit: $code"
echo "owned tsc errors: $(grep -cE '^(src/storytime/|src/song/main\.ts|src/song/still-hook\.ts|scripts/storytime-book-pictures\.ts|tests/storytime-book-pictures\.test\.ts|tests/song-still-hook\.test\.ts|tests/storytime-line-art-pass\.test\.ts|tests/song-timeline\.test\.ts)' "$L")"
echo "total tsc errors: $(grep -c 'error TS' "$L")"
```

Preserve each compiler log before the next gate. Inspect every compiler error, not only the counts.
Require zero owned errors and at most 31 total errors. A nonzero exit without compiler diagnostics is a tool failure.

### TASK10_TYPECHECK_COMMAND

```sh
L=measure/runs/asset_storytime_l2_unit1_pictures_20261025/task10-tsc.log
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json' > "$L" 2>&1
code=$?
echo "tsc exit: $code"
echo "owned tsc errors: $(grep -cE '^(src/storytime/|src/song/main\.ts|src/song/still-hook\.ts|scripts/storytime-book-pictures\.ts|tests/storytime-book-pictures\.test\.ts|tests/song-still-hook\.test\.ts|tests/storytime-line-art-pass\.test\.ts|tests/song-timeline\.test\.ts)' "$L")"
echo "total tsc errors: $(grep -c 'error TS' "$L")"
```

Task 10 uses this renamed copy. It must not overwrite `task9-tsc.log`.
Require zero owned errors and at most 31 total errors. A nonzero exit without compiler diagnostics is a tool failure.

### TASK11_TYPECHECK_COMMAND

```sh
L=measure/runs/asset_storytime_l2_unit1_pictures_20261025/task11-tsc.log
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json' > "$L" 2>&1
code=$?
echo "tsc exit: $code"
echo "owned tsc errors: $(grep -cE '^(src/storytime/|src/song/main\.ts|src/song/still-hook\.ts|scripts/storytime-book-pictures\.ts|tests/storytime-book-pictures\.test\.ts|tests/song-still-hook\.test\.ts|tests/storytime-line-art-pass\.test\.ts|tests/song-timeline\.test\.ts)' "$L")"
echo "total tsc errors: $(grep -c 'error TS' "$L")"
```

Task 11 uses this renamed copy. It must not overwrite `task10-tsc.log`.
Require zero owned errors and at most 31 total errors. A nonzero exit without compiler diagnostics is a tool failure.

## 4. Phase 2 gates

Risk class: **high**. Task 3 changes the shared song engine. Task 4 makes paid calls. Task 5
repairs the production capture path and the release rule for line art. Task 6 makes two paid
calls and changes the ledger. Task 7 closes four high and one medium security finding in the
wrapper, the capture server, the smoke writer, the provider evidence, and the release gate. Task 8
closes three high security findings and the real-path, character-limit, and provenance findings.
Task 1 and task 2 define the release gate, the
output isolation, and the heavy-job order. A defect there allows a false release later.
Task 10 closes a high finding that can persist an encoded credential.

### Task 1: Red

- Command: `RED_TEST_COMMAND`.
- Valid Red: vitest exits non-zero. The output has a labeled `Tests  <n> failed` line with
  `n >= 1`, or a load failure that names a missing export of `src/storytime/book-pictures.ts`.
- Invalid Red: a syntax or transform error in the test file, `No test files found`, a `flock:`
  error, a missing package, or a `heavy-preflight: hold` line. Fix the cause and run again.
- Each required test in section 5 that is new behavior must fail at Red, or the Red log must
  list it as "passes against the untracked draft". For each listed test, the Red log names one
  source mutation that makes it fail. The adversarial step runs those mutations after Green.
- Red adds `vi.mock('node:child_process', ...)` with functions that throw on any call. Red adds
  mocks for `playwright` and `vite` that throw on use. An unplanned real process then fails a test.
- The committed test file contains no `.skip(`, `.todo(`, or `.only(`.
- Red commits only `tests/storytime-book-pictures.test.ts`. The Red log quotes the vitest summary.

### Task 2: Green gate

- `GREEN_TEST_COMMAND` exits 0. The summary has a labeled `Tests  <N> passed (<N>)` line.
  `N` is equal to the test count in the committed Red file. The summary has no failed or skipped tests.
- The type check prints `owned tsc errors: 0`. If `tsc exit` is non-zero, the log must contain
  `error TS` lines from other paths. An empty log with a non-zero exit is a tool failure.
- Record `baseline tsc errors: <n>` in `known_failures`. Green does not fix baseline errors.
- Green makes no paid call and runs no render. The ledger file does not exist after task 2.
- Green adds the line-art pass to the capture code. The pass is a render pass of the same scene,
  with a threshold to 1-bit (contract "Line-art twins"). Unit tests inject the capture, so the
  pass itself gets its first live proof in the task 3 smoke run.
- `git diff --quiet 1d39b8fd -- src/song` exits 0. A song-engine change is outside task 2. If
  Green needs one, Green stops and reports (section 8).
- Green commits only the three owned source and test paths, with explicit paths. A new page
  module for the book still lives under `src/storytime/`. No new HTML file goes in the repo root.

### Task 3: Engine hook gate

Risk class: **high**. This task changes `src/song/main.ts`, which future song videos use. It also
replaces the line-art pass of `fafa82dc`.

Defects in `fafa82dc` that this task corrects (see `src/storytime/book-pictures.ts:2068`):

- The pass sets `scene.overrideMaterial` to a `wireframe: true` material. That draws every
  triangle edge, the hidden edges, the ground, and the backdrop. The result is a mesh net.
- The pass changes `camera.aspect` and the projection matrix and does not restore them.
- The capture reads `cameraState` after the pass, not at the color still.
- The page code calls `import('three')`. Playwright does not transform `page.evaluate` code, so the
  browser cannot resolve a bare module name.
- The pass does not dispose its render target or its material.

Required seams. Red tests these names. Green implements them:

- `src/song/still-hook.ts` (new, pure, no WebGL): `publishBookStill(target, parts)`,
  `clearBookStill(target)`, and `cameraStateOf(camera, lookTarget)`. `main.ts` calls
  `clearBookStill` in `load` and `publishBookStill` at the end of `seek`, after the frame render.
- `src/storytime/line-art-pass.ts` (new, browser side): `renderLineArtPass(three, parts, size)`.
  It returns `{ width, height, data }` with one byte of 0 or 255 per pixel, top row first.
  `three` is the module namespace that owns the scene.
- `src/storytime/book-pictures.ts`: `captureStillPair(driver, input)` owns the capture order with an
  injected page driver. `checkLineArtSmoke(png, fixture)` checks the smoke pictures.
- Green chooses the edge technique inside these seams (contract "Source and technique").

Red:

- Command: `ENGINE_HOOK_TEST_COMMAND`.
- Valid Red: vitest exits non-zero. T42 to T44 and T46 to T51 fail or fail to load. The 41
  earlier tests and `tests/song-timeline.test.ts` pass, or the Red log names each exception.
- Red commits only `tests/song-still-hook.test.ts`, `tests/storytime-line-art-pass.test.ts`, and
  `tests/storytime-book-pictures.test.ts`.

Green gate:

- `ENGINE_HOOK_TEST_COMMAND` exits 0 with a labeled `Tests  <N> passed (<N>)` line. `N` is equal to
  the count in the Red files plus the `tests/song-timeline.test.ts` count. No test is skipped.
- The type check prints `owned tsc errors: 0`, and the total `error TS` count is 31 or less.
- T45 engine diff checks print labeled values:
  - `git diff --name-only 1d39b8fd -- src/song` prints only `src/song/main.ts` and
    `src/song/still-hook.ts`;
  - `removed song lines: <n>` from
    `git diff -U0 1d39b8fd -- src/song/main.ts | grep -cE '^-($|[^-])'` is `0`;
  - `git diff --quiet 1d39b8fd -- src/song/timeline.ts tests/song-timeline.test.ts` exits 0.
- The plan communication log has the PM note for the hook before the Green commit.
- Green commits explicit paths only: `src/song/main.ts`, `src/song/still-hook.ts`,
  `src/storytime/line-art-pass.ts`, `src/storytime/book-pictures.ts`, and
  `scripts/storytime-book-pictures.ts`. Green commits no smoke output.
- Green makes no paid call. Green runs no heavy render except the one smoke run below.

Bounded smoke run (T52). Unit fakes cannot prove pixels, so this is the only way to prove the
pass before the Nan sample.

- It runs once, after the Green unit gate passes, with `LINEART_SMOKE_COMMAND`.
- One Chrome session renders one still of the Nan window stage at its declared time and the
  story size. In the same page, the pass also runs on a fixture scene.
- The fixture scene uses the page's `three` module. It has a smooth sphere of at least 5,000
  triangles at the image center and a box behind it. One box edge passes behind the sphere.
  `smoke.json` records the projected sphere center and radius in pixels.
- Output goes only to `out/storytime/l2/unit1/smoke/lineart-<UTC stamp>/`: `color.png`,
  `lineart.png`, `fixture-lineart.png`, and `smoke.json`.
- It writes no candidate, no version, no render evidence, no manifest entry, and no ledger line.
  `manifest` and `verify` ignore `smoke/`. The calibration rule (T22) does not apply.
- Smoke pictures are never book pictures. They never go to the PM as the sample and never count
  as a style look.
- A second smoke run needs a new orchestrator dispatch. A failed smoke goes back to Green with the
  labeled values. The plan note quotes all T52 labels and the output path.

### Task 4: Calibration gate (live provider proof)

Task 4 is an operation, not a code task. It is the first live proof of the provider path.

- Executor: a Green-role subagent. It owns `src/storytime/`, the script, and
  `out/storytime/l2/unit1/`. The orchestrator stays read-only.
- Four paid calls, one at a time: MiniMax and Kimi for `bad-one-sun`, then for `good-nan`.
- Before each call: check the provider quota. Stop on exhaustion or a provider cap.
- Before each call: write the `before-call` ledger entry. After each call: write the
  `after-call` entry with the same `callId`. A failed call stays in the ledger.
- MiniMax: `node --import tsx scripts/storytime-book-pictures.ts precheck-minimax --calibration
  <id> --paid`. Run it with `--dry-run` first. The dry run makes no call and writes no ledger entry.
- Kimi: see section 6 for the owner and mechanism.
- Calibration covers the color model pre-check only. Line art has no model pre-check gate, so it
  needs no calibration.
- Kimi quota was 94% of the 5-hour window at strategy time. The window resets at 22:46 local on
  2026-10-25. Do not start a Kimi call before the reset.
- MiniMax quota was 94% remaining for the interval and 89% remaining for the week at plan time.
  Check it again.
- Expected verdicts: `bad-one-sun` fails on both providers. `good-nan` passes on both providers.
- Gate evidence, checked read-only by the acceptance role:
  - four calibration logs with `verdict`, `rawOutput` with more than 0 characters, `rubricVersion`
    equal to `PICTURE_RUBRIC_VERSION`, and `fileSha256` equal to `sha256sum` of the source image;
  - `before-call entries: 4` and `after-call entries: 4` in `cost-ledger.jsonl`, with matching
    `callId` values, and each `before-call` time before its log `checkedAt` time;
  - the plan task note quotes the four verdicts and the two counts as labeled values.
- Calibration failure: if either picture gets the wrong verdict, mark task 4 `[b]`. Correct the
  rubric or the call under a new `rubricVersion`. Run all four calls again. Stop after two
  failed rounds and report to the PM.
- A calibration pass calibrates the model pre-check only. It is not acceptance of any picture.

### Task 5: Review A remediation gate

Risk class: **high**. RA-B1 stops every live render. RA-B2 fails 15 of the 16 week 1 line-art
twins after Daniel's look. The other findings weaken the drift check, the calibration gate, the
ledger, and the evidence trail.

Required seams. Red tests these names. Green implements them:

- `captureBookStill(input, deps?)` in `src/storytime/book-pictures.ts`. `deps.open` replaces the
  page opener and returns `{ page, pageErrors, close }`. `deps.lineArt` replaces the page line-art
  pass. Without `deps`, the capture uses the production opener and pass.
- `loadBookTimeline(page, timeline)` in `src/storytime/book-pictures.ts`: one `__song.load` call,
  then `assertPageNotes`. `captureBookStill` and `captureBookStillSmoke` both call it.
- The page driver gets `liveCameraState()`. It reads the live `window.__bookStill.camera` fields
  that the contract names. `cameraState()` still reads the published copy.
- `assertCalibrationReady(outputRoot, workbooksRoot, repoRoot = FORGE_ROOT)`, with the argument
  order of `calibrationTarget`.
- `viewDistance(depth, near, far)` and `isDepthEdge(distanceA, distanceB)` in
  `src/storytime/line-art-pass.ts`. `renderLineArtPass` uses both for its depth edges.
- `LINEART_TECHNIQUE = 'song-page-form-edges-viewdepth-1bit-v2'`.
- `precheck-kimi --record <callId> --failed --reason <text>` in the CLI and in `precheckKimi`.

Red:

- Command: `ENGINE_HOOK_TEST_COMMAND`. Red starts after the Codex quota reset at 05:24 local time.
- Valid Red: vitest exits non-zero. T61 to T73 fail or fail to load. T65 may fail only for the
  new checks. The 76 earlier tests pass, or the Red log names each exception.
- Red amends T49 for the live reads and the T35 and T36 style-look fixtures with
  `lineArtTechnique` and `lineArtFormatVersion`. No other earlier assertion changes.
- Red corrects the T54 comment. The fixture holds the first raw output of call `acd4f807`, not
  the current `calibration/bad-one-sun-minimax.txt`. The fixture bytes do not change.
- Red commits only `tests/storytime-book-pictures.test.ts` and
  `tests/storytime-line-art-pass.test.ts`.

Green gate:

- `ENGINE_HOOK_TEST_COMMAND` exits 0 with a labeled `Tests  <N> passed (<N>)` line. `N` is equal to
  the Red count. No test is skipped.
- The type check prints `owned tsc errors: 0`, and the total `error TS` count is 31 or less.
- `git diff --quiet 5ffdbf6e -- src/song` exits 0. Task 5 changes nothing in `src/song/`.
- `PICTURE_RUBRIC_VERSION` stays `storytime-picture-v2`, and the rubric text stays the same. A
  rubric change needs four new calibration calls, so Green stops and reports instead.
- Green commits explicit paths only: `src/storytime/book-pictures.ts`,
  `src/storytime/line-art-pass.ts`, and `scripts/storytime-book-pictures.ts`.
- Green makes no paid call. Green runs no heavy render except smoke run 2.
- After Green, `assertCalibrationReady` rejects the real root, because the old `good-nan` logs
  have the old text. This is the expected state until task 6.

Smoke run 2 (T74). The decision: it is necessary. Unit fakes cannot prove that the production
path loads the timeline in Chrome, or that the new depth rule draws edges on real buffers.

- It runs once, after the Green unit gate, with `LINEART_SMOKE_COMMAND` and
  `--job w01-readalong-p05`. One `heavy-run.sh` call, one Chrome launch, and one stage still.
- The stage pair comes from `captureBookStill` with its production opener and pass. That is the
  function that `render` uses. `capture path: captureBookStill` proves it.
- The fixture pass can use a second page load in the same Chrome session. The fixture scene keeps
  the T52 sphere and box. It adds two front-facing planes with the same normal, at 4.0 m and
  4.3 m from the camera. The nearer plane covers the left half of the further plane.
  `smoke.json` records the border column and the row range.
- The T52 output, candidate, ledger, and dispatch bounds apply. A third smoke run needs a new
  orchestrator dispatch.

### Task 6: Review A operations gate (live provider proof)

Risk class: **medium**. Two paid calls at about zero marginal cash cost, and one ledger change.

- Executor: a Green-role subagent. The orchestrator dispatches the Kimi reviewer (deviation (a)).
- Order: (1) the failure record for `9d0bddf7-d2ea-4bdb-a672-56c308e3f6d0` with the reason
  `reviewer session ses_e8b730946ffe0qHu3XC1RLopTl hung; no raw answer`; (2) MiniMax `good-nan`;
  (3) Kimi `good-nan`.
- One paid call at a time. The Kimi `--begin` runs only after the MiniMax `after-call` entry.
- Check the provider quota before each call. Stop on exhaustion or a provider cap.
- Run each paid command with `--dry-run` first.
- Gate evidence: the T75 labels in the plan note, and deviation (d) checked against the ledger.
- A `good-nan` verdict other than `pass` marks task 6 `[b]`. Correct the rubric under a new
  `rubricVersion`, then run all four calls again. Report to the PM before the new round.

### Task 7: Review B security remediation gate

Risk class: **high**. Review B failed Phase 2 at `c2353433` with RB-01 to RB-04 (high) and RB-05
(medium). Review A RA2-N1 (medium) joins this task, because it opens the line-art release gate.

Required decisions. The strategy fixes them. Red and Green do not change them:

- RB-01: the wrapper uses the argument form `heavy-run.sh <command> [args...]`. Each CLI argument
  is one array element. The inner marker goes in the `env` option. No `-c` string and no
  `shell: true`. A unit test cannot prove shell quoting without a real process, so the strategy
  does not use single-quote escaping.
- RB-02: `/out/` serves only `out/<name>/<name>.glb`, with `<name>` matching
  `^[a-z0-9]+(-[a-z0-9]+)*$`. `/stage/` serves only the picture files that the loaded timeline
  names in its sets. Every other `/out/` and `/stage/` request gets 404.
- RB-02: before the read, `realpath` of the file must be inside `realpath(<repoRoot>/out)` or
  `realpath(<stageDirectory>)`, and outside `realpath(<repoRoot>/out/storytime)`. The server
  reads the checked real path.
- RB-02: the middleware decodes and normalizes the path before it matches a prefix. It refuses a
  decode error. It also handles `/@fs/` requests whose real path is inside `out/`. It never calls
  `next()` for a refused request.
- RB-02: the vite config sets `server.host: '127.0.0.1'`, `server.fs.strict: true`, and a
  `server.fs.deny` entry for `out/storytime/**`.
- RB-03: the smoke writer resolves `smoke/` and the stamp directory through `resolveOutputPath`. It
  creates the stamp directory without `recursive`, so an existing directory fails. Each file goes
  through `resolveOutputPath` with flag `wx`. All path checks run before the first write.
- RB-04: raw answers and failure reasons are refused on a credential match. No raw file, log, or
  ledger reason holds the matched text. Provider error text is redacted to `[redacted:<pattern>]`
  and cut to 500 characters. The redacted error stays in the `failure` entry.
- RB-04: the MiniMax raw check runs inside the paid `call` callback. A match then gives a
  `failure` after-call entry with a reason that names the pattern only.
- RB-04: `--raw` input must be a regular file, not a symbolic link. It must be at most 65,536
  bytes, valid UTF-8, and free of NUL bytes. A safe answer is kept byte for byte, with no trim and
  no line-end change.
- RB-04: the credential patterns cover at least the T81 fixture set. They also match the exact
  value of each environment variable whose name ends in `KEY`, `TOKEN`, `SECRET`, or `PASSWORD`,
  when the value has 8 or more characters. A finding names the pattern, never the matched text.
- RB-05: `verify --release` calls `assertCalibrationReady(outputRoot, workbooksRoot, repoRoot)`
  before the manifest check. `verify` without `--release` does not check calibration.
- RA2-N1: `styleLookSampleFilesValid` returns `false` when `sampleFiles` is not a non-empty array.

Required seams. Red tests these names. Green implements them:

- `StorytimeWrapperDependencies.spawn` in `scripts/storytime-book-pictures.ts`, with the
  `spawnSync` signature. Without it, the wrapper uses `spawnSync`.
- In `src/storytime/book-pictures.ts`: `bookFileAllowlist({ repoRoot, stageDirectory, timeline })`,
  `resolveBookFile(allowlist, requestPath)` (the real path, or `undefined` for a refusal),
  `serveBookFiles(allowlist)` (a vite plugin named `storytime-book-files` with `stats()` that
  returns `{ served, refused }`), and `bookServerConfig(input)` (the `createServer` config that
  `openBookPage` uses).
- `writeOutputFile(outputRoot, relativeFile, bytes)`: one exclusive write through `resolveOutputPath`.
- `secretFindings(text, env = process.env)` returns pattern names. `redactSecrets(text, env =
  process.env)` returns the redacted text. `readRawAnswer(file)` applies the `--raw` limits.
- `runStorytimeCli` dependencies gain `workbooksRoot`.

Red:

- Command: `ENGINE_HOOK_TEST_COMMAND`. Red model: `openai/gpt-6.1-sol#high`.
- Valid Red: vitest exits non-zero. T77 to T85 fail or fail to load. The 90 earlier tests pass,
  or the Red log names each exception with its cause.
- Authorized fixture amendments, with no assertion change: (1) each CLI `verify --release` test
  (T37 today) gets four valid calibration logs, their source files, and a `workbooksRoot`
  dependency, so that each expected refusal keeps its original cause; (2) the vite mock may
  record its argument before it throws, for T79; T12 still holds.
- Synthetic credentials exist only in the test file. Red uses the section 5 fixture set. Each
  value contains or encodes `SYNTHETIC`. Red writes no real credential and reads no real
  credential file.
- The Red log names one source mutation for each new test that passes against the current source.
- Red commits only `tests/storytime-book-pictures.test.ts`.

Green gate:

- Green model: `volcengine-agent-plan/glm-5.3-flash#high`.
- `ENGINE_HOOK_TEST_COMMAND` exits 0 with a labeled `Tests  <N> passed (<N>)` line. `N` is equal to
  the Red count. No test is skipped.
- The type check prints `owned tsc errors: 0`, and the total `error TS` count is 31 or less.
- `git diff --quiet c2353433 -- src/song` exits 0. `PICTURE_RUBRIC_VERSION` stays
  `storytime-picture-v2`, and the rubric text stays the same.
- The T87 gate row passes, with its labels quoted in the plan note.
- Green commits explicit paths only: `src/storytime/book-pictures.ts` and
  `scripts/storytime-book-pictures.ts`. `src/storytime/line-art-pass.ts` needs no change.
- Green makes no paid call. Green runs no heavy render except smoke run 4. Green deletes no file.
- If T87 finds a credential in a live file, Green stops, marks task 7 `[b]`, and reports the file
  path and the pattern name to the PM. Deletion is a human gate.

Smoke run 4 (T86). The decision: it is necessary. RB-02 changes the only file server of the live
capture. RB-03 changes the smoke writer. The unit tests mock vite and Chrome. A narrow allowlist
can refuse a GLB, and the song page then draws the scene without that asset and throws no error.
The T74 ink and drift labels can stay in range in that case, so smoke run 4 adds server labels.

- It runs once, after the Green unit gate and T87, with `LINEART_SMOKE_COMMAND` and
  `--job w01-readalong-p05`. One `heavy-run.sh` call, one Chrome launch, and one stage still.
- The capture prints each refused request path as `book file refused: <path>`, and then the counts.
- The T52 output, candidate, ledger, and dispatch bounds apply. A fifth smoke run needs a new
  orchestrator dispatch. A failed smoke goes back to Green with the labeled values.

Re-review on the task 7 HEAD:

- Review A, Review B, and Review C run again. Each review reads the earlier review JSON files.
- Review B is applicable: wrapper, server, writer, credential, and release changes.
- Review C is applicable: new refusals in `verify --release`, `precheck-kimi --record`, and the
  wrapper invocation.
- Adversarial testing is required, with the task 7 mutations in the closeout gate.
- Browser review is not applicable. No UI changes. Smoke run 4 is a live render proof.

### Task 8: Second security remediation gate

Risk class: **high**. RB2-01 to RB2-03 can expose credentials. RB2-04 and RA3-01 weaken the file
boundary. RA3-02 rejects valid Unicode reasons. RA3-03 weakens evidence provenance.

Required decisions. The strategy fixes them. Red and Green do not change them:

- RB2-01: `runPaidCall` rethrows a redacted error, not the original provider error. The final CLI
  rejection handler redacts again and limits the message to 500 characters. Both layers preserve
  safe diagnostic text.
- RB2-02: check decoded `reason`, every `issues` string, and every `observedCounts` key. Run the
  check after JSON decoding and before any success entry, review write, raw copy, or log. Apply it
  to MiniMax and Kimi. A refusal writes only the sanitized failure record that the provider path
  already requires. Safe raw bytes stay byte-identical.
- RB2-03: `server.fs.deny` retains `.env`, `.env.*`, `*.{crt,pem}`, and `**/.git/**`. Add
  `<absolute-repoRoot>/out/storytime/**`. Compute the absolute entry from `repoRoot`. The relative
  `out/storytime/**` entry alone does not satisfy this rule. T79 may retain it.
- RB2-04 and RA3-01: `resolveBookFile` returns the checked real path for model and stage files.
  `serveBookFiles` reads that returned path. Stage files also exclude the real Storytime tree.
- RA3-02 and RC3-1: the Kimi failure reason limit counts characters, not UTF-8 bytes. A reason of
  500 non-ASCII characters passes. A reason of 501 non-ASCII characters fails before any write.
- RA3-03: Red shortens the invalid full SHA in `mid-red-245f8c1.log`. Green shortens it in
  `jr-green-ec83581.log`. Keep each corrected full SHA. Review reports stay immutable.

Required seams. Red tests these names. Green implements them:

- `runStorytimeBookPicturesEntry(argv, dependencies)` in `scripts/storytime-book-pictures.ts`.
  Dependencies include `pipeline` and `errorLog`. The production entry calls it with `console.error`.
  It returns the exit code and handles a rejected pipeline through the final sanitizing boundary.
- Existing `runPaidCall`, `precheckMiniMax`, `precheckKimi`, `parseModelReview`, `bookServerConfig`,
  `resolveBookFile`, and `serveBookFiles` remain the behavior seams. No new test file is necessary.

Red:

- Command: `ENGINE_HOOK_TEST_COMMAND`. Red model: `minimax-cn-coding-plan/MiniMax-M3#high`.
- Valid Red: vitest exits non-zero. T88 to T91, T93, and T94 fail or fail to load. The 99 earlier
  tests pass, or the Red log names each exception with its cause.
- Red adds no `.skip(`, `.todo(`, or `.only(`. Tests start no process, browser, server, or provider.
- Synthetic credentials exist only at runtime. Each value contains or encodes `SYNTHETIC`.
- Red writes no real credential and reads no real credential file.
- The Red log names one source mutation for each new test that passes against the current source.
- Red commits only `tests/storytime-book-pictures.test.ts` and its corrected `mid-red-245f8c1.log`.
- Red shortens only the invalid full SHA quotation. Red preserves the finding and the corrected SHA.

Green gate:

- Green model: `volcengine-agent-plan/glm-5.3-flash#high`.
- `ENGINE_HOOK_TEST_COMMAND` exits 0 with a labeled `Tests  <N> passed (<N>)` line. `N` is equal to
  the Red count. No test is skipped.
- The type check prints `owned tsc errors: 0`, and the total `error TS` count is 31 or less.
- `git diff --quiet 84c8ffdb -- src/song` exits 0. `PICTURE_RUBRIC_VERSION` stays
  `storytime-picture-v2`, and the rubric text stays the same.
- Green passes T92 and T95. The plan note quotes their labeled values.
- Green commits explicit paths only: `src/storytime/book-pictures.ts`,
  `scripts/storytime-book-pictures.ts`, and its corrected `jr-green-ec83581.log`.
- Green makes no paid call. Green runs no heavy render except smoke run 6.
- Green changes no earlier test, review report, or unrelated file.

Smoke run 6 (T92). The decision: it is necessary. T79 and T91 inspect configuration through a
mock. They cannot prove Vite default static refusal or middleware ordering. The probe uses the real
Vite middleware stack. It does not rely on a mock or a direct plugin call.

- Run once after the Green unit gate with `LINEART_SMOKE_COMMAND` and `--job w01-readalong-p05`.
- Use one `heavy-run.sh` call, one Chrome launch, one stage still, and one temporary probe server.
- Repeat every T86 label and range. Write the same four smoke files and no book version.
- Build a temporary Vite root with synthetic `.env`, `key.pem`, `.git/config`, and Storytime evidence.
  Include one allowlisted stage picture as the positive control. Use no real credential file.
- Start that server through `createServer(bookServerConfig(...))`. Request each file over HTTP.
- Require refusal of every protected file. Require the stage control bytes. Require no synthetic
  protected bytes in any response. Print the T92 labels from section 5.
- A failed smoke returns to Green with the labeled values. Another run needs a new orchestrator dispatch.

T95 documentation gate:

- Scan `plan.md`, `jr-green-ec83581.log`, `mid-red-245f8c1.log`, and new task 8 role logs.
  Match full 40-character hexadecimal Git IDs, not 64-character file hashes.
- Run `git rev-parse --verify <sha>^{commit}` for each matched ID. Require every ID to resolve.
- Print `operative full SHAs checked: <n>` with `n >= 1`, and `unresolved full SHAs: 0`.
- Immutable review JSON and log files may quote the invalid SHA as finding evidence. They are not
  operative references. This exception does not permit a new invalid operative SHA.

Re-review on the task 8 HEAD:

- Review A, Review B, and Review C run again. Each review reads the earlier review JSON files.
- Review B is applicable: provider errors, decoded evidence, server deny rules, and real-path reads.
- Review C is applicable: final CLI errors, refusal timing, and the Unicode reason limit.
- Adversarial testing is required, with the task 8 mutations in the closeout gate.
- Browser review is not applicable. No UI changes. Smoke run 6 is a render and middleware proof.

### Task 9: Decoded-value remediation gate

Risk class: **high**. RB3-01 persists a decoded model credential. RA4-01 discards malformed count keys before the check.
Three review rounds found separate unchecked fields. A named-field list cannot close this defect class.

Required design:

- Add `decodedAnswerFindings(rawOutput: string): string[]` in `src/storytime/book-pictures.ts` as the shared behavior seam.
- Use one walker for every decoded object that the answer yields, not only the selected review object.
- Walk every object key and string value at every depth. Traverse arrays and unknown fields without a field allowlist.
- Decode embedded JSON objects in strings, including plain or fenced `content`, through the same object extraction rules.
  Scan each resulting object before any schema validation, field selection, early verdict return, or fallback.
- Apply `secretFindings` to each decoded key and string value. Return pattern names only, never matched text.
- Preserve the raw-byte credential check. The decoded check supplements it and changes no safe raw bytes.
- MiniMax calls this seam inside `runPaidCall`'s callback, before it returns and records success.
- Kimi calls this seam before any record write. A refusal leaves the begin ledger and source raw file byte-identical.
- Both paths check before a raw copy, review write, or result log. MiniMax may append its sanitized failure entry.
- Preserve safe reported MiniMax models from both envelopes. Preserve Kimi's declared model and `modelSource` behavior.
- Keep existing parser behavior for safe malformed or unclear answers. Do not turn a safe FAIL response into a credential refusal.
- Retain `decodedReviewFindings` for existing callers, if needed. Production acceptance must not depend on that named-field check.
- Align the decoded-refusal message suffix for RC4-1: `the raw answer is refused; no review or raw copy is written.`
  Name only the matched pattern. The suffix permits the sanitized MiniMax failure entry and claims no broader write exclusion.

Red gate:

- Model: `openai/gpt-6.1-sol#high`. Command: `ENGINE_HOOK_TEST_COMMAND`.
- Add T96 to T103 in `tests/storytime-book-pictures.test.ts`. Keep T1 to T95 unchanged, including fixtures and assertions.
- Require behavioral failures in T96 to T100 for both providers, or a missing shared seam in T102.
  The 105 existing tests must pass. Record each exception with its cause.
- A safe control may pass at Red. Name its adversarial mutation in the Red log.
- Reject package, syntax, transform, timeout, and preflight failures as Red evidence.
- Keep process, Vite, and browser mocks active. Tests start no real provider, process, server, or browser.
- Commit only the assigned test and plan paths. Record the exact command, exit code, and labeled summary.

Green gate:

- Model: `volcengine-agent-plan/glm-5.3-flash#high`.
- Rerun `ENGINE_HOOK_TEST_COMMAND` before implementation. Confirm the recorded Red failures.
- Require exit 0 afterward. Require `Tests  <N> passed (<N>)` with the committed Red test count and no skipped tests.
- Run `TASK9_TYPECHECK_COMMAND`. Require `owned tsc errors: 0` and `total tsc errors` no greater than 31.
- Run `git diff --quiet cf5743b7 -- src/song src/storytime/line-art-pass.ts` and require exit 0.
- Keep the server, capture code, rubric text, `PICTURE_RUBRIC_VERSION`, and earlier tests unchanged.
- Limit implementation to `src/storytime/book-pictures.ts`. Report a need for another source path before changing it.
- Make no paid call. Run no render, Vite server, or browser.

Live proof decision: no new smoke run is necessary for task 9.
The changed path decodes provider text and controls evidence writes. Injected runners exercise that complete path against real temporary files.
Task 9 changes no server, capture code, renderer, or browser path. Smoke run 6 remains the live server and capture evidence.
These tests prove provider-boundary behavior with synthetic inputs. They do not prove a new live provider call or a render.

Task 9 closeout gate:

- Run `ENGINE_HOOK_TEST_COMMAND` and `TASK9_TYPECHECK_COMMAND` again on the final task 9 HEAD.
- Execute each mutation below separately under the focused command. Require its named new test to fail.
- Restore only the mutation's assigned source edits between runs. Require the unchanged implementation to pass again.
- Require Reviews A, B, and C on the same task 9 HEAD. Each review reads the three `review-*-cf5743b.json` reports.
- Review A applies to traversal completeness, schema order, production calls, earlier-test preservation, and evidence truthfulness.
- Review B applies to every decoded credential path and write boundary. Security review is required.
- Review C applies to refusal timing, message parity, safe model preservation, and byte preservation. A short delta check is sufficient.
- Adversarial testing is required. Browser review does not apply because no UI changes.
- Correct RA4-N1's stale task 8 Green handoff during phase closeout. Keep immutable review reports unchanged.
- Refresh `metadata.json actual_tasks` and generated facts during phase closeout, not in this strategy role.

Task 9 mutations, with the tests that must fail:

1. Restore task 8's named-fields-only check over `reason`, `issues`, and valid count keys (T96 to T100, T102).
2. Walk only the selected review object, or only the first decoded object (T102).
3. Check only after `CountsSchema` or a verdict fallback discards data (T98, T102).
4. Skip keys, nested unknown objects, arrays, or embedded `content` decoding, one mutation per omission (T98, T99, T100, T97).
5. Move the MiniMax check after the paid callback returns (T96 to T100: a success entry appears).
6. Move the Kimi check after its first write (T96 to T100: the ledger or evidence changes).
7. Trim safe raw text or replace safe reported models with the declared model (T101).
8. Refuse every JSON answer, or return an empty finding list (T101, or T96 to T100).
9. Use different decoded-refusal suffixes for the providers, or include matched text (T103).

### Task 10: Decoded-layer remediation gate

Risk class: **high**. RB4-01 persists an encoded credential before any evidence write.
The walker reads only brace objects. It misses JSON string layers, root arrays, and scalar array elements.
RC5-1 and RC5-2 sit on that same walker. A depth limit is still forbidden.

Required design:

- Keep `decodedAnswerFindings(rawOutput: string)` as the shared behavior seam.
- Check every decoded JSON value before schema parsing, selection, status fallback, or any write.
- If the whole answer parses as JSON, walk that root value. A root value may be an object, an array, or a string.
- If the whole answer does not parse, keep the existing prose and fence extraction. T96 to T103 must stay green.
- When the root parse succeeds, do not scan that same text again. Visit each decoded value once.
- On each string, parse it when it is valid JSON. Walk the result. Repeat for every later string layer.
- Walk every array element, including scalar strings. Walk every object key and value. Use no field allowlist.
- Use an explicit worklist. Do not recurse on the call stack. Do not add a depth ceiling.
- A hostile depth returns findings or a safe empty result. It must not raise `RangeError`.
- Build the credential rule list once per call. Do not rebuild it on each key or string.
- Apply those rules to each decoded key and string. Return pattern names only.
- Preserve the raw-byte credential check. Do not change safe raw bytes.
- MiniMax calls the seam inside the paid callback, before it records success.
- Kimi calls the seam before `parseModelReview` and before any record write.
- The Kimi comment must match that order. It must state that the check reads the raw answer.
- Both paths check before a raw copy, review write, or result log. MiniMax may append its sanitized failure entry.
- A Kimi refusal leaves the begin ledger and the source raw file byte-identical.
- Preserve safe reported MiniMax models. Preserve Kimi's declared model and `modelSource`.
- Keep the decoded-refusal suffix from task 9. Do not change the raw-byte refusal text. RC5-3 is out of scope.
- Do not export `decodedReviewFindings`.
- Delete that function when no caller remains. Production acceptance must not call it.
- Do not add a MiniMax answer-size limit. The 65,536-byte bound is a test bound, not a new product limit.
- Limit implementation to `src/storytime/book-pictures.ts`. Report another source path before changing it.

Red gate:

- The table default is `volcengine-agent-plan/deepseek-v4-pro#high`. The orchestrator picks the route with `ra-quota`.
- This strategy names no Green model.
- Command: `ENGINE_HOOK_TEST_COMMAND`.
- Add T104 to T115 in `tests/storytime-book-pictures.test.ts`. Keep T1 to T103 unchanged.
- Require T104 to T110 to fail for both providers.
- Require the stated seam failure in T111, T113, T114, and T115.
- The 113 existing tests must pass. Record each exception with its cause.
- T112 may pass at Red. Name its adversarial mutations in the Red log.
- Reject package, syntax, transform, timeout, and preflight failures as Red evidence.
- A time row is valid Red only when its labeled duration exceeds 2000. A pass under 2000 is not valid Red for that row.
- Keep process, Vite, and browser mocks active. Tests start no real provider, process, server, or browser.
- Commit only the assigned test and plan paths. Record the exact command, exit code, and labeled summary.

Expected Red failures:

- T104 fails because the extra string layer keeps escaped braces. Both providers persist the answer and record success.
- T105 fails for the same reason at the third string layer.
- T106 fails because a root array is not a brace object. The sibling credential is not checked.
- T107 fails because the array string yields only the empty object. The credential element is lost.
- T108 fails because the encoded credential is not checked before fallback can discard it.
- T109 fails with `RangeError: Maximum call stack size exceeded`. The error has no pattern name and no suffix.
- T110 fails with the same `RangeError` on a safe deep answer.
- T111 fails because `decoded scan ms` is greater than 2000. Review C measured 14.3 s at depth 400.
- T113 fails because `decodedReviewFindings` is still exported.
- T114 fails because `precheckKimi` calls `parseModelReview` before `decodedAnswerFindings`.
- T115 fails because `rule scan ms` is greater than 2000. The local probe measured 6629 ms for the rule rebuild alone.
- T112 may pass. Its safe answers do not contain a decoded credential.

Green gate:

- The orchestrator picks the Green route. This strategy names no Green model.
- Rerun `ENGINE_HOOK_TEST_COMMAND` before implementation. Confirm the recorded Red failures.
- Require exit 0 afterward. Require `Tests  <N> passed (<N>)` with the committed Red test count and no skipped tests.
- Run `TASK10_TYPECHECK_COMMAND`.
- Require `owned tsc errors: 0`.
- Require `total tsc errors` no greater than 31.
- Run `git diff --quiet cf5743b7 -- src/song src/storytime/line-art-pass.ts`.
- Require exit 0.
- Keep the server, capture code, rubric text, `PICTURE_RUBRIC_VERSION`, and earlier tests unchanged.
- Make no paid call. Run no render, Vite server, or browser.

Live proof decision: no new smoke run is necessary for task 10.
The changed path decodes provider text and controls evidence writes.
Injected runners exercise that path against real temporary files.
Task 10 changes no server, capture code, renderer, or browser path.
Smoke run 6 remains the live server and capture evidence.
These tests prove provider-boundary behavior with synthetic inputs.
They do not prove a new live provider call or a render.

Task 10 closeout gate:

- Run `ENGINE_HOOK_TEST_COMMAND` again on the final task 10 HEAD.
- Run `TASK10_TYPECHECK_COMMAND` again on that same HEAD.
- Execute each mutation below separately.
- Use this command for each product mutation:

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'
```
- Restore only that mutation before the next run. Require the unchanged implementation to pass again.
- Require Reviews A, B, and C on the same task 10 HEAD.
- Each review reads `review-a-53cc3ad.json`, `review-b-53cc3ad.json`, and `review-c-53cc3ad.json`.
- Review A applies to layer coverage, call order, mutation isolation, the dead export, and evidence truthfulness.
- Review B applies to every decoded credential path and write boundary. Security review is required.
- Review C applies to refusal text, the deep-answer result, the export change, and the time bound. A short delta check is sufficient.
- Adversarial testing is required. Browser review does not apply because no UI changes.
- Keep RA4-N1 and RA3-N1 as closeout items. Do not close them in this task.
- Record RC5-3 as a tech-debt candidate. Do not change the raw-byte refusal text here.

Task 10 mutations, with the one named test that must fail:

1. Do not parse JSON string layers (T104). The same single change also fails T105, T107, T108, and T109. Record those failures. Do not add a second omission.
2. Parse only one string layer (T105).
3. Do not walk a root array (T106).
4. Walk array objects and skip scalar array elements (T107).
5. Pass the schema result, or skip the check when status fallback returns unclear (T108).
6. Restore direct recursion (T110). The same change also fails T109. Record both.
7. Add a depth ceiling below 4000 and return no finding past it (T109). T110 must still pass.
8. Catch `RangeError` and return no findings (T109).
9. Re-extract nested objects from the raw text and from every string (T111).
10. Build credential rules inside the per-key loop (T115).
11. Export `decodedReviewFindings` again (T113).
12. Call `parseModelReview` before the Kimi decoded check, while the check still reads the raw answer (T114).
13. Restore a Kimi comment that contradicts the call order (T114).
14. Trim safe raw bytes, or replace safe reported models with the declared model (T112).
15. Refuse every JSON string, including a safe string layer (T112).
16. Refuse every root array, including a safe review array (T112).
17. Catch every walker error and refuse every answer (T112).

Each mutation changes one path. Do not restate it by limiting a second path.
RA5-01 stays closed only when that isolation holds.

### Task 11: Token-layer remediation gate

Risk class: **high**. RB5-01, RB5-02, and RB5-03 persist an encoded credential before any
evidence write. RB5-04 makes the malformed-text path quadratic. RC6-1, RC6-2, and RA6-03 sit on
the same file and function.

Owner decision: Daniel must pick design A, design B, or design C. Design B is the default until
he answers. The design A note at the end of this block gives the change.

Required design:

- Keep `decodedAnswerFindings(rawOutput: string)` as the shared behavior seam.
- The credential check must not depend on `JSON.parse` success. `JSON.parse` stays for the review
  schema only. It never gates the credential check.
- The input class is every JSON string token of the raw text, at every decoded layer, plus the
  raw text itself. A list of shapes cannot describe this class.
- A JSON string token is a maximal run of characters between two unescaped `"` delimiters. A
  delimiter that never closes ends the token at the end of the text.
- The decoded form of a token resolves the JSON escape sequences: `\"`, `\\`, `\/`, `\b`, `\f`,
  `\n`, `\r`, `\t`, `\uXXXX`, and a surrogate pair.
- The decoded form of a token is a text of the next layer. The same rule applies to it. Each layer
  is shorter than the text below it, so the layers end.
- The raw text is a candidate at every layer. A credential in prose without a quote is found there.
- An object key is a string token. A key is checked like a value.
- The scan needs no valid JSON. A malformed, truncated, or duplicated text yields the same tokens
  as a valid text.
- The scan is linear in the text length per layer. No path restarts a scan at an opening brace.
- The scan uses no call-stack recursion and no depth ceiling.
- One rule builder serves the raw scan and the decoded scan. Both read the environment at call time.
- A finding names a pattern only. The matched text never enters a finding.
- A long pattern name is cut so that the shared suffix stays inside the 500-character cut.
- Keep the task 10 refusal suffix byte-identical:
  `the raw answer is refused; no review or raw copy is written.`
- Keep the task 9 raw-byte refusal text. RC5-3 stays out of scope.
- MiniMax calls the scan inside the paid callback, before the success entry.
- Kimi calls the scan before `parseModelReview` and before any record write.
- Both providers refuse before a raw copy, a review write, or a result log.
- A MiniMax refusal appends only its sanitized failure entry. A Kimi refusal leaves the begin
  ledger and the source raw file unchanged.
- Do not export `decodedReviewFindings`. Do not export the token scan unless a caller needs it.
- Do not add a MiniMax answer-size limit. The 65,536-byte bound is a test bound.
- Limit implementation to `src/storytime/book-pictures.ts`. Report another source path before
  changing it.

Red gate:

- The table default is `volcengine-agent-plan/deepseek-v4-pro#high`. The orchestrator picks the
  route with `ra-quota`.
- Command: `ENGINE_HOOK_TEST_COMMAND` with `timeout -k 30 900`.
- Add T116 to T128 in `tests/storytime-book-pictures.test.ts`. Keep T1 to T115 unchanged.
- Require T116 to T120, T122, and T126 to fail for both providers.
- Require T121 to fail on its labeled bound.
- T123 and T125 may pass at Red. Name their adversarial mutations in the Red log.
- The 125 existing tests must pass. Record each exception with its cause.
- A time row is valid Red only when its labeled duration is above 2000 and below the test-owned
  wall clock. A harness timeout is not valid Red evidence.
- Reject package, syntax, transform, timeout, and preflight failures as Red evidence.
- Keep process, Vite, and browser mocks active. Tests start no real provider, process, server, or
  browser.
- Commit only the assigned test and plan paths. Record the exact command, exit code, and labeled
  summary.

Expected Red failures:

- T116 fails because the fence extraction returns no root array. The escaped scalar element is
  never checked.
- T117 fails because the scan reads the first document only. The second document holds the
  credential.
- T118 fails because `JSON.parse` keeps the last duplicate value. The earlier value is never
  checked.
- T119 fails because `JSON.parse` keeps the last duplicate key. The credential key is never
  checked.
- T120 fails because the parse error sends the answer to the extraction path. The escaped value is
  never checked.
- T121 fails because `malformed scan ms` is above 2000. The brace rescan is quadratic.
- T122 fails because the fence, the duplicate key, and the malformed tail hide the credential.
- T124 fails because a long pattern name pushes the shared suffix past the 500-character cut.
- T126 fails because the MiniMax comment still holds the stale `RB3-01` label.
- T123 may pass. Its safe answers hold no credential.
- T125 may pass. Both paths use the same rule set at this HEAD.

Green gate:

- The orchestrator picks the Green route. This strategy names no Green model.
- Rerun `ENGINE_HOOK_TEST_COMMAND` before implementation. Confirm the recorded Red failures.
- Require exit 0 afterward. Require `Tests  <N> passed (<N>)` with the committed Red test count
  and no skipped tests.
- Run `TASK11_TYPECHECK_COMMAND`.
- Require `owned tsc errors: 0`.
- Require `total tsc errors` no greater than 31.
- Run `git diff --quiet cf5743b7 -- src/song src/storytime/line-art-pass.ts`.
- Require exit 0.
- Keep the server, capture code, rubric text, `PICTURE_RUBRIC_VERSION`, and earlier tests
  unchanged.
- Make no paid call. Run no render, Vite server, or browser.

Live proof decision: no new smoke run is necessary for task 11.
The changed path decodes provider text and controls evidence writes.
Injected runners exercise that path against real temporary files.
Task 11 changes no server, capture code, renderer, or browser path.
Smoke run 6 remains the live server and capture evidence.
These tests prove provider-boundary behavior with synthetic inputs.
They do not prove a new live provider call or a render.

Task 11 closeout gate:

- Run `ENGINE_HOOK_TEST_COMMAND` again on the final task 11 HEAD.
- Run `TASK11_TYPECHECK_COMMAND` again on that same HEAD.
- Execute each mutation below separately.
- Use this command for each product mutation:

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'
```

- Restore only that mutation before the next run. Require the unchanged implementation to pass
  again.
- Require Reviews A, B, and C on the same task 11 HEAD.
- Each review reads the `review-a-3f604b6.json`, `review-b-3f604b6.json`, and
  `review-c-3f604b6.json` reports.
- Review A applies to the input class, the comment label, the mutation isolation, and evidence
  truthfulness.
- Review B applies to every decoded credential path and write boundary. Security review is
  required.
- Review C applies to the refusal text, the 500-character cut, the rule sharing, and the time
  bound. A short delta check is sufficient.
- Adversarial testing is required. Browser review does not apply because no UI changes.
- Keep mutations 9 and 17 open for adversarial testing. The new time row may close mutation 9 as
  a side effect. Green records the result either way.
- Keep RA4-N1 and RA3-N1 as closeout items. Do not close them in this task.
- Record RC5-3 as a tech-debt candidate. Do not change the raw-byte refusal text here.

Task 11 mutations, with the one named test that must fail:

1. Read only the parsed root value. Remove the lexical token pass (T116). The same change also
   fails T117 to T120 and T122. Record those failures. Do not add a second omission.
2. Read only the first top-level document of the text (T117).
3. Build the candidate set from `JSON.parse` output, so an earlier duplicate value and an earlier
   duplicate key are lost (T118). The same change also fails T119 and T122.
4. Check string values only. Skip object keys (T119). The same change also fails T122.
5. Run the credential scan only when `JSON.parse` succeeds (T120). The same change also fails
   T122.
6. Keep a rescan from every unmatched opening brace in the malformed-text path (T121).
7. Do not cut a long pattern name, so the shared suffix leaves the 500-character cut (T124).
8. Give the decoded path its own rule list from a module-load snapshot (T125).
9. Restore the stale `RB3-01` label in the MiniMax comment (T126).
10. Refuse every fenced or array answer, including a safe one (T123).
11. Run the MiniMax scan after the paid callback returns (T127).
12. Run the Kimi scan after the first record write (T128).

Each mutation changes one path. Do not restate it by limiting a second path.

Design A note: Daniel's design A accepts one strict JSON object, refuses duplicate keys, and
refuses every other answer with no raw copy. Under design A, T116 to T120 keep their
constructions, but the expected result changes from a credential refusal to a contract refusal.
The shared suffix changes. The raw copy ban becomes universal. A duplicate-key rule needs a
parser that keeps every key. T121 keeps its time bound. T123 keeps one safe row for a strict
single-object answer. T124 to T128 stay unchanged. The amendment is one row-set replacement and
one contract amendment.

### Task 12: Malformed-string remediation gate

Risk class: **high**. RB6-01, RB6-02, and RB6-03 let an escaped credential reach the raw copy, the
review file, and a success entry. RC6-2 and both write boundaries sit on the same file and function.

Owner decision: Daniel chose design B ("Accept B", Google Tasks, 15:52-15:53 ICT, 2026-10-27).
Design B stays. The contract and the raw copies stay. Do not plan design A and do not plan a waiver.

#### Inputs and facts

- Inputs read: plan task 11, `measure/runs/asset_storytime_l2_unit1_pictures_20261025/review-b-bb4e11f.json`,
  the task 11 Green log `jr-green-bb4e11f.log`, the token scan in `git show 820f35c4`, and the contract
  security rules at `contract.md` lines 291 to 298.
- Inspected symbols: `decodedAnswerFindings`, `credentialRules`, `secretFindings`, `parseModelReview`,
  `jsonObjects`, `runPaidCall`, `precheckMiniMax`, and `precheckKimi`.
- Gap: `measure/anti-patterns.md` does not exist in this repository. This strategy uses the starter
  catalog `~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`.
  `build-graph` is on PATH. `graph.db` is absent. No graph scan ran.
- Fact: the Review B report at `bb4e11f0` holds five `source_derived_cases`. Task 12 gives each one
  a row. The report names RB6-01 to RB6-03 as blocking findings.
- Fact: the Review B cost note reads "about 21,800 short distinct tokens" for a 65,536-byte answer.
  Task 12 turns that case into one timed row.
- Fact: the task 10 Green log measured `rule scan ms` between 8,083 and 15,274 with 1,200 injected
  rules. The task 12 time row uses the same rule set and a wider answer.

#### Required design

- The input class is a closure, not a shape list. Start with the raw answer text.
- A text splits at every unescaped double quote into the head, the segments between two consecutive
  unescaped quotes, and the tail.
- Every segment decodes with the tolerant decoder. The tolerant decoder resolves each valid JSON
  escape, including `\uXXXX` and surrogate pairs.
- The tolerant decoder keeps each invalid escape sequence, each lone backslash, and each raw control
  character as literal text.
- The tolerant decoder never drops a segment and never throws.
- Every decoded segment is a candidate. A decoded segment that holds a quote is split and decoded again.
- A decoded segment without a quote is a candidate only. Do not decode it again.
- The raw text is a candidate. A credential in prose without a quote is found there.
- The scan needs no valid JSON. A malformed, truncated, duplicated, or fenced text yields the same
  candidates as a valid text.
- The scan is linear per layer. No path decodes a whole text without segment boundaries.
- One rule builder serves the raw scan and the decoded scan. Both read the environment at call time.
- `JSON.parse` stays for the review schema only. It never gates the credential check.
- MiniMax calls the scan inside the paid callback, before the success entry.
- Kimi calls the scan before `parseModelReview` and before any record write.
- Both providers refuse before a raw copy, a review write, or a result log.
- A MiniMax refusal appends only its sanitized failure entry. A Kimi refusal leaves the begin ledger
  and the source raw file unchanged.
- Keep the task 10 refusal suffix byte-identical:
  `the raw answer is refused; no review or raw copy is written.`
- Keep the task 9 raw-byte refusal text. RC5-3 stays out of scope.
- Limit implementation to `src/storytime/book-pictures.ts`. Report another source path before changing it.

#### Red gate

- The table default is `volcengine-agent-plan/deepseek-v4-pro#high`. The orchestrator picks the route
  with `ra-quota`.
- Command: `ENGINE_HOOK_TEST_COMMAND` with `timeout -k 30 900`.
- Add T129 to T138 in `tests/storytime-book-pictures.test.ts`. Keep T1 to T128 unchanged.
- Require T129 to T135 to fail. T136, T137, and T138 may pass at Red. Name their adversarial
  mutations in the Red log.
- The 138 existing tests must pass. Record each exception with its cause.
- Reject package, syntax, transform, timeout, and preflight failures as Red evidence.
- Keep process, Vite, and browser mocks active. Tests start no real provider, process, server, or browser.
- Commit only the assigned test and plan paths. Record the exact command, exit code, and labeled summary.

Expected Red failures:

- T129 fails because the scan drops a token with no closing quote.
- T130 fails because the scan stops at the last complete token and drops the trailing backslash text.
- T131 fails because `JSON.parse` throws on a raw control character and drops the whole token.
- T132 fails because `JSON.parse` throws on an invalid escape and drops the whole token.
- T133 fails because one stray quote in prose shifts the pairing and the real token falls outside the text.
- T134 fails because the generated corpus holds cases the current scan misses and the seam returns no finding.
- T135 fails because the sampled generated cases are not refused.
- T136 may pass at Red. Name mutation 5 in the Red log.
- T137 may pass at Red. Name mutation 5 in the Red log.
- T138 passes at Red. Name mutation 3 in the Red log.

#### Green gate

- The orchestrator picks the Green route. This strategy names no Green model.
- Rerun `ENGINE_HOOK_TEST_COMMAND` before implementation. Confirm the recorded Red failures.
- Require exit 0 afterward. Require `Tests  <N> passed (<N>)` with the committed Red test count and
  no skipped tests.
- Run `TASK12_TYPECHECK_COMMAND`.
- Require `owned tsc errors: 0`.
- Require `total tsc errors` no greater than 31.
- Run `git diff --quiet bb4e11f0 -- src/song src/storytime/line-art-pass.ts`.
- Require exit 0.
- Keep the server, capture code, rubric text, `PICTURE_RUBRIC_VERSION`, and earlier tests unchanged.
- Make no paid call. Run no render, Vite server, or browser.

Live proof decision: no new smoke run is necessary for task 12.
The changed path decodes provider text and controls evidence writes.
Injected runners exercise that path against real temporary files.
Task 12 changes no server, capture code, renderer, or browser path.
Smoke run 6 remains the live server and capture evidence.
These tests prove provider-boundary behavior with synthetic inputs.
They do not prove a new live provider call or a render.

#### Task 12 closeout gate

- Run `ENGINE_HOOK_TEST_COMMAND` again on the final task 12 HEAD.
- Run `TASK12_TYPECHECK_COMMAND` again on that same HEAD.
- Execute each mutation below separately.
- Use this command for each product mutation:

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'
```

- Restore only that mutation before the next run. Require the unchanged implementation to pass again.
- Require Reviews A, B, and C on the same task 12 HEAD.
- Review A applies to the input class, the mutation isolation, and evidence truthfulness.
- Review B applies to every malformed-string path and both write boundaries. Security review is required.
- Review C applies to the refusal text, the 500-character cut, the rule sharing, and the time bounds.
  A short delta check is sufficient.
- Adversarial testing is required. Browser review does not apply because no UI changes.
- Keep mutations 9 and 17 open for adversarial testing. Green records the result either way.
- Keep RA4-N1 and RA3-N1 as closeout items. Do not close them in this task.
- Record RC5-3 as a tech-debt candidate. Do not change the raw-byte refusal text here.

Task 12 mutations, with the one named test that must fail:

1. Drop the head and the tail segments. Scan only the segments between two quotes (T129). T130 also fails.
2. Decode a segment with `JSON.parse` and drop the segment when the parse throws (T131). T132 also fails.
3. Pair the quotes left to right in one parity only (T133). T138 also fails.
4. Do not split and decode a decoded segment that holds a quote (T134).
5. Decode the whole layer text without segment boundaries and use the decoded text as the next layer (T137).

Each mutation changes one path. Do not restate it by limiting a second path.

#### Guardrails and changed-contract risks

Guardrails:

- From task 12, the credential check covers the head, every segment between two quotes, and the tail.
  It does not depend on `JSON.parse` success (T129 to T135).
- From task 12, the tolerant decoder never drops a segment and never throws (T131, T132).
- From task 12, the scan is linear per layer. No whole-text decode exists (T137).
- From task 12, one rule builder serves the raw scan and the decoded scan (T125).
- From task 12, the MiniMax and Kimi write orders stay as task 11 set them (T127, T128, T135).
- Phase 2 task 12 changes nothing in `src/song/`.

Changed-contract risks:

- Task 12: the credential check now reads malformed provider text. A safe malformed answer keeps its
  earlier parser result (T123, T138).
- Task 12: a refusal message still cuts a long pattern name. The name stays a prefix of the earlier
  name. A reader must not parse the full name (T124).
- Task 12: the decoded scan covers more text than the task 11 scan. A safe answer that holds a
  credential-like string in prose can now be refused. T138 holds the safe controls (T112, T123).
- Task 12: the layer count still has no ceiling. A deep chain of quote segments costs one pass per
  layer. T137 bounds that cost.

#### Anti-pattern coverage

| Class | Phase | Defense | Falsification |
| --- | --- | --- | --- |
| A3 digit-only count | P2 | Parse the labeled integers `wide scan ms`, `chain scan ms`, and `generated cases`. Parse the vitest total and the compiler counts the same way. | A date, an arbitrary digit, or a missing label satisfies a bound. |
| A4 vacuous pass | P2 | Every hostile row pairs with a safe twin (T138). T134 asserts a finding for every credential case and no finding for every twin. T136 and T137 must print a labeled duration and must call the seam. | An empty finding list, a skipped scan, a refused safe answer, or a missing label passes. |
| A5 false claim | P2 | Quote the Red failures and the mutation results. Do not claim RB6-01 to RB6-03 closed before the reviews and the adversarial gate pass. | The plan claims closure while a named test or a review fails. |
| A6 registry overstatement | P2 | Keep the security completion claim pending until Reviews A, B, and C and the adversarial gate pass. | A completion claim precedes those results. |
| A7 over-broad filter | P2 | The safe twins of T138 keep their result, their raw bytes, and their verdict. T123 keeps the task 11 safe controls. | A safe answer is refused, a safe byte changes, a verdict changes, or a write is missing. |
| A9 archived track paths | P2 | T129 to T138 reference no `measure/tracks/` path. | A unit test gains a track path dependency. |
| A10 generated-facts drift | P2 | Refresh metadata and generated facts at phase closeout, after the task 12 status change. | Managed facts disagree with the completed plan. |

Task 12 applicability: A1 and A8 remain retired. A2 does not apply to this delta. It adds no
publication or consent transition. Earlier release and person-review guards stay unchanged. Task 12
does not convert a model pre-check into acceptance.

#### Review applicability

- Review A applies to the input class, the plan claim, the mutation isolation, and evidence truthfulness.
- Review B applies to every malformed-string path and both write boundaries. Security review is required.
  Review B audits task 12 against the named class only.
- Review C applies to the refusal text, the 500-character cut, the shared rule builder, and the time
  bounds. A short delta check is sufficient.
- Adversarial testing applies. Use the task 12 mutations and the T136 and T137 time rows.
- UX/API review applies to the refusal result and the Kimi call order. A short delta check is sufficient.
- Browser review does not apply. This task changes no UI.

#### Aggregate suite rule

- No test in this track is intentionally red after Red. A red T129 to T138 result after Green blocks
  the phase. Do not suppress a task 12 failure with a test filter, skip, or baseline exception.
- The aggregate suite stays outside the focused command and stays a recorded known failure.
- Baseline tsc errors outside the owned paths stay known failures. They do not block the focused gate.

#### PM last-round rule

PM limit (22:49 ICT, 2026-10-27): task 12 is the last remediation round for the malformed-string class.
If the task 12 Review B finds new items in the same class, no task 13 opens. The items become recorded
residual risk, and the PM takes the decision to Daniel. A finding outside this class follows the normal path.

#### Residual risk list

Named residual risk, out of class, recorded, and not tested:

- base64 encoding of a credential
- percent encoding of a credential
- HTML entities that hide a credential
- a credential split across two separate strings
- a credential split across prose and a string
- single-quoted strings
- a credential encoded twice inside one string token
- other transforms of the credential bytes

#### Red base capture point

The task 12 strategy commit lands before task 12 Red starts. Immediately afterward, the orchestrator runs
`git rev-parse HEAD` and captures that commit SHA as the immutable task 12 Red base. Do not use
`bb4e11f0` or any earlier SHA as this base. The immutable Phase 2 `phase_base_sha` remains `1d39b8fd`.
If the orchestrator opens a separate phase run for task 12, capture that `phase_base_sha` immediately
after this strategy commit instead. Capture the new base before any Red edit or commit. This strategy
embeds no SHA for that base.

### Phase 2 closeout gate

- Run `ENGINE_HOOK_TEST_COMMAND` and the type check again on the final commit.
- The task 3 to task 8 evidence above is complete. The adversarial mutations from the Red logs
  ran, and each mutation made at least one test fail. The Red logs are `mid-red-00481c5.log`,
  `mid-red-fa4692c.log`, `mid-red-835d9c0.log`, the task 5 Red log, the task 7 Red log, and the
  task 8 Red log.
- Mutations for task 5: put `seek` before `load` in `captureBookStill`; read the published copy for
  read 3; compare packed depth with 0.02; bind the style look to `sampleFiles` only; remove the
  `rubricVersion` check; allow a second `after-call` for one `callId`.
- Mutations for task 7, one at a time, each with the test that must fail:
  1. Restore the `JSON.stringify` string with `-c` in the wrapper (T77).
  2. Put the inner marker in the command, not in `env` (T77).
  3. Replace the `realpath` check with the lexical `inside` check only (T78 cases a, b, g).
  4. Call `next()` for a refused `/out/` or `/@fs/` request (T78).
  5. Remove the `out/storytime` exclusion (T78 case c).
  6. Serve any file in the stage directory, not only timeline pictures (T78 case f).
  7. Remove `host`, `fs.strict`, or the `fs.deny` entry from `bookServerConfig` (T79).
  8. Use `path.join` instead of `resolveOutputPath` in the smoke writer (T80).
  9. Remove the `wx` flag in `writeOutputFile` (T80).
  10. Make `secretFindings` return an empty list (T81, T82, T83).
  11. Write the provider error without `redactSecrets` (T81).
  12. Trim the raw answer or change its line ends (T82 case d).
  13. Remove the regular-file or size check in `readRawAnswer` (T82 case c).
  14. Remove `assertCalibrationReady` from `verify --release` (T84).
  15. Return `true` for an empty `sampleFiles` list (T85).
- Mutations for task 8, one at a time, each with the test that must fail:
  1. Rethrow the original provider error from `runPaidCall` (T88).
  2. Print the original rejection at the final CLI boundary (T88).
  3. Check only raw MiniMax bytes, not decoded fields (T89).
  4. Omit the decoded check for `reason`, `issues`, or a count key (T89, T90).
  5. Write a success entry before the decoded check (T89, T90).
  6. Remove a Vite default deny entry or replace the absolute Storytime pattern with the relative one (T91, T92).
  7. Return the candidate path from the model or stage branch (T93).
  8. Remove the Storytime exclusion from stage reads (T93).
  9. Restore the UTF-8 byte limit for Kimi reasons (T94).
  10. Trim or normalize safe raw bytes (T82, T89, T90).
  11. Restore an invalid full SHA in an operative artifact (T95).
- Reviews A, B, and C pass on the final HEAD.
- Task 9 also passes its closeout gate, T96 to T103, and every declared mutation.
- Task 10 also passes its closeout gate, T104 to T115, and every declared mutation.
- Record RC5-3 as a tech-debt candidate. Do not treat that note as a closed finding.
- Correct RA4-N1 in `jr-green-77a7ace.log`: remove the stale pre-amendment HEAD and T95 count from its handoff.
  Quote the final operative SHA scan result. Do not change immutable review findings.
- `git status --short -- src/storytime scripts/storytime-book-pictures.ts tests/storytime-book-pictures.test.ts`
  prints nothing.
- Run `./measure/generate.sh` after the plan status changes (A10).
- Refresh `metadata.json actual_tasks` during closeout (RA3-N1). Do not mark it complete in task 8.

## 5. Required tests and falsification conditions

Each row is one test or one small group. A test is valid only if the falsification condition
makes it fail. Tests use temporary roots from `mkdtemp`. Tests never write to the real `out/`.

| ID | Behavior | Falsification condition (the test fails if ...) |
| --- | --- | --- |
| T1 | Real packages `w01` to `w07` give 112 jobs, 16 per week, 8 per book kind. Assert exact labeled counts. | a loader drops a book, a page, or a week, or returns any count other than 112. |
| T2 | A temporary Workbooks copy with `w01` to `w08` still gives 112 jobs and no `w08` id. | the loader uses a glob or a directory list. |
| T3 | Package bytes have the same SHA-256 before and after `plan`. Each job records its package hash. | `plan` writes to a package or records a hash that `sha256sum` does not give. |
| T4 | A changed package byte stops `render` before the capture call. | the injected capture mock is called. |
| T5 | A week filter keeps the source hash in `jobs.json`. | the filtered run writes a different hash or fewer than 112 jobs. |
| T6 | Filenames match `^l2-w0[1-7]-(readalong\|decodable\|cover\|small)-[a-z0-9]+(-[a-z0-9]+)*-v[1-9][0-9]*\.png$`. The slug is never a gesture name from `GESTURES`. | a slug is `wave` or `nod`, or a name breaks the pattern. |
| T7 | An existing `v1` file keeps its bytes. A retry writes `v2` or refuses. | the `v1` SHA-256 changes. |
| T8 | A stage file path is `docs/storytime/l2-unit1/wNN/<job-id>-vN.json`. Its SHA-256 covers the exact bytes. A wrong job id, a wrong version, or song, audio, or video keys are rejected. | a mismatched or song-bearing stage decodes, or the hash ignores a byte change. |
| T9 | A changed stage file after render evidence stops a new render or marks the candidate `failed`. | the candidate stays `ready` or `pending` after the stage change. |
| T10 | Output roots with `..`, an absolute path outside `out/`, or a symlink out of `out/` are rejected. | any of the three resolves without an error. |
| T11 | The heavy wrapper calls the preflight before the lock. A hold calls no lock and no pipeline, prints one hold line, and returns a non-zero code. A render dry run calls neither. | the call order differs, or a hold returns 0. |
| T12 | No test starts a real process, browser, or server (section 4 mocks). | an unplanned `spawn`, `chromium.launch`, or `createServer` call happens. |
| T13 | A paid dry run calls no runner and writes no ledger entry. A paid call writes `before-call` before the runner starts and `after-call` after it ends, also when the runner throws. A call with neither `--paid` nor `--dry-run` is refused. | the order is wrong, a failed call has no `after-call`, or an unflagged call runs. |
| T14 | The review parser reads a labeled `verdict` field only. Unclear text, "not a pass", and "PASS?" give `fail`. Counts are integers under labels. | a substring `PASS` anywhere gives `pass`. |
| T15 | PNG checks: exact size per use, opaque, 8-bit, sRGB, not one flat color. Small pictures have white corners. Each check has a passing and a failing fixture (alpha, 16-bit, wrong size, CMYK or grey, flat). | a failing fixture passes. |
| T16 | The cover check fails a fixture with a focal actor or prop in the top 30 percent and passes a calm fixture. | both fixtures get the same result. |
| T17 | Release gate: two model passes with no person log stay `pending`. A missing provider stays `pending`. A failed verdict gives `failed`. A person log with an empty `checkedBy`, an evidence class outside `owner-passed` and `person-checked`, a wrong `fileSha256`, or a wrong `rubricVersion` fails `verify --release`. | any of these cases gives `ready` or passes `--release`. |
| T18 | `verify --release` with zero selected candidates fails. A manifest from zero jobs fails. | an empty selection passes (A4). |
| T19 | The newest ready version is selected: `v1` ready and `v2` pending selects `v1`; a later ready `v3` selects `v3`. | a pending or older version is selected. |
| T20 | The batch SHA-256 equals an independent computation in the test: SHA-256 of the canonical JSON array of `{file, sha256}` sorted by file. Input order does not change it. One changed byte changes it. The manifest records the algorithm. | the test uses the product helper as its own oracle, or order changes the hash. |
| T21 | A contact sheet leaves every candidate PNG byte-identical and writes only under the output root. | a candidate hash changes. |
| T22 | A real `render` refuses to start without four calibration logs that pass every gate check in the contract "Calibration": verdict, raw output, `rubricVersion`, `fileSha256`, and source text. T65 holds the cases that Review A asked for (RA-N3). | a render starts before calibration passes ("A failed calibration blocks production"), or a stale or changed log opens the gate. |
| T23 | The CLI rejects song, video, and unknown commands. A book still timeline has no singing tracks and no page notes. | a song or video command runs, or a sing track remains. |
| T24 | MiniMax arguments are an array with native image input (`vision describe --image <file>`). The prompt holds the source text and the rubric version. No shell string is built. | the image is passed as text, or a shell string is used. |
| T25 | `precheck-kimi --begin` writes `before-call`, and `--record` writes `after-call` and the log with the file SHA-256 and the raw text unchanged. A record without a matching begin is refused. The contract amendment for this command landed in `b63755bc`. | a log is written without a prior `before-call`, or the raw text changes. |

Line-art twin tests (contract "Line-art twins"). Each row needs a passing fixture and a failing
fixture.

| ID | Behavior | Falsification condition (the test fails if ...) |
| --- | --- | --- |
| T26 | Twin binding: one capture call per job version returns the color image, the line-art image, and the camera state. One render evidence record holds `stageFile`, `stageSha256`, `at`, `camera`, `colorFile`, `colorSha256`, `lineArtFile`, `lineArtSha256`, `lineArtFormatVersion`, and `lineArtTechnique`. | the capture mock is called twice for one version, or a field is missing, or a hash differs from `sha256` of the written bytes. |
| T27 | Binding mismatch: evidence with a different stage hash, still time, or camera for one twin, or a line-art file whose SHA-256 differs from the record, makes the line-art twin `failed` and fails `verify --release`. | a mismatched twin stays `pending` or `ready`. |
| T28 | Size equality: the line-art width and height equal the color twin's. A 3000 x 2249 line-art fixture fails. | an off-by-one size passes. |
| T29 | Binary pixels: every decoded pixel is exactly 0 or 255. A fixture with one pixel of 128 fails. Fixtures with one pixel of 1 or 254 also fail. | any grey value passes, or the check uses a tolerance. |
| T30 | Opaque format: one 8-bit grey channel, no alpha. An RGBA fixture, a 16-bit fixture, and an RGB fixture fail. | a fixture with an alpha channel or more than one channel passes. |
| T31 | White background: 255 is the most frequent value, and at least 90 percent of a 2 percent edge frame is white. An inverted fixture (white lines on black) fails. A fixture with a black edge frame fails. | an inverted or black-framed fixture passes. |
| T32 | Ink coverage: a black share from 0.5 to 25 percent passes and is printed as a labeled value. An all-white fixture fails. A fixture with more than 25 percent black fails. Fixtures just inside each limit pass. | an empty or flooded page passes, or a valid page fails. |
| T33 | Filename: the line-art path is `<directory>/lineart/l2-wNN-<use>-<slug>-vN-lineart.png`, with the color twin's use, slug, and version. The T6 color pattern matches no line-art name. The line-art pattern matches no color name. | the two patterns overlap, or a twin name has a different slug or version. |
| T34 | Versions: an existing `v1` line-art file keeps its bytes on a retry. A change to either twin writes `v2` of both twins. | the `v1` line-art SHA-256 changes, or only one twin gets `v2`. |
| T35 | Manifest and batches: each job version lists its line-art file, SHA-256, color twin, evidence file, and status. Batches are per week, book kind, and output kind. A one-byte line-art change changes the `lineart` batch hash and leaves the `color` batch hash the same. The test computes both hashes independently. | the line-art change moves the color hash, or line art is missing from the manifest. |
| T36 | Line-art release: `ready` needs format checks, binding, a `ready` color twin, a passing line-art person look, and a passing style look with `evidenceClass: owner-passed`. Each missing item keeps it `pending`. A passing model log on line art changes nothing. A person look with a wrong file SHA-256 fails. | line art becomes `ready` with any item missing, or a model log changes its status. |
| T37 | `verify --release` on reader pages fails when the color twin is ready and the line-art twin is not. `--output color` checks only color. `--output lineart` checks only line art. An empty selection fails for each output value. | `--release` passes with a missing line-art twin, or an empty `--output` selection passes. |
| T38 | `render --dry-run` calls no capture, writes no color file, no line-art file, and no evidence, and prints both planned paths. | the capture mock is called, or a file exists after the dry run. |
| T39 | A contact sheet shows each twin pair side by side and leaves both files byte-identical. | a twin hash changes, or a pair is missing from the sheet. |
| T40 | Twin atomicity: if the capture gives no line-art image or the line-art pass throws, the render writes neither twin and no evidence. | a lone color file or a partial evidence record exists after the failure. |
| T41 | Render size is a render parameter. A render at a different size (for example a 4961 x 3508 test size) from the same stage file records the same `stageSha256` and the same camera in its evidence, records the new width and height, and writes a new version. The stage file bytes do not change. | the stage file changes, the evidence has a different stage hash or camera, or the old file is overwritten. |

Engine hook and line-art pass tests (Phase 2 task 3). Rows T42 to T51 run without a browser. They
use injected fakes, a fake renderer, and real three.js `Scene` and `PerspectiveCamera` objects,
which need no WebGL. T45 is a gate row. T52 and T53 need the live proof.

| ID | Behavior and test file | Falsification condition (the test fails if ...) |
| --- | --- | --- |
| T42 | `tests/song-still-hook.test.ts`: a fresh target has no `__bookStill`. `publishBookStill` sets `scene`, `camera`, `renderer`, and `cameraState`. `clearBookStill` removes the hook, so a new `load` leaves no stale hook. | the hook exists before a publish, or it survives a clear. |
| T43 | `tests/song-still-hook.test.ts`: `cameraStateOf` returns a value copy with `position`, `target`, `fov`, `aspect`, `near`, and `far`. The values equal the camera at publish time. A camera change after the publish leaves `cameraState` the same. | `cameraState` is a live reference, a field is missing, or a value differs. |
| T44 | `tests/song-still-hook.test.ts` (text read of `src/song/main.ts`): the line `window.__song = { ready: true, portrait, load, seek };` and the `__song?:` type line are byte-identical to `1d39b8fd`. `publishBookStill` is called in `seek` after the frame render. `clearBookStill` is called in `load`. No other place calls them. | `window.__song` gains or loses a key, or a hook call is in another place. |
| T45 | Gate row, no new test: `tests/song-timeline.test.ts` passes in `ENGINE_HOOK_TEST_COMMAND`. `git diff --quiet 1d39b8fd -- src/song/timeline.ts tests/song-timeline.test.ts` exits 0. `removed song lines: 0`. Only `main.ts` and `still-hook.ts` change in `src/song/`. | a song timeline test fails, a timeline file changes, a song line is removed, or another song file changes. |
| T46 | `tests/storytime-line-art-pass.test.ts`: after `renderLineArtPass`, these equal their values before the pass: `camera.aspect`, the camera projection matrix, the renderer size and pixel ratio, the render target, the clear color and alpha, `scene.background`, `scene.overrideMaterial`, and the `visible` and `material` values of every object. Each created target and material is disposed. The same holds when the fake `render` throws. | any value differs after a pass or after a throw, or a created resource is not disposed. |
| T47 | `tests/storytime-line-art-pass.test.ts`: at each `render` call, the fake renderer records the override material, every visible material, and every geometry. No material has `wireframe: true`. No geometry is a `WireframeGeometry`. Each line object that the pass adds has `depthTest: true`. A mutation that sets `wireframe: true` on any pass material makes this test fail. | the `wireframe: true` mutation passes, or a line object without the depth test passes. |
| T48 | `tests/storytime-line-art-pass.test.ts`: the result has the requested width and height, `width * height` bytes, and only 0 and 255. A fake target whose bottom WebGL row is dark gives a black top row in the result. | the size or byte count differs, a grey byte exists, or the rows are upside down. |
| T49 | `tests/storytime-book-pictures.test.ts`: `captureStillPair` with a fake driver runs this order: seek, color screenshot, read the published copy (`cameraState`), read the live camera (`liveCameraState`), line-art pass, read the live camera again, seek the same time, second color screenshot. The evidence camera is the published copy. A live drift, a published copy that differs from the first live read, a pixel difference between the two color screenshots, or a missing hook after the seek throws and writes nothing (amended for RA-N1). | the order differs, the evidence camera comes from a live read, the drift check reads the published copy, or a drift or difference passes. |
| T50 | `tests/storytime-book-pictures.test.ts`: `checkLineArtSmoke` on synthetic fixture pictures. A ring outline passes. A mesh net inside the disc fails with `fixture interior ink` above `1.00%`. A ring with a 30-degree gap fails with `fixture ring rays` below `342/360`. The check prints both labeled values. | the mesh net passes, the gapped ring passes, the full ring fails, or a label is missing. |
| T51 | `tests/storytime-book-pictures.test.ts`: `lineart-smoke` with an injected capture writes only under `smoke/lineart-<UTC stamp>/`. It writes no candidate, evidence, manifest entry, or ledger line. `manifest` ignores `smoke/`, and the next `render` still writes `v1`. `--dry-run` calls no capture. | a smoke file appears in the manifest, a version number moves, or a dry run captures. |
| T52 | Live, Phase 2 task 3 smoke run. The output prints `hook before seek: absent`, `hook after seek: present`, `window.__song keys: load,portrait,ready,seek`, `camera state drift: 0`, `color repeat identical: yes`, `fixture interior ink: <x>%` with `x <= 1.00`, `fixture ring rays: <n>/360` with `n >= 342`, and `stage ink share: <x>%` from 0.5 to 25. Review A (RA-N1) found that `camera state drift: 0` in this run was true by construction, because both reads returned the published copy. T74 replaces it as the live drift proof. The smoke also used `captureBookStillSmoke`, not the production capture (RA-B1). The other labels stand. | a label is missing, a value is out of range, or the page throws. |
| T53 | Live, Phase 3 task 1 Nan sample from the v2 stage. The render log prints `capture path: captureBookStill`, `camera drift source: live`, `camera state drift: 0`, `color repeat identical: yes`, and `lineart technique: song-page-form-edges-viewdepth-1bit-v2`. The line art passes T28 to T32 on the real bytes. The evidence camera equals the camera state read before the pass. | a label is missing or differs, or a format check fails on the real file. |

Review A remediation tests (Phase 2 task 5). Rows T61 to T73 run without a browser. They use fake
pages, fake renderers, fake runners, and temporary roots. T74 and T75 need the live proof.

The fake page for T61 to T63 runs each `evaluate` function against a fake `window`. Its
`__song.load` stores the timeline and returns notes. Its `__song.seek` throws `seek before load`
when no timeline is stored, because `src/song/main.ts` returns early then. A seek after a load
publishes `__bookStill` with a live fake camera and a value copy. The fake records the call order.

| ID | Behavior and test file | Falsification condition (the test fails if ...) |
| --- | --- | --- |
| T61 | `tests/storytime-book-pictures.test.ts` (RA-B1): `captureBookStill(input, { open, lineArt })` with the fake page and a fake line-art pass. The capture calls `__song.load` with `input.timeline` before the first `seek`. It returns both images and logs `capture path: captureBookStill`. | the fake records a `seek` before `load`, the capture throws, or the label is missing. |
| T62 | `tests/storytime-book-pictures.test.ts` (RA-B1): `loadBookTimeline(page, timeline)` calls `__song.load` once and accepts an empty note list. A list with one note throws and names the note. `captureBookStill` with a fake `load` that returns one note throws before any `seek` and returns no picture. | a note passes, a `seek` runs after a note, or `load` runs twice. |
| T63 | `tests/storytime-book-pictures.test.ts` (RA-N1): `captureBookStill` with the fake page. The fake line-art pass changes the live camera `fov` by 1 and leaves the published copy. The capture throws a drift error that names `fov`. One changed projection element gives the same result. A published copy whose `fov` differs from the live camera before the pass also throws. A run with no change passes, and its evidence camera equals the published copy. | a driver that reads the published copy twice passes a drift case, or the evidence camera comes from a live read. |
| T64 | `tests/storytime-book-pictures.test.ts` (RA-B2): a manifest with a sample twin and a second reader twin. All other items pass for both. The style look lists only the sample file and has the sample's technique and format version. The second twin is `ready`. A third twin with another `lineArtTechnique` is `pending`. A record whose `sampleFiles` SHA-256 differs from the sample bytes makes all three twins `failed`. | the second twin is not `ready`, the third twin is `ready`, or the changed record leaves a twin `ready` or `pending`. |
| T65 | `tests/storytime-book-pictures.test.ts` (RA-N3): `assertCalibrationReady(outputRoot, workbooksRoot, repoRoot)` with fixture source files and four correct logs resolves. Each change below throws, one at a time: `rubricVersion: storytime-picture-v1`; a `fileSha256` of other bytes; a `good-nan` `sourceText` of `Owner-approved Nan character picture.`. | a changed log opens the gate, or the correct set throws. |
| T66 | `tests/storytime-book-pictures.test.ts` (RA-N2): `calibrationTarget('good-nan', ...)` has `sourceText` `Hello, I am Nan.` and the exact contract `sourcePrompt`. Neither value matches `/approv\|owner/i`. The `sourcePrompt` without its final period is a substring of the real `w01.json` page 5 image prompt, read read-only. | an approval word remains, or the description differs from the Workbooks text. |
| T67 | `tests/storytime-book-pictures.test.ts` (RA-N4): after `--begin`, `--record <callId> --failed --reason "reviewer session hung"` appends one `after-call` entry with `status: failure` and the reason. It writes no log and no raw file. These cases are refused, and the ledger stays byte-identical: no begin; a second record for one `callId` in either mode; `--failed` with `--raw`; an empty reason; a `--calibration` or `--job` value that differs from the begin entry. | a refused case appends a line or writes a file, or the failure record writes a log. |
| T68 | `tests/storytime-book-pictures.test.ts` (RA-N6): a MiniMax `before-call` entry and log record the declared model with `modelSource: declared`. A fake MiniMax output that names a model gives `modelSource: reported` and that model in the log. A Kimi log has `modelSource: declared`. | a log or entry has a model with no `modelSource`, or a reported model is labeled declared. |
| T69 | `tests/storytime-book-pictures.test.ts` (RA-N9): two `precheck-minimax --paid` calls on one target with a fake runner write two raw files under `raw/`. Each name contains its `callId`. The first raw file stays byte-identical. Each log names its `callId` and `rawFile`. | the second call changes or removes the first raw file, or a log lacks `callId` or `rawFile`. |
| T70 | `tests/storytime-line-art-pass.test.ts` (RA-N7): the test computes the depth independently as `far * (z - near) / (z * (far - near))`, with near 0.2 and far 120. `viewDistance(depth, near, far)` returns 0.5, 4.0, and 40 m within 0.1 percent. `isDepthEdge(4.0, 4.3)` and `isDepthEdge(40, 43)` are true. `isDepthEdge(4.0, 4.02)` and `isDepthEdge(40, 40.2)` are false. In `renderLineArtPass` with fake targets, two regions with the same normal at 4.0 m and 4.3 m give ink on their border. | the absolute 0.02 rule on packed depth passes, a 0.5 percent gap gives an edge, or the border has no ink. |
| T71 | `tests/storytime-book-pictures.test.ts` (RA-N8): `LINEART_TECHNIQUE` is `song-page-form-edges-viewdepth-1bit-v2`. A render with an injected capture records that value in the render evidence. `lineart-smoke` with an injected capture records it in `smoke.json`. | the ID stays `song-page-scene-render-pass-1bit-v1`, or a record has another value. |
| T72 | `tests/storytime-book-pictures.test.ts` (Review C note): `render` without `--version`, when the newest version is complete, reports `skipped`, prints `next free version: v2`, and writes no file. `render --version 2` with a `-v2` stage file and no `v1` candidate writes `v2` twins. | the skip prints no hint or writes a file, or the `v2` render refuses or writes `v1`. |
| T73 | `tests/storytime-book-pictures.test.ts` (RA-N7 smoke check): `checkLineArtSmoke` on a synthetic depth-step picture with a recorded border column and row range. Ink on the border, within 2 pixels, in at least 90 percent of the rows passes. A picture with no border ink fails. The check prints `fixture depth step rows: <n>/<m>`. | the picture with no border ink passes, the full border fails, or the label is missing. |
| T74 | Live, Phase 2 task 5 smoke run 2. The output prints `capture path: captureBookStill`, `camera drift source: live`, `camera state drift: 0`, `color repeat identical: yes`, `lineart technique: song-page-form-edges-viewdepth-1bit-v2`, `stage ink share: <x>%` from 0.5 to 25, `fixture interior ink: <x>%` with `x <= 1.00`, `fixture ring rays: <n>/360` with `n >= 342`, and `fixture depth step rows: <n>/<m>` with `n/m >= 0.90`. | a label is missing, a value is out of range, or the page throws. |
| T75 | Live, Phase 2 task 6 operations. The plan quotes: `9d0bddf7 after-call: failure`; `before-call entries: 8`; `after-call entries: 8`; `open before-calls: 0`; `good-nan-minimax: pass`; `good-nan-kimi: pass`. Both new logs have `sourceText: Hello, I am Nan.`, a `modelSource`, `rubricVersion: storytime-picture-v2`, and a raw file with the `callId` in its name. The Kimi `before-call` comes after the MiniMax `after-call`. `assertCalibrationReady` accepts `out/storytime/l2/unit1`. | a label is missing or differs, the two calls overlap in time, or the gate rejects the root. |

Review B security remediation tests (Phase 2 task 7). Rows T77 to T85 go into
`tests/storytime-book-pictures.test.ts`. They use temporary roots, fake requests, fake runners,
and injected seams. They start no process, browser, or server. T86 and T87 need the live proof.

Credential fixture set for T81 to T83. Each value is synthetic:

- an API key `sk-SYNTHETIC00000000000000000000`;
- `Authorization: Bearer SYNTHETICBEARER0000000000000`;
- a `-----BEGIN PRIVATE KEY-----` block with the body `SYNTHETIC`;
- an access key ID `AKIA0000SYNTHETIC000`;
- `api_key=SYNTHETIC-api-key-000000`;
- a token `eyJhbGciOiJub25lIn0.eyJzdWIiOiJTWU5USEVUSUMifQ.U1lOVEhFVElD`;
- the value `plainvalue-SYNTHETIC-0001` of `STORYTIME_SYNTHETIC_API_KEY`, set with `vi.stubEnv`.
  No other pattern matches this value, so only the environment rule can find it.

The tree check in T80 to T83 reads every file under the temporary output root and the outside
directory. It searches each file for each synthetic value.

| ID | Behavior and test file | Falsification condition (the test fails if ...) |
| --- | --- | --- |
| T77 | RB-01: `runStorytimeBookPictures(['render', '--job', '$(printf RB_SUBSTITUTION_EXECUTED)'], { spawn })` with the inner marker unset. The injected `spawn` records its call and returns status 0. There is one call. The command is `bash`. The first argument is the `heavy-run.sh` path. No argument is `-c`. The arguments end with the three argv values, each unchanged and separate. `env.STORYTIME_BOOK_PICTURES_INNER` is `'1'`. `shell` is absent or `false`. A spawn status of 75 returns 75. | an argument is `-c`, an argv value changes or joins another value, the marker is missing, `shell: true` is set, or the hold code 75 is lost. |
| T78 | RB-02: `bookFileAllowlist`, `resolveBookFile`, and the `serveBookFiles` middleware with fake `req`, `res`, and `next` in a temporary repo root. The timeline names stage picture `sign.png`. Served with their bytes: `/out/hero/hero.glb` and `/stage/sign.png`. Refused with 404, no `next` call, and no outside bytes: (a) `/out/ghost/ghost.glb`, a symlink to an outside file; (b) `/out/evil/evil.glb`, where `out/evil` links to an outside directory; (c) `/out/storytime/l2/unit1/cost-ledger.jsonl`, one file each under `raw/`, `calibration/`, and `candidates/`, and `/out/storytime/storytime.glb`; (d) `/out/hero/../storytime/l2/unit1/cost-ledger.jsonl` and its `%2e%2e` form; (e) `/@fs/<absolute ledger path>`; (f) `/stage/other.png`, which the timeline does not name; (g) `/stage/sign.png` replaced by a symlink to an outside file; (h) `/out/hero/hero.json`. A request for `/src/song/main.ts` calls `next`. `stats()` gives `served: 2` and the exact refused count. | a refused case returns 200, calls `next`, or sends outside bytes; an allowed file is refused; or a count differs. |
| T79 | RB-02 wiring: `captureBookStill(input)` with no `deps`. The vite mock records its config and then throws. The config has `server.host: '127.0.0.1'`, `server.fs.strict: true`, an `out/storytime/**` entry in `server.fs.deny`, and one plugin named `storytime-book-files`. That plugin refuses `/out/storytime/l2/unit1/cost-ledger.jsonl`. | the host is absent or not loopback, `fs.strict` is not `true`, the deny entry is missing, or the production opener uses another file plugin. |
| T80 | RB-03: `writeOutputFile` writes a new file. It throws and leaves the bytes the same for an existing regular file and for an existing file symlink to an outside file. `lineart-smoke` with an injected capture and a fixed clock: (a) `smoke` is a symlink to an outside directory, and the command throws; (b) the stamp directory exists with `color.png` as a symlink to an outside file, and the command throws; (c) a clean root writes the four files (T51 holds). In (a) and (b), the outside directory and file stay the same, and no new file appears. | a write reaches an outside path, an existing file changes, a refused run writes a file, or the clean run fails. |
| T81 | RB-04 provider errors: `secretFindings` finds each fixture value and returns pattern names that do not contain the value. `redactSecrets` removes each value. `runPaidCall` with a runner that throws `mmx exited with 1: <all fixture values>` writes one `after-call` entry with `status: failure`, `[redacted:` in `error`, no fixture value, and at most 500 characters in `error`. `precheckMiniMax` with a fake runner that rejects in the same way passes the tree check. | a fixture value is in any file or in a finding, the failure entry is missing, or `error` has more than 500 characters. |
| T82 | RB-04 raw answers: (a) a fake MiniMax runner returns stdout with one fixture value. The `after-call` entry has `status: failure` and names the pattern. No raw file and no log exist. The tree check passes. (b) `precheck-kimi --record <callId> --raw <file>` with one fixture value is refused, and the ledger stays byte-identical. (c) `--raw` is refused, and nothing is written, for a symlink to a safe text file, a directory, a file of 65,537 bytes, and a file with a NUL byte. A safe file of 65,536 bytes is accepted. (d) The T54 fixture bytes through the fake MiniMax runner, and a Kimi PASS text with CRLF line ends and trailing spaces, give raw files and `rawOutput` values byte-identical to the input. | a refused case writes, a fixture value persists, the 65,536-byte file is refused, or a safe answer changes by one byte. |
| T83 | RB-04 failure reasons: `precheck-kimi --record <callId> --failed --reason <text>` with each fixture value is refused, and the ledger stays byte-identical. A reason of 501 characters is refused. A plain reason still appends one `failure` entry (T67 holds). | a credential reason or a long reason is written, or a plain reason is refused. |
| T84 | RB-05: `runStorytimeCli(['verify', '--release', ...], { repoRoot, workbooksRoot, log })` on the T37 twin fixture with four valid calibration logs and their source files exits 0. Each case below throws a message that names calibration, one at a time: (a) one calibration log is removed; (b) one log has `rubricVersion: storytime-picture-v1`; (c) one calibration source file has one changed byte. In each case, `verify` without `--release` still exits 0. | `--release` passes in a case, the message does not name calibration, or the plain `verify` fails. |
| T85 | RA2-N1: the T64 manifest with a passing style look record, first with `sampleFiles: []`, then with no `sampleFiles` key. Every twin is `failed` in both cases. | a twin is `ready` or `pending` in either case. |
| T86 | Live, Phase 2 task 7 smoke run 4. The output prints all T74 labels in their ranges, `book files served: <n>` with `n >= 2`, `book file requests refused: 0`, and `lineart-smoke: wrote 4 files under <path>`. The plan quotes the SHA-256 of `color.png` and compares it with smoke run 3 `color.png`. If the values differ, Green views both pictures and records that Nan and the pot are visible. | a label is missing, a value is out of range, a request is refused, or the page throws. |
| T87 | Gate row, no new test. (a) `ARGUMENT_PROBE_COMMAND` prints the literal text `$(printf RB_SUBSTITUTION_EXECUTED)`; the plan quotes `argument probe: literal`. (b) A read-only `node --import tsx` command calls `secretFindings` on `cost-ledger.jsonl` and on each file under `calibration/`, `raw/`, `candidates/`, and `reviews/` of `out/storytime/l2/unit1/`. It prints `live files scanned: <n>` with `n >= 15` and `live credential findings: 0`. (c) `assertCalibrationReady('out/storytime/l2/unit1')` still accepts the root. | the probe prints `RB_SUBSTITUTION_EXECUTED` without the `$(printf ` text, a live file matches, fewer than 15 files are scanned, or the gate rejects the root. |

Second security remediation tests (Phase 2 task 8). Rows T88 to T91, T93, and T94 go into
`tests/storytime-book-pictures.test.ts`. They use temporary roots and injected dependencies. They
start no process, browser, server, or provider. T92 is live proof. T95 is a documentation gate.
Keep every T1 to T87 assertion unchanged.

| ID | Behavior and test file | Falsification condition (the test fails if ...) |
| --- | --- | --- |
| T88 | RB2-01: a fake provider rejects with stderr containing every synthetic credential. `runPaidCall` writes its sanitized failure entry and rejects with a sanitized error of at most 500 characters. `runStorytimeBookPicturesEntry` with a rejected injected pipeline captures `errorLog`, returns 1, and logs no credential. Its message has at most 500 characters. Safe diagnostic text survives both boundaries. | the original error escapes, the final log contains a credential, either message exceeds 500 characters, or safe diagnostic text disappears. |
| T89 | RB2-02 MiniMax: separate raw JSON responses hide the synthetic API key with `\u` escapes in `reason`, one `issues` string, and one `observedCounts` key. Each case refuses before a success entry, review write, raw copy, or success log. The failure entry names only the pattern. A safe JSON response with an escaped non-ASCII character keeps its raw file byte-identical and its decoded review text. | any escaped credential reaches a success entry, file, or log; a raw file is written for a refused review; or safe raw bytes change. |
| T90 | RB2-02 Kimi: after `--begin`, separate `--raw` JSON inputs hide the synthetic API key with `\u` escapes in the same three decoded fields. Each record refuses with the ledger byte-identical, no review or raw copy, and no credential in captured logs. A safe escaped Unicode response keeps its raw copy byte-identical. | a success entry or file appears, the begin ledger changes, a log exposes a credential, or safe raw bytes change. |
| T91 | RB2-03 configuration: `bookServerConfig` has all four Vite defaults `.env`, `.env.*`, `*.{crt,pem}`, and `**/.git/**`. It also has `<absolute-repoRoot>/out/storytime/**`, computed independently from the temporary `repoRoot`. T79 may retain the relative entry. Loopback, strict mode, and the plugin remain. | a default is absent, the absolute Storytime entry is absent or wrong, or an earlier protection disappears. |
| T92 | Live smoke run 6: every T86 label passes. Through the real Vite stack, print `middleware probe .env: refused`, `middleware probe pem: refused`, `middleware probe git config: refused`, `middleware probe storytime: refused`, `middleware probe stage control: served`, and `middleware probe synthetic bytes exposed: 0`. Each refusal has HTTP status 403 or 404. The stage control returns its exact bytes. | any protected request returns 200 or synthetic bytes, the control fails, a label is missing, or any T86 label fails. |
| T93 | RB2-04 and RA3-01: an in-root model symlink resolves to its checked target. An in-root stage symlink also resolves to its checked target. `resolveBookFile` returns those real paths, not the candidates, and the middleware reads their bytes. A timeline-named stage picture whose target is Storytime evidence gets 404 with no `next` call and no evidence bytes. Cover both a file symlink and a stage root inside the protected tree. | a returned path is the candidate, a read follows the candidate, a protected stage target is served, or an allowed in-root symlink fails. |
| T94 | RA3-02 and RC3-1: after `--begin`, a Kimi failure reason of 500 non-ASCII characters appends one failure entry. A reason of 501 non-ASCII characters is refused with the ledger byte-identical and no log. Use a multibyte character whose UTF-8 size exceeds one byte. | the 500-character reason is refused, the 501-character reason is written, or either case logs or writes at the wrong time. |
| T95 | Documentation gate: every operative full 40-character Git ID in the section 4 artifact set resolves with `git rev-parse --verify`. Print `operative full SHAs checked: <n>` with `n >= 1` and `unresolved full SHAs: 0`. Immutable review quotations are excluded. | any operative full SHA does not resolve, the scan has no input, or either label is missing. |

Decoded-value remediation tests (Phase 2 task 9). Keep T1 to T95 unchanged.
T96 to T103 use the existing test file, fake runners, fixed clocks, captured logs, and temporary output roots.
Each provider case uses a fresh root. Credentials contain or encode `SYNTHETIC` and exist only at runtime.
Create Unicode escapes at runtime so the raw-byte scan misses the credential while the decoded check must find it.
Use the supported `content` envelope with `base_resp.status_code: 0`. Keep the top-level control as a valid review object.
For multiple-object cases, place the credential in the earlier object, then the later object, in separate fixtures.

For every refused MiniMax case, require one before-call and one sanitized failure after-call, with no success entry.
For every refused Kimi record, require the begin ledger and source raw file to remain byte-identical.
Both paths must produce no review, raw copy, success log, or matched text in errors and logs.
Scan every output file, not only the expected review path. Exclude only the deliberate external Kimi input fixture from credential searches.
Compare that input fixture with its original bytes separately.

| ID | Behavior | Falsification condition |
| --- | --- | --- |
| T96 | Both providers refuse an escaped credential in top-level `model`, beside a valid PASS review. Assert every refusal invariant above. | A provider records success, writes evidence, exposes matched text, or does not refuse. |
| T97 | Both providers refuse an escaped `model` inside an envelope's JSON `content` string. Cover plain and fenced inner JSON. | An inner model bypasses the check or any refusal invariant fails. |
| T98 | Both providers refuse an escaped key in malformed `observedCounts`. Use FAIL with a non-integer value and PASS with invalid counts. | Schema fallback removes the key before inspection, or either answer reaches persistence. |
| T99 | Both providers refuse unknown fields at depth two or greater. Test an escaped credential as a key and as a string value. | A depth limit or field allowlist hides either credential, or a refusal invariant fails. |
| T100 | Both providers refuse an escaped string array element inside an unknown nested field. Include an object element with a credential key. | Array traversal skips an element or key, or a refusal invariant fails. |
| T101 | Both providers accept safe controls for top-level and `content` envelopes. Include escaped Unicode, nested unknown fields, arrays, CRLF, and trailing spaces. MiniMax keeps each safe reported model; Kimi keeps its declared model. Safe malformed counts retain the existing FAIL or unclear result. | A safe answer is refused, raw bytes change, a model changes, or safe parser behavior changes. |
| T102 | The shared seam scans multiple decoded objects, including an unselected object and a nonzero-status envelope. Test every value kind and safe empty structures. Verify both provider paths refuse a hidden credential before fallback. | A selected-object check, early return, nonzero-status fallback, or missing shared call bypasses inspection; safe empty structures produce findings. |
| T103 | Both providers use the task 9 decoded-refusal suffix and name only the pattern. Capture thrown errors and the final CLI error boundary. | Message endings differ, matched text escapes, or the error claims that MiniMax writes no failure entry. |

Decoded-layer remediation tests (Phase 2 task 10). Keep T1 to T103 unchanged.
T104 to T110 and T112 use fake runners, fixed clocks, captured logs, and temporary output roots.
T111 and T115 call the shared seam only. T113 reads the module export. T114 reads the source file.
T113 and T114 are not live behavior tests.
Each provider case uses a fresh root. Build the credential at runtime as `sk-` plus `SYNTHETIC` repeated four times.
Build Unicode escapes at runtime. Do not store a decoded credential in a fixture file.
Use the Review B constructions below. Keep the task 9 refusal invariants for every refused provider case.
Give T109, T110, T111, and T115 a 120000 ms test limit. Build deep JSON text in a loop. Do not recurse in the test helper.

Review B constructions:

```js
const secret = 'sk-' + 'SYNTHETIC'.repeat(4);
const escaped = Array.from(secret, (c) => String.fromCharCode(92) + 'u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
const safe = { verdict: 'PASS', reason: 'The subject is visible.', observedCounts: { subject: 1 }, issues: [] };
const hiddenObject = JSON.stringify({ value: secret }).replaceAll(secret, escaped);
const case1 = JSON.stringify({ ...safe, unknown: JSON.stringify(hiddenObject) });
const case2 = JSON.stringify({ ...safe, unknown: JSON.stringify([secret, {}]).replaceAll(secret, escaped) });
const case3 = JSON.stringify([safe, secret]).replaceAll(secret, escaped);
```

T105 wraps `hiddenObject` in one more `JSON.stringify` before it is placed in `unknown`.
T108 uses a nonzero-status envelope. Its `content` string is `JSON.stringify` of the case 2 array text.
T111 is valid nested JSON at depth 400, padded to 65,536 UTF-8 bytes, with no credential and no NUL.
T115 is one wide JSON object of 65,536 UTF-8 bytes. It adds 1200 env names `TASK10_SECRET_<n>` whose values are `sek` + 8 hex digits + `SYNTHETICVALUE`.
Restore those env names in a `finally` block.
Print `decoded scan ms: <n>` for T111.
Print `rule scan ms: <n>` for T115.
Parse each labeled integer.

| ID | Behavior | Falsification condition |
| --- | --- | --- |
| T104 | Both providers refuse Review B case 1. The extra string layer hides the escaped credential. Assert every task 9 refusal invariant. | A provider records success, writes evidence, or does not refuse. |
| T105 | Both providers refuse three string layers. One layer is not enough. | A one-layer decode accepts the answer, or a refusal invariant fails. |
| T106 | Both providers refuse Review B case 3. The walker checks the root array and the sibling string. | Object extraction accepts the array, or a refusal invariant fails. |
| T107 | Both providers refuse Review B case 2. The walker checks the scalar array element. | The empty object hides the credential, or a refusal invariant fails. |
| T108 | Both providers refuse a nonzero-status envelope whose only credential is inside a string-layer array. The check reads the raw answer. | Status fallback discards the credential, or a refusal invariant fails. |
| T109 | Both providers refuse an escaped credential at object depth 4000. The result uses the task 9 suffix. The call does not raise `RangeError`. | The call throws, the suffix is missing, or the deep credential is accepted. |
| T110 | A safe object at depth 4000 does not throw. Both providers keep the existing parser result and the raw bytes. | The call throws, a safe answer is refused, or raw bytes change. |
| T111 | The seam scans a 65,536-byte nested answer at depth 400 within 2000 ms. It returns no finding and does not throw. This is a walker test, not a live provider test. | `decoded scan ms` is missing, over 2000, or the call throws or returns a finding. |
| T112 | Both providers accept safe string layers, a safe root array, a safe encoded array, and escaped Unicode that is not a credential. Raw bytes and reported models stay unchanged. | A safe answer is refused, raw bytes change, or a model changes. |
| T113 | `decodedReviewFindings` is not an export. This is an artifact test, not live behavior. | The name is exported. |
| T114 | In `precheckKimi` and `precheckMiniMax`, the decoded check runs before `parseModelReview`. The Kimi comment matches that order and says the check reads the raw answer. This is a documentation test, not live behavior. | The Kimi call order is reversed, or the comment contradicts the code. |
| T115 | The seam scans the wide 65,536-byte answer with 1200 injected secrets within 2000 ms. Rules are built once. This is a walker test, not a live provider test. | `rule scan ms` is missing or over 2000, or the test leaves injected env names behind. |

Decoded-token remediation tests (Phase 2 task 11). Keep T1 to T115 unchanged.
T116 to T128 go into `tests/storytime-book-pictures.test.ts`. They use the existing worker
harness, fake runners, fixed clocks, captured logs, and temporary output roots.
Every new row runs its scan or its provider call in the worker harness. The test owns the
wall-clock limit.
The limit is 20000 ms for a seam row, 60000 ms for the malformed time row, and 30000 ms for a
provider row. T121 uses the 60000 ms limit. The harness may gain a mode. The limits stay
test-owned.
Every row builds its credential at runtime. No fixture file holds a decoded credential.
Build Unicode escapes at runtime. Do not store a decoded credential in a fixture file.
The harness keeps its worker stack at 1 MB.

Review B constructions, one per row:

```js
const secret = 'sk-' + 'SYNTHETIC'.repeat(4);
const escaped = Array.from(secret, (c) => String.fromCharCode(92) + 'u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
const safe = { verdict: 'PASS', reason: 'The subject is visible.', observedCounts: { subject: 1 }, issues: [] };
```

T116 uses `const raw = '```json\n' + JSON.stringify([safe, secret]).replaceAll(secret, escaped) + '\n```';`.
T117 uses `const raw = JSON.stringify(safe) + '\n' + JSON.stringify([secret]).replaceAll(secret, escaped);`.
T118 uses `const raw = '{"verdict":"PASS","reason":"The subject is visible.","observedCounts":{"subject":1},"issues":[],"unknown":"' + escaped + '","unknown":"safe"}';`.
T119 uses `const raw = '{"verdict":"PASS","reason":"The subject is visible.","observedCounts":{"subject":1},"issues":[],' + '"' + escaped + '":1,"' + escaped + '":2}';`.
T120 uses `const text = JSON.stringify(safe); const raw = text.slice(0, -1) + ',"unknown":"' + escaped + '",}';`.
T121 uses `const raw = '{'.repeat(65536);`.
T122 uses one answer with a fence, a duplicate key, and a malformed tail:

```js
const fenced = '```json\n' + '{"verdict":"PASS","reason":"The subject is visible.","observedCounts":{"subject":1},"issues":[],"' + escaped + '":1,"' + escaped + '":2}\n```';
const raw = fenced + '\n' + '{"note":"' + escaped + '",';
```

T121 prints `malformed scan ms: <n>` and parses the labeled integer.
T121 measures the same way as T111 and T115, so the labels stay comparable.
T121 injects no env name. The labeled duration covers the malformed text scan.
T124 stubs an env name `TASK11_LONG_` plus 400 `A` characters plus `_KEY` with the value
`sek-long-SYNTHETIC-0001`. The env name ends in `KEY`, so the environment rule exists.
T124 restores that env name in a `finally` block.
T125 stubs an env name `TASK11_SHARED_KEY` with the value `sek-shared-SYNTHETIC-0001`.
T125 restores that env name in a `finally` block.

| ID | Behavior | Falsification condition |
| --- | --- | --- |
| T116 | Both providers refuse Review B case 1. The fenced root array holds a safe review and an escaped scalar credential. The refusal names only a pattern and ends with the task 10 suffix. No review, raw copy, or success entry appears. The Kimi begin ledger and the source raw file stay byte-identical. | A provider records success, writes evidence, exposes the matched text, or does not refuse. |
| T117 | Both providers refuse Review B case 2. A safe review is followed by an escaped root array. | The second document is skipped, or a refusal invariant fails. |
| T118 | Both providers refuse Review B case 3. The escaped credential sits in an earlier duplicate value. | The last duplicate value wins and the earlier value is skipped, or a refusal invariant fails. |
| T119 | Both providers refuse Review B case 4. The escaped credential sits in a duplicate key. | A key is skipped, or a refusal invariant fails. |
| T120 | Both providers refuse Review B case 5. A parse error must not bypass the credential check. | A parse error skips the check, or a refusal invariant fails. |
| T121 | The seam scans 65,536 unmatched opening braces within 2000 ms. It returns no finding and does not throw. The row prints `malformed scan ms: <n>`. This is a walker test, not a live provider test. | `malformed scan ms` is missing or above 2000, the call throws, or the worker passes its wall clock. |
| T122 | Both providers refuse one answer with a fence, a duplicate key, and a malformed tail. | Any part hides the credential, or a refusal invariant fails. |
| T123 | Both providers accept the safe answers: a safe fenced array, safe duplicate keys, a safe malformed answer, and escaped Unicode that is not a credential. The raw bytes stay byte-identical. The reported MiniMax model stays unchanged. The PASS verdict stays PASS. The Kimi declared model and `modelSource` stay unchanged. The safe answer still writes its review file and its raw copy. | A safe answer is refused, raw bytes change, a model changes, a verdict changes, or a write is missing. |
| T124 | The long env pattern name is cut. The thrown error, the MiniMax ledger `error`, and the final CLI error log each end with the task 10 suffix, each stay at 500 characters at most, each hold the first 32 characters of the pattern name, and none holds the value. | The suffix is missing, a message runs past 500 characters, the name prefix is missing, or the value appears. |
| T125 | One rule builder serves both paths. `secretFindings` and `decodedAnswerFindings` return the same pattern name for the same plain value. The decoded scan finds the escaped form of the same value. A second value stubbed after the first call appears in both results. | The two paths return different names, one path misses a value, or a module-load snapshot keeps an old value. |
| T126 | The MiniMax decoded-check comment in `src/storytime/book-pictures.ts` holds no `RB3-01` text. It states that the check reads the raw answer and runs before any write. The Kimi comment states the same. This is a documentation test, not live behavior. | A stale label remains, or a comment drops the raw-answer statement or the order statement. |
| T127 | MiniMax write boundary. For every refused construction of T116 to T120 and T122, the output root holds no review file, no raw copy, and no success log. The ledger holds one before-call and one sanitized failure after-call. A scan of every file under the root finds no credential value. | Any file holds the value, a success entry appears, a review or raw copy exists, or the failure entry is missing. |
| T128 | Kimi write boundary. For every refused construction of T116 to T120 and T122, the begin ledger and the source raw file stay byte-identical. The output root holds no review and no raw copy. A scan of every file under the root finds no credential value. The Kimi record runs in the worker harness. The begin entry and the byte comparison stay in the test process. | The ledger changes, the source raw file changes, a review or raw copy exists, or a file holds the value. |

Malformed-string remediation tests (Phase 2 task 12). Keep T1 to T128 unchanged.
T129 to T138 go into `tests/storytime-book-pictures.test.ts`. They use the existing worker harness,
fake runners, fixed clocks, captured logs, and temporary output roots.
Every hostile row runs in the worker harness with a test-owned wall clock.

| ID | Behavior | Falsification condition |
| --- | --- | --- |
| T129 | Unterminated token after a safe review. Fixture: `JSON.stringify(safe) + '\n{"note":"' + escaped`. The credential sits in a token with no closing quote. Both providers refuse before any evidence write. The refusal names only a pattern and ends with the task 10 suffix. Label: `unterminated token refused`. Mode: worker harness `minimax` and `kimi`, 30000 ms each. | A provider records success, writes a review or a raw copy, exposes the matched text, or does not refuse. |
| T130 | Backslash at the end of the text. Fixture: `JSON.stringify(safe) + '\n"' + escaped + '\\'`. The token holds a trailing lone backslash. Both providers refuse before any evidence write. Label: `trailing backslash refused`. Mode: worker harness `minimax` and `kimi`, 30000 ms each. | A provider records success, writes evidence, exposes the matched text, or does not refuse. |
| T131 | Raw line feed inside the credential token. Fixture: `JSON.stringify(safe) + '\n{"note":"' + escaped + '\nmore"}'`. The MiniMax envelope form `JSON.stringify({ content: raw, base_resp: { status_code: 0 } })` is refused too. Both providers refuse before any evidence write. Label: `raw control character refused`. Mode: worker harness `minimax` and `kimi`, 30000 ms each. | A provider records success, writes evidence, exposes the matched text, or does not refuse. |
| T132 | Invalid escape after the credential. Fixture: `JSON.stringify(safe) + '\n{"note":"' + escaped + '\\q"}'`. The token holds an invalid escape sequence. Both providers refuse before any evidence write. Label: `invalid escape refused`. Mode: worker harness `minimax` and `kimi`, 30000 ms each. | A provider records success, writes evidence, exposes the matched text, or does not refuse. |
| T133 | Stray prose quote before the credential object. Fixture: `JSON.stringify(safe) + '\nThe pole is 5" tall. ' + JSON.stringify({ note: secret }).replaceAll(secret, escaped)`. One stray quote shifts the quote pairing. Both providers refuse before any evidence write. Label: `stray prose quote refused`. Mode: worker harness `minimax` and `kimi`, 30000 ms each. | A provider records success, writes evidence, exposes the matched text, or does not refuse. |
| T134 | Seeded generator at the seam. Fixture: one generator in the test file, seed 20261025, 240 cases. Each case mixes safe review JSON, prose with stray quotes, unterminated strings, a trailing backslash, raw control characters, invalid escapes, fences, duplicate keys, arrays, and 0 to 3 extra string layers. One escaped credential sits in a string segment. Every credential case must yield a finding. Every safe twin must yield no finding. Labels: `generated cases: <n>` and `generated findings: <n>`. Mode: worker harness `seam`, 60000 ms. | A credential case yields no finding, a twin yields a finding, a labeled count disagrees with the seed, or the worker passes its wall clock. |
| T135 | Both-provider sample of generated cases. Fixture: the generated cases at the fixed indexes 0, 2, 5, 9, 14, 20, 27, 35, 44, 54, 65, and 77. Each case runs through MiniMax and Kimi. Every provider refuses before any evidence write. Labels: `sample cases: <n>` and `sample refusals: <n>`. Mode: worker harness `minimax` and `kimi`, 30000 ms each. | A provider records success, writes a review or a raw copy, exposes the matched text, or does not refuse. |
| T136 | Wide cost row. Fixture: a 65,536-byte answer that holds about 21,800 distinct short strings, plus the T115 set of 1,200 injected env rules `TASK10_SECRET_<n>_KEY`. The seam scans it. Label: `wide scan ms: <n>`. The labeled integer must be at most 60000. Mode: worker harness `seam`, 120000 ms wall clock. | The label is missing, the labeled value is above 60000, or the worker passes its wall clock. |
| T137 | Chain-depth row. Fixture: a 65,536-byte answer that holds a deep chain of nested quote segments, folded the 5m+1 way of the Review B cost note. The seam scans it. Label: `chain scan ms: <n>`. The labeled integer must be at most 20000. Mode: worker harness `seam`, 60000 ms wall clock. | The label is missing, the labeled value is above 20000, or the worker passes its wall clock. |
| T138 | Safe twins. Fixture: the five Review B constructions of T129 to T133 with the credential removed, plus the 240 generated twins of T134. The seam yields no finding for any twin. Both providers accept every twin, keep the raw bytes, keep the verdict, keep the model name, and write the review file and the raw copy. Labels: `twin cases: <n>` and `twin findings: <n>`. Mode: worker harness `seam`, plus `minimax` and `kimi` for a fixed sample of five twins, 30000 ms per provider call. | A twin yields a finding, a provider refuses a twin, a raw byte changes, a verdict changes, a write is missing, or a file holds a credential value. |

Task 12 fixtures and labels:

- The generator seed is 20261025. The case count is 240. The generator runs no new dependency. It uses
  a small linear congruential step inside the test file.
- The generator samples the pieces of the class from a fixed list. The piece list, the order, and the
  case count stay fixed. A second run with the same seed yields the same cases.
- Every generated case has one safe twin. The twin is the same text with the credential removed. The
  twin keeps every other byte.
- The credential and its escape form are built at run time. No fixture file holds a decoded credential.
- The env rules of T136 use the T115 names. The test removes every injected name in a `finally` block.
- Wall-clock limits: 30000 ms for a provider row, 60000 ms for a generator or chain row, and 120000 ms
  for the wide cost row. The limits stay test-owned. A harness timeout is not Red evidence.
- Labels: `unterminated token refused`, `trailing backslash refused`, `raw control character refused`,
  `invalid escape refused`, `stray prose quote refused`, `generated cases`, `generated findings`,
  `sample cases`, `sample refusals`, `wide scan ms`, `chain scan ms`, `twin cases`, and `twin findings`.
  Each labeled integer is parsed from the label, never from a bare digit.


Fixtures and mocks:

- Read the real Workbooks packages read-only for T1 and T3. Copy them to a temporary root for
  T2, T4, and T5. Never hard-code a package SHA-256. Compute it in the test.
- Make PNG fixtures with `sharp` in memory. `sharp` is not a heavy job.
- Make line-art fixtures from raw one-channel buffers (`sharp(buffer, { raw: { width, height,
  channels: 1 } })`). Set single pixels in the buffer for T29. Do not draw them with antialiased SVG.
- The capture mock for T26 to T40 returns `{ color, lineArt, camera }`. Its exact shape is Green's
  choice. Red fixes the observable rules only: one call per version, one camera, both images.
- Inject `preflight`, `holdLock`, `pipeline`, `capture`, `readStage`, `runner`, and the ledger
  writer. No unit test runs the real preflight, the lock, a provider, Chrome, or vite.
- Use a fixed clock or compare event order. Do not depend on wall time.
- Tests reference no `measure/tracks/` path (A9).
- Task 8 builds JSON Unicode escapes at runtime. It never embeds a decoded synthetic credential in
  a fixture file. The T88 entry uses an injected `errorLog`. The T92 probe uses a temporary Vite root
  and real HTTP requests. Only T92 starts a real server.
- Task 9 reuses these provider seams with runtime escapes and temporary roots. It starts no real server or provider.
- Task 10 reuses those seams. It starts no real server or provider. T111 and T115 call the seam only. T113 and T114 read source or exports.
- Task 11 reuses those seams and the worker harness. It starts no real server or provider.
  T121, T124, and T125 call the seam or a rule path only. T126 reads the owned source file.
  Every new row runs in the worker harness with a test-owned wall clock.

## 6. Kimi pre-check owner and mechanism

The primary agent is now a read-only Measure orchestrator. It must not write artifacts. Commit
`b63755bc` applied this mechanism to the contract:

1. The task executor (a Green-role subagent) runs `precheck-kimi --begin` for one picture. The
   command writes the `before-call` entry and a prompt file under the scratch path. It prints the `callId`.
2. The executor dispatches one bounded Kimi K3.1 Pro reviewer. The reviewer gets read access to
   the one image and the prompt file only. It gets no expected verdict. It writes nothing.
3. The reviewer views the image as native image input and returns raw text only.
4. The executor saves the raw text unchanged in the scratch path.
5. The executor runs `precheck-kimi --record <callId> --raw <file>`. The command writes the
   `after-call` entry and the log with the file SHA-256.
6. If the reviewer gives no raw answer, the executor runs `precheck-kimi --record <callId>
   --failed --reason <text>`. The command writes a `failure` entry and no log (T67).

T25 is in scope for Red. Kimi pre-checks apply to color candidates only.

## 7. Later phases

### Phase 3: Week 1 pictures

Risk class: **critical**. Phase 3 has 30 render runs at up to 4000 x 3000 pixels on a 7.1 GiB
machine, a changed output contract, a drifting shared asset, and two human gates. The date is
2026-11-02.

Plan task order: (1) Nan window sample, (2) assets, (3) 30 twin renders, (4) checks and model
pre-checks, (5) count review and line-art looks, (6) delivery.

#### 3.1 Facts this section fixes

Read-only sources and their values, checked on 2026-10-28:

| Fact | Value |
| --- | --- |
| Picture list v3 | `/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json` |
| SHA-256 of `pictures.json` | `c3e23cfdace136c7ed602b3aefee83383241833537ba56f0257668eb1e2c686b` |
| SHA-256 of `pictures.md` | `e97d649f8de5597494730ee17c8785a1ebe36ee2f7f7c0897701d5422929f848` |
| Workbooks commit of list v3 | `078917f1` |
| Workbooks commit of specification v1 | `a9178413`, dated 2026-10-27 |

The check commands and their expected output:

```sh
P=/home/daniebo/Desktop/Workbooks/content/storytime/l2/print
sha256sum "$P/pictures.json" "$P/pictures.md"
node -e 'const d=require(process.argv[1]);const w=d.filter(r=>r.week===1);console.log("rows",d.length,"week1",w.length,"A",w.filter(r=>r.sizeClass==="A").length,"B",w.filter(r=>r.sizeClass==="B").length,"C",w.filter(r=>r.sizeClass==="C").length)' "$P/pictures.json"
```

Expected output: `rows 192 week1 30 A 16 B 2 C 12`. The check fails when a hash differs, when the
row count is not 192, or when a week 1 class count differs.

The facts:

- Week 1 has 30 rows of list v3: 16 of class A, 2 of class B, and 12 of class C.
- Week 1 output is 30 color files and 30 line-art files. One twin pair comes from one render run.
- Week 1 is due 2026-11-02. Weeks 2 to 7 hold 162 rows and 324 files. They are due 2026-11-16
  and belong to Phase 4.
- Class A and class B render at 4000 x 3000 pixels. Class C renders at 1500 x 1500 pixels.
- The line art has the size of its color twin. It is grayscale with black closed outlines of
  12 px or more. Its file name ends in `-line-v1.png`. Every row has one twin.
- Specification v1 arrived on 2026-10-27. The line art is not provisional.
- The two class B rows of week 1 are the reader covers. Forge renders the B pictures. Workbooks
  keeps the layout and the text.
- Picture list v4 is pending before 2026-11-16. It adds a week 8 review and the Benchmark 1 rows
  for moon, mango, ostrich, and drum. Phase 3 makes no picture for those words.

#### 3.2 The output contract gap (Phase 3 Red and Green work)

The pipeline still holds the specification v0 contract. Phase 3 changes it.

| Item | Today | Specification v1 |
| --- | --- | --- |
| Class A size | `PICTURE_SIZES.story` = 3000 x 2250 | 4000 x 3000 |
| Class B size | `PICTURE_SIZES.cover` = 3600 x 2700 | 4000 x 3000 |
| Class C size | `PICTURE_SIZES.small` = 1500 x 1500 | 1500 x 1500 |
| Line-art name | `<directory>/lineart/<name>-lineart.png` | `<color name>-line-v1.png` beside the color file |
| Twin rows | reader jobs only | every row |
| Job rows | 112 package jobs | 192 list rows, including cover, check-row, and practice-line |
| Line width | no limit | at least 12 px |
| `contract.md` | provisional format text | specification v1 text |

The gap is required Phase 3 work. Red adds failing tests that pin specification v1. Green
changes the pipeline and amends `contract.md`.

Owned paths for the Phase 3 Red and Green work:

- Red and Green: `tests/storytime-book-pictures.test.ts`.
- Green: `src/storytime/book-pictures.ts` and `scripts/storytime-book-pictures.ts`.
- Green: `measure/tracks/asset_storytime_l2_unit1_pictures_20261025/contract.md`.
- Green: the row names come from the list. The pipeline derives no slug for a list row.

The orchestrator reports the contract gap to the PM in the Phase 3 handoff.

#### 3.3 Red and Green split

Three work kinds run in Phase 3.

1. **Pipeline code change.** Red writes the failing rows T142 to T151. Green implements them.
   The gate is `RED_TEST_COMMAND` then `GREEN_TEST_COMMAND`.
2. **Asset work.** A missing cast member, prop, or pose uses the Forge asset loop and
   `./forge check`. It has no vitest row.
3. **Production run.** A render, a pre-check, a manifest, a sheet, and a verify run use the CLI
   through `heavy-run.sh`. It has no new test row.

The Phase 3 RED_TEST_COMMAND and GREEN_TEST_COMMAND are the same command. The orchestrator
passes them to the Red and Green roles as environment variables.

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 3600 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'
```

The check fails when the exit code is not 0, when the run has 0 tests, or when a T142 to T151
row fails. The vitest total must be parsed as a labeled integer.

The Green type check follows the Green gate. It uses its own log file.

```sh
L=measure/runs/asset_storytime_l2_unit1_pictures_20261025/phase3-tsc.log
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json' > "$L" 2>&1
code=$?
echo "tsc exit: $code"
echo "owned tsc errors: $(grep -cE '^(src/storytime/|scripts/storytime-book-pictures\.ts|tests/storytime-book-pictures\.test\.ts)' "$L")"
echo "total tsc errors: $(grep -c 'error TS' "$L")"
```

The check requires zero owned errors and at most 31 total errors.

#### 3.4 Machine limits

- The machine has 7.1 GiB of memory and 4 cores.
- Every render, test, type check, and build runs as one command through `heavy-run.sh`.
  Never nest `heavy-run.sh` inside another `heavy-run.sh` call.
- Every command inside `heavy-run.sh` carries `timeout -k 30 <s>`.
- `heavy-run.sh` stops a job after 5400 s and returns exit 124. A planned longer job sets
  `HEAVY_RUN_TIMEOUT_S` and gives the reason in the plan note.
- Exit 75 means hold. The executor retries the same batch later. A hold is not a failure.
- Plan each batch so it ends well inside 5400 s. A week 1 batch of 4 render runs ends inside
  1200 s. A batch that would pass 3600 s splits into two batches.
- Memory risk: a 4000 x 3000 render holds the color frame, the line-art pass targets, the depth
  texture, and the decoded PNG at once. The color frame alone takes 48 MB. The pass targets and
  the decode add more. One run can push the browser under the headroom bound.
- The memory check runs before each batch:

```sh
free -m | awk '$1=="Mem:" {print "available MB: " $7}'
```

The check fails when the printed value is under 1200. The preflight stops the batch on the same
bound.

- The render check runs after each job. The render log prints `render peak rss mb: <n>`. The
  check fails when `n` is over 4200. A failing job runs alone in the next batch.

#### 3.5 Shared asset drift

- The classroom and the other stages read shared GLBs from `out/<asset>/<asset>.glb`.
- Another track lowered `assets/bookcase.ts` to texture 512 and detail 0.012 and rebuilt
  `out/bookcase/bookcase.glb`. That track restored the file to texture 1024 and detail 0.006.
  The stat file read 512 during the drift window and reads 1024 now.
- A render that reads a stale GLB produces a picture that no longer matches the approved build.
- The pre-render check records the source-build stats of every shared set piece a batch uses.
  The record holds the asset name, the SHA-256 of `out/<asset>/<asset>.glb`, and the source-build
  values from `out/<asset>/stats.json`. The record file is
  `out/storytime/l2/unit1/batches/<batch>-assets.json`.
- The check command:

```sh
node -e 'const s=require("./out/bookcase/stats.json");console.log("bookcase texture size:",s.texture.size)'
```

The expected output is `bookcase texture size: 1024`. The check fails when the value differs from
the approved build. The approved bookcase build has texture size 1024 and detail 0.006.

- RA2-N2 stays a named risk for the line-art look. In smoke run 3 the adjacent bookcase books
  merged into one outline with no spine lines. A page that counts books can fail the person
  look. The Nan sample report names this risk to Daniel.

#### 3.6 The classroom map version

- `out/chibi-sprouts/r1/week1/scenes/classroom-v2.png` does not replace `classroom.png` until
  Daniel decides.
- Phase 3 renders read the stage files. They do not read these PNG files. The PNG files are
  reference renders for human review.
- The map itself is the generated code `scenes/maps/classroom.ts`. A render loads the shared GLBs
  of that map.
- A render proves its classroom map version with three records: the stage file path and its
  SHA-256 in the render evidence, the SHA-256 of `scenes/maps/classroom.ts` in the batch asset
  record, and the SHA-256 of each shared GLB in the same record.
- A render whose stage file names `stage.scene: classroom` used the classroom map. A map change
  needs a new stage file version and a new render version.

#### 3.7 Task gates

**Task 1, Nan window sample. Risk class: medium.**

- The stage file `docs/storytime/l2-unit1/w01/w01-readalong-p05-v2.json` is written first. The
  v1 stage file stays unchanged (Review A RA-P3-1).
- The sample renders at the class A size of specification v1, 4000 x 3000 pixels, from the v2
  stage, with `render --job w01-readalong-p05 --version 2`. Keep v1.
- The render command:

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 1800 node --import tsx scripts/storytime-book-pictures.ts render --job w01-readalong-p05 --version 2'
```

- The green gate runs `verify --job w01-readalong-p05` without `--release`. It exits 0.
- The closeout proof needs all of these:
  - the color file passes the structural checks of its size class;
  - the line-art file passes T28 to T32 and T146 on the real bytes;
  - one evidence record binds both files with one stage hash, one time, and one camera;
  - the render log has the T53 labels and the T142 labels;
  - the plan note quotes both paths and both SHA-256 values, and the report goes to the PM;
  - the plan note states that the picture shows the face, the window panes, and the fern, and
    that no existing item shows the plant in a pot.
- The style look record has `lineArtTechnique` and `lineArtFormatVersion` from the sample
  evidence.
- The task becomes `[b] deferred:daniel-lineart-look` after the report goes to the PM. The
  executor continues with task 2 and later tasks. No line-art twin becomes `ready` before the
  style look record passes. A rejected look starts a new technique version and a new sample.

**Task 2, missing cast, props, and poses. Risk class: medium.**

- The PM approval of the week 1 asset list is recorded in `b63755bc`. Cast rules from that entry
  apply. Describe hair and clothes only.
- The loop is `./forge render <name> --fast`, `./forge inspect <name> --fast`, `./forge all
  <name>`, and `./forge check <name>`.
- Each Forge build is one heavy job:

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 1800 ./forge all <name>'
```

- The green gate is `./forge check <name>` inside `heavy-run.sh`. It prints `result ok`.
- The closeout proof needs a human review with a rating and no `warning:` line in the build log.

**Task 3, the 30 twin renders. Risk class: critical.**

- Each batch holds 4 rows. Each batch is one `heavy-run.sh` call.
- The batch writes its asset stat record before the first render.
- Each render run writes one twin pair. The color file and the line-art file come from the same
  run, the same stage file, the same still time, and the same camera.
- The batch command:

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 3600 node --import tsx scripts/storytime-book-pictures.ts render --week 1 --version 1'
```

- The green gate runs `manifest` and then `verify --week 1` without `--release`. It exits 0.
- The closeout proof needs 30 color files and 30 line-art files, the batch asset records, and a
  `render peak rss mb` value under 4200 for every job.

**Task 4, automated checks and model pre-checks. Risk class: high.**

- The automated checks cover all 60 files.
- Both providers run on every color candidate. MiniMax and Kimi each write a review log.
- One paid call runs at a time. A `before-call` entry comes after the `after-call` entry of the
  call before it.
- A quota check runs before each batch:

```sh
/home/daniebo/.local/bin/ra-quota status
mmx quota show
```

- The batch stops when the quota output shows no room. A stop is not a picture failure.
- The raw model outputs are attached. Each raw file name holds its `callId`.
- A failed picture gets a new twin version. The old files stay.
- Model results are never acceptance. The manifest keeps the evidence class `model-pre-check`.

**Task 5, count review and line-art look. Risk class: high.**

- The PM routes the count review and the line-art look to Daniel or his named reviewer.
- The task becomes `[b] deferred:daniel-or-named-reviewer` when the reviews go to the PM.
- The task stays blocked until 30 color person logs and 30 line-art person looks exist.
- Report a missing log to the PM on 2026-10-31.

**Task 6, delivery. Risk class: medium.**

- The manifest lists the 30 color files and the 30 line-art files with their SHA-256 values.
- The contact sheet shows each twin pair side by side. It leaves every candidate byte-identical.
- The ledger and the review logs travel with the manifest.
- The plan records the output path and every open gate for the PM.

#### 3.8 Human gates

- The line-art look belongs to Daniel. The PM relays it.
- The count review belongs to Daniel or his named reviewer. The PM routes it.
- A model pre-check never replaces either gate. A person log needs a named `checkedBy` and the
  evidence class `owner-passed` or `person-checked`.
- A line-art twin becomes `ready` only with the format checks, a bound color twin, a passing
  person look, and a passing style look with the evidence class `owner-passed`.
- The two deferral markers stay. `[b] deferred:daniel-lineart-look` covers the style look.
  `[b] deferred:daniel-or-named-reviewer` covers the count review. Both cover 30 color files and
  30 line-art files.

#### 3.9 Phase 3 closeout gate

- `verify --release --week 1` exits 0 and prints
  `Verification passed for 30 jobs with release evidence.`
- The exact text must match. A count other than 30 fails the gate.
- If the style look is still pending, `verify --release --week 1 --output color` must exit 0, and
  the plan records the line-art gate as open. The plan does not claim the line art is ready.
- An independent `sha256sum` matches each manifest file hash. The check reads the manifest and
  the file, and it computes the hash outside the pipeline.
- The ledger has equal `before-call` and `after-call` counts. The check parses both labels and
  compares two integers.
- Every row of week 1 has a color file, a line-art file, a person log, and two model logs.
- `./measure/generate.sh` runs after the plan status changes.

#### 3.10 Review applicability

| Review | Phase 3 | Reason |
| --- | --- | --- |
| Review A (correctness) | Applies | The list loader, the size classes, the file names, and the twin rule change the output contract. A row can lose its twin or its size. |
| Review B (security) | Applies | The list is read only. The ledger, the raw model outputs, and the review logs must hold no credential. |
| Review C (UX and API) | Applies | The CLI gains list-driven names and a new release gate. The error text names the failing row. |
| Adversarial testing | Required | Change one byte of a list row, one line-art pixel to 128, and one manifest hash. Each change must fail a named check. |
| UX browser review | Does not apply | The output is picture files. The human review is the count review and the line-art look. The browser shows no new UI. |

#### 3.11 New test rows for Phase 3

Rows T1 to T141 stay unchanged. The Phase 3 rows go into
`tests/storytime-book-pictures.test.ts`.

| ID | Behavior | Falsification condition (the test fails if ...) |
| --- | --- | --- |
| T142 | The picture list loader reads `pictures.json` read-only. It gives 192 rows. Week 1 gives 30 rows: 16 of class A, 2 of class B, and 12 of class C. The loader records the SHA-256 of the list file. | a count differs, the loader reads another week, or a byte of the list file changes. |
| T143 | The size class of a row gives the pixel size. Class A gives 4000 x 3000, class B gives 4000 x 3000, and class C gives 1500 x 1500. The row width and height equal the class size. | 3000 x 2250 or 3600 x 2700 passes, or a row width differs from its class. |
| T144 | The color file name of a row equals the list `fileName`. The line-art file name equals the list `lineArtFileName`, ends in `-line-v1.png`, and sits beside the color file. | a `-lineart.png` name passes, a name in a `lineart/` directory passes, or a name differs from the list. |
| T145 | Every row of week 1 gets a color file and a line-art file. The 30 rows hold 16 story pages, 2 covers, 9 check rows, and 3 practice lines. A cover row, a check-row row, and a practice-line row each get a twin. | any row has no twin, or a row count differs from 30. |
| T146 | The line-art check rejects a line thinner than 12 px. A fixture with a 6 px line fails. A fixture with a 12 px line passes. The check prints the measured width. | a 6 px line passes, a 12 px line fails, or the check uses a tolerance. |
| T147 | The pipeline never writes to the Workbooks tree. The SHA-256 of `pictures.json` and of `pictures.md` is the same before and after a run. | a byte of either file changes. |
| T148 | The pipeline refuses a row whose file name breaks the pattern `^l2-w\d{2}-[a-z-]+-v\d+\.png$`. It refuses a list file whose SHA-256 differs from the recorded one. | a broken name or a changed list file is accepted. |
| T149 | A class B row runs the calm top 30 percent check. A class C row runs the white-corner check. The calm fixture passes and the busy fixture fails. | a busy cover passes, a dark-corner class C picture passes, or both fixtures get one result. |
| T150 | The week 1 selection holds 30 rows. The manifest lists 30 color files and 30 line-art files. The color batch hash and the line-art batch hash differ when one file changes. | the selection holds 16 rows, a file is missing, or one batch hash moves with the other. |
| T151 | The render command prints `render peak rss mb: <n>` after each job, as a labeled integer. The value comes from the capture process. | the label is missing, the value is not an integer, or the value comes from another process. |

#### 3.12 phase_base_sha capture point

1. The Phase 3 strategy commit lands first.
2. Immediately after that commit, the orchestrator runs `git rev-parse HEAD` and records that
   committed value as the immutable Phase 3 `phase_base_sha`.
3. The orchestrator captures the value before any Red edit or commit.
4. This strategy embeds no SHA for that base. It names none.
5. The Phase 2 `phase_base_sha` stays `1d39b8fd`. The Phase 3 base is a new value.

### Phase 4: Remaining pictures and cover

Risk class: **medium**. The gates exist after Phase 3. The cover calm-region check and the volume
of 162 rows are the new risks.

- Task 1 becomes `[b] deferred:workbooks-via-pm` at Phase 4 start if the final picture list (due
  2026-10-28) is missing.
- Task 1 also applies picture spec v1 to the line art. Use `RED_TEST_COMMAND` for each new
  line-art rule (size, color depth, line weight). A rename changes only names and records the old
  name. A format change needs a new `lineArtFormatVersion` and a new twin render.
  Replaced by the amendment of 2026-11-01 (Muse path). The Muse line art comes from the approved
  Muse color picture, and `inspectLineArtPng` checks the print.
- Use `RED_TEST_COMMAND` for a size or crop change from the final list. Record each resize or crop.
- Weeks 2 to 7 get 162 line-art twins with the same line-art gates.
  Replaced by the amendment of 2026-11-01 (Muse path). The twins come from the approved Muse
  color picture. The gates are G3 to G6 in 4.5.
- If spec v1 sets a larger print size or the A3 ratio (about 1.414:1), render the pages again from
  the kept stage files as new versions (T41). A new ratio changes the framing, so all picture
  gates apply again to each new version.
  Replaced by the amendment of 2026-11-01 (Muse path). No stage file render exists. The Muse
  print step crops or pads and enlarges to the list size.
- Person counts and line-art looks become `[b] deferred:daniel-or-named-reviewer` when they are
  the only missing evidence.
- Treat `verify` and `sheet` on more than 30 pictures as heavy. Run them under the preflight and the lock.
  Replaced by the amendment of 2026-11-01 (Muse path). Muse calls need no lock and no slot. Vitest,
  tsc, and `deliver` still run through the heavy runner.
- Closeout gate: `verify --release` for 192 rows, their 192 line-art twins, and the cover exits 0.
  The manifest has no `failed` or missing release candidate.
  Replaced by the amendment of 2026-11-01 (Muse path). See the closeout gate in 4.8.

The Phase 4 text above describes the 3D render path. The amendment of 2026-11-01 replaced that
path with the Muse path. Read the subsection "Phase 4 under the Muse path (2026-11-02)" below.
Where the subsection and the text above differ, the subsection applies.

#### Phase 4 under the Muse path (2026-11-02)

Revision: written at `60892a38` (the HEAD when this subsection was written). Risk class stays
**medium** for the code tasks (Task 1, the week delivery change, the stage check) and becomes
**high** for the production tasks (weeks 2 to 7 and the cover). The production tasks make 162
paid picture rows on a deadline of 2026-11-16, and a wrong picture reaches print.

Deviation recorded: Phase 4 starts before Phase 3 acceptance. Phase 3 has one open task, the
person review of week 1 by Daniel. The week 1 delivery is done
(`out/storytime/l2/unit1/w01/delivery-muse-v1/`, `manifest.json` SHA-256
`00ea0c5b06d18e3f54cbceed9caa943100c0711bb515c44561eb46b7e03ed369`). Task 1 and the staging do not
depend on that review. The production of weeks 2 to 7 does depend on it (see 4.5).

##### 4.1 Facts this subsection fixes (checked 2026-11-02)

| Fact | Value |
| --- | --- |
| Live list (read only) | `/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json`, version 4, Workbooks commit `87ecc6aa` |
| SHA-256 of `pictures.json` (v4) | `6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58` |
| SHA-256 of `pictures.md` (v4) | `7cc4c20178abbddae3ae0904b9e0e08ced09c6e95d6f9e365fcce932cf81ad56` |
| SHA-256 of `pictures.json` (v3 shadow copy) | `c3e23cfdace136c7ed602b3aefee83383241833537ba56f0257668eb1e2c686b`, at `/tmp/opencode/wb-shadow/content/storytime/l2/print/pictures.json` |
| Rows | v4: 196 (A 112, B 14, C 70). v3: 192 (A 112, B 14, C 66) |
| Rows per week (v4) | week 1: 30; weeks 2 to 7: 27 each; week 8: 4 |
| Rows per week and class | weeks 1 to 7: A 16, B 2, C 9 (week 1: C 12). Week 8: C 4 |
| Weeks 2 to 7 together | 162 rows: A 96, B 12, C 54. Uses: 96 story-page, 12 cover, 54 check-row |
| Difference v3 to v4 | 4 added rows, 0 changed rows. The added ids: `l2-w08-check-row-moon`, `-mango`, `-ostrich`, `-drum` (class C, 1500 x 1500) |
| The four renamed ids (renamed in v3) | `l2-w02-story-page-nan-can-b`, `l2-w02-story-page-can-i-b`, `l2-w02-story-page-i-can-b`, `l2-w06-story-page-tap-tap-tap-b` (the suffix was `-a`) |
| Old `-a` ids in `src`, `tests`, `scripts`, `docs`, `jobs.json`, and Workbooks `l2` | none found |
| Size specification v4 | class A and class B: 4000 x 3000. Class C: 1500 x 1500. The same as v3 |
| Loader | `loadPictureList` accepts week 8 (`week` is a positive integer). The `render` and `verify` row commands pin v3. The `--week` parser (`book-pictures.ts` line 4615) refuses a week above 7, so `--week 8` fails today |
| Highest test number at the base | `T172` in `tests/storytime-muse-delivery.test.ts`; `T151` in `tests/storytime-book-pictures.test.ts` |

The check commands and their expected output:

```sh
P=/home/daniebo/Desktop/Workbooks/content/storytime/l2/print
sha256sum "$P/pictures.json" "$P/pictures.md"
node -e 'const d=require(process.argv[1]);const f=(a)=>a.length;const w=(n)=>d.filter(r=>r.week===n);const m=d.filter(r=>r.week>=2&&r.week<=7);const k=(a,c)=>a.filter(r=>r.sizeClass===c).length;console.log("rows",d.length,"week1",f(w(1)),"week8",f(w(8)),"weeks2to7",f(m),"A",k(m,"A"),"B",k(m,"B"),"C",k(m,"C"),"renamed",d.filter(r=>/^l2-w0[26]-story-page-(nan-can|can-i|i-can|tap-tap-tap)-b$/.test(r.id)).length)' "$P/pictures.json"
```

Expected output: `rows 196 week1 30 week8 4 weeks2to7 162 A 96 B 12 C 54 renamed 4`. The check fails when a
hash differs, when a count differs, or when the renamed count is not 4.

##### 4.2 Task 1: reconcile the list (version 4 pin, ids, counts, sizes, week 8)

Task 1 owns `src/storytime/book-pictures.ts`, `tests/storytime-book-pictures.test.ts`,
`tests/storytime-picture-rows.test.ts` (if a pin sits there), and the `contract.md` list facts.
Task 1 does not touch any file of the staging (4.3).

Scope default for the four week 8 rows: they stay out of the 162-row production scope. Task 1
makes the loader, the pin, and the selection accept them. Nobody renders them until the PM
assigns them. The question goes to the PM in the `handoff` line.

**Red tests.** Red changes two committed tests and adds five. Red numbers the new tests from
`T173`. Red confirms the next free number with
`grep -ho "it('T[0-9]*" tests/storytime-*.test.ts | sort -u | tail -3`.

| Test | Assertion | Falsification condition | State at the base |
| --- | --- | --- | --- |
| T142 (changed) | The loader reads the live list: `List rows` is 196, week 1 holds 30 rows (A 16, B 2, C 12), `List SHA-256` is the v4 value. | The test passes with 192 rows or with the v3 hash. | red |
| T147 (changed) | `LIST_SHA256` is the v4 value and `LIST_MARKDOWN_SHA256` is `7cc4c201...ad56` (full value in 4.1). The Workbooks digests are the same before and after a run. | A byte of either Workbooks file changes, or a v3 value passes. | red |
| T173 | The constant is named `PICTURE_LIST_SHA256` and holds the v4 value. The `render --dry-run` and `verify` row commands accept the live list. The same commands refuse the v3 shadow bytes with the text `The picture list changed: expected SHA-256 6d05dfc5...`. `PICTURE_LIST_V3_SHA256` is no longer exported. | The v3 bytes pass, the v4 bytes fail, or two constants coexist. | red |
| T174 | Labeled counts of the live list: `List rows: 196`, week 1 to 7 per week and class (4.1), `Weeks 2 to 7 rows: 162`, `Weeks 2 to 7 class A: 96`, `class B: 12`, `class C: 54`, `Week 8 rows: 4`. | Any label is missing, a count is taken from the v3 shadow copy, or the test passes on any digit. | guard (passes) |
| T175 | The four renamed ids are in the list. No id ends in `-a` where a `-b` twin exists. For each of the four ids, `fileName` is `<id>-v1.png` and `lineArtFileName` is `<id>-line-v1.png`. | A `-a` id is accepted, a `-b` id is missing, or a file name is derived by slug. | guard (passes) |
| T176 | Every one of the 196 rows has the size of its class: A and B 4000 x 3000, C 1500 x 1500. The row `width` and `height` equal that size. Existing T143 keeps the v0 size refusal. | One row with 3000 x 2250 or 3600 x 2700 passes, or only week 1 rows are checked. | guard (passes) |
| T177 | The `--week` parser accepts 8 and still refuses 0 and 9. `--week 8` selects exactly 4 rows. No `--week` selects 196 rows. The weeks 2 to 7 selection helper returns 162 rows and no week 8 row. | The 162 count is computed from all rows (196) or from `week > 1` (166), week 8 leaks into the weeks 2 to 7 selection, or the parser accepts 9. | red (the pin and the parser refuse) |

**Mutation proof for the guard tests (Green runs them, each mutation restored).** (1) In a copy of
the list, change one id from `-b` to `-a`: T175 must fail. (2) In a copy, set one row height to
2250: T176 must fail. (3) In a copy, drop one week 2 row: T174 must fail. (4) Delete the `week 8`
filter branch: T177 must fail. A guard test that survives its mutation is a vacuous pass (A4).

**Callers of the old pin (Green updates every one).** The grep
`grep -rn "PICTURE_LIST_V3_SHA256\|c3e23cfd" src tests scripts` must show no live use:

- `src/storytime/book-pictures.ts` line 3568 (the constant) and line 4754 (the `render` and
  `verify` row commands, `expectedSha256`).
- `tests/storytime-book-pictures.test.ts` line 4039 (`LIST_SHA256`), line 4188 (T142), line 4311
  (T147), and line 4179 (`List rows` 192).
- `measure/tracks/asset_storytime_l2_unit1_pictures_20261025/contract.md` line 9 (the SHA and the
  row count 192). Green writes v4 there and keeps v3 as one history line.
- The `deliver` command (line 4728) reads the list with no pin. It uses the pin of the approval
  list (`pictureListSha256`). Green must not add a second pin there.

The v3 hash may stay in the tests only as the labeled negative control of T173.

RED_TEST_COMMAND (Phase 4, Task 1 and the delivery week change):

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts tests/storytime-picture-rows.test.ts tests/storytime-muse-delivery.test.ts --maxWorkers=1'
```

GREEN_TEST_COMMAND (Phase 4, Task 1 and the delivery week change): the same command, then the type
check of section 3 (`TASK9_TYPECHECK_COMMAND` form, `tsc --noEmit -p tsconfig.json` through
`heavy-run.sh`).

Expected Red result for Task 1: exit code `1`. The line `Tests  <f> failed | <p> passed (<t>)`
gives `f >= 1`. The expected value is `f = 4`: T142, T147, T173, and T177. The Red role parses `f`
as a labeled integer and names every failing test. A failure that comes from a missing import or a
syntax error for the whole file is not Red (A4). Each failure message must name a labeled
expectation. A `heavy-preflight` hold or exit code `75` is not Red.

Expected Green result: exit code `0`, `Tests  <t> passed (<t>)` with `t` equal to the Red total, no
skip, no `-t` filter. The type check gives `owned tsc errors: 0` and a total of 38 or less (the
total at the Muse delivery Green was 38). The owned pattern also matches
`src/storytime/muse-delivery.ts` and `tests/storytime-muse-delivery.test.ts`.

Architecture guardrails: Task 1 changes no file under `/home/daniebo/Desktop/Workbooks`. Task 1
adds no hash field or hash chain (the monorepo rule). The row commands may keep their names. The
approval list pin of week 1 (`approved.json`) already holds the v4 value and stays unchanged.
Changed-contract risk: the `render` and `verify` row commands now accept the v4 list and refuse
the v3 list. No Phase 4 task uses these commands for production, because the Muse path does not
render 3D rows.

##### 4.3 Staging gate for week 2 (inputs only, no page candidate)

Staging runs in parallel with Task 1. The two do not share a file. Staging owns:
`docs/storytime/l2-unit1/w02/muse/*.json` (27 page specs and any cast spec),
`out/storytime/l2/unit1/w02/muse/elements/`, `scripts/storytime-stage-check.mjs`, and
`tests/storytime-stage-check.test.ts`. Task 1 owns the other files. Both tasks run vitest, so the
heavy lock puts them in one line. Neither task commits a path of the other.

Staging inputs: character renders (the approved looks of Pat, May, Sam, Mia, Ben, Nan, Pip, and
Teacher Kim), prop renders, the empty park set render, and one page spec per row. Existing assets
cover some props (`pond`, `beam`, `basket`). Missing props (for example the climbing frame, the
slide, the kites, the cupcakes, the picnic blanket) need a render or a prop sheet. Staging
makes **no** Muse call for a page. Staging may call Muse for an element sheet only (see below).

Cast sheets. A Muse cast sheet for a character with no approved look is allowed during staging.
It is an input, never a page candidate. The call goes to `costs.tsv` with `usage_cost`. The sheet
describes hair and clothes only. The status is `pending look` until the PM relays Daniel's look
approval. A page spec must not reference a `pending look` sheet in a production call. Week 2 needs
no new character: all eight week 2 characters have a look (six 3D sprouts, Pip, and the Teacher
Kim Muse sheet from week 1, whose look is part of the open week 1 review). Weeks 4 to 7 add Lily,
Mom, Dad, Grandma, Grandpa, and Tom. These have no look yet. Their cast sheets belong to those
weeks and follow the same rule.

STAGING_GATE_COMMAND (light job, no heavy lock, exit 0 required):

```sh
node scripts/storytime-stage-check.mjs --week 2 --list /home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json --specs docs/storytime/l2-unit1/w02/muse
```

The script reads the list read only. It refuses a list whose SHA-256 is not the v4 value (exit
`2`). It prints these labeled lines, one per line, and exits `0` only when all hold:

```text
list sha256: 6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58
week: 2
rows: 27
specs found: 27
text mismatches: 0
goal mismatches: 0
outDir mismatches: 0
rows with no reference (class A and B): 0
element paths checked: <n>
missing element paths: 0
characters without a reference: 0
page candidates: 0
stage check: pass
```

Rules of the check:

- `specs found` counts files named `<row id>.json` for each of the 27 rows. A spec with an `id`
  that is not a row id of the week is an error.
- `text mismatches` and `goal mismatches` compare the spec `text` with the list `text`, and the
  spec `goal` with the list `prompt`, as exact strings (no trim, no case change, no `includes`).
- `outDir` must equal `out/storytime/l2/unit1/w02/muse`.
- Each class A and class B spec has one reference or more. `element paths checked` is the total
  number of reference paths. It must be 18 or more (18 class A and class B rows). A value of 0
  fails (A4).
- Each reference is a repository-relative regular file, not a symbolic link. The path must not
  contain `..` and must sit under `out/` or `docs/`. The file size is above 0 and the first bytes
  are the PNG signature.
- `characters without a reference` counts the names in the spec goal (Pat, May, Sam, Mia, Ben,
  Nan, Pip, Kim) that have no matching element. A name matches a reference whose file name holds
  the lower-case name, or one of the two group sheets that the script lists for that name.
- `page candidates` counts files `<row id>-m*` in the output folder. It must be 0 during staging.
  Cast sheet files and element files do not use a row id, so they do not count.
- The spec holds a non-empty `colorPrompt` and `linePrompt`. A row id with a trailing `-a` where
  a `-b` row exists is an error.

STAGING_TEST_COMMAND (Red and Green of the script, fixtures in a temp folder):

```sh
bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-stage-check.test.ts --maxWorkers=1'
```

| Test | Assertion | Falsification condition |
| --- | --- | --- |
| T178 | A fixture week of 3 rows with specs, elements, and the list passes. Every label is printed with its exact value. | A label is missing, or the run passes with `element paths checked: 0`. |
| T179 | Each mutation exits `1` and names the row: delete one spec; change one character of `text`; change one character of `goal`; add a trailing space to `goal`; point one reference to a missing file; empty the references of a class A row; use a `..` path; use a symbolic link; change `outDir`; add a `<row id>-m1-color.png` file. | One mutation passes, or the check trims the trailing space. |
| T180 | A list whose SHA-256 is not the v4 value exits `2`. The v3 shadow bytes are refused. | The v3 list passes. |

Red for the script: the test file exists and the STAGING_TEST_COMMAND gives `f >= 1` (T178 to T180
fail because the script does not exist). The live STAGING_GATE_COMMAND exits non-zero before the
specs exist. Green: the test command exits 0 with a labeled total, and the live command exits 0
with every label above. The Green quotes the full label block in the plan.

Live behavior proof for staging: the live command on the real 27 specs and the real element files.
The vitest fixtures prove the logic only (artifact test). The week 2 specs are documents. A passing
check proves that the inputs exist and match the list. It proves nothing about picture quality.

Staging for weeks 3 to 7 repeats this gate with `--week N` before the production of that week.

##### 4.4 Delivery of a week other than week 1 (Task 2 prerequisite)

The writer `writeMuseDelivery` and the `deliver` command do not hard-code week 1. The manifest job
directory comes from `row.week` (`w02`), so the batch ids are `w02/color` and `w02/lineart`. The
`deliver` command prints one `Skipped <row id>` line for each of the other 169 rows of the list.
The `deliver` command ignores `--week`, and an approval entry of another week is not refused. Red
and Green make `deliver` use `--week <n>` (the parser exists and Task 1 widens it to 8) and add two tests in `tests/storytime-muse-delivery.test.ts` (the Phase 4
RED_TEST_COMMAND and GREEN_TEST_COMMAND run that file):

| Test | Assertion | Falsification condition |
| --- | --- | --- |
| T181 | A week 2 fixture (27 rows: A 16, B 2, C 9) delivers 27 jobs and 2 batches (`w02/color`, `w02/lineart`). File names are the list names. Class sizes hold. A second run gives the same bytes. | The manifest has other batch ids, a size is wrong, or a second run differs. |
| T182 | With `--week 2`, an approval entry of week 3 exits `1` and writes nothing. The `Skipped` lines name only week 2 rows. The week 1 delivery test T152 to T172 stays green. | A week 3 entry is delivered, or the output folder holds a file after the refusal. |

Week delivery folders: `out/storytime/l2/unit1/w0N/delivery-muse-v1/`. The approval list of a
week is `docs/storytime/l2-unit1/w0N/muse/approved.json` with `pictureListSha256` set to the v4
value. A new delivery of a changed week goes to `delivery-muse-v2`. Nothing overwrites a folder (S3).

##### 4.5 Production gates for weeks 2 to 7 (Muse path)

Start condition. The orchestrator starts a page candidate of week 2 only after the PM relays
Daniel's answer on week 1. Staging (4.3) comes first. Weeks 3 to 7 start in order after the same
answer; Daniel's bar may change the prompts. A rule change from that answer updates the specs of
every later week before its staging check.

The bar for every page is Daniel's text of 2026-11-01 at 14:15 ICT, quoted verbatim in every
review prompt: marks of that size are not defects (a small mark at the nose, an open C-shaped ear
line, outlined eyebrow bands, small dark shading inside the ears, a simplified branch or bush). A
defect is only what a teacher or a child sees at book size: a wrong or changed character, a
broken face, a clearly wrong hand or limb, a wrong or missing prop the sentence needs, a layout
fault, text in the picture, gray or shading in the line art, or a line gap that makes coloring
hard. Foreshortening is correct.

For each week W the gates run in this order. Each gate has a command or a record and a
falsification condition.

| Gate | Command or record | Falsification condition |
| --- | --- | --- |
| G1 Staging | STAGING_GATE_COMMAND with `--week W`: exit 0, all labels. | A spec or an element is missing and the production still starts. |
| G2 Muse calls | `node scripts/storytime-muse.mjs` for each row (4 at a time, no lock, no slot). Each call has one line in `out/storytime/l2/unit1/w0W/muse/costs.tsv` with `usage_cost`. A retry needs a named real defect. | A call has no cost line, or a retry has no defect note. |
| G3 Independent vision review | One review batch for the week. The reviewer is a vision model of another family than the builder (the image model is Meta Muse; the reviewer is not Meta and is not the model that drives Green). The prompt holds the bar above, the row goal, the color print, and the line print. The result is JSON per row: `verdict` (`clean` or `defect`) and `defects`, each with one category from the bar. | A row has no verdict, a `clean` row has a defect, a defect has a category outside the bar, or the control rows fail (below). |
| G3 control rows | Each review batch holds three controls from week 1: (1) a delivered clean page, which must be `clean`; (2) a rejected try with a known defect (for example `cover-hello` m1, Pat facing the camera, or a line try with speckle) , which must be `defect`; (3) a page with only a small mark of the bar (a nose mark or an open C ear), which must be `clean`. | The reviewer says `clean` for control 2 (it passes everything), or `defect` for control 3 (it flags small marks). The batch is void and runs again. |
| G4 Orchestrator spot check | The orchestrator reads at full size: every class B page, every page that had a retry, and at least 5 other pages of the week (at least 1 of each class). The record lists the row ids. | The record lists fewer than 5 other pages or omits a class B page. |
| G5 Print checks (writer rules) | `deliver` runs every check before its first write: PNG format, class size, no alpha for color; `inspectLineArtPng` for line (size, 8-bit gray, only the values 0 and 255, line width). The PM accepted white pad bands on `cover-hello` and 8-bit gray PNGs with only 0 and 255. | A line print with a pixel of 254 passes, a color print of the wrong size passes, or a pad band is refused after the PM acceptance. |
| G6 Delivery | `node --import tsx scripts/storytime-book-pictures.ts deliver --week W --list <v4 list> --approvals docs/storytime/l2-unit1/w0W/muse/approved.json --muse out/storytime/l2/unit1/w0W/muse --delivery out/storytime/l2/unit1/w0W/delivery-muse-v1` through the heavy runner. Exit 0 and `Delivered 27 rows and 2 batch hashes`. The orchestrator then re-hashes: each delivered file equals its approved Muse print by `sha256sum`, and the manifest hashes equal the file hashes. | Exit is not 0, the job count is not 27, one byte differs, or a manifest hash differs from `sha256sum`. |
| G7 Person review | The PM relays the text of Daniel's answer. The record holds person, time, rows, verdict, and note (Tasks). | A row gets a `reviews.person` field without a relayed answer, or a row that the answer does not name becomes "person-checked". |
| G8 Cost report | `usage_cost` total of the week and the running total, as labeled numbers: `usage.cost total (USD): <x>`. | A call in `costs.tsv` has no `usage_cost`, or the report total differs from the sum of the file. |

Only clean rows go into the manifest (contract decision 2). A row that has an open defect gets no
approval entry and no job. The delivery report lists such rows with their defects.

Class C rows (check rows) have no multi-character scene. Their G3 question adds: the object of the
word is the only object, and the count equals `objectCounts`.

The 162-row count gate (after the sixth delivery):

```sh
node -e 'const fs=require("fs");const L=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));const want=new Set(L.filter(r=>r.week>=2&&r.week<=7).map(r=>r.id));const got=new Set();let jobs=0,files=0;for(let w=2;w<=7;w++){const d="out/storytime/l2/unit1/w0"+w+"/delivery-muse-v1";const m=JSON.parse(fs.readFileSync(d+"/manifest.json","utf8"));jobs+=m.jobs.length;for(const x of m.jobs)got.add(x.id);files+=fs.readdirSync(d).filter(n=>n.endsWith(".png")).length}const c={A:0,B:0,C:0};for(const r of L)if(got.has(r.id))c[r.sizeClass]++;console.log("weeks 2 to 7 delivered jobs:",jobs,"files:",files,"A:",c.A,"B:",c.B,"C:",c.C,"missing:",[...want].filter(x=>!got.has(x)).length,"extra:",[...got].filter(x=>!want.has(x)).length)' /home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json
```

Expected output: `weeks 2 to 7 delivered jobs: 162 files: 324 A: 96 B: 12 C: 54 missing: 0 extra: 0`. A re-delivery
folder (`delivery-muse-v2`) replaces `delivery-muse-v1` in the command for that week. The command
fails when a week is missing (the read throws), when a week 8 id appears (`extra` above 0), or
when a count differs. The "162" claim always reads this output. It never comes from a `week > 1`
filter (that gives 166).

Live behavior proof: the G2 paid calls, the G3 review, and the G6 deliveries are live. Vitest
proves the writer and the check logic only. The documents (specs, approval lists) are artifacts.

##### 4.6 Cover gate (S19)

The Level 2 cover is one picture. It is not one of the 14 reader covers (class B rows of the
list). The list has no row for it. Layout and text stay with Workbooks (S19). Forge makes the
picture only. Before the cover starts, the PM must give the row name, the size, and the cover goal.
Default: class B size 4000 x 3000, file `l2-cover-v1.png`, a color picture only (no line twin).
The question goes to the PM in the `handoff` line.

The cover follows the Muse path: one page spec `docs/storytime/l2-unit1/cover/muse/l2-cover.json`
with the `outDir` `out/storytime/l2/unit1/cover/muse`. The spec goal says: the top 30 percent is
calm (sky, wall, or soft background; no character, no prop, no text); the title stays with
Workbooks. Gates:

| Gate | Command or record | Falsification condition |
| --- | --- | --- |
| C1 Calm top (mechanical) | Task Red and Green apply the existing calm-top rule (`calmTopOnRaw`, a region that differs from its dominant color on at most two percent of its pixels) to the cover print. The check reads the top 900 rows of the 3000-row print. It prints `top 30 percent differing share: <x>` and `top 30 percent rows: 900`. A value above 0.02 fails. Test `T183` in `tests/storytime-book-pictures.test.ts`: busy top fails, calm top passes, a 1-row-off band fails. | A busy top passes, a calm top fails, or the check reads another band. |
| C2 Independent vision review | Same as G3 with the cover question added: "Is the top 30 percent calm: no character, no prop, no text?" The controls of G3 apply. | The reviewer passes a cover with a character in the top band (a control cover with a focal prop in the top 30 percent must be `defect`). |
| C3 Spot check | The orchestrator reads the cover at full size. | No record. |
| C4 Print and delivery | PNG, class size, no alpha. The cover is delivered with the PM-named file name in `out/storytime/l2/unit1/cover/delivery-muse-v1/` with a manifest in the contract shape. | A wrong size or an alpha channel passes. |
| C5 Person review | The PM relays Daniel's answer. The record is as in G7. | A person field without a relayed answer. |

The reader covers (12 class B rows in weeks 2 to 7) use G1 to G8. The calm-top rule does not
apply to them: the PM accepted `cover-hello` with its layout, and the cover layout belongs to
Workbooks.

##### 4.7 Anti-pattern coverage for Phase 4

`measure/anti-patterns.md` does not exist. The catalog is
`~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`. A1 and A8 are retired.

| Class | Task | Defense | Falsification condition |
| --- | --- | --- | --- |
| A2 consent-blind publish gate | G7, C5 | A row is person-checked only with a relayed answer (person, time, rows, verdict, note). The approval entry gets `reviews.person` only from that record. | A row becomes person-checked, or a manifest holds a person review, with no relayed answer. |
| A3 digit-only count | Task 1, G6, the 162 gate | Labeled integers only: `rows 196 week1 30 week8 4 weeks2to7 162 A 96 B 12 C 54 renamed 4`; `weeks 2 to 7 delivered jobs: 162 files: 324 ...`; `Tests  N passed (N)`; `owned tsc errors: 0`; the staging labels. | A date, a path digit, or an unlabeled number satisfies a gate. |
| A4 vacuous pass | all | Red needs `f >= 1`. The guard tests T174 to T176 have mutation proofs. `element paths checked` must be 18 or more. The three G3 controls prove the reviewer can fail a page. The count gate has `missing: 0 extra: 0`. | An empty week, a staging check with 0 elements, a reviewer that passes every page, or a delivery with 0 jobs passes. |
| A5 false claim | all | Plan notes quote the command, the exit code, and the labeled values. A model review is "independent review", never "accepted". | A plan claim differs from the quoted output. |
| A6 registry overstatement | G7, C5, closeout | The registry and the metadata say "delivered, awaiting person review" until the relayed answer exists. | The registry says "accepted" for a week with no person record. |
| A7 over-broad filter | staging, G3, G5 | The text and goal compare is exact (T179 trailing space). The reviewer prompt uses the bar: control 3 proves a small mark is not a defect. The line check has no tolerance (a pixel of 254 fails). | A trimmed compare passes a changed goal, a small nose mark is flagged, or a gray pixel passes. |
| A9 archived track paths | Task 1, staging | The new tests read `src/` and the read-only list. They name no `measure/tracks/` path. The stage check reads `docs/` and `out/` only. | `grep -n 'measure/tracks/' tests/storytime-book-pictures.test.ts tests/storytime-stage-check.test.ts` prints a line. |
| A10 generated-facts drift | closeout | Run `./measure/generate.sh` after each plan status change. | Managed facts differ from the plan. |
| A11 doc-to-code drift | Task 1 | `contract.md` line 9 and the plan text name the v4 SHA that the code pins. The grep in 4.2 shows no live v3 use. | A document names a pin that the code does not hold. |

Project candidates for a future `measure/anti-patterns.md`: (S14) a reviewer that passes every
page (answer: the control rows of G3); (S15) a week count built from `week > 1` that includes week
8; (S16) a delivery folder overwritten by a later run; (S17) a spec `goal` edited by hand so that
it no longer equals the list prompt.

##### 4.8 Review applicability and the Phase 4 closeout gate

| Review | Applies | Scope |
| --- | --- | --- |
| Review A (correctness and architecture) | Yes, on the code changes | Task 1 (pin, selection, tests), the `deliver --week` change, `scripts/storytime-stage-check.mjs`, and the cover calm-top call. A short delta check is enough for the pin rename. |
| Review B (security) | Yes, on the code changes | The list stays read only. The stage check refuses `..` paths, symbolic links, and paths outside `out/` and `docs/`. The spec `outDir` stays inside `out/`. No API key or token appears in `costs.tsv`, a spec, a review log, or a manifest. |
| Review C (UX and API) | Yes | The `--week` option, the stage check labels and exit codes (0, 1, 2), the error text that names a row, the manifest shape that Workbooks reads (version 1, `job.id` is the row id, names from the list), the week 8 default. |
| Adversarial testing | Required | Task 1: the mutations of 4.2 and one changed byte in the list. Staging: the T179 list. Delivery: a color file of another row, a line pixel at 254, a changed manifest hash, a week 3 entry in a week 2 run. Production: the G3 controls. |
| UX browser review | Not applicable | The output is picture files and CLI text. The independent picture review (G3) is a picture review, not a browser review. |

Phase 4 closeout gate (all must hold; the plan quotes each output):

1. GREEN_TEST_COMMAND exits 0 with a labeled total, and the type check shows `owned tsc errors: 0`
   and a total of 38 or less. Reviews A, B, and C have no blocking finding.
2. `grep -rn "PICTURE_LIST_V3_SHA256\|c3e23cfd" src tests scripts` shows only the T173 negative
   control. `contract.md` names the v4 SHA.
3. STAGING_GATE_COMMAND exited 0 for each of the weeks 2 to 7 before that week started.
4. Six week deliveries exist (`deliver` exit 0, 27 jobs each) and the 162-row count command prints
   `weeks 2 to 7 delivered jobs: 162 files: 324 A: 96 B: 12 C: 54 missing: 0 extra: 0`.
5. For each week: a complete G3 review (27 verdicts, controls passed), a G4 record, and a G7
   record. A week without a G7 record is listed as "delivered, awaiting person review" and the
   task for that record is `[b] deferred:daniel-or-named-reviewer`. The closeout never says
   "accepted" for it.
6. The cover is delivered and C1 to C4 pass. The C5 record exists or is deferred as in item 5.
7. The week 8 rows are recorded as out of scope, or as assigned by the PM.
8. The cost report gives `usage.cost total (USD)` per week and the running total.
9. `./measure/generate.sh` exits 0. `./measure/doctor.sh` runs in Phase 5.

The old closeout gate (`verify --release` for 192 rows and their 192 line-art twins) is replaced.
Replaced by the amendment of 2026-11-01 (Muse path).

Intentionally red aggregate suites: none in the focused commands. The T142 and T147 failures at
`60892a38` are intentional until Task 1 Green. They are known failures of the list change, not of
the Muse delivery. The full `vitest run` and `pnpm test` stay outside this track (section 11).

##### 4.9 phase_base_sha capture point (Phase 4)

1. The Phase 4 strategy commit lands first. The PM order named `60892a38` as the base. That value
   is the HEAD before the strategy commit, so it is the `role_base_sha` only.
2. Immediately after the strategy commit, the orchestrator runs `git rev-parse HEAD`. The
   committed value is the immutable Phase 4 `phase_base_sha`. The orchestrator captures it before
   any Red edit, staging commit, or Muse call that lands in git.
3. This subsection embeds no SHA for that base. The Phase 3 base `15a7bf0b` and the Phase 2 base
   `1d39b8fd` do not change.
4. Task 1 Red, the delivery week Red, and the staging Red diff from the Phase 4 base.

### Phase 5: Documentation and verification

Revision: written at `91c59500` (Phase 4 checkpoint). Phase 4 acceptance is `35f4a12c`.

PM 2026-11-03: light lane. Phase 5 documents and checks a content track (pictures). It changes no
product code, makes no Muse call, and starts no render. One maker and one checker run. Where this
subsection and section 10 differ, this subsection applies.

Risk class: **low**. The residual risk is a false claim in the last record that the PM and
Workbooks read (A5, A6). The checks below target that risk.

##### 5.1 Facts this subsection fixes (checked 2026-11-03 at 91c59500)

| Fact | Value |
| --- | --- |
| Picture list (read only) | `/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json`, version 4, SHA-256 `6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58`. `pictures.md` SHA-256 `7cc4c20178abbddae3ae0904b9e0e08ced09c6e95d6f9e365fcce932cf81ad56`. Both match now. Workbooks HEAD moved to `7ea815ef`; the list bytes did not change. Pin the SHA-256, never a Workbooks commit. |
| Rows | 196. Weeks 1 to 7: 192 (week 1: 30; weeks 2 to 7: 162 = A 96, B 12, C 54). Week 8: 4 rows (`moon`, `mango`, `ostrich`, `drum`; class C). |
| Release folders | Week 1: `w01/delivery-muse-v2/` (30 rows, 60 files; manifest `d3eec18ce7c94b94ed5b0751df164578558ad44f04bebe7b4b371a3ed213796a`). `w01/delivery-muse-v1/` stays as the earlier delivery (manifest `00ea0c5b06d18e3f54cbceed9caa943100c0711bb515c44561eb46b7e03ed369`). Weeks 2 to 7: `w0N/delivery-muse-v1/` (27 jobs, 54 files each). Cover: `cover/delivery-muse-v1/` (`l2-cover-v1.png` `d32b5cc7caf9b02b5451c1c009b3733e75f05353b7a7ff03bce1d8e7661abf01`; manifest `27710b3711757d99294b7e837377d325eb9a6094e1dad43e0f064d2581397b88`). |
| Manifest SHA-256 (weeks 2 to 7) | w02 `6e6b51450d406bfdac47e01f484925b270bd0b1647bbfc0550d7529809cfeaf4`; w03 `24213647b0f1b92cdb891746cdf6181ff7f20f306c51d256fec150c38d5c273b`; w04 `4e74b7302a851e0261099925a23c0b9246a533911374af01d9748b905320d310`; w05 `c3f009e6bfcb3037ae24b495c6e68527bfbf86162deb3a40a9bbd28a416ffbaf`; w06 `11c5dc10198c9d446afc8ffd80aff46c747d2dec34b77293327907d729163292`; w07 `6a5724c42a83134d80fc1cd1ccecdafe1a76dd25961e040caffaafccc81ea3c2`. |
| Delivered files | 385 PNG files: week 1 v2 60, weeks 2 to 7 324, cover 1 (no line twin). |
| Deliveries are not in git | `out/` is outside git. The durable proof is the hash text in `measure/runs/` and the plan. So the reconcile writes a per-file release ledger. |
| Approval lists and sources | `docs/storytime/l2-unit1/w0N/muse/approved.json` (`rowId`, `version`, `colorPrint`, `linePrint`; the list pin is `pictureListSha256`) and `.../cover/muse/approved.json` (`colorPrint` only, no pin). The Muse source prints sit in `out/storytime/l2/unit1/w0N/muse/` and `cover/muse/`. Entries: 30 + 6 x 27 + 1 = 193. |
| Muse cost files | 18: `w01/muse/costs.tsv` (349 rows); `w02` to `w07` `muse/costs.tsv` (140, 170, 152, 148, 141, 155); six `muse/elements/costs.tsv` (17, 12, 23, 5, 10, 9); `cover/muse/costs.tsv` (14); four calibration files in `out/storytime-review/` (`muse-test` 8, `muse-test-2` 12, `muse-cast` 4, `muse-print-test` 4). Total 1,373 data rows. The cost column is `usage_cost` in the 14 production files and `cost_usd` in `muse-test` and `muse-test-2` (their header starts with `call`). Find the column by header name. |
| Cost sums (USD) | w01 3.32; w02 1.21 + 0.15; w03 1.60 + 0.12; w04 1.45 + 0.22; w05 1.39 + 0.05; w06 1.37 + 0.10; w07 1.50 + 0.09; cover 0.13; calibration 0.23. `usage.cost total (USD): 12.93`. Weeks 2 to 7 alone: 9.25. Every row has a value. 72 rows have `output` = `none` (failed calls, `usage_cost` 0). The plan week 7 note says 12.69 and 12.92; both are earlier states. Phase 5 adds one line. It does not edit old notes. |
| Cost files and outputs (checked) | Every top-level `muse/*.png` that is not a `-print`, `-despeckled`, or `-crop` file has a `costs.tsv` row or matches `-line-raw` (optional `-<n>`). 0 other names exist. Every `output` other than `none` exists on disk in the 14 production files. |
| Source print names (checked) | Remove `-print` and `-despeckled` from an approved print name to get the call output name. Two week 1 names (`cover-hello` m6 pad prints) need `-pad` removed too. A filter that drops them is A7. |
| Person records | Week 1, 26 rows: Daniel, 2026-11-02 07:00 ICT, "Both ok", on 3 phone contact sheets of manifest `00ea0c5b`. Week 1, 4 v2 rows: Daniel, 2026-11-02 14:28 ICT, "Looks good". Weeks 2 to 6, 135 rows: Daniel, 2026-11-03 08:43 ICT, "Approved", 15 contact sheets (`person-review-w02-w06.json`). Week 7, 27 rows, and the cover: Daniel, 2026-11-03 10:29 ICT, "Ok" (`person-review-w07-cover.json`). The PM relayed each answer. Class: owner-passed. No manifest holds a `person` key. |
| Memory file limits | `doctor` fails above 50 lines in `measure/tech-debt.md` (41 now) and `measure/lessons-learned.md` (**52 now, committed**). |
| `doctor` state at `91c59500` | `node measure/tools/doctor.mjs --structural-only --root .` prints 13 errors. None names this track: 6 other tracks "new track has started tasks"; 5 other tracks without a registry link; `lessons-learned.md` 52 lines; `generated/status.md` stale. Other sessions own the first two groups (uncommitted work). |

##### 5.2 Roles and commands

PM 2026-11-03: light lane. Phase 5 uses these roles only:

| Role | Applies | Work |
| --- | --- | --- |
| Maker (`measure-jr-green`) | Yes | The reconcile (5.3), the carry-forward ledger (5.4), and the Task 2 documents (5.5). |
| Checker (`measure-phase-acceptance`) | Yes | Reruns the reconcile and the gates of 5.7. Checks the wording of 5.6. Runs PROJECT_TESTS once. |
| Mid (Red) | **No** | No code change exists to fail first. The orchestrator records the deviation "documentation-only phase, PM light lane". |
| Reviews A, B, C | **No** | PM 2026-11-03: light lane. The full chain is for app code. |
| Adversarial testing | **No** | The four mutation checks of 5.3 stand in for it. |
| UX browser review | **No** (`UX_REQUIRED=never`) | No UI. |
| Different-family rule | Not applied | It applies to code only. |

RED_TEST_COMMAND: **none**.

GREEN_TEST_COMMAND (maker role gate; it passes at the base; run **once** at the end of the maker
work, because Phase 5 changes no code):

```sh
bash $HOME/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts tests/storytime-picture-rows.test.ts tests/storytime-muse-delivery.test.ts --maxWorkers=1'
```

Expected: exit `0`, `Test Files  3 passed (3)`, `Tests  <N> passed (<N>)`, no skip, no `-t`
filter. Parse `<N>` as a labeled integer. A `heavy-preflight` hold or exit `75` is neither pass nor
failure: wait and run again.

PROJECT_TESTS (run **once**, by the checker, at the end of the phase): the three files above plus
`tests/storytime-stage-check.test.ts`, `tests/storytime-line-art-pass.test.ts`, and
`tests/storytime-muse-delivery-adversarial.test.ts`, in one `heavy-run.sh` wrapper with
`--maxWorkers=1`. Expected: `Test Files  6 passed (6)` and `Tests  <N> passed (<N>)`. No tsc runs
in Phase 5 because the code diff is empty (G1). Never run `pnpm`. Use `node_modules/.bin`. Run no
second heavy command while one runs.

Final acceptance and closeout stay after Phase 5. Final acceptance reads PROJECT_TESTS and the type
check (`owned tsc errors: 0`, total 38 or less). Closeout commits
`measure/runs/asset_storytime_l2_unit1_pictures_20261025/` with the archive, sets
`status: "done"` and the `completed` date in the archived `metadata.json`, and runs
`./measure/generate.sh` and `./measure/doctor.sh` again after the move (A10).

##### 5.3 Task 1: the reconcile

Form: a **committed script**, because one command is the smallest form a checker can rerun.
Files (all under `measure/runs/asset_storytime_l2_unit1_pictures_20261025/`, outside product
source): `reconcile-p5.mjs`, `reconcile-p5.log` (its output), and `release-files-p5.tsv` (the
release ledger, one line per delivered file: `week`, `row`, `kind`, `file`, `sha256`, `size`,
`source_print`, `source_sha256`; 385 data lines).

RECONCILE_COMMAND (light job: one process, streaming SHA-256, no lock; use `nice -n 19`; never
run it beside a vitest run; about 2.5 GB is read once):

```sh
R=measure/runs/asset_storytime_l2_unit1_pictures_20261025
nice -n 19 node $R/reconcile-p5.mjs --out-root out/storytime/l2/unit1 --docs-root docs/storytime/l2-unit1 \
  --review-root out/storytime-review --list /home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json \
  --ledger $R/release-files-p5.tsv > $R/reconcile-p5.log
```

Exit `0` = all checks hold. Exit `1` = a check failed and the line names the file or row. Exit `2`
= the list SHA-256 is not the v4 value, or a usage error. The script reads the list and `out/` read
only. It writes the ledger and stdout only. The maker may rename options. The maker may not change
the labels, the values, or the exit codes below.

Required labeled lines (A3: gates read labels, never a bare digit):

```text
list sha256: 6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58
list rows: 196
list rows weeks 1 to 7: 192
list rows week 8: 4
week 8 ids delivered: 0
week 8 status: deferred (out of scope until the PM assigns the rows)
week 1 release folder: delivery-muse-v2
week 1 rows changed v1 to v2: 4
manifest sha256 <w01|w02|...|w07|cover>: <value of 5.1>        (eight lines)
weeks 1 to 7 delivered jobs: 192 files: 384 missing: 0 extra: 0
weeks 2 to 7 delivered jobs: 162 files: 324 A: 96 B: 12 C: 54 missing: 0 extra: 0
cover delivered jobs: 1 files: 1
release files hashed: 385
release file hash mismatches: 0
batch hash mismatches: 0
source prints hashed: 385
source print mismatches: 0
approval entries: 193
approval list pin mismatches: 0
manifest person review fields: 0
person record manifest mismatches: 0
cost files: 18
cost rows: 1373
cost rows without usage cost: 0
cost outputs unaccounted: 0
usage.cost total (USD): 12.93
usage.cost total weeks 2 to 7 (USD): 9.25
reconcile: pass
```

Checks behind the labels:

- **R1 List pin.** The list SHA-256 equals the v4 value, else exit `2`. The `pictures.md` SHA-256
  equals the 5.1 value.
- **R2 Coverage.** The manifest job ids of week 1 (v2) and weeks 2 to 7 equal the list ids of
  weeks 1 to 7 (set differences give `missing` and `extra`). The weeks 2 to 7 line equals the
  Phase 4 count command (4.5). It never comes from a `week > 1` filter (that gives 166, S15). The
  week 8 ids are in the list and in no manifest. They print as deferred, not as missing work.
- **R3 Release files.** Each job has its color file and its line file (the cover has no line
  file). `sha256` of each file equals the manifest `fileSha256`. The PNG IHDR size equals the class
  size (A and B 4000 x 3000, C 1500 x 1500). A folder has no `.png` that the manifest does not
  name. Each manifest batch hash equals SHA-256 of the UTF-8 `JSON.stringify([{file,sha256}])`
  with entries sorted by `file` and no whitespace.
- **R4 Source pages.** For each approval entry, the `colorPrint` and `linePrint` files in `muse/`
  have the same `sha256` as the release file of that row (week 1: the entry that matches the
  manifest file version). The seven week lists carry the v4 `pictureListSha256`.
- **R5 Week 1 kept.** The v1 manifest SHA-256 is `00ea0c5b...ed369`. The v2 folder differs from v1
  in exactly the 4 rows `a-net`, `check-row-net`, `a-nose`, and `nan-can-nod`. The other 26 rows
  have equal color hashes. The v1 folder is never edited (S16).
- **R6 Evidence class.** No manifest holds a `person` key. The `manifestSha256` of each week in
  `person-review-w02-w06.json` and `person-review-w07-cover.json` equals the SHA-256 of that
  manifest now. This proves Daniel looked at the bytes that exist now.
- **R7 Costs.** Find the cost column by header (`usage_cost` or `cost_usd`). Parse each value as an
  exact decimal text (no float). An empty or negative value fails. In the 14 production files,
  every `output` other than `none` exists on disk (relative to the cost file folder). Every
  top-level `muse/*.png` that is not `-print`, `-despeckled`, or `-crop` has a row or matches
  `-line-raw`. The source ancestor of each approved print has a row (`-pad` removed for the two
  `cover-hello` prints). The total equals `12.93` by exact compare, no tolerance.
- **R8 No write.** The run changes no byte under `out/storytime`, `docs/storytime`, or Workbooks.

**Mutation checks (four).** The maker runs them on **copies** made with `cp` (never a hard link) in
a new empty folder under `/tmp/opencode/`. The copy holds the cover delivery (6.5 MB), its source
print, the cover approval list, one copied `costs.tsv`, and a copy of the list. The script takes
`--out-root`, `--docs-root`, `--list`, and `--list-sha256` so the copy can pin its own list. The
originals are never edited. The folder is deleted at the end.

| Mutation | Expected result |
| --- | --- |
| M1 Flip one byte of a copied delivered PNG | Exit `1`. `release file hash mismatches: 1` and the file name. |
| M2 Set the expected cost total to `12.92` (or empty one `usage_cost` value in a copied cost file) | Exit `1`. The file or the total is named. No tolerance. |
| M3 Change one byte of the copied list and give no `--list-sha256` | Exit `2`. |
| M4 Add a week 8 id to a copied manifest | Exit `1`. `week 8 ids delivered` is above 0. |

A mutation that exits `0` is a vacuous pass (A4). The real run is not accepted until all four fail
as stated. The checker reruns M1 and M4 only.

##### 5.4 Carry-forward ledger (Task 1 note in the plan)

The maker writes one table in the plan: id, disposition, source. Allowed dispositions:
`fixed at <sha>`, `tech debt TD-<n>`, `informational`, `deferred:<owner>`. G6 greps each id.

| Id | Default disposition |
| --- | --- |
| RB-P4-1 / PA4-N1 (Low; `cover-calm-top --print` has no `out/` confinement, no `realpath`, no regular-file check; `coverCalmTopReport` in `src/storytime/book-pictures.ts`) | `tech debt TD-<n>`, Low, Open. A source fix needs its own task. |
| RB12-01 (Low; a parent symlink under `out/` redirects `mkdir`) and RB12-03 (Nit; `lstat` and `mkdir` are not atomic) | One `tech debt TD-<n>`, Low, Open (from PA3-N3). |
| RA-P3ADV-2, RC5-3, RA4-N1, RA3-N1 | The maker greps the plan. If the text is still stale, add a dated correction note (`fixed at <sha>`). Else `informational`. RC5-3 joins a TD row only if the line limit allows. |
| PA3-N6 (4 v2 rows without a person look) | `fixed`: Daniel's "Looks good", 2026-11-02 14:28 ICT, for `delivery-muse-v2`. |
| PA4-N2 | `fixed at 91c59500`. |
| PA4-N3 (adversarial baseline `376ae5dd`, HEAD `35f4a12c`) | `informational`. |
| PA4-N4 (registry, metadata, generate, doctor) | Closed by Task 2 and gates G7 to G9. |
| Week 8 rows `moon`, `mango`, `ostrich`, `drum` | `deferred:pm-assignment`. Not missing work of this track. Nobody renders them. |
| Nan window sample (`[b] deferred:daniel-lineart-look`) and the four `[ ]` tasks marked "Deferred: replaced by the Muse path" | `deferred`, replaced by the Muse path. Keep the markers (trap T2). |

Tech debt rows: read the next free `TD-<n>` at commit time (other sessions add rows). Use the table
shape of `measure/tech-debt.md`. Write one row per class of problem. Keep the file at 50 lines or
less (9 lines are free).

##### 5.5 Task 2: documents, facts, doctor

The maker owns: the Phase 5 lines and notes of `plan.md`, `metadata.json`, this track entry in
`measure/tracks.md`, `measure/status.md`, `measure/tech-debt.md`, `measure/lessons-learned.md`, and
`measure/generated/`. It touches no other track.

- `metadata.json`: `actual_tasks` equals the count of `[x]` task lines in the plan (a labeled
  integer from grep). `updated_at` is the commit time. `evidence` gains the nine manifest paths and
  the run folder. `deviation_notes` gains the Muse-path summary. `status` stays `in_progress`.
- `measure/tracks.md`: the entry stays `[~]` and matches the metadata. The text may say
  "delivered; person-reviewed by Daniel (owner-passed); week 8 deferred". It never says "accepted".
- `measure/status.md`: add one Storytime line in the 5.6 wording (the file has none now).
- `measure/lessons-learned.md`: add 3 lines or less of durable knowledge. The file has 52 lines
  and `doctor` fails above 50. The maker removes at least 2 lines net by merging lines without
  loss of fact. If that is not safe, the maker stops with `status: blocked` (open question Q4).
  Candidates: a reviewer needs control rows or it passes every page (S14); count from the set of
  ids, not from `week > 1` (S15); never overwrite a delivery folder (S16); sum all cost files and
  read the column by header; a person review covers what the record says it saw (contact sheets).
- Links in `measure/*.md` must resolve (`doctor` checks them).

Traps (each has a check in 5.7):

- **T1 Status words.** `doctor` knows `new`, `in_progress`, `completed`. The closeout checker
  wants `done` in the archive. Phase 5 sets neither. Closeout sets the final value.
- **T2 Marker count.** `doctor` counts only `[ ]`, `[~]`, and `[x]`, not `[b]`. If the four
  superseded `[ ]` tasks become `[b]` while all others are `[x]`, then
  `in_progress track has no unchecked task` fails. Default: leave those four lines unchanged. The
  checker and the closeout both skip a line with the word "deferred".
- **T3 First-line SHA.** The closeout checker reads only the first line of a task. A `[x]` task
  needs a 7 to 40 hex SHA there. A commit cannot hold its own SHA. So: commit C1 holds the
  reconcile files. C2 sets Task 1 `[x]` with C1 on its first line. C3 holds the Task 2 documents.
  C4 sets Task 2 `[x]` with C3 on its first line and holds the regenerated facts.
- **T4 Generated facts.** Plan task counts feed `measure/generated/status.md`. Order: all plan and
  metadata edits, then `./measure/generate.sh`, then commit. Then `git diff --exit-code --
  measure/generated/` must print nothing. A later plan edit needs another generate and commit.
- **T5 Foreign state.** `generate.sh` and `doctor.sh` read the whole working tree. Other sessions
  have uncommitted edits in `measure/tracks.md`, other tracks, and `measure/generated/`. Default:
  commit the facts only when `git status --short measure/tracks measure/tracks.md
  measure/generated` shows no change outside this track. Else return `status: blocked` with that
  reason (open question Q3). Never stage a path the phase does not own.
- **T6 Heavy doctor.** `./measure/doctor.sh` without `--structural-only` runs vitest. Run it as
  `bash $HOME/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './measure/doctor.sh'`. After each
  document commit run `node measure/tools/doctor.mjs --structural-only --root .` (light).
- **T7 Old doctor errors.** The 13 errors of other tracks exist before this phase. The maker does
  not fix another track and quotes the full output. The claim is "no doctor error names this track
  or an owned file". The words "doctor exits 0" appear only with exit code 0. If other tracks keep
  `doctor` red, the maker returns `status: partial` with the exact output.

##### 5.6 Evidence class wording

Allowed words for a row, a week, or the cover: `delivered`, `independent model review` (never
"accepted"), `person-reviewed by Daniel (owner-passed)`, and `deferred`. A person-review
statement names the person, the time, Daniel's word, the row count, and what he saw (contact
sheets for weeks 1 to 7, the print file for the cover).

- No text calls a row "accepted", "owner-approved", or "approved" unless the same line names a
  person record (the two JSON files or a plan note with Daniel's time and word). Daniel's word
  "Approved" for weeks 2 to 6 appears in quotation marks.
- The PM acceptance of pad bands and 8-bit gray prints (G5) is a format decision, not a picture
  acceptance. Model reviews stay `model evidence` or `independent review`. A phase acceptance is not
  a picture acceptance.
- No text says Workbooks accepted or printed a picture. Workbooks has not told this session.

##### 5.7 Phase 5 gates (the plan quotes each output)

`P5BASE` is the Phase 5 `phase_base_sha`. `R` is the run folder of 5.3. `OWNED` is the list of 5.5.

```sh
# G1: prints nothing
git diff --name-only "$P5BASE"..HEAD | grep -v '^measure/'
# G7: the checker reads every line and a reason is given for each
git diff "$P5BASE"..HEAD -- $OWNED | grep -E '^\+' | grep -Ei '\b(accepted|owner-approved|approved|production-ready)\b'
# G8: prints nothing
grep -En 'sk-[A-Za-z0-9]{16,}|Bearer [A-Za-z0-9._-]{16,}|api[_-]?key.{0,20}[:=]' "$R/reconcile-p5.log" "$R/release-files-p5.tsv"
```

| Gate | Check | Falsification condition |
| --- | --- | --- |
| G1 No code drift | The G1 command prints nothing. | A file outside `measure/` changes. |
| G2 Reconcile | RECONCILE_COMMAND exits `0`, the log has every label of 5.3 with its value, the ledger has 385 data lines, and `reconcile: pass` is the last line. | A label is missing or differs. |
| G3 Mutations | M1 to M4 give the stated exit codes (maker note). The checker reruns M1 and M4. | A mutation exits `0`. |
| G4 Read only | Workbooks `git status --short content/storytime/l2/print` prints nothing. `sha256sum` of `pictures.json` and `pictures.md` still equal 5.1. `find out/storytime -newer <stamp> -type f` (stamp made before the run) prints nothing. The nine manifest SHA-256 values equal 5.1 and the plan. | A file changes or a hash differs. |
| G5 Ledger | Each id of 5.4 has a disposition in the plan. `measure/tech-debt.md` and `measure/lessons-learned.md` have 50 lines or less. | An id has none, or a file passes 50 lines. |
| G6 Cost report | The plan note quotes `usage.cost total (USD): 12.93`, the weeks 2 to 7 value 9.25, and the per-file table from the log. It marks 12.69 and 12.92 as earlier states. | A number differs from the log. |
| G7 Wording | The G7 command matches only lines that quote Daniel, record a PM format decision, or name a person record. A seeded copy with one unqualified "accepted" is matched. | An unqualified match remains, or the seed is missed. |
| G8 No secret | The G8 command prints nothing. | A key-like string is in a new file. |
| G9 Facts and doctor | `./measure/generate.sh` exits `0` (`Generated 4 Measure facts.`). The structural doctor shows no error that names this track or an owned file. The heavy doctor ran once under `heavy-run.sh`. After the last commit, `git diff --exit-code -- measure/generated/` prints nothing. | A doctor error names this track, or the facts differ from HEAD. |
| G10 Tests | GREEN_TEST_COMMAND (maker, once) and PROJECT_TESTS (checker, once) exit `0` with the labeled totals of 5.2. | A failure, a skip, or a filter. |
| G11 Task lines | Both Phase 5 tasks are `[x]` with a SHA on the first line that `git cat-file -t` shows as `commit` and that holds the evidence. `measure_interphase_checks.py status --track asset_storytime_l2_unit1_pictures_20261025` lists no incomplete phase. | The SHA is on a later line or is not a commit. |

Phase 5 is complete when G1 to G11 hold. If G9 fails only because of other tracks (T7), the maker
returns `status: partial` with the exact output, and does not fix them.

Intentionally red aggregate suites: none. The full `vitest run` and `pnpm test` stay outside this
track (section 11). Baseline tsc errors outside the owned paths stay known failures.

##### 5.8 Anti-pattern coverage for Phase 5

`measure/anti-patterns.md` does not exist. The catalog is
`~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`. A1 and A8 are retired.

| Class | Defense | Falsification condition |
| --- | --- | --- |
| A2 consent-blind publish gate | R6: no `person` key in a manifest; each record matches the manifest bytes. 5.6 names person, time, word, and what he saw. | A row is called person-reviewed with no record (G7). |
| A3 digit-only count | Labeled lines only (5.3). Exact decimal cost parse. Labeled `Tests  <N> passed (<N>)`. | A date, a path digit, or a float sum satisfies a gate (M2). |
| A4 vacuous pass | Four mutations fail on copies. The ledger needs 385 lines. R2 uses set differences, so an empty folder gives `missing` above 0. | A mutation exits `0`, or a run over zero files passes. |
| A5 false claim | The plan quotes the command, exit code, and labels. Old totals are marked as earlier states. "Doctor exits 0" only with exit code 0. | A note differs from the log (G6, G9). |
| A6 registry overstatement | `tracks.md`, `status.md`, and `metadata.json` use 5.6 wording and stay `in_progress`. | A line says "accepted" for a picture with model evidence only (G7). |
| A7 over-broad filter | R7 handles `-pad` and `-line-raw` by name, finds the cost column by header, and has no tolerance. | A `cover-hello` row is dropped, or `cost_usd` files are skipped. |
| A9 archived track paths | No test file is added. The script takes paths as arguments. | `grep -n 'measure/tracks/' tests/storytime-*.test.ts` prints a line. |
| A10 generated-facts drift | T4 order and an empty `git diff --exit-code -- measure/generated/` after the last commit. | A plan edit follows the last generate (G9). |
| A11 doc-to-code drift | The plan and `contract.md` name the v4 SHA. The grep of 4.8 item 2 still shows only the T173 negative control. The checker reruns it. | A document names a pin the code does not hold. |

Project candidates for a future `measure/anti-patterns.md`: (S18) generated facts that hold the
uncommitted state of another session; (S19) two tools with two words for one status (`done` and
`completed`) and a marker one tool counts and the other does not (T2); (S20) a cost total built
from a subset of the cost files or from a column with the wrong name.

##### 5.9 Role briefs

- **Maker (`measure-jr-green`).** Write the reconcile files (C1). Run RECONCILE_COMMAND and the four
  mutations. Write the ledger and cost notes in the plan (C2). Update the documents of 5.5 (C3). Run
  generate and doctor, then set Task 2 (C4). Run GREEN_TEST_COMMAND once. Stage explicit paths only.
  Return `blocked` or `partial` as T5 and T7 say.
- **Checker (`measure-phase-acceptance`).** Reread G1 to G11 on the final HEAD. Rerun
  RECONCILE_COMMAND into a temp log and diff it with the committed log. Rerun M1 and M4. Read the
  G7 matches. Run PROJECT_TESTS once. Write the acceptance file. Do not edit product files.

##### 5.10 phase_base_sha capture point (Phase 5)

1. The Phase 5 strategy commit lands first. `91c59500` is the HEAD before it, so it is the
   `role_base_sha` only.
2. Immediately after the strategy commit, the orchestrator runs `git rev-parse HEAD`. That
   committed value is the immutable Phase 5 `phase_base_sha`. The orchestrator captures it before
   any maker edit or commit.
3. This subsection embeds no SHA for that base. The earlier bases (`1d39b8fd`, `15a7bf0b`,
   `fc76c272`) do not change.
4. G1 and G7 diff from the Phase 5 base.

##### 5.11 Restart amendment (2026-11-05): gates for Task 3, T3a, T4, T5, T6

Revision: written at `f25d8399` (the T4, T5, and T6 step 8 delivery). It includes the PM order of
2026-11-05 08:44 ICT (the nut attempt 3). The text of 5.1 to 5.10 stays as written. Where 5.11
and an earlier subsection differ, 5.11 applies.

Sources: the spec section "Amendment 2026-11-04" (Decisions 1 to 6), the plan Phase 5 tasks 3, T3a,
T4, T5, and T6, and the step 8 block of `jr-green-p5-t4-aba118fe.log`. PM 2026-11-05: light lane,
the checker route of 5.11.9, and the copy-way delivery of the two D4 ids (defaults 1 and 3).

Risk class: **medium**. The restart changed scripts, one source file, and three test files. It
delivered 49 files (51 with the nut v3 pair) outside git, to Workbooks. The residual risks are a
delivered file without a judge pass (A5), a spend or try count from a subset of the cost rows (A7),
and the word "approved" on a picture with model evidence only (A6).

###### 5.11.1 The earlier gates that 5.11 replaces

| Earlier rule | Status under 5.11 | Replacement |
| --- | --- | --- |
| G1 No code drift | Replaced. The restart changed code by design. | X1 and X2 |
| G2 Reconcile | Replaced. RECONCILE_COMMAND pins list v4 and exits `2` on the list `327f805f…` by design. `reconcile-p5.mjs`, `reconcile-p5.log`, and `release-files-p5.tsv` stay as the record of `7c4f8b63`. Nobody runs the reconcile again. | X8 |
| G3 Mutations | Stays a record of `7c4f8b63`. The checker does not run M1 and M4 again. | X4 control run |
| G4 Read only | Replaced. | X4 (19 manifest pins) and X8 |
| G5 Ledger | Stays in force. | none |
| G6 Cost report | Stays a record. `12.93` is the total before the restart. | X5 |
| G7 Wording | Extended to the new files. | X13 |
| G8 No secret | Extended to the new files. | X14 |
| G9 Facts and doctor | Replaced. | X15 |
| G10 Tests | Replaced. | X10 and X11 |
| G11 Task lines | Replaced. Phase 5 has 7 tasks now. | X12 |
| 5.2 commands | Replaced. | 5.11.4 |
| 5.2 and 5.9 roles | Replaced. | 5.11.9 |
| 5.6 wording | Stays in force. X13 adds two file-level rules. | none |

###### 5.11.2 Facts (checked 2026-11-05 at `f25d8399`, read-only commands only)

| Fact | Value |
| --- | --- |
| Phase 5 base `P5BASE` | `4e171648d0101d9f7b34d0f486fc1494bc0a48e7`. The orchestrator recorded it at the Phase 5 start. It does not change. The restart steps used `aba118fe` as their step base. |
| Commits `P5BASE..f25d8399` | 55. No merge commit. Each subject starts with `storytime:` or `measure(storytime_l2_unit1_pictures):`. They touch 69 paths. All 69 are in the allowed set of 5.11.3. |
| Workbooks list now | SHA-256 `327f805f2f44aeed2b29477e83921ed03cf5fd7ab6600910ca8e21fced5b2cc7`, 194 rows. The copy-way manifests record this value. 5.11 pins no list SHA. Workbooks owns the list. |
| Judge kit | `judge-prompt.md` SHA-256 `db5b443a…` (v6) and `cast.json` SHA-256 `2eb4a6a1…`. `git diff c132d866..HEAD` of the kit files, the calibration set, and the eight calibration batches is empty. Judge model: `claude-code/claude-sonnet-5-5#high`. |
| Calibration | 8 result files `judge-cal-<group>-aba118fe.json`, each `status: complete`. 388 files judged: 381 pass, 7 fail. The 2 entries with `expected: fail` (the gate controls) fail. Every entry with `expected: pass` passes. Each `summary` equals the count of its `results`. |
| Production judge | 15 result files `judge-prod-*.json`: 11 main files and 4 second-judge files (`-second-` in the name). 52 main results, 4 main fails. A second judge confirmed each fail, and one retry followed each fail. 12 batch files in `docs/storytime/l2-unit1/judge/prod/` (11 rounds and the dry run). Each main result file names its batch through `group`. |
| Restart cost rows | 15 cost files (8 week files, 6 element files, the cover file). 52 rows at or after `2026-11-04T07:54:00Z`, all in week files. Spend `0.52` USD. 0 failed calls. 48 picture and kind pairs. Most tries for one pair: 2 (the nut color, the nut line, the nest line, the pan in a pan color). |
| Restart deliveries | 10 folders, 49 files, 24 pictures. See the folder table below. |
| Handoff folders | `a48-forge-pictures-drum` 2 files, `-c` 4, `-a` 25, `-b` 14, `-d` 4. Each `MANIFEST.txt` check command gives one `OK` line for each file and exits `0`. Each `MANIFEST.txt` holds the words "model evidence, not acceptance". |
| Pre-restart manifests | The nine values of 5.1 (w01 v1, w01 v2, w02 to w07 v1, the cover) are unchanged. The step 8 log lists eight of them and the w08 manifest. |
| D4 ids | `l2-w05-d4-prompt-face` and `l2-w07-d4-prompt-ball` have no row in the list `327f805f…`. Each `delivery-a48-d/manifest.json` names its id in `missingPictureListRows`. PM 2026-11-05 accepted this copy-way delivery with hand-written manifests (defaults 1 and 3). |
| Untracked evidence | The judge result files and the restart logs in `measure/runs/` are not in git. Closeout commits `measure/runs/`. 5.11.6 pins their bytes. `out/` and the handoff folders are outside git. |
| Tests | `tests/storytime-book-pictures.test.ts` has 8 failures that came before T4. The file pins the list SHA-256 `6d05dfc5…`. T4 step 1: the three restart test files gave `Tests  72 passed (72)`. |
| Type check | T4 step 1: `tsc --noEmit` exit `2`, 58 errors. 20 are in `tests/storytime-muse-attempts.test.ts`, an owned file: the T3a test imports `scripts/storytime-muse-guards.mjs`, which has no type file. |
| Plan and metadata | 28 `- [x] Task` lines; Task 3 is `[~]`. T5 and T6 have no commit SHA on the first line. `metadata.json`: `actual_tasks` 23, `status` `in_progress`. |
| doctor | `node measure/tools/doctor.mjs --structural-only --root .` prints 12 errors. None names this track: 6 tracks "new track has started tasks", 5 registry links, and `generated/status.md` stale. |
| Interphase status | `incomplete_phases: 1`, Phase 5 "1/7 remaining". |

Restart delivery folders (the restart check pins each `manifest.json` SHA-256):

| Folder | Files | Way | `manifest.json` SHA-256 |
| --- | --- | --- | --- |
| `w01/delivery-muse-v3` | 13 | copy | `38a16765…` |
| `w02/delivery-muse-v2` | 4 | copy | `c59a75bb…` |
| `w03/delivery-muse-v2` | 4 | copy | `bb7a2752…` |
| `w04/delivery-muse-v2` | 4 | copy | `82d467e6…` |
| `w05/delivery-muse-v2` | 2 | copy | `0e2fde98…` |
| `w06/delivery-muse-v2` | 8 | copy | `66bb2f62…` |
| `w07/delivery-muse-v2` | 4 | copy | `352b2dab…` |
| `w05/delivery-a48-d` | 2 | copy | `0fa7b232…` |
| `w07/delivery-a48-d` | 2 | copy | `36b4febc…` |
| `w08/delivery-muse-v1` | 6 | writer | `2dc0812b…` |
| `w01/delivery-muse-v4` (only after a nut v3 pass) | 2 | copy | not pinned (new) |

The 24 pictures: list A 12 (the nose counts once for its two ids; the ostrich has one id for
week 7 and week 8), list B 7, list C 3 (drum, moon, mango), list D 2. The 24 specs are the 24
files of `docs/storytime/l2-unit1/a48/`.

###### 5.11.3 Scope and the allowed file set (X1, X2)

X1 uses `P5BASE`. X2 uses `P5R_BASE`, the HEAD that the orchestrator captures right after the
5.11 commit (5.11.12). The allowed set comes from `git diff --name-only P5BASE..HEAD` at
`f25d8399` and the plan evidence, plus one planned file (`scripts/storytime-muse-guards.d.mts`,
finding F2).

```sh
P5BASE=4e171648d0101d9f7b34d0f486fc1494bc0a48e7
D=$(mktemp -d /tmp/opencode/p5r-check.XXXXXX)
ALLOWED='^(measure/tracks/asset_storytime_l2_unit1_pictures_20261025/|measure/runs/asset_storytime_l2_unit1_pictures_20261025/|measure/(tracks|status|tech-debt|lessons-learned)\.md$|measure/generated/|docs/storytime/l2-unit1/a48/l2-w0[1-8]-[a-z0-9-]+\.json$|docs/storytime/l2-unit1/judge/(judge-prompt\.md|cast\.json|calibration-set\.json|batch-(w0[1-7]|cover)\.json)$|docs/storytime/l2-unit1/judge/prod/batch-[a-z0-9-]+\.json$|docs/storytime/l2-unit1/w08/muse/approved\.json$|scripts/storytime-(judge-batch\.mjs|judge-batch\.d\.mts|judge-set\.mjs|muse-guards\.mjs|muse-guards\.d\.mts|muse\.mjs)$|src/storytime/book-pictures\.ts$|tests/storytime-(judge-batch|muse-attempts|muse-delivery)\.test\.ts$)'
# X1: files of this track's commits, and the foreign commits in the range
for c in $(git rev-list --no-merges "$P5BASE"..HEAD); do
  s=$(git log -1 --format=%s "$c")
  case "$s" in
    'storytime:'*|'measure(storytime_l2_unit1_pictures):'*) git diff-tree --no-commit-id --name-only -r "$c" >> "$D/own.txt" ;;
    *) echo "$c $s" >> "$D/foreign.txt"; git diff-tree --no-commit-id --name-only -r "$c" | grep -E 'storytime|asset_storytime_l2_unit1' >> "$D/foreign-touch.txt" ;;
  esac
done
touch "$D/own.txt" "$D/foreign.txt" "$D/foreign-touch.txt"
echo "merge commits in range: $(git rev-list --merges "$P5BASE"..HEAD | wc -l)"
echo "own files: $(sort -u "$D/own.txt" | wc -l)"
echo "own files outside the allowed set: $(sort -u "$D/own.txt" | grep -cEv "$ALLOWED")"
echo "foreign commits: $(wc -l < "$D/foreign.txt")"
echo "foreign storytime paths: $(wc -l < "$D/foreign-touch.txt")"
echo "a48 specs in git: $(git ls-files docs/storytime/l2-unit1/a48 | wc -l)"
# X2: freezes after the 5.11 commit (P5R_BASE from the orchestrator)
echo "code files changed after P5R_BASE: $(git diff --name-only "$P5R_BASE"..HEAD -- scripts src tests | grep -cvx 'scripts/storytime-muse-guards.d.mts')"
echo "judge files changed or removed after P5R_BASE: $(git diff --name-status --diff-filter=MDR "$P5R_BASE"..HEAD -- docs/storytime/l2-unit1/judge | wc -l)"
echo "a48 specs changed after P5R_BASE: $(git diff --name-only "$P5R_BASE"..HEAD -- docs/storytime/l2-unit1/a48 | grep -cvx 'docs/storytime/l2-unit1/a48/l2-w01-story-page-a-nut.json')"
echo "judge kit changed after c132d866: $(git diff --name-only c132d866..HEAD -- docs/storytime/l2-unit1/judge/judge-prompt.md docs/storytime/l2-unit1/judge/cast.json docs/storytime/l2-unit1/judge/calibration-set.json docs/storytime/l2-unit1/judge/batch-w0{1,2,3,4,5,6,7}.json docs/storytime/l2-unit1/judge/batch-cover.json | wc -l)"
```

Expected: `merge commits in range: 0`, `own files outside the allowed set: 0`,
`foreign storytime paths: 0`, `a48 specs in git: 24`, and `0` on each of the four X2 lines. A
foreign commit is not a failure. The checker names each one from `foreign.txt`. The nut spec
(`mustShow` "one nut, clearly a nut", `deliverAs` v3) may change after its earlier tries. The new
nut batch files are additions (status `A`), so the earlier batch files keep their bytes.

###### 5.11.4 Commands

RED_TEST_COMMAND: **none**. The restart code is committed with its tests (T3a and T4 step 1). The
one planned code change is a type file. Its Red evidence is the T4 step 1 type check (20 owned
errors). TYPECHECK_COMMAND below is its Green.

GREEN_TEST_COMMAND (maker, **once**, after the last code change):

```sh
HEAVY_MIN_AVAIL_MB=1500 bash $HOME/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-muse-attempts.test.ts tests/storytime-judge-batch.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-picture-rows.test.ts --maxWorkers=1'
```

Expected: exit `0`, `Test Files  4 passed (4)`, `Tests  <N> passed (<N>)`. No skip and no `-t`
filter. Parse `<N>` as a labeled integer. The three restart files gave 72 at T4 step 1, so `<N>`
is above 72.

PROJECT_TESTS (checker, **once**): the four files above plus `tests/storytime-stage-check.test.ts`,
`tests/storytime-line-art-pass.test.ts`, and `tests/storytime-muse-delivery-adversarial.test.ts`,
in one `heavy-run.sh` wrapper with `HEAVY_MIN_AVAIL_MB=1500` and `--maxWorkers=1`. Expected:
exit `0`, `Test Files  7 passed (7)`, `Tests  <M> passed (<M>)`, and `<M>` above `<N>`.

KNOWN_RED_COMMAND (checker, **once**, after PROJECT_TESTS ends):

```sh
HEAVY_MIN_AVAIL_MB=1500 bash $HOME/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1' > "$D/known-red.log" 2>&1; echo "known red exit: $?"
echo "known red fail lines: $(grep -c '^ *FAIL  tests/storytime-book-pictures.test.ts >' "$D/known-red.log")"
grep -E '^ *Tests  ' "$D/known-red.log"
```

Expected: exit `1`, `known red fail lines: 8`, and `Tests  8 failed | <P> passed (<P+8>)`. The file
stays out of GREEN_TEST_COMMAND and PROJECT_TESTS for this reason: it pins the list v4 SHA-256 and
the Workbooks list moved on (plan line of T4 step 1). This is not a `-t` filter: the file runs whole,
alone, with an exact expected count. For each of the 8 failing test names, the checker reads the
test body in the file. The body must use `LIST_SHA256`, `LIST_MARKDOWN_SHA256`, `LIST_FILE`, or
`PRINT_ROOT`. A ninth failure, or a failing body without one of these names, is a new failure.

TYPECHECK_COMMAND (maker once after the type file, checker once):

```sh
bash $HOME/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'NODE_OPTIONS=--max-old-space-size=6144 node_modules/.bin/tsc --noEmit' > "$D/tsc.log" 2>&1; echo "tsc exit: $?"
echo "tsc errors total: $(grep -cE 'error TS[0-9]+' "$D/tsc.log")"
echo "owned tsc errors: $(grep -E 'error TS[0-9]+' "$D/tsc.log" | grep -cE '^(src/storytime/|scripts/storytime-|tests/storytime-)')"
```

Expected: `owned tsc errors: 0` and `tsc errors total:` 38 or less (58 minus the 20 owned errors).
The exit code stays `2` while other tracks have errors.

Heavy rules: run one heavy command at a time. Never run `pnpm`. Use `node_modules/.bin`. A
`heavy-preflight` hold or exit `75` is neither a pass nor a failure: wait and run again.
`storytime-muse.mjs` and `storytime-judge-batch.mjs` are light (rule of 2026-11-05 07:21 ICT).

###### 5.11.5 The restart check (X4 to X7)

The checker is a read-only Node script. It lives in this subsection, so the strategy commit holds
it and nobody adds a file to the repo. The checker copies it into a new temp folder and checks
its SHA-256:

```sh
T=measure/tracks/asset_storytime_l2_unit1_pictures_20261025
awk '/^<!-- restart-check.mjs end -->$/{f=0} f; /^<!-- restart-check.mjs begin -->$/{f=1}' "$T/test-strategy.md" | sed '1d;$d' > "$D/restart-check.mjs"
echo "restart check script sha256: $(sha256sum < "$D/restart-check.mjs" | cut -c1-64)"
nice -n 19 node "$D/restart-check.mjs" $NUT_MODE > "$D/restart-check.log"; echo "restart check exit: $?"
nice -n 19 node "$D/restart-check.mjs" $NUT_MODE --control > "$D/restart-control.log"; echo "restart control exit: $?"
```

Expected script SHA-256: `c3ecbeb73f75abc77f64bf04c9fd86110f414cd121ac460ce423b3474672f062`.

`NUT_MODE` follows the nut result (5.11.8): empty before the nut try 3, `--pm-nut3` when the try 3
ran and the v2 pair stays, and `--nut3` when both try 3 kinds passed and the v3 pair is
delivered. The modes exclude each other: a v4 folder without `--nut3`, or a nut try 3 without
`--pm-nut3` or `--nut3`, fails. The script reads files only and writes stdout only.

How the script maps a delivered file to its try:

1. A copy-way `manifest.json` gives `pictureId`, `kind`, `file`, `sha256`, and `source` (the
   print). The w08 writer manifest gives `file` and `fileSha256`. The w08 approval list
   (`docs/storytime/l2-unit1/w08/muse/approved.json`) gives the print (`colorPrint`, `linePrint`).
2. The delivered bytes equal the manifest SHA-256 and the print bytes.
3. The call output name is the print name with the first `-print` removed
   (`…-m8-line-print-2.png` gives `…-m8-line-2.png`). The restart row with that `output` in the
   cost file of the print folder is the try.
4. The judge copy number is the position of that row among the restart rows of the same id and
   kind in that cost file, in time order. This is the rule of `restartTries` and
   `judgeFileName` in `scripts/storytime-judge-batch.mjs`. The judge copy is
   `out/storytime-review/judge/prod/<id>-<kind>-t<n>.png`.
5. A main result (`status: complete`, the v6 prompt, cast `2eb4a6a1`, the Sonnet model) names
   that judge copy with verdict `pass`. Its batch file (`batch-<group without prod->.json`) holds
   the same `judgeFile`, `id`, and `kind`.
6. No earlier try of the same id and kind passed, except a PM order (the nut try 3).
7. A delivered line try starts from the delivered color try (the `inputs` column).

The judge copies are resized prints (900 px or 360 px long side), so no byte compare ties a copy
to a print. Steps 3 and 4 tie them through the cost row instead.

Required labeled lines and values. The checker compares each value. "Before" is the state at
`f25d8399`. "v3" is the state after a nut v3 pass. "PM" is the state after a nut try 3 that does
not deliver.

| Label | Before | v3 (`--nut3`) | PM (`--pm-nut3`) |
| --- | --- | --- | --- |
| `cost files read:` | 15 | 15 | 15 |
| `cost rows with an unreadable time:` | 0 | 0 | 0 |
| `restart cost rows:` | 52 | 54 | 54 |
| `restart spend (USD):` | 0.52 | 0.54 | 0.54 |
| `restart failed calls (cost 0 or output none):` | 0 | 0 | 0 |
| `max tries for one picture and kind:` | 2 | 3 | 3 |
| `picture and kind pairs above 3 tries:` | 0 | 0 | 0 |
| `nut tries color: <c> line: <l>` | 2, 2 | 3, 3 | 3, 3 |
| `judge prompt sha256:` / `judge cast sha256:` | `db5b443a…` / `2eb4a6a1…` | same | same |
| `calibration files judged: <f> pass: <p> fail: <x>` | 388, 381, 7 | same | same |
| `calibration gate controls: 2 failed:` | 2 | 2 | 2 |
| `calibration expected-pass files that did not pass:` | 0 | 0 | 0 |
| `production main fails:` | 4 | 4 | 5 or 6 |
| `retries: <r> after a confirmed fail: <c> by PM order: <p>` | 4, 4, 0 | 6, 4, 2 | 6, 4, 2 |
| `second-judge results that differ from the main verdict:` | 0 | 0 | 0 |
| `nut judge copies of tries 1 and 2 changed:` | 0 | 0 | 0 |
| `nut color try 3 verdict:` / `nut line try 3 verdict:` | absent | pass / pass | at least one fail |
| `restart delivery folders:` | 10 | 11 | 10 |
| `restart delivered files: <d> byte-equal to a source print: <b> with a pass verdict: <v>` | 49, 49, 49 | 51, 51, 51 | 49, 49, 49 |
| `restart delivered pictures:` | 24 | 24 | 24 |
| `line files not made from the delivered color:` | 0 | 0 | 0 |
| `restart delivered files with a wrong size or line format:` | 0 | 0 | 0 |
| `handoff <h>: files: <n> manifest lines: <n> byte-equal to delivery: <n> evidence words: yes` | drum 2, c 4, a 25, b 14, d 4 | the same and nut3 2 | the same as Before |
| `restart check:` | `pass` | `pass` | `pass` |

The table holds the restart spend after the nut try 3 as 0.54 USD (2 calls of 0.01 USD). A
different call count changes the rows, the spend, and the PM retry count together. The checker
then takes the values from the plan T4 step 9 block, and the cap and try rules still apply.

The control run (`--control`) changes three expected values in memory: the w01 v1 manifest pin,
the cap (0.51 USD), and the judge model name. Expected: `restart control exit: 1`, and FAIL lines
that name `pre-restart manifest changed: w01/delivery-muse-v1`, `above the cap 0.51`, and
`header or status`. A control run that exits `0` is a vacuous pass (A4).

The handoff check commands (X7). Run each one in its folder and count the `OK` lines:

```sh
H=/home/daniebo/Desktop/handoff
for h in drum c a b d; do   # add nut3 in the v3 state
  ( cd "$H/a48-forge-pictures-$h" && cmd=$(grep -E "^grep -E '\^\[0-9a-f\]\{64\}  " MANIFEST.txt | head -1) \
    && ok=$(bash -c "$cmd" | grep -c ': OK$'); bash -c "$cmd" > /dev/null; echo "handoff check $h exit: $? ok lines: $ok" )
done
```

Expected: exit `0` for each folder, and the `OK` count equals the file count of the table above. A
command that matches no line makes `sha256sum -c` exit `1`, so an empty match fails.

<!-- restart-check.mjs begin -->
```js
// restart-check.mjs: the read-only checker of test-strategy.md 5.11 (Phase 5 restart).
// Run from the repo root: node <this file> [--pm-nut3 | --nut3] [--control]. It reads files only. It writes stdout only.
// Exit 0: every check holds. Exit 1: a check failed (a FAIL line names it).
// --pm-nut3: the nut try 3 (PM order, 2026-11-05 08:44 ICT) ran and did not deliver.
// --nut3: the nut try 3 passed both kinds and w01/delivery-muse-v4 and the nut3 handoff exist.
// --control changes three expected values in memory (a pre-restart manifest pin, the cap, the judge
// model). A control run must exit 1 with the three FAIL lines; else the checks are vacuous (A4).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const NUT3 = process.argv.includes('--nut3');
const PM_NUT3 = NUT3 || process.argv.includes('--pm-nut3');
const CONTROL = process.argv.includes('--control');
const U = 'out/storytime/l2/unit1';
const RUNS = 'measure/runs/asset_storytime_l2_unit1_pictures_20261025';
const PROD = 'docs/storytime/l2-unit1/judge/prod';
const JC = 'out/storytime-review/judge/prod';
const HANDOFF = '/home/daniebo/Desktop/handoff';
const START = Date.parse('2026-11-04T07:54:00Z');
const MODEL = CONTROL ? 'control/no-such-model' : 'claude-code/claude-sonnet-5-5#high';
const CAP = CONTROL ? 510000n : 1000000n; // 1.00 USD in micro-USD; the control sets 0.51
const GROUP = { 'l2-w01-practice-line-nose': 'l2-w01-check-row-nose' };
const NUT = 'l2-w01-story-page-a-nut';
// Retries that a PM order caused (not a judge fail). Only the nut try 3 of 2026-11-05 08:44 ICT.
const PM_ORDER = new Set(PM_NUT3 ? [`${NUT}|color|3`, `${NUT}|line|3`] : []);
const PRE = {
  'w01/delivery-muse-v1': '00ea0c5b06d18e3f54cbceed9caa943100c0711bb515c44561eb46b7e03ed369',
  'w01/delivery-muse-v2': 'd3eec18ce7c94b94ed5b0751df164578558ad44f04bebe7b4b371a3ed213796a',
  'w02/delivery-muse-v1': '6e6b51450d406bfdac47e01f484925b270bd0b1647bbfc0550d7529809cfeaf4',
  'w03/delivery-muse-v1': '24213647b0f1b92cdb891746cdf6181ff7f20f306c51d256fec150c38d5c273b',
  'w04/delivery-muse-v1': '4e74b7302a851e0261099925a23c0b9246a533911374af01d9748b905320d310',
  'w05/delivery-muse-v1': 'c3f009e6bfcb3037ae24b495c6e68527bfbf86162deb3a40a9bbd28a416ffbaf',
  'w06/delivery-muse-v1': '11c5dc10198c9d446afc8ffd80aff46c747d2dec34b77293327907d729163292',
  'w07/delivery-muse-v1': '6a5724c42a83134d80fc1cd1ccecdafe1a76dd25961e040caffaafccc81ea3c2',
  'cover/delivery-muse-v1': '27710b3711757d99294b7e837377d325eb9a6094e1dad43e0f064d2581397b88',
};
if (CONTROL) PRE['w01/delivery-muse-v1'] = '0'.repeat(64);
const RESTART = {
  'w01/delivery-muse-v3': '38a16765a061a8f71fba1fe5744c1b2aa3b48b35b87352c12302ce519e44dce0',
  'w02/delivery-muse-v2': 'c59a75bb30def25168bd90effbf44931e2d6a0a4844b1b961ce8105b61146ae5',
  'w03/delivery-muse-v2': 'bb7a27525fcd8da28a9cf8148a2f39bcc2e0609ef86a0648425b66c8ecafa30a',
  'w04/delivery-muse-v2': '82d467e6ecedd7caea7331dd9088c35d000db16d67c1a80f8818f68dfd2fe52c',
  'w05/delivery-muse-v2': '0e2fde98f4610afbe49637241f3887e1378dd6f293a69d763df8362d453885ca',
  'w06/delivery-muse-v2': '66bb2f62b46a8dcc2e0497ab9b637929ec0d93b2de56a27b84eccb5b6d33ee60',
  'w07/delivery-muse-v2': '352b2dabe598f80ed4d9ef10977c86f9a988c9d6e8a59cfea52fa59ced1f32b4',
  'w05/delivery-a48-d': '0fa7b23268449a9f83365eb4ea03057a1a6453b291bcdf697251fd0421f39fea',
  'w07/delivery-a48-d': '36b4febcdcdc80d10c789866e1d468b88708389cc7af28bfd79778cf299b8eb8',
  'w08/delivery-muse-v1': '2dc0812b3a90be19bd288d622d1c9fdd4d682bd013c2c99242441f09a71b9f92',
};
const NUT3_DIR = 'w01/delivery-muse-v4';
const HANDOFFS = { drum: 2, c: 4, a: 25, b: 14, d: 4, ...(NUT3 ? { nut3: 2 } : {}) };

let failures = 0;
const fail = (m) => { failures += 1; console.log(`FAIL ${m}`); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const json = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const group = (id) => GROUP[id] ?? id;
const micro = (v) => {
  if (!/^\d+(\.\d{1,6})?$/.test(v)) return null;
  const [i, d = ''] = v.split('.');
  return BigInt(i) * 1000000n + BigInt((d + '000000').slice(0, 6));
};
const usd = (m) => `${m / 1000000n}.${String((m % 1000000n) / 10000n).padStart(2, '0')}`;

// 1. Restart rows of every Muse cost file (week folders and element folders).
const costFiles = [];
for (const w of fs.readdirSync(U).sort()) {
  for (const s of ['muse/costs.tsv', 'muse/elements/costs.tsv']) {
    const f = path.join(U, w, s);
    if (fs.existsSync(f)) costFiles.push(f);
  }
}
const rows = [];
let spend = 0n;
let badTime = 0;
for (const f of costFiles) {
  const [head, ...lines] = fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim());
  const H = head.split('\t');
  const col = Object.fromEntries(['time', 'row', 'version', 'kind', 'inputs', 'output', 'usage_cost'].map((n) => [n, H.indexOf(n)]));
  if (col.time < 0 || col.usage_cost < 0 || col.row < 0 || col.kind < 0 || col.output < 0) { fail(`header without a needed column: ${f}`); continue; }
  for (const l of lines) {
    const c = l.split('\t');
    const t = Date.parse(c[col.time]);
    if (Number.isNaN(t)) { badTime += 1; continue; }
    if (t < START) continue;
    const m = micro((c[col.usage_cost] ?? '').trim());
    if (m === null) { fail(`usage_cost is not a decimal: ${f}: ${l}`); continue; }
    spend += m;
    rows.push({ f, dir: path.dirname(f), t, row: c[col.row], kind: c[col.kind], out: c[col.output], inp: c[col.inputs] ?? '', m });
  }
}
console.log(`cost files read: ${costFiles.length}`);
console.log(`cost rows with an unreadable time: ${badTime}`);
console.log(`restart cost rows: ${rows.length}`);
console.log(`restart spend (USD): ${usd(spend)}`);
if (badTime !== 0) fail(`cost rows with an unreadable time: ${badTime}`);
if (spend > CAP) fail(`restart spend ${usd(spend)} is above the cap ${usd(CAP)}`);

// Tries: rows with a cost above 0 and an output, kind color or line, counted per picture group.
const tryRows = rows.filter((r) => (r.kind === 'color' || r.kind === 'line') && r.m > 0n && r.out !== 'none');
console.log(`restart failed calls (cost 0 or output none): ${rows.length - tryRows.length}`);
const perGroup = new Map();
for (const r of tryRows) { const k = `${group(r.row)}|${r.kind}`; perGroup.set(k, (perGroup.get(k) ?? 0) + 1); }
const maxTries = Math.max(0, ...perGroup.values());
const over = [...perGroup].filter(([, n]) => n > 3);
console.log(`picture and kind pairs with a try: ${perGroup.size}`);
console.log(`max tries for one picture and kind: ${maxTries}`);
console.log(`picture and kind pairs above 3 tries: ${over.length}`);
console.log(`nut tries color: ${perGroup.get(`${NUT}|color`) ?? 0} line: ${perGroup.get(`${NUT}|line`) ?? 0}`);
for (const [k, n] of over) fail(`${k} has ${n} tries`);
// Judge copy number n of one id and kind: the n-th restart row of that id and kind in its cost
// file, in time order, failed rows included (restartTries of scripts/storytime-judge-batch.mjs).
const rowsOf = (r) => rows.filter((x) => x.f === r.f && x.row === r.row && x.kind === r.kind && (x.kind === 'color' || x.kind === 'line')).sort((a, b) => a.t - b.t);
const tryOf = (r) => rowsOf(r).indexOf(r) + 1;
const prevTryOf = (r) => { const all = rowsOf(r); const before = all.slice(0, all.indexOf(r)).filter((x) => tryRows.includes(x)); return before.length ? all.indexOf(before[before.length - 1]) + 1 : 0; };

// 2. Judge kit and calibration.
const PROMPT_SHA = 'db5b443a6ea7740f435fedb7f13d0fd12971332c08b6e71d09e4a468da02ffd8';
const CAST_SHA = '2eb4a6a14d2ba6e49223e27d9ad390aad7ba1d247b272f6a467742b931046e76';
const ps = sha('docs/storytime/l2-unit1/judge/judge-prompt.md');
const cs = sha('docs/storytime/l2-unit1/judge/cast.json');
console.log(`judge prompt sha256: ${ps}`);
console.log(`judge cast sha256: ${cs}`);
if (ps !== PROMPT_SHA) fail('judge prompt SHA-256 differs from the calibration value');
if (cs !== CAST_SHA) fail('judge cast SHA-256 differs from the calibration value');
const headerOk = (j) => j.status === 'complete' && j.model === MODEL && /judge-prompt\.md v6$/.test(j.judgePrompt ?? '') && /2eb4a6a1/.test(j.cast ?? '');
const calSet = json('docs/storytime/l2-unit1/judge/calibration-set.json').entries;
const calExpected = new Map(calSet.map((e) => [e.judgeFile, e.expected]));
let calPass = 0, calFail = 0, calFiles = 0, calCtrl = 0, calCtrlFail = 0, calPassBroken = 0;
const calSeen = new Set();
for (const g of ['w01', 'w02', 'w03', 'w04', 'w05', 'w06', 'w07', 'cover']) {
  const f = `${RUNS}/judge-cal-${g}-aba118fe.json`;
  if (!fs.existsSync(f)) { fail(`missing ${f}`); continue; }
  const j = json(f);
  if (!headerOk(j)) fail(`calibration header or status: ${f}`);
  let p = 0, x = 0;
  for (const r of j.results) {
    calFiles += 1; calSeen.add(r.judgeFile);
    if (r.verdict === 'pass') p += 1; else if (r.verdict === 'fail') x += 1; else fail(`verdict ${r.verdict} in ${f}`);
    const e = calExpected.get(r.judgeFile);
    if (e === undefined) fail(`calibration result for a file outside the set: ${r.judgeFile}`);
    if (e === 'fail') { calCtrl += 1; if (r.verdict === 'fail') calCtrlFail += 1; }
    if (e === 'pass' && r.verdict !== 'pass') calPassBroken += 1;
  }
  if (j.summary?.pass !== p || j.summary?.fail !== x || j.summary?.files !== j.results.length) fail(`summary of ${f} differs from its results`);
  calPass += p; calFail += x;
}
console.log(`calibration files judged: ${calFiles} pass: ${calPass} fail: ${calFail}`);
console.log(`calibration set entries without a result: ${calSet.filter((e) => !calSeen.has(e.judgeFile)).length}`);
console.log(`calibration gate controls: ${calCtrl} failed: ${calCtrlFail}`);
console.log(`calibration expected-pass files that did not pass: ${calPassBroken}`);
if (calFiles !== 388 || calPass !== 381 || calFail !== 7) fail('calibration counts differ from 388 / 381 / 7');
if (calCtrl !== 2 || calCtrlFail !== 2) fail('a gate control did not fail');
if (calPassBroken !== 0) fail('an expected-pass calibration file did not pass');
if (calSet.length !== 388 || calSeen.size !== 388) fail('calibration set and results differ');

// 3. Production judge results, tied to their batch files.
const prod = [];
for (const f of fs.readdirSync(RUNS).filter((n) => /^judge-prod-.*\.json$/.test(n)).sort()) {
  const j = json(`${RUNS}/${f}`);
  const second = f.includes('-second-');
  if (!headerOk(j)) { fail(`production header or status: ${f}`); continue; }
  const batch = `${PROD}/batch-${String(j.group).replace(/^prod-/, '')}.json`;
  const entries = second ? null : (fs.existsSync(batch) ? json(batch) : null);
  if (!second && !entries) { fail(`no batch file ${batch} for ${f}`); continue; }
  for (const r of j.results) {
    if (!second && !entries.some((e) => e.judgeFile === r.judgeFile && e.id === r.id && e.kind === r.kind)) fail(`${f}: ${r.judgeFile} is not in ${batch}`);
    if (!fs.existsSync(r.judgeFile)) fail(`${f}: judge copy missing ${r.judgeFile}`);
    prod.push({ f, second, ...r });
  }
}
const main = prod.filter((r) => !r.second);
console.log(`production result files: ${new Set(prod.map((r) => r.f)).size} results: ${main.length} second-judge results: ${prod.length - main.length}`);
console.log(`production main fails: ${main.filter((r) => r.verdict === 'fail').length}`);

// 4. Retry rule: each later try follows a fail of the try before it that a second judge confirms,
// or a PM order.
const jf = (id, kind, n) => `${JC}/${id}-${kind}-t${n}.png`;
let retries = 0, retriesConfirmed = 0, retriesPm = 0;
for (const r of tryRows) {
  const n = tryOf(r);
  const p = prevTryOf(r);
  if (p === 0) continue;
  retries += 1;
  const prev = jf(r.row, r.kind, p);
  const m1 = main.find((x) => x.judgeFile === prev && x.verdict === 'fail');
  const s1 = prod.find((x) => x.second && x.judgeFile === prev && x.verdict === 'fail');
  const s1pass = prod.find((x) => x.second && x.judgeFile === prev && x.verdict === 'pass');
  if (m1 && s1 && !s1pass) retriesConfirmed += 1;
  else if (PM_ORDER.has(`${r.row}|${r.kind}|${n}`)) retriesPm += 1;
  else fail(`try ${n} of ${r.row} ${r.kind} has no confirmed fail of try ${p} and no PM order`);
}
console.log(`retries: ${retries} after a confirmed fail: ${retriesConfirmed} by PM order: ${retriesPm}`);
const disagree = prod.filter((y) => y.second && main.some((x) => x.judgeFile === y.judgeFile && x.verdict !== y.verdict));
console.log(`second-judge results that differ from the main verdict: ${disagree.length}`);
// The judge copies of the nut tries 1 and 2 keep their bytes; a try 3 batch names the new mustShow.
const NUT_COPIES = {
  'color-t1': '8f62fb3871c1dbc9f7c481a575cccbadf6a84fa872aeb8c248c4704c7b339041',
  'color-t2': '8ed540398c94554e5239440fd9d98300a4033c5bd8b35f55b8fb27ada4d14c52',
  'line-t1': 'd9b784e2b7920a6a4d7d9f82b4e07bb3b10c0811c9e9f11258c2ef1a71826d38',
  'line-t2': '6ba147242f5f2b19a44146789546b39b34424400e27d6dc976ff9d1b3e8e5360',
};
let nutCopyBad = 0;
for (const [k, v] of Object.entries(NUT_COPIES)) if (sha(`${JC}/${NUT}-${k}.png`) !== v) { nutCopyBad += 1; fail(`judge copy ${NUT}-${k}.png changed`); }
console.log(`nut judge copies of tries 1 and 2 changed: ${nutCopyBad}`);
if (PM_NUT3) {
  for (const kind of ['color', 'line']) {
    const r3 = main.find((x) => x.judgeFile === jf(NUT, kind, 3));
    const b3 = r3 && json(`${PROD}/batch-${JSON.parse(fs.readFileSync(`${RUNS}/${r3.f}`, 'utf8')).group.replace(/^prod-/, '')}.json`).find((e) => e.judgeFile === r3.judgeFile);
    console.log(`nut ${kind} try 3 verdict: ${r3 ? r3.verdict : 'none'}`);
    if (!r3) fail(`no judge result for the nut ${kind} try 3`);
    else if (!(b3?.mustShow ?? []).includes('one nut, clearly a nut')) fail(`the nut ${kind} try 3 batch has no mustShow "one nut, clearly a nut"`);
    if (NUT3 && r3?.verdict !== 'pass') fail(`--nut3 needs a pass of the nut ${kind} try 3`);
  }
}
if (PM_NUT3 && (perGroup.get(`${NUT}|color`) !== 3 || perGroup.get(`${NUT}|line`) !== 3)) fail('the PM nut order needs 3 color tries and 3 line tries of the nut');
if (!PM_NUT3 && ((perGroup.get(`${NUT}|color`) ?? 0) > 2 || (perGroup.get(`${NUT}|line`) ?? 0) > 2)) fail('the nut has a try 3: run with --pm-nut3 or --nut3');

// 5. Delivered files of the restart: each one is byte-equal to the print of a passing try.
for (const [d, want] of Object.entries(PRE)) {
  const got = sha(`${U}/${d}/manifest.json`);
  console.log(`manifest sha256 ${d}: ${got}`);
  if (got !== want) fail(`pre-restart manifest changed: ${d}`);
}
const restartDirs = { ...RESTART };
if (NUT3) restartDirs[NUT3_DIR] = null;
for (const w of fs.readdirSync(U)) {
  const p = path.join(U, w);
  if (!fs.statSync(p).isDirectory()) continue;
  for (const d of fs.readdirSync(p).filter((n) => n.startsWith('delivery-'))) {
    const k = `${w}/${d}`;
    if (!(k in PRE) && !(k in restartDirs)) fail(`unknown delivery folder ${k}`);
  }
}
if (!NUT3 && fs.existsSync(`${U}/${NUT3_DIR}`)) fail(`${NUT3_DIR} exists, but the run has no --nut3`);
const delivered = [];
const approvalsW08 = json('docs/storytime/l2-unit1/w08/muse/approved.json').entries;
for (const [d, want] of Object.entries(restartDirs)) {
  const dir = `${U}/${d}`;
  if (!fs.existsSync(`${dir}/manifest.json`)) { fail(`no manifest in ${d}`); continue; }
  const got = sha(`${dir}/manifest.json`);
  console.log(`manifest sha256 ${d}: ${got}`);
  if (want && got !== want) fail(`restart manifest changed: ${d}`);
  const man = json(`${dir}/manifest.json`);
  let entries;
  if (Array.isArray(man.files)) {
    entries = man.files.map((e) => ({ id: e.pictureId, kind: e.kind, file: e.file, sha256: e.sha256, source: e.source }));
  } else {
    entries = [];
    for (const job of man.jobs) {
      const a = approvalsW08.find((e) => e.rowId === job.id);
      if (!a) { fail(`${d}: no approval entry for ${job.id}`); continue; }
      for (const c of job.candidates) {
        const kind = /-line-v\d+\.png$/.test(c.file) ? 'line' : 'color';
        entries.push({ id: job.id, kind, file: c.file, sha256: c.fileSha256, source: `${U}/w08/muse/${kind === 'line' ? a.linePrint : a.colorPrint}` });
        if (c.lineArt?.file) entries.push({ id: job.id, kind: 'line', file: c.lineArt.file, sha256: c.lineArt.fileSha256, source: `${U}/w08/muse/${a.linePrint}` });
      }
    }
  }
  const pngs = fs.readdirSync(dir).filter((n) => n.endsWith('.png')).sort();
  const named = [...new Set(entries.map((e) => e.file))].sort();
  if (JSON.stringify(pngs) !== JSON.stringify(named)) fail(`${d}: PNG set and manifest set differ (${pngs.length} / ${named.length})`);
  for (const e of entries) delivered.push({ dir: d, ...e });
}
let byteOk = 0, passOk = 0, formatBad = 0;
const pictures = new Set();
const colorOut = new Map();
for (const e of delivered) {
  const file = `${U}/${e.dir}/${e.file}`;
  if (!fs.existsSync(file) || !fs.existsSync(e.source)) { fail(`${e.dir}/${e.file}: file or source missing`); continue; }
  const s = sha(file);
  if (s !== e.sha256 || s !== sha(e.source)) { fail(`${e.dir}/${e.file}: bytes differ from the manifest or the source print`); continue; }
  byteOk += 1;
  const ihdr = fs.readFileSync(file).subarray(16, 26);
  const [w, h, depth, type] = [ihdr.readUInt32BE(0), ihdr.readUInt32BE(4), ihdr[8], ihdr[9]];
  const [ww, wh] = e.id.includes('-story-page-') ? [4000, 3000] : [1500, 1500];
  if (w !== ww || h !== wh) { formatBad += 1; fail(`${e.dir}/${e.file}: ${w}x${h}, ${ww}x${wh} wanted`); }
  if (e.kind === 'line' && (depth !== 8 || type !== 0)) { formatBad += 1; fail(`${e.dir}/${e.file}: line file is not 8-bit gray (depth ${depth}, type ${type})`); }
  const outName = path.basename(e.source).replace('-print', '');
  const r = tryRows.find((x) => x.dir === path.dirname(e.source) && x.out === outName && x.kind === e.kind);
  if (!r) { fail(`${e.dir}/${e.file}: no restart try has the output ${outName}`); continue; }
  if (group(r.row) !== group(e.id)) fail(`${e.dir}/${e.file}: try row ${r.row} is not picture ${e.id}`);
  const n = tryOf(r);
  const j = jf(r.row, r.kind, n);
  const pass = main.find((x) => x.judgeFile === j && x.verdict === 'pass');
  if (!pass) { fail(`${e.dir}/${e.file}: try ${n} (${j}) has no pass verdict`); continue; }
  passOk += 1;
  for (let k = 1; k < n; k += 1) {
    if (main.some((x) => x.judgeFile === jf(r.row, r.kind, k) && x.verdict === 'pass') && !PM_ORDER.has(`${r.row}|${r.kind}|${n}`)) fail(`${e.dir}/${e.file}: try ${n} is delivered, but try ${k} passed first`);
  }
  if (e.dir === NUT3_DIR && (group(e.id) !== NUT || n !== 3)) fail(`${e.dir}/${e.file}: the folder holds only the nut try 3 pair`);
  pictures.add(group(e.id));
  if (e.kind === 'color') colorOut.set(`${e.dir}|${group(e.id)}`, r.out);
  else e.lineInput = path.basename(r.inp);
  e.pass = `${pass.f} try ${n}`;
}
// The line try of a delivered pair starts from the delivered color try.
let twinBad = 0;
for (const e of delivered.filter((x) => x.kind === 'line' && x.lineInput)) {
  const c = colorOut.get(`${e.dir}|${group(e.id)}`);
  if (c && c !== e.lineInput) { twinBad += 1; fail(`${e.dir}/${e.file}: line input ${e.lineInput} is not the delivered color ${c}`); }
}
console.log(`restart delivery folders: ${Object.keys(restartDirs).length}`);
console.log(`restart delivered files: ${delivered.length} byte-equal to a source print: ${byteOk} with a pass verdict: ${passOk}`);
console.log(`restart delivered pictures: ${pictures.size}`);
console.log(`line files not made from the delivered color: ${twinBad}`);
console.log(`restart delivered files with a wrong size or line format: ${formatBad}`);
const wantFiles = 49 + (NUT3 ? 2 : 0);
if (delivered.length !== wantFiles || byteOk !== wantFiles || passOk !== wantFiles) fail(`restart delivered files are not ${wantFiles}`);
if (pictures.size !== 24) fail('restart delivered pictures are not 24');

// 6. Handoff folders.
const byName = new Map();
for (const e of delivered) { const k = e.file; if (!byName.has(k)) byName.set(k, new Set()); byName.get(k).add(e.sha256); }
for (const [h, n] of Object.entries(HANDOFFS)) {
  const dir = `${HANDOFF}/a48-forge-pictures-${h}`;
  if (!fs.existsSync(`${dir}/MANIFEST.txt`)) { fail(`no MANIFEST.txt in ${dir}`); continue; }
  const pngs = fs.readdirSync(dir).filter((x) => x.endsWith('.png')).sort();
  const text = fs.readFileSync(`${dir}/MANIFEST.txt`, 'utf8');
  const lines = [...text.matchAll(/^([0-9a-f]{64})  ([^\s/]+\.png)$/gm)];
  const listed = [...new Set(lines.map((m) => m[2]))].sort();
  let eq = 0;
  for (const p of pngs) {
    const s = sha(`${dir}/${p}`);
    if (byName.get(p)?.has(s)) eq += 1; else fail(`handoff ${h}/${p} is not byte-equal to a restart delivery file`);
    if (lines.some((m) => m[2] === p && m[1] !== s)) fail(`handoff ${h}/${p}: MANIFEST line differs from the file`);
  }
  console.log(`handoff ${h}: files: ${pngs.length} manifest lines: ${listed.length} byte-equal to delivery: ${eq} evidence words: ${text.includes('model evidence, not acceptance') ? 'yes' : 'no'}`);
  if (pngs.length !== n) fail(`handoff ${h}: ${pngs.length} files, ${n} wanted`);
  if (JSON.stringify(pngs) !== JSON.stringify(listed)) fail(`handoff ${h}: MANIFEST lines and files differ`);
  if (!text.includes('model evidence, not acceptance')) fail(`handoff ${h}: no "model evidence, not acceptance"`);
}
if (!NUT3 && fs.existsSync(`${HANDOFF}/a48-forge-pictures-nut3`)) fail('a48-forge-pictures-nut3 exists, but the run has no --nut3');

console.log(`restart check: ${failures === 0 ? 'pass' : `fail (${failures})`}`);
process.exit(failures === 0 ? 0 : 1);
```
<!-- restart-check.mjs end -->

###### 5.11.6 Evidence pins (X3)

The judge result files and the handoff `MANIFEST.txt` files are outside git until closeout. The
pins hold their bytes at `f25d8399`. New nut result files are additions and have no pin.

```sh
awk '/^<!-- restart-pins end -->$/{f=0} f; /^<!-- restart-pins begin -->$/{f=1}' "$T/test-strategy.md" | sed '1d;$d' > "$D/pins.sha256"
echo "pin lines: $(wc -l < "$D/pins.sha256")"
sha256sum -c --quiet "$D/pins.sha256"; echo "pin check exit: $?"
```

Expected: `pin lines: 28` and `pin check exit: 0`.

<!-- restart-pins begin -->
```text
4e7f7d78ac1d416924e54c1702d464744c232924114e39984369e4e5a44475fa  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-cal-cover-aba118fe.json
3d82f90dd1c2c0b083f1e7241da50fcb6756b6e128520dbbf1084d8c5ca23603  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-cal-w01-aba118fe.json
fa97f8445f9dd9e1e9c17e3332672c26a1211ad47f0e17a2e2eb9659f7c620ce  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-cal-w02-aba118fe.json
9c0ab8b2be5c80bfd627f2ffa87b882a6c5991d6aeeed5b1d73cd8092aa4491d  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-cal-w03-aba118fe.json
a630e61f8f0bd9744383ea0f56872f933e8aecb36021d5135b58b2bd88278110  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-cal-w04-aba118fe.json
a5da369be3bbff5738bd66b6ca051d243e8e66e086771f53c2c2a7eaf275e8d7  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-cal-w05-aba118fe.json
529e2d3d9c40472ad247290cc5ca6c06bcc2a9312ab4c35a44f5ca878c006bec  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-cal-w06-aba118fe.json
63505600fd13d2621d82abccd0fbcbde8e5aeb01e2c360df44e659b808920112  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-cal-w07-aba118fe.json
08b2dd4a5345f9c806d36ee65346c31a9df51fdda5a9c2fbd35054ab33bdc7e5  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r1-color-a2-second-f15bff60.json
f7a5efd7cfe3e6c4e905a2f54bee8b861eaee86aaa3e49c6d4db2823b968d228  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r1-color-f15bff60.json
042ba8362d75180cc74190582b5b092247bb476836ed5207cb203bc66416afbd  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r2-color-186d78ba.json
d3a2b227c1b253a954c2c10cb52aba47fdda4f696cf9a5d653fff16ed130ba52  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r2-color-a11-second-a1783749.json
6f99f0874be37198fe59a0aa348579c6220b8cfb8ae043637bc994b4ae4753b7  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r2-color-a2-186d78ba.json
adb8cbeba76edd4b06dd806ba2e6a99438bc226c91e435a2cb5226a77d4e16b2  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r2-line-186d78ba.json
02951b4905ebbc3018bc8a7c44a0eda28f5d056a07891fba10e0d56d6c710b5f  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r2-line-a1-second-a1783749.json
242a448e32f4e5a8bbb6cae4cb23995bd7993e8b96d40e8e1b5fbb4a7cbe34a0  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r3-line-a1783749.json
cebc3c884bd8e718d6e28e98e172fe4f48a291f6f663db076d5649dabd62acbb  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r3-line-a2-second-a1783749.json
262d00432d43bcbb6b7e21739dcab6fc252adbbc134ada940a0c0afb31325481  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r4-color-a1783749.json
a0c4688539d893a6491c4e901d122605fb407c98e6e94d4c8de2cd0de745e143  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r4-line-a1783749.json
47b5bd5fbddfe7a48e66f58e40f4a0c86c690740bb17ce566f3ab791a06ebf41  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r5-color-retry-1e43b8b8.json
a4ea7373320f959b62665fcf392822f162bcfa881884745b8f229bb171b84e1f  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r5-line-1e43b8b8.json
c5002e8c28192ccb917ab4c1bc4b370280e3e97e620d9e155d439b33ffe8b825  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r5-line-retry-1e43b8b8.json
6affa1ba02c18eb01df6c1950b7399b5d52b53a042833b11edfff98728c79f11  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r6-line-38cb0ca4.json
5115ebf723de417f05d191fe1be01fed05c4ccff1e0ac4d1bb1a81069aed98fd  /home/daniebo/Desktop/handoff/a48-forge-pictures-drum/MANIFEST.txt
9402b5d2e7646cee72702f8900e5784ee2929379f2879e1a50bc4f6065ff54f4  /home/daniebo/Desktop/handoff/a48-forge-pictures-c/MANIFEST.txt
9c47d40898956a1d49258bf81552068065710996c04b11faefad490554e43458  /home/daniebo/Desktop/handoff/a48-forge-pictures-a/MANIFEST.txt
e8a0df7960d51d5522c402b5388796cf6c39a8814f740986ec5cad2401c0bb44  /home/daniebo/Desktop/handoff/a48-forge-pictures-b/MANIFEST.txt
9737e0c1c9f08e40bc75ef2807f5fcb6acced0b598a530c856bdec971f3a189e  /home/daniebo/Desktop/handoff/a48-forge-pictures-d/MANIFEST.txt
```
<!-- restart-pins end -->

###### 5.11.7 Gates (the plan quotes each output)

`T` is the track folder. `R` is the run folder. `D` is the temp folder of 5.11.3.

| Gate | Check | Falsification condition |
| --- | --- | --- |
| X1 Code drift | The X1 lines of 5.11.3 give the expected values. | A file of this track's commits is outside the allowed set, a foreign commit touches a Storytime path, or a merge commit is in the range. |
| X2 Freeze | The four X2 lines print `0`. | A script, source, or test file other than the guards type file changes after `P5R_BASE`, an earlier batch file changes, another spec changes, or the judge kit changes after `c132d866`. |
| X3 Pins | 5.11.6 gives `pin lines: 28` and `pin check exit: 0`. | An untracked judge result or a handoff `MANIFEST.txt` changed. |
| X4 Restart check | `restart check exit: 0` in the mode of the nut result, every label of 5.11.5 with its value, and `restart control exit: 1` with the three named FAIL lines. | A label is missing or differs, or the control exits `0`. |
| X5 Spend and tries (Decisions 4 and 5) | X4 shows `restart spend (USD):` 1.00 or less and `picture and kind pairs above 3 tries: 0`. The plan quotes the same spend and row count. | The spend passes 1.00, a pair has 4 tries, the two nose ids count as two pictures, or the plan number differs from the script. |
| X6 Judge evidence (Decisions 1 to 3) | X4 shows the kit SHA-256 values, the calibration counts, and `with a pass verdict:` equal to the delivered file count. Each retry after a fail has a second-judge fail. | A delivered file has no pass verdict, a try passed earlier than the delivered try, or a retry follows an unconfirmed fail. |
| X7 Deliveries | X4 shows the folder, file, and handoff counts. The handoff check commands exit `0` with the stated `OK` counts. The two `delivery-a48-d` manifests name their id in `missingPictureListRows`. | A count differs, a handoff file differs from its delivery file, or a check command exits non-zero. |
| X8 Earlier deliveries | The ledger command below prints `ledger lines: 385` and `ledger check exit: 0`. X4 shows the nine pre-restart manifest SHA-256 values of 5.1. | A delivered file of weeks 1 to 7 or the cover changed. |
| X9 Task 3 content | `ls out/storytime/l2/unit1/w08/delivery-muse-v1/*.png \| wc -l` prints 6 (drum, moon, mango, color and line). `ls out/storytime/l2/unit1/w07/delivery-muse-v2/ \| grep -c '^l2-w07-check-row-ostrich'` prints 2. X4 passes, so each of these files has a pass verdict. | A list C file or an ostrich file is missing or has no pass. |
| X10 Tests | GREEN_TEST_COMMAND (maker) and PROJECT_TESTS (checker) exit `0` with their labeled totals. KNOWN_RED_COMMAND gives exactly 8 failures with the pin reason. | A failure, a skip, a `-t` filter, a ninth known-red failure, or a known-red body without a list pin name. |
| X11 Type check | `owned tsc errors: 0` and `tsc errors total:` 38 or less. | An owned error remains, or the total rises. |
| X12 Task lines | The X12 command below prints `phase 5 task lines: 7`, `phase 5 tasks [x]: 7`, and `phase 5 tasks with a commit on the first line: 7`. `metadata.json` `actual_tasks` equals `grep -cE '^- \[x\] Task' "$T/plan.md"`, and `status` is `in_progress`. `measure_interphase_checks.py status --track asset_storytime_l2_unit1_pictures_20261025` prints `incomplete_phases: 0`. | A SHA is on a later line, a SHA is not a commit, a task is not `[x]`, or the metadata count differs. |
| X13 Wording | The X13 command prints nothing. The seed control matches its line. The w08 approval-list notes and the handoff manifests obey the file-level rules. | An unqualified match remains, or the seed is missed. |
| X14 No secret | The X14 command prints nothing. | A key-like string is in a new file. |
| X15 Facts and doctor | The structural doctor prints no error line that holds `asset_storytime_l2_unit1_pictures_20261025` or an owned path. The checker quotes the error count and every error line. | An error names this track or an owned file. |

X8 ledger command (light; it reads about 2.5 GB once; never beside a vitest run):

```sh
R=measure/runs/asset_storytime_l2_unit1_pictures_20261025
awk -F'\t' 'NR>1{d=($1=="cover")?"cover/delivery-muse-v1":($1=="w01")?"w01/delivery-muse-v2":$1"/delivery-muse-v1"; print $5"  out/storytime/l2/unit1/"d"/"$4}' "$R/release-files-p5.tsv" > "$D/ledger.sha256"
echo "ledger lines: $(wc -l < "$D/ledger.sha256")"
nice -n 19 sha256sum -c --quiet "$D/ledger.sha256"; echo "ledger check exit: $?"
```

X12 command:

```sh
awk '/^## Phase 5: Documentation and verification$/{f=1;next} /^## /{f=0} f && /^- \[.\] Task/' "$T/plan.md" > "$D/p5-tasks.txt"
echo "phase 5 task lines: $(wc -l < "$D/p5-tasks.txt")"
echo "phase 5 tasks [x]: $(grep -c '^- \[x\]' "$D/p5-tasks.txt")"
n=0; while IFS= read -r l; do for s in $(grep -oE '\b[0-9a-f]{7,40}\b' <<< "$l"); do [ "$(git cat-file -t "$s" 2>/dev/null)" = commit ] && { n=$((n+1)); break; }; done; done < "$D/p5-tasks.txt"
echo "phase 5 tasks with a commit on the first line: $n"
```

The checker also runs `git show --stat` on each first-line SHA. The commit must hold the evidence of
its task (the plan note, the batch, or the approval list).

X13 command (case-sensitive qualifiers; `$Q` lists the words that qualify a line):

```sh
Q='judge-approved|judge-passed|model evidence|not acceptance|approved\.json|approval list|Daniel|person-review|owner-passed|“Approved”|"Approved|Approved\. |PM format|approved 3D character|approved character|approved children|not yet approved|No Workbooks acceptance|acceptance (JSON|file|log)|measure-phase-acceptance|[Ff]inal acceptance|Phase [0-9] acceptance'
W='\b(accepted|owner-approved|approved|production-ready)\b'
git diff "$P5BASE"..HEAD -- "$T/plan.md" "$T/metadata.json" measure/tracks.md measure/status.md docs/storytime/l2-unit1/a48 docs/storytime/l2-unit1/judge docs/storytime/l2-unit1/w08 | grep -E '^\+' | grep -Ei "$W" | grep -Ev "$Q"
printf '+  The nut v3 pair is accepted.\n' | grep -Ei "$W" | grep -Ev "$Q" | grep -c accepted   # seed control: prints 1
```

File-level rules (X13):

- In `docs/storytime/l2-unit1/w08/muse/approved.json`, a note with "approved print" is qualified when
  `notes[0]` of the same entry holds "model evidence, not the person count". The checker reads
  each entry. "Approved print" there names an entry of the approval list.
- In a handoff `MANIFEST.txt` or a copy-way `manifest.json`, "approved" is qualified when the file
  holds "model evidence, not acceptance" (handoff) or "judge-approved" (`producedBy`). X4 checks
  the handoff words.
- The logs in `$R` are records. X13 does not read them. X14 reads them.

At `f25d8399` the X13 command prints 8 lines: the 3 w08 approval notes (qualified by the first
file-level rule) and 5 plan lines (finding F3).

X14 command:

```sh
grep -EnI 'sk-[A-Za-z0-9]{16,}|Bearer [A-Za-z0-9._-]{16,}|api[_-]?key.{0,20}[:=]|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY' -r docs/storytime/l2-unit1/a48 docs/storytime/l2-unit1/judge docs/storytime/l2-unit1/w08 "$R"/judge-*.json "$R"/jr-green-p5-*.log "$R"/strategy-p5-*.log scripts/storytime-muse.mjs scripts/storytime-muse-guards.mjs scripts/storytime-judge-batch.mjs scripts/storytime-judge-set.mjs out/storytime/l2/unit1/w0*/delivery-muse-v[234]/manifest.json out/storytime/l2/unit1/w0*/delivery-a48-d/manifest.json /home/daniebo/Desktop/handoff/a48-forge-pictures-*/MANIFEST.txt
```

At `f25d8399` the X14 command prints nothing (exit `1`).

X15: closeout owns the facts commit (Q3 of Task 2). Other sessions hold uncommitted edits in
`measure/tracks.md` and `measure/generated/`. So the maker does not run `./measure/generate.sh`,
and the checker does not run it (it writes). The checker runs
`node measure/tools/doctor.mjs --structural-only --root .` once. The error
`measure/generated/status.md: stale generated fact` is a known state until closeout. The heavy
doctor does not run (Q5). Closeout runs `./measure/generate.sh` and `./measure/doctor.sh` after
the archive move (A10).

Phase 5 is complete when X1 to X15 and G5 hold. Intentionally red aggregate suites: none. The
full `vitest run` and `pnpm test` stay outside this track (section 11). The known-red file has its
own command and count (X10). Type errors of other tracks stay known failures.

###### 5.11.8 The nut attempt 3 (PM order, 2026-11-05 08:44 ICT)

Workbooks looked at the v2 nut pair: the color shows two peanut pods side by side, and the line
art has sparse hatching. The PM ordered one more try of each kind before closeout. Rules:

- The maker makes color try 3 (the last color try; tries 1 and 2 were m2 and m3). Then the maker
  makes line try 3 from the new color (the last line try; tries 1 and 2 came from m3). The nut
  then has 3 color tries and 3 line tries. That is the cap of Decision 4.
- The spec change after the earlier tries is allowed: a stronger prompt, `mustShow` with
  "one nut, clearly a nut", and `deliverAs` v3. The new batch files are new files. The judge copies
  of tries 1 and 2 keep their bytes (X4 pins them), and their batch files do not change (X2).
- The Sonnet judge (prompt v6, cast `2eb4a6a1`) judges both tries. The judge is a model of a third
  family, so no maker judges its own work.
- The try 3 is a PM order, not a judge fail. So no second judge is needed for it.
- Both kinds pass: the maker delivers `l2-w01-story-page-a-nut-v3.png` and
  `l2-w01-story-page-a-nut-line-v3.png` in the new folder `w01/delivery-muse-v4/` (copy way, a
  hand-written `manifest.json` in the form of the other copy-way folders) and in the new handoff
  folder `/home/daniebo/Desktop/handoff/a48-forge-pictures-nut3/` (2 files and a `MANIFEST.txt` in
  the c-folder form with "model evidence, not acceptance" and its own check command). `NUT_MODE`
  is `--nut3`.
- One kind fails: the v2 pair stays the delivery. No v4 folder and no `nut3` folder exist. The best
  try goes to the PM with a note, and the plan names that file. `NUT_MODE` is `--pm-nut3`.
- In both cases, `w01/delivery-muse-v3/` and `a48-forge-pictures-a/` stay as they are (X3 and X4
  pins).
- The plan records the work as a "T4 step 9" block under T4. T4 stays `[x]` with `38cb0ca4` on its
  first line, so Phase 5 keeps 7 tasks. The block quotes the PM order, the two calls with their
  files and costs, the two judge result files and verdicts, the delivery result (v3, or v2 with
  the PM note), and the line "Restart spend total: <x> USD (<n> rows)".

###### 5.11.9 Roles and briefs

PM 2026-11-05: the light lane stays. One maker and one checker run. No Red role, no Reviews A, B,
or C, no adversarial role, and no browser review (5.11.11).

| Role | Agent and model | Work |
| --- | --- | --- |
| Maker | `measure-jr-green`; MiniMax or Kimi family, as the orchestrator routes. Not GLM, so the checker family stays apart. | The brief below. |
| Judge | Sonnet `claude-code/claude-sonnet-5-5#high`, prompt v6. | The nut try 3 batches only. |
| Checker | `measure-phase-acceptance` on `coding-plan/glm-5.3-flash#high` (PM route 2026-11-05). | The brief below. |

The checker is of a third family: the makers were MiniMax and Kimi, and the judge is Anthropic.
Escalation: if the first checker run returns `fail` or `inconclusive`, the orchestrator runs the
check once more on `coding-plan/glm-latest#high` before it routes a fix. No other escalation.

**Maker brief (`measure-jr-green`).** Stage explicit paths only. Other agents share the git index.

1. M1 The nut try 3 (5.11.8). Commit the spec change first. Run the color call:
   `node scripts/storytime-muse.mjs color docs/storytime/l2-unit1/a48/l2-w01-story-page-a-nut.json`.
   Build its batch:
   `node scripts/storytime-judge-batch.mjs --ids l2-w01-story-page-a-nut --kind color --try 3 --out batch-r7-color-nut3`.
   Commit the batch. After a color pass, run the line call with `line … --from <new version>`. Build
   and commit `batch-r7-line-nut3` the same way. One call at a time. Deliver per 5.11.8. Write the
   T4 step 9 block.
2. M2 Add `scripts/storytime-muse-guards.d.mts` (finding F2), in the form of
   `scripts/storytime-judge-batch.d.mts`. Change no runtime code. Run TYPECHECK_COMMAND once.
   Record `tsc errors total:` and `owned tsc errors:`.
3. M3 Fix the wording of the 5 plan lines of finding F3. Change "approved" to "judge-passed"
   where the text means a judge pass. Change it to "person-reviewed" where the text means Daniel's
   look. Change no number and no path.
4. M4 Close Task 3: `[x]`, with `6fd626c6` (the week 8 approval list with the drum, the moon, and the
   mango) on the first line. Add one note: list C is in `w08/delivery-muse-v1/` and the ostrich is
   in `w07/delivery-muse-v2/`, with the handoff folders `-drum`, `-c`, and `-a`.
5. M5 Put a commit SHA on the first lines of T5 and T6 (finding F1). Default: `f25d8399`, the commit
   that holds the T5 and T6 delivery record.
6. M6 Update `metadata.json`: `actual_tasks` from the grep of X12, `updated_at`, the restart
   folders, the handoff folders, and the run files in `evidence`. `status` stays `in_progress`.
   Update this track's line in `measure/tracks.md` in the 5.6 wording. Keep it `[~]`. Stage only
   this track's line (Q3).
7. M7 Run GREEN_TEST_COMMAND once, after M2. Quote the labeled totals in the plan.
8. M8 Run the restart check of 5.11.5 in the mode of the nut result and quote its labeled lines in
   the plan. Write the role log in `$R` with the result block. Do not commit `$R` (closeout
   commits it). Do not run `./measure/generate.sh`.

Return `blocked` if a Muse guard refuses a call, the spend projection passes 1.00 USD, or a test
fails outside the known-red file. Return `partial` with the exact output if only the doctor errors
of other tracks remain.

**Checker brief (`measure-phase-acceptance`).** Work on the final HEAD. Use read-only commands
only, except the temp folder `$D` under `/tmp/opencode/`. Edit no product file, no plan, and no
Measure document.

1. Rerun X1 to X15 and G5. Read the plan quotes and compare each one with your own output.
2. Extract the restart check, compare its SHA-256, and run it in the mode of the nut result and
   with `--control`.
3. Run PROJECT_TESTS once, then KNOWN_RED_COMMAND once, then TYPECHECK_COMMAND once. Run them one
   at a time.
4. Read every X13 match and give a reason for each one.
5. Write `$R/acceptance-p5-restart-<HEAD7>.json` (the audit result JSON of `contracts.md`) and
   `$R/acceptance-p5-restart-<HEAD7>.log` with each command, its exit code, and its labeled lines.
   Write `status: "pass"` only when `blocking_findings` and every `*_violations` array are empty.
   Do not commit them.

###### 5.11.10 Anti-pattern coverage (restart amendment)

| Class | Defense | Falsification condition |
| --- | --- | --- |
| A3 digit-only count | Every gate reads a label: `restart spend (USD):`, `restart delivered files: … with a pass verdict:`, `Tests  <N> passed (<N>)`, `owned tsc errors:`, `phase 5 tasks with a commit on the first line:`. Costs parse as exact decimal text to micro-USD, never a float. | A bare digit, a path digit, or a float sum satisfies a gate. The control run with the cap at 0.51 must fail on 0.52. |
| A4 vacuous pass | The control run must exit `1`. The nut modes exclude each other. A handoff check with no matched line exits `1`. The ledger needs 385 lines and the pins need 28 lines. The script fails on 0 delivered files (it wants 49 or 51). | The control exits `0`, a mode passes in the wrong state, or a run over 0 files passes. |
| A5 false claim | The plan quotes the script output, the spend, and the nut verdicts. The checker compares them. The untracked judge results carry pins (X3). The T5 and T6 first lines get a real commit (F1). | A plan number differs from the checker output, a pin fails, or a first-line SHA is not a commit. |
| A6 registry overstatement | `tracks.md` stays `[~]`, `metadata.json` stays `in_progress`, and the words of 5.6 apply. Each handoff `MANIFEST.txt` says "model evidence, not acceptance". | A plan, registry, or metadata line says "approved" or "accepted" for a judge pass (X13), or a handoff file lacks the words. |
| A7 over-broad filter | The script reads all 15 cost files, element folders included, and finds the columns by header name. It counts an unreadable time and does not drop it. It removes only the first `-print`. It groups the two nose ids. The handoff regex skips the source-path lines of the drum and c manifests and keeps every file line. | `cost files read:` is below 15, a row with a bad time disappears, the nose counts as two pictures, or `manifest lines:` differs from `files:`. |
| A10 generated-facts drift | The maker sets `actual_tasks` from the X12 grep. Closeout runs generate and doctor after the archive move. | The metadata count differs from the grep, or closeout commits facts from before the last plan edit. |
| A11 doc-to-code drift | The script uses the try rule of `restartTries` and `judgeFileName`. X4 ties each result to a batch entry and each delivered file to a judge copy, so a rule difference makes a pass go missing. The strategy pins the script SHA-256, the kit SHA-256 values, and the manifest SHA-256 values. | A delivered file maps to a judge copy that no batch names, the extracted script SHA-256 differs, or a document names a kit SHA that the files do not have. |

###### 5.11.11 Reviews, evidence classes, and aggregate suites

- Security review: **No**. The restart adds no trust boundary. The scripts read local files and
  call Muse through the existing tool and guards. X14 covers secrets.
- UX and API review: **No**. No UI and no public API change.
- Adversarial testing: **No**. The control run, the exclusive nut modes, and the pins stand in.
- Browser review: **No** (`UX_REQUIRED=never`).
- Artifact tests and live behavior: the restart check, the pins, the ledger, and the wording greps
  check artifacts (files, hashes, and records). The live behavior proof is the Muse calls and the
  Sonnet judge runs, recorded in the cost rows and the judge results. The checker makes no Muse call
  and no judge call. The vitest files prove the code of the guards, the batch builder, and the
  delivery names with fixtures.
- Evidence class of each picture: `delivered`, `independent model review` (the Sonnet judge). No
  person review exists for the 24 restart pictures. Daniel checks their look in the 11-10 book
  proof. No text says Workbooks accepted or printed a picture.

###### 5.11.12 Base capture point

1. `P5BASE` stays `4e171648d0101d9f7b34d0f486fc1494bc0a48e7`, the immutable Phase 5
   `phase_base_sha`. X1 and the X13 diff use it.
2. `f25d8399` is the `role_base_sha` of this strategy role only.
3. Immediately after the 5.11 strategy commit, the orchestrator runs `git rev-parse HEAD`. It
   records that committed value as `P5R_BASE` before any maker edit or commit. X2 uses it.
4. This subsection embeds no SHA for `P5R_BASE`.

###### 5.11.13 Findings at `f25d8399`

The restart check passed at `f25d8399`: 49 of 49 delivered files are byte-equal to a print with a
pass verdict. No delivered file lacks a passing judge result.

| Id | Class | Finding | Owner |
| --- | --- | --- | --- |
| F1 | Blocks X12 | The first lines of T5 and T6 hold no commit SHA. | Maker M5 |
| F2 | Blocks X11 | 20 owned type errors in `tests/storytime-muse-attempts.test.ts` (no type file for `scripts/storytime-muse-guards.mjs`). | Maker M2 |
| F3 | Blocks X13 | 5 Phase 5 plan lines use "approved" without a qualifier: the T3a calibration reading ("Every approved file passes"), the T4 step 1 dry-run line ("the approved nose color try 1"), the T4 step 2 finding 2 ("the old approved files m1 to m3"), and the T5 and T6 progress lines ("the approved try-1 prints"). | Maker M3 |
| F4 | Blocks X12 | `metadata.json` `actual_tasks` is 23. The plan has 28 `[x]` task lines (29 after Task 3). | Maker M6 |
| F5 | Expected | Task 3 is `[~]`. List C and the ostrich are delivered. | Maker M4 |
| N1 | Informational | The drum and c handoff manifests say "approved Muse prints". The file-level rule of X13 qualifies them, so nobody edits a delivered manifest. | none |
| N2 | Informational | `w08/muse/` holds `-line-despeckled` and `-line-print-despeckled` siblings. The delivered line files equal the plain `-line-print` files (X4), so no local filter made a delivered file. | none |
| N3 | Informational | The judge results are untracked until closeout. X3 pins them. | Closeout |

###### 5.11.14 PM exception: the nut line try 4 (added 2026-11-05, role base `f51889cc`)

This addition changes 5.11 for the nut only. The text of 5.11.1 to 5.11.13 stays. Where this
addition and an earlier part of 5.11 differ, this addition applies.

What happened after `df2aa52e`:

- T4 step 9 (`6a64a214`, `0d72e9cf`): the nut color try 3 (m4) passed
  (`judge-prod-r7-color-nut3-0d72e9cf.json`). The nut line try 3 (from m4) failed, and a second
  judge confirmed the fail (`judge-prod-r7-line-nut3-0d72e9cf.json`,
  `judge-prod-r7-line-nut3-second-0d72e9cf.json`): two closed pod outlines.
- PM decision, 2026-11-05 09:17 ICT (quote): "Yes to ONE extra line-art try (the 4th) for the nut,
  as you described: a Muse line call from the passing color m4, one single shell outline, the
  lengthwise seam as a short inner line, the same Sonnet judge with the "one nut only" check. This
  is my decision, not Daniel's: on 11-05 he gave the PM all speed, quality, and cost choices, and
  0.01 USD stays inside the 1.00 USD cap. The 3-try stop rule stays for every other picture. If the
  4th try fails, v2 stays, deliver nothing new, and send me one line. If it passes, deliver to
  a48-forge-pictures-nut3/ with a MANIFEST and tell Workbooks. No other extra tries without my word."
- T4 step 10 (`49f3679d`, `f51889cc`): the guard refused the call
  (`refused: l2-w01-story-page-a-nut line count 3 (max 3)`).
- T4 step 11 (running at `f51889cc`): the maker adds one entry to a `TRY_EXCEPTIONS` map in
  `scripts/storytime-muse-guards.mjs`, its types, and tests. Then the maker makes the line try 4
  from m4 and the batch `batch-r8-line-nut4`. The nut spec changed again (`linePrompt` only).

State at `f51889cc` (read-only check): the nut has 3 color tries and 3 line tries. 54 restart rows,
spend 0.54 USD. The v2 nut pair stays the delivery. Restart check v2 (below) passes in
`--pm-nut3`. Restart check v1 does not fit any more: its `--pm-nut3` wants the batch phrase
"one nut, clearly a nut", and the real batches say "one nut only: …" and "clearly a peanut: …".

**The nut outcome.** It is one of three states. Each state has one mode of restart check v2.

| State | Mode | Nut delivery | Folders |
| --- | --- | --- | --- |
| Line try 4 not run yet (`f51889cc`) | `--pm-nut3` | v2 pair (color m3 try 2, line m3 try 2) | `w01/delivery-muse-v3/`, `a48-forge-pictures-a/`. No `w01/delivery-muse-v4/`. No `a48-forge-pictures-nut3/`. |
| Line try 4 failed | `--nut4-fail` | v2 pair stays. Nothing new is delivered. The plan quotes the one line to the PM. | As in the first row. |
| Line try 4 passed | `--nut4` | v3 pair: `l2-w01-story-page-a-nut-v3.png` (bytes of `l2-w01-story-page-a-nut-m4-color-print.png`, color try 3) and `l2-w01-story-page-a-nut-line-v3.png` (bytes of the print of line try 4) | `w01/delivery-muse-v4/` (2 files, a copy-way `manifest.json`) and `a48-forge-pictures-nut3/` (2 files and a `MANIFEST.txt` with "model evidence, not acceptance" and its check command). `w01/delivery-muse-v3/` and `a48-forge-pictures-a/` stay as they are. The plan records that Workbooks was told. |

Judge evidence of each state:

- `--pm-nut3`: color try 3 `pass` and line try 3 `fail` with a second-judge `fail` (the r7 files).
- `--nut4-fail`: the same, plus a main result for `out/storytime-review/judge/prod/l2-w01-story-page-a-nut-line-t4.png`
  with verdict `fail` and a second-judge result with verdict `fail` (the run rule).
- `--nut4`: the same r7 results, plus a main result for that judge copy with verdict `pass`, in a
  file whose `group` is `prod-r8-line-nut4`.
- Each try 3 and try 4 batch entry has a `mustShow` item that starts with "one nut only".

**Gate changes.**

| Gate | Change | Falsification condition |
| --- | --- | --- |
| X2 Freeze | After `P5R_BASE`, the allowed code files are `scripts/storytime-muse-guards.mjs`, `scripts/storytime-muse-guards.d.mts`, and `tests/storytime-muse-attempts.test.ts`. No file under `src/` changes. The X2b commands below give the expected values. | Another script or source file changes, the map has more or less than one entry, `MAX_TRIES` is not 3, or a required test case is missing. |
| X3 Pins | The second pin block below (7 lines) also passes. | A pinned file changed. |
| X4 Restart check | Use restart check v2 (SHA-256 below) in the mode of the state table. The control run is `<mode> --control`. The labels and values are in the table below. | A label differs, the control exits `0`, or a mode passes in the wrong state. |
| X5 Spend and tries | The nut line may have 4 tries. The nut color has 3 or less. Every other picture and kind has 3 or less. Spend is 1.00 USD or less (0.55 USD expected after the call). | `picture and kind pairs above their limit:` is above 0, or a 4th try exists for another pair. |
| X6 Judge | The judge evidence of the state applies. A line try 4 fail needs a second-judge fail. | A delivered nut file has no pass, or a try 4 fail has no second-judge fail. |
| X7 Deliveries | The folder and handoff counts of the state apply. In `--nut4`, the `nut3` handoff check command gives 2 `OK` lines. | A count differs, or a v4 or `nut3` folder exists in a v2 state. |

The X2b commands (read-only; the import loads the guards module and calls no function):

```sh
echo "code files changed after P5R_BASE: $(git diff --name-only "$P5R_BASE"..HEAD -- scripts src tests | grep -cvxE 'scripts/storytime-muse-guards\.(mjs|d\.mts)|tests/storytime-muse-attempts\.test\.ts')"
node --input-type=module -e "const m = await import('./scripts/storytime-muse-guards.mjs'); const e = m.TRY_EXCEPTIONS; const l = Array.isArray(e) ? e : Object.entries(e ?? {}); console.log('max tries: ' + m.MAX_TRIES); console.log('try exceptions: ' + l.length); console.log('try exception entries: ' + JSON.stringify(l));"
git diff "$P5R_BASE"..HEAD -- scripts/storytime-muse-guards.mjs scripts/storytime-muse-guards.d.mts tests/storytime-muse-attempts.test.ts
```

Expected: `code files changed after P5R_BASE: 0`, `max tries: 3`, and `try exceptions: 1`. The one
entry names `l2-w01-story-page-a-nut`, kind `line`, one extra try (a limit of 4), and the PM
decision of 2026-11-05 09:17 ICT. The checker reads the diff. Each changed runtime line of the
guards module must belong to the exception map or its use in the try count. The diff must add test
cases for these four facts:

1. The nut line at count 3 is allowed one more call.
2. The nut line at count 4 is refused.
3. The nut color at count 3 is refused.
4. Another id at count 3 is refused, in both kinds.

If the export has another name or shape, the checker reads the module by hand and records the
entry count and the entry. The rule stays: exactly one entry.

GREEN_TEST_COMMAND and PROJECT_TESTS stay as in 5.11.4. The maker runs GREEN_TEST_COMMAND once
after the step 11 code change. `<N>` and `<M>` grow by the new test cases. TYPECHECK_COMMAND
stays. The types of the new export count as owned files.

**Restart check v2.** It replaces v1 of 5.11.5 for every run after this commit. The extraction
command of 5.11.5 stays, with the marker names `restart-check-v2.mjs begin` and
`restart-check-v2.mjs end`:

```sh
awk '/^<!-- restart-check-v2.mjs end -->$/{f=0} f; /^<!-- restart-check-v2.mjs begin -->$/{f=1}' "$T/test-strategy.md" | sed '1d;$d' > "$D/restart-check.mjs"
echo "restart check script sha256: $(sha256sum < "$D/restart-check.mjs" | cut -c1-64)"
nice -n 19 node "$D/restart-check.mjs" $NUT_MODE > "$D/restart-check.log"; echo "restart check exit: $?"
nice -n 19 node "$D/restart-check.mjs" $NUT_MODE --control > "$D/restart-control.log"; echo "restart control exit: $?"
```

Expected script SHA-256: `30f68eafaa216bdd8947efa394aac08b8d11fbd98fed37c0c8988527807541a7`.

Modes: `--pm-nut3`, `--nut4-fail`, and `--nut4`. Give exactly one. No mode fails while the nut has
a try 3. `--nut3` of v1 is retired: v2 exits `2` with a usage line. Two modes also exit `2`.
Changes from v1:

- The try limit is 4 for the nut line in `--nut4-fail` and `--nut4`, and 3 for every other pair
  and mode. New labels: `picture and kind pairs above their limit:` and
  `picture and kind pairs with a 4th try:`.
- The PM order set holds the nut color try 3 and line try 3. In the try 4 modes it also holds the
  line try 4, because the line try 2 passed before it. The line try 4 also counts as a retry after
  a confirmed fail (try 3).
- The nut judge copies of tries 1 to 3 are pinned (6 copies).
- The mustShow check looks for an item that starts with "one nut only".
- The v4 folder holds only the nut color try 3 and line try 4 pair.

Labels and values for each mode. The checker compares each value. The other labels of 5.11.5
keep their "Before" values (calibration, kit, handoff a to d, the second-judge differences 0).

| Label | `--pm-nut3` (at `f51889cc`) | `--nut4-fail` | `--nut4` |
| --- | --- | --- | --- |
| `restart cost rows:` | 54 | 55 | 55 |
| `restart spend (USD):` | 0.54 | 0.55 | 0.55 |
| `max tries for one picture and kind:` | 3 | 4 | 4 |
| `picture and kind pairs above their limit:` | 0 | 0 | 0 |
| `picture and kind pairs with a 4th try:` | 0 | 1 (`l2-w01-story-page-a-nut\|line`) | 1 (the same) |
| `nut tries color: <c> line: <l>` | 3, 3 | 3, 4 | 3, 4 |
| `production main fails:` | 5 | 6 | 5 |
| `retries: <r> after a confirmed fail: <c> by PM order: <p>` | 6, 4, 2 | 7, 5, 2 | 7, 5, 2 |
| `nut judge copies of tries 1 to 3 changed:` | 0 | 0 | 0 |
| `nut color try 3 verdict: … second-judge verdicts: …` | pass, none | pass, none | pass, none |
| `nut line try 3 verdict: … second-judge verdicts: …` | fail, fail | fail, fail | fail, fail |
| `nut line try 4 verdict: … second-judge verdicts: …` | absent | fail, fail | pass, none or pass |
| `restart delivery folders:` | 10 | 10 | 11 |
| `restart delivered files: <d> byte-equal …: <b> with a pass verdict: <v>` | 49, 49, 49 | 49, 49, 49 | 51, 51, 51 |
| `restart delivered pictures:` | 24 | 24 | 24 |
| `handoff nut3: files: …` | absent | absent | 2, 2, 2, yes |
| `restart check:` | `pass` | `pass` | `pass` |

A different call count changes the rows, the spend, and the retries together. Then the checker
takes the values from the plan T4 step 11 block, and the limits and the cap still apply.

<!-- restart-check-v2.mjs begin -->
```js
// restart-check.mjs version 2: the read-only checker of test-strategy.md 5.11 and 5.11.14.
// Run from the repo root: node <this file> [--pm-nut3 | --nut4-fail | --nut4] [--control].
// It reads files only. It writes stdout only.
// Exit 0: every check holds. Exit 1: a check failed (a FAIL line names it). Exit 2: a usage error.
// --pm-nut3: the nut tries 3 ran (PM order, 2026-11-05 08:44 ICT): color try 3 passed, line try 3
//   failed (two judges), and no line try 4 exists. The v2 pair stays.
// --nut4-fail: the nut line try 4 ran (PM exception, 2026-11-05 09:17 ICT) and failed (two judges).
//   The v2 pair stays.
// --nut4: the nut line try 4 passed. w01/delivery-muse-v4 holds the color try 3 and line try 4
//   pair (v3 names), and the nut3 handoff folder exists.
// --control changes three expected values in memory (a pre-restart manifest pin, the cap, the judge
// model). A control run must exit 1 with the three FAIL lines; else the checks are vacuous (A4).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

if (process.argv.includes('--nut3')) { console.log('usage: --nut3 is retired (5.11.14)'); process.exit(2); }
const MODES = ['--pm-nut3', '--nut4-fail', '--nut4'].filter((m) => process.argv.includes(m));
if (MODES.length > 1) { console.log('usage: give one nut mode'); process.exit(2); }
const NUT4 = MODES[0] === '--nut4' || MODES[0] === '--nut4-fail';
const NUT3 = MODES[0] === '--nut4'; // the v3 pair is delivered
const PM_NUT3 = MODES.length === 1;
const CONTROL = process.argv.includes('--control');
const U = 'out/storytime/l2/unit1';
const RUNS = 'measure/runs/asset_storytime_l2_unit1_pictures_20261025';
const PROD = 'docs/storytime/l2-unit1/judge/prod';
const JC = 'out/storytime-review/judge/prod';
const HANDOFF = '/home/daniebo/Desktop/handoff';
const START = Date.parse('2026-11-04T07:54:00Z');
const MODEL = CONTROL ? 'control/no-such-model' : 'claude-code/claude-sonnet-5-5#high';
const CAP = CONTROL ? 510000n : 1000000n; // 1.00 USD in micro-USD; the control sets 0.51
const GROUP = { 'l2-w01-practice-line-nose': 'l2-w01-check-row-nose' };
const NUT = 'l2-w01-story-page-a-nut';
// Retries that a PM order caused (not a judge fail): the nut tries 3 (2026-11-05 08:44 ICT) and
// the nut line try 4 (2026-11-05 09:17 ICT, the one try exception).
const PM_ORDER = new Set([...(PM_NUT3 ? [`${NUT}|color|3`, `${NUT}|line|3`] : []), ...(NUT4 ? [`${NUT}|line|4`] : [])]);
// The try limit of each picture and kind: 3, and 4 for the nut line in the try 4 modes only.
const limitOf = (k) => (NUT4 && k === `${NUT}|line` ? 4 : 3);
const PRE = {
  'w01/delivery-muse-v1': '00ea0c5b06d18e3f54cbceed9caa943100c0711bb515c44561eb46b7e03ed369',
  'w01/delivery-muse-v2': 'd3eec18ce7c94b94ed5b0751df164578558ad44f04bebe7b4b371a3ed213796a',
  'w02/delivery-muse-v1': '6e6b51450d406bfdac47e01f484925b270bd0b1647bbfc0550d7529809cfeaf4',
  'w03/delivery-muse-v1': '24213647b0f1b92cdb891746cdf6181ff7f20f306c51d256fec150c38d5c273b',
  'w04/delivery-muse-v1': '4e74b7302a851e0261099925a23c0b9246a533911374af01d9748b905320d310',
  'w05/delivery-muse-v1': 'c3f009e6bfcb3037ae24b495c6e68527bfbf86162deb3a40a9bbd28a416ffbaf',
  'w06/delivery-muse-v1': '11c5dc10198c9d446afc8ffd80aff46c747d2dec34b77293327907d729163292',
  'w07/delivery-muse-v1': '6a5724c42a83134d80fc1cd1ccecdafe1a76dd25961e040caffaafccc81ea3c2',
  'cover/delivery-muse-v1': '27710b3711757d99294b7e837377d325eb9a6094e1dad43e0f064d2581397b88',
};
if (CONTROL) PRE['w01/delivery-muse-v1'] = '0'.repeat(64);
const RESTART = {
  'w01/delivery-muse-v3': '38a16765a061a8f71fba1fe5744c1b2aa3b48b35b87352c12302ce519e44dce0',
  'w02/delivery-muse-v2': 'c59a75bb30def25168bd90effbf44931e2d6a0a4844b1b961ce8105b61146ae5',
  'w03/delivery-muse-v2': 'bb7a27525fcd8da28a9cf8148a2f39bcc2e0609ef86a0648425b66c8ecafa30a',
  'w04/delivery-muse-v2': '82d467e6ecedd7caea7331dd9088c35d000db16d67c1a80f8818f68dfd2fe52c',
  'w05/delivery-muse-v2': '0e2fde98f4610afbe49637241f3887e1378dd6f293a69d763df8362d453885ca',
  'w06/delivery-muse-v2': '66bb2f62b46a8dcc2e0497ab9b637929ec0d93b2de56a27b84eccb5b6d33ee60',
  'w07/delivery-muse-v2': '352b2dabe598f80ed4d9ef10977c86f9a988c9d6e8a59cfea52fa59ced1f32b4',
  'w05/delivery-a48-d': '0fa7b23268449a9f83365eb4ea03057a1a6453b291bcdf697251fd0421f39fea',
  'w07/delivery-a48-d': '36b4febcdcdc80d10c789866e1d468b88708389cc7af28bfd79778cf299b8eb8',
  'w08/delivery-muse-v1': '2dc0812b3a90be19bd288d622d1c9fdd4d682bd013c2c99242441f09a71b9f92',
};
const NUT3_DIR = 'w01/delivery-muse-v4';
const HANDOFFS = { drum: 2, c: 4, a: 25, b: 14, d: 4, ...(NUT3 ? { nut3: 2 } : {}) };

let failures = 0;
const fail = (m) => { failures += 1; console.log(`FAIL ${m}`); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const json = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const group = (id) => GROUP[id] ?? id;
const micro = (v) => {
  if (!/^\d+(\.\d{1,6})?$/.test(v)) return null;
  const [i, d = ''] = v.split('.');
  return BigInt(i) * 1000000n + BigInt((d + '000000').slice(0, 6));
};
const usd = (m) => `${m / 1000000n}.${String((m % 1000000n) / 10000n).padStart(2, '0')}`;

// 1. Restart rows of every Muse cost file (week folders and element folders).
const costFiles = [];
for (const w of fs.readdirSync(U).sort()) {
  for (const s of ['muse/costs.tsv', 'muse/elements/costs.tsv']) {
    const f = path.join(U, w, s);
    if (fs.existsSync(f)) costFiles.push(f);
  }
}
const rows = [];
let spend = 0n;
let badTime = 0;
for (const f of costFiles) {
  const [head, ...lines] = fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim());
  const H = head.split('\t');
  const col = Object.fromEntries(['time', 'row', 'version', 'kind', 'inputs', 'output', 'usage_cost'].map((n) => [n, H.indexOf(n)]));
  if (col.time < 0 || col.usage_cost < 0 || col.row < 0 || col.kind < 0 || col.output < 0) { fail(`header without a needed column: ${f}`); continue; }
  for (const l of lines) {
    const c = l.split('\t');
    const t = Date.parse(c[col.time]);
    if (Number.isNaN(t)) { badTime += 1; continue; }
    if (t < START) continue;
    const m = micro((c[col.usage_cost] ?? '').trim());
    if (m === null) { fail(`usage_cost is not a decimal: ${f}: ${l}`); continue; }
    spend += m;
    rows.push({ f, dir: path.dirname(f), t, row: c[col.row], kind: c[col.kind], out: c[col.output], inp: c[col.inputs] ?? '', m });
  }
}
console.log(`cost files read: ${costFiles.length}`);
console.log(`cost rows with an unreadable time: ${badTime}`);
console.log(`restart cost rows: ${rows.length}`);
console.log(`restart spend (USD): ${usd(spend)}`);
if (badTime !== 0) fail(`cost rows with an unreadable time: ${badTime}`);
if (spend > CAP) fail(`restart spend ${usd(spend)} is above the cap ${usd(CAP)}`);

// Tries: rows with a cost above 0 and an output, kind color or line, counted per picture group.
const tryRows = rows.filter((r) => (r.kind === 'color' || r.kind === 'line') && r.m > 0n && r.out !== 'none');
console.log(`restart failed calls (cost 0 or output none): ${rows.length - tryRows.length}`);
const perGroup = new Map();
for (const r of tryRows) { const k = `${group(r.row)}|${r.kind}`; perGroup.set(k, (perGroup.get(k) ?? 0) + 1); }
const maxTries = Math.max(0, ...perGroup.values());
const over = [...perGroup].filter(([k, n]) => n > limitOf(k));
const fourth = [...perGroup].filter(([, n]) => n > 3).map(([k]) => k);
console.log(`picture and kind pairs with a try: ${perGroup.size}`);
console.log(`max tries for one picture and kind: ${maxTries}`);
console.log(`picture and kind pairs above their limit: ${over.length}`);
console.log(`picture and kind pairs with a 4th try: ${fourth.length}${fourth.length ? ` (${fourth.join(', ')})` : ''}`);
console.log(`nut tries color: ${perGroup.get(`${NUT}|color`) ?? 0} line: ${perGroup.get(`${NUT}|line`) ?? 0}`);
for (const [k, n] of over) fail(`${k} has ${n} tries (limit ${limitOf(k)})`);
// Judge copy number n of one id and kind: the n-th restart row of that id and kind in its cost
// file, in time order, failed rows included (restartTries of scripts/storytime-judge-batch.mjs).
const rowsOf = (r) => rows.filter((x) => x.f === r.f && x.row === r.row && x.kind === r.kind && (x.kind === 'color' || x.kind === 'line')).sort((a, b) => a.t - b.t);
const tryOf = (r) => rowsOf(r).indexOf(r) + 1;
const prevTryOf = (r) => { const all = rowsOf(r); const before = all.slice(0, all.indexOf(r)).filter((x) => tryRows.includes(x)); return before.length ? all.indexOf(before[before.length - 1]) + 1 : 0; };

// 2. Judge kit and calibration.
const PROMPT_SHA = 'db5b443a6ea7740f435fedb7f13d0fd12971332c08b6e71d09e4a468da02ffd8';
const CAST_SHA = '2eb4a6a14d2ba6e49223e27d9ad390aad7ba1d247b272f6a467742b931046e76';
const ps = sha('docs/storytime/l2-unit1/judge/judge-prompt.md');
const cs = sha('docs/storytime/l2-unit1/judge/cast.json');
console.log(`judge prompt sha256: ${ps}`);
console.log(`judge cast sha256: ${cs}`);
if (ps !== PROMPT_SHA) fail('judge prompt SHA-256 differs from the calibration value');
if (cs !== CAST_SHA) fail('judge cast SHA-256 differs from the calibration value');
const headerOk = (j) => j.status === 'complete' && j.model === MODEL && /judge-prompt\.md v6$/.test(j.judgePrompt ?? '') && /2eb4a6a1/.test(j.cast ?? '');
const calSet = json('docs/storytime/l2-unit1/judge/calibration-set.json').entries;
const calExpected = new Map(calSet.map((e) => [e.judgeFile, e.expected]));
let calPass = 0, calFail = 0, calFiles = 0, calCtrl = 0, calCtrlFail = 0, calPassBroken = 0;
const calSeen = new Set();
for (const g of ['w01', 'w02', 'w03', 'w04', 'w05', 'w06', 'w07', 'cover']) {
  const f = `${RUNS}/judge-cal-${g}-aba118fe.json`;
  if (!fs.existsSync(f)) { fail(`missing ${f}`); continue; }
  const j = json(f);
  if (!headerOk(j)) fail(`calibration header or status: ${f}`);
  let p = 0, x = 0;
  for (const r of j.results) {
    calFiles += 1; calSeen.add(r.judgeFile);
    if (r.verdict === 'pass') p += 1; else if (r.verdict === 'fail') x += 1; else fail(`verdict ${r.verdict} in ${f}`);
    const e = calExpected.get(r.judgeFile);
    if (e === undefined) fail(`calibration result for a file outside the set: ${r.judgeFile}`);
    if (e === 'fail') { calCtrl += 1; if (r.verdict === 'fail') calCtrlFail += 1; }
    if (e === 'pass' && r.verdict !== 'pass') calPassBroken += 1;
  }
  if (j.summary?.pass !== p || j.summary?.fail !== x || j.summary?.files !== j.results.length) fail(`summary of ${f} differs from its results`);
  calPass += p; calFail += x;
}
console.log(`calibration files judged: ${calFiles} pass: ${calPass} fail: ${calFail}`);
console.log(`calibration set entries without a result: ${calSet.filter((e) => !calSeen.has(e.judgeFile)).length}`);
console.log(`calibration gate controls: ${calCtrl} failed: ${calCtrlFail}`);
console.log(`calibration expected-pass files that did not pass: ${calPassBroken}`);
if (calFiles !== 388 || calPass !== 381 || calFail !== 7) fail('calibration counts differ from 388 / 381 / 7');
if (calCtrl !== 2 || calCtrlFail !== 2) fail('a gate control did not fail');
if (calPassBroken !== 0) fail('an expected-pass calibration file did not pass');
if (calSet.length !== 388 || calSeen.size !== 388) fail('calibration set and results differ');

// 3. Production judge results, tied to their batch files.
const prod = [];
for (const f of fs.readdirSync(RUNS).filter((n) => /^judge-prod-.*\.json$/.test(n)).sort()) {
  const j = json(`${RUNS}/${f}`);
  const second = f.includes('-second-');
  if (!headerOk(j)) { fail(`production header or status: ${f}`); continue; }
  const batch = `${PROD}/batch-${String(j.group).replace(/^prod-/, '')}.json`;
  const entries = second ? null : (fs.existsSync(batch) ? json(batch) : null);
  if (!second && !entries) { fail(`no batch file ${batch} for ${f}`); continue; }
  for (const r of j.results) {
    if (!second && !entries.some((e) => e.judgeFile === r.judgeFile && e.id === r.id && e.kind === r.kind)) fail(`${f}: ${r.judgeFile} is not in ${batch}`);
    if (!fs.existsSync(r.judgeFile)) fail(`${f}: judge copy missing ${r.judgeFile}`);
    prod.push({ f, second, ...r });
  }
}
const main = prod.filter((r) => !r.second);
console.log(`production result files: ${new Set(prod.map((r) => r.f)).size} results: ${main.length} second-judge results: ${prod.length - main.length}`);
console.log(`production main fails: ${main.filter((r) => r.verdict === 'fail').length}`);

// 4. Retry rule: each later try follows a fail of the try before it that a second judge confirms,
// or a PM order.
const jf = (id, kind, n) => `${JC}/${id}-${kind}-t${n}.png`;
let retries = 0, retriesConfirmed = 0, retriesPm = 0;
for (const r of tryRows) {
  const n = tryOf(r);
  const p = prevTryOf(r);
  if (p === 0) continue;
  retries += 1;
  const prev = jf(r.row, r.kind, p);
  const m1 = main.find((x) => x.judgeFile === prev && x.verdict === 'fail');
  const s1 = prod.find((x) => x.second && x.judgeFile === prev && x.verdict === 'fail');
  const s1pass = prod.find((x) => x.second && x.judgeFile === prev && x.verdict === 'pass');
  if (m1 && s1 && !s1pass) retriesConfirmed += 1;
  else if (PM_ORDER.has(`${r.row}|${r.kind}|${n}`)) retriesPm += 1;
  else fail(`try ${n} of ${r.row} ${r.kind} has no confirmed fail of try ${p} and no PM order`);
}
console.log(`retries: ${retries} after a confirmed fail: ${retriesConfirmed} by PM order: ${retriesPm}`);
const disagree = prod.filter((y) => y.second && main.some((x) => x.judgeFile === y.judgeFile && x.verdict !== y.verdict));
console.log(`second-judge results that differ from the main verdict: ${disagree.length}`);
// The judge copies of the nut tries 1 and 2 keep their bytes; a try 3 batch names the new mustShow.
const NUT_COPIES = {
  'color-t1': '8f62fb3871c1dbc9f7c481a575cccbadf6a84fa872aeb8c248c4704c7b339041',
  'color-t2': '8ed540398c94554e5239440fd9d98300a4033c5bd8b35f55b8fb27ada4d14c52',
  'line-t1': 'd9b784e2b7920a6a4d7d9f82b4e07bb3b10c0811c9e9f11258c2ef1a71826d38',
  'line-t2': '6ba147242f5f2b19a44146789546b39b34424400e27d6dc976ff9d1b3e8e5360',
  'color-t3': '11afe42b6d5c149fc0b49c6862e9ad6c989d85133947a05022d3d0e17aaf18e0',
  'line-t3': 'a5749b6eb7b98028cf66131389970533c0686e5237ffff9a0ecce688449d66c9',
};
let nutCopyBad = 0;
for (const [k, v] of Object.entries(NUT_COPIES)) if (sha(`${JC}/${NUT}-${k}.png`) !== v) { nutCopyBad += 1; fail(`judge copy ${NUT}-${k}.png changed`); }
console.log(`nut judge copies of tries 1 to 3 changed: ${nutCopyBad}`);
// The nut PM tries: each one has a main result, and its batch names the "one nut only" check.
const nutTry = (kind, n, want) => {
  const r = main.find((x) => x.judgeFile === jf(NUT, kind, n));
  const b = r && json(`${PROD}/batch-${JSON.parse(fs.readFileSync(`${RUNS}/${r.f}`, 'utf8')).group.replace(/^prod-/, '')}.json`).find((e) => e.judgeFile === r.judgeFile);
  const second = prod.filter((x) => x.second && x.judgeFile === jf(NUT, kind, n));
  console.log(`nut ${kind} try ${n} verdict: ${r ? r.verdict : 'none'} second-judge verdicts: ${second.map((x) => x.verdict).join(',') || 'none'}`);
  if (!r) { fail(`no judge result for the nut ${kind} try ${n}`); return; }
  if (!(b?.mustShow ?? []).some((m) => m.startsWith('one nut only'))) fail(`the nut ${kind} try ${n} batch has no mustShow "one nut only"`);
  if (r.verdict !== want) fail(`the nut ${kind} try ${n} verdict is ${r.verdict}, ${want} wanted in this mode`);
  if (want === 'fail' && (second.length === 0 || second.some((x) => x.verdict !== 'fail'))) fail(`the nut ${kind} try ${n} fail has no second-judge fail`);
};
if (PM_NUT3) { nutTry('color', 3, 'pass'); nutTry('line', 3, 'fail'); }
if (NUT4) nutTry('line', 4, NUT3 ? 'pass' : 'fail');
const nutC = perGroup.get(`${NUT}|color`) ?? 0;
const nutL = perGroup.get(`${NUT}|line`) ?? 0;
if (PM_NUT3 && (nutC !== 3 || nutL !== (NUT4 ? 4 : 3))) fail(`nut tries color ${nutC} line ${nutL}: ${MODES[0]} needs color 3 and line ${NUT4 ? 4 : 3}`);
if (!PM_NUT3 && (nutC > 2 || nutL > 2)) fail('the nut has a try 3: run with --pm-nut3, --nut4-fail, or --nut4');
if (fourth.some((k) => k !== `${NUT}|line`)) fail('a picture and kind other than the nut line has a 4th try');

// 5. Delivered files of the restart: each one is byte-equal to the print of a passing try.
for (const [d, want] of Object.entries(PRE)) {
  const got = sha(`${U}/${d}/manifest.json`);
  console.log(`manifest sha256 ${d}: ${got}`);
  if (got !== want) fail(`pre-restart manifest changed: ${d}`);
}
const restartDirs = { ...RESTART };
if (NUT3) restartDirs[NUT3_DIR] = null;
for (const w of fs.readdirSync(U)) {
  const p = path.join(U, w);
  if (!fs.statSync(p).isDirectory()) continue;
  for (const d of fs.readdirSync(p).filter((n) => n.startsWith('delivery-'))) {
    const k = `${w}/${d}`;
    if (!(k in PRE) && !(k in restartDirs)) fail(`unknown delivery folder ${k}`);
  }
}
if (!NUT3 && fs.existsSync(`${U}/${NUT3_DIR}`)) fail(`${NUT3_DIR} exists, but the run has no --nut4`);
const delivered = [];
const approvalsW08 = json('docs/storytime/l2-unit1/w08/muse/approved.json').entries;
for (const [d, want] of Object.entries(restartDirs)) {
  const dir = `${U}/${d}`;
  if (!fs.existsSync(`${dir}/manifest.json`)) { fail(`no manifest in ${d}`); continue; }
  const got = sha(`${dir}/manifest.json`);
  console.log(`manifest sha256 ${d}: ${got}`);
  if (want && got !== want) fail(`restart manifest changed: ${d}`);
  const man = json(`${dir}/manifest.json`);
  let entries;
  if (Array.isArray(man.files)) {
    entries = man.files.map((e) => ({ id: e.pictureId, kind: e.kind, file: e.file, sha256: e.sha256, source: e.source }));
  } else {
    entries = [];
    for (const job of man.jobs) {
      const a = approvalsW08.find((e) => e.rowId === job.id);
      if (!a) { fail(`${d}: no approval entry for ${job.id}`); continue; }
      for (const c of job.candidates) {
        const kind = /-line-v\d+\.png$/.test(c.file) ? 'line' : 'color';
        entries.push({ id: job.id, kind, file: c.file, sha256: c.fileSha256, source: `${U}/w08/muse/${kind === 'line' ? a.linePrint : a.colorPrint}` });
        if (c.lineArt?.file) entries.push({ id: job.id, kind: 'line', file: c.lineArt.file, sha256: c.lineArt.fileSha256, source: `${U}/w08/muse/${a.linePrint}` });
      }
    }
  }
  const pngs = fs.readdirSync(dir).filter((n) => n.endsWith('.png')).sort();
  const named = [...new Set(entries.map((e) => e.file))].sort();
  if (JSON.stringify(pngs) !== JSON.stringify(named)) fail(`${d}: PNG set and manifest set differ (${pngs.length} / ${named.length})`);
  for (const e of entries) delivered.push({ dir: d, ...e });
}
let byteOk = 0, passOk = 0, formatBad = 0;
const pictures = new Set();
const colorOut = new Map();
for (const e of delivered) {
  const file = `${U}/${e.dir}/${e.file}`;
  if (!fs.existsSync(file) || !fs.existsSync(e.source)) { fail(`${e.dir}/${e.file}: file or source missing`); continue; }
  const s = sha(file);
  if (s !== e.sha256 || s !== sha(e.source)) { fail(`${e.dir}/${e.file}: bytes differ from the manifest or the source print`); continue; }
  byteOk += 1;
  const ihdr = fs.readFileSync(file).subarray(16, 26);
  const [w, h, depth, type] = [ihdr.readUInt32BE(0), ihdr.readUInt32BE(4), ihdr[8], ihdr[9]];
  const [ww, wh] = e.id.includes('-story-page-') ? [4000, 3000] : [1500, 1500];
  if (w !== ww || h !== wh) { formatBad += 1; fail(`${e.dir}/${e.file}: ${w}x${h}, ${ww}x${wh} wanted`); }
  if (e.kind === 'line' && (depth !== 8 || type !== 0)) { formatBad += 1; fail(`${e.dir}/${e.file}: line file is not 8-bit gray (depth ${depth}, type ${type})`); }
  const outName = path.basename(e.source).replace('-print', '');
  const r = tryRows.find((x) => x.dir === path.dirname(e.source) && x.out === outName && x.kind === e.kind);
  if (!r) { fail(`${e.dir}/${e.file}: no restart try has the output ${outName}`); continue; }
  if (group(r.row) !== group(e.id)) fail(`${e.dir}/${e.file}: try row ${r.row} is not picture ${e.id}`);
  const n = tryOf(r);
  const j = jf(r.row, r.kind, n);
  const pass = main.find((x) => x.judgeFile === j && x.verdict === 'pass');
  if (!pass) { fail(`${e.dir}/${e.file}: try ${n} (${j}) has no pass verdict`); continue; }
  passOk += 1;
  for (let k = 1; k < n; k += 1) {
    if (main.some((x) => x.judgeFile === jf(r.row, r.kind, k) && x.verdict === 'pass') && !PM_ORDER.has(`${r.row}|${r.kind}|${n}`)) fail(`${e.dir}/${e.file}: try ${n} is delivered, but try ${k} passed first`);
  }
  if (e.dir === NUT3_DIR && (group(e.id) !== NUT || n !== (e.kind === 'color' ? 3 : 4))) fail(`${e.dir}/${e.file}: the folder holds only the nut color try 3 and line try 4 pair`);
  pictures.add(group(e.id));
  if (e.kind === 'color') colorOut.set(`${e.dir}|${group(e.id)}`, r.out);
  else e.lineInput = path.basename(r.inp);
  e.pass = `${pass.f} try ${n}`;
}
// The line try of a delivered pair starts from the delivered color try.
let twinBad = 0;
for (const e of delivered.filter((x) => x.kind === 'line' && x.lineInput)) {
  const c = colorOut.get(`${e.dir}|${group(e.id)}`);
  if (c && c !== e.lineInput) { twinBad += 1; fail(`${e.dir}/${e.file}: line input ${e.lineInput} is not the delivered color ${c}`); }
}
console.log(`restart delivery folders: ${Object.keys(restartDirs).length}`);
console.log(`restart delivered files: ${delivered.length} byte-equal to a source print: ${byteOk} with a pass verdict: ${passOk}`);
console.log(`restart delivered pictures: ${pictures.size}`);
console.log(`line files not made from the delivered color: ${twinBad}`);
console.log(`restart delivered files with a wrong size or line format: ${formatBad}`);
const wantFiles = 49 + (NUT3 ? 2 : 0);
if (delivered.length !== wantFiles || byteOk !== wantFiles || passOk !== wantFiles) fail(`restart delivered files are not ${wantFiles}`);
if (pictures.size !== 24) fail('restart delivered pictures are not 24');

// 6. Handoff folders.
const byName = new Map();
for (const e of delivered) { const k = e.file; if (!byName.has(k)) byName.set(k, new Set()); byName.get(k).add(e.sha256); }
for (const [h, n] of Object.entries(HANDOFFS)) {
  const dir = `${HANDOFF}/a48-forge-pictures-${h}`;
  if (!fs.existsSync(`${dir}/MANIFEST.txt`)) { fail(`no MANIFEST.txt in ${dir}`); continue; }
  const pngs = fs.readdirSync(dir).filter((x) => x.endsWith('.png')).sort();
  const text = fs.readFileSync(`${dir}/MANIFEST.txt`, 'utf8');
  const lines = [...text.matchAll(/^([0-9a-f]{64})  ([^\s/]+\.png)$/gm)];
  const listed = [...new Set(lines.map((m) => m[2]))].sort();
  let eq = 0;
  for (const p of pngs) {
    const s = sha(`${dir}/${p}`);
    if (byName.get(p)?.has(s)) eq += 1; else fail(`handoff ${h}/${p} is not byte-equal to a restart delivery file`);
    if (lines.some((m) => m[2] === p && m[1] !== s)) fail(`handoff ${h}/${p}: MANIFEST line differs from the file`);
  }
  console.log(`handoff ${h}: files: ${pngs.length} manifest lines: ${listed.length} byte-equal to delivery: ${eq} evidence words: ${text.includes('model evidence, not acceptance') ? 'yes' : 'no'}`);
  if (pngs.length !== n) fail(`handoff ${h}: ${pngs.length} files, ${n} wanted`);
  if (JSON.stringify(pngs) !== JSON.stringify(listed)) fail(`handoff ${h}: MANIFEST lines and files differ`);
  if (!text.includes('model evidence, not acceptance')) fail(`handoff ${h}: no "model evidence, not acceptance"`);
}
if (!NUT3 && fs.existsSync(`${HANDOFF}/a48-forge-pictures-nut3`)) fail('a48-forge-pictures-nut3 exists, but the run has no --nut4');

console.log(`restart check: ${failures === 0 ? 'pass' : `fail (${failures})`}`);
process.exit(failures === 0 ? 0 : 1);
```
<!-- restart-check-v2.mjs end -->

**Second pin block (X3).** It holds the step 9 judge results, the nut judge copies of try 3, and
the m4 prints at `f51889cc`. The r8 result files are new and have no pin. The step 9 and step 10
batch, spec, and plan files are in git, and X2 covers them.

```sh
awk '/^<!-- restart-pins-2 end -->$/{f=0} f; /^<!-- restart-pins-2 begin -->$/{f=1}' "$T/test-strategy.md" | sed '1d;$d' > "$D/pins-2.sha256"
echo "pin 2 lines: $(wc -l < "$D/pins-2.sha256")"
sha256sum -c --quiet "$D/pins-2.sha256"; echo "pin 2 check exit: $?"
```

Expected: `pin 2 lines: 7` and `pin 2 check exit: 0`.

<!-- restart-pins-2 begin -->
```text
6431a1ae33684137a6071ea9c67f900f6c060f7001fdc572dcd79cda00e68571  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r7-color-nut3-0d72e9cf.json
3e11aaaed1815521ee36759ec8bf099f114fdb35b50c019955c1bd5227904a5c  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r7-line-nut3-0d72e9cf.json
5b7041bbc80da9458bc1162a763e0aede530fa78e86fd32fd2a26d40eaa3e40f  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r7-line-nut3-second-0d72e9cf.json
11afe42b6d5c149fc0b49c6862e9ad6c989d85133947a05022d3d0e17aaf18e0  out/storytime-review/judge/prod/l2-w01-story-page-a-nut-color-t3.png
a5749b6eb7b98028cf66131389970533c0686e5237ffff9a0ecce688449d66c9  out/storytime-review/judge/prod/l2-w01-story-page-a-nut-line-t3.png
f8e6641b14025183d99c0f12ee6f34904c0937733746e24f9213f5660d1129f4  out/storytime/l2/unit1/w01/muse/l2-w01-story-page-a-nut-m4-color-print.png
4b30b04f07fdca73d24b16e5c169c8986f5f66e9da242a18cb01a9e21b6c315e  out/storytime/l2/unit1/w01/muse/l2-w01-story-page-a-nut-m4-line-print.png
```
<!-- restart-pins-2 end -->

**Maker brief changes (5.11.9).** M2 to M8 stay. M1 becomes:

1. M1 The nut, steps 9 to 11. Steps 9 and 10 are done. In step 11, add the one exception entry, its
   types, and the four test cases. Commit them with explicit paths. Then make the line try 4 from
   m4 with `node scripts/storytime-muse.mjs line docs/storytime/l2-unit1/a48/l2-w01-story-page-a-nut.json --from 4`.
   Build the batch with
   `node scripts/storytime-judge-batch.mjs --ids l2-w01-story-page-a-nut --kind line --try 4 --out batch-r8-line-nut4`.
   Commit the batch before the judge runs.
   - On a pass, deliver the v3 pair to `w01/delivery-muse-v4/` and `a48-forge-pictures-nut3/`. Record
     that Workbooks was told.
   - On a fail, a second judge checks it. Deliver nothing new. Record the one line to the PM.
   - Write the T4 step 11 block. It quotes the PM decision, the call with its file and cost, the
     judge files and verdicts, the delivery result, and "Restart spend total: <x> USD (<n> rows)".
   - No other extra try runs without a new PM word.

M7 (GREEN_TEST_COMMAND) runs after the step 11 code change. M8 runs restart check v2 in the mode of
the final state. The checker brief stays, with restart check v2, both pin blocks, and the X2b
commands.

**Anti-pattern notes for this addition.**

| Class | Defense | Falsification condition |
| --- | --- | --- |
| A3 | The new limits read labels (`pairs above their limit:`, `pairs with a 4th try:`, `try exceptions:`). | A bare count satisfies X5 or X2b. |
| A4 | Each mode fails in the other states. Two modes or `--nut3` exit `2`. The control run still must exit `1`. | A mode passes in a wrong state, or the control exits `0`. |
| A5 | The plan step 11 block must equal the v2 output (rows, spend, verdicts). The r7 results carry pins. | A plan number differs, or a pin fails. |
| A7 | The exception is one id and one kind. The script applies limit 4 only to `l2-w01-story-page-a-nut\|line` and only in the try 4 modes. | A 4th try of any other pair passes, or the guard map has a second entry. |
| A11 | The guard map (code), the script limit (checker), and this text name the same one exception. | The code allows a pair that this text does not name, or the text names a limit that the code does not hold. |

Findings at `f51889cc`: F1 to F4 of 5.11.13 stay open. Restart check v1 fails `--pm-nut3` at
`f51889cc` (the mustShow phrase), so v2 replaces it. No delivered file lacks a passing judge result:
v2 `--pm-nut3` gives 49 of 49.

###### 5.11.15 Final nut state (2026-11-05 11:45, role base `a2675b2c`)

This addition sets the gates for the final nut state. The text of 5.11.1 to 5.11.14 stays. Where
this addition and an earlier part of 5.11 differ, this addition applies.

What happened after `6eeb1f38`:

- T4 step 11 (`4ce37661` guard entry, `c3d31c2a` batch, `81ebac1c` plan): the nut line try 4 (from
  m4) failed, and a second judge confirmed the fail (`judge-prod-r8-line-nut4-c3d31c2a.json`,
  `judge-prod-r8-line-nut4-second-c3d31c2a.json`).
- Second PM decision, about 10:23 ICT (quote): "Yes: one more color try (ONE peanut lying on its
  side, plain one-pod profile, alone and large on Nan's palm) and one line try from it, 0.02 USD,
  same judge with the one-nut check. Keep the nut look the same as the other new nut pictures of
  the week, as far as the side view allows. If either try fails, stop: v2 stays, and the nut goes on
  Daniel's v14 look list as a known item with two options (peanut on its side, or one cashew). No
  further tries after this without my word. Deliver a pass to a48-forge-pictures-nut3/ with a
  MANIFEST and tell Workbooks."
- T4 step 13 (`0c331833` guard entries, `5c5e0a4a` spec, `3ef35157` batches, `5251c126` plan): the
  nut color try 4 (m5) and the nut line try 5 (from m5) passed
  (`judge-prod-r9-color-nut5-5251c126.json`, `judge-prod-r9-line-nut5-5251c126.json`).
- T4 step 14 (`8eb7e8c4`): the v3 pair is in `w01/delivery-muse-v4/` and
  `a48-forge-pictures-nut3/`. Spend 0.57 USD, 57 rows.
- T4 step 12 (`0206a566` guard types, `b320e514` M3 to M6, `d6867c52` and `a2675b2c` the
  `tracks.md` hunk fix). Interim type check: total 63, owned 25 (all in
  `tests/storytime-muse-attempts.test.ts`). The type check and GREEN_TEST_COMMAND wait for the
  heavy lock (PM order; Workbooks holds it until about 13:00 ICT).

**The final nut state.**

| Item | Value |
| --- | --- |
| Nut tries | Color 4 (m2, m3, m4, m5). Line 5 (m3, m3 try 2, m4, m4 try 2, m5). |
| Judge results of the nut | Color try 1 fail (second fail), try 2 pass, try 3 pass, try 4 pass. Line try 1 fail (second fail), try 2 pass, try 3 fail (second fail), try 4 fail (second fail), try 5 pass. |
| Final delivery | v3 pair: `l2-w01-story-page-a-nut-v3.png` (bytes of `l2-w01-story-page-a-nut-m5-color-print.png`, color try 4) and `l2-w01-story-page-a-nut-line-v3.png` (bytes of `l2-w01-story-page-a-nut-m5-line-print.png`, line try 5 from m5). Folders: `w01/delivery-muse-v4/` (copy way, `manifest.json` SHA-256 `2f46efcb…`) and `a48-forge-pictures-nut3/` (2 files and `MANIFEST.txt`; its check command gives 2 `OK` lines). |
| Superseded delivery | The v2 pair (color try 2, line try 2) stays in `w01/delivery-muse-v3/` and `a48-forge-pictures-a/`, unchanged. Nobody deletes it. |
| Not delivered | Color try 3 (m4, pass). The line tries 3 and 4 (fail). Their judge results and judge copies stay. |
| Totals | 11 restart folders, 51 delivered files, 24 pictures. Handoff folders: drum 2, c 4, a 25, b 14, d 4, nut3 2. |
| Spend | 0.57 USD, 57 restart rows, 0 failed calls. |
| Guard map | `TRY_EXCEPTIONS` holds 3 entries, all for `l2-w01-story-page-a-nut`: line +1 (PM 09:17 ICT), color +1 (PM about 10:23 ICT), line +1 (PM about 10:23 ICT). Limits: color 4, line 5. `MAX_TRIES` stays 3. |

**Gate changes.**

| Gate | Change | Falsification condition |
| --- | --- | --- |
| X2 Freeze | After `P5R_BASE`, the allowed code files are `scripts/storytime-muse-guards.mjs`, `scripts/storytime-muse-guards.d.mts`, and `tests/storytime-muse-attempts.test.ts` (the coming annotation fix of the 25 owned errors goes there). No file under `src/` changes. Restart check v3 imports the guard module and reads the map. The X2b `git diff` of 5.11.14 stays: the checker reads it. Each changed runtime line of the guard module belongs to the exception map or its use in the try count. | `code files changed after P5R_BASE:` is above 0, `guard try exceptions:` is not 3, `guard limit nut color: 4 line: 5` differs, `guard exceptions for other ids or kinds:` or `guard exceptions without a PM source:` is above 0, or `guard max tries:` is not 3. |
| X3 Pins | Pin block 3 below (12 lines) also passes. Pin blocks 1 (28) and 2 (7) still pass. | A pinned file changed. |
| X4 Restart check | Use restart check v3 with `--final`, and `--final --control`. Every label has the value of the table below. | A label differs, `--final` exits non-zero, or the control exits `0`. |
| X5 Spend and tries | Nut color 4 tries, nut line 5 tries, every other pair 3 or less. Spend 1.00 USD or less (0.57 USD, 57 rows). | `picture and kind pairs above their limit:` is above 0, or `picture and kind pairs above 3 tries:` names a pair other than the nut color and the nut line. |
| X6 Judge | The judge results of the nut table hold. Each nut fail that led to a retry has a second-judge fail. The delivered v3 pair maps to color try 4 and line try 5, each with a main `pass`. Each nut try 3, 4, and 5 batch names the "one nut only" check. | A delivered file has no pass, a nut verdict differs, or a nut fail has no second-judge fail. |
| X7 Deliveries | 51 files, 11 folders, 24 pictures, and the six handoff counts. Each of the six handoff check commands exits `0` with one `OK` line for each file. The v2 pair stays byte-equal in its two places. | A count differs, the v2 pair changed, or a handoff file differs from its delivery file. |
| X10 and X11 | Unchanged commands. The order changes (see the briefs). | As in 5.11.7. |

The earlier modes are retired for the checker: v3 exits `2` on `--nut3`, `--pm-nut3`,
`--nut4-fail`, or `--nut4`, and without `--final`. Restart check v1 and v2 stay in this file as
records. Nobody runs them for acceptance.

**Restart check v3.** Extract and run it:

```sh
awk '/^<!-- restart-check-v3.mjs end -->$/{f=0} f; /^<!-- restart-check-v3.mjs begin -->$/{f=1}' "$T/test-strategy.md" | sed '1d;$d' > "$D/restart-check.mjs"
echo "restart check script sha256: $(sha256sum < "$D/restart-check.mjs" | cut -c1-64)"
nice -n 19 node "$D/restart-check.mjs" --final > "$D/restart-check.log"; echo "restart check exit: $?"
nice -n 19 node "$D/restart-check.mjs" --final --control > "$D/restart-control.log"; echo "restart control exit: $?"
```

Expected script SHA-256: `6ae82ad4a305341a409be95cd007239ef069cac2e8c4ef6301467908bac78a9e`. Expected:
`restart check exit: 0` and `restart control exit: 1`. The control output holds FAIL lines with
`pre-restart manifest changed: w01/delivery-muse-v1`, `above the cap 0.51`, and `header or status`.

Changes from v2: one mode (`--final`); the limits color 4 and line 5 for the nut; the PM order set
(color try 3 and 4, line try 3, 4, and 5); the nut checks of all five PM-era tries; the guard map
check; the v4 manifest pin; and the pins of the nut judge copies of tries 1 to 5. The v4 folder
holds only the color try 4 and line try 5 pair.

Labels and values of `--final` (checked at `a2675b2c`):

| Label | Value |
| --- | --- |
| `cost files read:` | 15 |
| `cost rows with an unreadable time:` | 0 |
| `restart cost rows:` | 57 |
| `restart spend (USD):` | 0.57 |
| `restart failed calls (cost 0 or output none):` | 0 |
| `max tries for one picture and kind:` | 5 |
| `picture and kind pairs above their limit:` | 0 |
| `picture and kind pairs above 3 tries:` | 2 (`l2-w01-story-page-a-nut\|color`, `l2-w01-story-page-a-nut\|line`) |
| `nut tries color: <c> line: <l>` | 4, 5 |
| `judge prompt sha256:` / `judge cast sha256:` | `db5b443a…` / `2eb4a6a1…` |
| `calibration files judged: <f> pass: <p> fail: <x>` | 388, 381, 7 |
| `calibration gate controls: 2 failed:` | 2 |
| `calibration expected-pass files that did not pass:` | 0 |
| `production result files: <f> results: <r> second-judge results: <s>` | 22, 57, 6 |
| `production main fails:` | 6 |
| `retries: <r> after a confirmed fail: <c> by PM order: <p>` | 9, 6, 3 |
| `second-judge results that differ from the main verdict:` | 0 |
| `nut judge copies of tries 1 to 5 changed:` | 0 |
| `nut color try 3 verdict:` | pass, second none |
| `nut line try 3 verdict:` | fail, second fail |
| `nut line try 4 verdict:` | fail, second fail |
| `nut color try 4 verdict:` | pass, second none |
| `nut line try 5 verdict:` | pass, second none |
| `guard max tries:` | 3 |
| `guard try exceptions:` | 3 |
| `guard limit nut color: <c> line: <l>` | 4, 5 |
| `guard exceptions for other ids or kinds:` | 0 |
| `guard exceptions without a PM source:` | 0 |
| `restart delivery folders:` | 11 |
| `restart delivered files: <d> byte-equal to a source print: <b> with a pass verdict: <v>` | 51, 51, 51 |
| `restart delivered pictures:` | 24 |
| `line files not made from the delivered color:` | 0 |
| `restart delivered files with a wrong size or line format:` | 0 |
| `handoff <h>: files: <n> …` | drum 2, c 4, a 25, b 14, d 4, nut3 2; each `evidence words: yes` |
| `restart check:` | `pass` |

<!-- restart-check-v3.mjs begin -->
```js
// restart-check.mjs version 3: the read-only checker of test-strategy.md 5.11, 5.11.14, and 5.11.15.
// Run from the repo root: node <this file> --final [--control].
// It reads files only and imports the guard module (no call). It writes stdout only.
// Exit 0: every check holds. Exit 1: a check failed (a FAIL line names it). Exit 2: a usage error.
// --final: the final nut state of 2026-11-05 11:45 ICT. The nut has 4 color tries and 5 line tries.
//   The v3 pair (color try 4 m5, line try 5 from m5) is in w01/delivery-muse-v4 and the nut3
//   handoff folder. The v2 pair stays in w01/delivery-muse-v3 and a48-forge-pictures-a as the
//   superseded delivery. The modes of version 1 and 2 are retired.
// --control changes three expected values in memory (a pre-restart manifest pin, the cap, the judge
// model). A control run must exit 1 with the three FAIL lines; else the checks are vacuous (A4).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

for (const m of ['--nut3', '--pm-nut3', '--nut4-fail', '--nut4']) if (process.argv.includes(m)) { console.log(`usage: ${m} is retired (5.11.15); use --final`); process.exit(2); }
if (!process.argv.includes('--final')) { console.log('usage: give --final'); process.exit(2); }
const NUT3 = true; // the v3 pair is delivered
const CONTROL = process.argv.includes('--control');
const U = 'out/storytime/l2/unit1';
const RUNS = 'measure/runs/asset_storytime_l2_unit1_pictures_20261025';
const PROD = 'docs/storytime/l2-unit1/judge/prod';
const JC = 'out/storytime-review/judge/prod';
const HANDOFF = '/home/daniebo/Desktop/handoff';
const START = Date.parse('2026-11-04T07:54:00Z');
const MODEL = CONTROL ? 'control/no-such-model' : 'claude-code/claude-sonnet-5-5#high';
const CAP = CONTROL ? 510000n : 1000000n; // 1.00 USD in micro-USD; the control sets 0.51
const GROUP = { 'l2-w01-practice-line-nose': 'l2-w01-check-row-nose' };
const NUT = 'l2-w01-story-page-a-nut';
// Tries that a PM order caused: the nut tries 3 (08:44 ICT), the nut line try 4 (09:17 ICT), and
// the nut color try 4 and line try 5 (about 10:23 ICT), all on 2026-11-05.
const PM_ORDER = new Set([`${NUT}|color|3`, `${NUT}|line|3`, `${NUT}|line|4`, `${NUT}|color|4`, `${NUT}|line|5`]);
// The try limit of each picture and kind: 3, the nut color 4, and the nut line 5.
const LIMITS = { [`${NUT}|color`]: 4, [`${NUT}|line`]: 5 };
const limitOf = (k) => LIMITS[k] ?? 3;
const PRE = {
  'w01/delivery-muse-v1': '00ea0c5b06d18e3f54cbceed9caa943100c0711bb515c44561eb46b7e03ed369',
  'w01/delivery-muse-v2': 'd3eec18ce7c94b94ed5b0751df164578558ad44f04bebe7b4b371a3ed213796a',
  'w02/delivery-muse-v1': '6e6b51450d406bfdac47e01f484925b270bd0b1647bbfc0550d7529809cfeaf4',
  'w03/delivery-muse-v1': '24213647b0f1b92cdb891746cdf6181ff7f20f306c51d256fec150c38d5c273b',
  'w04/delivery-muse-v1': '4e74b7302a851e0261099925a23c0b9246a533911374af01d9748b905320d310',
  'w05/delivery-muse-v1': 'c3f009e6bfcb3037ae24b495c6e68527bfbf86162deb3a40a9bbd28a416ffbaf',
  'w06/delivery-muse-v1': '11c5dc10198c9d446afc8ffd80aff46c747d2dec34b77293327907d729163292',
  'w07/delivery-muse-v1': '6a5724c42a83134d80fc1cd1ccecdafe1a76dd25961e040caffaafccc81ea3c2',
  'cover/delivery-muse-v1': '27710b3711757d99294b7e837377d325eb9a6094e1dad43e0f064d2581397b88',
};
if (CONTROL) PRE['w01/delivery-muse-v1'] = '0'.repeat(64);
const RESTART = {
  'w01/delivery-muse-v3': '38a16765a061a8f71fba1fe5744c1b2aa3b48b35b87352c12302ce519e44dce0',
  'w02/delivery-muse-v2': 'c59a75bb30def25168bd90effbf44931e2d6a0a4844b1b961ce8105b61146ae5',
  'w03/delivery-muse-v2': 'bb7a27525fcd8da28a9cf8148a2f39bcc2e0609ef86a0648425b66c8ecafa30a',
  'w04/delivery-muse-v2': '82d467e6ecedd7caea7331dd9088c35d000db16d67c1a80f8818f68dfd2fe52c',
  'w05/delivery-muse-v2': '0e2fde98f4610afbe49637241f3887e1378dd6f293a69d763df8362d453885ca',
  'w06/delivery-muse-v2': '66bb2f62b46a8dcc2e0497ab9b637929ec0d93b2de56a27b84eccb5b6d33ee60',
  'w07/delivery-muse-v2': '352b2dabe598f80ed4d9ef10977c86f9a988c9d6e8a59cfea52fa59ced1f32b4',
  'w05/delivery-a48-d': '0fa7b23268449a9f83365eb4ea03057a1a6453b291bcdf697251fd0421f39fea',
  'w07/delivery-a48-d': '36b4febcdcdc80d10c789866e1d468b88708389cc7af28bfd79778cf299b8eb8',
  'w08/delivery-muse-v1': '2dc0812b3a90be19bd288d622d1c9fdd4d682bd013c2c99242441f09a71b9f92',
  'w01/delivery-muse-v4': '2f46efcb11f490fc9a03e28e18eac874cdb0f3197273a722d7852a8c11d15330',
};
const NUT3_DIR = 'w01/delivery-muse-v4';
const HANDOFFS = { drum: 2, c: 4, a: 25, b: 14, d: 4, ...(NUT3 ? { nut3: 2 } : {}) };

let failures = 0;
const fail = (m) => { failures += 1; console.log(`FAIL ${m}`); };
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const json = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const group = (id) => GROUP[id] ?? id;
const micro = (v) => {
  if (!/^\d+(\.\d{1,6})?$/.test(v)) return null;
  const [i, d = ''] = v.split('.');
  return BigInt(i) * 1000000n + BigInt((d + '000000').slice(0, 6));
};
const usd = (m) => `${m / 1000000n}.${String((m % 1000000n) / 10000n).padStart(2, '0')}`;

// 1. Restart rows of every Muse cost file (week folders and element folders).
const costFiles = [];
for (const w of fs.readdirSync(U).sort()) {
  for (const s of ['muse/costs.tsv', 'muse/elements/costs.tsv']) {
    const f = path.join(U, w, s);
    if (fs.existsSync(f)) costFiles.push(f);
  }
}
const rows = [];
let spend = 0n;
let badTime = 0;
for (const f of costFiles) {
  const [head, ...lines] = fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.trim());
  const H = head.split('\t');
  const col = Object.fromEntries(['time', 'row', 'version', 'kind', 'inputs', 'output', 'usage_cost'].map((n) => [n, H.indexOf(n)]));
  if (col.time < 0 || col.usage_cost < 0 || col.row < 0 || col.kind < 0 || col.output < 0) { fail(`header without a needed column: ${f}`); continue; }
  for (const l of lines) {
    const c = l.split('\t');
    const t = Date.parse(c[col.time]);
    if (Number.isNaN(t)) { badTime += 1; continue; }
    if (t < START) continue;
    const m = micro((c[col.usage_cost] ?? '').trim());
    if (m === null) { fail(`usage_cost is not a decimal: ${f}: ${l}`); continue; }
    spend += m;
    rows.push({ f, dir: path.dirname(f), t, row: c[col.row], kind: c[col.kind], out: c[col.output], inp: c[col.inputs] ?? '', m });
  }
}
console.log(`cost files read: ${costFiles.length}`);
console.log(`cost rows with an unreadable time: ${badTime}`);
console.log(`restart cost rows: ${rows.length}`);
console.log(`restart spend (USD): ${usd(spend)}`);
if (badTime !== 0) fail(`cost rows with an unreadable time: ${badTime}`);
if (spend > CAP) fail(`restart spend ${usd(spend)} is above the cap ${usd(CAP)}`);

// Tries: rows with a cost above 0 and an output, kind color or line, counted per picture group.
const tryRows = rows.filter((r) => (r.kind === 'color' || r.kind === 'line') && r.m > 0n && r.out !== 'none');
console.log(`restart failed calls (cost 0 or output none): ${rows.length - tryRows.length}`);
const perGroup = new Map();
for (const r of tryRows) { const k = `${group(r.row)}|${r.kind}`; perGroup.set(k, (perGroup.get(k) ?? 0) + 1); }
const maxTries = Math.max(0, ...perGroup.values());
const over = [...perGroup].filter(([k, n]) => n > limitOf(k));
const fourth = [...perGroup].filter(([, n]) => n > 3).map(([k]) => k).sort();
console.log(`picture and kind pairs with a try: ${perGroup.size}`);
console.log(`max tries for one picture and kind: ${maxTries}`);
console.log(`picture and kind pairs above their limit: ${over.length}`);
console.log(`picture and kind pairs above 3 tries: ${fourth.length}${fourth.length ? ` (${fourth.join(', ')})` : ''}`);
console.log(`nut tries color: ${perGroup.get(`${NUT}|color`) ?? 0} line: ${perGroup.get(`${NUT}|line`) ?? 0}`);
for (const [k, n] of over) fail(`${k} has ${n} tries (limit ${limitOf(k)})`);
// Judge copy number n of one id and kind: the n-th restart row of that id and kind in its cost
// file, in time order, failed rows included (restartTries of scripts/storytime-judge-batch.mjs).
const rowsOf = (r) => rows.filter((x) => x.f === r.f && x.row === r.row && x.kind === r.kind && (x.kind === 'color' || x.kind === 'line')).sort((a, b) => a.t - b.t);
const tryOf = (r) => rowsOf(r).indexOf(r) + 1;
const prevTryOf = (r) => { const all = rowsOf(r); const before = all.slice(0, all.indexOf(r)).filter((x) => tryRows.includes(x)); return before.length ? all.indexOf(before[before.length - 1]) + 1 : 0; };

// 2. Judge kit and calibration.
const PROMPT_SHA = 'db5b443a6ea7740f435fedb7f13d0fd12971332c08b6e71d09e4a468da02ffd8';
const CAST_SHA = '2eb4a6a14d2ba6e49223e27d9ad390aad7ba1d247b272f6a467742b931046e76';
const ps = sha('docs/storytime/l2-unit1/judge/judge-prompt.md');
const cs = sha('docs/storytime/l2-unit1/judge/cast.json');
console.log(`judge prompt sha256: ${ps}`);
console.log(`judge cast sha256: ${cs}`);
if (ps !== PROMPT_SHA) fail('judge prompt SHA-256 differs from the calibration value');
if (cs !== CAST_SHA) fail('judge cast SHA-256 differs from the calibration value');
const headerOk = (j) => j.status === 'complete' && j.model === MODEL && /judge-prompt\.md v6$/.test(j.judgePrompt ?? '') && /2eb4a6a1/.test(j.cast ?? '');
const calSet = json('docs/storytime/l2-unit1/judge/calibration-set.json').entries;
const calExpected = new Map(calSet.map((e) => [e.judgeFile, e.expected]));
let calPass = 0, calFail = 0, calFiles = 0, calCtrl = 0, calCtrlFail = 0, calPassBroken = 0;
const calSeen = new Set();
for (const g of ['w01', 'w02', 'w03', 'w04', 'w05', 'w06', 'w07', 'cover']) {
  const f = `${RUNS}/judge-cal-${g}-aba118fe.json`;
  if (!fs.existsSync(f)) { fail(`missing ${f}`); continue; }
  const j = json(f);
  if (!headerOk(j)) fail(`calibration header or status: ${f}`);
  let p = 0, x = 0;
  for (const r of j.results) {
    calFiles += 1; calSeen.add(r.judgeFile);
    if (r.verdict === 'pass') p += 1; else if (r.verdict === 'fail') x += 1; else fail(`verdict ${r.verdict} in ${f}`);
    const e = calExpected.get(r.judgeFile);
    if (e === undefined) fail(`calibration result for a file outside the set: ${r.judgeFile}`);
    if (e === 'fail') { calCtrl += 1; if (r.verdict === 'fail') calCtrlFail += 1; }
    if (e === 'pass' && r.verdict !== 'pass') calPassBroken += 1;
  }
  if (j.summary?.pass !== p || j.summary?.fail !== x || j.summary?.files !== j.results.length) fail(`summary of ${f} differs from its results`);
  calPass += p; calFail += x;
}
console.log(`calibration files judged: ${calFiles} pass: ${calPass} fail: ${calFail}`);
console.log(`calibration set entries without a result: ${calSet.filter((e) => !calSeen.has(e.judgeFile)).length}`);
console.log(`calibration gate controls: ${calCtrl} failed: ${calCtrlFail}`);
console.log(`calibration expected-pass files that did not pass: ${calPassBroken}`);
if (calFiles !== 388 || calPass !== 381 || calFail !== 7) fail('calibration counts differ from 388 / 381 / 7');
if (calCtrl !== 2 || calCtrlFail !== 2) fail('a gate control did not fail');
if (calPassBroken !== 0) fail('an expected-pass calibration file did not pass');
if (calSet.length !== 388 || calSeen.size !== 388) fail('calibration set and results differ');

// 3. Production judge results, tied to their batch files.
const prod = [];
for (const f of fs.readdirSync(RUNS).filter((n) => /^judge-prod-.*\.json$/.test(n)).sort()) {
  const j = json(`${RUNS}/${f}`);
  const second = f.includes('-second-');
  if (!headerOk(j)) { fail(`production header or status: ${f}`); continue; }
  const batch = `${PROD}/batch-${String(j.group).replace(/^prod-/, '')}.json`;
  const entries = second ? null : (fs.existsSync(batch) ? json(batch) : null);
  if (!second && !entries) { fail(`no batch file ${batch} for ${f}`); continue; }
  for (const r of j.results) {
    if (!second && !entries.some((e) => e.judgeFile === r.judgeFile && e.id === r.id && e.kind === r.kind)) fail(`${f}: ${r.judgeFile} is not in ${batch}`);
    if (!fs.existsSync(r.judgeFile)) fail(`${f}: judge copy missing ${r.judgeFile}`);
    prod.push({ f, second, ...r });
  }
}
const main = prod.filter((r) => !r.second);
console.log(`production result files: ${new Set(prod.map((r) => r.f)).size} results: ${main.length} second-judge results: ${prod.length - main.length}`);
console.log(`production main fails: ${main.filter((r) => r.verdict === 'fail').length}`);

// 4. Retry rule: each later try follows a fail of the try before it that a second judge confirms,
// or a PM order.
const jf = (id, kind, n) => `${JC}/${id}-${kind}-t${n}.png`;
let retries = 0, retriesConfirmed = 0, retriesPm = 0;
for (const r of tryRows) {
  const n = tryOf(r);
  const p = prevTryOf(r);
  if (p === 0) continue;
  retries += 1;
  const prev = jf(r.row, r.kind, p);
  const m1 = main.find((x) => x.judgeFile === prev && x.verdict === 'fail');
  const s1 = prod.find((x) => x.second && x.judgeFile === prev && x.verdict === 'fail');
  const s1pass = prod.find((x) => x.second && x.judgeFile === prev && x.verdict === 'pass');
  if (m1 && s1 && !s1pass) retriesConfirmed += 1;
  else if (PM_ORDER.has(`${r.row}|${r.kind}|${n}`)) retriesPm += 1;
  else fail(`try ${n} of ${r.row} ${r.kind} has no confirmed fail of try ${p} and no PM order`);
}
console.log(`retries: ${retries} after a confirmed fail: ${retriesConfirmed} by PM order: ${retriesPm}`);
const disagree = prod.filter((y) => y.second && main.some((x) => x.judgeFile === y.judgeFile && x.verdict !== y.verdict));
console.log(`second-judge results that differ from the main verdict: ${disagree.length}`);
// The judge copies of the nut tries 1 and 2 keep their bytes; a try 3 batch names the new mustShow.
const NUT_COPIES = {
  'color-t1': '8f62fb3871c1dbc9f7c481a575cccbadf6a84fa872aeb8c248c4704c7b339041',
  'color-t2': '8ed540398c94554e5239440fd9d98300a4033c5bd8b35f55b8fb27ada4d14c52',
  'line-t1': 'd9b784e2b7920a6a4d7d9f82b4e07bb3b10c0811c9e9f11258c2ef1a71826d38',
  'line-t2': '6ba147242f5f2b19a44146789546b39b34424400e27d6dc976ff9d1b3e8e5360',
  'color-t3': '11afe42b6d5c149fc0b49c6862e9ad6c989d85133947a05022d3d0e17aaf18e0',
  'line-t3': 'a5749b6eb7b98028cf66131389970533c0686e5237ffff9a0ecce688449d66c9',
  'color-t4': '2e1c6b810866dbfee8b8c28fc89720eed91f477f609e1944c6f67c0900c03cd4',
  'line-t4': '01b2d1cd0979115fccc6a52835a402224650ffd6989e8d5628b24b652e00babf',
  'line-t5': 'bbc0ffccb1aada33a1f3bfc2587068fd8c7c1d3f8a799bb49a9bf03319c4da43',
};
let nutCopyBad = 0;
for (const [k, v] of Object.entries(NUT_COPIES)) if (sha(`${JC}/${NUT}-${k}.png`) !== v) { nutCopyBad += 1; fail(`judge copy ${NUT}-${k}.png changed`); }
console.log(`nut judge copies of tries 1 to 5 changed: ${nutCopyBad}`);
// The nut PM tries: each one has a main result, and its batch names the "one nut only" check.
const nutTry = (kind, n, want) => {
  const r = main.find((x) => x.judgeFile === jf(NUT, kind, n));
  const b = r && json(`${PROD}/batch-${JSON.parse(fs.readFileSync(`${RUNS}/${r.f}`, 'utf8')).group.replace(/^prod-/, '')}.json`).find((e) => e.judgeFile === r.judgeFile);
  const second = prod.filter((x) => x.second && x.judgeFile === jf(NUT, kind, n));
  console.log(`nut ${kind} try ${n} verdict: ${r ? r.verdict : 'none'} second-judge verdicts: ${second.map((x) => x.verdict).join(',') || 'none'}`);
  if (!r) { fail(`no judge result for the nut ${kind} try ${n}`); return; }
  if (!(b?.mustShow ?? []).some((m) => m.startsWith('one nut only'))) fail(`the nut ${kind} try ${n} batch has no mustShow "one nut only"`);
  if (r.verdict !== want) fail(`the nut ${kind} try ${n} verdict is ${r.verdict}, ${want} wanted in this mode`);
  if (want === 'fail' && (second.length === 0 || second.some((x) => x.verdict !== 'fail'))) fail(`the nut ${kind} try ${n} fail has no second-judge fail`);
};
nutTry('color', 3, 'pass'); nutTry('line', 3, 'fail'); nutTry('line', 4, 'fail');
nutTry('color', 4, 'pass'); nutTry('line', 5, 'pass');
const nutC = perGroup.get(`${NUT}|color`) ?? 0;
const nutL = perGroup.get(`${NUT}|line`) ?? 0;
if (nutC !== 4 || nutL !== 5) fail(`nut tries color ${nutC} line ${nutL}: the final state needs color 4 and line 5`);
if (JSON.stringify(fourth) !== JSON.stringify([`${NUT}|color`, `${NUT}|line`])) fail('the pairs above 3 tries are not exactly the nut color and the nut line');
// The guard module holds the same exceptions: 3 nut entries (color +1, line +2), MAX_TRIES 3.
const guards = await import(path.resolve('scripts/storytime-muse-guards.mjs'));
const exc = Array.isArray(guards.TRY_EXCEPTIONS) ? guards.TRY_EXCEPTIONS : [];
const extra = (kind) => exc.filter((e) => e.id === NUT && e.kind === kind).reduce((a, e) => a + Number(e.extraTries), 0);
const others = exc.filter((e) => e.id !== NUT || (e.kind !== 'color' && e.kind !== 'line'));
const unsourced = exc.filter((e) => !/^PM, 2026-11-05 /.test(String(e.source ?? '')));
console.log(`guard max tries: ${guards.MAX_TRIES}`);
console.log(`guard try exceptions: ${exc.length}`);
console.log(`guard limit nut color: ${guards.MAX_TRIES + extra('color')} line: ${guards.MAX_TRIES + extra('line')}`);
console.log(`guard exceptions for other ids or kinds: ${others.length}`);
console.log(`guard exceptions without a PM source: ${unsourced.length}`);
if (guards.MAX_TRIES !== 3) fail('guard MAX_TRIES is not 3');
if (exc.length !== 3) fail(`guard TRY_EXCEPTIONS has ${exc.length} entries, 3 wanted`);
if (guards.MAX_TRIES + extra('color') !== 4 || guards.MAX_TRIES + extra('line') !== 5) fail('guard nut limits are not color 4 and line 5');
if (others.length !== 0 || unsourced.length !== 0) fail('a guard exception names another id or kind, or has no PM source');

// 5. Delivered files of the restart: each one is byte-equal to the print of a passing try.
for (const [d, want] of Object.entries(PRE)) {
  const got = sha(`${U}/${d}/manifest.json`);
  console.log(`manifest sha256 ${d}: ${got}`);
  if (got !== want) fail(`pre-restart manifest changed: ${d}`);
}
const restartDirs = { ...RESTART };
for (const w of fs.readdirSync(U)) {
  const p = path.join(U, w);
  if (!fs.statSync(p).isDirectory()) continue;
  for (const d of fs.readdirSync(p).filter((n) => n.startsWith('delivery-'))) {
    const k = `${w}/${d}`;
    if (!(k in PRE) && !(k in restartDirs)) fail(`unknown delivery folder ${k}`);
  }
}
if (!NUT3 && fs.existsSync(`${U}/${NUT3_DIR}`)) fail(`${NUT3_DIR} exists, but the run has no --nut4`);
const delivered = [];
const approvalsW08 = json('docs/storytime/l2-unit1/w08/muse/approved.json').entries;
for (const [d, want] of Object.entries(restartDirs)) {
  const dir = `${U}/${d}`;
  if (!fs.existsSync(`${dir}/manifest.json`)) { fail(`no manifest in ${d}`); continue; }
  const got = sha(`${dir}/manifest.json`);
  console.log(`manifest sha256 ${d}: ${got}`);
  if (want && got !== want) fail(`restart manifest changed: ${d}`);
  const man = json(`${dir}/manifest.json`);
  let entries;
  if (Array.isArray(man.files)) {
    entries = man.files.map((e) => ({ id: e.pictureId, kind: e.kind, file: e.file, sha256: e.sha256, source: e.source }));
  } else {
    entries = [];
    for (const job of man.jobs) {
      const a = approvalsW08.find((e) => e.rowId === job.id);
      if (!a) { fail(`${d}: no approval entry for ${job.id}`); continue; }
      for (const c of job.candidates) {
        const kind = /-line-v\d+\.png$/.test(c.file) ? 'line' : 'color';
        entries.push({ id: job.id, kind, file: c.file, sha256: c.fileSha256, source: `${U}/w08/muse/${kind === 'line' ? a.linePrint : a.colorPrint}` });
        if (c.lineArt?.file) entries.push({ id: job.id, kind: 'line', file: c.lineArt.file, sha256: c.lineArt.fileSha256, source: `${U}/w08/muse/${a.linePrint}` });
      }
    }
  }
  const pngs = fs.readdirSync(dir).filter((n) => n.endsWith('.png')).sort();
  const named = [...new Set(entries.map((e) => e.file))].sort();
  if (JSON.stringify(pngs) !== JSON.stringify(named)) fail(`${d}: PNG set and manifest set differ (${pngs.length} / ${named.length})`);
  for (const e of entries) delivered.push({ dir: d, ...e });
}
let byteOk = 0, passOk = 0, formatBad = 0;
const pictures = new Set();
const colorOut = new Map();
for (const e of delivered) {
  const file = `${U}/${e.dir}/${e.file}`;
  if (!fs.existsSync(file) || !fs.existsSync(e.source)) { fail(`${e.dir}/${e.file}: file or source missing`); continue; }
  const s = sha(file);
  if (s !== e.sha256 || s !== sha(e.source)) { fail(`${e.dir}/${e.file}: bytes differ from the manifest or the source print`); continue; }
  byteOk += 1;
  const ihdr = fs.readFileSync(file).subarray(16, 26);
  const [w, h, depth, type] = [ihdr.readUInt32BE(0), ihdr.readUInt32BE(4), ihdr[8], ihdr[9]];
  const [ww, wh] = e.id.includes('-story-page-') ? [4000, 3000] : [1500, 1500];
  if (w !== ww || h !== wh) { formatBad += 1; fail(`${e.dir}/${e.file}: ${w}x${h}, ${ww}x${wh} wanted`); }
  if (e.kind === 'line' && (depth !== 8 || type !== 0)) { formatBad += 1; fail(`${e.dir}/${e.file}: line file is not 8-bit gray (depth ${depth}, type ${type})`); }
  const outName = path.basename(e.source).replace('-print', '');
  const r = tryRows.find((x) => x.dir === path.dirname(e.source) && x.out === outName && x.kind === e.kind);
  if (!r) { fail(`${e.dir}/${e.file}: no restart try has the output ${outName}`); continue; }
  if (group(r.row) !== group(e.id)) fail(`${e.dir}/${e.file}: try row ${r.row} is not picture ${e.id}`);
  const n = tryOf(r);
  const j = jf(r.row, r.kind, n);
  const pass = main.find((x) => x.judgeFile === j && x.verdict === 'pass');
  if (!pass) { fail(`${e.dir}/${e.file}: try ${n} (${j}) has no pass verdict`); continue; }
  passOk += 1;
  for (let k = 1; k < n; k += 1) {
    if (main.some((x) => x.judgeFile === jf(r.row, r.kind, k) && x.verdict === 'pass') && !PM_ORDER.has(`${r.row}|${r.kind}|${n}`)) fail(`${e.dir}/${e.file}: try ${n} is delivered, but try ${k} passed first`);
  }
  if (e.dir === NUT3_DIR && (group(e.id) !== NUT || n !== (e.kind === 'color' ? 4 : 5))) fail(`${e.dir}/${e.file}: the folder holds only the nut color try 4 and line try 5 pair`);
  pictures.add(group(e.id));
  if (e.kind === 'color') colorOut.set(`${e.dir}|${group(e.id)}`, r.out);
  else e.lineInput = path.basename(r.inp);
  e.pass = `${pass.f} try ${n}`;
}
// The line try of a delivered pair starts from the delivered color try.
let twinBad = 0;
for (const e of delivered.filter((x) => x.kind === 'line' && x.lineInput)) {
  const c = colorOut.get(`${e.dir}|${group(e.id)}`);
  if (c && c !== e.lineInput) { twinBad += 1; fail(`${e.dir}/${e.file}: line input ${e.lineInput} is not the delivered color ${c}`); }
}
console.log(`restart delivery folders: ${Object.keys(restartDirs).length}`);
console.log(`restart delivered files: ${delivered.length} byte-equal to a source print: ${byteOk} with a pass verdict: ${passOk}`);
console.log(`restart delivered pictures: ${pictures.size}`);
console.log(`line files not made from the delivered color: ${twinBad}`);
console.log(`restart delivered files with a wrong size or line format: ${formatBad}`);
const wantFiles = 49 + (NUT3 ? 2 : 0);
if (delivered.length !== wantFiles || byteOk !== wantFiles || passOk !== wantFiles) fail(`restart delivered files are not ${wantFiles}`);
if (pictures.size !== 24) fail('restart delivered pictures are not 24');

// 6. Handoff folders.
const byName = new Map();
for (const e of delivered) { const k = e.file; if (!byName.has(k)) byName.set(k, new Set()); byName.get(k).add(e.sha256); }
for (const [h, n] of Object.entries(HANDOFFS)) {
  const dir = `${HANDOFF}/a48-forge-pictures-${h}`;
  if (!fs.existsSync(`${dir}/MANIFEST.txt`)) { fail(`no MANIFEST.txt in ${dir}`); continue; }
  const pngs = fs.readdirSync(dir).filter((x) => x.endsWith('.png')).sort();
  const text = fs.readFileSync(`${dir}/MANIFEST.txt`, 'utf8');
  const lines = [...text.matchAll(/^([0-9a-f]{64})  ([^\s/]+\.png)$/gm)];
  const listed = [...new Set(lines.map((m) => m[2]))].sort();
  let eq = 0;
  for (const p of pngs) {
    const s = sha(`${dir}/${p}`);
    if (byName.get(p)?.has(s)) eq += 1; else fail(`handoff ${h}/${p} is not byte-equal to a restart delivery file`);
    if (lines.some((m) => m[2] === p && m[1] !== s)) fail(`handoff ${h}/${p}: MANIFEST line differs from the file`);
  }
  console.log(`handoff ${h}: files: ${pngs.length} manifest lines: ${listed.length} byte-equal to delivery: ${eq} evidence words: ${text.includes('model evidence, not acceptance') ? 'yes' : 'no'}`);
  if (pngs.length !== n) fail(`handoff ${h}: ${pngs.length} files, ${n} wanted`);
  if (JSON.stringify(pngs) !== JSON.stringify(listed)) fail(`handoff ${h}: MANIFEST lines and files differ`);
  if (!text.includes('model evidence, not acceptance')) fail(`handoff ${h}: no "model evidence, not acceptance"`);
}
if (!NUT3 && fs.existsSync(`${HANDOFF}/a48-forge-pictures-nut3`)) fail('a48-forge-pictures-nut3 exists, but the run has no --nut4');

console.log(`restart check: ${failures === 0 ? 'pass' : `fail (${failures})`}`);
process.exit(failures === 0 ? 0 : 1);
```
<!-- restart-check-v3.mjs end -->

**Pin block 3 (X3).** It holds the r8 and r9 judge results, the nut judge copies of tries 4 and 5,
the m4 line try 4 print, the m5 prints, the v4 manifest, and the `nut3` handoff manifest.

```sh
awk '/^<!-- restart-pins-3 end -->$/{f=0} f; /^<!-- restart-pins-3 begin -->$/{f=1}' "$T/test-strategy.md" | sed '1d;$d' > "$D/pins-3.sha256"
echo "pin 3 lines: $(wc -l < "$D/pins-3.sha256")"
sha256sum -c --quiet "$D/pins-3.sha256"; echo "pin 3 check exit: $?"
```

Expected: `pin 3 lines: 12` and `pin 3 check exit: 0`.

<!-- restart-pins-3 begin -->
```text
19404008f03af3d90183370d1b2e69ff0fef21409e2374477de3ce5e9b212e94  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r8-line-nut4-c3d31c2a.json
bec7fcda01776250205657d429204e243ebd6622d6225acd0e86798ac0528e0d  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r8-line-nut4-second-c3d31c2a.json
19e523d74d72a862354ad34033d373a499dcab70a0a01472610eab23a1c7620e  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r9-color-nut5-5251c126.json
461dc11aaf06d6232cae834c6c02efcec3300ef8988511d8702a966535beefa4  measure/runs/asset_storytime_l2_unit1_pictures_20261025/judge-prod-r9-line-nut5-5251c126.json
2e1c6b810866dbfee8b8c28fc89720eed91f477f609e1944c6f67c0900c03cd4  out/storytime-review/judge/prod/l2-w01-story-page-a-nut-color-t4.png
01b2d1cd0979115fccc6a52835a402224650ffd6989e8d5628b24b652e00babf  out/storytime-review/judge/prod/l2-w01-story-page-a-nut-line-t4.png
bbc0ffccb1aada33a1f3bfc2587068fd8c7c1d3f8a799bb49a9bf03319c4da43  out/storytime-review/judge/prod/l2-w01-story-page-a-nut-line-t5.png
47d61a00db245aca7e0f9f9d0f61609c6b49c14048090772fedb0af5d1902031  out/storytime/l2/unit1/w01/muse/l2-w01-story-page-a-nut-m4-line-print-2.png
f16c547ae0d8489be4737096a2bd0bd3d429fc3d7ea13fe6ad5f40ce2dc32157  out/storytime/l2/unit1/w01/muse/l2-w01-story-page-a-nut-m5-color-print.png
e155d846429da010fd88cbb81522689ab2989d534567311d3a33b5d605b9ee04  out/storytime/l2/unit1/w01/muse/l2-w01-story-page-a-nut-m5-line-print.png
2f46efcb11f490fc9a03e28e18eac874cdb0f3197273a722d7852a8c11d15330  out/storytime/l2/unit1/w01/delivery-muse-v4/manifest.json
7c8ec3f3ec1bc891e27218f0bf7cbd6484b31d48cdbbd8124af65804d278afd3  /home/daniebo/Desktop/handoff/a48-forge-pictures-nut3/MANIFEST.txt
```
<!-- restart-pins-3 end -->

**Maker brief (final).** M1 and M3 to M6 are done (T4 steps 9 to 14 and 12). These steps stay:

1. M2 Fix the 25 owned type errors in `tests/storytime-muse-attempts.test.ts` with type
   annotations only. Change no runtime code and no test assertion. Commit with an explicit path.
2. When the heavy lock is free, run TYPECHECK_COMMAND once. Record `tsc errors total:` (38 or
   less) and `owned tsc errors:` (0).
3. M7 Run GREEN_TEST_COMMAND once, after M2. Quote the labeled totals in the plan.
4. M8 Run restart check v3 with `--final` and with `--final --control`. Quote the labeled lines in
   the plan. Write the role log in `$R`. Do not commit `$R`. Do not run `./measure/generate.sh`.

No Muse call and no judge call run in the maker's last step. No further nut try runs without a new
PM word.

**Checker brief (final).** The checker is `measure-phase-acceptance` on
`coding-plan/glm-5.3-flash#high`. On `fail` or `inconclusive`, the orchestrator runs it once more
on `coding-plan/glm-latest#high`. The checker starts after the maker's GREEN_TEST_COMMAND run and
its TYPECHECK_COMMAND run are in the plan.

1. Rerun X1 to X15 and G5 on the final HEAD, with read-only commands and the temp folder `$D`.
2. Run restart check v3 with `--final` and with `--final --control`. Run pin blocks 1, 2, and 3.
   Run the six handoff check commands.
3. Run TYPECHECK_COMMAND once, then PROJECT_TESTS once, then KNOWN_RED_COMMAND once. Run one heavy
   command at a time. Wait for a held lock. Never run `pnpm`.
4. Compare each plan quote with your own output. Read every X13 match and give a reason.
5. Write `$R/acceptance-p5-restart-<HEAD7>.json` and `.log` (the audit result JSON of
   `contracts.md`). Do not commit them.

**Anti-pattern notes for this addition.**

| Class | Defense | Falsification condition |
| --- | --- | --- |
| A3 | The guard check and the limits read labels (`guard try exceptions:`, `guard limit nut color: … line: …`, `pairs above 3 tries:`). | A bare count satisfies X2 or X5. |
| A4 | One mode only. Retired modes and no mode exit `2`. The control must exit `1`. The script wants exactly 51 delivered files. | The control exits `0`, or a retired mode exits `0`. |
| A5 | The plan step 13 and 14 notes must equal the v3 output (57 rows, 0.57 USD, the verdicts). Pin block 3 holds the untracked results. | A plan number differs, or a pin fails. |
| A7 | The limits apply to the nut color and the nut line only. A 4th try of any other pair fails. The map check counts entries for other ids or kinds. | Another pair has a 4th try, or the map has an entry for another id. |
| A11 | The guard map (code), the v3 limits (checker), and this text name the same three PM grants. | The code limit differs from 4 and 5, or the text names a grant that the map does not hold. |

**Findings at `a2675b2c`** (read-only checks: restart check v3 `--final`, X1, X2, X12, X13, X14,
the structural doctor, and the `nut3` check command).

| Id | Class | Finding | Owner |
| --- | --- | --- | --- |
| F1 | Fixed | T5 and T6 hold a commit SHA on the first line. All 7 Phase 5 tasks are `[x]` with a commit SHA. | none |
| F2 | Blocks X11 | Interim type check: 25 owned errors in `tests/storytime-muse-attempts.test.ts` (total 63). The fix and the run wait for the heavy lock. Not checked by this role. | Maker M2 |
| F3 | Fixed | X13 prints only the 3 w08 approval notes, which the file-level rule qualifies. | none |
| F4 | Fixed | `metadata.json` `actual_tasks` is 29, equal to the grep. `status` is `in_progress`. | none |
| F5 | Fixed | Task 3 is `[x]`. | none |
| F6 | Blocks X10 | GREEN_TEST_COMMAND has not run since the step 11 and 13 code changes. | Maker M7 |
| N4 | Informational | `d6867c52` has the subject `measure(tracks):`, so X1 lists it as a foreign commit. It touches only `measure/tracks.md` and no Storytime path. The checker names it and gives this reason. | none |
| N5 | Informational | The working tree holds an uncommitted `measure/tracks.md` hunk of another session. X15 and Q3 apply: nobody stages it. | none |
| N6 | Informational | The structural doctor prints 12 errors. None names this track or an owned file. | Closeout |

No delivered file lacks a passing judge result: v3 `--final` gives 51 of 51.

###### 5.11.16 Known-red rule under list drift (2026-11-05 14:00, role base `b72f8b60`)

This addition replaces the KNOWN_RED expectation of 5.11.4 and X10 ("exactly 8 failures"). The
command stays. The text of 5.11.1 to 5.11.15 stays. Where this addition and an earlier part of
5.11 differ, this addition applies.

The finding. The Phase 5 checker (`coding-plan/glm-5.3-flash#high`, audited HEAD `b72f8b60`)
measured `Tests  7 failed | 135 passed (142)` for `tests/storytime-book-pictures.test.ts`. The
failing tests were T142, T145, T147, T150, T173, T174, and T177. The gate said exactly 8. The cause
is list drift: Workbooks commit `b80c374d` (2026-11-05 10:19 ICT, "list version 6, 196 rows")
changed the live list from `327f805f…` (194 rows) to
`89b2910c28f07dcda1bd6a93349a26f31a32e971b72a55ec68e1bc9e48d9b33d` (196 rows). The test file pins
list v4 (`6d05dfc5…`, 196 rows).

**The earlier 8 failures.** No log names them: the T4 log and the step 8 result block give only
the count and the reason. This role derived them read-only. It read the list `327f805f` from
Workbooks commit `c618523e` (`git show`, SHA-256 checked) and computed the assertions of each
pin-dependent test:

| Test | List `327f805f` (194 rows) | List `89b2910c` (196 rows) | Failing assertion |
| --- | --- | --- | --- |
| T142 | fail | fail | List SHA-256 pin; week 1 rows 29, not 30; week 1 class C 11, not 12 |
| T145 | fail | fail | Week 1 rows 29; practice-line rows 2, not 3 |
| T147 | fail | fail | List SHA-256 pin; `pictures.md` SHA-256 pin |
| T150 | fail | fail | Week 1 rows 29, not 30 |
| T173 | fail | fail | The live render refuses the live list (the source pins v4 `6d05dfc5`) |
| T174 | fail | fail | Labeled counts of v4 and the loader SHA-256 pin |
| T176 | **fail** | **pass** | `Rows checked`: 194 at `327f805f`; 196 at `89b2910c`, the value that the test wants. Every row has the pixel size of its class, and the classes are A, B, and C. |
| T177 | fail | fail | Week 8 rows 3, not 4; weeks 2 to 7 rows 164 at `89b2910c` (162 at `327f805f`); the dry run stops on the list pin |

T176 now passes because Workbooks added the two D4 rows (`l2-w05-d4-prompt-face`,
`l2-w07-d4-prompt-ball`, class C, 1500 x 1500). The list has 196 rows again, which equals the v4
row count that T176 checks. The other 7 still fail. The checker result matches this prediction.

**The named known-red set.** A test is pin-dependent when its body reads the live list or a list
pin: `LIST_FILE`, `LIST_MARKDOWN_FILE`, `LIST_SHA256`, `LIST_MARKDOWN_SHA256`, `PRINT_ROOT`,
`V4_SHA256`, `rawRows(`, or the pin text `6d05dfc5`. The script `pin-set.mjs` below finds them. A
body runs from its `it('T<n>:` line to the first later `})` or `}, <n>)` line at the same indent.
At `b72f8b60` the set holds 13 of the 142 tests:

`T142, T143, T144, T145, T147, T148, T149, T150, T173, T174, T175, T176, T177`

The drift sentinels are T142, T147, T173, and T174. Each one asserts the list SHA-256 pin or the
source pin directly, so each one fails whenever the live list differs from `6d05dfc5…`.

**The known-red rule.** The KNOWN_RED_COMMAND result passes the gate when all of these hold:

1. The test file is byte-equal to its state at `b72f8b60` (`git diff` prints nothing for it).
2. The file runs whole, alone, with no `-t` filter, and with no skipped and no todo test. The
   `Tests` line sums to 142.
3. The live list SHA-256 differs from the pin `6d05dfc5…`. (If it equals the pin, the rule wants
   exit `0` and 0 failures.)
4. Every failing test is in the named set. A failing test outside the set is a new failure and
   fails the gate.
5. All 4 drift sentinels fail. A sentinel that passes while the list differs from the pin shows
   that the test did not run its pin check (A4).
6. `pin-set.mjs` extracted from this file has the SHA-256 below and prints the named set.

The rule needs no exact failure count. The count follows the list, and Workbooks owns the list.

KNOWN_RED_CHECK (checker, once; `$T` and `$D` as in 5.11.3; one heavy command):

```sh
F=tests/storytime-book-pictures.test.ts
PIN=6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58
awk '/^<!-- pin-set.mjs end -->$/{f=0} f; /^<!-- pin-set.mjs begin -->$/{f=1}' "$T/test-strategy.md" | sed '1d;$d' > "$D/pin-set.mjs"
echo "pin set script sha256: $(sha256sum < "$D/pin-set.mjs" | cut -c1-64)"
node "$D/pin-set.mjs" "$F" > "$D/pin-set.txt"; cat "$D/pin-set.txt"
echo "test file changed since b72f8b60: $(git diff --name-only b72f8b60..HEAD -- "$F" | wc -l)"
LIVE=$(sha256sum < /home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json | cut -c1-64)
echo "live list sha256: $LIVE"
echo "live list differs from the pin: $([ "$LIVE" != "$PIN" ] && echo yes || echo no)"
HEAVY_MIN_AVAIL_MB=1500 bash $HOME/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1' > "$D/known-red.log" 2>&1; echo "known red exit: $?"
grep -E '^ *Tests  ' "$D/known-red.log"
grep -E '^ *FAIL  tests/storytime-book-pictures\.test\.ts > ' "$D/known-red.log" | grep -oE '> T[0-9]+[a-z]?:' | grep -oE 'T[0-9]+[a-z]?' | sort -u > "$D/failing.txt"
sed -n 's/^pin-dependent tests: [0-9]* //p' "$D/pin-set.txt" | tr ',' '\n' | sort -u > "$D/pinset.txt"
echo "known red failing tests: $(wc -l < "$D/failing.txt") $(paste -sd, "$D/failing.txt")"
echo "known red failing tests outside the pin set: $(comm -23 "$D/failing.txt" "$D/pinset.txt" | wc -l)"
echo "known red drift sentinels failing: $(printf 'T142\nT147\nT173\nT174\n' | comm -12 - "$D/failing.txt" | wc -l) of 4"
echo "known red skipped or todo: $(grep -E '^ *Tests  ' "$D/known-red.log" | grep -cE 'skipped|todo')"
```

Expected at the live list `89b2910c`:

| Label | Value |
| --- | --- |
| `pin set script sha256:` | `f67cfa8f17d380cb7e6f7632612b8f56d5cba6793d642a90abf2b5c1fd4a3fe0` |
| `tests in the file:` | 142 |
| `pin-dependent tests:` | `13 T142,T143,T144,T145,T147,T148,T149,T150,T173,T174,T175,T176,T177` |
| `test file changed since b72f8b60:` | 0 |
| `live list differs from the pin:` | yes |
| `known red exit:` | 1 |
| `Tests` line | `Tests  7 failed \| 135 passed (142)` (any `<F> failed \| <P> passed (142)` with `<F>` + `<P>` = 142 passes the rule) |
| `known red failing tests:` | `7 T142,T145,T147,T150,T173,T174,T177` (the values of the probe; another subset of the named set also passes) |
| `known red failing tests outside the pin set:` | 0 |
| `known red drift sentinels failing:` | `4 of 4` |
| `known red skipped or todo:` | 0 |

Falsification: a failing test outside the named set, a sentinel that passes while the list differs,
a skip, a filter, a `Tests` total other than 142, a changed test file, or a script SHA-256 that
differs. Each one fails X10.

<!-- pin-set.mjs begin -->
```js
// pin-set.mjs: read-only. Lists the test ids of tests/storytime-book-pictures.test.ts whose body
// depends on the live picture list or a list pin. A body runs from its `it('T<n>:` line to the
// first later line `})` or `}, <n>)` at the same indent. Output: labeled lines only.
import fs from 'node:fs';
const lines = fs.readFileSync(process.argv[2] ?? 'tests/storytime-book-pictures.test.ts', 'utf8').split('\n');
const PIN = /\b(LIST_FILE|LIST_MARKDOWN_FILE|LIST_SHA256|LIST_MARKDOWN_SHA256|PRINT_ROOT|V4_SHA256)\b|rawRows\(|6d05dfc5/;
const ids = [];
let tests = 0;
for (let i = 0; i < lines.length; i += 1) {
  const m = lines[i].match(/^(\s*)it\('(T\d+[a-z]?):/);
  if (!m) continue;
  tests += 1;
  const end = new RegExp(`^${m[1]}\\}(, \\d+)?\\);\\s*$`);
  let j = i + 1;
  while (j < lines.length && !end.test(lines[j])) j += 1;
  if (lines.slice(i, j + 1).some((l) => PIN.test(l))) ids.push(m[2]);
}
console.log(`tests in the file: ${tests}`);
console.log(`pin-dependent tests: ${ids.length} ${ids.join(',')}`);
```
<!-- pin-set.mjs end -->

**Carry-over rule for this acceptance run.** The checker measured the gates at `b72f8b60`. This
strategy commit changes no audited file. So it is not an implementation commit: it changes no
script, source, test, spec, batch, approval list, delivery, or plan. The measured results carry over
to the new HEAD when all of these conditions hold:

1. `git diff --name-only b72f8b60..HEAD` lists only `$T/test-strategy.md`. Exception: a file from a
   commit whose subject does not start with `storytime:` or
   `measure(storytime_l2_unit1_pictures):`, outside the X1 allowed set, with no Storytime path. The
   checker names each one.
2. The strategy diff since `b72f8b60` removes no line. Every earlier block extracts to its earlier
   SHA-256 (table below).
3. Pin blocks 1, 2, and 3 still pass `sha256sum -c`, and restart check v3 `--final` still exits
   `0` with `restart check: pass`. These two runs are light. They prove that the untracked files
   (`out/`, the handoff folders, `measure/runs/`) did not change.

CARRY_OVER_CHECK (read-only, light):

```sh
B=b72f8b60
echo "files changed since b72f8b60: $(git diff --name-only "$B"..HEAD | paste -sd, -)"
echo "files changed since b72f8b60 other than the strategy: $(git diff --name-only "$B"..HEAD | grep -cvx "$T/test-strategy.md")"
echo "strategy lines removed since b72f8b60: $(git diff "$B"..HEAD -- "$T/test-strategy.md" | grep -c '^-[^-]')"
for v in restart-check.mjs restart-check-v2.mjs restart-check-v3.mjs restart-pins restart-pins-2 restart-pins-3; do
  echo "block $v sha256: $(awk -v b="$v" '$0=="<!-- " b " end -->"{f=0} f; $0=="<!-- " b " begin -->"{f=1}' "$T/test-strategy.md" | sed '1d;$d' | sha256sum | cut -c1-64)"
done
for v in restart-pins restart-pins-2 restart-pins-3; do
  awk -v b="$v" '$0=="<!-- " b " end -->"{f=0} f; $0=="<!-- " b " begin -->"{f=1}' "$T/test-strategy.md" | sed '1d;$d' > "$D/$v.sha256"
  sha256sum -c --quiet "$D/$v.sha256"; echo "$v check exit: $?"
done
awk '/^<!-- restart-check-v3.mjs end -->$/{f=0} f; /^<!-- restart-check-v3.mjs begin -->$/{f=1}' "$T/test-strategy.md" | sed '1d;$d' > "$D/restart-check.mjs"
nice -n 19 node "$D/restart-check.mjs" --final > "$D/restart-check-carry.log"; echo "restart check exit: $?"; tail -1 "$D/restart-check-carry.log"
```

Expected:

| Label | Value |
| --- | --- |
| `files changed since b72f8b60 other than the strategy:` | 0 (or only named foreign files of condition 1) |
| `strategy lines removed since b72f8b60:` | 0 |
| `block restart-check.mjs sha256:` | `c3ecbeb73f75abc77f64bf04c9fd86110f414cd121ac460ce423b3474672f062` |
| `block restart-check-v2.mjs sha256:` | `30f68eafaa216bdd8947efa394aac08b8d11fbd98fed37c0c8988527807541a7` |
| `block restart-check-v3.mjs sha256:` | `6ae82ad4a305341a409be95cd007239ef069cac2e8c4ef6301467908bac78a9e` |
| `block restart-pins sha256:` | `3b9b40775385616b39ad889592cd66ba5c181fdf8d8c299e02cafbd1723aedea` |
| `block restart-pins-2 sha256:` | `fe0370b481a4588e24770522cd60f66fb8457ec4e27113a93abcdae89df3a311` |
| `block restart-pins-3 sha256:` | `335b8e9a1bdc2def8cd14a7770f4db9f7c759d060e48719bf8c99006b50707d5` |
| `restart-pins check exit:`, `restart-pins-2 check exit:`, `restart-pins-3 check exit:` | 0, 0, 0 |
| `restart check exit:` | 0, and the last line `restart check: pass` |

Results that carry over from `b72f8b60` when the conditions hold: the restart check script SHA, X1,
X2, X2b, X3, X4 with its control, X5, X6, X7, X8, X9, X12, TYPECHECK_COMMAND (total 38, owned 0),
and PROJECT_TESTS (`Test Files  7 passed (7)`, `Tests  105 passed (105)`).

Falsification: a file other than the strategy (and the named foreign files) changes, a strategy
line is removed, a block SHA-256 differs, a pin fails, or restart check v3 fails. Then nothing
carries over, and the checker reruns every gate of 5.11.15 at the new HEAD.

**The rest of the acceptance run (checker commands).** Set `T`, `R`, `P5BASE`, and `D` as in
5.11.3. Run in this order:

1. CARRY_OVER_CHECK above.
2. KNOWN_RED_CHECK above (the one heavy command; wait for a held lock).
3. X13: the command and the seed control of 5.11.7, with the file-level rules. At `b72f8b60` the
   expected matches are the 3 w08 approval notes only.
4. X14: the command of 5.11.7. Expected: no output.
5. X15: `node measure/tools/doctor.mjs --structural-only --root .`. Expected: no error line with
   `asset_storytime_l2_unit1_pictures_20261025` or an owned path. Quote the count and every line.
6. G5:
   ```sh
   echo "tech-debt lines: $(wc -l < measure/tech-debt.md)"
   echo "lessons lines: $(wc -l < measure/lessons-learned.md)"
   for id in RB-P4-1 RB12-01 RA-P3ADV-2 RC5-3 PA3-N6 PA4-N2 PA4-N3 PA4-N4; do echo "ledger $id: $(grep -c "$id" "$T/plan.md")"; done
   ```
   Expected: both files have 50 lines or less, and each ledger id count is 1 or more.
7. The plan-quote comparison. Compare each value with the restart check v3 output and your own
   runs: the T4 step 13 and 14 notes (57 rows, 0.57 USD, the nut verdicts, 51 files, the `nut3`
   handoff), the step 15 notes (GREEN `<N>` = 84, the type check total 38 and owned 0), the
   Task 3 note, and the metadata count (29). Name each difference.
8. Write `$R/acceptance-p5-restart-<HEAD7>.json` and `.log` for the new HEAD. In the log, quote
   the carry-over labels, the known-red labels, and the `b72f8b60` results that carried over.
   Write `status: "pass"` only when `blocking_findings` and every `*_violations` array are empty.

**Anti-pattern notes for this addition.**

| Class | Defense | Falsification condition |
| --- | --- | --- |
| A3 | The known-red gate reads labels (`known red failing tests outside the pin set:`, `drift sentinels failing:`, the `Tests` line with its total 142). | A bare failure count satisfies X10. |
| A4 | The 4 drift sentinels must fail while the list differs from the pin. The total must be 142, so a test that did not run shows. | A sentinel passes on a changed list, or the total is not 142. |
| A5 | The earlier 8 were not recorded. This text derives them from the test file and the list bytes of `c618523e`, and names the one test (T176) that changed. | The derived set differs from a rerun of the probe. |
| A7 | The named set comes from the test bodies by a fixed pattern, not from the failures. A failing test outside it fails the gate. | A new failure is called known-red. |
| A10 | The carry-over needs an unchanged audited tree and unchanged untracked evidence. | Results carry over after a code, plan, or evidence change. |
| A11 | The block SHA-256 values in this text equal the extracted blocks. | An extracted block SHA differs from the table. |

### Track final acceptance (2026-11-05)

Revision: written at `325b92a0`. The Phase 5 acceptance passed there
(`measure/runs/asset_storytime_l2_unit1_pictures_20261025/acceptance-p5-restart-325b92a.json`,
mechanical gate exit 0). The text before this section stays as written. Where this section and an
earlier part differ for final acceptance or closeout, this section applies. It makes the sentence of
5.2 concrete: "Final acceptance reads PROJECT_TESTS and the type check".

PM decisions of 2026-11-05 (from the orchestrator brief):

- Final acceptance runs on `coding-plan/ark-code-latest#high` (ByteDance family; it did no work in
  this track). The fallback is a DeepSeek model on the Ark Coding Plan. The fallback runs only if the
  first model fails its start test or its run (F.7).
- "For the 38 tsc errors outside the track: pin them as a known-red baseline by file and count in the
  amendment; any new error fails the gate."
- Closeout runs on `minimax-cn-coding-plan/MiniMax-M3.1-Flash`.

Risk class: **medium**. The three gates only read. The risk sits in the closeout: it moves the track
folder, commits about 1,000 run files, and edits shared registry files while other sessions hold
uncommitted edits (A10, A6). Review applicability:

| Review | Applies | Reason |
| --- | --- | --- |
| Security review | No | No code, no trust boundary. A secret scan covers the run folder (CG2). |
| UX and API review | No | No UI, no API change. |
| Adversarial testing | No | The selftest (31 cases), the restart check control, and the lint falsification rows stand in. |
| Browser review | No (`UX_REQUIRED=never`) | No UI. |
| Different-family rule | Met | Makers: MiniMax, Kimi. Phase 5 checker: GLM. Judge: Anthropic. Final acceptance: ByteDance, then DeepSeek. |

Artifact tests and live behavior: PROJECT_LINT checks artifacts (files, hashes, records, the doctor).
PROJECT_CHECKS and PROJECT_TESTS check code. The live behavior proof of the pictures is the Muse calls
and the Sonnet judge runs of the earlier phases, recorded in the cost rows and the judge results.
Final acceptance makes no Muse call and no judge call.

#### F.1 Facts (checked 2026-11-05 at `325b92a0`; read-only commands and one heavy `tsc` run)

| Fact | Value |
| --- | --- |
| HEAD | `325b92a0d2789e4ab00ff2313129f53dbe626ec7` on `master`. The strategy commit of this section follows it. |
| Plan | 33 task lines: 29 `[x]`, 4 deferred (the Muse path markers), 0 non-deferred incomplete. `measure_interphase_checks.py status` prints `incomplete_phases: 0` and `closeout_candidates: 1`. |
| Plan finding FA-N1 | Two `[x]` lines have the commit SHA on the continuation line: line 30 (`2fdce9d`) and line 32 (`c52e495`). Both are commits. The closeout checker reads the first line only, so it reports "completed plan task lacks commit SHA" for both. The final-acceptance gate does not read this. CG3 fixes it. |
| Linter | None. `package.json` has `test` (`vitest run`), `typecheck` (`tsc --noEmit`), `check`, and `format` (`prettier --write`, a writer). No eslint or biome file exists. |
| Type check | One `heavy-run.sh` run: exit `2`, 38 errors, 0 owned, 88 s. The per-file counts equal the T4 step 15 log. None of the files is under the owned prefixes of 5.11.4. Three baseline files are Storytime asset sources of earlier commits (`assets/storytime-*.ts`, commits `65f74878`, `9ce89f41`); the track did not change them. |
| Doctor | `node measure/tools/doctor.mjs --structural-only --root .` prints the 12 errors of F.4 and exits `1`. None names this track. It takes 1.5 s. |
| Known red | `tests/storytime-book-pictures.test.ts` stays red by the 5.11.16 rule (live list `89b2910c…`, pin `6d05dfc5…`). The rule needs no exact failure count. |
| PROJECT_TESTS | The seven files of 5.11.4 exist. The accepted run at `b72f8b60` gave `Test Files  7 passed (7)` and `Tests  105 passed (105)`. The Phase 5 acceptance at `325b92a0` carried that result. |
| RB-P4-1 | `measure/tech-debt.md` already holds it as `TD-29` (Low, Open) and holds RB12-01 and RB12-03 as `TD-30`. The file has 43 lines (limit 50). Closeout adds no row. It retargets the links (CG6). |
| Archive | `measure/archive/` does not exist yet. `active_registry_contains` reads the text before the heading `## Archived Tracks`. That heading is absent now, so the whole of `measure/tracks.md` counts as the active part. The doctor demands the form `**Track:` plus a `./tracks/<id>/` link for every line that holds `**Track:`. So the archived entry must not hold `**Track:` (CG5). |
| Links into the track | `measure/tracks.md` (1), `measure/status.md` (1), `measure/tech-debt.md` (TD-29, TD-30). `measure/tracks/asset_filled_shelves_20261028/test-strategy.md` also names the path; it belongs to another track and stays. |
| Foreign state | Uncommitted: one hunk in `measure/tracks.md` (7 lines in the Contents part), six other `plan.md` files, and `measure/generated/{architecture.json,asset-inventory.json,status.md}`. `./measure/generate.sh` would write that state into the facts (T5). |
| Run folder | `measure/runs/asset_storytime_l2_unit1_pictures_20261025/`: 12 MB, 67 tracked files, 2 modified, 946 untracked. Closeout commits all of them (CG1). |
| Tmp folder | `/tmp/opencode/` is shared. Other sessions delete old files there. Each gate command makes its own `mktemp -d` folder and uses it at once. |

#### F.2 PROJECT_TESTS

One shell command, run from the repo root. It holds one `heavy-run.sh` wrapper with
`HEAVY_MIN_AVAIL_MB=1500` and `--maxWorkers=1`. It runs the seven files of 5.11.4 and never uses
`pnpm`. `vitest` exits `0` for a skipped test, so the command also reads the two labeled totals. It
exits `0` only when `vitest` exits `0`, `Test Files  7 passed (7)` is present, and
`Tests  105 passed (105)` is present. The value holds no single quote, so it can go inside single
quotes in a shell or in a process environment as it is.

```text
mkdir -p /tmp/opencode && O=$(mktemp /tmp/opencode/final-tests.XXXXXX) && HEAVY_MIN_AVAIL_MB=1500 bash $HOME/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c "node_modules/.bin/vitest run tests/storytime-muse-attempts.test.ts tests/storytime-judge-batch.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-picture-rows.test.ts tests/storytime-stage-check.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-muse-delivery-adversarial.test.ts --maxWorkers=1" > "$O" 2>&1; E=$?; tail -n 25 "$O"; echo "project tests exit: $E"; [ "$E" -eq 0 ] && grep -Eq "^ *Test Files +7 passed [(]7[)] *$" "$O" && grep -Eq "^ *Tests +105 passed [(]105[)] *$" "$O"
```

Expected labels: `project tests exit: 0`, `Test Files  7 passed (7)`, `Tests  105 passed (105)`. The total 105 is
the value of the accepted run. A test file change after `325b92a0` is a code change. Then the carry-over
fails (F.4) and the value is checked again from the new run. A `heavy-preflight` hold gives exit
`75`. The gate then fails. This is not a test failure. The orchestrator runs the gate again. Falsification: a failed test, a skipped test, a changed total, or `Test Files` other than
7. A filter (`-t`) is not in the command.

#### F.3 PROJECT_CHECKS (type check against a pinned baseline, and the known-red rule)

PROJECT_CHECKS holds two heavy runs, one after the other, inside one command. The script
`final-gates.mjs` (F.5) runs them through `heavy-run.sh` with `HEAVY_MIN_AVAIL_MB=1500`. The first run
is `NODE_OPTIONS=--max-old-space-size=6144 node_modules/.bin/tsc --noEmit` (the heap setting of
TYPECHECK_COMMAND). The second run is `node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1`
(the KNOWN_RED_COMMAND of 5.11.4). The command exits `0` only when both parts hold.

```text
mkdir -p /tmp/opencode && D=$(mktemp -d /tmp/opencode/final-checks.XXXXXX) && awk "/^<!-- final-gates.mjs end -->\$/{f=0} f; /^<!-- final-gates.mjs begin -->\$/{f=1}" measure/tracks/asset_storytime_l2_unit1_pictures_20261025/test-strategy.md | sed "1d;\$d" > "$D/final-gates.mjs" && [ "$(sha256sum < "$D/final-gates.mjs" | cut -c1-64)" = "83b22adc2ca57d3b0bbd306a0b3308ef336e62980abc28030c592b8c61ac3aef" ] && node "$D/final-gates.mjs" checks "$D"
```

**Part 1: the tsc baseline.** The script parses each line that starts with a path and holds
`error TS<n>`. It counts the errors for each file. The baseline below is the state at `325b92a0`
(88 s run, exit `2`, 38 errors, 0 owned errors).

| File | Errors | Origin |
| --- | --- | --- |
| `assets/airship.ts` | 7 | earlier asset tracks |
| `assets/longship.ts` | 1 | earlier asset tracks |
| `assets/merchant-cart.ts` | 1 | earlier asset tracks |
| `assets/mushroom-cap.ts` | 3 | earlier asset tracks |
| `assets/plank.ts` | 6 | earlier asset tracks |
| `assets/rowboat.ts` | 8 | earlier asset tracks |
| `assets/storytime-crayon-box.ts` | 1 | earlier Storytime asset commit `65f74878` |
| `assets/storytime-nut.ts` | 3 | earlier Storytime asset commit `9ce89f41` |
| `assets/storytime-picture-book.ts` | 1 | earlier Storytime asset commit `65f74878` |
| `assets/waterskin.ts` | 3 | earlier asset tracks |
| `assets/wool.ts` | 1 | earlier asset tracks |
| `tests/games/castle-defense/rules.adversarial.test.ts` | 2 | game tracks |
| `tests/part.test.ts` | 1 | earlier asset tracks |
| **Total** | **38** | 13 files, 0 under `src/storytime/`, `scripts/storytime-`, `tests/storytime-` |

Part 1 passes when all of these hold:

1. `tsc` exits `0` or `2`. Exit `2` needs at least one parsed error line. Exit `0` needs none.
2. Every line with `error TS` ties to a file (`tsc unparsed error lines: 0`).
3. `owned tsc errors: 0` (the prefixes of 5.11.4).
4. `tsc files outside the baseline: 0`. A new file with an error fails.
5. `tsc files above their baseline: 0`. A count above its row fails.
6. `tsc errors total:` is 38 or less. A lower count passes (a fix by another track). The lines
   `tsc file <path>: <n> (baseline <b>)` show each file.

A `heavy-run.sh` exit of `75`, `124`, or `201` prints a `HOLD` line and the command exits `3`. That is
not a pass. The orchestrator runs the gate again.

**Part 2: the known-red rule.** The script applies the six conditions of 5.11.16 to the second run. It
extracts `pin-set.mjs` from this file (SHA-256 `f67cfa8f…`), runs it, and reads the live list SHA-256.
It passes when all of these hold:

1. The test file has no change since `b72f8b60` and no uncommitted change.
2. The `Tests` line sums to 142, with no skipped and no todo test.
3. The pin-set output lists 142 tests and the 13 named tests
   (`T142,T143,T144,T145,T147,T148,T149,T150,T173,T174,T175,T176,T177`).
4. While the live list SHA-256 differs from `6d05dfc5…`: the exit is `1`, all 4 drift sentinels
   (`T142`, `T147`, `T173`, `T174`) fail, and the number of failed tests equals the number of unique
   failing ids (observed: 7 and 7 at `325b92a0`). If the live list equals the pin, the exit is `0`
   with 0 failures.
5. No failing test is outside the named set. A `FAIL` line without a test id fails the part.

Expected labels at the live list `89b2910c…`: `known red exit: 1`, `tests in the file: 142`,
`known red failing tests: 7 T142,T145,T147,T150,T173,T174,T177` (another subset of the named set also
passes), `known red failing tests outside the pin set: 0`, `known red drift sentinels failing: 4 of 4`,
`known red skipped or todo: 0`, and the last line `final checks: pass`.

This part replaces the exact "8 failures" of 5.11.4. The test file stays out of PROJECT_TESTS because
it must stay red while Workbooks holds a newer list. The count follows the list. Workbooks owns the
list.

Falsification (each one fails the command): a new tsc error in any file, an owned error, a count above
a baseline row, a failing test outside the named set, a drift sentinel that passes on a changed list, a
`Tests` total other than 142, a changed test file, or a script SHA-256 that differs. The script runs its
own selftest first (F.5), so a parser that always passes is caught.

#### F.4 PROJECT_LINT (a stand-in: no linter exists)

The repo has no linter, and `prettier --write` changes files. So PROJECT_LINT is a read-only
consistency lint of the artifacts that the track leaves. It stands in for a lint for three reasons.
First, it finds the same class of fault: a stale or inconsistent static artifact (a Measure document,
a pinned hash, a script block) that no test reads. Second, it fails on a seeded fault (the selftest and
the restart check control). Third, it proves that the audited tree equals the tree that the Phase 5
acceptance measured (the carry-over rule). It runs in about 25 s and takes no heavy lock.

```text
mkdir -p /tmp/opencode && D=$(mktemp -d /tmp/opencode/final-lint.XXXXXX) && awk "/^<!-- final-gates.mjs end -->\$/{f=0} f; /^<!-- final-gates.mjs begin -->\$/{f=1}" measure/tracks/asset_storytime_l2_unit1_pictures_20261025/test-strategy.md | sed "1d;\$d" > "$D/final-gates.mjs" && [ "$(sha256sum < "$D/final-gates.mjs" | cut -c1-64)" = "83b22adc2ca57d3b0bbd306a0b3308ef336e62980abc28030c592b8c61ac3aef" ] && nice -n 19 node "$D/final-gates.mjs" lint "$D"
```

The lint checks, in this order:

| Check | Pass condition | Falsification condition |
| --- | --- | --- |
| L0 selftest | `selftest cases: 31 failed expectations: 0` | A seeded bad input passes a parser (A4). |
| L1 carry-over (5.11.16 conditions 1 and 2) | `325b92a0` is an ancestor of HEAD. `merge commits since the base: 0`. `own-commit files other than the strategy: 0`. `foreign Storytime paths: 0`. `strategy lines removed since the base: 0`. `strategy uncommitted change: no`. An own commit has a subject that starts with `storytime:` or `measure(storytime_l2_unit1_pictures):`. The script names each foreign commit. A foreign commit may touch `measure/tracks.md`, `measure/generated/`, and other tracks. | An own commit changes a file other than this file, a foreign commit touches a Storytime path, a merge commit exists, a strategy line is removed, or this file has an uncommitted change. Then nothing carries over. |
| L2 block SHA-256 values | The seven blocks (`restart-check.mjs`, `restart-check-v2.mjs`, `restart-check-v3.mjs`, `restart-pins`, `restart-pins-2`, `restart-pins-3`, `pin-set.mjs`) extract to the values of 5.11.16. | A block differs from its value (A11). |
| L3 pin blocks | `restart-pins lines: 28`, `restart-pins-2 lines: 7`, `restart-pins-3 lines: 12`, and each `check exit: 0`. | A pinned judge result, handoff `MANIFEST.txt`, or run file changed, or a block is empty (A4). |
| L4 restart check v3 | `restart check exit: 0`, last line `restart check: pass`; `restart control exit: 1` with the three FAIL texts of 5.11.15. | The check fails, or the control exits `0` (A4). |
| L5 doctor | `doctor errors that name this track or an owned path: 0` and `doctor errors outside the known list of 12: 0`. | A doctor error names this track, an owned path, or a new text. |

The 12 known doctor errors are errors of other tracks. They are fixed by other sessions. The lint
accepts a lower count, and it rejects a new text:

```text
error: measure/tracks/asset_filled_shelves_20261028/plan.md: new track has started tasks
error: measure/tracks/asset_p2_npcs_20260928/plan.md: new track has started tasks
error: measure/tracks/game_archers_revenge_rebuild_20261029/plan.md: new track has started tasks
error: measure/tracks/game_castle_defense_rebuild_20261029/plan.md: new track has started tasks
error: measure/tracks/game_magic_defense_rebuild_20261029/plan.md: new track has started tasks
error: measure/tracks/game_paladins_twin_soul_rebuild_20261029/plan.md: new track has started tasks
error: measure/tracks.md: missing registry link for asset_filled_shelves_20261028
error: measure/tracks.md: missing registry link for game_archers_revenge_rebuild_20261029
error: measure/tracks.md: missing registry link for game_castle_defense_rebuild_20261029
error: measure/tracks.md: missing registry link for game_magic_defense_rebuild_20261029
error: measure/tracks.md: missing registry link for game_paladins_twin_soul_rebuild_20261029
error: measure/generated/status.md: stale generated fact
```

An "owned path" is `measure/tracks/asset_storytime_l2_unit1_pictures_20261025`, `src/storytime`,
`scripts/storytime-`, `tests/storytime-`, `docs/storytime/l2-unit1`, or `out/storytime`. The lint
does not claim that `doctor` exits `0`. It reports the doctor exit code as a label.

#### F.5 The script `final-gates.mjs` (one block, pinned)

The script is read-only. `lint` and `checks` write only inside the `mktemp` folder that the command
passes. The script also has the modes `selftest`, `eval-tsc <log> <exit>`, and
`eval-known-red <log> <exit> <live-sha> <pin-set-output>`. A checker can use them to evaluate a saved
log. The extraction method is the method of 5.11.5. The commands of F.3 and F.4 do it, and a person can
do it by hand:

```sh
T=measure/tracks/asset_storytime_l2_unit1_pictures_20261025
mkdir -p /tmp/opencode && D=$(mktemp -d /tmp/opencode/final-gates.XXXXXX)
awk '/^<!-- final-gates.mjs end -->$/{f=0} f; /^<!-- final-gates.mjs begin -->$/{f=1}' "$T/test-strategy.md" | sed '1d;$d' > "$D/final-gates.mjs"
echo "final gates script sha256: $(sha256sum < "$D/final-gates.mjs" | cut -c1-64)"
node "$D/final-gates.mjs" selftest
```

Expected script SHA-256: `83b22adc2ca57d3b0bbd306a0b3308ef336e62980abc28030c592b8c61ac3aef`. Expected selftest output: `selftest cases: 31 failed expectations: 0`.
The `PROJECT_LINT` and `PROJECT_CHECKS` strings check this SHA-256 before they run the script. A change
of one byte of the block changes the SHA-256, so a later edit of the block needs a new strategy role.

<!-- final-gates.mjs begin -->
```js
// final-gates.mjs: the read-only final-acceptance gates of test-strategy.md, "Track final acceptance".
// Run from the repo root: node <this file> lint|checks <workdir> | selftest | eval-tsc <log> <exit>
//   | eval-known-red <log> <exit> <live-list-sha256> <pin-set-output>.
// lint and checks write only inside <workdir>, a folder under /tmp/opencode/. They change no repo file.
// Output: labeled lines. Exit 0: every gate holds. Exit 1: a FAIL line names the gate. Exit 3: a HOLD line
// (heavy-run hold or time limit) means the run is inconclusive. Exit 2: a usage error.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const TRACK = 'asset_storytime_l2_unit1_pictures_20261025';
const STRATEGY = `measure/tracks/${TRACK}/test-strategy.md`;
const CARRY_BASE = '325b92a0d2789e4ab00ff2313129f53dbe626ec7';
const KR_BASE = 'b72f8b60';
const KR_FILE = 'tests/storytime-book-pictures.test.ts';
const LIST_PIN = '6d05dfc596c7f1891577a800a9375228136acc332c7c8b975c9df0bf6c062a58';
const LIST_FILE = '/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json';
const HEAVY = `${process.env.HOME}/Desktop/advantage-pr/scripts/jobs/heavy-run.sh`;
const OWNED_RE = /^(src\/storytime\/|scripts\/storytime-|tests\/storytime-)/;
const TSC_BASELINE = {
  'assets/airship.ts': 7,
  'assets/longship.ts': 1,
  'assets/merchant-cart.ts': 1,
  'assets/mushroom-cap.ts': 3,
  'assets/plank.ts': 6,
  'assets/rowboat.ts': 8,
  'assets/storytime-crayon-box.ts': 1,
  'assets/storytime-nut.ts': 3,
  'assets/storytime-picture-book.ts': 1,
  'assets/waterskin.ts': 3,
  'assets/wool.ts': 1,
  'tests/games/castle-defense/rules.adversarial.test.ts': 2,
  'tests/part.test.ts': 1,
};
const NAMED_SET = ['T142', 'T143', 'T144', 'T145', 'T147', 'T148', 'T149', 'T150', 'T173', 'T174', 'T175', 'T176', 'T177'];
const SENTINELS = ['T142', 'T147', 'T173', 'T174'];
const DOCTOR_KNOWN = [
  'error: measure/tracks/asset_filled_shelves_20261028/plan.md: new track has started tasks',
  'error: measure/tracks/asset_p2_npcs_20260928/plan.md: new track has started tasks',
  'error: measure/tracks/game_archers_revenge_rebuild_20261029/plan.md: new track has started tasks',
  'error: measure/tracks/game_castle_defense_rebuild_20261029/plan.md: new track has started tasks',
  'error: measure/tracks/game_magic_defense_rebuild_20261029/plan.md: new track has started tasks',
  'error: measure/tracks/game_paladins_twin_soul_rebuild_20261029/plan.md: new track has started tasks',
  'error: measure/tracks.md: missing registry link for asset_filled_shelves_20261028',
  'error: measure/tracks.md: missing registry link for game_archers_revenge_rebuild_20261029',
  'error: measure/tracks.md: missing registry link for game_castle_defense_rebuild_20261029',
  'error: measure/tracks.md: missing registry link for game_magic_defense_rebuild_20261029',
  'error: measure/tracks.md: missing registry link for game_paladins_twin_soul_rebuild_20261029',
  'error: measure/generated/status.md: stale generated fact',
];
const OWNED_DOC_RE = new RegExp(`${TRACK}|src/storytime|scripts/storytime-|tests/storytime-|docs/storytime/l2-unit1|out/storytime`);
const BLOCK_SHA = {
  'restart-check.mjs': 'c3ecbeb73f75abc77f64bf04c9fd86110f414cd121ac460ce423b3474672f062',
  'restart-check-v2.mjs': '30f68eafaa216bdd8947efa394aac08b8d11fbd98fed37c0c8988527807541a7',
  'restart-check-v3.mjs': '6ae82ad4a305341a409be95cd007239ef069cac2e8c4ef6301467908bac78a9e',
  'restart-pins': '3b9b40775385616b39ad889592cd66ba5c181fdf8d8c299e02cafbd1723aedea',
  'restart-pins-2': 'fe0370b481a4588e24770522cd60f66fb8457ec4e27113a93abcdae89df3a311',
  'restart-pins-3': '335b8e9a1bdc2def8cd14a7770f4db9f7c759d060e48719bf8c99006b50707d5',
  'pin-set.mjs': 'f67cfa8f17d380cb7e6f7632612b8f56d5cba6793d642a90abf2b5c1fd4a3fe0',
};
const PIN_LINES = { 'restart-pins': 28, 'restart-pins-2': 7, 'restart-pins-3': 12 };

const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const clean = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');
const git = (...args) => spawnSync('git', args, { encoding: 'utf8', maxBuffer: 1 << 27 });
const idNum = (a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')) || a.localeCompare(b);
const HOLD_EXITS = [75, 124, 201];

// ---------- tsc ----------
export function parseTsc(text) {
  const errors = [];
  let unparsed = 0;
  for (const raw of clean(text).split('\n')) {
    if (!/error TS\d+/.test(raw)) continue;
    const m = raw.match(/^(\S.*?)\((\d+),(\d+)\): error (TS\d+):/);
    if (m) errors.push({ file: m[1], code: m[4] });
    else unparsed += 1;
  }
  return { errors, unparsed };
}

export function evalTsc(exitCode, text, baseline = TSC_BASELINE) {
  const lines = [];
  const problems = [];
  const { errors, unparsed } = parseTsc(text);
  const perFile = new Map();
  for (const e of errors) perFile.set(e.file, (perFile.get(e.file) ?? 0) + 1);
  const baseTotal = Object.values(baseline).reduce((a, b) => a + b, 0);
  const owned = errors.filter((e) => OWNED_RE.test(e.file)).length;
  const outside = [...perFile.keys()].filter((f) => !(f in baseline));
  const above = [...perFile].filter(([f, n]) => f in baseline && n > baseline[f]);
  const hold = HOLD_EXITS.includes(exitCode);
  lines.push(`tsc exit: ${exitCode}`, `tsc errors total: ${errors.length}`, `tsc baseline total: ${baseTotal}`);
  lines.push(`owned tsc errors: ${owned}`, `tsc unparsed error lines: ${unparsed}`);
  lines.push(`tsc files outside the baseline: ${outside.length}${outside.length ? ` (${outside.join(', ')})` : ''}`);
  lines.push(`tsc files above their baseline: ${above.length}${above.length ? ` (${above.map(([f, n]) => `${f} ${n}>${baseline[f]}`).join(', ')})` : ''}`);
  for (const f of [...new Set([...Object.keys(baseline), ...perFile.keys()])].sort()) lines.push(`tsc file ${f}: ${perFile.get(f) ?? 0} (baseline ${baseline[f] ?? 0})`);
  if (hold) return { lines, problems, hold: `tsc exit ${exitCode} is a heavy-run hold or time limit` };
  if (exitCode !== 0 && exitCode !== 2) problems.push(`tsc exit ${exitCode} is neither 0 nor 2`);
  if (exitCode === 2 && errors.length === 0) problems.push('tsc exit 2 with no parsed error line');
  if (exitCode === 0 && errors.length > 0) problems.push('tsc exit 0 with error lines');
  if (unparsed > 0) problems.push(`${unparsed} error line(s) cannot be tied to a file`);
  if (owned > 0) problems.push(`${owned} owned tsc error(s)`);
  if (outside.length > 0) problems.push(`tsc error(s) in a file outside the baseline: ${outside.join(', ')}`);
  if (above.length > 0) problems.push(`tsc error count above the baseline: ${above.map(([f, n]) => `${f} ${n}>${baseline[f]}`).join(', ')}`);
  if (errors.length > baseTotal) problems.push(`tsc total ${errors.length} is above ${baseTotal}`);
  return { lines, problems, hold: null };
}

// ---------- the known-red rule (5.11.16) ----------
export function parseVitest(text) {
  const rows = clean(text).split('\n');
  const counts = { failed: 0, passed: 0, skipped: 0, todo: 0, total: null };
  const tl = rows.filter((l) => /^\s*Tests\s+\d/.test(l)).pop();
  if (tl) {
    for (const m of tl.matchAll(/(\d+) (failed|passed|skipped|todo)/g)) counts[m[2]] = Number(m[1]);
    const tot = tl.match(/\((\d+)\)\s*$/);
    counts.total = tot ? Number(tot[1]) : null;
  }
  const failing = new Set();
  let unparsed = 0;
  for (const l of rows) {
    const m = l.match(/^\s*FAIL\s+tests\/storytime-book-pictures\.test\.ts(.*)$/);
    if (!m) continue;
    const id = m[1].match(/> (T\d+[a-z]?):/);
    if (id) failing.add(id[1]);
    else unparsed += 1;
  }
  return { hasTestsLine: Boolean(tl), counts, failing: [...failing].sort(idNum), unparsed };
}

export function evalKnownRed({ exitCode, text, pinSetText, liveSha, changedFiles, dirty }) {
  const lines = [];
  const problems = [];
  if (HOLD_EXITS.includes(exitCode)) return { lines: [`known red exit: ${exitCode}`], problems, hold: `known red exit ${exitCode} is a heavy-run hold or time limit` };
  const v = parseVitest(text);
  const inFile = Number((pinSetText.match(/^tests in the file: (\d+)/m) ?? [])[1]);
  const pm = pinSetText.match(/^pin-dependent tests: (\d+) (\S*)/m);
  const pinSet = pm ? pm[2].split(',').filter(Boolean).sort(idNum) : [];
  const differs = liveSha !== LIST_PIN;
  const outside = v.failing.filter((id) => !pinSet.includes(id));
  const sentinelsFailing = SENTINELS.filter((id) => v.failing.includes(id));
  lines.push(`known red exit: ${exitCode}`);
  lines.push(`known red Tests line: ${v.hasTestsLine ? `${v.counts.failed} failed, ${v.counts.passed} passed, ${v.counts.skipped} skipped, ${v.counts.todo} todo, total ${v.counts.total}` : 'absent'}`);
  lines.push(`tests in the file: ${inFile}`, `pin-dependent tests: ${pinSet.length} ${pinSet.join(',')}`);
  lines.push(`test file changed since ${KR_BASE}: ${changedFiles}`, `test file uncommitted change: ${dirty ? 'yes' : 'no'}`);
  lines.push(`live list differs from the pin: ${differs ? 'yes' : 'no'}`);
  lines.push(`known red failing tests: ${v.failing.length} ${v.failing.join(',')}`);
  lines.push(`known red unparsed FAIL lines: ${v.unparsed}`);
  lines.push(`known red failing tests outside the pin set: ${outside.length}`);
  lines.push(`known red drift sentinels failing: ${sentinelsFailing.length} of ${SENTINELS.length}`);
  lines.push(`known red skipped or todo: ${v.counts.skipped + v.counts.todo}`);
  if (!v.hasTestsLine) problems.push('no Tests line in the vitest output');
  if (v.counts.total !== 142 || v.counts.failed + v.counts.passed !== 142) problems.push(`Tests total is not 142 (failed ${v.counts.failed}, passed ${v.counts.passed}, total ${v.counts.total})`);
  if (inFile !== 142) problems.push(`pin-set script counts ${inFile} tests, not 142`);
  if (pinSet.join(',') !== NAMED_SET.join(',')) problems.push(`pin set differs from the named set: ${pinSet.join(',')}`);
  if (changedFiles !== 0 || dirty) problems.push('the test file changed');
  if (v.counts.skipped + v.counts.todo > 0) problems.push('a skipped or todo test exists');
  if (v.unparsed > 0) problems.push('a FAIL line has no test id');
  if (v.failing.length !== v.counts.failed) problems.push(`failing ids ${v.failing.length} differ from the failed count ${v.counts.failed}`);
  if (outside.length > 0) problems.push(`new failure outside the named set: ${outside.join(', ')}`);
  if (differs) {
    if (exitCode !== 1) problems.push(`exit ${exitCode}, expected 1 while the live list differs from the pin`);
    if (sentinelsFailing.length !== SENTINELS.length) problems.push('a drift sentinel passes while the list differs (the pin check did not run)');
  } else {
    if (exitCode !== 0 || v.counts.failed !== 0) problems.push('the live list equals the pin, so the file must pass with 0 failures');
  }
  return { lines, problems, hold: null };
}

// ---------- doctor ----------
export function evalDoctor(exitCode, text) {
  const errs = clean(text).split('\n').filter((l) => /^error: /.test(l));
  const named = errs.filter((l) => OWNED_DOC_RE.test(l));
  const unknown = errs.filter((l) => !DOCTOR_KNOWN.includes(l));
  const absent = DOCTOR_KNOWN.filter((l) => !errs.includes(l));
  const lines = [`doctor exit: ${exitCode}`, `doctor errors: ${errs.length}`, `doctor errors that name this track or an owned path: ${named.length}`, `doctor errors outside the known list of ${DOCTOR_KNOWN.length}: ${unknown.length}`, `doctor known errors now absent: ${absent.length}`];
  const problems = [];
  if (named.length) problems.push(`doctor error names this track or an owned path: ${named.join(' | ')}`);
  if (unknown.length) problems.push(`doctor error outside the known list: ${unknown.join(' | ')}`);
  if (exitCode !== 0 && exitCode !== 1) problems.push(`doctor exit ${exitCode}`);
  if (exitCode === 1 && errs.length === 0) problems.push('doctor exit 1 with no error line');
  if (exitCode === 0 && errs.length > 0) problems.push('doctor exit 0 with error lines');
  return { lines, problems, hold: null };
}

// ---------- selftest (a gate that cannot fail is a vacuous pass, A4) ----------
export function selftest() {
  let cases = 0;
  const bad = [];
  const expect = (name, got, want) => {
    cases += 1;
    if (got !== want) bad.push(`${name}: got ${got}, wanted ${want}`);
  };
  const ok = (r) => (r.hold ? 'hold' : r.problems.length === 0 ? 'pass' : 'fail');
  const synth = (extra = [], dropFrom = null) => {
    const out = [];
    for (const [f, n] of Object.entries(TSC_BASELINE)) for (let i = 0; i < n; i += 1) if (f !== dropFrom || i < n - 1) out.push(`${f}(${i + 1},1): error TS2345: seeded`, "  Type 'undefined' is not assignable to type 'number'.");
    return out.concat(extra).join('\n');
  };
  expect('tsc baseline', ok(evalTsc(2, synth())), 'pass');
  expect('tsc new file', ok(evalTsc(2, synth(['assets/new-thing.ts(1,1): error TS2322: x']))), 'fail');
  expect('tsc file above baseline', ok(evalTsc(2, synth(['assets/rowboat.ts(99,1): error TS2322: x']))), 'fail');
  expect('tsc owned error', ok(evalTsc(2, synth(['src/storytime/book-pictures.ts(1,1): error TS2322: x']))), 'fail');
  expect('tsc owned test error', ok(evalTsc(2, synth(['tests/storytime-muse-attempts.test.ts(1,1): error TS7016: x']))), 'fail');
  expect('tsc exit 2 with no error', ok(evalTsc(2, '')), 'fail');
  expect('tsc exit 1', ok(evalTsc(1, synth())), 'fail');
  expect('tsc exit 75', ok(evalTsc(75, '')), 'hold');
  expect('tsc one fewer error', ok(evalTsc(2, synth([], 'assets/plank.ts'))), 'pass');
  expect('tsc unparsed error', ok(evalTsc(2, synth(['error TS5083: Cannot read file']))), 'fail');
  expect('tsc exit 0 clean', ok(evalTsc(0, '')), 'pass');
  const ids = ['T142', 'T145', 'T147', 'T150', 'T173', 'T174', 'T177'];
  const vt = (failIds, tests = '7 failed | 135 passed (142)') => `${failIds.map((i) => ` FAIL  ${KR_FILE} > Storytime > ${i}: a name\n FAIL  ${KR_FILE} > Storytime > ${i}: a name`).join('\n')}\n Test Files  1 failed (1)\n      Tests  ${tests}\n`;
  const pinText = `tests in the file: 142\npin-dependent tests: 13 ${NAMED_SET.join(',')}\n`;
  const kr = (o = {}) => ok(evalKnownRed({ exitCode: 1, text: vt(ids), pinSetText: pinText, liveSha: 'f'.repeat(64), changedFiles: 0, dirty: false, ...o }));
  expect('known red baseline', kr(), 'pass');
  expect('known red subset of the set', kr({ text: vt(['T142', 'T147', 'T173', 'T174'], '4 failed | 138 passed (142)') }), 'pass');
  expect('known red new failure', kr({ text: vt([...ids, 'T999'], '8 failed | 134 passed (142)') }), 'fail');
  expect('known red sentinel passes', kr({ text: vt(ids.filter((i) => i !== 'T142'), '6 failed | 136 passed (142)') }), 'fail');
  expect('known red total 141', kr({ text: vt(ids, '7 failed | 134 passed (141)') }), 'fail');
  expect('known red skipped', kr({ text: vt(ids, '7 failed | 1 skipped | 134 passed (142)') }), 'fail');
  expect('known red failed count above ids', kr({ text: vt(ids, '8 failed | 134 passed (142)') }), 'fail');
  expect('known red exit 0 on a drifted list', kr({ exitCode: 0, text: vt([], '142 passed (142)') }), 'fail');
  expect('known red list equals the pin and 7 fail', kr({ liveSha: LIST_PIN }), 'fail');
  expect('known red list equals the pin and passes', kr({ exitCode: 0, liveSha: LIST_PIN, text: vt([], '142 passed (142)') }), 'pass');
  expect('known red no Tests line', kr({ text: '' }), 'fail');
  expect('known red file changed', kr({ changedFiles: 1 }), 'fail');
  expect('known red pin set drift', kr({ pinSetText: `tests in the file: 142\npin-dependent tests: 12 ${NAMED_SET.slice(1).join(',')}\n` }), 'fail');
  expect('known red hold', kr({ exitCode: 75, text: '' }), 'hold');
  const dtext = (extra = []) => DOCTOR_KNOWN.concat(extra).join('\n');
  expect('doctor known 12', ok(evalDoctor(1, dtext())), 'pass');
  expect('doctor names the track', ok(evalDoctor(1, dtext([`error: measure/tracks/${TRACK}/plan.md: bad`]))), 'fail');
  expect('doctor names an owned path', ok(evalDoctor(1, dtext(['error: scripts/storytime-muse.mjs: bad']))), 'fail');
  expect('doctor new foreign error', ok(evalDoctor(1, dtext(['error: measure/tracks/other_20261101/plan.md: bad']))), 'fail');
  expect('doctor clean', ok(evalDoctor(0, '')), 'pass');
  expect('doctor exit 1 with no error', ok(evalDoctor(1, '')), 'fail');
  return { cases, bad };
}

// ---------- helpers for lint and checks ----------
function extractBlock(name) {
  const rows = fs.readFileSync(STRATEGY, 'utf8').split('\n');
  const b = rows.indexOf(`<!-- ${name} begin -->`);
  const e = rows.indexOf(`<!-- ${name} end -->`);
  if (b < 0 || e < b) return null;
  return rows.slice(b + 2, e - 1).join('\n') + '\n';
}

function runHeavy(cmd, log) {
  const r = spawnSync('bash', ['-c', 'bash "$1" -c "$2" > "$3" 2>&1', 'x', HEAVY, cmd, log], { env: { ...process.env, HEAVY_MIN_AVAIL_MB: '1500' }, encoding: 'utf8' });
  return r.status ?? 1;
}

function reportResult(label, r, sink) {
  for (const l of r.lines) console.log(l);
  for (const p of r.problems) {
    console.log(`FAIL ${label}: ${p}`);
    sink.fails += 1;
  }
  if (r.hold) {
    console.log(`HOLD ${label}: ${r.hold}`);
    sink.holds += 1;
  }
}

function usage(msg) {
  console.log(`usage: ${msg}`);
  process.exit(2);
}

function checkWorkdir(wd) {
  if (!wd || !wd.startsWith('/tmp/opencode/') || !fs.existsSync(wd) || !fs.statSync(wd).isDirectory()) usage('give an existing <workdir> under /tmp/opencode/');
  if (!fs.existsSync(STRATEGY) || !fs.existsSync('package.json')) usage('run from the repo root');
}

function finish(label, sink) {
  console.log(`${label}: ${sink.fails === 0 && sink.holds === 0 ? 'pass' : sink.fails > 0 ? 'fail' : 'inconclusive'}`);
  process.exit(sink.fails > 0 ? 1 : sink.holds > 0 ? 3 : 0);
}

function runSelftest(sink) {
  const s = selftest();
  console.log(`selftest cases: ${s.cases} failed expectations: ${s.bad.length}`);
  for (const b of s.bad) {
    console.log(`FAIL selftest: ${b}`);
    sink.fails += 1;
  }
}

// ---------- lint ----------
function lint(wd) {
  const sink = { fails: 0, holds: 0 };
  console.log(`final gates script sha256: ${sha(fs.readFileSync(process.argv[1]))}`);
  console.log(`HEAD: ${git('rev-parse', 'HEAD').stdout.trim()}`);
  runSelftest(sink);
  // L1 carry-over conditions 1 and 2 (5.11.16)
  const anc = git('merge-base', '--is-ancestor', CARRY_BASE, 'HEAD').status;
  console.log(`carry-over base is an ancestor of HEAD: ${anc === 0 ? 'yes' : 'no'}`);
  if (anc !== 0) {
    console.log('FAIL carry-over: the base is not an ancestor of HEAD');
    sink.fails += 1;
  } else {
    const commits = git('rev-list', '--no-merges', `${CARRY_BASE}..HEAD`).stdout.split('\n').filter(Boolean);
    const merges = git('rev-list', '--merges', `${CARRY_BASE}..HEAD`).stdout.split('\n').filter(Boolean).length;
    let own = 0;
    let ownOther = 0;
    let foreign = 0;
    let foreignStory = 0;
    for (const c of commits) {
      const subject = git('log', '-1', '--format=%s', c).stdout.trim();
      const files = git('diff-tree', '--no-commit-id', '--name-only', '-r', c).stdout.split('\n').filter(Boolean);
      if (subject.startsWith('storytime:') || subject.startsWith(`measure(storytime_l2_unit1_pictures):`)) {
        own += 1;
        for (const f of files.filter((x) => x !== STRATEGY)) {
          ownOther += 1;
          console.log(`FAIL carry-over: own commit ${c.slice(0, 8)} changes ${f}`);
        }
      } else {
        foreign += 1;
        console.log(`foreign commit ${c.slice(0, 8)}: ${subject.slice(0, 80)}`);
        for (const f of files.filter((x) => /storytime|asset_storytime_l2_unit1/.test(x))) {
          foreignStory += 1;
          console.log(`FAIL carry-over: foreign commit ${c.slice(0, 8)} touches ${f}`);
        }
      }
    }
    const removed = git('diff', `${CARRY_BASE}..HEAD`, '--', STRATEGY).stdout.split('\n').filter((l) => /^-[^-]/.test(l)).length;
    const dirty = git('status', '--porcelain', '--', STRATEGY).stdout.trim() !== '';
    console.log(`merge commits since the base: ${merges}`);
    console.log(`own commits since the base: ${own}`);
    console.log(`own-commit files other than the strategy: ${ownOther}`);
    console.log(`foreign commits since the base: ${foreign}`);
    console.log(`foreign Storytime paths: ${foreignStory}`);
    console.log(`strategy lines removed since the base: ${removed}`);
    console.log(`strategy uncommitted change: ${dirty ? 'yes' : 'no'}`);
    if (ownOther + foreignStory > 0) sink.fails += 1;
    for (const [bad, msg] of [[merges > 0, 'a merge commit is in the range'], [removed > 0, 'the strategy lost a line'], [dirty, 'the strategy has an uncommitted change']]) {
      if (bad) {
        console.log(`FAIL carry-over: ${msg}`);
        sink.fails += 1;
      }
    }
  }
  // L2 block SHA-256 values (the carry-over table of 5.11.16)
  for (const [name, want] of Object.entries(BLOCK_SHA)) {
    const b = extractBlock(name);
    const got = b === null ? 'absent' : sha(b);
    console.log(`block ${name} sha256: ${got}`);
    if (got !== want) {
      console.log(`FAIL block ${name}: expected ${want}`);
      sink.fails += 1;
    }
  }
  // L3 pin blocks
  for (const [name, want] of Object.entries(PIN_LINES)) {
    const b = extractBlock(name);
    if (b === null) continue;
    const file = `${wd}/${name}.sha256`;
    fs.writeFileSync(file, b);
    const n = b.split('\n').filter(Boolean).length;
    const r = spawnSync('sha256sum', ['-c', '--quiet', file], { encoding: 'utf8' });
    console.log(`${name} lines: ${n}`);
    console.log(`${name} check exit: ${r.status}`);
    if (n !== want || r.status !== 0) {
      console.log(`FAIL ${name}: lines ${n} (want ${want}), check exit ${r.status} ${(r.stdout + r.stderr).split('\n')[0]}`);
      sink.fails += 1;
    }
  }
  // L4 restart check v3, its control (A4), then the doctor
  const rc = extractBlock('restart-check-v3.mjs');
  if (rc !== null) {
    const file = `${wd}/restart-check.mjs`;
    fs.writeFileSync(file, rc);
    const run = (args) => spawnSync('nice', ['-n', '19', 'node', file, ...args], { encoding: 'utf8', maxBuffer: 1 << 26 });
    const a = run(['--final']);
    const lastLine = a.stdout.trim().split('\n').pop();
    console.log(`restart check exit: ${a.status}`);
    console.log(`restart check last line: ${lastLine}`);
    if (a.status !== 0 || lastLine !== 'restart check: pass') {
      console.log('FAIL restart check v3 --final');
      sink.fails += 1;
    }
    const c = run(['--final', '--control']);
    const want = ['pre-restart manifest changed: w01/delivery-muse-v1', 'above the cap 0.51', 'header or status'];
    const missing = want.filter((w) => !c.stdout.split('\n').some((l) => l.startsWith('FAIL') && l.includes(w)));
    console.log(`restart control exit: ${c.status}`);
    console.log(`restart control missing FAIL texts: ${missing.length}`);
    if (c.status !== 1 || missing.length > 0) {
      console.log(`FAIL restart check control: ${missing.join(' | ')}`);
      sink.fails += 1;
    }
  }
  const d = spawnSync('node', ['measure/tools/doctor.mjs', '--structural-only', '--root', '.'], { encoding: 'utf8', maxBuffer: 1 << 26 });
  reportResult('doctor', evalDoctor(d.status ?? 99, d.stdout + d.stderr), sink);
  finish('final lint', sink);
}

// ---------- checks ----------
function checks(wd) {
  const sink = { fails: 0, holds: 0 };
  console.log(`final gates script sha256: ${sha(fs.readFileSync(process.argv[1]))}`);
  console.log(`HEAD: ${git('rev-parse', 'HEAD').stdout.trim()}`);
  runSelftest(sink);
  // C1 the type check against the pinned baseline
  const tscLog = `${wd}/tsc.log`;
  const tscExit = runHeavy('NODE_OPTIONS=--max-old-space-size=6144 node_modules/.bin/tsc --noEmit', tscLog);
  reportResult('tsc', evalTsc(tscExit, fs.readFileSync(tscLog, 'utf8')), sink);
  // C2 the known-red rule of 5.11.16
  const ps = extractBlock('pin-set.mjs');
  const psSha = ps === null ? 'absent' : sha(ps);
  console.log(`pin set script sha256: ${psSha}`);
  if (psSha !== BLOCK_SHA['pin-set.mjs']) {
    console.log('FAIL pin-set.mjs block differs');
    sink.fails += 1;
  } else {
    fs.writeFileSync(`${wd}/pin-set.mjs`, ps);
    const p = spawnSync('node', [`${wd}/pin-set.mjs`, KR_FILE], { encoding: 'utf8' });
    const liveSha = fs.existsSync(LIST_FILE) ? sha(fs.readFileSync(LIST_FILE)) : 'absent';
    console.log(`live list sha256: ${liveSha}`);
    const krLog = `${wd}/known-red.log`;
    const krExit = runHeavy(`node_modules/.bin/vitest run ${KR_FILE} --maxWorkers=1`, krLog);
    const changed = git('diff', '--name-only', `${KR_BASE}..HEAD`, '--', KR_FILE).stdout.split('\n').filter(Boolean).length;
    const dirty = git('status', '--porcelain', '--', KR_FILE).stdout.trim() !== '';
    reportResult('known red', evalKnownRed({ exitCode: krExit, text: fs.readFileSync(krLog, 'utf8'), pinSetText: p.stdout, liveSha, changedFiles: changed, dirty }), sink);
  }
  finish('final checks', sink);
}

function main() {
  const [mode, a, b, c, d] = process.argv.slice(2);
  if (mode === 'lint') {
    checkWorkdir(a);
    lint(a);
  } else if (mode === 'checks') {
    checkWorkdir(a);
    checks(a);
  } else if (mode === 'selftest') {
    const sink = { fails: 0, holds: 0 };
    runSelftest(sink);
    finish('selftest', sink);
  } else if (mode === 'eval-tsc' && a && b) {
    const sink = { fails: 0, holds: 0 };
    reportResult('tsc', evalTsc(Number(b), fs.readFileSync(a, 'utf8')), sink);
    finish('eval tsc', sink);
  } else if (mode === 'eval-known-red' && a && b && c && d) {
    const sink = { fails: 0, holds: 0 };
    reportResult('known red', evalKnownRed({ exitCode: Number(b), text: fs.readFileSync(a, 'utf8'), pinSetText: fs.readFileSync(d, 'utf8'), liveSha: c, changedFiles: git('diff', '--name-only', `${KR_BASE}..HEAD`, '--', KR_FILE).stdout.split('\n').filter(Boolean).length, dirty: git('status', '--porcelain', '--', KR_FILE).stdout.trim() !== '' }), sink);
    finish('eval known red', sink);
  } else usage('lint <workdir> | checks <workdir> | selftest | eval-tsc <log> <exit> | eval-known-red <log> <exit> <live-sha> <pin-set-output>');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
```
<!-- final-gates.mjs end -->

#### F.6 Run rules for the three gates

- The gate command is `python3 ~/.agents/skills/measure-orchestrator/scripts/measure_interphase_checks.py role-gate --role final-acceptance --track asset_storytime_l2_unit1_pictures_20261025 --result-file <result.json> --log-file <role log>`.
  It runs the three strings in this order: PROJECT_LINT, PROJECT_CHECKS, PROJECT_TESTS. It runs them with
  `shell=True` (so `/bin/sh`, not bash) from the repo root. Each string holds POSIX shell only.
- Set `PROJECT_GATE_TIMEOUT_SECONDS=7200` for the gate. The default is 3600 s. PROJECT_CHECKS holds two
  heavy runs and can wait in the lock queue.
- Run one heavy command at a time. The final-acceptance agent must not run `tsc` or `vitest` while the
  gate runs. The agent runs each gate string once for its own evidence. The orchestrator runs the gate
  after that. Both runs must exit `0`.
- Never run `pnpm`. A `heavy-preflight` hold or exit `75` is neither pass nor failure: wait and run
  again.
- Intentionally red aggregate suites: `tests/storytime-book-pictures.test.ts` (the known-red rule of
  5.11.16, handled inside PROJECT_CHECKS). The full `vitest run` and `pnpm test` stay outside this
  track (section 11). The 38 tsc errors of F.3 are a pinned known-red baseline, not a pass.
- The audit stops at `status: "inconclusive"` (not `fail`) for a hold, a heavy-run time limit, or a
  tool failure. It never writes `pass` for those.

#### F.7 Final-acceptance brief (role `final-acceptance`)

Model: `coding-plan/ark-code-latest#high`. Start test: the first reply holds the line
`final acceptance start: HEAD <40 hex>` and the value equals `git rev-parse HEAD`, and the agent reads
`measure/index.md` first. A reply that is empty, has another value, or comes after 10 minutes fails the
start test. If the start test fails, or the run ends with no valid result file, the orchestrator runs
the whole role once on the DeepSeek fallback. It makes no other escalation. If the fallback also
fails, the orchestrator returns `blocked` to the PM.

Scope: the whole track. That means Phases 1 to 5 and the 5.11 restart (the 24 pictures, the 51
delivered files, the nut v3 pair, the judge kit, and the handoff folders). The agent audits the track
at HEAD. It does not judge a picture. No text says that Workbooks or Daniel accepted a picture (5.6).

Read first, before any command: `measure/index.md`, `measure/tracks.md` (this track's entry),
`spec.md`, `plan.md` (the Phase 2, 3, and 4 acceptance notes and the Phase 5 notes), `contract.md`, this
file (sections 3 and 7, 5.11 to 5.11.16, and this section), `acceptance-p5-restart-325b92a.json` and
its log, `measure/tech-debt.md` (TD-29, TD-30), and
`~/.agents/skills/measure-orchestrator/references/contracts.md`.

Steps, in this order. Set `T`, `R` (`measure/runs/asset_storytime_l2_unit1_pictures_20261025`), and
`D` (a new `mktemp -d` folder under `/tmp/opencode/`).

1. Record `git rev-parse HEAD`, `git status --short` (name the foreign state; edit nothing), and a
   hash of `git status --porcelain` for step 10.
2. Run PROJECT_LINT once (F.4). Quote every label. If L1 fails, nothing carries over from
   `325b92a0`: also rerun every gate of 5.11.15 and 5.11.16 at HEAD (X1 to X15, G5, KNOWN_RED_CHECK,
   the plan-quote comparison).
3. Run PROJECT_CHECKS once (F.3), then PROJECT_TESTS once (F.2). Quote the labeled lines.
4. Rerun the light gates that carry over only by assumption: X13 with its seed control, X14, and G5
   (the commands of 5.11.7 and 5.11.16). Expected: X13 prints the 3 w08 approval notes, X14 prints
   nothing, both memory files have 50 lines or less, and each ledger id count is 1 or more.
5. Plan state (FA6): count the task lines, the `[x]` lines, the non-deferred incomplete lines, and the
   deferred lines. Run `measure_interphase_checks.py status --track …`. Count the `[x]` lines with no
   hex SHA of 7 to 40 characters on the first line (expected: 2, lines 30 and 32, finding FA-N1).
6. Phase records (FA7): name the acceptance record of each of the Phases 1 to 5 (the plan notes for
   Phases 2, 3, and 4, and `acceptance-p5-restart-325b92a.json` for Phase 5). Check each phase checkpoint
   SHA in the plan headings (`3ea5fca`, `061694f`, `21de99f6`, `35f4a12c`) with `git cat-file -t`. The
   Phase 5 heading has no checkpoint: report it as a nonblocking nit (the closeout manifest uses
   `325b92a0`).
7. Compare the plan and `metadata.json` quotes with the gate output: `actual_tasks` 29, the restart
   spend 0.57 USD (57 rows), 51 delivered files, 24 pictures, the TD-29 and TD-30 rows. Name each
   difference.
8. Check the wording rule of 5.6 on the two result files you write (FA10) and the secret rule (FA11).
9. Write the result files (F.9 FA12).
10. Compare the hash of `git status --porcelain` with step 1. The only new paths are the two result
    files in `$R`.

Result files: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/final-acceptance-<HEAD7>.json`
(the audit JSON of `contracts.md`, plus the fields `audited_head`, `carry_over_base`, `verdict`, and
`gates`) and `final-acceptance-<HEAD7>.log` (each command, its exit code, and its labeled lines).
`<HEAD7>` is `git rev-parse --short=7 HEAD`. Write `status: "pass"` only when `blocking_findings` and
every `*_violations` array are empty. FA-N1 and the Phase 5 checkpoint nit go in
`nonblocking_findings`. Do not commit the files; closeout commits them.

Read-only rules: edit no product file, no test, no script, no plan, and no Measure document. Write only
inside `$D` and the two result files. Stage nothing. Do not run `./measure/generate.sh` (it writes).
Do not run Muse, the judge, or `pnpm`. Run one heavy command at a time and wait for a held lock.

Carry-over rule for a strategy-only commit (as in 5.11.16): the strategy commit of this section changes
only this file, so it is not an implementation commit. The measured results of the Phase 5 acceptance
at `325b92a0` carry over to HEAD (X1, X2, X2b, X3, X4 with its control, X5 to X9, X12, and the Phase 5
type check and tests as evidence) when L1 to L4 hold. The three project gates and the light gates of
step 4 are not carried over. The agent runs them at HEAD.

#### F.8 Closeout brief (role `closeout`)

Model: `minimax-cn-coding-plan/MiniMax-M3.1-Flash`. Closeout starts only when
`measure_interphase_checks.py audit-result --role final-acceptance --file <final-acceptance json>`
prints `PASS` and the `audited_head` of that file equals `git rev-parse HEAD`. Another own commit
since then means a new final acceptance first. Closeout edits no product file. Use explicit paths in
every `git add` and every `git commit`. Other agents share the git index.

Steps, in this order:

1. CG0 Foreign state. Run `git status --short measure/tracks.md measure/tracks measure/generated measure/status.md measure/tech-debt.md measure/lessons-learned.md`.
   Name each path that is not this track's. `measure/status.md`, `measure/tech-debt.md`, and
   `measure/lessons-learned.md` must have no uncommitted change now. If one has, return `blocked`.
2. CG2 Secret scan of the run folder. Run the grep of X14 over `$R`:
   `grep -rEnI 'sk-[A-Za-z0-9]{16,}|Bearer [A-Za-z0-9._-]{16,}|api[_-]?key.{0,20}[:=]|AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY' "$R"`.
   It must print nothing. A match: name the file, do not commit, return `blocked`.
3. CG1 and the move. `mkdir -p measure/archive && git mv measure/tracks/asset_storytime_l2_unit1_pictures_20261025 measure/archive/asset_storytime_l2_unit1_pictures_20261025`.
   Use `git mv` in the same command line as the commit (step 9), not earlier.
4. CG3 Plan first-line SHA (FA-N1). In `measure/archive/<id>/plan.md`, append the text
   ` (commit 2fdce9d)` to the first line of the task at line 30, and ` (commit c52e495)` to the first
   line of the task at line 32. Change nothing else. Check
   `grep -E '^\s*- \[x\] ' measure/archive/<id>/plan.md | grep -vcE '\b[0-9a-f]{7,40}\b'` prints `0`.
5. CG4 Metadata. In `measure/archive/<id>/metadata.json` set `"status": "done"`, add
   `"completed": "<date +%F>"` (the closeout day), and set `updated_at` to the closeout time (UTC).
   Keep the JSON valid (`python3 -m json.tool`).
6. CG6 Links. In `measure/tech-debt.md` (TD-29 and TD-30) and `measure/status.md`, change
   `./tracks/asset_storytime_l2_unit1_pictures_20261025/` to `./archive/asset_storytime_l2_unit1_pictures_20261025/`.
   Change no other text. RB-P4-1 stays `TD-29` (Low, Open). Add no debt row. Then
   `grep -n 'tracks/asset_storytime_l2_unit1_pictures_20261025' measure/*.md` must print nothing.
7. CG5 Registry (Q3: stage only this track's lines). The working copy of `measure/tracks.md` holds a
   foreign hunk. So do this:
   1. `git show HEAD:measure/tracks.md > "$W/tracks.head.md"` (`W` is a new `mktemp -d` folder).
   2. In that copy, delete the active entry of this track (the `- [~] **Track: Storytime Level 2 unit 1…`
      line and its indented lines up to the next entry). Add, at the end of the file, the heading
      `## Archived Tracks` and one entry. The entry has no text `**Track:`. Example text:
      `- [x] Storytime Level 2 unit 1 book pictures and cover render, completed <date>; weeks 1 to 7 and the cover delivered (independent model review, model evidence, not acceptance); week 8 deferred to PM assignment.`
      Add a markdown link to the folder `./archive/<id>/` in the bracket-and-parenthesis form of the
      active entries (the link text and the link target are both that folder path). The link must resolve
      after the move. Do not write that link form in this strategy file: the doctor reads it here.
   3. `BLOB=$(git hash-object -w "$W/tracks.head.md")` and
      `git update-index --cacheinfo 100644,$BLOB,measure/tracks.md`.
   4. Apply the same two edits to the working file `measure/tracks.md` with exact-text edits. Leave the
      foreign hunk as it is.
   After the commit, `git diff HEAD -- measure/tracks.md` shows only the foreign hunk.
8. CG7 Manifest. Write `measure/archive/<id>/automation-supervisor-closeout-manifest.json` (valid JSON,
   shape of `86efee18`): `schema_version` 1; `track`; `archived_at` (UTC); `track_base_sha`
   `2fdce9d56a4af2240c1c76b3e866a2644c4a36db`; `track_final_sha` (HEAD at closeout start);
   `phase_acceptance_results` (the paths of `acceptance-p5-restart-325b92a.json`,
   `final-acceptance-<HEAD7>.json`, and the earlier acceptance files that exist in `$R`);
   `completed_phases` (id, title, checkpoint: `3ea5fca`, `061694f`, `21de99f6`, `35f4a12c`, and Phase 5
   `325b92a0`); `gates` (the labeled results of PROJECT_LINT, PROJECT_CHECKS, and PROJECT_TESTS from the
   final-acceptance log); `antipatterns_clean` (the classes of section 9 and 5.11.10 that the gates
   cover); `antipatterns_known_limitations` (the 38 pinned tsc errors by file and count, the known-red
   file with the live list SHA-256, the 12 doctor errors of other tracks); `deferred` (week 8 rows
   `moon`, `mango`, `ostrich`, `drum`; the four Muse-path deferred tasks; the Nan window sample);
   `tech_debt` (`TD-29` for RB-P4-1 and PA4-N1, `TD-30`); `generated_facts` (committed, or the reason
   from step 10). The manifest never says that Workbooks or Daniel accepted a picture.
9. CG1 Commit. In one shell command line: `git add -- measure/runs/asset_storytime_l2_unit1_pictures_20261025 measure/archive/asset_storytime_l2_unit1_pictures_20261025 measure/tech-debt.md measure/status.md`,
   then check that `git diff --cached --name-only` has no path outside `measure/runs/<id>/`,
   `measure/archive/<id>/`, `measure/tracks/<id>/` (the deletions), `measure/tech-debt.md`,
   `measure/status.md`, and `measure/tracks.md`; check that `git diff --cached -U0 measure/tracks.md`
   holds no line of the foreign Contents hunk; then `git commit -m "measure(storytime_l2_unit1_pictures): archive the track and commit the run records"`.
   If another agent has staged a path, stop and return `blocked`. Do not commit their path.
10. CG9 Facts and doctor after the move (A10). Run `./measure/generate.sh` (expect exit `0`,
    `Generated 4 Measure facts.`). Run `bash $HOME/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './measure/doctor.sh'`
    once (it runs `vitest`), then `node measure/tools/doctor.mjs --structural-only --root .`. Quote the
    error count and every error line. No error may name this track or an owned path. Commit
    `measure/generated/` only if `git status --short measure/tracks measure/tracks.md measure/generated`
    shows no change that another session owns (T5). Else commit nothing there, restore nothing, and
    write the reason in the manifest and the reply (the changed foreign paths). If `generate.sh` wrote
    files that stay uncommitted, name them. The words "doctor exits 0" appear only with exit code 0.
11. CG8 Gate. Run `measure_interphase_checks.py role-gate --role closeout --track asset_storytime_l2_unit1_pictures_20261025 --log-file <closeout log>`.
    It must exit `0`.
12. Report: `git worktree list`, `git branch -a`, and the list "facts changed" (the track status `done`,
    the registry entry, the TD links, the tracks that other sessions must know). Do not delete any
    branch, worktree, or file of the run folder (owner rule: the owner deletes).

Return `blocked` if a step cannot hold its condition. Return `partial` with the exact output if only
the doctor errors of other tracks remain (T7).

#### F.9 Gates

| Gate | Check | Falsification condition |
| --- | --- | --- |
| FA1 Mechanical gate | `role-gate --role final-acceptance` exits `0` (plan has 0 non-deferred incomplete tasks, PROJECT_LINT, PROJECT_CHECKS, PROJECT_TESTS each exit `0`). | Any part exits non-zero. |
| FA2 Lint labels | The agent's PROJECT_LINT output holds `selftest cases: 31 failed expectations: 0`, the L1 labels at their expected values, every block SHA-256, three `check exit: 0`, `restart check exit: 0`, `restart control exit: 1`, both doctor labels `0`, and `final lint: pass`. | A label is missing or differs. |
| FA3 Type check | `tsc errors total:` 38 or less, `owned tsc errors: 0`, `tsc files outside the baseline: 0`, `tsc files above their baseline: 0`, `tsc unparsed error lines: 0`. | A new error file, an owned error, or a count above a row. |
| FA4 Known red | `known red failing tests outside the pin set: 0`, `known red drift sentinels failing: 4 of 4` (or exit `0` and 0 failures if the list equals the pin), `known red skipped or todo: 0`, and `final checks: pass`. | A new failure, a passing sentinel, or a changed test file. |
| FA5 Tests | `Test Files  7 passed (7)`, `Tests  105 passed (105)`, `project tests exit: 0`. | A failure, a skip, or another total. |
| FA6 Plan | 33 task lines, 29 `[x]`, 0 non-deferred incomplete, 4 deferred, `incomplete_phases: 0`. Two `[x]` lines have no SHA on the first line (FA-N1, nonblocking). | A task is open, or a third line has no SHA. |
| FA7 Phase records | Each of Phases 1 to 5 has a named acceptance record and a checkpoint that `git cat-file -t` shows as `commit`. | A phase has no record. |
| FA8 Light gates | X13 prints the 3 w08 notes only (seed control prints 1). X14 prints nothing. Both memory files have 50 lines or less. Each ledger id count is 1 or more. | An unqualified match, a secret, or a missing id. |
| FA9 Plan quotes | Each quote of F.7 step 7 equals the gate output. | A number differs. |
| FA10 Wording | The grep `grep -Ein '\b(accepted\|approved\|production-ready)\b'` over the two result files prints only lines that name a process acceptance (`Final acceptance`, `Phase 5 acceptance`, `model evidence, not acceptance`) or Daniel's quoted word with the person record. | A picture is called accepted or approved without a person record. |
| FA11 No secret | The X14 grep over the two result files prints nothing. | A key-like string. |
| FA12 Result files | `audit-result --role final-acceptance --file <json>` prints `PASS: audit result is valid`. `status` is `pass`. The `.log` quotes each command with its exit code. | The JSON is invalid, or the log has no exit code for a command. |
| FA13 Read only | The hash of `git status --porcelain` before and after differs only by the two result files. | Any other path changed. |

Closeout gates: CG0 to CG9 as listed in F.8. Each one has the check in its step and fails when its
condition does not hold. The closeout role-gate (step 11) is the mechanical proof.

Anti-pattern coverage for this section:

| Class | Defense | Falsification condition |
| --- | --- | --- |
| A2 consent-blind publish gate | FA10 and the manifest rule: no text says that Workbooks or Daniel accepted a picture. The word "acceptance" names a process step only. | A result file or a manifest calls a picture accepted without a person record. |
| A3 digit-only count | Every gate reads a label (`tsc errors total:`, `Tests  105 passed (105)`, `known red drift sentinels failing:`). The tsc count is by file, not one number. | A bare digit satisfies a gate. The selftest case "tsc one fewer error" passes only for a real drop, and "tsc file above baseline" fails with an equal total. |
| A4 vacuous pass | The selftest runs first in both scripts. The restart check control must exit `1`. `tsc` exit `2` with no parsed error fails. A pin block with 0 lines fails. | A parser passes seeded bad input, or a run over 0 files passes. |
| A5 false claim | The agent quotes each command, exit code, and label. FA9 compares the plan quotes. "Doctor exits 0" appears only with exit `0`. | A quote differs from the output. |
| A6 registry overstatement | The registry entry and the manifest use the 5.6 wording. The archived entry keeps "model evidence, not acceptance". | A line says "accepted" for a picture. |
| A7 over-broad filter | The baseline is by file and count, so an equal total with a moved error fails. The known-red set comes from the test bodies (`pin-set.mjs`), not from the failures. | A new failure hides in a known-red total, or an error moves to another file at the same total. |
| A9 archived track paths | CG6 retargets every link in `measure/*.md`. The scripts in this section read `measure/tracks/<id>/test-strategy.md` before the move only. After the move the file lives in `measure/archive/<id>/`, and the three gate strings stop working. That is by design: they gate final acceptance, not the archive. | A `measure/*.md` link still names `tracks/<id>`, or a test file names `measure/tracks/`. |
| A10 generated-facts drift | CG9 runs `generate.sh` and `doctor.sh` after the move. The facts commit waits for a tree without foreign state. | The facts are committed with foreign state, or before the move. |
| A11 doc-to-code drift | The script SHA-256 is pinned in the three strings and in F.5. The baseline table equals the `TSC_BASELINE` object of the script (the checker compares them). | The extracted block SHA-256 differs from the value, or the table and the object differ. |

#### F.10 Base capture point, defaults, and findings

Base capture point:

1. `325b92a0` is the `role_base_sha` of this strategy role only. It is also the carry-over base
   (`CARRY_BASE` in the script).
2. Immediately after the strategy commit of this section, the orchestrator runs `git rev-parse HEAD`.
   That committed value is the immutable `phase_base_sha` of the final-acceptance role. The
   orchestrator records it before any other commit.
3. This section embeds no SHA for that base.

Defaults taken by this role (no question tool; the orchestrator can change each one):

1. D1 The new section sits after 5.11.16 and before section 8, as an H3 under section 7.
2. D2 The type check passes when each file count is at or below its baseline row. A fix by another
   track lowers a count and does not fail the gate.
3. D3 `tests/storytime-book-pictures.test.ts` runs inside PROJECT_CHECKS (not PROJECT_TESTS), because
   PROJECT_TESTS must exit `0`.
4. D4 PROJECT_LINT rejects a doctor error that is not in the known list of 12, even when it belongs to
   another track. A new foreign error makes the audit `inconclusive`; the orchestrator asks the PM.
5. D5 Foreign commits since `325b92a0` may touch `measure/tracks.md`, `measure/generated/`, and other
   tracks. They may not touch a Storytime path.
6. D6 The Phase 5 plan heading gets no checkpoint. The manifest records `325b92a0`.
7. D7 Closeout uses two edits for the registry: a temporary blob for the index and the same edit in the
   working file. The foreign hunk stays uncommitted.
8. D8 The heading `## Archived Tracks` is new. The July archive used `## Completed Tracks`, but the
   closeout checker reads only the text before `## Archived Tracks`, and the doctor rejects a
   `**Track:` line with an archive link.
9. D9 `prettier --check` is not a lint here: it reports the whole repo and does not read the track.

Findings at `325b92a0` that matter to the next roles:

| Id | Class | Finding | Owner |
| --- | --- | --- | --- |
| FA-N1 | Blocks closeout CG3, not final acceptance | Plan lines 30 and 32 have the commit SHA on the continuation line. | Closeout step 4 |
| FA-N2 | Informational | The 38 tsc errors and the 12 doctor errors belong to other tracks. They are pinned, not fixed. | Other tracks |
| FA-N3 | Informational | `measure/generated/` holds foreign state. Closeout may not be able to commit the facts (step 10). | Closeout, other sessions |
| FA-N4 | Risk | The known-red check assumes `failed` equals the number of unique failing ids. An old 89-test log (no longer on disk) showed 14 failed and 13 unique ids. If it recurs at 142 tests, the gate fails safe and the audit is `inconclusive`. | Orchestrator |
| FA-N5 | Not tested by this role | PROJECT_CHECKS and PROJECT_TESTS were not run end to end. This role ran `tsc` once and checked the parsers with synthetic input only (no second heavy run). The `vitest` output parser is checked with synthetic text in the selftest. | Final-acceptance agent |

## 8. Architecture guardrails and changed-contract risks

Guardrails:

- Node-side modules in `src/storytime/` import `src/song/timeline.ts` (pure) and types from
  `src/song/still-hook.ts` only. They never import `src/song/main.ts`.
- A browser-side book-still page module under `src/storytime/` may load the song page module,
  with the task 3 hook, in Chrome. It must not copy scene-building code from `src/song/main.ts`.
- The line-art pass is a render pass of the same scene and camera, with a threshold to 1-bit. A
  filter of the color PNG alone is not allowed (contract "Source and technique").
- The guardrail fired in `fafa82dc`: the pass cannot reach the scene and camera without a
  song-engine edit. Phase 2 task 3 is the engine hook task. From task 3, the T45 engine diff
  checks replace `git diff --quiet 1d39b8fd -- src/song`. Any other song-engine change stops the
  implementer for a new task, with `tests/song-timeline.test.ts` in its gate and a PM note.
- The line-art pass uses no wireframe material, keeps hidden edges hidden, and restores the camera
  and the renderer (T46, T47).
- `playwright` and `vite` load lazily inside the capture function only.
- Provider processes start with an argument array. No shell string.
- From task 7, the render wrapper also starts `heavy-run.sh` with an argument array. No code in the
  owned paths builds a shell string from a CLI argument (T77).
- From task 7, every write under the output root goes through `resolveOutputPath`. New files use
  exclusive creation, except the files that the contract lets a new call replace (T80).
- From task 7, the capture server serves only the allowlist after a `realpath` check. The
  Storytime output tree is never served (T78, T79).
- From task 7, no provider text and no operator reason enters a file before the credential check
  (T81 to T83).
- From task 8, decoded review fields pass the same credential check before persistence or logging.
  Provider exceptions and final CLI errors use the same redaction boundary (T88 to T90).
- From task 9, one shared walker checks every decoded key and string value before schema validation or fallback.
  Both provider paths call it before success or persistence. A named-field list cannot satisfy this guardrail (T96 to T102).
- From task 10, the walker also checks JSON string layers, root arrays, and scalar array elements (T104 to T108).
  It uses a worklist and builds credential rules once (T109 to T111, T115). It does not export `decodedReviewFindings` (T113).
- From task 11, the credential check covers every JSON string token of the raw answer at every decoded layer. It does not depend on `JSON.parse` success (T116 to T122).
- From task 11, the scan is linear per layer and has no per-brace rescan (T121).
- From task 11, one rule builder serves the raw scan and the decoded scan (T125).
- From task 11, a long pattern name is cut and the shared suffix stays (T124).
- From task 11, the MiniMax comment names the current finding and states the order (T126).
- From task 8, the server reads only the checked real path. Vite keeps its default credential deny
  entries and adds the absolute Storytime entry (T91 to T93).
- Phase 2 task 5 changes nothing in `src/song/`. The live camera reads use the existing hook
  fields `camera` and `cameraState`.
- Phase 2 changes `src/song/` only in task 3, inside the T45 limits. Phase 2 does not change
  `scripts/song-record.ts`, `scripts/heavy-lock.ts`, the
  preflight script, Workbooks, or the monorepo. An engine change for stills needs its own task,
  `tests/song-timeline.test.ts` in the gate, and a PM note.
- No change to `assets/fireball.ts` or `out/fireball/`.

Changed-contract risks:

- The song engine serves future song videos. A still-mode change can break them. The hook runs
  after the frame render and changes no frame. T45 and the T52 `color repeat identical` value
  check this. `window.__bookStill` is a new page global that song videos ignore.
- `scripts/heavy-lock.ts` and the preflight are shared with the monorepo. Do not change them.
- Workbooks reads `manifest.json`. A field change after week 1 delivery needs a PM notice.
- A `rubricVersion` change makes earlier calibration invalid. Calibrate again. The render gate
  enforces this from task 5 (T65).
- The style look record gains `lineArtTechnique` and `lineArtFormatVersion`. Workbooks does not read
  it. A new technique ID needs a new style look from Daniel.
- The ledger gains `modelSource` and the failure record mode. Readers of the ledger must accept a
  `failure` entry without a log.
- A source package change makes `jobs.json` invalid. Plan again and keep the old pictures.
- The `mmx vision describe` argument shape can change with the CLI. Run `mmx vision --help`
  (no paid call) before task 4.
- The line-art format is provisional. Picture spec v1 (due 2026-10-28) can change the size, color
  depth, line weight, and name. The `-lineart` suffix and the `lineArtFormatVersion` field keep
  the change traceable. The color contract stays as it is.
- The line-art pass adds GPU and memory load to each render run. The render stays one heavy job
  under one preflight and one lock.
- The provisional limits (90, 0.5, and 25 percent) are not yet checked on a real render. The Nan
  sample is the first check. A limit change needs a contract change and a new format version.
- Task 7: `verify --release` now needs current calibration. A rubric change, a calibration source
  change, or a lost calibration log stops every release until calibration runs again.
- Task 7: the GLB allowlist accepts only `out/<name>/<name>.glb` names in the asset name pattern. A
  future scene asset with another name gets 404, and the scene draws without it. The
  `book file requests refused` label shows this case. Smoke run 4 checks the Nan window scene.
- Task 7: a credential pattern can match a safe model answer. The call then records `failure`, and
  a new paid call is necessary. The T82 safe-answer cases and the T87 live scan limit this risk.
- Task 7: the ledger `error` field is now redacted and has 500 characters at most. Ledger readers
  must not expect the full provider error text.
- Task 8: thrown provider errors and final CLI errors are also redacted and bounded. CLI callers
  must not expect original provider stderr.
- Task 8: decoded credential refusal can reject an answer whose raw bytes passed the earlier scan.
  The safe escaped Unicode controls limit false refusals.
- Task 8: the absolute Storytime deny entry depends on `repoRoot`. Tests must use a temporary root,
  not a hard-coded checkout path.
- Task 8: a checked real path removes candidate symlink traversal. It does not prove protection
  against replacement of the real target after the check. No race resistance is claimed.
- Task 9: unknown fields and malformed objects can now cause credential refusals. Safe models and raw bytes keep their existing behavior.
  The decoded-refusal suffix changes for both providers. Review C checks parity without changing flags, schemas, or exit semantics.
- Task 10: a JSON string can now cause a credential refusal. Safe string layers and safe arrays must still pass (T112).
  The Kimi check moves before schema parsing. Flags, exit codes, and evidence shapes stay unchanged.
  RC5-3 stays open. Do not treat the raw-byte refusal text as changed.
  A 65,536-byte time bound does not add a MiniMax size limit.
- Task 11: the credential check now reads text that no JSON parser accepts. A safe malformed answer keeps its earlier parser result (T123).
- Task 11: a refusal message cuts a long pattern name. The name stays a prefix of the earlier name. A reader must not parse the full name.
- Task 11: the decoded check no longer depends on `JSON.parse`. A safe answer that no parser accepts still produces the earlier review result.
- Task 11: the layer count of the decoded scan has no limit. A text with many nested quoting levels costs one pass per layer.
  No row covers that cost yet. The acceptance role measures it and opens a follow-up task when the cost passes the task bound.

## 9. Anti-pattern coverage

| Class | Phases | Defense | Falsification |
| --- | --- | --- | --- |
| A2 consent-blind publish gate | P2, P3, P4 | The release gate requires a person log with a named `checkedBy` and a person evidence class (T17). Line art also requires a person look and Daniel's style look (T36). | A model-only candidate or a line-art twin without the style look becomes `ready`. |
| A3 digit-only count | P2 to P5 | Exact labeled counts: `112`, `16` per week, `Tests  N passed (N)`, `owned tsc errors: 0`, ledger counts, the labeled ink share (T1, T14, T32). | A test passes on any digit or a count above 0. |
| A4 vacuous pass | P2 to P4 | Empty selections fail (T18, T37). An all-white line-art page fails (T32). A mesh net that passes the format checks fails T47 and T50. A vitest run with 0 tests fails. Red needs `n >= 1` failures. The drift check reads the live camera, so a drift can fail it (T63, T74). A depth step with no ink fails (T70, T73). | An empty manifest, an empty page, an empty run, a drift check that compares a copy with itself, or a depth rule that never fires passes. |
| A5 false claim | P2 to P5 | Plan notes quote the command, exit code, and labeled values. The model name is reported or labeled as declared (T68). Deviation (d) records the parallel Kimi calls. Raw outputs keep one file per call (T69). The smoke label names the capture path (T74). | A plan claim disagrees with the quoted output, a log has a model without `modelSource`, or a raw output is lost. |
| A2 consent-blind publish gate (style look) | P2, P3 | The style look binds to the technique and format version. A twin with another technique stays `pending` (T64). | A twin with another technique becomes `ready` on the old look. |
| A6 registry overstatement | P3 to P5 | `tracks.md` and metadata use evidence classes. A model pass is "model pre-check". | Registry text says "accepted" with no person log. |
| A7 over-broad filter | P2 | The parser excludes no words (T14). The owned-error grep matches path prefixes, not words. No `vitest -t` filter hides a failing test. The binary check has no tolerance (T29). | "FAIL: no sun" parses as a pass, a filter drops a real error, or a pixel of 254 counts as white. |
| A9 archived track paths | P2, P5 | Tests reference no `measure/tracks/` path. | `grep -n 'measure/tracks/' tests/storytime-book-pictures.test.ts` prints a line. |
| A10 generated-facts drift | P2 to P5 | Run `./measure/generate.sh` after each plan status change. Run `./measure/doctor.sh` at P5. | `doctor.sh` reports stale generated facts. |
| A2 consent-blind publish gate (task 7) | P2 | `verify --release` checks current calibration (T84). An empty or absent `sampleFiles` list makes the style look invalid (T85). | A release passes with lost or stale calibration, or a twin becomes `ready` on a look with no sample evidence. |
| A4 vacuous pass (task 7) | P2 | The tree check reads every file for each synthetic value, not one chosen file (T81 to T83). Each refused request has a 404 and no `next` call (T78). Smoke run 4 requires `book file requests refused: 0`, so a missing GLB cannot pass silently (T86). The live scan needs 15 files or more (T87). | A secret persists in a file that the test does not read, a refused request reaches vite, a scene renders without an asset, or a scan of zero files passes. |
| A5 false claim (task 7) | P2 | A finding names the pattern, never the matched text. The redacted ledger `error` keeps the failure record (T81). The plan quotes the T86 and T87 labels. | A finding or a log holds a credential, or a failure leaves no `after-call` entry. |
| A7 over-broad filter (task 7) | P2 | The safe raw answers stay byte-identical (T82 case d). The 65,536-byte boundary file is accepted (T82 case c). Plain reasons still append (T83). | The credential check refuses a safe answer, changes a byte, or refuses a plain reason. |
| A3 digit-only count (task 8) | P2 | Parse the labeled test total, six T92 probe labels, and both T95 SHA counts. Require zero exposed bytes and zero unresolved SHAs. | Any digit satisfies a label, a probe label disappears, or an empty SHA scan passes. |
| A4 vacuous pass (task 8) | P2 | T92 includes an allowlisted stage control and real protected responses. T93 includes allowed in-root symlinks. T89 and T90 include safe escaped Unicode controls. | Every request is refused, every symlink fails, or safe inputs fail while the security cases pass. |
| A5 false claim (task 8) | P2 | T88 tests the final CLI log, not only the ledger. T95 resolves operative SHAs. The plan quotes actual T92 and T95 labels. | A plan claims a safe CLI while raw stderr escapes, or an operative SHA does not resolve. |
| A6 registry overstatement (task 8) | P2 | Keep task 8 open until Reviews A, B, and C pass and all mutations fail their named tests. | The track claims remediation while a review or adversarial gate fails. |
| A7 over-broad filter (task 8) | P2 | Preserve safe raw bytes in T89 and T90. Accept 500 non-ASCII characters in T94. Preserve safe diagnostics in T88. | The decoded scan changes safe bytes, the Unicode boundary uses bytes, or redaction removes all diagnostics. |
| A9 archived track paths (task 8) | P2 | Keep T95 outside vitest. Unit tests reference no `measure/tracks/` path. | A product test embeds the current track path and breaks after archival. |
| A10 generated-facts drift (task 8) | P2 | Refresh `actual_tasks` and generated facts during closeout, after task status changes. | `metadata.json` or generated facts disagree with the completed plan. |
| A3 digit-only count (task 9) | P2 | Parse the labeled vitest total and compiler counts as integers. Require the committed test count and zero owned errors. | A date, arbitrary digit, missing label, or empty run satisfies a gate. |
| A4 vacuous pass (task 9) | P2 | Pair every refusal with safe envelope controls. Inspect every output file and exact ledger events (T96 to T102). | Refusing every answer, scanning no files, or persisting before refusal passes. |
| A5 false claim (task 9) | P2 | Quote actual gate results and failed mutations. Keep RA4-N1 open until closeout corrects its handoff. | The plan claims closure with a failed review, surviving mutation, or stale handoff. |
| A6 registry overstatement (task 9) | P2 | Keep security completion claims pending until Reviews A, B, and C and the adversarial gate pass. | A completion claim precedes those results. |
| A7 over-broad filter (task 9) | P2 | Traverse every key and string without schema filtering. Preserve safe bytes and models (T96 to T102). | A named-field list, fallback, or unknown-field omission passes; a safe answer changes or fails. |
| A9 archived track paths (task 9) | P2 | Keep tests independent of Measure paths. Run provenance checks outside vitest. | A unit test gains a track path dependency. |
| A10 generated-facts drift (task 9) | P2 | Refresh metadata and generated facts at phase closeout after status changes. | Managed facts disagree with the completed plan. |
| A3 digit-only count (task 10) | P2 | Parse `decoded scan ms` and `rule scan ms` as labeled integers. Parse the vitest total the same way. | A date, an arbitrary digit, or a missing label satisfies the time bound. |
| A4 vacuous pass (task 10) | P2 | Pair each refusal with a safe control (T110, T112). T111 and T115 must call the seam and print a duration. | An empty finding list, a skipped seam call, or a refused safe answer passes. |
| A5 false claim (task 10) | P2 | Quote the Red failures and the mutation results. Do not claim RB4-01 is closed before those gates pass. | The plan claims closure while a named test or review fails. |
| A6 registry overstatement (task 10) | P2 | Keep security completion claims pending until Reviews A, B, and C and the adversarial gate pass. | A completion claim precedes those results. |
| A7 over-broad filter (task 10) | P2 | Decode JSON strings without refusing safe Unicode or safe arrays (T112). Do not change safe raw bytes. | Every string layer is refused, or a safe byte changes. |
| A9 archived track paths (task 10) | P2 | T114 reads `src/storytime/book-pictures.ts` only. Tests still reference no `measure/tracks/` path. | A unit test gains a track path dependency. |
| A10 generated-facts drift (task 10) | P2 | Refresh metadata and generated facts at phase closeout, after the task 10 status change. | Managed facts disagree with the completed plan. |
| A3 digit-only count (task 11) | P2 | Parse `malformed scan ms` as a labeled integer. Parse the vitest total and the compiler counts the same way. Require the committed test count and zero owned errors. | A date, an arbitrary digit, or a missing label satisfies the time bound. |
| A4 vacuous pass (task 11) | P2 | Pair every refusal row with the safe controls of T123. T127 and T128 read every file under the output root. T121 must print a labeled duration and must call the seam. | An empty finding list, a skipped scan, a refused safe answer, or a scan of zero files passes. |
| A5 false claim (task 11) | P2 | Quote the Red failures and the mutation results. Do not claim RB5-01 closed before the reviews and the adversarial gate pass. | The plan claims closure while a named test or a review fails. |
| A6 registry overstatement (task 11) | P2 | Keep the security completion claim pending until Reviews A, B, and C and the adversarial gate pass. | A completion claim precedes those results. |
| A7 over-broad filter (task 11) | P2 | The safe controls of T123 keep the raw bytes, the reported model, the PASS verdict, and the write order. The token scan must not refuse a safe answer. | A safe answer is refused, a safe byte changes, a verdict changes, or a write is missing. |
| A9 archived track paths (task 11) | P2 | T126 reads `src/storytime/book-pictures.ts` only. Tests still reference no `measure/tracks/` path. | A unit test gains a track path dependency. |
| A10 generated-facts drift (task 11) | P2 | Refresh metadata and generated facts at phase closeout, after the task 11 status change. | Managed facts disagree with the completed plan. |
| A2 consent-blind publish gate (phase 3) | P3 | The release gate needs a person log with a named `checkedBy` and a person evidence class (T17). Every week 1 row needs a color person log and a line-art person look (T145, T150). The style look needs `evidenceClass: owner-passed` (T36). | A row without a person log becomes `ready`, or a model log stands in for a person. |
| A3 digit-only count (phase 3) | P3 | Parse labeled integers only: `rows 192 week1 30 A 16 B 2 C 12`, `render peak rss mb: <n>`, `available MB: <n>`, `bookcase texture size: 1024`, `Verification passed for 30 jobs with release evidence.`, the ledger counts, and the vitest total. | A date, an arbitrary digit, or a missing label satisfies a count or a bound. |
| A4 vacuous pass (phase 3) | P3 | Every week 1 row has a color file and a line-art file (T145, T150). The list loader returns 30 rows, not zero (T142). A 6 px line fails and a 12 px line passes (T146). A batch with no asset record fails the shared-asset check. | An empty selection, an empty row set, a thin line, or a batch with no asset record passes. |
| A5 false claim (phase 3) | P3 | Plan notes quote the command, the exit code, and the labeled values. The closeout text must read 30 jobs. A model result stays a pre-check. | The plan claims 30 files while the manifest lists fewer, or a pre-check is called acceptance. |
| A6 registry overstatement (phase 3) | P3 | Keep the week 1 completion claim pending until the count review and the line-art look pass. The registry and the metadata use evidence classes. | Registry text says the week 1 pictures are accepted with no person log. |
| A7 over-broad filter (phase 3) | P3 | The owned-error grep matches path prefixes, not words. The binary line-art check has no tolerance (T29). The size check compares exact pixel pairs. | A filter drops a real error, a pixel of 254 counts as white, or 3000 x 2250 counts as class A. |
| A9 archived track paths (phase 3) | P3 | The new tests read `src/storytime/book-pictures.ts` and the read-only Workbooks list. They reference no `measure/tracks/` path. | A unit test gains a track path dependency. |
| A10 generated-facts drift (phase 3) | P3 | Run `./measure/generate.sh` after each Phase 3 plan status change. Run `./measure/doctor.sh` at Phase 5. | `doctor.sh` reports stale generated facts. |

Task 13 applicability for Phase 3: A1 and A8 remain retired. A2 applies because a release gate
turns a row from pending to ready. A3 applies because Phase 3 adds file counts, pixel sizes, and
two memory labels. A4 applies because a row can hold no file. A5 applies because the closeout
count changes from 16 jobs to 30 jobs. A6 applies because the week 1 delivery claim waits for
two human gates. A7 applies because the size and line checks use exact values. A9 does not apply
to the new rows because they read no Measure path. A10 applies at the phase closeout.

Phase 3 project candidates for a future `measure/anti-patterns.md`: (S11) a shared GLB that
changed after the batch asset record was written, so a render uses a stale set piece; (S12) a
line-art name under `lineart/` that the Workbooks list does not name, so the print track finds no
file; (S13) a class C row that gets no twin, so a word card has no printable version.

Task 11 applicability: A1 and A8 remain retired. A2 does not apply to this delta. It adds no publication or consent transition.
Earlier release and person-review guards stay unchanged. Task 11 does not convert a model pre-check into acceptance.
The task 11 defense per anti-pattern class: A3 uses a labeled integer parse of `malformed scan ms`.
A4 uses safe controls and a tree-wide file scan. A5 uses quoted gate results.
A6 keeps the closure claim pending. A7 uses the safe controls of T123.
A9 keeps the source read inside the owned path. A10 refreshes the generated facts at closeout.

Task 10 applicability: A1 and A8 remain retired. A2 does not apply to this delta. It adds no publication or consent transition.
Earlier release and person-review guards stay unchanged. Task 10 does not convert a model pre-check into acceptance.

Task 9 applicability: A1 and A8 remain retired. A2 does not apply to this delta: it adds no publication or consent transition.
Earlier release and person-review guards stay unchanged. Task 9 does not convert a model pre-check into acceptance.

A1 and A8 are retired. Project candidates for a future `measure/anti-patterns.md`: (S1) a model
pass treated as acceptance; (S2) a preflight hold read as a Red failure; (S3) a version overwrite;
(S4) a glob loader that reads `w08`; (S5) a twin output made in a separate run, which can drift
from its color twin; (S6) a render pass that meets the format checks but draws mesh triangle
edges; (S7) a smoke path that is not the production path, so the smoke passes and every render
fails; (S8) an approval word in a calibration prompt, so the model repeats the label; (S9) a
lexical path check without `realpath`, so a symlink escapes; (S10) JSON quoting used as shell
quoting, so `$(...)` runs.

## 10. Reviews and evidence classes

| Review | P2 | P3 | P4 | P5 |
| --- | --- | --- | --- | --- |
| Review B (security) | Applies: output path escape, symlinks, process arguments, no API keys in raw output or ledger, Workbooks read-only. The capture page server listens on localhost only and serves only the stage file and repository assets. The `window.__bookStill` hook holds no secret and exists only in the local song page. Review B failed at `c2353433` (RB-01 to RB-05). Task 7 corrects the findings. Review B failed again at `84c8ffdb` (RB2-01 to RB2-04). Task 8 requires Review B on its HEAD with T88 to T95. | Applies: the picture list is read only, the raw model outputs and the ledger hold no key, and the batch asset records hold no path outside `out/`. Review B runs on the Phase 3 Green HEAD with T142 to T151. | Applies, same as P3. | Not applicable. |
| Review C (UX and API) | Applies: CLI commands, flags, exit codes (`2` for a pre-check fail), `--output`, the provisional line-art name, the `window.__bookStill` shape, the `lineart-smoke` command, and the manifest schema with output kinds that Workbooks reads. From task 7: the calibration refusal in `verify --release`, the `--raw` and `--reason` refusals, and the wrapper invocation. From task 8: final CLI errors, decoded-field refusal timing, and the Unicode reason limit. Review C runs on the task 8 HEAD. | Applies: the list-driven file names, the `-line-v1.png` sibling name, the new size classes, the error text that names a failing row, the manifest and contact sheet handoff, and the sample report to the PM. | Applies: final list and spec v1 reconciliation. | Not applicable. |
| Adversarial testing | Required: the task 5, task 7, and task 8 mutations in the closeout gate, release gate bypass, version overwrite, path escape, `w08`, ledger order, hold handling, a grey pixel, a twin mismatch, a lone color file, a name collision, a `wireframe: true` mutation, a removed restore line, a camera read after the pass, and the Red mutation list. | Required: change one byte of a list row, one line-art pixel to 128, one manifest hash, one shared-asset stat, and one line-art name. Each change must fail a named check. The twin pair must come from one render run. | Recommended on the cover check and the spec v1 rename. | Not applicable. |
| UX browser review | Not applicable: no UI. The smoke runs are live render proofs. Smoke run 6 also proves middleware refusal, not browser UX. | Not applicable: the output is picture files. The model pre-checks, the count review, the line-art looks, and Daniel's style look review the pictures. The browser shows no new UI. | Not applicable. | Not applicable. |

Task 9 requires Reviews A, B, and C on its final HEAD. Its section 4 applicability supplements this table.
Task 9 requires adversarial testing but no browser review or new smoke run.

Task 10 requires Reviews A, B, and C on its final HEAD. Security review applies to the decoded credential paths.
UX/API review applies to the refusal result, the export removal, and the Kimi call order. A short delta check is sufficient.
Adversarial testing applies. Use the task 10 mutations. Browser review does not apply. This task changes no UI.

Task 11 requires Reviews A, B, and C on its final HEAD. Security review applies to every decoded
credential path and to both write boundaries.
UX/API review applies to the refusal text, the 500-character cut, the shared rule builder, and the
comment label. A short delta check is sufficient.
Adversarial testing applies. Use the task 11 mutations. Browser review does not apply. This task
changes no UI.

Review result format: the orchestrator gate reads `blocking_findings` and `nonblocking_findings` as
arrays of non-empty strings. Each string starts with the finding ID, the severity, and the
location. Review A at `5ffdbf6e` used objects. The next reviews use strings. Other fields can
stay objects.

Evidence classes:

- **Automated (artifact and logic):** the vitest suite with injected dependencies. It proves logic
  and file contracts. It proves no real render and no real provider call.
- **Live behavior:** Phase 2 task 3 proves the hook and the pass in one bounded smoke run (T52).
  Phase 2 task 4 proves the real provider path. Phase 2 task 5 proves the production capture path
  in smoke run 2 (T74). Phase 2 task 6 proves the failure record and the neutral `good-nan` text
  (T75). Phase 2 task 7 proves the capture server allowlist and the guarded smoke writer in smoke
  run 4 (T86), and the wrapper argument form and the live credential scan in T87. Phase 2 task 8
  proves the real Vite middleware refusals and the production capture in smoke run 6 (T92). T95 is
  documentation proof, not live behavior proof. Phase 2 task 10 adds no live proof.
  T104 to T110 and T112 are injected provider-boundary tests. T111 and T115 are seam timing tests.
  T113 is an export artifact test. T114 is a documentation test. None of them calls a live provider or a browser.
  The Phase 3 Nan sample proves
  the real capture, the line-art pass, both formats, and the twin binding under the lock.
- **Model pre-check:** MiniMax and Kimi logs on color candidates. Never acceptance.
- **Person-checked or owner-passed:** person logs and line-art looks from Daniel or his named
  reviewer, and Daniel's style look relayed by the PM.

## 11. Aggregate suite

- Do not run the full `vitest run` or `pnpm test` in this track. Only the focused file runs.
- Failures in other suites and baseline tsc errors are known and outside this track. Record them
  in `known_failures`. They do not block a focused gate. Do not fix them here.
- No test in this track is intentionally red after Red. A red test after Green blocks the phase.
- Task 9 retains these rules. Intentionally red aggregate suites remain outside the focused command and stay explicitly recorded as known failures.
  Do not suppress a task 9 failure with a test filter, skip, or baseline exception.
- Task 10 retains these rules. A red T104 to T115 result after Green blocks the phase.
  Do not suppress a task 10 failure with a test filter, skip, or baseline exception.
  Baseline tsc errors outside the owned paths stay known failures. They do not block the focused gate.
- Task 11 retains these rules. A red T116 to T128 result after Green blocks the phase.
  Do not suppress a task 11 failure with a test filter, skip, or baseline exception.
  The aggregate suite stays outside the focused command and stays a recorded known failure.
- Phase 3 retains these rules. A red T142 to T151 result after Green blocks the phase.
  Do not suppress a Phase 3 failure with a test filter, skip, or baseline exception.
  The Phase 3 rows stay in `tests/storytime-book-pictures.test.ts`, so the focused command runs
  one file. The rows T1 to T141 keep their Phase 2 evidence and their green result.

## 12. phase_base_sha capture point

1. The strategy commit `1d39b8fd` landed. The orchestrator captured it as the immutable
   `phase_base_sha`. This value does not change.
2. Two doc-only commits followed before Red: `b63755bc` (Kimi owner and asset approval) and the
   line-art and A3 amendment. They change only track docs, not product source or tests.
3. Red diffs from `1d39b8fd`. Acceptance treats the two doc commits as in-phase scope changes.
4. No Red edit or commit happens before the amendment commit lands.
5. The engine hook amendment (`docs(measure): add Storytime still engine hook task`) lands after
   `f271dce6`. It is doc-only and in-phase. `phase_base_sha` stays `1d39b8fd`.
6. The Review A remediation amendment (`docs(measure): plan Storytime Phase 2 review
   remediation`) lands after `5ffdbf6e`. It is doc-only and in-phase. `phase_base_sha` stays
   `1d39b8fd`. The task 5 Red diffs from the amendment commit.
7. The Review B security remediation amendment (`docs(measure): plan Storytime Phase 2 security
   remediation`) lands after `c2353433`. It is doc-only and in-phase. `phase_base_sha` stays
   `1d39b8fd`. The orchestrator captures the amendment commit SHA as the task 7 Red base, after
   the commit lands. The task 7 Red diffs from that commit. No Red edit happens before it lands.
8. The second security remediation amendment (`docs(measure): plan Storytime Phase 2 second
   security remediation`) lands after `84c8ffdb`. It is doc-only and in-phase. `phase_base_sha`
   stays `1d39b8fd`. Immediately after the strategy commit lands, the orchestrator runs
   `git rev-parse HEAD` and captures that commit SHA as the immutable task 8 Red base. This capture
   happens before any Red edit or commit. The task 8 Red diffs from that captured commit.
9. The decoded-value strategy commit lands before task 9 Red starts. Immediately afterward, the orchestrator runs `git rev-parse HEAD`.
   Record that committed value as the immutable task 9 Red base. Do not use the pre-strategy `role_base_sha` as this base.
   The immutable Phase 2 `phase_base_sha` remains the existing committed-strategy baseline `1d39b8fd`.
   If the orchestrator opens a separate phase run, capture its `phase_base_sha` immediately after this strategy commit instead.
   Capture either new base before any Red edit or commit. This strategy embeds no new pre-commit SHA as that base.
10. The decoded-layer strategy commit lands before task 10 Red starts. Immediately afterward, the orchestrator runs `git rev-parse HEAD`.
    Record that committed value as the immutable task 10 Red base. Do not use `53cc3ada` or any earlier SHA as this base.
    The immutable Phase 2 `phase_base_sha` remains `1d39b8fd`.
    If the orchestrator opens a separate phase run for task 10, capture that `phase_base_sha` immediately after this strategy commit.
    Capture the new base before any Red edit or commit. This strategy embeds no SHA for that base.
11. The token-layer strategy commit lands before task 11 Red starts. Immediately afterward, the orchestrator runs `git rev-parse HEAD`.
    Record that committed value as the immutable task 11 Red base. Do not use `3f604b62` or any earlier SHA as this base.
    The immutable Phase 2 `phase_base_sha` remains `1d39b8fd`.
    If the orchestrator opens a separate phase run for task 11, capture that `phase_base_sha` immediately after this strategy commit.
    Capture the new base before any Red edit or commit. This strategy embeds no SHA for that base.
12. The Phase 3 strategy commit lands before the Phase 3 Red starts. Immediately afterward, the orchestrator runs `git rev-parse HEAD`.
     Record that committed value as the immutable Phase 3 `phase_base_sha`. Do not use `455d2c1d` or any earlier SHA as this base.
     The immutable Phase 2 `phase_base_sha` remains `1d39b8fd`.
     Capture the new base before any Red edit or commit. This strategy embeds no SHA for that base.
     Section 3.12 holds the same rule for the Phase 3 base.
13. The Phase 4 strategy commit lands before any Phase 4 Red, staging commit, or Muse call that
    lands in git. Immediately afterward, the orchestrator runs `git rev-parse HEAD` and records that
    committed value as the immutable Phase 4 `phase_base_sha`. `60892a38` is the `role_base_sha`
    only. Section 7, subsection 4.9, holds the full rule. This strategy embeds no SHA for the base.
14. The Phase 5 strategy commit lands before any Phase 5 maker edit or commit. Immediately afterward,
    the orchestrator runs `git rev-parse HEAD` and records that committed value as the immutable
    Phase 5 `phase_base_sha`. `91c59500` is the `role_base_sha` only. Section 7, subsection 5.10,
    holds the full rule. This strategy embeds no SHA for the base.
