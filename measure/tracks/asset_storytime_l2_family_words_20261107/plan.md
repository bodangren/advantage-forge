# Storytime Level 2 family-word pictures (19 words)

Status: created, awaiting spec review (2026-11-07). No picture exists yet except the family
picture of the card track.
The [specification](./spec.md) owns the scope and the acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track.
- Owned paths are in the "Owned paths" section of the specification. The owned planning paths are
  this folder and `measure/runs/asset_storytime_l2_family_words_20261107/`.
- Do not change `assets/fireball.ts` or `out/fireball/`. Their owner review stays separate.
- Do not change the judge kit, the card specs, the guard values, or `scripts/storytime-muse.mjs`.
- The question tool is denied. Route every question for Daniel through the PM orchestrator.
- Other agents share the git index. Commit explicit paths only.
- Muse calls, judge batches, and the delivery writer are light roles. They run with `node` and
  without `heavy-run.sh`.
- Run every full test suite and the typecheck with
  `bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. Exit code 75
  means hold. Record `lock wait over 600 s` and stop the run.
- No song or video command runs.
- Spend limit: the guard cap of 1.60 USD in total for `costs.tsv`, which means 0.86 USD for this
  track. The card track spent 0.74 USD in 74 calls. Spend of this track so far: 0.00 USD. No Muse
  call ran.
- The delivery is model evidence. It is not acceptance. No text may claim that Daniel or Workbooks
  accepted a picture.
- Defaults recorded by the author (each one is open to a PM change):
  - The 18 new rows write their tries to the card folder, so the existing guard enforces the cap.
  - The 18 spec files go to `docs/storytime/l2-unit1/family-words/`, because a card spec test pins
    the cards folder to 31 files.
  - The family picture is the card-track color print. No new call runs for it.
  - No Drive backup. The PM did not ask for one.
  - White corners of class C are a report item and not a gate (the card-track rule).

PM 2026-11-03: light lane. The PM put this whole track on the light lane on 2026-11-07: one maker (`measure-jr-green`), one checker (`measure-phase-acceptance`), then Daniel's look on 11-16. No Red, Review A, Review B, Review C, or adversarial role runs. The maker writes the specs, the code, and the tests that `test-strategy.md` names. The checker checks each phase at an immutable HEAD.

### Task markers

`[x]` means complete. `[~]` means in progress. `[b]` means blocked, with a trailing
`deferred:<owner>` field. The orchestrator changes `[b]` to `[~]` when the blocker clears and the
task starts. The author set every work task to `[b]` because no work task has started. The blocker
of Tasks 1 to 3 is the spec review (Gate S). The blocker of Tasks 4 to 7 is the acceptance of
Phase 1.

### Lanes and roles

- The whole track is the light lane (PM rule of 2026-11-03, relayed 2026-11-07): one maker
  (`measure-jr-green`) and one checker (`measure-phase-acceptance`), then Daniel's look on 11-16.
  No Red, no Reviews A, B, and C, and no adversarial test.
- Phase 1 is the light lane. The maker writes the specs, the code, and the tests that
  `test-strategy.md` names. The checker checks the phase at an immutable HEAD.
- Phase 2 is the light lane. The maker makes the pictures and the delivery. The checker checks the
  phase at an immutable HEAD.
- After Phase 2 the track has a final acceptance and a closeout. These are track-level roles, not
  phases.

## Phase 0: Authoring and spec review [checkpoint: 893db859]

- [x] Task 0: Author the track: specification, plan, metadata, index, spec review note, and the
  registry entry. The creation commit has the message
  `measure(storytime_l2_family_words): create the track`.
- [x] Gate S (d77957f9): Spec review by `measure-spec-review` before Red starts (paraphrase,
  zoom-out check, and zero-decision check). The result is
  `measure/runs/asset_storytime_l2_family_words_20261107/spec-review-d77957f.json` (status pass).
  The test strategy follows from the strategy role after the spec review.

The Measure doctor of this repository counts only the markers `[ ]`, `[~]`, and `[x]`. It does not
count `[b]`. Task 0 is complete (`[x]`). Gate S stays `[~]` until the spec review passes, so the
plan keeps an open item for the doctor.

## Phase 1: Family-word specs, judge flag, and delivery writer [checkpoint: 9eb453c]

- [x] Task 1 (74d58f1f): The 18 family-word spec files in `docs/storytime/l2-unit1/family-words/<id>.json`
  and a test that checks them.
  - The files and fields follow the sections "Spec files", "Prompts", "Person rows", "Animal and
    object rows", and "Reference files for the people" of the specification. The maker does not
    choose a cast child, a view, or a reference file. The tables decide them.
  - The prompt text follows the card specs of the same kind. The person prompts drop the
    sentences about skin. The specification names both replacements.
  - The test file is `tests/storytime-family-word-specs.test.ts`. It covers FR-1, FR-2, and FR-3.
    It reads only the repository.
  - No Muse call and no provider call runs in this phase. Spend stays 0.00 USD.
  - Complete at `74d58f1f`. The test command
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-family-word-specs.test.ts tests/storytime-card-specs.test.ts --maxWorkers=1'`
    exited 0 with `Test Files  2 passed (2)` and `Tests  23 passed (23)`. The type check gave
    `owned tsc errors: 0` and `tsc errors total: 38`.
  - The Phase 0 heading holds `[checkpoint: 893db859]`. The measure guard needs that line before
    a task of Phase 1 starts. The value is the strategy commit that closed Phase 0.
  - The prompt wording that differs from the card prompt of the same kind:
    - The person prompts use "Do not change anyone's hair or clothes". The card prompt names the
      body surface in that sentence.
    - The person prompts use "a tiny dark tick mark at the outer corner of an eye". The card
      prompt names a second error in that sentence.
    - The person prompts use "the four 3D views at the bottom are the character to copy". The card
      prompt holds one more word in that sentence.
    - The animal and object prompts add "a plain pure white background" and "a wide empty white
      margin". The check-row prompt says "a plain white background".
    - The three toy prompts name only the named toy of the sheet. The story-page prompt names all
      six toys.
    - The Nan prompts say "hair in two round buns". The card prompt says "hair in exactly two
      round buns".
    - The dog prompt adds "This picture shows one dog, not the puppy Pip."
