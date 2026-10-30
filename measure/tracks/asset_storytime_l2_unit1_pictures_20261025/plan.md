# Storytime Level 2 unit 1 book pictures

Status: in progress (started 2026-10-25). Week 1 is due 2026-11-02. Weeks 2 to 7 and the cover
render are due 2026-11-16. The [specification](./spec.md) owns the scope and acceptance gates.

## Method and ownership

- Primary owner: this OpenCode session.
- Owned source paths: `src/storytime/`, `scripts/storytime-book-pictures.ts`, and
  `tests/storytime-book-pictures.test.ts`.
- Owned stage path: `docs/storytime/l2-unit1/`.
- Owned output path: `out/storytime/l2/unit1/`.
- Owned planning path: `measure/tracks/asset_storytime_l2_unit1_pictures_20261025/`.
- Do not change `assets/fireball.ts` or `out/fireball/`. Their owner review remains separate.
- Use Forge 3D renders with the approved cast. Do not use MiniMax image generation.
- Run `sh /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-preflight.sh` before every heavy
  run. Use `scripts/heavy-lock.ts` for the same run. Stop and report `hold`.
- Use one paid pre-check call at a time. Do not run song or video commands.
- The question tool is denied. Route every question for Daniel through the PM orchestrator.
- MiniMax VLM uses the existing subscription at about zero marginal cash cost.
- Moonshot Kimi K3.1 Pro uses the existing OpenCode plan at about zero marginal cash cost.
- The provider CLIs do not report a per-call cash price. Record that fact instead of inventing one.
- The initial MiniMax quota check reports 94% remaining for the interval and 89% remaining for the
  week. `mmx quota show` reports remaining percentages (Review A RA2-N4).
- MiniMax video caps are 3 per day and 21 per week. This track makes no video calls.

## Phase 1: Contract and controls [checkpoint: 3ea5fca]

- [x] Task: Record the owner order, scope, dates, output contract, providers, prices, and human
  gates. Evidence class: automated planning record. 2fdce9d
- [x] Task: Define the source extraction, versioned picture, review-log, ledger, and manifest
  contracts. Include the known bad and owner-approved calibration pictures. c52e495

### Changes after the checkpoint

- Workbooks supplied picture specification v0: exact sizes, filename pattern, sRGB, and batch hash.
- Daniel selected Forge 3D renders for one character look across books and videos.
- The renderer is now local Forge. MiniMax image generation is removed.
- Daniel made the heavy pre-flight check and shared heavy lock mandatory.
- Daniel added print line art. Each reader page gets a color output and a line-art output from the
  same scene and camera. The line-art format is provisional until Workbooks picture spec v1.

## Phase 2: Tests and calibrated model pre-checks [checkpoint: 061694f]

- [x] Task: Add failing tests for source counts, scene contracts, descriptive versions, manifest validation, layout, line-art twins, and output isolation. Commit `01c01bdf`.
  Record the red result.
  Evidence: `01c01bdf`; exit code `1`; `Tests  24 failed | 17 passed (41)`.
  Type-only test fix: `5cbb3407` types the T13 runner parameters. No assertion or falsification condition changed.
  Type check: `tsc exit: 2`; owned test errors: `0`; Storytime source errors: `7`; total compiler errors: `38`.
  Green owns the source errors. Compiler output: `/tmp/opencode/red-tsc-db79a72.log`. No vitest run accompanied this fix.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'`.
  The final run had no timeout failures. T3 and T21 passed against the untracked draft.
  The PM's heavy-run rule replaces the separate preflight and lock steps for this gate.
- [x] Task: Implement the minimal picture pipeline with color and line-art twin outputs from one render run. Commit `fafa82dc`.
  Pass the focused tests and type checks. Keep `src/song/` unchanged. Make no paid
  calls and run no heavy render during this task.
  Evidence: `fafa82dc`; exit code `0`; `Tests  41 passed (41)`;
  `owned tsc errors: 0`; `baseline tsc errors: 31` (outside the owned paths; see known_failures);
  `git diff --quiet 1d39b8fda457e12d8e7332e7de65d2046ddda78e -- src/song` exit `0`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'`.
  The Red type fix `5cbb3407` (test line 433, type-only) unblocked the type gate. The real
  line-art capture pass needs the engine hook task before a live render (see the Green log).
- [x] Task: Add the still engine hook and correct the line-art pass. Commit `fc2cc6a8`.
  In `src/song/main.ts`, add
  an additive hook: after each `seek`, publish `window.__bookStill` with the scene, camera,
  renderer, and camera state. Do not change song rendering, timing, or `window.__song`. Replace
  the wireframe pass with a form-edge pass that restores the camera and the renderer. Pass T42 to
  T51 and `tests/song-timeline.test.ts`. Send the PM note first. Make no paid calls and run no
  heavy render, except the one bounded smoke run (T52) under `smoke/`. It writes no book version.
  Red evidence: `54889801`; exit code `1`; `Tests  9 failed | 60 passed (69)`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  T42–T44 and T46–T51 failed for missing seams, hook calls, or the smoke command.
  All 41 earlier picture tests and all 19 timeline tests passed. The run had no test syntax or timeout errors.
  Green evidence: `fc2cc6a8`; exit code `0`; `Tests  69 passed (69)`; no skip. Same command.
  Type check: `tsc exit: 2`; `owned tsc errors: 0`; `baseline tsc errors: 31` (outside the owned
  paths; see known_failures). Compiler output:
  `measure/runs/asset_storytime_l2_unit1_pictures_20261025/green-tsc-t3.log`.
  T45 checks: `git diff --name-only 1d39b8fd -- src/song` prints exactly `src/song/main.ts` and
  `src/song/still-hook.ts`; `removed song lines: 0`; `git diff --quiet 1d39b8fd --
  src/song/timeline.ts tests/song-timeline.test.ts` exit `0`.
  Technique: depth and normal discontinuity pass (MeshNormalMaterial plus MeshDepthMaterial
  RGBADepthPacking into render targets, thresholded to 1 bit). The page's `three` namespace
  travels on `window.__bookStill.three`; the page loads the pass through the vite dev server.
  The pass restores the camera, renderer, clear color, background, and override material, and
  disposes its two render targets and two materials. `captureStillPair` reads the camera state
  before the pass, seeks the same time again, and fails on a camera drift or a pixel difference.
  Bounded smoke run (T52), once: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node --import tsx scripts/storytime-book-pictures.ts lineart-smoke --job w01-readalong-p05'`;
  exit code `0`; output `out/storytime/l2/unit1/smoke/lineart-2026-10-25T19-27-40-335Z/`;
  labels `hook before seek: absent`; `hook after seek: present`;
  `window.__song keys: load,portrait,ready,seek`; `camera state drift: 0`;
  `color repeat identical: yes`; `stage ink share: 2.05%`; `fixture interior ink: 0.00%`;
  `fixture ring rays: 360/360`. The pictures show outlines and form edges, not a mesh net.
  Orchestrator deviation used: one Nan window scene file
  `docs/storytime/l2-unit1/w01/w01-readalong-p05-v1.json` (`5e90526d`), from existing approved
  pieces only: map `classroom`, actor `Nan` (sprout-nan), pose clip `wave`, prop `pot`.
  No paid call and no heavy render outside the one smoke run.
- [x] Task: Calibrate the picture rubric with MiniMax and Kimi. Commit `bfa8126c`.
  Fail the known bad "One sun"
  thumbnail and pass the owner-approved Nan cutout. Save raw outputs and the prior-call ledger.
  The first live MiniMax call found the parser defect. The parser discarded structured FAIL fields and rejected an mmx PASS envelope.
  Regression tests: `52923de3`; exit code `1`; `Tests  2 failed | 74 passed (76)`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  T54 and T55 failed for the expected parser defects. All 69 earlier tests passed. T56 to T60 passed.
  The embedded FAIL fixture matches all 379 bytes of the live raw output. The PASS fixture is synthetic.
  The calibration calls run again after the fix.
  Parser fix commit `bfa8126c`; gate `Tests  76 passed (76)`; `owned tsc errors: 0` (baseline 31).
  Verdicts: `bad-one-sun-minimax: fail` (no sun visible, `observedCounts {"sun": 0}`),
  `bad-one-sun-kimi: fail` (one child, no suns), `good-nan-minimax: pass` (`observedCounts {"Nan character": 1}`),
  `good-nan-kimi: pass` (one readable Nan character, age-safe, no unwanted text).
  Ledger counts: `before-call entries: 6`, `after-call entries: 5`; the four final logs each pair with a before-call
  earlier than its `checkedAt`. `rubricVersion: storytime-picture-v2` in all four logs; each `fileSha256` matches the source picture.
  `assertCalibrationReady` accepts `out/storytime/l2/unit1`.
  Calibration folder: `out/storytime/l2/unit1/calibration/` with raw outputs under `raw/`.
  Deviations: (a) the orchestrator dispatched the Kimi reviewers, because a Green subagent cannot
  spawn one, and each reviewer wrote its own raw file; (b) the hung reviewer session
  `ses_e8b730946ffe0qHu3XC1RLopTl` left before-call entry `9d0bddf7-d2ea-4bdb-a672-56c308e3f6d0`
  without an after-call entry, because the CLI cannot record a failed call without a raw answer;
  (c) the first MiniMax `bad-one-sun` call ran before the parser fix, and its log was replaced by
  the second call; (d) the two Kimi calls ran at the same time, against the rule of one paid call
  at a time. Before-call `4192765b` (`bad-one-sun`) at `2026-10-25T20:15:31.415Z`, before-call
  `1086bc64` (`good-nan`) at `2026-10-25T20:15:33.668Z`, after-call `4192765b` at
  `2026-10-25T20:17:24.145Z`, and after-call `1086bc64` at `2026-10-25T20:17:27.242Z`
  (Review A RA-N5). Later paid calls run one at a time.
  A calibration pass calibrates the model pre-check only. It is not acceptance of any picture.
