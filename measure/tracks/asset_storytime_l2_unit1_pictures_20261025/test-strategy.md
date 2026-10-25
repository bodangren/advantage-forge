# Test strategy: Storytime Level 2 unit 1 book pictures

Revision: written at `9667438f` for "Phase 2: Tests and calibrated model pre-checks" (P2).
Amended at `b63755bc` for the line-art twins and the A3 teacher print (Daniel's PM relays of
2026-10-25, about 21:10 and 21:25 ICT).
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
  another way, or it needs a song-engine change (section 8).

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
  record the model that the provider reports, or label the value as declared (A5).

## 3. Heavy-job and gate command rules

These rules apply to every role and subagent in this track.

- Heavy jobs: vitest, tsc, Playwright or Chrome, vite, and Forge renders.
- The orchestrator runs `sh /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-preflight.sh`
  as a separate step just before each gate. Exit 1 with a `hold` line stops the gate. Record
  `status: blocked` with the hold line. A hold is never a Red result.
- The gate command does not contain the preflight. Thus a hold cannot appear in gate output.
- Every heavy command runs under `flock /home/daniebo/Desktop/primary-parity-progress/heavy.lock`.
  Never delete the lock file. Report a lock wait over ten minutes to the PM in one line.
- Use `node_modules/.bin/vitest` and `node node_modules/typescript/bin/tsc`. Do not use pnpm.
- Vitest runs the changed test files only, with `--maxWorkers=1`.
- This strategy role ran no heavy job.

### RED_TEST_COMMAND

```sh
flock /home/daniebo/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1
```

### GREEN_TEST_COMMAND

```sh
flock /home/daniebo/Desktop/primary-parity-progress/heavy.lock node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1
```

Green then runs the type check. Run the preflight again first if more than five minutes passed.

```sh
L=measure/runs/asset_storytime_l2_unit1_pictures_20261025/green-tsc.log
flock /home/daniebo/Desktop/primary-parity-progress/heavy.lock node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json > "$L" 2>&1; echo "tsc exit: $?"
echo "owned tsc errors: $(grep -cE '^(src/storytime/|scripts/storytime-book-pictures\.ts|tests/storytime-book-pictures\.test\.ts)' "$L")"
echo "baseline tsc errors: $(grep -c 'error TS' "$L")"
```

If Green changes any file in `src/song/`, add `tests/song-timeline.test.ts` to the vitest command.

## 4. Phase 2 gates

Risk class: **high**. Task 3 makes paid calls. Task 1 and task 2 define the release gate, the
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
  pass itself gets its first live proof in the Phase 3 Nan sample.
- `git diff --quiet 1d39b8fd -- src/song` exits 0. A song-engine change is outside task 2. If
  Green needs one, Green stops and reports (section 8).
- Green commits only the three owned source and test paths, with explicit paths. A new page
  module for the book still lives under `src/storytime/`. No new HTML file goes in the repo root.

### Task 3: Calibration gate (live provider proof)

Task 3 is an operation, not a code task. It is the first live proof of the provider path.

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
- MiniMax quota was 94% for the interval and 89% for the week at plan time. Check it again.
- Expected verdicts: `bad-one-sun` fails on both providers. `good-nan` passes on both providers.
- Gate evidence, checked read-only by the acceptance role:
  - four calibration logs with `verdict`, `rawOutput` with more than 0 characters, `rubricVersion`
    equal to `PICTURE_RUBRIC_VERSION`, and `fileSha256` equal to `sha256sum` of the source image;
  - `before-call entries: 4` and `after-call entries: 4` in `cost-ledger.jsonl`, with matching
    `callId` values, and each `before-call` time before its log `checkedAt` time;
  - the plan task note quotes the four verdicts and the two counts as labeled values.
- Calibration failure: if either picture gets the wrong verdict, mark task 3 `[b]`. Correct the
  rubric or the call under a new `rubricVersion`. Run all four calls again. Stop after two
  failed rounds and report to the PM.
