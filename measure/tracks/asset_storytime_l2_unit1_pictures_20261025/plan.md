# Storytime Level 2 unit 1 book pictures

Status: in progress (started 2026-10-25). Week 1 is due 2026-11-01. Weeks 2 to 7 and the cover
render are due 2026-11-15. The [specification](./spec.md) owns the scope and acceptance gates.

## Method and ownership

- Primary owner: this OpenCode session.
- Owned source paths: `src/storytime/`, `scripts/storytime-book-pictures.ts`, and
  `tests/storytime-book-pictures.test.ts`.
- Owned output path: `out/storytime/l2/unit1/`.
- Owned planning path: `measure/tracks/asset_storytime_l2_unit1_pictures_20261025/`.
- Do not change `assets/fireball.ts` or `out/fireball/`. Their owner review remains separate.
- Use one paid generation call at a time. Do not run song or video commands.
- MiniMax image-01 and MiniMax VLM use the existing subscription at about zero marginal cash cost.
- Moonshot Kimi K3.1 Pro uses the existing OpenCode plan at about zero marginal cash cost.
- The provider CLIs do not report a per-call cash price. Record that fact instead of inventing one.
- The initial MiniMax quota check reports 94% for the interval and 89% for the week.
- MiniMax video caps are 3 per day and 21 per week. This track makes no video calls.

## Phase 1: Contract and controls

- [x] Task: Record the owner order, scope, dates, output contract, providers, prices, and human
  gates. Evidence class: automated planning record. 2fdce9d
- [~] Task: Define the source extraction, versioned picture, review-log, ledger, and manifest
  contracts. Include the known bad and owner-approved calibration pictures.

## Phase 2: Tests and calibrated model pre-checks

- [ ] Task: Add failing tests for source counts, prompt construction, descriptive versions,
  manifest validation, and output isolation. Record the red result.
- [ ] Task: Implement the minimal picture pipeline and pass the focused tests and type checks.
  Make no paid calls during this task.
- [ ] Task: Calibrate the picture rubric with MiniMax and Kimi. Fail the known bad "One sun"
  thumbnail and pass the owner-approved Pat picture. Save raw outputs and the prior-call ledger.

## Phase 3: Week 1 pictures

- [ ] Task: Generate the 16 week 1 candidates as versioned PNG files. Log every paid call before
  it runs. Keep all source prompts and package hashes.
- [ ] Task: Run automated checks and both model pre-checks on every candidate. Correct each failed
  picture under a new version and repeat the checks. Attach the raw model outputs.
- [ ] Task: Ask Daniel or his named reviewer to count every object against the page text. Record
  the person, time, counts, and verdict for all 16 pictures. Do not label model results acceptance.
- [ ] Task: Deliver the week 1 manifest, contact sheet, review logs, and ledger. Report the output
  path and every remaining gate to Daniel and the PM.

## Phase 4: Remaining pictures and cover

- [ ] Task: Record and apply the Workbooks print size specification. Preserve picture content and
  document any resize or crop.
- [ ] Task: Produce weeks 2 to 7 after the week 1 review. Apply the same automated, two-model,
  and person-count gates to all 96 pictures.
- [ ] Task: Produce the Level 2 cover render under S19. Apply the same review gates. Keep cover
  layout and text with Workbooks.

## Phase 5: Documentation and verification

- [ ] Task: Reconcile every source page and release file in the manifest. Record deferred work and
  evidence classes without claiming owner approval.
- [ ] Task: Update the plan, metadata, registry, project status, and relevant lessons. Run
  `./measure/generate.sh` and `./measure/doctor.sh` before closure.

## Calibration sources

- Known bad: `Workbooks/content/storytime/l2/media/w02/song-lines/point-up.jpg`.
  Required text: "How many suns? One sun!" The picture shows a gesture and no sun.
- Owner-approved good: `Workbooks/docs/content-plans/character-sheets/pat.jpg`.
  `cast.json` records Daniel's approval on 2026-10-01.
- Picture rubric: object identity and count, prompt and text agreement, character count, faces,
  hands, unwanted text, age safety, and readability. A still picture uses `still` as its time value.

## Communication log

- 2026-10-25: PM asked for Storytime progress. This session reported existing Chibi Sprouts work,
  no in-flight work, and the song stop. Facts changed: none.
- 2026-10-25: Daniel's PM relay resumed book pictures and the cover only. Song and video renders
  remain paused. Facts changed: picture work resumed; week 1 due 2026-11-01; remaining pictures
  and cover due 2026-11-15.
