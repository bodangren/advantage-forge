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

Risk class: **high**. Phase 3 has the first real renders, the first real line-art pass, new
assets, three human gates, and the 2026-11-01 date.

Plan task order: (1) Nan window sample, (2) assets, (3) 16 twin renders, (4) checks and model
pre-checks, (5) person counts and line-art looks, (6) delivery.

- Red and Green: use `RED_TEST_COMMAND` and `GREEN_TEST_COMMAND` for any pipeline change. A new
  asset uses the Forge asset loop and `./forge check`, not this test file.
- Task 1 (Nan window sample) is the first live render proof for both twins. Phase 2 tasks 5 and 6
  must be complete first. The sample uses the v2 stage (RA-P3-1) and existing approved items only.
  Render it with `render --job w01-readalong-p05 --version 2` through `heavy-run.sh`. Then run
  `verify --job <id>` on the real files. Live proof passes only if all items below are true:
  - the color file passes the color structural checks (size, opaque, 8-bit, sRGB);
  - the line-art file passes T28 to T32 on real bytes, with the ink share printed as a value;
  - one evidence record binds both files with one stage hash, one time, and one camera;
  - the render log has the T53 labels `camera state drift: 0` and `color repeat identical: yes`;
  - the plan note quotes both paths and both SHA-256 values, and the report goes to the PM;
  - the plan note states that the color picture shows Nan's face and white star, the window panes,
    and the fern. It also states that no existing item shows the plant in a pot.
- The style look record for the sample has `lineArtTechnique` and `lineArtFormatVersion` from the
  sample evidence (contract "Line-art review and release").
- Task 1 becomes `[b] deferred:daniel-lineart-look` after the report goes to the PM. Continue
  with task 2 and later tasks while it waits. No line-art twin becomes `ready` before the style
  look record passes. If Daniel rejects the look, color work continues. The line-art pass gets a
  new technique version, and the sample runs again.
- Task 2 (assets): the PM approval of the week 1 asset list is recorded in `b63755bc`. No deferral
  applies now. Cast rules from that entry apply: describe hair and clothes only.
- Task 3: 16 color and 16 line-art files, one twin pair per render run. Preflight and lock per batch.
- Task 4: automated checks on all 32 files, two model pre-checks per color candidate, one paid call
  at a time, Kimi after a quota check. A failed picture gets a new twin version. Old files stay.
- Task 5 becomes `[b] deferred:daniel-or-named-reviewer` when the count review and the line-art
  look go to the PM. It stays blocked until 16 color person logs and 16 line-art person looks
  exist. If they are missing on 2026-10-31, report to the PM.
- Task 6: apply picture spec v1 to the line art if it arrived. Else label the line art provisional.
- Closeout gate: `verify --release --week 1` exits 0 and prints
  `Verification passed for 16 jobs with release evidence`. If the style look is still pending,
  `verify --release --week 1 --output color` must exit 0, and the plan records the line-art gate
  as open. An independent `sha256sum` matches each manifest file hash. The ledger has equal
  `before-call` and `after-call` counts.

### Phase 4: Remaining pictures and cover

Risk class: **medium**. The gates exist after Phase 3. The cover calm-region check and the volume
of 96 pictures are the new risks.

- Task 1 becomes `[b] deferred:workbooks-via-pm` at Phase 4 start if the final picture list (due
  2026-10-28) is missing.
- Task 1 also applies picture spec v1 to the line art. Use `RED_TEST_COMMAND` for each new
  line-art rule (size, color depth, line weight). A rename changes only names and records the old
  name. A format change needs a new `lineArtFormatVersion` and a new twin render.
- Use `RED_TEST_COMMAND` for a size or crop change from the final list. Record each resize or crop.
- Weeks 2 to 7 get 96 line-art twins with the same line-art gates.
- If spec v1 sets a larger print size or the A3 ratio (about 1.414:1), render the pages again from
  the kept stage files as new versions (T41). A new ratio changes the framing, so all picture
  gates apply again to each new version.
- Person counts and line-art looks become `[b] deferred:daniel-or-named-reviewer` when they are
  the only missing evidence.
- Treat `verify` and `sheet` on more than 16 pictures as heavy. Run them under the preflight and the lock.
- Closeout gate: `verify --release` for 112 pages, their 112 line-art twins, and the cover exits 0.
  The manifest has no `failed` or missing release candidate.

### Phase 5: Documentation and verification

Risk class: **low**.

- Closeout gate: `./measure/generate.sh`, then `./measure/doctor.sh` exits 0.
- The plan, metadata, and registry use the evidence classes. No text says "accepted" or "done"
  for a picture that has only automated or model evidence (A5, A6).

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
| Review B (security) | Applies: output path escape, symlinks, process arguments, no API keys in raw output or ledger, Workbooks read-only. The capture page server listens on localhost only and serves only the stage file and repository assets. The `window.__bookStill` hook holds no secret and exists only in the local song page. Review B failed at `c2353433` (RB-01 to RB-05). Task 7 corrects the findings. Review B failed again at `84c8ffdb` (RB2-01 to RB2-04). Task 8 requires Review B on its HEAD with T88 to T95. | Applies: raw outputs and ledger contain no keys. | Applies, same as P3. | Not applicable. |
| Review C (UX and API) | Applies: CLI commands, flags, exit codes (`2` for a pre-check fail), `--output`, the provisional line-art name, the `window.__bookStill` shape, the `lineart-smoke` command, and the manifest schema with output kinds that Workbooks reads. From task 7: the calibration refusal in `verify --release`, the `--raw` and `--reason` refusals, and the wrapper invocation. From task 8: final CLI errors, decoded-field refusal timing, and the Unicode reason limit. Review C runs on the task 8 HEAD. | Applies: the manifest and contact sheet handoff, and the sample report to the PM. | Applies: final list and spec v1 reconciliation. | Not applicable. |
| Adversarial testing | Required: the task 5, task 7, and task 8 mutations in the closeout gate, release gate bypass, version overwrite, path escape, `w08`, ledger order, hold handling, a grey pixel, a twin mismatch, a lone color file, a name collision, a `wireframe: true` mutation, a removed restore line, a camera read after the pass, and the Red mutation list. | Required: tamper a file and expect a hash failure. Change one line-art pixel to 128 and expect a failure. | Recommended on the cover check and the spec v1 rename. | Not applicable. |
| UX browser review | Not applicable: no UI. The smoke runs are live render proofs. Smoke run 6 also proves middleware refusal, not browser UX. | Not applicable: model pre-checks, person counts, line-art looks, and Daniel's style look review the pictures. | Not applicable. | Not applicable. |

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