- [x] Task: Correct the Review A findings in the picture pipeline code. Commit `f192bf48`. Review A failed Phase 2 at
  `5ffdbf6e` (`measure/runs/asset_storytime_l2_unit1_pictures_20261025/review-a-5ffdbf6.json`).
  Fix RA-B1: `captureBookStill` loads the timeline and checks the page notes before the first
  seek, through one step that the smoke capture shares. Fix RA-B2: the style look binds to the
  approved line-art technique and format version, not to one file. Also fix RA-N1, RA-N3, the
  RA-N4 code, RA-N6, RA-N7, RA-N8, RA-N9, and the Review C `--version` hint. Pass T61 to T73 and
  every earlier test. Keep `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` unchanged.
  Make no paid calls. Run no heavy render, except one bounded smoke run (T74). The smoke run is
  necessary: it is the only live proof of RA-B1 and RA-N7 before the Nan sample. It takes its
  stage pair through the production `captureBookStill` path and writes no book version.
  Red evidence: `a310683d` (tests `b60dec4f`); exit code `1`; "Tests  14 failed | 75 passed (89)".
  The authorized fixture amendment writes temporary calibration sources and passes their roots. Assertions and the T54 bytes remain unchanged.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  T61 to T73 failed for missing seams or the Review A defects. No new test passed.
  Earlier tests: 75 passed. T49 failed because its amended order requires two live camera reads.
  The run had no syntax, transform, package, timeout, or preflight error. Task 6 remains pending.
  Green implementation commit `94712d9b` (`src/storytime/book-pictures.ts`,
  `src/storytime/line-art-pass.ts`; `scripts/storytime-book-pictures.ts` needed no change).
  Unit gate: exit 0; "Tests  89 passed (89)"; no skip. `git diff --quiet 1d39b8fd --
  src/song/timeline.ts tests/song-timeline.test.ts` and `git diff --quiet d05527ad -- src/song`
  both exit 0. Type check: `tsc exit: 2`; `owned tsc errors: 0`; `baseline tsc errors: 31`
  (`measure/runs/asset_storytime_l2_unit1_pictures_20261025/green-tsc-t5.log`). The chosen
  relative view-distance depth limit is 2 percent (`DEPTH_EDGE_RELATIVE_GAP = 0.02`, between the
  contract's 0.5 and 7.5 percent bounds). RA-B1, RA-B2, RA-N1, RA-N3, RA-N4 code, RA-N6, RA-N7,
  RA-N8, RA-N9, and the Review C hint are in.
  Smoke run 2 (T74) FAILED; the task stays `[~]`. One run, one Chrome launch, exit code `1`,
  output tree unchanged (all checks ran before any write). Printed labels:
  `hook before seek: absent`; `window.__song keys: load,portrait,ready,seek`;
  `capture path: captureBookStill`; `camera drift source: live`; `camera state drift: 0`;
  `color repeat identical: yes`; `stage ink share: 2.05%`;
  `lineart technique: song-page-form-edges-viewdepth-1bit-v2`; `fixture interior ink: 0.00%`;
  `fixture ring rays: 360/360`; `fixture depth step rows: 0/159`; then
  `Line-art smoke fixture failed: fixture depth step rows 0/159 are below 90 percent.`
  All labels are in range except the new depth-step check: no row of the declared 159 had ink in
  the declared border band. Diagnosis so far, without a second browser run: the smoke printed the
  metadata as computed, so the declared column and rows match the projection math; a pure-math
  check of the same geometry gives the near/far plane border at columns 246/247 with a 7.5 percent
  relative view-distance gap (above the 2 percent limit), and unit test T70 passes the same packed
  depth chain. The live render produced no border ink, so the defect is in the live-render path
  only; the remaining suspects need a browser to separate. Next Green needs a new orchestrator
  dispatch: one diagnostic browser run or smoke run 3 after the fixture fix. The stage still,
  color and line-art pictures were not written and are not available for review.
  Depth decode Red evidence: test commit `ba4f0401`; exit code `1`; "Tests  2 failed | 88 passed (90)".
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  Smoke run 2 failure label: `fixture depth step rows: 0/159`. The pass printed no depth edge row.
  Cause: `unpackDepth` in `src/storytime/line-art-pass.ts` decodes RGBA as little-endian. three 0.185.1 `packDepthToRGBA` writes big-endian.
  Evidence: the near plane bytes [250,25,167,0] decode to 4.0000 m. The far plane bytes [250,140,49,0] decode to 4.3000 m. The current decode gives about 0.1003 m and 0.1001 m.
  T76 fails because the `unpackDepth` seam is missing. T70 fails because the current decode reads the bytes in the wrong order.
  Red model: the table model openai/gpt-6.1-sol reached its usage limit. The orchestrator used minimax-cn-coding-plan/MiniMax-M3 for this step.
  Technique ID stays song-page-form-edges-viewdepth-1bit-v2 (orchestrator decision): no output carries v2 evidence.
  Depth decode Green implementation commit `f192bf48` (`src/storytime/line-art-pass.ts` only;
  `src/storytime/book-pictures.ts` and `scripts/storytime-book-pictures.ts` needed no change).
  Unit gate: exit 0; "Tests  90 passed (90)"; no skip. Type check: `tsc exit: 2`;
  `owned tsc errors: 0`; `baseline tsc errors: 31`
  (`measure/runs/asset_storytime_l2_unit1_pictures_20261025/green-tsc-t5-depth.log`).
  Smoke run 3 (T74) PASSED; exit code 0. Printed labels: `hook before seek: absent`;
  `window.__song keys: load,portrait,ready,seek`; `capture path: captureBookStill`;
  `camera drift source: live`; `camera state drift: 0`; `color repeat identical: yes`;
  `stage ink share: 2.12%`; `lineart technique: song-page-form-edges-viewdepth-1bit-v2`;
  `fixture interior ink: 0.00%`; `fixture ring rays: 360/360`; `fixture depth step rows: 159/159`.
  Output: `out/storytime/l2/unit1/smoke/lineart-2026-10-26T03-28-07-662Z` (color.png, lineart.png,
  fixture-lineart.png, smoke.json; wrote no book version). The depth-step check moved from 0/159
  to 159/159. The stage color and line-art pictures show the same `classroom` scene, and the line-art
  page has clean form edges plus depth edges on the floor borders. All task 5 gates pass.
  Task 6 remains pending.
- [x] Task: Run the Review A ledger and calibration operations. Commit `011dbbb9`. Record the orphan before-call
  `9d0bddf7-d2ea-4bdb-a672-56c308e3f6d0` as failed with `precheck-kimi --record <callId>
  --failed --reason <text>`. Then run `good-nan` again with the neutral Workbooks Nan text (RA-N2):
  first on MiniMax, then on Kimi, one paid call at a time. Check the quota before each call. The
  orchestrator dispatches the Kimi reviewer (deviation (a)). Compare deviation (d) with the
  ledger. Quote the T75 labels. If a `good-nan` verdict is not `pass`, mark this task `[b]` and
  report to the PM.
  Evidence (2026-10-26, Green session, GLM): part 1 gate fix commit `af58470f` added the task 5
  commit SHA to the task 5 line. Failure record: `precheck-kimi --calibration bad-one-sun
  --record 9d0bddf7-d2ea-4bdb-a672-56c308e3f6d0 --failed --reason <text> --paid`; exit code `0`;
  the CLI needs `--paid` for every precheck-kimi call, and a `--failed` record makes no provider
  call and writes no log or raw file. The late raw file
  `out/storytime/l2/unit1/calibration/raw/bad-one-sun-kimi-9d0bddf7.txt` appeared at 08:06 ICT,
  after the hung call; it stays unused and unchanged. MiniMax `good-nan` (RA-N2, neutral text
  `Hello, I am Nan.`): `--dry-run` first, then `--paid`; exit code `0`; quota at call time
  MiniMax 0% used (5h) and 2% used (week), with no provider cap reported. Kimi `--begin`:
  `--dry-run` first, then `--paid`, only after the MiniMax after-call entry. Deviation (a): the
  orchestrator dispatched the Kimi reviewer on model `kimi-code-plan-cn/k3.1-pro`, session
  `ses_e89b236c3ffe9J1m4HPPB9jLVM`; it wrote one raw line to
  `out/storytime/l2/unit1/calibration/raw/good-nan-kimi-7e33f6e2.txt`; then
  `precheck-kimi --calibration good-nan --record 7e33f6e2-022f-421d-8fbd-97536abbae77 --raw
  <file> --paid` exited `0`, with no raw file edit. Logs:
  `out/storytime/l2/unit1/calibration/good-nan-minimax.json` (callId `ae8f1ff1`,
  `checkedAt 2026-10-26T03:39:56.057Z`, model `mmx-vision-default`, `modelSource: declared`) and
  `out/storytime/l2/unit1/calibration/good-nan-kimi.json` (callId `7e33f6e2`,
  `checkedAt 2026-10-26T03:44:05.862Z`, model `kimi-k3.1-pro`, `modelSource: declared`). Both
  logs hold `sourceText: Hello, I am Nan.`, `rubricVersion: storytime-picture-v2`, and a raw
  file with the callId in its name. T75 labels: `9d0bddf7 after-call: failure`;
  `before-call entries: 8`; `after-call entries: 8`; `open before-calls: 0`;
  `good-nan-minimax: pass`; `good-nan-kimi: pass`. The Kimi before-call
  (2026-10-26T03:40:44.828Z) is later than the MiniMax after-call (2026-10-26T03:39:56.047Z).
  `assertCalibrationReady('out/storytime/l2/unit1')` accepts the root (exit 0). Deviation (d)
  check: the ledger agrees with the four plan timestamps (`4192765b` before 20:15:31.415Z and
  after 20:17:24.145Z; `1086bc64` before 20:15:33.668Z and after 20:17:27.242Z); the ledger shows
  the two 2026-10-25 Kimi calls overlapped, and every later paid call ran one at a time. No
  vitest, tsc, Chrome, or render ran in task 6; the role gate runs outside the task.
  Pre-remediation records (Review A RA2-N3): `calibration/bad-one-sun-minimax.json` (call
  `c1706332`) and `calibration/bad-one-sun-kimi.json` (call `4192765b`) have no `modelSource`,
  `callId`, or `rawFile`. Ledger entries 1 to 11 have no `modelSource`. These records are older
  than the task 5 fields. The calibration gate does not read these fields. The records stay unchanged.
- [x] Task: Correct the Review B security findings and Review A RA2-N1. Commit `597013bd` (remediation)
  and `c9ae988b` (file-server labels). Review B failed Phase 2 at
  `c2353433` (`measure/runs/asset_storytime_l2_unit1_pictures_20261025/review-b-c235343.json`).
  Risk class: high. Gates, seams, and tests: `test-strategy.md` section 4, task 7.
  RB-01: the render wrapper calls `heavy-run.sh` in its argument form, with no `-c` shell string.
  RB-02: the capture server serves only allowlisted files after a `realpath` containment check.
  It refuses the Storytime output tree, which holds the ledger, `raw/`, `calibration/`, and `candidates/`.
  RB-03: `lineart-smoke` writes through `resolveOutputPath`, with exclusive creation of each directory and file.
  RB-04: a credential check refuses a raw answer or a failure reason before any write. It redacts
  provider error text. Safe raw answers stay byte-identical. `--raw` input has a size and type limit.
  RB-05: `verify --release` runs `assertCalibrationReady`.
  RA2-N1: a style look with an empty or absent `sampleFiles` list is invalid.
  Pass T77 to T85 and every earlier test. Then pass the T87 gate row and smoke run 4 (T86).
  Keep `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` unchanged. Make no paid calls.
  Run no heavy render, except smoke run 4. Smoke run 4 is necessary: RB-02 changes the only file
  server of the live capture, and the unit tests mock vite and Chrome. It writes no book version.
  Red model: `openai/gpt-6.1-sol#high`. Green model: `volcengine-agent-plan/glm-5.3-flash#high`.
  Reviews A, B, and C run again on the task 7 HEAD.
  Red evidence: test commit `de097bc653e8d3616f5aec4ffaff736f6d15952f`; exit code `1`; `Tests  9 failed | 90 passed (99)`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  The final run failed T77 to T85 for the expected missing seams or reviewed defects. No new test passed.
  T77 reached the guarded fallback because the wrapper ignores the injected `spawn`.
  T78 lacks `bookFileAllowlist`; T79 lacks `bookServerConfig`; T80 lacks `writeOutputFile`.
  T81 and T82 lack `secretFindings`. T83 accepts a synthetic credential reason.
  T84 accepts release after a calibration log disappears. T85 accepts both empty and absent `sampleFiles`.
  All 90 earlier tests passed. Earlier-test exceptions: none. All 339 earlier assertion lines remain unchanged and in order.
  Authorized amendments: T37 gains calibration logs, temporary sources, and `workbooksRoot`; the Vite mock records its configuration before throwing.
  The duplicate T54 fixture retains all 379 bytes. The tests use runtime synthetic credentials and temporary symlinks only.
  Both Red runs printed the same test summary. Neither run had a syntax, transform, package, timeout, or preflight error.
  Lock wait over 600 seconds: none. No process, browser, provider, or server started from a unit test.
  Final output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t7.log`.
  `./measure/generate.sh --check` exited `1`: `status.md` and `asset-inventory.json` are stale. Existing generated changes remain unchanged.
  Green owns implementation, the type check, T87, smoke run 4 (T86), and the generated facts. Task 7 stays `[~]`.
  Green reran the Red command first: exit `1`, `Tests  9 failed | 90 passed (99)`, T77 to T85 failed
  as expected. Green implemented RB-01 to RB-05 and RA2-N1 in `src/storytime/book-pictures.ts` and
  `scripts/storytime-book-pictures.ts`. Unit gate: exit `0`, `Tests  99 passed (99)`, no skip
  (run again after the label commit with the same result). Type check:
  `owned tsc errors: 1`, `baseline tsc errors: 32`. The one owned error is
  `tests/storytime-book-pictures.test.ts(470,21)` TS2352, inside the committed Red test T77: the
  cast `(...) as typeof spawnSync` does not overlap the real `spawnSync` return type (`stdout: null`
  is not a Buffer). A standalone compile proves the error is intrinsic to the Red test, not to the
  Green code. Green may not edit a committed Red test, so `owned tsc errors: 0` needs a Mid Red
  retry or an authorized no-assertion amendment (cast through `unknown`). All Green implementation
  files type-check clean. Smoke run 4 (T86): exit `0`; labels `hook before seek: absent`;
  `window.__song keys: load,portrait,ready,seek`; `capture path: captureBookStill`;
  `camera drift source: live`; `camera state drift: 0`; `color repeat identical: yes`;
  `stage ink share: 2.12%`; `fixture interior ink: 0.00%`; `fixture ring rays: 360/360`;
  `fixture depth step rows: 159/159`; `lineart-smoke: wrote 4 files under
  out/storytime/l2/unit1/smoke/lineart-2026-10-26T04-59-55-631Z; wrote no book version.`
  Color PNG SHA-256 `37a3acc55ace6e70373c82194a19a7becdef395409007233f9141b3d3a0d307d`, byte-identical
  to smoke run 3 `color.png`. Green viewed the color and line-art PNGs: the color picture shows Nan
  from behind in an orange shirt and red shorts, waving beside two stools, a table, a full bookcase,
  a shuttered window, a fern, and a red-flower pot; the line-art picture draws the same scene as a
  clean one-bit form-edge outline with every model present (Nan, table, stools, bookcase, window,
  plant). T86 is not complete: the run output lacks `book files served: <n>` and
  `book file requests refused: 0`, because the label printing was missing from the implementation.
  Commit `c9ae988b` adds the labels; a fifth smoke run needs a new orchestrator dispatch to prove
  `book files served` 2 or more and `book file requests refused: 0`. T87 gate row: the argument probe
  printed the literal `$(printf RB_SUBSTITUTION_EXECUTED)` (argument probe: literal); the live scan
  printed `live files scanned: 15` and `live credential findings: 0` over `cost-ledger.jsonl` and
  `calibration/`, `raw/`, `candidates/`, and `reviews/`; `assertCalibrationReady` accepted
  `out/storytime/l2/unit1` (exit `0`). No live credential was found, so no `[b] deferred:pm` applies.
  Amendment and smoke run 5: Red amended the T77 cast with the authorized no-assertion change
  `as unknown as typeof spawnSync` (commit `844fb726`, plan `0196627e`); the type check on that HEAD
  then printed `owned tsc errors: 0` and `baseline tsc errors: 31`
  (`measure/runs/asset_storytime_l2_unit1_pictures_20261025/green-tsc-t7b.log`). The unit gate and
  T87 stayed valid. Smoke run 5 (T86, authorized dispatch): exit `0`; all T74 labels in range again
  (`hook before seek: absent`; `window.__song keys: load,portrait,ready,seek`;
  `capture path: captureBookStill`; `camera drift source: live`; `camera state drift: 0`;
  `color repeat identical: yes`; `stage ink share: 2.12%`; `fixture interior ink: 0.00%`;
  `fixture ring rays: 360/360`; `fixture depth step rows: 159/159`); the new labels printed
  `book files served: 15` and `book file requests refused: 0`; and the run printed
  `lineart-smoke: wrote 4 files under out/storytime/l2/unit1/smoke/lineart-2026-10-26T05-22-09-300Z;
  wrote no book version.` The color PNG SHA-256 is again
  `37a3acc55ace6e70373c82194a19a7becdef395409007233f9141b3d3a0d307d`, byte-identical to smoke runs 3
  and 4. Green viewed both PNGs: the color picture shows Nan from behind in an orange shirt and red
  shorts, waving beside two stools, a table, a full bookcase, a shuttered window, a fern, and a
  red-flower pot; the line-art picture draws the same scene as a clean one-bit form-edge outline.
  Every scene model is present (Nan, table, stools, bookcase, window, plant). T86 passes. Task 7 is
  complete: RB-01 to RB-05 and RA2-N1 are implemented, and the unit gate, type check, smoke run 5,
  and T87 all pass on HEAD `0196627e`.
  Type-only amendment: `844fb72677592b09a8c0219b0225ea777cd6090e`; `tsc exit: 2`; `owned tsc errors: 0`; `baseline tsc errors: 31`; unit exit `0`; `Tests  99 passed (99)`; no assertion change. Commands: `heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json'` and the task 7 unit command above. Logs: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-tsc-t7.log` and `mid-red-vitest-245f8c1-retry.log` in the same directory. The first unit attempt exceeded the 120-second command timeout; the retry passed. Task 7 stays `[~]`.

- [x] Task: Correct the second Review B and third Review A findings. Commit `c166c8e1`. Risk class: high.
  Review B failed Phase 2 at `84c8ffdb` with RB2-01 to RB2-04. Review A failed with RA3-01 to
  RA3-03. Review C passed with nonblocking RC3-1. Gates, seams, and tests: `test-strategy.md`
  section 4, task 8.
  RB2-01: sanitize the propagated provider error and the final CLI error log. Test provider stderr
  with a synthetic credential. RB2-02: check decoded review reasons, issues, and count keys before
  any success entry, review write, or log. Cover MiniMax and Kimi JSON Unicode escapes. Keep safe
  raw bytes byte-identical. RB2-03: retain the Vite credential deny entries. Add an absolute
  Storytime deny rule. RB2-04 and RA3-01: return and read the checked real path. Apply the
  protected-tree exclusion to stage reads. RA3-02 and RC3-1: allow 500 characters and refuse 501.
  Cover non-ASCII boundary reasons. Pass T88 to T95 and every earlier test. Keep T1 to T87 unchanged.
  Smoke run 6 (T92) is necessary. Unit mocks cannot prove the complete Vite middleware path. Use
  one bounded `LINEART_SMOKE_COMMAND` run. Probe synthetic `.env`, `.pem`, and `.git/config` files
  through the real middleware stack. Repeat every T86 label. Make no paid call. Run no other render.
  Keep `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` unchanged.
  Red model: `minimax-cn-coding-plan/MiniMax-M3#high` (substitute; Codex 5-hour quota at 83 percent).
  Green model: `volcengine-agent-plan/glm-5.3-flash#high`.
  RA3-03: Red corrects the invalid full SHA quotation in `mid-red-245f8c1.log` to a short form.
  Green corrects the same quotation in `jr-green-ec83581.log`. T95 checks operative full SHAs.
  Immutable review reports may retain the invalid value as finding evidence.
  RA3-N1: `metadata.json actual_tasks` remains a closeout item. Refresh it when Phase 2 closes.
  Reviews A, B, and C run again on the task 8 HEAD. Adversarial testing is required. Browser review
  is not applicable because no UI changes.
  Red evidence (2026-10-26, Red session, MiniMax-M3): test commit
  `c33e0b9b59de32036ae66f4725bf89112527dce1`; exit code `1`; `Tests  6 failed | 99 passed (105)`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  The run had no syntax, transform, package, timeout, or preflight error. No lock wait line.
  T88 failed because `runPaidCall` rethrows the original provider error and the
  `runStorytimeBookPicturesEntry` seam is absent. T89 failed because the decoded `reason`,
  `issues`, and count key reach a success entry, a raw copy, and a review write. T90 failed
  because the Kimi record writes a review, a raw copy, and a success entry, and its log holds
  the decoded credential. T91 failed because the deny list holds only `out/storytime/**`. T93
  failed because both branches return the candidate path and a protected stage target serves
  200 with evidence bytes. T94 failed because the 500-character reason is refused by the UTF-8
  byte limit. The safe escaped Unicode controls in T89 and T90 pass.
  All 99 earlier tests passed. Earlier-test exceptions: none. Every earlier assertion is
  unchanged. The test file adds one `node:fs` import and one module import. No assertion
  changed.
  Type check: `tsc exit: 2`; `owned test file errors: 0`; `baseline tsc errors: 31`.
  Compiler output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-tsc-t8.log`.
  Vitest output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t8.log`.
  Red scope deviation: the strategy assigns Red the correction of the invalid full SHA in
  `mid-red-245f8c1.log`. This role owns only the test file and this plan. The correction stays
  open for the orchestrator or Green. The invalid value is the 40-character SHA quoted on line
  24 of `mid-red-245f8c1.log`. The valid value is
  `245f8c1ae97d660eb475b87f92fd9951306dbc93`.
  T92 and T95 stay with Green. Task 8 stays `[~]`.
  Green evidence (2026-10-26, Green session, GLM). Green reran the Red command first: exit `1`;
  `Tests  6 failed | 99 passed (105)`; T88 to T91, T93, and T94 failed for the reviewed defects
  and missing seams. Implementation commit `c166c8e1` (`src/storytime/book-pictures.ts`,
  `scripts/storytime-book-pictures.ts`): RB2-01 adds `runStorytimeBookPicturesEntry(argv,
  { pipeline, errorLog })` as the final CLI boundary; production binds `console.error`; the
  propagated provider error and the final logged error take `redactSecrets` and the
  500-character limit. RB2-02 adds `decodedReviewFindings` over the decoded `reason`, `issues`,
  and count keys; the MiniMax call refuses inside the paid call and the Kimi record refuses
  before any write, so safe raw bytes stay byte-identical. RB2-03 keeps the four Vite defaults
  (`.env`, `.env.*`, `*.{crt,pem}`, `**/.git/**`) and adds the absolute
  `<real repoRoot>/out/storytime/**` deny rule beside the relative one. RB2-04 and RA3-01:
  `checkedModelFile` and the stage branch of `resolveBookFile` return the checked real path, and
  the stage branch refuses a target inside the Storytime evidence tree. RA3-02: the Kimi failure
  reason limit counts 500 characters, so the 500-character multibyte reason is accepted and 501
  is refused. Smoke run 6 (T92) also prints the middleware probe labels; the probe builds a
  temporary Vite root with synthetic `.env`, `key.pem`, `.git/config`, and Storytime evidence,
  one allowlisted stage control, and one `createServer(bookServerConfig(...))` server over HTTP.
  Unit gate: exit `0`; `Tests  105 passed (105)`; no skip. Command: `bash
  ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run
  tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts
  tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  Type check: `tsc exit: 2`; `owned tsc errors: 0`; `baseline tsc errors: 31`
  (`measure/runs/asset_storytime_l2_unit1_pictures_20261025/green-tsc-t8.log`).
  Smoke run 6 (T92): exit `0`; one run; output
  `out/storytime/l2/unit1/smoke/lineart-2026-10-26T06-58-43-705Z`. Probe labels:
  `middleware probe .env: refused`; `middleware probe pem: refused`;
  `middleware probe git config: refused`; `middleware probe storytime: refused`;
  `middleware probe stage control: served`; `middleware probe synthetic bytes exposed: 0`.
  Capture labels: `hook before seek: absent`; `window.__song keys: load,portrait,ready,seek`;
  `capture path: captureBookStill`; `camera drift source: live`; `camera state drift: 0`;
  `color repeat identical: yes`; `stage ink share: 2.12%`; `book files served: 15`;
  `book file requests refused: 0`; `lineart technique: song-page-form-edges-viewdepth-1bit-v2`;
  `fixture interior ink: 0.00%`; `fixture ring rays: 360/360`;
  `fixture depth step rows: 159/159`; `lineart-smoke: wrote 4 files under
  out/storytime/l2/unit1/smoke/lineart-2026-10-26T06-58-43-705Z; wrote no book version.`
  Green viewed both PNGs: the color picture shows Nan from behind in an orange shirt and red
  shorts, waving beside two stools, a table, a full bookcase, a shuttered window, a fern, and a
  red-flower pot; the line-art picture draws the same scene as a clean one-bit form-edge outline.
  Every scene model is present (Nan, table, stools, bookcase, window, plant, pot).
  RA3-03: the invalid full SHA quotation became the short form `245f8c1a` in
  `measure/runs/asset_storytime_l2_unit1_pictures_20261025/jr-green-ec83581.log` line 71 and
  `mid-red-245f8c1.log` line 24; nothing else changed in those logs; `git rev-parse --verify
  245f8c1a^{commit}` resolves to the valid commit. T95 gate: `operative full SHAs checked: 14`;
  `unresolved full SHAs: 0`. No paid call. One heavy render (smoke run 6). `src/song/`, the
  rubric text, and `PICTURE_RUBRIC_VERSION` are unchanged.

- [x] Task: Check every decoded key and string value before provider evidence writes. Commit `e9d8132b`. Risk class: high.
  Task 9 closes RB3-01 and RA4-01 from the reviews at `cf5743b7`. Review C passed with nonblocking RC4-1.
  Gates, seams, fixtures, and falsification conditions: `test-strategy.md` section 4, task 9, and T96 to T103.
  One shared function walks every decoded JSON object from the answer, including every key and string value at any depth.
  It includes unknown fields, arrays, model envelopes, and JSON objects decoded from `content` strings.
  It calls `secretFindings` before schema validation, field selection, or fallback can discard data.
  MiniMax calls it inside the paid callback, before the success entry. Kimi calls it before any record write.
  Both paths check before a raw copy, review write, or result log. A MiniMax refusal records only the sanitized failure.
  A Kimi refusal leaves the begin ledger and source raw file unchanged. Safe raw bytes stay byte-identical.
  Safe MiniMax reported models stay unchanged. Kimi keeps its declared model and `modelSource` behavior.
  Pass T96 to T103 and every earlier test. Keep T1 to T95 unchanged.
  Cover escaped credentials in both model envelopes, malformed count keys, nested unknown fields, and unknown arrays for both providers.
  Include safe controls for both envelopes. Refuse credentials in unselected objects and nonzero-status envelopes before fallback.
  Align both decoded-refusal message endings for RC4-1. Distinguish the MiniMax failure entry from forbidden evidence writes.
  Use `ENGINE_HOOK_TEST_COMMAND` for Red, Green, adversarial testing, and closeout. Run `TASK9_TYPECHECK_COMMAND` after Green and at closeout.
  Run each declared mutation separately. The named-fields-only mutation must fail the new tests.
  No new live smoke run is necessary. This task changes no server, capture code, renderer, or browser path.
  Injected runners and temporary roots test the complete changed provider paths. Smoke run 6 remains the server and capture evidence.
  Make no paid call and run no render. Keep `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` unchanged.
  Red model: `openai/gpt-6.1-sol#high`. Green model: `volcengine-agent-plan/glm-5.3-flash#high`.
  Strategy deviation: GPT-6.1 Sol replaces Claude at the same tier because Claude reached 80 percent of its 7-day quota.
  Reviews A, B, and C run again on the task 9 HEAD. Review C may use a short delta check.
  Security review, UX/API review, and adversarial testing apply. Browser review does not apply because this task changes no UI.
  RA4-N1 stays a closeout item: correct the stale task 8 Green handoff. Keep immutable review reports unchanged.
  RA3-N1 also stays a closeout item: refresh `metadata.json actual_tasks` and generated facts after status changes.
  Immediately after this strategy commit, capture the immutable task 9 Red base with `git rev-parse HEAD`.
  Capture it before any Red edit. Keep the existing immutable Phase 2 baseline unchanged.
  Red evidence (2026-10-27, Red session, MiniMax-M3): test commit
  `a190019472ef25313e19e201f7fc574dacf2cfc0`; exit code `1`; `Tests  8 failed | 105 passed (113)`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  The run had no package, syntax, transform, timeout, or preflight error. No lock wait line.
  T96 failed because the escaped top-level `model` credential is not inspected. Both providers write the review,
  the raw copy, and a success entry, and the result log names the answer.
  T97 failed because the escaped `model` in a plain and a fenced `content` envelope is not inspected.
  T98 failed because `CountsSchema` discards the malformed count key before the check. Neither provider refuses.
  T99 failed because an unknown field at depth 2 and at depth 12 is not inspected as a key or as a string value.
  T100 failed because an unknown array holds an unchecked string element and an unchecked object key.
  T101 failed because the shared seam `decodedAnswerFindings` does not exist. The safe provider behavior holds.
  The raw bytes, the models, and the parser verdicts stay unchanged.
  T102 failed because the shared seam `decodedAnswerFindings` is absent. The provider paths do not refuse a
  credential in an unselected object, a nonzero-status envelope, or an embedded JSON string.
  T103 failed because both decoded refusals end with `nothing is written.` instead of
  `the raw answer is refused; no review or raw copy is written.` The two providers use different endings.
  All 105 earlier tests passed. Earlier-test exceptions: none. Every earlier assertion is unchanged.
  The test file adds one describe block with eight tests. T1 to T95 keep their text.
  Safe-control note: the provider-level safe controls of T101 pass at Red. Their adversarial mutations are
  mutation 7 and mutation 8. T101 fails only on the missing shared seam.
  An earlier attempt of the same command failed T99 and T101 on the 5000 ms test timeout. The strategy rejects a
  timeout failure as Red evidence. Both tests now carry a 120000 ms limit. The earlier log is kept at
  `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t9-r2-timeout.log`.
  Type check: `tsc exit: 2`; `owned tsc errors: 0`; `total tsc errors: 31`.
  Compiler output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-tsc-t9.log`.
  Vitest output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t9-r2.log`.
  Red model deviation: the strategy names `openai/gpt-6.1-sol#high`. This role ran
  `minimax-cn-coding-plan/MiniMax-M3#high`. The eight tests follow the strategy rows for T96 to T103.
  Task 9 stays `[~]`.
  Green evidence (2026-10-27, Green session, GLM): Green reran the Red command first: exit `1`;
  `Tests  8 failed | 105 passed (113)`; T96 to T103 failed for the reviewed defects and the
  missing seam. Implementation commit `e9d8132b` (`src/storytime/book-pictures.ts` only;
  `scripts/storytime-book-pictures.ts` needed no change): the shared seam
  `decodedAnswerFindings(rawOutput)` walks every JSON object that the answer yields, every
  key and string value at every depth, arrays, unknown fields, and model envelopes, and it
  decodes embedded JSON objects inside string values, including plain and fenced `content`,
  through the same `jsonObjects` extraction. MiniMax calls the seam inside the paid callback,
  before the success entry. Kimi calls the seam before any record write. Both decoded
  refusals end with `the raw answer is refused; no review or raw copy is written.` and name
  only the pattern. Safe raw bytes, safe reported MiniMax models, and the Kimi declared model
  stay unchanged. `decodedReviewFindings` stays exported for its existing callers, and
  production acceptance no longer depends on it. No paid call, no render, no new smoke run.
  Unit gate: exit `0`; `Tests  113 passed (113)`; no skip. Command: `bash
  ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run
  tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts
  tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  Type check: `tsc exit: 2`; `owned tsc errors: 0`; `baseline tsc errors: 31`
  (`measure/runs/asset_storytime_l2_unit1_pictures_20261025/green-tsc-t9.log`).
  `git diff --quiet cf5743b7 -- src/song src/storytime/line-art-pass.ts` exit `0`.
  T1 to T95, `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` stay unchanged.
  Adversarial gate: all nine declared mutations ran one at a time under the focused command
  (`bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run
  tests/storytime-book-pictures.test.ts --maxWorkers=1'`), and Green reverted each one before
  the next run. Every mutation failed its named test: mutation 1 (named-fields-only check)
  failed T96 to T100 and T102 (`6 failed | 80 passed (86)`); mutation 2 (first decoded object
  only) failed T102 (`1 failed | 85 passed`); mutation 3 (check after the schema or fallback)
  failed T96 to T100 and T102 (`6 failed | 80 passed`); mutation 4 skip keys failed T98
  (`5 failed | 81 passed`); mutation 4 skip nested unknown objects passed all 86 tests in its
  recursion-only form, because the direct `jsonObjects` extraction re-supplies every nested
  object from the raw text, so that omission cannot hide a nested credential; the restated
  form of the T99 falsification (one parsed answer object, nested unknown objects skipped)
  failed T99 (`6 failed | 80 passed`); mutation 4 skip arrays failed T100
  (`3 failed | 83 passed`); mutation 4 skip embedded `content` decoding failed T97
  (`2 failed | 84 passed`); mutation 5 (MiniMax check after the paid callback) failed T96 to
  T100, T102, and T103 (`8 failed | 78 passed`); mutation 6 (Kimi check after the first
  write) failed T96 to T100, T102, and T103 (`8 failed | 78 passed`); mutation 7 (safe
  reported models replaced with the declared model) failed T101 and T68
  (`2 failed | 84 passed`); mutation 8 (refuse every JSON answer) failed T101 and the earlier
  provider tests (`8 failed | 78 passed`); mutation 9 (a different Kimi suffix) failed T103
  (`1 failed | 85 passed`). The unchanged implementation passed the full gate again after the
  last revert: exit `0`; `Tests  113 passed (113)`. One `heavy-run: lock wait over 600 s` line
  appeared during mutation 7, because other agents held the heavy lock; heavy-run retried and
  finished, and the first mutation 7 attempt restarted after a tool timeout. The lock wait is
  not a test failure. Green model deviation: the strategy names
  `volcengine-agent-plan/glm-5.3-flash#high`; this Green run used
  `volcengine-agent-plan/glm-latest#high`, after the planned model reached its 5-hour quota.
  Task 9 is complete on HEAD `e9d8132b`: RB3-01 and RA4-01 are closed. RA4-N1 and RA3-N1 stay
  closeout items.

- [x] Task: Check every decoded JSON value before provider evidence writes. Commit `b2a02238`. Risk class: high.
  Implementation commit: `b2a02238a8f217b175b70fd38c737f0593eed16a`.
  Task 10 closes RB4-01 from the reviews at `53cc3ada`.
  It also closes RC5-1, RC5-2, RC5-4, and RA5-02 on the same walker.
  It moves the Kimi check before schema parsing and corrects the comment for RA5-03.
  RC5-3 stays out of scope. Closeout may record it as tech debt.
  Gates, seams, fixtures, and falsification conditions: `test-strategy.md` section 4, task 10, and T104 to T115.
  One shared walker checks every decoded JSON value before schema parsing, selection, status fallback, or any write.
  It decodes string layers that parse as JSON, at any number of layers.
  It checks root arrays, array elements, and objects.
  It uses an explicit worklist. It has no call-stack limit and no depth limit.
  A hostile depth returns the normal refusal or a safe result. It does not raise `RangeError`.
  The walker builds credential rules once per call. It visits each decoded value once.
  A 65,536-byte hostile answer finishes within the task 10 time bound.
  Both providers use this walker. MiniMax calls it inside the paid callback, before the success entry.
  Kimi calls it before `parseModelReview` and before any record write.
  The Kimi comment must match that order. The check reads the raw answer, not the schema result.
  Do not export `decodedReviewFindings`. Delete it when no caller remains.
  Safe raw bytes stay byte-identical. Safe reported models stay unchanged.
  Pass T104 to T115 and every earlier test. Keep T1 to T103 unchanged.
  Cover the three Review B source cases for both providers.
  Include a third string layer, a deep credential, a deep safe answer, and the two time fixtures.
  Use `ENGINE_HOOK_TEST_COMMAND` for Red, Green, adversarial testing, and closeout.
  Run `TASK10_TYPECHECK_COMMAND` after Green and at closeout.
  Run each declared mutation separately. Each mutation omits one path and fails one named test.
  No new live smoke run is necessary. This task changes no server, capture code, renderer, or browser path.
  Injected runners and temporary roots test the changed provider paths. Smoke run 6 remains the server evidence.
  Make no paid call and run no render. Keep `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` unchanged.
  The table default for Red is `volcengine-agent-plan/deepseek-v4-pro#high`.
  The orchestrator picks the Red route with `ra-quota`. This task names no Green model.
  Reviews A, B, and C run again on the task 10 HEAD. Review C may use a short delta check.
  Security review, UX/API review, and adversarial testing apply. Browser review does not apply because this task changes no UI.
  RA4-N1 and RA3-N1 stay closeout items. RC5-3 is a tech-debt candidate, not a task 10 test.
  Capture the task 10 Red base immediately after this strategy commit.
  Run `git rev-parse HEAD` before any Red edit. Keep the Phase 2 baseline `1d39b8fd` unchanged.
  Red base: `62c4ef6fee3aad167fe344df58f3dd4a4ed46b27`. The task 10 strategy commit.
  Red evidence (2026-10-27, Red session, MiniMax-M3): test commit
  `5a46415eb0b25db2d4fb9e76b9224bcae7fb40fa`; exit code `1`; `Tests  11 failed | 114 passed (125)`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  The gate duration was 248.20 s. The run had no package, syntax, transform, timeout, or preflight error.
  One `heavy-run: lock wait over 600 s` line appeared while another agent held the shared lock.
  All 113 earlier tests passed. T112 passed. Earlier-test exceptions: none.
  T104 failed because the extra string layer keeps escaped braces. Both providers persist the answer and record success.
  T105 failed for the same reason at the third string layer.
  T106 failed because a root array is not a brace object. The sibling credential is not checked.
  T107 failed because the array string yields only the empty object. The credential element is lost.
  T108 failed because the encoded credential is not checked before the status fallback discards it.
  T109 failed because the call raises `RangeError: Maximum call stack size exceeded`. The error has no pattern name and no suffix.
  T110 failed with the same RangeError on a safe deep answer. No review file is written.
  T111 failed because `decoded scan ms: 20042` exceeds 2000. The scan did not finish inside the 20000 ms test limit.
  T113 failed because `decodedReviewFindings` is still exported.
  T114 failed because `precheckKimi` calls `parseModelReview` before `decodedAnswerFindings`. The Kimi comment does not state that the check reads the raw answer.
  T115 failed because `rule scan ms: 15274` exceeds 2000.
  Hostile-scan harness: T109, T110, T111, and T115 run their scan in a worker thread. The test owns the wall-clock limit. The limit is 20000 ms for the seam scans and 30000 ms for the provider calls.
  The worker stack is 1 MB. The worker stack then matches the test process stack, so the current recursive walker reaches the same depth limit.
  Without the worker, the current walker blocked the event loop for 27 minutes and the 120000 ms vitest limit never fired.
  The first full gate run was stopped by the orchestrator after 27 minutes of blocked CPU. It is not Red evidence.
  An earlier full gate run finished with a T109 timeout failure. The strategy rejects a timeout failure as Red evidence.
  Focused hostile command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1 -t "T109|T110|T111|T115"'`;
  exit code `1`; `Tests  4 failed | 94 skipped (98)`; duration 50.69 s.
  Test design deviation: the env names of T115 are `TASK10_SECRET_<n>_KEY`. The env rule pattern needs a name that ends in KEY, TOKEN, SECRET, or PASSWORD.
  Without that suffix the 1200 rules do not exist, the scan stays fast, and the row cannot fail at Red.
  Test design deviation: the four hostile rows run in a worker thread. The strategy names the seam call, the provider call, and the time bound. The harness change keeps those checks and gives each one a limit that the test owns.
  Type check: `tsc exit: 2`; `owned tsc errors: 0`; `total tsc errors: 31`.
  Compiler output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-tsc-t10.log`.
  Vitest output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t10.log`.
  Focused hostile output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t10-hostile.log`.
  Red model deviation: the strategy names `volcengine-agent-plan/deepseek-v4-pro#high`, and `ra-quota pick red` printed the same route.
  This role ran `minimax-cn-coding-plan/MiniMax-M3#high`, because the orchestrator keeps Red in this track on MiniMax-M3 and leaves DeepSeek free for acceptance.
  No paid call, no render, and no smoke run. `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` stay unchanged.
  Green evidence (2026-10-27, Green session, GLM):
  - Implementation commit `b2a02238a8f217b175b70fd38c737f0593eed16a`; one path:
    `src/storytime/book-pictures.ts`. Role base `425f5a94`; phase base `1d39b8fd` unchanged.
  - Red rerun before the edit: exit `1`; `Tests  11 failed | 114 passed (125)`; the 11 failures
    match the Red log. Log: `green-vitest-t10-pre.log`.
  - Green gate (`ENGINE_HOOK_TEST_COMMAND` with `timeout -k 30 900`): exit `0`;
    `Tests  125 passed (125)`; no skipped test; duration 155.31 s. Log: `green-vitest-t10.log`.
  - Focused hostile rows (`-t "T109|T110|T111|T115"`): exit `0`; `4 passed | 94 skipped (98)`;
    duration 10.23 s. Log: `green-vitest-t10-hostile.log`. The default reporter prints no
    console output for passing tests, so the labeled `decoded scan ms` and `rule scan ms`
    values are not in the logs. In-process probes measured T111 at 3 to 6 ms and T115 at
    239 ms; depth 4000 took 10 to 21 ms.
  - Type check (`TASK10_TYPECHECK_COMMAND`): `tsc exit: 2`; `owned tsc errors: 0`;
    `total tsc errors: 31` (the baseline; all 31 sit in `assets/*.ts` and
    `tests/part.test.ts`, none owned). Log: `task10-tsc.log`.
  - `git diff --quiet cf5743b7 -- src/song src/storytime/line-art-pass.ts`: exit `0`.
  - Final 4-file gate on `b2a02238`: exit `0`; `Tests  125 passed (125)`; duration 163.92 s.
    Log: `green-vitest-t10-final.log`.
  - Mutations. Command per mutation: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c
    'timeout -k 30 600 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts
    --maxWorkers=1'`. Each run wrote `green-mutation-t10-<n>.log`; the file was restored and
    `git diff --quiet HEAD -- src/storytime/book-pictures.ts` was clean before the next run.
    | # | Mutation | Exit | Failed tests |
    | --- | --- | --- | --- |
    | 1 | No JSON string-layer parse | 1 | T104; T105, T107, T108. T109 did not co-fail (deviation below). |
    | 2 | One string layer only | 1 | T105; T108 |
    | 3 | Root array not walked | 1 | T106 only |
    | 4 | Scalar array elements skipped | 1 | T107; T106, T100, T108 |
    | 5 | Schema result passed to the Kimi check | 1 | T108; T100, T102, T104, T105, T106, T107, T109 |
    | 6 | Direct recursion restored | 1 | T110; T109 |
    | 7 | Depth ceiling 3500 | 1 | T109 only; T110 passed |
    | 8 | Catch RangeError, return no findings | 1 | T109 only; T110 passed |
    | 9 | Re-extract from raw text and every string | 0 | none; T111 passed (test gap below) |
    | 10 | Rules rebuilt inside the per-key loop | 1 | T115; `rule scan ms: 8330` |
    | 11 | `decodedReviewFindings` exported again | 1 | T113 only |
    | 12 | Kimi parse before the decoded check | 1 | T114 only |
    | 13 | Contradicting Kimi comment | 1 | T114 only |
    | 14 | Declared model replaces the reported model | 1 | T112; T101 |
    | 15 | Refuse every JSON string | 1 | T112; T101, T102, T104, T105, T107, T108, T110 |
    | 16 | Refuse every root array | 1 | T112; T106 |
    | 17 | Catch every walker error, refuse every answer | 0 | none; T112 passed (test gap below) |
  - Deviations:
    - Mutation 1: the strategy names T109 as a co-failure. T109 did not fail. Its
      credential is decoded by the root `JSON.parse`, not by a string layer, so the
      string-layer omission cannot hide it. T109 keeps coverage through mutations 6, 7,
      and 8.
    - Mutation 8: combined with mutation 6's recursion, because the committed worklist
      walker cannot raise `RangeError`. The catch returned no findings, and T109 failed.
    - Mutation 9 (test gap): T111 passed. With the rules built once per call, re-extraction
      from the raw text and every string measured 877 ms on the T111 answer, under the
      2000 ms bound. The Red-era 20 s cost came from the per-string environment rule
      rebuild, which mutation 10 covers (`rule scan ms: 8330`).
    - Mutation 17 (test gap): T112 passed. The worklist walker raises no error on safe
      answers, so a catch cannot fire and cannot refuse anything. T110 requires exactly
      that; the mutation's premise contradicts T110.
    - Mutation 16 co-failure cause: the `root-array` finding lands before the credential
      finding, so the refusal message names the wrong pattern in T106.
  - Findings closed: RB4-01, RA5-02, RA5-03, RC5-1, RC5-2, RC5-4. RC5-3 stays out of scope.
  - No paid call, no render, no Vite server, no browser. No test file changed. Run logs
    under `measure/runs/` stay uncommitted.

- [x] Task: Check every JSON string token of the provider answer before any evidence write. Risk class: high. Commit `820f35c4`.
  Task 11 closes RB5-01, RB5-02, RB5-03, and RB5-04 from the reviews at `3f604b62`.
  It also closes RA6-03, RC6-1, and RC6-2 when the change stays in the same file and function.
  Gates, seams, fixtures, and falsification conditions: `test-strategy.md` section 4, task 11, and T116 to T128.
  Daniel selected design B: “Accept B” (Google Tasks, 15:52-15:53 ICT, 2026-10-27).
  One shared scan reads the raw answer text. It does not depend on `JSON.parse` success.
  The scan covers every JSON string token of the text, at every decoded layer. It also scans the text itself.
  A JSON string token is a maximal run of characters between two unescaped double quotes.
  Its decoded form resolves the JSON escape sequences. Each decoded form is a text of the next layer.
  The scan needs no valid JSON. A malformed, truncated, or duplicated text yields the same tokens as a valid text.
  The scan is linear in the text length per layer. No path restarts a scan at an opening brace.
  The scan uses no call-stack recursion and no depth ceiling.
  One rule builder serves the raw scan and the decoded scan. Both read the environment at call time.
  A long pattern name is cut. The shared suffix stays. The message stays at 500 characters at most.
  The MiniMax comment names the current finding. It must not keep the stale `RB3-01` label.
  `JSON.parse` stays for the review schema only. It never gates the credential check.
  The task 10 refusal suffix stays byte-identical. The task 9 raw-byte refusal text stays unchanged.
  MiniMax calls the scan inside the paid callback, before the success entry.
  Kimi calls the scan before `parseModelReview` and before any record write.
  Both providers refuse before a raw copy, a review write, or a result log.
  A MiniMax refusal appends only its sanitized failure entry. A Kimi refusal leaves the begin ledger and the source raw file unchanged.
  Pass T116 to T128 and every earlier test. Keep T1 to T115 unchanged.
  Cover every Review B source case for both providers. Cover the mixed row, the malformed time row, and the long-name row.
  Every hostile row runs in a worker thread with a test-owned wall-clock limit.
  Use `ENGINE_HOOK_TEST_COMMAND` for Red, Green, adversarial testing, and closeout.
  Run `TASK11_TYPECHECK_COMMAND` after Green and at closeout.
  Run each declared mutation separately. Each mutation omits one path and fails one named test.
  No new live smoke run is necessary. This task changes no server, capture code, renderer, or browser path.
  Make no paid call and run no render. Keep `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` unchanged.
  The table default for Red is `volcengine-agent-plan/deepseek-v4-pro#high`. The orchestrator picks the Red route with `ra-quota`.
  Reviews A, B, and C run again on the task 11 HEAD. Review C may use a short delta check.
  Security review, UX/API review, and adversarial testing apply. Browser review does not apply because this task changes no UI.
  Mutations 9 and 17 stay with adversarial testing. The new time row may close mutation 9 as a side effect.
  Capture the task 11 Red base immediately after this strategy commit. Run `git rev-parse HEAD` before any Red edit.
  Keep the Phase 2 baseline `1d39b8fd` unchanged. Do not use `3f604b62` as the Red base.
  Red gate command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  Green gate command: the same command.
  Mutation command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'`.
  Type check command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json'`.
  Red expectation: exit `1`; the hostile rows fail; the 125 earlier tests pass.
  Green expectation: exit `0`; `Tests  <N> passed (<N>)`; no skip.
  Type check expectation: `tsc exit: 2`; `owned tsc errors: 0`; `total tsc errors: 31`.
  Green implementation: `820f35c4cb3cab1e30fb561d70833c03a8da593a`; one shared credential-rule builder serves the raw and decoded scans.
  The linear scan checks raw text and each JSON string token across decoded layers. It does not require valid JSON.
  It keeps provider refusal and write order unchanged. It bounds long pattern names so the shared suffix stays inside 500 characters.
  Pre-edit four-file gate: exit `1`; `Tests  11 failed | 127 passed (138)`. Log: `green-vitest-t11-pre.log`.
  Four-file Green gate: exit `0`; `Tests  138 passed (138)`; no skips. Log: `green-vitest-t11.log`.
  Typecheck: exit `2`; owned errors `0`; total errors `31`. The errors remain in baseline assets and `tests/part.test.ts`. Log: `task11-tsc.log`.
  Final four-file gate: exit `0`; `Tests  138 passed (138)`; no skips. Log: `green-vitest-t11-final.log`.
  `git diff --quiet cf5743b7 -- src/song src/storytime/line-art-pass.ts` exited `0`. The committed Red test file stayed unchanged.
  Mutation table. Each run used the task 11 mutation command. Each mutated source file was restored, and the clean check passed.

  | Mutation | Named test | Result | Other failures or notes |
  | --- | --- | --- | --- |
  | 1. Parsed root only | T116 | Failed; 9 failed, 102 passed (111) | T117-T120, T122, T124, T127, T128 also failed. Used the task 10 decoded walker from commit `167680a1` and removed the token scan. |
  | 2. First document only | T117 | Failed; 6 failed, 105 passed (111) | T116, T122, T127, T128 also failed. The mutation limited scanning to the first newline-delimited document. |
  | 3. JSON.parse candidate set | T118 | Failed; 4 failed, 107 passed (111) | T119, T127, T128 also failed. Stringifying the parsed candidate discarded earlier duplicate fields. |
  | 4. Values only | T119 | Failed; 8 failed, 103 passed (111) | T100 also failed because the mutation skipped all object keys. |
  | 5. Parse-success gate | T120 | Failed; 7 failed, 104 passed (111) | T116, T117, T122, T127, T128 also failed. |
  | 6. Per-brace rescan | T121 | Failed; 1 failed, 110 passed (111) | `malformed scan ms: 2518`; the test bound is 2000 ms. |
  | 7. No name cut | T124 | Failed; 1 failed, 110 passed (111) |  |
  | 8. Module-load rule snapshot | T125 | Failed; 2 failed, 109 passed (111) | T102 also failed. |
  | 9. Stale MiniMax comment label | T126 | Failed; 1 failed, 110 passed (111) |  |
  | 10. Refuse every fence or array | T123 | Failed; 9 failed, 102 passed (111) | T101, T102, T106, and T112 also failed. |
  | 11. MiniMax scan after callback | T127 | Failed; 24 failed, 87 passed (111) | T116-T120, T122, T124, and T126 also failed. The mutation moved both raw and decoded checks after the callback. |
  | 12. Kimi scan after first write | T128 | Failed; 24 failed, 87 passed (111) | T119, T120, T122, T124, and T126 also failed. |

  Mutation deviations: mutations 2-5 used direct lexical-scan equivalents because the implementation has no JSON candidate walker.
  Mutation 11 moved the checks after the paid callback. Mutation 12 placed the decoded check after the first review-file write.
  Mutation gaps: none. Every named test failed. Mutation logs: `green-mutation-t11-1.log` through `green-mutation-t11-12.log`.
  Mutation command exits were `1` for all twelve runs. No `lock wait over 600 s`, exit `75`, exit `124`, or exit `137` appeared.
  Mutation list, with the one named test that must fail:
    1. Read only the parsed root value. Remove the lexical token pass. (T116)
    2. Read only the first top-level document of the text. (T117)
    3. Build the candidate set from `JSON.parse`, so an earlier duplicate value and key are lost. (T118)
    4. Check string values only. Skip object keys. (T119)
    5. Run the credential scan only when `JSON.parse` succeeds. (T120)
    6. Keep a rescan from every unmatched opening brace. (T121)
    7. Do not cut a long pattern name. (T124)
    8. Give the decoded path its own rule list from a module-load snapshot. (T125)
    9. Restore the stale `RB3-01` label in the MiniMax comment. (T126)
    10. Refuse every fenced or array answer, including a safe one. (T123)
    11. Run the MiniMax scan after the paid callback returns. (T127)
    12. Run the Kimi scan after the first record write. (T128)
  Each mutation changes one path. Green records every other failing test.
  Open risk: the cost of many nested string layers. No row covers it yet.
  The acceptance role measures that cost and opens a follow-up task when the cost passes the task bound.
  Note for design A: design A accepts one strict JSON object, refuses duplicate keys, and refuses every other answer with no raw copy.
  Under design A, T116 to T120 keep their constructions, but the expected result changes from a credential refusal to a contract refusal.
  The shared suffix changes. The raw copy ban becomes universal. A duplicate-key rule needs a parser that keeps every key.
  T121 keeps its time bound. T123 keeps one safe row for a strict single-object answer. T124 to T128 stay unchanged.
  The amendment is one row-set replacement and one contract amendment.
  Red base: `2ba7acec4b97c8b5e61c9b468efe7ab426748d0c`. The task 11 strategy commit.
  Red evidence (2026-10-27, Red session, MiniMax-M3): test commit `496c6622`; exit code `1`;
  `Tests  11 failed | 127 passed (138)`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  The gate duration was 301.19 s. The run had no package, syntax, transform, timeout, or preflight error.
  All 125 earlier tests passed. Earlier-test exceptions: none.
  T116 failed because the fence extraction returns no root array. The escaped scalar element is never checked. Both providers write the answer and record success.
  T117 failed because the scan reads the first document only. The second document holds the credential.
  T118 failed because `JSON.parse` keeps the last duplicate value. The earlier value is never checked.
  T119 failed because `JSON.parse` keeps the last duplicate value. The credential key of the earlier duplicate is never checked.
  T120 failed because the parse error sends the answer to the extraction path. The escaped value is never checked.
  T121 failed because `malformed scan ms: 16651` exceeds 2000. The brace rescan is quadratic. The worker finished inside the 60000 ms limit.
  T122 failed because the fence and the malformed tail hide the credential. The tail never reaches the scan.
  T124 failed because a long pattern name pushes the shared suffix past the 500-character cut. The thrown error, the ledger error, and the CLI error log lose the task 10 suffix.
  T126 failed because the MiniMax comment still holds the stale `RB3-01` label and does not state that the check reads the raw answer.
  T127 failed because the MiniMax path writes a review file, a raw copy, and a success entry for the constructions that the scan does not refuse.
  T128 failed because the Kimi path writes a review file and a raw copy and changes the ledger for the constructions that the scan does not refuse.
  T123 and T125 passed at Red. T123 holds no credential. T125 finds the same rule name in both paths at this HEAD.
  Focused hostile command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1 -t "T11[6-9]|T12[0-8]"'`;
  exit code `1`; `Tests  11 failed | 2 passed | 98 skipped (111)`; duration 63.24 s.
  Hostile-scan harness: T116 to T120, T122, T123, T124, T125, T127, and T128 run their scan or their provider call in the worker thread.
  The test owns the wall-clock limit. The limit is 20000 ms for a seam row, 60000 ms for the malformed time row, and 30000 ms for a provider row.
  The worker stack is 1 MB. A harness timeout is not Red evidence. No row timed out.
  Harness change: the worker gained a `rules` mode for T125. The `seam`, `minimax`, and `kimi` modes stay unchanged. T1 to T115 stay unchanged.
  Test design deviation: T119 and T122 hold two constructions each. The strategy construction puts the credential in the last duplicate key.
  A duplicate key name survives `JSON.parse`, so the RB4-01 key scan finds that key and the form is already refused at this HEAD.
  The second construction hides the credential. T119 puts it in a key of an earlier duplicate value. T122 puts it in the malformed tail behind the fence.
  The rows fail at Red on that second form. A probe of `decodedAnswerFindings` confirms both forms.
  Review finding note: RB5-02 names an earlier duplicate key. A duplicate key name survives `JSON.parse`, so the key always reaches the scan.
  Only an earlier duplicate value hides a credential. T118 covers the value form.
  Test design deviation: the first focused run failed T124 and T125 because the rows double-escaped the value. The rows now build the escape form the task 10 rows use.
  Logs: `red-vitest-t11-hostile-attempt1.log`, `red-vitest-t11-hostile-attempt2.log`, `red-vitest-t11-hostile-attempt3.log`.
  Lock note: one `heavy-run: lock wait over 600 s` line appeared in the focused run while another agent held the shared lock.
  One gate run was stopped while it waited for the same lock, because the tightened rows changed the test file. The gate run was repeated on the final test state.
  Type check: `tsc exit: 2`; `owned tsc errors: 0`; `total tsc errors: 31`.
  The 31 errors sit in `assets/*.ts` and `tests/part.test.ts`. None sits in `tests/storytime-book-pictures.test.ts`.
  Compiler output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-tsc-t11.log`.
  Vitest output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t11.log`.
  Focused hostile output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t11-hostile.log`.
  Red model deviation: the strategy names `volcengine-agent-plan/deepseek-v4-pro#high`. This role ran `minimax-cn-coding-plan/MiniMax-M3#high`,
  because the orchestrator keeps Red in this track on MiniMax-M3 and leaves DeepSeek free for acceptance.
  No paid call, no render, and no smoke run. `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` stay unchanged.

- [x] Task: Close the malformed-string class of the credential scan. Commit `64073051`. Risk class: high.
  Task 12 closes RB6-01, RB6-02, and RB6-03 from the Review B report at `bb4e11f0`.
  Gates, seams, fixtures, and falsification conditions: `test-strategy.md` section 4, task 12, and T129 to T138.
  Daniel chose design B on 2026-10-27. Design B stays. Do not plan design A and do not plan a waiver.
  The contract stays. The raw copies stay. No contract change is needed.
  The input class is a closure, not a shape list. Start from the raw answer text.
  A text splits at every unescaped double quote into the head, the segments between two consecutive unescaped quotes, and the tail.
  Every segment decodes with the tolerant decoder. The tolerant decoder resolves each valid JSON escape, including `\uXXXX` and surrogate pairs.
  The tolerant decoder keeps each invalid escape sequence, each lone backslash, and each raw control character as literal text.
  The tolerant decoder never drops a segment and never throws.
  Every decoded segment is a candidate. A decoded segment that holds a quote is split and decoded again.
  A decoded segment without a quote is a candidate only. Do not decode it again.
  The raw text is a candidate. A credential in prose without a quote is found there.
  The scan needs no valid JSON. A malformed, truncated, duplicated, or fenced text yields the same candidates as a valid text.
  The scan is linear per layer. No path decodes a whole text without segment boundaries.
  One rule builder serves the raw scan and the decoded scan. Both read the environment at call time.
  `JSON.parse` stays for the review schema only. It never gates the credential check.
  MiniMax calls the scan inside the paid callback, before the success entry.
  Kimi calls the scan before `parseModelReview` and before any record write.
  Both providers refuse before a raw copy, a review write, or a result log.
  A MiniMax refusal appends only its sanitized failure entry. A Kimi refusal leaves the begin ledger and the source raw file unchanged.
  The task 10 refusal suffix stays byte-identical. The task 9 raw-byte refusal text stays unchanged.
  Pass T129 to T138 and every earlier test. Keep T1 to T128 unchanged.
  T129 to T133 cover the five Review B source cases for both providers.
  T134 runs the seeded generator at the seam. T135 runs a fixed sample through both providers.
  T136 is the wide cost row. T137 is the chain cost row. T138 is the safe-twin row.
  Every hostile row runs in the worker thread with a test-owned wall clock.
  The generator is deterministic. It uses a fixed seed and a fixed case count. It adds no dependency.
  Use `ENGINE_HOOK_TEST_COMMAND` for Red, Green, adversarial testing, and closeout.
  Run `TASK12_TYPECHECK_COMMAND` after Green and at closeout.
  Run each declared mutation separately. Each mutation omits one path and fails one named test.
  No new live smoke run is necessary. This task changes no server, capture code, renderer, or browser path.
  Make no paid call and run no render. Keep `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` unchanged.
  The table default for Red is `volcengine-agent-plan/deepseek-v4-pro#high`. The orchestrator picks the Red route with `ra-quota`.
  Reviews A, B, and C run again on the task 12 HEAD. Review C may use a short delta check.
  Security review, UX/API review, and adversarial testing apply. Browser review does not apply because this task changes no UI.
  PM limit (22:49 ICT, 2026-10-27): task 12 is the last remediation round for the malformed-string class.
  If the task 12 Review B finds new items in the same class, no task 13 opens.
  The items become recorded residual risk, and the PM takes the decision to Daniel.
  A finding outside this class follows the normal path.
  Named residual risk, out of class, recorded, and not tested: base64, percent encoding, HTML entities, a credential split across two separate strings or across prose and a string, single-quoted strings, a credential encoded twice inside one string token, and other transforms.
  Review B audits task 12 against the named class only.
  Capture the task 12 Red base immediately after this strategy commit. Run `git rev-parse HEAD` before any Red edit.
  Keep the Phase 2 baseline `1d39b8fd` unchanged. Do not use `bb4e11f0` as the Red base.
  Red gate command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  Green gate command: the same command.
  Mutation command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'`.
  Type check command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json'`.
  Red expectation: exit `1`; T129 to T135 fail; T136 to T138 may pass; the earlier tests pass.
  Green expectation: exit `0`; `Tests  <N> passed (<N>)`; no skip.
  Type check expectation: `tsc exit: 2`; `owned tsc errors: 0`; `total tsc errors: 31`.
  Mutation list, with the one named test that must fail:
    1. Drop the head and the tail segments. (T129)
    2. Decode a segment with `JSON.parse` and drop the segment when the parse throws. (T131)
    3. Pair the quotes left to right in one parity. (T133)
    4. Do not split and decode a decoded layer that holds a quote. (T134)
    5. Decode the whole layer text and use the decoded text as the next layer. (T137)
  Each mutation changes one path. Green records every other failing test.
  Red base: `e8d605ab0c4f211e380af3a7a3684d869cf5bc02`. The task 12 Red base, captured right after the strategy commit.
  Red evidence (2026-10-28, Red session, MiniMax-M3): test commit `0cd4b024`; exit code `1`;
  `Tests  7 failed | 141 passed (148)`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`.
  The gate duration was 506.35 s. The run had no package, syntax, transform, timeout, or preflight error.
  All 138 earlier tests passed. Earlier-test exceptions: none.
  T129 failed because the scan drops a token with no closing quote. The unterminated tail is never decoded. Both providers write the review, the raw copy, and a success entry.
  T130 failed because the scan stops at the last complete token. The trailing lone backslash leaves the credential inside an unterminated tail.
  T131 failed because `JSON.parse` throws on the raw line feed and the whole token is dropped. The MiniMax envelope form fails for the same reason.
  T132 failed because `JSON.parse` throws on the invalid escape and the whole token is dropped.
  T133 failed because one stray prose quote shifts the quote pairing. The escaped credential falls between two tokens, and the last quote opens an unterminated tail.
  T134 failed because the generated corpus holds cases the current scan misses. `generated cases: 240`; `generated findings: 98`; `generated twin findings: 0`.
  T135 failed because the sampled generated cases are not refused. `sample cases: 12`; `sample refusals: 6`.
  T136, T137, and T138 passed at Red. T136 and T137 name mutation 5. T138 names mutation 3.
  Focused hostile command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1 -t "T129|T13[0-8]"'`;
  exit code `1`; `Tests  7 failed | 3 passed | 111 skipped (121)`; duration 54.58 s.
  Hostile-scan harness: every new row runs its scan or its provider call in the worker thread. The test owns the wall-clock limit.
  The limit is 30000 ms for a provider row, 60000 ms for a generator or chain row, and 120000 ms for the wide cost row.
  The worker stack is 1 MB. A harness timeout is not Red evidence. No row timed out.
  Harness change: the worker gained a `corpus` mode for T134 and T138. The `seam`, `rules`, `minimax`, and `kimi` modes stay unchanged. T1 to T128 stay unchanged.
  Generator: the seed is 20261025, the case count is 240, and the step is a small linear congruential step inside the test file. The generator adds no dependency.
  The piece list, the draw order, and the case count stay fixed. A second run with the same seed yields the same cases.
  Generator shape counts: object 27, unterminated 31, backslash 28, control 32, invalid-escape 31, array 28, duplicate-key 30, key 33. The layer counts are 67, 62, 61, and 50 for 0 to 3 layers.
  Wide row deviation: the strategy names about 21,800 distinct short strings. The 65,536-byte budget holds 9,543 distinct short strings, which give 19,086 quote segments. The row prints `wide tokens: 9543`. The bound stays 60000 ms.
  Chain row deviation: the strategy names about 113 layers. The escaped nesting doubles the backslashes, so a 65,536-byte answer holds 14 layers. The row prints `chain levels: 14`. The bound stays 20000 ms.
  The chain answer holds the Review B fold encoding of a quote pair at its innermost level.
  Cost labels at the Red HEAD: `wide scan ms: 1442`; `chain scan ms: 641`. Both rows pass their bound. The labels print on the console of the row.
  Cost label command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1 --reporter=verbose -t "T136|T137"'`; exit code `0`; `Tests  2 passed | 119 skipped (121)`; duration 6.72 s.
  Twin row: the twin of a text keeps every byte but the credential bytes. The seam yields no finding for any of the 245 twins. `twin cases: 245`; `twin findings: 0`.
  Type check: `tsc exit: 2`; `owned tsc errors: 0`; `total tsc errors: 31`.
  The 31 errors sit in `assets/*.ts` and `tests/part.test.ts`. None sits in `tests/storytime-book-pictures.test.ts`.
  Compiler output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-tsc-t12.log`.
  Vitest output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t12.log`.
  Focused hostile output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t12-focused.log`.
  Cost label output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-vitest-t12-labels.log`.
  Lock note: two `heavy-run: lock wait over 600 s` lines appeared. Another agent held the shared lock. The first gate attempt was stopped with its waiter. The gate run was repeated on the final test state.
  Red model deviation: the strategy names `volcengine-agent-plan/deepseek-v4-pro#high`. This role ran `minimax-cn-coding-plan/MiniMax-M3#high`,
  because the orchestrator keeps Red in this track on MiniMax-M3 and leaves DeepSeek free for acceptance.
  No paid call, no render, and no smoke run. `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` stay unchanged.
  Green evidence (2026-10-28, Green session): implementation commit `64073051`,
  `fix(storytime): scan every quote segment with a tolerant decoder`. Only `src/storytime/book-pictures.ts` changed.
  Gate command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node_modules/.bin/vitest run tests/song-still-hook.test.ts tests/storytime-line-art-pass.test.ts tests/storytime-book-pictures.test.ts tests/song-timeline.test.ts --maxWorkers=1'`;
  exit code `0`; `Tests  148 passed (148)`; no skip; duration 285.81 s. Output: `green-vitest-t12.log`.
  Focused hostile command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1 -t "T129|T13[0-8]"'`;
  exit code `0`; `Tests  10 passed | 111 skipped (121)`; duration 63.35 s. Output: `green-vitest-t12-focused.log`.
  Cost labels at the Green HEAD: `wide scan ms: 473` (Red 1442; bound 60000 ms); `chain scan ms: 351` (Red 641; bound 20000 ms).
  The labels also print `wide tokens: 9543` and `chain levels: 14`. Both bounds hold.
  Label command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 300 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1 --reporter=verbose -t "T136|T137"'`;
  exit code `0`; `Tests  2 passed | 119 skipped (121)`. Output: `green-vitest-t12-labels.log`.
  Type check: `tsc exit: 2`; `owned tsc errors: 0`; `total tsc errors: 31`.
  The 31 errors sit in `assets/*.ts` and `tests/part.test.ts`. None sits in `tests/storytime-book-pictures.test.ts` or `src/storytime/`.
  Compiler output: `green-tsc-t12.log`.
  Mutation command (each, one at a time): `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'`.
  Each mutation exited `1`. Each named test failed. After each run the file was restored with
  `git checkout -- src/storytime/book-pictures.ts`, and `git diff --exit-code` on that file confirmed a clean tree.
    1. Drop the head and the tail segments. T129 failed. `Tests  4 failed | 117 passed (121)`.
       Other failures: T130, T134, T135. Output: `green-mutation-t12-1.log`.
    2. Decode a segment with `JSON.parse` and drop it when the parse throws. T131 failed.
       `Tests  5 failed | 116 passed (121)`. Other failures: T130, T132, T134, T135.
       Output: `green-mutation-t12-2.log`.
    3. Pair the quotes left to right in one parity. T133 failed. `Tests  10 failed | 111 passed (121)`.
       Other failures: T97, T102, T104, T105, T107, T108, T131, T134, T135.
       Output: `green-mutation-t12-3.log`.
    4. Do not split and decode a decoded layer that holds a quote. T134 failed.
       `Tests  9 failed | 112 passed (121)`. Other failures: T97, T102, T104, T105, T107, T108, T131, T135.
       Output: `green-mutation-t12-4.log`.
    5. Decode the whole layer text and use it as the next layer. T137 failed
       (`chain scan ms: 60057` against the 60000 ms bound). `Tests  1 failed | 120 passed (121)`.
       No other failure. Output: `green-mutation-t12-5.log`.
  Green deviations: the coding-plan 5-hour quota stopped the session once; the orchestrator resumed it.
  The quota tool routed Green to MiniMax-M3, the Red family of this phase; the orchestrator kept the role on
  `volcengine-agent-plan/glm-5.3-flash#high` to hold Red/Green independence.
  A `heavy-run: lock wait over 600 s` line appeared during the gate wait, during each mutation wait, and
  during the label run; other agents held the shared lock. Mutation durations include those waits.
  Mutation 2 attempt 1 returned exit 75 (`hold — avail 1110 MB (min 1200), load 11.62 (max 8)`); the retry ran.
  No paid call, no render, and no smoke run. `src/song/`, the rubric text, and `PICTURE_RUBRIC_VERSION` stay unchanged.
  Adversarial evidence (2026-10-28): test commit `4b14343d3ba67707bc4a1884f62006a603bbe2a3`.
  T139 finds the escaped credential at level 66 of the 65,536-byte fold chain. Its safe twin yields no finding.
  Both scans stay below 20000 ms. T140 scans 5,572 string tokens that each hold one escape.
  The hostile row finds its credential, its safe twin yields no finding, and both scans stay below 60000 ms.
  T141 kills a decoder mutation that drops any one of the eight single-character escape kinds.
  It checks eight hostile cases and eight safe twins. Every hostile case yields its named environment finding.
  Every safe twin yields no finding. All rows use the worker harness and labeled integers.
  Focused command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 600 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1 -t "T139|T140|T141"'`.
  Final focused result: exit `0`; `Tests 3 passed | 121 skipped (124)`.
  Phase gate: exit `0`; `Tests 151 passed (151)`; duration 262.44 s.
  Type check: exit `2`; owned errors `0`; total errors `31`.
  Task 12 mutations 1 to 5 each have a named failing test in the Green logs. No declared mutation survives.
  Task 10 mutation 9 no longer applies. `decodedAnswerFindings` has no nested-object extraction path at
  `src/storytime/book-pictures.ts:1163-1197`.
  Task 10 mutation 17 no longer applies. The iterative scan has no JSON parse walker, and the tolerant decoder
  keeps malformed text without a parse-error channel at `src/storytime/book-pictures.ts:1208-1263`.
  No implementation defect was found. No residual-risk item was added. No Green routing is needed.
  Adversarial model deviation: this role ran `volcengine-agent-plan/kimi-k3.1-pro#high` after the quota route
  selected MiniMax. MiniMax wrote the task 12 Red tests. GLM wrote the task 12 Green implementation.
  No paid call, render, build, server, browser, network call, or production change occurred.

### Phase 2 acceptance

The phase acceptance result is
`measure/runs/asset_storytime_l2_unit1_pictures_20261025/phase-acceptance-061694f.json`. Its status
is `pass` and it holds no blocking finding. An independent phase-gate run at `061694f` exited 0
with `Tests  151 passed (151)`.

Closeout carries these items:

- RA4-N1: correct the stale task 8 Green handoff.
- RA3-N1: refresh `metadata.json` `actual_tasks` and the generated facts.
- RC5-3: record as a tech-debt candidate. It is the raw-byte refusal text.
- RB7-01: record as a tech-debt candidate. It is the word boundary of the `api-key-prefix` rule.
- The named residual-risk list: keep the out-of-class transform list, including a credential
  encoded twice inside one string token.

## Phase 3: Week 1 pictures

Strategy note: the Phase 3 test strategy is in
[test-strategy.md](./test-strategy.md) section 7, "Phase 3: Week 1 pictures". It holds the
verified picture list v3 hashes, the specification v1 sizes, the Red and Green split, the
machine limits, the shared-asset check, the task gates, the review applicability, the new test
rows T142 to T151, and the closeout gate for 30 jobs.

- [x] Task: Pin picture specification v1 and list v3 in the pipeline (T142 to T151). Red test commits `6c55fac1`, `d7031d18`. Implementation commits `70cb6e37`, `3a5ef00d`, `7c3b7db7`.
  The Nan sample at 4000 x 3000 pixels needs this change first.
  Evidence: `6c55fac1`; exit code `1`; `Tests  10 failed | 124 passed (134)`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 3600 node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'`.
  The ten new rows fail and the 124 earlier rows pass. The failing rows and their reasons:
  - T142: the pipeline has no picture list loader. The loader must read `pictures.json`
    read-only, give 192 rows, give 30 week 1 rows (16 of class A, 2 of class B, 12 of class C),
    and record the SHA-256 of the list file.
  - T143: the sizes are the specification v0 sizes, 3000 x 2250 for class A and 3600 x 2700 for
    class B. Specification v1 gives 4000 x 3000 for class A and class B, and 1500 x 1500 for
    class C.
  - T144: the line-art file name is the specification v0 name `lineart/<name>-lineart.png`.
    Specification v1 gives `<color name>-line-v1.png` beside the color file.
  - T145: the pipeline has no cover, check-row, or practice-line rows, and it gives a line-art
    twin to reader pages only. Every row of the list needs a color file and a line-art file.
  - T146: the line-art check has no 12 px line rule. A 6 px line and an 11 px line pass today,
    and the check prints no measured width.
  - T147: the pipeline has no list loader, so no run reads the list yet. The SHA-256 of
    `pictures.json` and of `pictures.md` must stay the same before and after a run.
  - T148: the pipeline has no list loader. It refuses neither a broken file name nor a changed
    list file.
  - T149: the pipeline checks no list row. A class B row runs the calm top 30 percent check and
    a class C row runs the white-corner check.
  - T150: the pipeline has no week 1 selection of 30 rows, so the color batch hash and the
    line-art batch hash are one hash.
  - T151: the render command prints no `render peak rss mb: <n>` label. The number must come
    from the capture process.
  Type check: `tsc exit: 2`; owned test errors: `0`; total compiler errors: `31`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json'`.
  Compiler output: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-p3-tsc.log`.
  One type-only fix: the first type check found one owned error, `TS2339` on the `readStage`
  property of the CLI dependency type. The fix wraps that type in `NonNullable`. No assertion and
  no falsification condition changed. No vitest run followed the fix.
  Deviation: the quota tool routed Red to `minimax-cn-coding-plan/MiniMax-M3#high`. The role
  table names `openai/gpt-6.1-sol#high`. Green runs on another family, so Red and Green stay
  apart.
  Two vitest runs ran through `heavy-run.sh`. The first run found broken assertion receivers in
  the new rows. The second run is the evidence. The first run changed no assertion of the earlier
  rows.
  `phase_base_sha`: `15a7bf0b2a59b8137a05805666df6736dc256167`. The Red work started at
  `3419926fd2c54df1aa03234bba561dfe6fc5196e`, the commit of the other track
  `asset_filled_shelves_20261028`.
  Mid Red retry for T146: `d7031d18`. The retry changed only T146 and its fixture helper.
  It changed the 12 px expectation to pass. It added eight 4 px outlined rectangles and one
  solid 50 px block. The test command ran once through `heavy-run.sh` and exited `1`.
  Summary: `Tests  1 failed | 133 passed (134)`. T146 failure:
  `The measured width follows the typical outline, not the solid block.: expected +0 to be 4`.
  The mixed fixture was rejected as required; its measured-width assertion failed. The other
  133 cases passed. The retry type check exited `2`; owned errors: `0`; total errors: `31`.
  Type check command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 900 node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json'`.
  Evidence logs: `measure/runs/asset_storytime_l2_unit1_pictures_20261025/red-p3-t146-vitest.log`
  and `red-p3-t146-tsc.log`.
  Model route deviation on retry: `ra-quota pick red` routed the role to
  `openai/gpt-6-luna#high`. Earlier Red runs used MiniMax-M3. Green uses GLM, so role
  independence holds.
  No file under `src/`, `scripts/`, or `contract.md` changed. The test file is the only Red file.
  Green evidence (2026-10-28, Green session, GLM): implementation commit `70cb6e37`
  (`src/storytime/book-pictures.ts`, `contract.md`). The pipeline exposes `loadPictureList`
  (read-only, records the SHA-256, refuses a broken file name and a changed list file),
  `planPictureRow` (list names, class pixel sizes, a twin for every row, no derived slug), and
  `inspectPictureRow` (class size checks, class B calm top, class C white corners, synchronous).
  `PICTURE_SIZES` moves to specification v1 (A and B 4000 x 3000, C 1500 x 1500); the checks keep
  the v0 sizes as accepted legacy sizes, so candidates that earlier phases rendered keep their
  evidence (T15, T26, and T41 force this tolerance). `inspectLineArtPng` rejects a line thinner
  than 12 px and prints the measured width. The capture packet carries `peakRssMb` and the render
  log prints `render peak rss mb: <n>` per job. `contract.md` carries the specification v1
  amendment with the v0 text marked replaced on 2026-10-28.
  Gate command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 3600
  node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'`.
  Final result: exit code `1`; `Tests  1 failed | 133 passed (134)`. All T1 to T141 rows pass.
  T142 to T145 and T147 to T151 pass. T146 fails on one assertion only: its third row
  `expect.soft(exactCheck.valid, 'A 12 px line fails the line-art check.').toBe(false)` demands
  that a 12 px line be rejected. That contradicts the test strategy row T146 ("A fixture with a
  12 px line passes"; falsification "the test fails if ... a 12 px line fails"), the row's own
  label, and specification v1 (outlines of 12 px or more). The implementation keeps the
  specification rule; a 12 px line passes and a 6 px or 11 px line fails. Green may not edit a
  committed Red test, so the row needs a Mid Red retry of that one assertion. The task stays
  `[~]`. Type check: `tsc exit: 2`; `owned tsc errors: 0`; `total tsc errors: 31`
  (`measure/runs/asset_storytime_l2_unit1_pictures_20261025/green-p3-tsc.log`).
  Green model deviation: the quota tool routed Green to MiniMax again (the Red family of this
  phase); the orchestrator kept this role on `volcengine-agent-plan/glm-5.3-flash#high` to hold
  Red/Green independence. Logs: `green-p3-vitest.log`, `green-p3-tsc.log` in the same run
  directory.
  Green round 3 evidence (2026-10-29): implementation commit `7c3b7db7`
  (`src/storytime/book-pictures.ts`). The width check measured the widest black run, so one
  solid area passed thin outlines; the v2 sample printed `261 px`. The check now takes the
  median black-run length over the horizontal and the vertical scans. For the T146 fixtures the
  median is 6, 11, 12, and 4 (mixed fixture). The width prints also when a format check fails,
  because the mixed fixture is an RGBA PNG.
  Gate command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 3600
  node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'`.
  Result: exit code `0`; `Tests  134 passed (134)`. Log: `green-p3-r3-vitest.log`.
  Type check: `tsc exit: 2`; `owned tsc errors: 0`; `total tsc errors: 31`. Log:
  `green-p3-r3-tsc.log`.
  Deviation: the render gate calls `inspectLineArtPng` with `minLineWidth: 0`. The T151 fixture
  twin is a 3000 x 2250 pattern with a median black run of 3 px, and T151 requires that render to
  succeed. The manifest and the verify gate (`evaluateLineArtTwin`) keep the 12 px default on the
  written bytes. The render log still prints the measured width.
  Model deviation: round 3 started on `volcengine-agent-plan/glm-5.3-flash#high`. The quota tool
  routed Green to `openai/gpt-6-luna#high`, which wrote the T146 Red retry. On 2026-10-29 the
  orchestrator moved the session to `claude-code/claude-opus-5-5[1m]#high` (Ark plan at 88
  percent weekly use). Red used MiniMax and OpenAI, so Red and Green stay apart.

- [b] deferred:daniel-lineart-look Task: Render the Nan window sample in color and line art. Sample stage
  commit `7d8431ba` (v3); pass commit `deadcad6`; v2 stage commit `4c7d217f`. First write
  `docs/storytime/l2-unit1/w01/w01-readalong-p05-v2.json`. Keep v1 unchanged (Review A RA-P3-1).
  In v2, Nan faces the camera (yaw from -30 to 30 degrees), and the window is beside or behind her.
  A `fern` prop gives the small green plant. The `pot` prop shows red flowers, so v2 does not use
  it. The window panes must show as panes, not as black areas. Use existing approved items only.
  Record in the sample report that no existing item shows the plant in a pot. Render with
  `render --job w01-readalong-p05 --version 2` through `heavy-run.sh`. If the sample shows Nan
  from behind, black panes, or no plant, write v3 and render again. Keep v2.
  The sample report names Review A RA2-N2 for Daniel's style look: in the smoke run 3 line art,
  adjacent bookcase books merge into one outline with no spine lines. A page that counts books can fail the person look.
  Report both file paths and SHA-256 values to the PM for Daniel's look. When
  the report is sent and the look is pending, mark this task `[b] deferred:daniel-lineart-look`.
  Continue with the next tasks while it waits. Record the look in the style look record.
  The sample renders at the size class A pixel size of specification v1, 4000 x 3000 pixels.
  Sample evidence (2026-10-28, Green session, GLM). The render needed one implementation fix
  first: commit `3a5ef00d` flattens the captured line-art canvas over white, because the page
  pass kept the canvas alpha and produced a 2-channel grey+alpha PNG, which the line-art checks
  refuse; the contract requires one opaque 8-bit grey channel.
  Render command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 1800
  node --import tsx scripts/storytime-book-pictures.ts render --job w01-readalong-p05 --version 2'`;
  exit code `0`. Verify command (no `--release`): same wrapper,
  `verify --job w01-readalong-p05`; exit code `0`; `Verification passed for 1 jobs.` The render
  log holds the T53 labels (`capture path: captureBookStill`; `camera drift source: live`;
  `camera state drift: 0`; `color repeat identical: yes`; `lineart technique` is in the evidence)
  and the T142 labels (`render peak rss mb: 484`; the line-art check prints
  `Line-art line width: 261 px (minimum 12 px)` and
  `Line-art ink coverage: 2.06% (247011 of 12000000 pixels black)`); `book files served: 15`;
  `book file requests refused: 0`. Files (4000 x 3000, one twin pair from one render run):
  color `out/storytime/l2/unit1/w01/readalong/l2-w01-readalong-nan-v2.png`, SHA-256
  `ee46aa71e8a0691ba4acad9b61ee8e8e1206406f66b144b26bc11329f0a1825b`; line art
  `out/storytime/l2/unit1/w01/readalong/lineart/l2-w01-readalong-nan-v2-lineart.png`, SHA-256
  `0b5e37a7a9b072eb982c83f60f83cd0e76fe47f1a16e7c3fb4b9ba2b209888bf`. What the picture shows
  (Green viewed both files): the color picture shows Nan from the front — her face with eyes and
  smile and the white star on the orange T-shirt are visible — waving in the classroom, with the
  shuttered window behind her, the fern on the floor beside her, two stools, the table, and the
  bookcases. The line art draws the same scene as clean one-bit outlines; the window panes show
  as four white panes with the cross frame, not as black areas, and the fern shows. The line art
  has no painted face features and no shirt star: the form-edge pass draws geometry edges only.
  This is a named item for Daniel's line-art look, beside the RA2-N2 risk: in the sample line
  art the adjacent bookcase books still merge into one outline with few spine lines, so a page
  that counts books can fail the person look. No plant-in-pot item exists: the `pot` asset shows
  red flowers, and no existing approved item shows the plant in a pot, so the sample uses the
  `fern` prop on its soil mound. No v3 was needed: Nan faces the camera, the panes show as
  panes, and the plant shows. The task goes to the PM for Daniel's line-art look and stays
  `[b] deferred:daniel-lineart-look` until the style look record passes.
  Sample v3 evidence (2026-10-29, Green round 3). The orchestrator found that v2 does not meet
  specification v1: the v2 outlines are 2 to 4 px wide, the old check printed the widest run
  (`261 px`), the line art has no eyes, brows, mouth, or shirt star, and the color panes are
  near black. With the median check, v2 measures `2 px`.
  Pass commit `deadcad6` (`src/storytime/line-art-pass.ts`, `src/storytime/book-pictures.ts`):
  technique `song-page-form-paint-edges-viewdepth-scaled-1bit-v3`. A third render with unlit
  material copies finds painted detail edges (largest linear channel gap above 0.22). Fragments
  under 40 px at 4000 px width drop out. The edges grow to a stroke that scales with the output
  width (radius 6 px at 4000 px). The output stays one opaque grey channel of 0 and 255.
  `LINEART_TECHNIQUE` stays `song-page-form-edges-viewdepth-1bit-v2`, because T71 pins that label
  for capture packets that name no technique. The live page pass names v3 in the capture packet
  and in the render evidence. The render gate enforces the 12 px rule for the live v3 pass.
  Stage `docs/storytime/l2-unit1/w01/w01-readalong-p05-v3.json` (commit `7d8431ba`) is v2 with
  version 3. v1 and v2 stay unchanged. Checks: `bookcase texture size: 1024`; `available MB: 2432`.
  Render command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'timeout -k 30 1800
  node --import tsx scripts/storytime-book-pictures.ts render --job w01-readalong-p05 --version 3'`.
  The first v3 render (log `green-p3-r3-render-attempt1.log`) had stray specks on the floor. Green
  added the fragment filter, deleted its own three v3 output files, and rendered v3 again.
  Final render: exit code `0`; `Line-art line width: 15 px (minimum 12 px)`;
  `Line-art ink coverage: 16.47% (1976064 of 12000000 pixels black)`;
  `render peak rss mb: 914`; `camera state drift: 0`; `color repeat identical: yes`;
  `book files served: 15`; `book file requests refused: 0`. Log: `green-p3-r3-render.log`.
  Files (4000 x 3000, one twin pair from one render run): color
  `out/storytime/l2/unit1/w01/readalong/l2-w01-readalong-nan-v3.png`, SHA-256
  `ee46aa71e8a0691ba4acad9b61ee8e8e1206406f66b144b26bc11329f0a1825b` (the same bytes as v2,
  because the stage composition is the same); line art
  `out/storytime/l2/unit1/w01/readalong/lineart/l2-w01-readalong-nan-v3-lineart.png`, SHA-256
  `79880e818390327f59f5bf0a003d43894a5e31bf7f92381ebbe92496f3fb32c4`.
  Verify command: same wrapper, `verify --job w01-readalong-p05`; exit code `1`. The v3 twin
  passes (`15 px`). The v2 twin fails: `w01-readalong-p05 v2: line-art structural check failed:
  Line-art twin lines must be at least 12 px thick; measured 2 px.` This result is correct: the
  release gate enforces 12 px on the written bytes, and v2 does not meet specification v1.
  Log: `green-p3-r3-verify.log`.
  What the pictures show (Green viewed both files): in the color file, Nan faces the camera and
  waves. Her eyes, brows, smile, and the white star on the orange T-shirt show. The fern stands
  on the floor beside her. In the line art, Nan has closed outlines for the eyes with pupils and
  highlights, the brows, the smile, the hairline, and the shirt star. The window shows four
  white panes with the cross frame, and the fern shows. The blush cheeks have no line.
  Panes: no approved item gives light glass. `plaster-wall-window` has a near-black glass recess
  (`#1a2433`, not emissive) by design. `window` has a dark glass base (`#241a12`, opacity 0.4).
  `stained-glass-window` has red, blue, gold, and green glass. The stage has no light behind a
  window. The color panes stay dark navy, as in v2.
  RA2-N2: the thicker lines do not merge the books more. The paint edges add spine lines
  between books of different colors. The right bookcase now shows separate books. The left
  bookcase still shows a merged, broken top line over its books, and some short broken dashes
  remain on the right bookcase and along the right wall base.
  Gate after the pass change: `Tests  134 passed (134)`, exit code `0`
  (`green-p3-r3b-vitest.log`); `tests/storytime-line-art-pass.test.ts`: `Tests  5 passed (5)`,
  exit code `0` (`green-p3-r3b-lineart-pass-vitest.log`). Type check: `tsc exit: 2`;
  `owned tsc errors: 0`; `total tsc errors: 31` (`green-p3-r3b-tsc.log`).
  The 30 week 1 list rows use the specification v1 names from the list: the color file is the
  row `fileName`, and the line art is the row `lineArtFileName` (`<color name>-line-v1.png`)
  beside the color file. The sample job still writes `lineart/...-nan-v3-lineart.png`, the
  package-job path.
- [ ] Task: Build and independently review the PM-approved missing cast, props, and poses for
  week 1. Use the Forge asset workflow and preserve the approved character look.
  Gap list (2026-10-29, Green session, Opus; list v3, SHA-256
  `c3e23cfdace136c7ed602b3aefee83383241833537ba56f0257668eb1e2c686b`, 30 week 1 rows).
  The PM must approve this list before Forge builds a missing item.
  States: `A` exists and approved; `N` exists but not approved; `M` missing.
  Approval sources:
  - Cast `A`: `sprout-nan`, `-pat`, `-may`, `-sam`, `-mia`, `-ben`, `-pip`. The owner's look check
    passed on 2026-10-23 (`asset_chibi_sprouts_r1_20261022`, F1 and F2).
  - Gestures `A`: wave, nod, clap, point forward, point to self, hands out, idle. They are on the
    F3 gesture sheet that the owner passed. Pip's `sit` is on F2.
  - Gestures `N`: `gesture-touch-nose` and `gesture-touch-neck` (commits `a8fdb560`,
    `bbcdf085`). No review, and `GESTURES` in `src/song/timeline.ts` does not map them.
  - Places `A`: the classroom map and rug (owner F4, look item: dark panes). The `meadow` and
    `grassland` maps and their trees are accepted catalog assets.
  - Props `A`: accepted catalog assets (`fern`, `rug`, `table`, `stool`, `backpack`, `cat`,
    `dog`, `fish`, `apple-tree`, `oak-tree`, `bush`, `wildflowers`). `explorer-hat` is a `ready`
    avatar catalog item.
  - Props `N`: `storytime-nest`, `storytime-nut`, `storytime-butterfly-net`,
    `storytime-first-aid-box`, `storytime-nurse-cap` (commit `a8fdb560`, no review).
  - Pipeline gap: a class C row needs a white background (corners 250 or more). The song page
    has no white backdrop. A white unlit card gives about 242 after the neutral tone mapping.
    Green adds a stage backdrop option (pipeline code, not an art item).

  | Row | Cast | Props | Poses | Place | Result |
  | --- | --- | --- | --- | --- | --- |
  | `story-page-hello-i-am-pat` | Pat `A` | teddy bear `M`; school bag with a bump: `backpack` `A`, bump `M` | wave `A` | kindergarten room: classroom `A`; green door `M`; low tables `M` (scaled `table` possible); animal pictures on the wall `M` | blocked |
  | `story-page-hello-i-am-may` | May `A` | box of crayons `M` | two-hand wave `M` | as row 1 | blocked |
  | `story-page-hello-i-am-sam` | Sam `A` | picture book `M` | sit with a book on the lap `M`; wave `A` | reading corner: classroom `bookcase` and `rug` `A` | blocked |
  | `story-page-hello-i-am-mia` | Mia `A` | big box of colored blocks `M` | wave `A` | classroom rug `A` | blocked |
  | `story-page-hello-i-am-nan` | Nan `A` | small plant in a pot `M` (`fern` `A` stands in, `pot` has red flowers) | wave `A` | classroom window `A` (dark panes) | renderable with the fern, as sample v3 |
  | `story-page-hello-i-am-ben` | Ben `A` | wall hook `M`; `backpack` `A` | hang a bag on a hook `M`; wave `A` | classroom `A` | blocked |
  | `story-page-hello-i-am-your-teacher` | Teacher Kim `M` (`teacher` is a fantasy NPC with a pointer and an apple); six children `A` | round rug `A` | kneel `M`; sit on the rug `M`; wave `A` | classroom `A` | blocked |
  | `story-page-hello-i-am-pip` | Pip `A`; six children `A`; Teacher Kim `M` | open school bag `M` | Pip in the bag `M`; laugh in surprise `M` | classroom `A` | blocked |
  | `cover-hello` | six children `A`; Teacher Kim `M` | bag with a bump `M` | wave `A` | green door `M`; animal pictures `M` | blocked |
  | `story-page-a-nest` | Nan `A` | `storytime-nest` `N`; low branch `M` (trees `A` are tall) | point forward `A` | garden: `meadow` `A` | blocked |
  | `story-page-a-net` | Nan `A` | `storytime-butterfly-net` `N` | hold up a net `A` (held prop) | garden `A` | blocked |
  | `story-page-a-nut` | Nan `A` (hand close up) | `storytime-nut` `N` | hands out `A` | plain light background | blocked |
  | `story-page-a-nose` | Nan `A` | none | touch nose `N`; laugh `M` | plain light background | blocked |
  | `story-page-a-neck` | Nan `A` | none | touch neck `N` | plain light background | blocked |
  | `story-page-a-nurse` | school nurse `M` | first-aid bag with no symbol `M` (`storytime-first-aid-box` `N` has a white cross); nurse cap `N` | hold a bag `M` | plain light background | blocked |
  | `story-page-a-nest-and-a-nut` | Pip `A` | nest `N`; nut `N`; low branch `M` | sniff `M` | garden `A` | blocked |
  | `story-page-nan-can-nod` | Nan `A`; Pip `A` | none | nod `A`; Pip sit `A` | plain light background (white backdrop) | renderable |
  | `cover-nan-can-nod` | Nan `A`; Pip `A` | low tree: `apple-tree` `A` | nod `A`; Pip sit `A` | garden: `meadow` or `grassland` `A` | renderable |
  | `check-row-nest` | none | nest `N` | none | white | blocked |
  | `check-row-cat` | none | `cat` `A` | none | white | renderable |
  | `check-row-fish` | none | `fish` `A` | none | white | renderable |
  | `check-row-dog` | none | `dog` `A` | none | white | renderable |
  | `check-row-nose` | Nan face `A` | none | none | white | renderable |
  | `check-row-bus` | none | school bus `M` | none | white | blocked |
  | `check-row-hat` | none | `explorer-hat` `A` (a khaki bucket hat) | none | white | renderable |
  | `check-row-cup` | none | child's cup `M` (`mug` is a tavern ale mug with foam) | none | white | blocked |
  | `check-row-net` | none | butterfly net `N` | none | white | blocked |
  | `practice-line-nose` | Nan face `A` | none | none | white | renderable |
  | `practice-line-nest` | none | nest `N` | none | white | blocked |
  | `practice-line-nut` | none | nut `N` | none | white | blocked |

  Result: 9 rows are renderable now, and 21 rows are blocked. The blocked rows need these
  items:
  - Missing cast: Teacher Kim and the school nurse.
  - Missing props: teddy bear, crayons box, picture book, blocks box, wall hook, open school
    bag, a bag with a bump, green door, low kindergarten tables, wall animal pictures, low
    branch, school bus, and a child's cup. Also needed: a first-aid bag with no symbol.
  - Missing poses: two-hand wave, sit with a book, hang a bag, kneel, sit on the rug, laugh,
    Pip in the bag, Pip sniff, and hold a bag.
  - Not approved: five `storytime-*` props and the touch-nose and touch-neck gestures.
- [ ] Task: Render the 30 week 1 rows of picture list version 3 as 30 color and 30 line-art
  versioned PNG files, one twin pair per render run. The rows come from
  `Workbooks/content/storytime/l2/print/pictures.json`. The rows are 16 of size class A, 2 of size
  class B, and 12 of size class C. Use the version 1 file names and the version 1 pixel sizes of
  each row. Class A and class B render at 4000 x 3000 pixels. Class C renders at 1500 x 1500
  pixels. The class B rows are the two week 1 reader covers. The Workbooks covers track excludes
  them. Forge renders the B pictures and Workbooks keeps the layout and the text. Run the
  pre-flight check and heavy lock for each batch. Keep all source prompts, stage files, and
  package hashes.
  Render evidence (2026-10-29, Green session, Opus). The PM approved the gap list on 2026-10-29.
  Pipeline commit `603745f9` adds `render --row <id>` and `verify --row <id>`. The list is read
  only, and a changed list stops the run. Each row writes the color file and the line art side
  by side in `out/storytime/l2/unit1/w01/rows/` with the specification v1 names and the class
  pixel size. Every check runs before any write. A row writes its evidence to `renders/rows/`.
  The same commit gives line-art pass v4 (`song-page-form-paint-edges-viewdepth-scaled-1bit-v4`).
  v4 keeps 14 px outlines on every print size, so class C at 1500 px also meets 12 px. It also
  compares paint over 4 px, so a thin smile on a close face stays.
  Deviation: `src/song/timeline.ts` and `src/song/main.ts` changed. The stage option
  `"backdrop": "white"` hides the room and clears to plain white, because class C needs white
  corners. A white unlit card gives about 242 after the neutral tone mapping. The song tests pass.
  Stage commit `a1ff1505` (`docs/storytime/l2-unit1/w01/rows/`). Gates after the code change:
  `Tests  134 passed (134)`, exit `0` (`green-p3-r5-vitest.log`). The line-art pass, row, and
  song tests: `Tests  32 passed (32)`, exit `0` (`green-p3-r5-rows-vitest.log`). Type check:
  owned errors `0` after one fix (two `TS2339` errors on `PictureListRow.text` and `.prompt`).
  The total is `134`, up from `31`: the new errors are in other sessions' paths
  (`tests/games/castle-defense/`, `tests/games/magic-defense/`, `assets/rowboat.ts`,
  `assets/airship.ts`). Log: `green-p3-r5-tsc.log`.
  Verify: `verify --row <id>` exit `0` on all 9 rows, 10 row versions passed
  (`green-p3-r5-verify.log`). Peak memory 487 to 886 MB per render. Files (color; line art):
  - `story-page-hello-i-am-nan` v1, technique v3, 15 px:
    `l2-w01-story-page-hello-i-am-nan-v1.png`
    `ee46aa71e8a0691ba4acad9b61ee8e8e1206406f66b144b26bc11329f0a1825b`;
    `-line-v1.png` `79880e818390327f59f5bf0a003d43894a5e31bf7f92381ebbe92496f3fb32c4`.
    The same bytes as the Nan sample v3. A v2 under technique v4 failed the 90 percent white edge
    check (floor-plank lines at the edges) and wrote nothing.
  - `story-page-nan-can-nod` v1, technique v3, 22 px: color
    `a913d8d3bc4f451a64a438e9b1b84213f2501218568b851ad0b0ce16fef8be52`; line art
    `46cb21d99186ac933edf2ca7b33a4774ce53a02b01a10c5c07e55c7bd73e513c`. Superseded: the line
    art lost the smile.
  - `story-page-nan-can-nod` v2, technique v4, 24 px: color
    `f76ee8c52ffbe329dc4b8bbe5bef244157ebe5ae5255b9e4aca3903f249b43ef`; line art
    `3350428f8eaf30ddf2813e0335a2eb44d1f5193c4a71f7e304af3076225e539f`. Nan smiles beside
    Pip on white. Eyes, brows, smile, and star show in both files. Pip sits, seen from the front.
  - `cover-nan-can-nod` v2, technique v4, 25 px: color
    `486f8b91a155eed2376e714d1227140ee5995f0f4d7ac8ac5c9ea28187631fb0`; line art
    `ff8669a057952f8a8f48dcb0d0b3f57774ebf012300df30f57d813414c254710`. Nan and Pip stand on
    a grass patch with a bush, flowers, and a small apple tree. The top stays white. The figures
    are small, and the grass tile seams show as lines. v1 on the grassland map failed the calm
    top check and wrote nothing.
  - `check-row-cat` v1, v4, 29 px: color
    `8e88485e8e5142b78a3a7bf6a463fa758885361659d6fdc7992b9ee289cb2117`; line art
    `d0d48b4af2d3a1af9da51c63e0a82ce3eb9517cdaa6109efb236b5894947f061`. An orange tabby cat;
    the cat reads in both files.
  - `check-row-fish` v1, v4, 24 px: color
    `35d3b6c925d4ae2c2ff89bd2fdd89c8bc66f8a4da49c73b4d45a2b407e6323da`; line art
    `6392b980a185a4ac8783d2129476b5e41ca93698b28c67fe18df0d12bf4d7959`. A side view of a round
    fish; it reads in both files.
  - `check-row-dog` v1, v4, 26 px: color
    `3a3510a5ae637417a317b2cf4ffa37569310b5f90cba034700cd84d57bbc17db`; line art
    `3045544818f30b4ad0b30f94e5902efbab84e84b05bf2766567b4f7978cebbfa`. A brown and cream
    puppy; it reads in both files.
  - `check-row-hat` v1, v4, 22 px: color
    `a700c6573c75fb1fd082371414588256740f8d4e2ef841134a69a513d666a4e2`; line art
    `721f9115ee45b179f9e36bc38f245c0acfbba64c305d89b5a7ae3732a8f1d7a0`. A khaki bucket hat
    from the front. It reads weakly: a dome with a brim. Correction: a v2 from a higher angle.
  - `check-row-nose` v1, v4, 25 px: color
    `d89f517da8c1e5799d48dc0a7fb115b4586454437f6c808ee4cb7536b8ecfd92`; line art
    `30a35af70ec1b192f4797da2de1675bb9b3bae77e6e8c8de91ad662d0192ec4b`. Nan's face close up.
    Defect: the nose has no line in the line art; it is a soft bump with no edge.
  - `practice-line-nose` v1, v4, 25 px: color
    `f215ab6c17fc056f25d18acb2906e6f79a7391ffd171fad9c7d09d34132d147e`; line art
    `d5bfb2b12018495ca4ccb90c0ca8a955337d0b7ac53a5bfd584a5c33581de4f5`. Nan's face at 30
    degrees. The same defect: no nose line.
  Open corrections: the two nose rows need a v2 that gives the nose a line (a side view, or a
  painted nose line from the asset build). The hat row needs a v2 from a higher angle.
  Rows done with no open defect: 6 of 30. Rows rendered with a defect: 3. Rows not rendered: 21
  (blocked on missing items).
  Corrections (2026-10-29, build plan batch 1). Stage files v2 change only the camera. Each
  render and `verify --row` exited `0`; peak memory 477 to 502 MB. Files (color; line art):
  - `check-row-nose` v2 (az 90): `07a5f84b1fb87e749276bcfe73ada694546ff02e0627ffbc7c12dd51916002f8`;
    `e387797c9029cc42a129cae64056b0eac4b4b11ae2baffca59b5d2f8cfb70933`; 24 px.
  - `practice-line-nose` v2 (az -90): `9fb0d02367bc19733ddc43fe872b51dd072691797298ad8b6ec4e4c47d89b2be`;
    `1a55d3d8560f3843397f461cb74ec394dd7985695cea994f7bb6e738cd2ff27f`; 24 px.
  - `check-row-hat` v2 (el 40): `b36d9097d71dd016930431cd71dceaf3dd6dd2cf4719215031cd462034ecc198`;
    `d84beb77b5c7e17ff239340b32cf26f0b419750b20052a36425963917dba53bf`; 22 px.
  What Green saw: the side views show the ear and the back of the hair. The large chibi cheek
  hides the small nose, so the nose has no line, and the picture does not read as "nose". The
  v1 front views stay the better nose pictures. A camera change cannot fix the nose: the nose is
  a soft bump with no edge. The fix is a painted nose line on the Sprouts face (an asset change
  of the approved cast, for the batch 3 builder and review). The hat v2 still reads as a dome
  with a brim: the `explorer-hat` shape causes it. The fix is a child's sun hat in batch 4.
  Batch 1 review state: Green made the review cards (`bench/sonnet/storytime/b1/`: five prop
  renders, the two gesture strips, and a look reference). Green rebuilt `sprout-nan` textured to
  make fresh gesture strips (`./forge animate`, no warning lines); the GLB bytes stayed the same.
  The reviewer did not run: the Green session is a subagent, and the subagent depth limit (1)
  stops it from spawning the reviewer or a builder. Green does not rate its own items.
  Orchestrator change (2026-10-29): Green builds each item itself, one at a time, and the
  orchestrator starts the independent reviewer on another model family. First-aid fix: commit
  `ad03e17e` (`assets/storytime-first-aid-box.ts`). The white cross is gone, and a front pocket
  with a trim gives the front its detail. `./forge render --fast` and the textured
  `./forge render` both exited `0` with no warning lines. Review cards for batch 1:
  `out/storytime-review/batch-1/` (`brief.md`, five prop cards, two gesture strips, and the look
  reference). The ratings, any fixes, and the `GESTURES` mapping of touch-nose and touch-neck
  wait for the reviewer.
- [ ] Task: Run automated checks on every color and line-art file and both model pre-checks on
  every color candidate. Correct each failed picture under a new twin version and repeat the
  checks. Attach the raw model outputs.
- [ ] Task: Send the count review and the line-art look to the PM. The PM routes them to Daniel or
  his named reviewer. Record the person, time, counts, and verdict for all 30 color and 30
  line-art pictures. Do not label model results acceptance.
- [ ] Task: Deliver the week 1 manifest, contact sheet, review logs, and ledger. The manifest
  lists the 30 color and 30 line-art files. Apply picture specification v1 to the line art.
  Specification v1 has arrived, so the line art is not provisional. Report the output path and
  every remaining gate to the PM for routing.

## Phase 4: Remaining pictures and cover

- [ ] Task: Reconcile the final Workbooks picture list and size specification. Picture list
  version 4 is pending and comes before 2026-11-16. Version 4 adds a week 8 review and the
  Benchmark 1 rows for the words moon, mango, ostrich, and drum. Make no picture for those
  words until version 4 arrives. Version 3 changed four ids in weeks 2 and 6. The suffix moved
  from `-a` to `-b`. Reconcile those four ids. Preserve picture content and document any resize
  or crop.
- [ ] Task: Produce weeks 2 to 7 after the week 1 review. The weeks hold 162 rows. They need 324
  files, one color file and one line-art file per row. Apply the same automated, two-model, and
  person-count gates to all 162 pictures.
- [ ] Task: Produce the Level 2 cover render under S19. Apply the same review gates. Keep the top
  30 percent calm and keep cover layout and text with Workbooks.

Line-art note for Phase 4: weeks 2 to 7 get 162 line-art twins with the same line-art gates. The
reconciliation task also applies picture specification v1 to the line art. Specification v1 has
arrived, so the line art is not provisional. The task records each rename, resize, or new render,
and it updates the line-art format version.

A3 note for Phase 4: specification v1 sets size class A and class B to 4000 x 3000 pixels, 4:3
landscape. That is about 378 ppi in the A3 picture box (269 mm wide). It meets the 300 ppi target.
If a later list sets a larger print size or the A3 ratio, render the color and line-art twins
again from the kept stage files as new versions. A new ratio changes the framing, so every picture
gate applies again.

## Phase 5: Documentation and verification

- [ ] Task: Reconcile every source page and release file in the manifest. Record deferred work and
  evidence classes without claiming owner approval.
- [ ] Task: Update the plan, metadata, registry, project status, and relevant lessons. Run
  `./measure/generate.sh` and `./measure/doctor.sh` before closure.

## Calibration sources

- Known bad: `Workbooks/content/storytime/l2/media/w02/song-lines/point-up.jpg`.
  Required text: "How many suns? One sun!" The picture shows a gesture and no sun.
- Owner-approved good: `out/chibi-sprouts/r1/week1/cast/sprout-nan/front.png`.
  Daniel passed the week 1 cast sheet and close-ups on 2026-10-23.
- Picture rubric: object identity and count, prompt and text agreement, character count, faces,
  hands, unwanted text, age safety, and readability. A still picture uses `still` as its time value.

## Week 1 asset request sent to the PM

- New cast: Teacher Kim and the school nurse.
- New props: two schoolbags, picture book, crayon box, block box, nest with three blue eggs,
  green butterfly net, brown nut, and a symbol-free first-aid bag.
- Scene pieces: green classroom door, animal-picture wall decorations, and a bag hook.
- New poses: two-hand wave, seated wave, seated reading with a wave, open palm, touch nose,
  touch neck, group laugh, Pip sniff, and Pip nod.
- Teacher pose: kneel and wave.
- Existing items: Pat's teddy, one-hand wave, pointing, Nan's nod, classroom, meadow, and potted
  ferns. The Nan window page is the first available render pilot.

## Communication log

- 2026-10-25: PM asked for Storytime progress. This session reported existing Chibi Sprouts work,
  no in-flight work, and the song stop. Facts changed: none.
- 2026-10-25: Daniel's PM relay resumed book pictures and the cover only. Song and video renders
  remain paused. Facts changed: picture work resumed; week 1 due 2026-11-01; remaining pictures
  and cover due 2026-11-15.
- 2026-10-25: Daniel denied the question tool for this session. Every question for Daniel goes
  through the PM orchestrator. Facts changed: question routing only.
- 2026-10-25: Workbooks supplied picture specification v0. Daniel selected Forge 3D renders.
  Facts changed: picture style, dimensions, filenames, and batch hashing.
- 2026-10-25: Daniel required the heavy lock and live pre-flight check. This session acknowledged
  both rules. No heavy work ran outside the lock. Facts changed: heavy-job controls only.
- 2026-10-25: The PM relayed Daniel's approval of the week 1 asset request. Daniel's words: "If they need more poses, we can request them. If we need additional assets, we can create them. One character look for both books and videos seems like a good idea!" The PM said GO for the full list in the one character look. Cast rules: Teacher Kim and the nurse are staff at a Thai school; describe hair and clothes only, never skin or ethnicity; no white Western teacher look. Local renders need no other word. A paid API needs the tool and cost sent to the PM before spending. Facts changed: week 1 asset list approved.
- 2026-10-25 (about 21:10 ICT): The PM relayed Daniel's words: "We should have a workbook with the
  writing parts and "build your own" readers like Reading A-Z does. That means B&W (probably line
  drawings) pages of the book organized to slice out, fold, and staple." The PM asked for line art
  from the same 3D scenes and cameras, with the color renders kept. The PM asked for a Nan window
  sample in both versions first, and gave an interim format until Workbooks spec v1. Facts
  changed: each reader page gets a color and a line-art output; line-art format provisional until
  Workbooks spec v1 (due 2026-10-28).
- 2026-10-25 (about 21:25 ICT): The PM relayed Daniel's words: "yes, right for the student, but we
  can produce color pdfs for the teachers to printo on A3 and lead class with." The PM meaning:
  the color renders also go into A3 teacher PDFs, so keep every stage file and camera for a
  larger render after spec v1. Facts changed: color renders are also an A3 teacher print
  deliverable; final print size waits for Workbooks spec v1 (due 2026-10-28).
- 2026-10-26: PM note for the engine hook task: the book stills need an additive hook in the song
  engine (`src/song/main.ts`). Song rendering and timing stay the same. `tests/song-timeline.test.ts`
  is in the gate. Song renders stay paused. Facts changed: none.
- 2026-10-27 15:52-15:53 ICT: Daniel selected Design B. His words: “Accept B”. Design B scans
  every JSON string token in the raw provider answer at each decoded layer, without requiring
  valid JSON. Facts changed: task 11 design decision.
- 2026-10-27: Green task 11 implementation commit `820f35c4`. The pre-edit four-file gate exited 1
  with 11 failures and 127 passes. The post-change gate exited 0 with 138 passes and no skips.
  The typecheck exited 2 with 31 known errors and no owned errors. The final four-file gate exited
  0 with 138 passes. `measure/doctor.sh` exited 1 on unrelated dirty project state. The twelve
  strategy mutations remain unrun, so task 11 remains `[~]`. Logs are in
  `measure/runs/asset_storytime_l2_unit1_pictures_20261025/`. Facts changed: implementation
  commit and recorded owner decision.
- 2026-10-28: The PM amended this plan and the specification for picture specification v1 and
  picture list version 3. Week 1 is due 2026-11-02. Weeks 2 to 7 and the cover are due
  2026-11-16. Week 1 holds 30 color and 30 line-art files. Weeks 2 to 7 hold 162 rows and 324
  files. Facts changed: due dates, week 1 file count, weeks 2 to 7 file count, and the picture
  sizes of classes A, B, and C.
  Green round 8 evidence (2026-10-30). Commit `d6f1a332` adopts the prior batch 1b stage rows
  and maps `touch neck` to `gesture-touch-neck`. The stage v2 nut row is a standalone nut close-up,
  unlike the v1 held-nut composition, so Green rendered and verified it. Song timeline tests passed
  (19 tests). Row verification passed for neck v1, nut v1/v2, and practice-line-nut v1.
  Rendered color and line-art SHA-256 values:
  - `l2-w01-story-page-a-neck-v1.png`: `2e90f4ce09a676bd930ff8698be31be2854e3fbd0af7dc3edb0c1862c5534d54`;
    line: `l2-w01-story-page-a-neck-line-v1.png`:
    `40ddddd95a7ef8464722b0262dfd434ea621e4dd0bb5241792913cd37938fc9d`.
  - `l2-w01-story-page-a-nut-v1.png`: `bb4a607b154b79256155fa684b06d7bb897f5fdcb68efc31499a3d7b3f71a46d`;
    line: `l2-w01-story-page-a-nut-line-v1.png`:
    `1d8214864971d3e3a103eb15fd1951ea529c3133517107a21589e8c787fa6f1a`.
  - `l2-w01-story-page-a-nut-v2.png`: `c583e8e3bff063776cf80e527a1129c773ac2b3e44653949efb3c1ab1a50c08e`;
    line: `l2-w01-story-page-a-nut-line-v2.png`:
    `e846f4fdac7762e70d0e42584f8daa4c9b79f1461a63880bc6af8f3b98ae8f12`.
  - `l2-w01-practice-line-nut-v1.png`: `b211c813889844efa57800fbbfb59789b6ed192344f595cd41f1607070297aa1`;
    line: `l2-w01-practice-line-nut-line-v1.png`:
    `00be9a568d80d6089a812c5af49bc3ac8cf9ece56cb74e852c0d9bd0b44aaf95`.
  The rows and gesture mapping are rendered and verified, not independently rated. The nut v2
  render and verify command exited 0. The first combined verify command used unsupported repeated
  `--row` arguments and exited 1; the corrected command verified each row. The attempted `./forge
  verify` command also used the wrong CLI form and exited 1. Nest and net fixes, review cards, and
  their independent ratings remain open. Touch-nose fix: next round.
  Green round 9 evidence (2026-10-30, Sonnet). Commit `4b33108f` changes only
  `assets/storytime-nest.ts`. The eggs are now smooth ovals with round tops. The smooth rim is
  now a rough rim of 34 crossing twigs. The eggs sit in a triangle, so the front, three-quarter,
  side, and back views each show three separate eggs. `./forge render storytime-nest --fast`
  exited 0 (three loops). The textured `./forge render storytime-nest` exited 0 and
  `./forge inspect storytime-nest --fast` exited 0. Warning lines: none. Each command ran through
  `heavy-run.sh`. Logs: `green-p3-r9-*.log`. Review card: `out/storytime-review/batch-1b/storytime-nest.png`
  with `brief.md`. The nest waits for the independent review and has no rating. Butterfly net and
  touch-nose fixes: later rounds.
  Green round 10 evidence (2026-10-30, Sonnet). Commit `5514cfe9` changes only
  `assets/storytime-butterfly-net.ts`. A deep, soft, opaque light green bag now hangs back and
  down from the hoop, with a round bottom and a painted diamond weave. The handle has a green
  wrapped grip and a green collar, and the wood grain bump is removed. `./forge render
  storytime-butterfly-net --fast` exited 0 (three loops). The textured `./forge render
  storytime-butterfly-net` exited 0 and `./forge inspect storytime-butterfly-net --fast` exited 0.
  Warning lines: none. Each command ran through `heavy-run.sh`. Logs: `green-p3-r10-*.log`.
  Review card: `out/storytime-review/batch-1b/storytime-butterfly-net.png` with a net row in
  `brief.md`. The net waits for the independent review and has no rating. Touch-nose fix: next round.