- A calibration pass calibrates the model pre-check only. It is not acceptance of any picture.

### Phase 2 closeout gate

- Run the preflight, then `GREEN_TEST_COMMAND` and the type check again on the final commit.
- The task 3 evidence above is complete. The adversarial mutations from the Red log ran, and
  each mutation made at least one test fail.
- `git status --short -- src/storytime scripts/storytime-book-pictures.ts tests/storytime-book-pictures.test.ts`
  prints nothing.
- Run `./measure/generate.sh` after the plan status changes (A10).

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
| T22 | A real `render` refuses to start without four calibration logs with the expected verdicts. | a render starts before calibration passes ("A failed calibration blocks production"). |
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

T25 is in scope for Red. Kimi pre-checks apply to color candidates only.

## 7. Later phases

### Phase 3: Week 1 pictures

Risk class: **high**. Phase 3 has the first real renders, the first real line-art pass, new
assets, three human gates, and the 2026-11-01 date.

Plan task order: (1) Nan window sample, (2) assets, (3) 16 twin renders, (4) checks and model
pre-checks, (5) person counts and line-art looks, (6) delivery.

- Red and Green: use `RED_TEST_COMMAND` and `GREEN_TEST_COMMAND` for any pipeline change. A new
  asset uses the Forge asset loop and `./forge check`, not this test file.
- Task 1 (Nan window sample) is the first live render proof for both twins. It uses existing
  approved items only. Run the preflight, then render the one job under the lock. Then run
  `verify --job <id>` on the real files. Live proof passes only if all items below are true:
  - the color file passes the color structural checks (size, opaque, 8-bit, sRGB);
  - the line-art file passes T28 to T32 on real bytes, with the ink share printed as a value;
  - one evidence record binds both files with one stage hash, one time, and one camera;
  - the plan note quotes both paths and both SHA-256 values, and the report goes to the PM.
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

- Node-side modules in `src/storytime/` import `src/song/timeline.ts` (pure) only. They never
  import `src/song/main.ts`.
- A browser-side book-still page module under `src/storytime/` may load the song page module
  unchanged in Chrome. It must not copy scene-building code from `src/song/main.ts`.
- The line-art pass is a render pass of the same scene and camera, with a threshold to 1-bit. A
  filter of the color PNG alone is not allowed (contract "Source and technique").
- `git diff --quiet 1d39b8fd -- src/song` exits 0 at every Phase 2 gate. If the pass cannot reach
  the scene and camera without a song-engine edit, Green stops and reports. The orchestrator then
  adds a separate engine-hook task with `tests/song-timeline.test.ts` in its gate and a PM note.
- `playwright` and `vite` load lazily inside the capture function only.
- Provider processes start with an argument array. No shell string.
- Phase 2 does not change `src/song/`, `scripts/song-record.ts`, `scripts/heavy-lock.ts`, the
  preflight script, Workbooks, or the monorepo. An engine change for stills needs its own task,
  `tests/song-timeline.test.ts` in the gate, and a PM note.
- No change to `assets/fireball.ts` or `out/fireball/`.

Changed-contract risks:

- The song engine serves future song videos. A still-mode change can break them.
- `scripts/heavy-lock.ts` and the preflight are shared with the monorepo. Do not change them.
- Workbooks reads `manifest.json`. A field change after week 1 delivery needs a PM notice.
- A `rubricVersion` change makes earlier calibration invalid. Calibrate again.
- A source package change makes `jobs.json` invalid. Plan again and keep the old pictures.
- The `mmx vision describe` argument shape can change with the CLI. Run `mmx vision --help`
  (no paid call) before task 3.
- The line-art format is provisional. Picture spec v1 (due 2026-10-28) can change the size, color
  depth, line weight, and name. The `-lineart` suffix and the `lineArtFormatVersion` field keep
  the change traceable. The color contract stays as it is.
- The line-art pass adds GPU and memory load to each render run. The render stays one heavy job
  under one preflight and one lock.
