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
- The initial MiniMax quota check reports 94% for the interval and 89% for the week.
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
  the second call.
  A calibration pass calibrates the model pre-check only. It is not acceptance of any picture.

## Phase 3: Week 1 pictures

- [ ] Task: Render the Nan window sample in color and line art. Run the pre-flight check and the
  heavy lock first. Report both file paths and SHA-256 values to the PM for Daniel's look. When
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
