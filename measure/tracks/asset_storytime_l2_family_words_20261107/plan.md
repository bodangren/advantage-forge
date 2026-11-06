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

### Task markers

`[x]` means complete. `[~]` means in progress. `[b]` means blocked, with a trailing
`deferred:<owner>` field. The orchestrator changes `[b]` to `[~]` when the blocker clears and the
task starts. The author set every work task to `[b]` because no work task has started. The blocker
of Tasks 1 to 3 is the spec review (Gate S). The blocker of Tasks 4 to 7 is the acceptance of
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
  registry entry. The creation commit has the message
  `measure(storytime_l2_family_words): create the track`.
- [~] Gate S: Spec review by `measure-spec-review` before Red starts (paraphrase, zoom-out check,
  and zero-decision check). The result goes to
  `measure/runs/asset_storytime_l2_family_words_20261107/`. The test strategy follows from the
  strategy role after the spec review.

The Measure doctor of this repository counts only the markers `[ ]`, `[~]`, and `[x]`. It does not
count `[b]`. Task 0 is complete (`[x]`). Gate S stays `[~]` until the spec review passes, so the
plan keeps an open item for the doctor.

## Phase 1: Family-word specs, judge flag, and delivery writer

- [b] Task 1: The 18 family-word spec files in `docs/storytime/l2-unit1/family-words/<id>.json`
  and a test that checks them. deferred:Gate S
  - The files and fields follow the sections "Spec files", "Prompts", "Person rows", "Animal and
    object rows", and "Reference files for the people" of the specification. The maker does not
    choose a cast child, a view, or a reference file. The tables decide them.
  - The prompt text follows the card specs of the same kind. The person prompts drop the
    sentences about skin. The specification names both replacements.
  - The test file is `tests/storytime-family-word-specs.test.ts`. It covers FR-1, FR-2, and FR-3.
    It reads only the repository.
  - No Muse call and no provider call runs in this phase. Spend stays 0.00 USD.
- [b] Task 2: The judge flag `--family-words` in `scripts/storytime-judge-batch.mjs`, with tests.
  deferred:Gate S
  - The behavior follows the section "Judge batch input". The `cards` behavior stays unchanged.
  - The test file is `tests/storytime-family-word-judge.test.ts`. It covers FR-4.
  - Gate: `tests/storytime-judge-batch.test.ts` and `tests/storytime-card-guards.test.ts` pass
    unchanged.
- [b] Task 3: The delivery writer `deliverMuseColorSet` in `src/storytime/muse-delivery.ts`, with
  tests. deferred:Gate S
  - The behavior follows the section "Delivery" and its "Manifest job values" table. The maker
    chooses no job value. The functions `writeMuseDelivery` and `deliverMuseCover` stay
    unchanged.
  - The test file is `tests/storytime-family-word-delivery.test.ts`. It covers FR-5.
  - Gate: `tests/storytime-muse-delivery.test.ts` and
    `tests/storytime-muse-delivery-adversarial.test.ts` pass unchanged.
- [b] Phase 1 gates: review gates assigned by the test strategy, then phase acceptance at an
  immutable HEAD. deferred:Tasks 1 to 3

## Phase 2: Family-word pictures and delivery

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`).

- [b] Task 4: Preconditions and judge calibration. deferred:Phase 1 acceptance
  - Run the shell checks of the specification section "Preconditions": the SHA-256 of the list v7
    fixture, the SHA-256 of the family PNG, and the cost file check (74 call rows, 0.74 USD).
    Record the three results in the role log.
  - Run the two gate control files of `calibration-set.json` (the `a-nose` version 1 line art and
    the `nan-can-get-a-pan` m3 line art try 1) through the frozen Sonnet judge once. Both must
    fail. Record the result file and the verdicts in
    `measure/runs/asset_storytime_l2_family_words_20261107/calibration-record.json`. No Muse
    spend. If a control passes, stop and report to the PM.
- [b] Task 5: Color calls for the 18 new rows, then judge batches at card size (360 px long side
  with `--family-words`). deferred:Task 4
  - The first judge pass is the delivery. At most 3 color tries for each row. A fail needs a
    second judge on the file alone before it stands. Log every call in `costs.tsv`.
  - Muse calls run 4 at a time at most. The maker starts no call that the guard refuses.
  - At the guard report point of 0.80 USD in total (about the sixth call) the maker records the
    total, the track spend, and the projection in its role log once and continues. The maker
    stops only at the guard cap of 1.60 USD in total.
  - The family row gets no call and no new judge batch.
- [b] Task 6: Delivery folder, handoff folder, `MANIFEST.txt`, and contact sheet. deferred:Task 5
  - The delivery folder is `out/storytime/l2/unit1/family-words/delivery-muse-v1/`. The handoff
    folder is `/home/daniebo/Desktop/handoff/storytime-l2-family-word-pictures/`. The form follows
    the section "Delivery" of the specification.
  - The writer is `deliverMuseColorSet`. Each entry gets `text` and `sourcePrompt` from the spec
    file of its row (the family row from the card spec). The manifest form follows
    `/home/daniebo/Desktop/handoff/storytime-l2-card-pictures/MANIFEST.txt`.
  - Check every file at 1500 x 1500 px, 8-bit PNG, no alpha channel.
  - Report the corner values below 250 as a report item (not a gate).
  - `sha256sum -c` on the file lines of `MANIFEST.txt` gives OK for every file.
- [b] Task 7: Report record for the PM:
  `measure/runs/asset_storytime_l2_family_words_20261107/pm-report.md`. deferred:Task 6
  - It holds the one status line, the handoff path, the track spend, the total of `costs.tsv`,
    the count of calls, each failed row with its best try, and the white-corner list. It states
    that the delivery is model evidence and that Daniel sees the pictures in his 11-16 check.
- [b] Phase 2 gate: phase acceptance by the checker at an immutable HEAD. deferred:Tasks 4 to 7

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