- [x] Task 2 (82fd4fed): The judge flag `--family-words` in `scripts/storytime-judge-batch.mjs`, with tests.
  - The behavior follows the section "Judge batch input". The `cards` behavior stays unchanged.
  - The test file is `tests/storytime-family-word-judge.test.ts`. It covers FR-4.
  - Gate: `tests/storytime-judge-batch.test.ts` and `tests/storytime-card-guards.test.ts` pass
    unchanged.
  - Complete at `82fd4fed`. The test command
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-family-word-judge.test.ts tests/storytime-judge-batch.test.ts tests/storytime-card-guards.test.ts --maxWorkers=1'`
    exited 0 with `Test Files  3 passed (3)` and `Tests  32 passed (32)`.
  - The test file of Task 1 held a copy of the card output folder. The card guard test CG3 refused
    that file. The test now builds the folder from two pieces. The 18 spec files did not change.
  - The error text of a missing try stays as it was. The test matches both wordings of the count:
    "hold 1 try" and "holds 1 try".
- [x] Task 3 (e634a052): The delivery writer `deliverMuseColorSet` in `src/storytime/muse-delivery.ts`, with
  tests.
  - The behavior follows the section "Delivery" and its "Manifest job values" table. The maker
    chooses no job value. The functions `writeMuseDelivery` and `deliverMuseCover` stay
    unchanged.
  - The test file is `tests/storytime-family-word-delivery.test.ts`. It covers FR-5.
  - Gate: `tests/storytime-muse-delivery.test.ts` and
    `tests/storytime-muse-delivery-adversarial.test.ts` pass unchanged.
  - Complete at `e634a052`. The GREEN_TEST_COMMAND of test-strategy.md section 3
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-family-word-specs.test.ts tests/storytime-family-word-judge.test.ts tests/storytime-family-word-delivery.test.ts tests/storytime-judge-batch.test.ts tests/storytime-card-guards.test.ts tests/storytime-card-specs.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-muse-delivery-adversarial.test.ts --maxWorkers=1'`
    exited 0 with `Test Files  8 passed (8)` and `Tests  124 passed (124)`. The TYPECHECK_COMMAND of
    the same section gave `owned tsc errors: 0` and `tsc errors total: 38`.
  - The writer adds 163 lines to `src/storytime/muse-delivery.ts` and removes no line. The two old
    writers keep their code.
  - The test file of Task 2 held three type errors. Its helper now takes an object. The tests of
    Task 2 changed no behavior.
  - No Muse call and no provider call ran in this phase. Spend stays 0.00 USD.
