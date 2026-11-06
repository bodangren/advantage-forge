# Storytime Level 2 card pictures (31 cards)

Status: new (2026-11-06). The picture date needed is 2026-11-12. The
[specification](./spec.md) owns the scope and the acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track.
- Owned paths are in the "Owned paths" section of the specification. The owned planning paths are
  this folder and `measure/runs/asset_storytime_l2_cards_20261106/`.
- Do not change `assets/fireball.ts` or `out/fireball/`. Their owner review stays separate.
- The question tool is denied. Route every question for Daniel through the PM orchestrator.
- Other agents share the git index. Commit explicit paths only.
- Muse calls, judge batches, and the delivery writer are light roles. They run with `node` and
  without `heavy-run.sh`.
- Run every full test suite and the typecheck with
  `bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. Exit code 75
  means hold. Record `lock wait over 600 s` and stop the run.
- No song or video command runs.
- Spend cap: 1.60 USD. Report point: 0.80 USD. Spend so far: 0.00 USD. No Muse call ran.
- The delivery is model evidence. It is not acceptance. No text may claim that Daniel or Workbooks
  accepted a picture.
- Doctor baseline before this track: 11 errors, all in other tracks. This track must add none.

### Task markers

`[x]` means complete. `[~]` means in progress. `[b]` means blocked, with a trailing
`deferred:<owner>` field. The orchestrator changes `[b]` to `[~]` when the blocker clears and the
task starts. The author set every work task to `[b]` because no work task has started. The blocker
of Tasks 1 to 3 is the spec review (Gate S). The blocker of Tasks 4 to 9 is the acceptance of
Phase 1.

### Lanes and roles

- Phase 1 is the standard lane: Red, Green, the review gates that the test strategy assigns, and
  phase acceptance.
- Phase 2 is the light lane (PM rule of 2026-11-03): one maker (`measure-jr-green`) and one
  checker (`measure-phase-acceptance`). No Red, no Reviews A, B, and C, no adversarial test, and
  no UX browser review.
- After Phase 2 the track has a final acceptance and a closeout. These are track-level roles, not
  phases.

## Phase 0: Authoring and spec review

- [x] Task 0: Author the track: specification, plan, metadata, index, spec review note, and the
  registry entry. The creation commit has the message `measure(storytime_l2_cards): create the track`.
- [~] Gate S: Spec review by `measure-spec-review` before Red starts (paraphrase, zoom-out check,
  and zero-decision check). The result goes to `measure/runs/asset_storytime_l2_cards_20261106/`.
  This gate is the active item of the track. Tasks 1 to 3 wait for it.

The Measure doctor of this repository counts only the markers `[ ]`, `[~]`, and `[x]`. It does not
count `[b]`. Task 0 and Gate S give the doctor one completed item and one open item, so the plan
passes its marker checks while every work task stays `[b]`.

## Phase 1: Card guard, card specs, and fixture

- [b] Task 1: Move the T180 fixture. Copy the Workbooks version 3 list (the bytes of Workbooks
  commit `078917f1`, `content/storytime/l2/print/pictures.json`) into `tests/fixtures/storytime/`.
  Point `LIST_V3_SHADOW_FILE` and `V3_SHADOW_FILE` at the copy. Done when both tests read the
  repository copy, no test path names `/tmp/opencode/wb-shadow`, and both test files behave as
  before with `/tmp/opencode/wb-shadow` absent. — deferred:measure-spec-review
  - Knowledge todo 7050174a closes with this task.
  - The fixture SHA-256 must equal `c3e23cfdace136c7ed602b3aefee83383241833537ba56f0257668eb1e2c686b`.
  - The maker proves the "absent" condition with a run in which the `/tmp` path does not exist (for
    example by running the two test files and checking that no test opens a `/tmp/opencode` path).
- [b] Task 2: Card run guard. Add a second run config in `scripts/storytime-muse-guards.mjs`
  (types in `scripts/storytime-muse-guards.d.mts`) with its own start time, a cap of 1.60 USD, a
  report point of 0.80 USD, and 3 tries for each id and kind. It applies to specs in
  `out/storytime/l2/unit1/cards/muse`. The restart config (`RESTART_START`
  `2026-11-04T07:54:00Z`, cap 1.00 USD) and its tests stay unchanged. — deferred:measure-spec-review
  - The tool picks the config from the spec `outDir`. A call that mixes restart specs and card
    specs is refused with exit code 3.
  - The card start time lies after the newest cost row of the restart run. The maker records the
    value and its reason in the plan note.
  - `scripts/storytime-judge-batch.mjs` reads the card specs and counts card tries from the card
    start time. Its behavior for the A-48 specs stays unchanged (it has its own `SPEC_DIR` and
    `RESTART_START`).
  - New guard tests go in `tests/storytime-card-guards.test.ts`. They cover: card cap and report
    point, a fourth try refused, a mixed call refused, restart rows not counted in the card spend,
    and an unchanged restart config.
  - Gate: `tests/storytime-muse-attempts.test.ts` and `tests/storytime-judge-batch.test.ts` pass
    unchanged.
- [b] Task 3: The 31 card spec files in `docs/storytime/l2-unit1/cards/<id>.json`, and a test that
  checks them against list v7 (SHA pin `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf`):
  ids, text, file names, size, aspect, `outDir`, and that every reference file exists. The
  references follow the table in the specification. The maker records each prompt difference
  (Nan buns, teddy, car, and any other) in the plan note. — deferred:measure-spec-review
  - The test file is `tests/storytime-card-specs.test.ts`. It reads the list from the Workbooks
    path and checks the SHA first. A SHA mismatch is a hard failure, not a skip.
  - The test checks 13 person cards, 3 prop cards with references, and 15 cards without references.
  - No Muse call and no provider call runs in this phase. Spend stays 0.00 USD.
- [b] Phase 1 gates: review gates assigned by the test strategy, then phase acceptance at an
  immutable HEAD. — deferred:measure-spec-review

## Phase 2: Card pictures and delivery

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`).