- The provisional limits (90, 0.5, and 25 percent) are not yet checked on a real render. The Nan
  sample is the first check. A limit change needs a contract change and a new format version.

## 9. Anti-pattern coverage

| Class | Phases | Defense | Falsification |
| --- | --- | --- | --- |
| A2 consent-blind publish gate | P2, P3, P4 | The release gate requires a person log with a named `checkedBy` and a person evidence class (T17). Line art also requires a person look and Daniel's style look (T36). | A model-only candidate or a line-art twin without the style look becomes `ready`. |
| A3 digit-only count | P2 to P5 | Exact labeled counts: `112`, `16` per week, `Tests  N passed (N)`, `owned tsc errors: 0`, ledger counts, the labeled ink share (T1, T14, T32). | A test passes on any digit or a count above 0. |
| A4 vacuous pass | P2 to P4 | Empty selections fail (T18, T37). An all-white line-art page fails (T32). A vitest run with 0 tests fails. Red needs `n >= 1` failures. | An empty manifest, an empty page, or an empty run passes. |
| A5 false claim | P2 to P5 | Plan notes quote the command, exit code, and labeled values. The model name is reported or labeled as declared. | A plan claim disagrees with the quoted output. |
| A6 registry overstatement | P3 to P5 | `tracks.md` and metadata use evidence classes. A model pass is "model pre-check". | Registry text says "accepted" with no person log. |
| A7 over-broad filter | P2 | The parser excludes no words (T14). The owned-error grep matches path prefixes, not words. No `vitest -t` filter hides a failing test. The binary check has no tolerance (T29). | "FAIL: no sun" parses as a pass, a filter drops a real error, or a pixel of 254 counts as white. |
| A9 archived track paths | P2, P5 | Tests reference no `measure/tracks/` path. | `grep -n 'measure/tracks/' tests/storytime-book-pictures.test.ts` prints a line. |
| A10 generated-facts drift | P2 to P5 | Run `./measure/generate.sh` after each plan status change. Run `./measure/doctor.sh` at P5. | `doctor.sh` reports stale generated facts. |

A1 and A8 are retired. Project candidates for a future `measure/anti-patterns.md`: (S1) a model
pass treated as acceptance; (S2) a preflight hold read as a Red failure; (S3) a version overwrite;
(S4) a glob loader that reads `w08`; (S5) a twin output made in a separate run, which can drift
from its color twin.

## 10. Reviews and evidence classes

| Review | P2 | P3 | P4 | P5 |
| --- | --- | --- | --- | --- |
| Review B (security) | Applies: output path escape, symlinks, process arguments, no API keys in raw output or ledger, Workbooks read-only. The capture page server listens on localhost only and serves only the stage file and repository assets. | Applies: raw outputs and ledger contain no keys. | Applies, same as P3. | Not applicable. |
| Review C (UX and API) | Applies: CLI commands, flags, exit codes (`2` for a pre-check fail), `--output`, the provisional line-art name, and the manifest schema with output kinds that Workbooks reads. | Applies: the manifest and contact sheet handoff, and the sample report to the PM. | Applies: final list and spec v1 reconciliation. | Not applicable. |
| Adversarial testing | Required: release gate bypass, version overwrite, path escape, `w08`, ledger order, hold handling, a grey pixel, a twin mismatch, a lone color file, a name collision, and the Red mutation list. | Required: tamper a file and expect a hash failure. Change one line-art pixel to 128 and expect a failure. | Recommended on the cover check and the spec v1 rename. | Not applicable. |
| UX browser review | Not applicable: no UI, no render. | Not applicable: model pre-checks, person counts, line-art looks, and Daniel's style look review the pictures. | Not applicable. | Not applicable. |

Evidence classes:

- **Automated (artifact and logic):** the vitest suite with injected dependencies. It proves logic
  and file contracts. It proves no real render and no real provider call.
- **Live behavior:** Phase 2 task 3 proves the real provider path. The Phase 3 Nan sample proves
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
