# Test strategy: Storytime Level 2 unit 1 book pictures

Revision: written at `9667438f` for "Phase 2: Tests and calibrated model pre-checks" (P2).
Amended at `b63755bc` for the line-art twins and the A3 teacher print (Daniel's PM relays of
2026-10-25, about 21:10 and 21:25 ICT). Amended at `f271dce6` for the still engine hook task,
after the section 8 guardrail fired in Green. Amended at `5ffdbf6e` for the Review A remediation
(Phase 2 tasks 5 and 6). Amended at `c2353433` for the Review B security remediation (Phase 2
task 7). Amended from `84c8ffdb` for the second security remediation (Phase 2 task 8).
The [specification](./spec.md), [plan](./plan.md), and [contract](./contract.md) own scope and
gates. This file owns test commands, gates, fixtures, and review applicability.

## 1. Inputs and gaps

- Inputs read: `measure/index.md`, `measure/tracks.md`, `spec.md`, `plan.md`, `contract.md`,
  `metadata.json`, `src/song/timeline.ts`, `src/song/main.ts`, `scripts/song-record.ts`,
  `scripts/heavy-lock.ts`, and `advantage-pr/scripts/jobs/heavy-preflight.sh`.
- Gap: `measure/anti-patterns.md` does not exist in this repository. This strategy uses the
  starter catalog `~/.agents/skills/measure-orchestrator/references/anti-pattern-catalog.md`.
  A1 and A8 are retired there. Section 9 lists project candidates for a future local catalog.
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

## 4. Phase 2 gates

Risk class: **high**. Task 3 changes the shared song engine. Task 4 makes paid calls. Task 5
repairs the production capture path and the release rule for line art. Task 6 makes two paid
calls and changes the ledger. Task 7 closes four high and one medium security finding in the
wrapper, the capture server, the smoke writer, the provider evidence, and the release gate. Task 8
closes three high security findings and the real-path, character-limit, and provenance findings.
Task 1 and task 2 define the release gate, the
output isolation, and the heavy-job order. A defect there allows a false release later.

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
  documentation proof, not live behavior proof. The Phase 3 Nan sample proves
  the real capture, the line-art pass, both formats, and the twin binding under the lock.
- **Model pre-check:** MiniMax and Kimi logs on color candidates. Never acceptance.
- **Person-checked or owner-passed:** person logs and line-art looks from Daniel or his named
  reviewer, and Daniel's style look relayed by the PM.

## 11. Aggregate suite

- Do not run the full `vitest run` or `pnpm test` in this track. Only the focused file runs.
- Failures in other suites and baseline tsc errors are known and outside this track. Record them
  in `known_failures`. They do not block a focused gate. Do not fix them here.
- No test in this track is intentionally red after Red. A red test after Green blocks the phase.

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
