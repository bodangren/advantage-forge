# Storytime Level 2 unit 1 book pictures

Status: in progress (started 2026-10-25). Week 1 is due 2026-11-01. Weeks 2 to 7 and the cover
render are due 2026-11-15. The [specification](./spec.md) owns the scope and acceptance gates.

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

## Phase 2: Tests and calibrated model pre-checks

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
- [~] Task: Correct the Review B security findings and Review A RA2-N1. Commit `597013bd` (remediation)
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

## Phase 3: Week 1 pictures

- [ ] Task: Render the Nan window sample in color and line art. First write
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
- [ ] Task: Build and independently review the PM-approved missing cast, props, and poses for
  week 1. Use the Forge asset workflow and preserve the approved character look.
- [ ] Task: Render the 16 week 1 pages as 16 color and 16 line-art versioned PNG files, one twin
  pair per render run. Run the pre-flight check and heavy lock for each batch. Keep all source
  prompts, stage files, and package hashes.
- [ ] Task: Run automated checks on every color and line-art file and both model pre-checks on
  every color candidate. Correct each failed picture under a new twin version and repeat the
  checks. Attach the raw model outputs.
- [ ] Task: Send the count review and the line-art look to the PM. The PM routes them to Daniel or
  his named reviewer. Record the person, time, counts, and verdict for all 16 color and 16
  line-art pictures. Do not label model results acceptance.
- [ ] Task: Deliver the week 1 manifest, contact sheet, review logs, and ledger. Apply picture
  spec v1 to the line art if it arrived. Otherwise label the line art provisional. Report the
  output path and every remaining gate to the PM for routing.

## Phase 4: Remaining pictures and cover

- [ ] Task: Reconcile the final Workbooks picture list and size specification. Preserve picture
  content and document any resize or crop.
- [ ] Task: Produce weeks 2 to 7 after the week 1 review. Apply the same automated, two-model,
  and person-count gates to all 96 pictures.
- [ ] Task: Produce the Level 2 cover render under S19. Apply the same review gates. Keep the top
  30 percent calm and keep cover layout and text with Workbooks.

Line-art note for Phase 4: weeks 2 to 7 get 96 line-art twins with the same line-art gates. The
reconciliation task also applies picture spec v1 to the line art. It records each rename,
resize, or new render, and it updates the line-art format version.

A3 note for Phase 4: if spec v1 sets a larger print size or the A3 ratio, render the color and
line-art twins again from the kept stage files as new versions. A new ratio changes the framing,
so every picture gate applies again.

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