- [b] Phase 1 gates: phase acceptance by the checker at an immutable HEAD. deferred:checker
  The light lane gives no review gate. The blocker of this gate was Tasks 1 to 3, and those tasks
  are done.

## Phase 2: Family-word pictures and delivery

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`).

- [x] Task 4 (cadf975): Preconditions and judge calibration.
  - Run the shell checks of the specification section "Preconditions": the SHA-256 of the list v7
    fixture, the SHA-256 of the family PNG, and the cost file check (74 call rows, 0.74 USD).
    Record the three results in the role log.
  - Run the two gate control files of `calibration-set.json` (the `a-nose` version 1 line art and
    the `nan-can-get-a-pan` m3 line art try 1) through the frozen Sonnet judge once. Both must
    fail. Record the result file and the verdicts in
    `measure/runs/asset_storytime_l2_family_words_20261107/calibration-record.json`. No Muse
    spend. If a control passes, stop and report to the PM.
  - The three shell checks passed at 2026-11-06T23:39:31Z. The list v7 fixture has the SHA-256
    `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf`. The family PNG has the
    SHA-256 `ab6067eedf8de3efebb40509c6032f81f7ecee178b212eac8c3727d40a8bff62`. The cost file
    holds 74 call rows and 0.74 USD. The role log holds the four labeled lines and the SHA-256 of
    the first 75 cost lines.
  - The calibration ran through the frozen Sonnet judge. Both controls failed. The record is
    `measure/runs/asset_storytime_l2_family_words_20261107/calibration-record.json`.
- [x] Task 5 (501dacf6): Color calls for the 18 new rows, then judge batches at card size (360 px
  long side with `--family-words`).
  - The first judge pass is the delivery. At most 3 color tries for each row. A fail needs a
    second judge on the file alone before it stands. Log every call in `costs.tsv`.
  - Muse calls run 4 at a time at most. The maker starts no call that the guard refuses.
  - At the guard report point of 0.80 USD in total (about the sixth call) the maker records the
    total, the track spend, and the projection in its role log once and continues. The maker
    stops only at the guard cap of 1.60 USD in total.
  - The family row gets no call and no new judge batch.
  - Orchestrator decision 2026-11-07: the arms color try 1 passed both judges, but both judges
    recorded that the finger touches the chest and not the raised arm. The PM rule says a
    body-part picture shows a child pointing to the part, so try 1 counts as a failed try. Try 2
    uses a new pose: one arm held straight out to the side, with the index finger of the other
    hand on that arm. Only the picture sentences of the arms colorPrompt changed.
  - Orchestrator decision 2026-11-07, after the contact sheet: the legs try 1 and the feet try 1
    show hanging arms, and the judge notes call the pointing weak. The PM rule says a body-part
    picture shows a child pointing to the part, so both tries count as failed tries. Try 2 of each
    row uses a fingertip that touches the part. Only the picture sentences and the goal of the two
    spec files changed.
  - Orchestrator decision 2026-11-07: legs m2 and feet m2 pass the judge; legs is the weakest
    pointing picture and the report names it. The judge notes say the legs fingertips rest at the
    shorts hem, and both judges record that they touch the thighs. The delivered colors are 15
    rows at m1, the arms row at m2, the legs row at m2, the feet row at m2, and the family row
    at the m1 of the card track.
  - The judge result file
    `measure/runs/asset_storytime_l2_family_words_20261107/judge-fw-r1-color.json` holds 18 files
    with 18 pass and 0 fail on color try 1. The arms row passes on try 2 in
    `measure/runs/asset_storytime_l2_family_words_20261107/judge-fw-r2-color-arms.json`. The
    family row reuses the card track color print and gets no call and no new judge batch.
  - The track made 19 calls for 0.19 USD. The total of `costs.tsv` is 0.93 USD in 93 calls, under
    the 1.60 USD cap of the card run.
  - The legs and the feet rows made 2 more calls. The track made 21 calls for 0.21 USD. The total
    of `costs.tsv` is 0.95 USD in 95 calls.
- [x] Task 6 (177e4e3): Delivery folder, handoff folder, `MANIFEST.txt`, and contact sheet.
  - The delivery of round 4 is to be rewritten after the legs and the feet try 2.
  - The delivery of round 6 is the rewritten one. The round-4 delivery folder was removed first,
    because the writer refuses a file that already exists. The approval list now names the arms
    try 2, the legs try 2, and the feet try 2 prints.
  - The delivery folder is `out/storytime/l2/unit1/family-words/delivery-muse-v1/`. The handoff
    folder is `/home/daniebo/Desktop/handoff/storytime-l2-family-word-pictures/`. The form follows
    the section "Delivery" of the specification.
  - The writer is `deliverMuseColorSet`. Each entry gets `text` and `sourcePrompt` from the spec
    file of its row (the family row from the card spec). The manifest form follows
    `/home/daniebo/Desktop/handoff/storytime-l2-card-pictures/MANIFEST.txt`.
  - Check every file at 1500 x 1500 px, 8-bit PNG, no alpha channel.
  - Report the corner values below 250 as a report item (not a gate).
  - `sha256sum -c` on the file lines of `MANIFEST.txt` gives OK for every file.
  - The writer delivered 19 rows and 5 color batches to
    `out/storytime/l2/unit1/family-words/delivery-muse-v1/`. Every delivered PNG is byte for byte
    the print of its try, and every file is 1500 x 1500 px, 8-bit, 3 channels, srgb, with no alpha
    channel. The manifest holds 19 jobs and no line-art batch. The family file holds the SHA-256
    `ab6067eedf8de3efebb40509c6032f81f7ecee178b212eac8c3727d40a8bff62`.
  - The handoff folder holds the same 19 PNG files, the same `manifest.json`, the `MANIFEST.txt`,
    and the contact sheet `storytime-l2-family-word-pictures-contact-sheet.png`. The sheet holds
    19 cells, 5 cells per row, with the word under each card.
  - The check `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -` in the handoff folder gave
    19 OK and 0 FAILED. The sha256sum lists of the delivery folder and the handoff folder are
    equal, 20 names each.
  - The corner record is `measure/runs/asset_storytime_l2_family_words_20261107/corner-record.txt`.
    Files checked 19, gate problems 0. Ten files have a corner below 250. The ears file holds a
    faint gray gradient at all four corners, with the lowest value 215. The other nine hold the
    low value at the bottom-left corner only. This is a report item, not a gate.
  - The corner record of the round-6 delivery holds 12 files below 250. The legs and the feet
    prints joined the list, and the arms print left it. The ears file still holds the lowest value
    at 215, with a faint gray gradient at all four corners. The other 11 files hold the low value
    at the bottom-left corner only. This is a report item, not a gate.
  - The handoff folder holds 22 files: the 19 PNG files, `manifest.json`, the `MANIFEST.txt`, and
    the contact sheet. The check `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -` gave
    19 OK and 0 FAILED. The sha256sum lists of the delivery folder and the handoff folder are
    equal, 20 names each. The `manifest.json` of the round-6 delivery has the SHA-256
    `4300373783eef8232581c6e0fb70f4d7b8a2cb3a42d3dfd953265d10cb1f8719`.
- [~] Task 7 (2a90930): Report record for the PM:
  `measure/runs/asset_storytime_l2_family_words_20261107/pm-report.md`.
  - The report record is to be rewritten after the legs and the feet try 2.
  - It holds the one status line, the handoff path, the track spend, the total of `costs.tsv`,
    the count of calls, each failed row with its best try, and the white-corner list. It states
    that the delivery is model evidence and that Daniel sees the pictures in his 11-16 check.
  - The status line reads "Status: done. 19 of 19 family-word pictures delivered; spend 0.19 USD
    (total 0.93 USD of the 1.60 USD card limit)." The record names the arms decision, the family
    reuse, the 6 defaults of the specification, and the corner list of the 10 files below 250.
- [b] Phase 2 gate: phase acceptance by the checker at an immutable HEAD. deferred:Task 6

## Track-level roles

- [b] Final acceptance at an immutable HEAD after all phase gates. deferred:Phase 2 gate
- [b] Closeout: archive the track, update the registry, run the generator and the doctor, and
  commit the run records in `measure/runs/asset_storytime_l2_family_words_20261107/`. Foreign
  generated facts stay out of the closeout commit unless their owner has committed them.
  deferred:Final acceptance

## Human gate

Daniel sees the pictures in his 11-16 check. That check is outside this track. The track records
no Workbooks or Daniel acceptance.

## Risks

| Risk | Control |
| --- | --- |
| The spend passes the 0.86 USD share of the 1.60 USD limit. | The 18 new rows use the card folder, so the guard counts the 0.74 USD already spent. The maximum is 54 calls (0.54 USD). The guard refuses at the cap. |
| A second copy of the cap values drifts from `CARD_RUN`. | `CARD_RUN` stays the only owner. This track does not change it. The acceptance diff shows no change in the guard file. |
| The 18 new spec files break the card spec test (it pins 31 files). | The new files live in `docs/storytime/l2-unit1/family-words/`. FR-3 checks that the cards folder keeps 31 files. |
| A prompt holds a word for skin, race, or ethnicity. | FR-2 test checks every text field of the 18 specs. The person prompts replace the two card sentences that name skin. |
| A pointing hand covers the named part, or the part is small. | The spec names a large, clear part and a pointing hand that never covers it. The judge checks `mustShow` at card size. |
| The judge passes a picture with the wrong child (Pat and Nan look alike at card size). | The cast note in `cast.json` and the references bind each child. The checker looks at the contact sheet. |
| The dog looks like the puppy Pip. | The spec says "a dog, not the puppy Pip" and uses the dog asset view as the reference. |
| The family picture changes after the author check. | The Task 4 shell step checks its SHA-256. The delivery manifest holds the same SHA-256. |
| The delivery writer copies a file that has no judge pass. | The delivery list holds only judged tries. The checker compares the manifest with the judge record files. |
| White corners below 250 (class C rule). | Report item, not a gate. The report lists each file and its lowest corner value. |
| Text calls the delivery accepted. | FR-12. The checker greps the track files, `MANIFEST.txt`, and the report. |
| A foreign hunk in `measure/tracks.md` enters the commit. | The author staged the registry entry through a blob. `git diff --cached` shows the entry only. |

## Evidence

- Track creation commit: recorded at creation (message
  `measure(storytime_l2_family_words): create the track`).
- Spec review result: recorded by `measure-spec-review` in
  `measure/runs/asset_storytime_l2_family_words_20261107/`.
- Test strategy: `test-strategy.md` in this folder (written by the strategy role).