- [b] Task 4: Judge calibration check. Run the two gate control files of `calibration-set.json`
  (the `a-nose` version 1 line art and the `nan-can-get-a-pan` m3 line art try 1) through the
  frozen Sonnet judge once. Both must fail. Record the result file and the verdicts. No Muse
  spend. If a control passes, stop and report to the PM. — deferred:phase-1-acceptance
- [b] Task 5: Color calls for the 31 cards, then judge batches at card size (360 px long side).
  The first passing try is the delivery. At most 3 color tries for each card. A fail needs a second
  judge on the file alone before it stands. Log every call in `costs.tsv`. Stop at the cap. — deferred:phase-1-acceptance
  - Muse calls run 4 at a time at most.
  - The maker reports the running spend at the report point of 0.80 USD.
- [b] Task 6: Line calls from each passing color with the judge. Each line call is a Muse call from
  the passing color picture. At most 3 line tries for each card. No local filter. — deferred:phase-1-acceptance
- [b] Task 7: Delivery folder, handoff folder, `MANIFEST.txt`, and contact sheet. The delivery
  folder is `out/storytime/l2/unit1/cards/delivery-muse-v1/`. The handoff folder is
  `/home/daniebo/Desktop/handoff/storytime-l2-card-pictures/`. The manifest form follows
  `/home/daniebo/Desktop/handoff/a48-forge-pictures-a/MANIFEST.txt`. — deferred:phase-1-acceptance
  - Check every file at 1500 x 1500 px, 8-bit PNG, with no alpha channel.
  - Check the line art: grayscale, white background, no gray fill.
  - `sha256sum -c` on the file lines of `MANIFEST.txt` gives OK for every file.
- [b] Task 8: Drive backup. Upload the delivery to a subfolder `cards` of the private Drive folder
  `1AWdjGVJrJcc35oY7cIAt_jPqyaLtyK9B` with the `gws` CLI. Check the MD5 of every file. Record the
  TSV `out/storytime/l2/unit1/drive-backup-2026-11-06-cards.tsv`. The mismatch count must be 0.
  — deferred:phase-1-acceptance
- [b] Task 9: Report record for the PM. It names the handoff path, the spend, the count of calls,
  and each failed row with its best try. The report states that the delivery is model evidence and
  that Workbooks checks the cards. — deferred:phase-1-acceptance
- [b] Phase 2 gate: phase acceptance by the checker at an immutable HEAD. — deferred:phase-1-acceptance

## Track-level roles

- [b] Final acceptance at an immutable HEAD after all phase gates. — deferred:phase-2-acceptance
- [b] Closeout: archive the track, update the registry, run the generator and the doctor, and
  commit the run records in `measure/runs/asset_storytime_l2_cards_20261106/`. Foreign generated
  facts stay out of the closeout commit unless their owner has committed them. — deferred:final-acceptance

## Human gate

Workbooks checks the cards after the delivery and before the 11-19 card kit. That check is outside
this track. The track records no Workbooks or Daniel acceptance.

## Risks

| Risk | Control |
| --- | --- |
| The restart cap of 1.00 USD counts card spend (the scan includes `cards/muse/`). | Task 2 adds a separate card config. A guard test checks that restart rows do not count in the card spend. |
| The judge passes a card that has a wrong person (similar cast looks). | The cast note in `cast.json` and the references bind each person. The checker looks at the contact sheet. |
| A reference differs from the card prompt (Nan buns, teddy, car, doll). | The specification records the decision. The maker records each difference. |
| The spend passes 1.60 USD through retries. | The guard refuses at the cap. The maker stops at 0.80 USD and reports the projection. |
| A delivered file has no judge pass. | The delivery writer takes only judged tries. The checker compares the manifest with the judge result files. |
| Text calls the delivery accepted. | FR-12. The checker greps the track files, `MANIFEST.txt`, and the report. |
| A foreign hunk in `measure/tracks.md` enters the commit. | The author staged the registry entry through a blob. `git diff --cached` shows the entry only. |

## Evidence

- Track creation commit: recorded at creation (message `measure(storytime_l2_cards): create the track`).
- Spec review result: `measure/runs/asset_storytime_l2_cards_20261106/` (written by
  `measure-spec-review`).
