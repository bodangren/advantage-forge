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

- [x] Task: Add failing tests for source counts, scene contracts, descriptive versions, manifest
  validation, layout, line-art twins, and output isolation. Record the red result.
  Evidence: `01c01bdf`; exit code `1`; `Tests  24 failed | 17 passed (41)`.
  Type-only test fix: `5cbb3407` types the T13 runner parameters. No assertion or falsification condition changed.
  Type check: `tsc exit: 2`; owned test errors: `0`; Storytime source errors: `7`; total compiler errors: `38`.
  Green owns the source errors. Compiler output: `/tmp/opencode/red-tsc-db79a72.log`. No vitest run accompanied this fix.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'`.
  The final run had no timeout failures. T3 and T21 passed against the untracked draft.
  The PM's heavy-run rule replaces the separate preflight and lock steps for this gate.
- [x] Task: Implement the minimal picture pipeline with color and line-art twin outputs from one
  render run. Pass the focused tests and type checks. Keep `src/song/` unchanged. Make no paid
  calls and run no heavy render during this task.
  Evidence: `fafa82dc`; exit code `0`; `Tests  41 passed (41)`;
  `owned tsc errors: 0`; `baseline tsc errors: 31` (outside the owned paths; see known_failures);
  `git diff --quiet 1d39b8fda457e12d8e7332e7de65d2046ddda78e -- src/song` exit `0`.
  Command: `bash ~/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node_modules/.bin/vitest run tests/storytime-book-pictures.test.ts --maxWorkers=1'`.
  The Red type fix `5cbb3407` (test line 433, type-only) unblocked the type gate. The real
  line-art capture pass needs the engine hook task before a live render (see the Green log).
- [ ] Task: Calibrate the picture rubric with MiniMax and Kimi. Fail the known bad "One sun"
  thumbnail and pass the owner-approved Nan cutout. Save raw outputs and the prior-call ledger.

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
