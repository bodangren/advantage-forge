# Storytime Level 2 unit 2 look1: hat-pip owner job and the t-shirt redo

Status: new (2026-11-11). Phase 0 authors the track. Phase 1 writes the prompt edit, the guard
exception, and the owner record (0 USD), makes the paid T-shirt tries, and delivers both jobs to a new
hand-off folder.

The track packages the hat-pip picture as a delivery job on Daniel's words (0 USD) and makes the
"Put on your T-shirt" picture again with Muse (stop 0.10 USD). The [specification](./spec.md) owns the
scope, the decisions D1 to D9, and the acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track.
- Owned paths are in the "Owned paths" section of the specification. The owned planning paths are this
  folder and `measure/runs/asset_storytime_l2u2_look1_20261111/`.
- Do not change a frozen path of the specification: the judge kit, every unit 1 file, the batch tool,
  the writers, `assets/**`, the Workbooks repository, the closed guard constants, every other spec
  file, and the old delivery and hand-off folders.
- The question tool is denied. Route every question for Daniel through the PM orchestrator. A stop or a
  blocked call goes to the PM.
- Other agents share the git index. The maker commits explicit paths only.
- The maker marks a task `[~]` before the task changes a file outside `measure/` (measure-guard).
- No PNG or JPG goes into git.
- Every role writes scratch only under `/tmp/opencode/l2look1/` (specification, Non-Functional
  Requirements).
- Muse calls, judge copies, and the delivery writer are light roles. They run with `node` and without
  `heavy-run.sh`. Tests and `tsc` run only with
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`,
  one at a time (PM load rule 2026-11-11). Exit code 75 means hold: run again.
- The orchestrator checks the slot before each role and waits when no slot is free. One role runs at a
  time.
- Spend limit: 0.10 USD (report point 0.08 USD). A call above 0.03 USD stops the run. The guard
  `U2_LOOK_TRY` owns the stop.
- The delivery is model evidence. The only recorded acceptance is Daniel's words of D2 for the hat-pip
  row. No other text may claim that Daniel, the PM, or Workbooks accepted a picture.

PM 2026-11-03: light lane. The PM put this kind of track on the light lane: one maker
(`measure-jr-green`) and one checker (`measure-phase-acceptance`), then closeout. No spec review, Red,
Review A, Review B, Review C, adversarial, UX review, or final acceptance role runs. The orchestrator,
not the maker, runs the frozen judge and the action check.

### Task markers

`[x]` means complete. `[~]` means in progress. `[ ]` means ready and not started. `[b]` means blocked,
with a trailing `deferred:<owner>` field. The owner changes `[b]` to `[~]` when the blocker clears and the
task starts. The doctor counts only `[ ]`, `[~]`, and `[x]`.

## Phase 0: Authoring [checkpoint: 53a110b]

- [x] Task 0 (53a110bc): Author the track: specification, plan, metadata, index, spec review note, and the registry
  entry. The creation commit has the message `measure(storytime_l2u2_look1): create the track`.

The light lane has no spec review gate. A second small commit marks Task 0 and puts the checkpoint on
this heading.

## Phase 1: Hat-pip owner job and the t-shirt redo (look1)

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`). The orchestrator
runs the frozen judge and the action check between the paid calls. The stop is 0.10 USD.

- [x] Task 1 (b9e00eca7dc9e6cd19ff7f09dbcd32593fceef81): Prompt edit, guard, tests, and owner
  record (D2, D3, D4, D6). Spend 0 USD. Make no Muse call.
  - The T-shirt spec file `docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt.json`:
    the old SHA-256 is `6867f62f4e52c0de12a259df7e21bc9242fa852e981f6c08f3b5ec4a82fd42d6` and the new
    SHA-256 is `7ca606f4a0139af89f9c1f38f9a77b4e640dd9d7dca39141d751ab01c16a461a`. The changed fields
    are `goal`, `colorPrompt`, and `linePrompt` only.
  - The new sentences and their SHA-256: the goal
    `3b8284fb9c007a2958392a4d230e8dfcfdbbda4ced3baf99e1e8567b274c365f`; the first color text
    `0a76ff3e73d5f0c3879f39faf9e6e31d951a2b94f887d86066047f838b534c0e`; the second color text
    `c32467776d4decebc5700414aa89f1a52ae53173f3b452b44704bca4a2868c62`; the third color text
    `4d19a3b9ee31e9d65482fe9827baa4f00e95fa90f3c76bad5c65053526f32339`; the line sentence
    `2ded4f073123c8f277e749e05aa864a92b84fb2649671110fad1c5ca88718833`. The test LK15 holds them.
  - The guard `U2_LOOK_TRY` in `scripts/storytime-muse-guards.mjs` and the `.d.mts`: `startTime`
    `2026-11-10T23:50:00Z`, `capUsd` 0.10, `reportAtUsd` 0.08, `marginUsd` 0.01, and 2 rows with
    `allowedTries` 3. The other constants keep their values.
  - The GREEN command: 20 test files passed, 308 tests passed, exit status 0.
  - The typecheck: 38 error lines in the whole project, and 0 error lines in `src/storytime/`,
    `scripts/storytime-`, and `tests/storytime-`.
  - The run files: `measure/runs/asset_storytime_l2u2_look1_20261111/owner-look1.json` and
    `measure/runs/asset_storytime_l2u2_look1_20261111/action-check-prompt.md`.
  - F1 of the orchestrator: the card constants of LK13 are now one pin of the whole `CARD_RUN`
    object, the SHA-256 `1a2748085b89afdb0968d2cc6ae394b891bad8779f48817d8fd543186bf7a403` of its
    JSON form. The 2 split literals are gone, and the scan of CG3 finds no card constant in the new
    test file.
- [x] Task 2 (05e0e46092bd2e34ed8bd0b5fc746b51033ebb27): The T-shirt color tries (D5, D6). Paid, at most 3 calls. Before each call, write the worst
  case and run the network check. Run one color call: `node scripts/storytime-muse.mjs color <spec>`
  (versions m2, m3, m4). Make the judge batch for the try. The orchestrator runs the frozen judge, the
  action check, and the second judge if the first judge fails. Stop at the first pass. After a failed
  try, the orchestrator may give the maker at most 1 added sentence that names the defect, and the
  maker records it. A row with no passing color after 3 tries is a fail row: no line call, no more
  spend. Log each call in `spend-log.tsv`.
  - Color try 2 (m2): the network check answered 200 on the first try. The worst case was 1 call
    times 0.01 USD = 0.01 USD, under the 0.10 USD stop. The maker ran 1 paid call,
    `node scripts/storytime-muse.mjs color docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt.json`,
    and it wrote the row of 2026-11-11T00:23:46.646Z in costs.tsv with the cost 0.01 USD. The m2
    color print is `out/storytime/l2/unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt-m2-color-print.png`
    (4000x3000) with the SHA-256
    `8e1baee103a536b26071781754118ff757072a75a5a13837ada6439c2dc406b2`. The maker made the judge
    batch `u2l1-color-t2` (docs/storytime/l2-unit2/judge/prod/u2l1-color-t2.json), and its judge copy
    is out/storytime-review/judge/prod-u2/l2-w10-story-page-put-on-your-t-shirt-color-t2.png. The
    judge copy holds 900x600 pixels and its SHA-256
    `c0b65c778a0a8abc7267575581e844bfa2f3792f2f9f307cad2eeb35f63bff53` is the SHA-256 of the same
    resize of the m2 color file, so the copy comes from the m2 call. The orchestrator runs the frozen
    judge and the action check next.
  - Color try 2 (m2) passes by the second-judge rule of D6. The orchestrator ran 3 judges, and the
    maker read all 3 result files. The first judge, `judge-u2l1-color-t2.json`, gave the v6 verdict
    `fail` with the defect class `wrong-character`: the yellow T-shirt and the white vest differ
    from the light-blue top of the cast note. Its action check reads a yes, b yes, c no, d yes, e
    yes, f yes, g n/a. The note of item c says the hands hold the hem out at chest height, and the
    judge calls that a borderline case. The second judge, `judge-u2l1-color-t2-second.json`, gave
    the v6 verdict `pass` and the action check a yes, b yes, c yes, d yes, e yes, f yes, g n/a.
    That judge read the action-check prompt before it finished its v6 part. That order fault voided
    its v6 verdict, and the orchestrator kept its action check. The clean second v6 judge,
    `judge-u2l1-color-t2-second-r2.json`, saw no action prompt and gave the v6 verdict `pass` with
    the defect class `none`. By D6, the second judge passes both parts: the v6 verdict comes from the
    clean file and the action check comes from the second judge. So m2 passes by the second-judge
    rule of D6. The color tries stop at m2. The maker ran no call in this step. Spend 0 USD.
- [x] Task 3 (86c003cc20fd240a4075d624d046487601e23302): The T-shirt line tries (D5, D6). Paid, at most 3 calls. Run only if Task 2 gives a
  passing color m<n>. Before each call, write the worst case and run the network check. Run one line
  call: `node scripts/storytime-muse.mjs line <spec> --from <n> --tries 1`. Run the print gate on the
  line print and its despeckled print BEFORE the judge, and write
  `line-gate-look1-<try>.txt`. The orchestrator runs the frozen judge, the action check (item g shows
  the passing color as a second picture), and the second judge if the first judge fails. Stop at the
  first pass. A row with no passing line after 3 tries is a fail row. Log each call in `spend-log.tsv`.
  - Line try 3 (from m2): the network check answered 200 on the first try. The worst case was 1 call
    times 0.01 USD = 0.01 USD. The look spend was 0.01 USD before the call and 0.02 USD after it,
    under the 0.10 USD stop. The maker ran 1 paid call,
    `node scripts/storytime-muse.mjs line docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt.json --from 2 --tries 1`,
    and it wrote the row of 2026-11-11T00:34:37.068Z in costs.tsv with the cost 0.01 USD. The new
    line file is `out/storytime/l2/unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt-m2-line.png`
    and the print is `out/storytime/l2/unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt-m2-line-print.png`.
    The print gate passes both prints at the class size of the row, 4000x3000: the line print is
    22 px wide with an ink coverage of 8.46 percent and the SHA-256
    `675a7ef4d25dcc22f7533c1caf0296c9fdd5abf1773972b5531a4c8403f514d7`, and the despeckled print is
    22 px wide with an ink coverage of 8.45 percent and the SHA-256
    `b265e5f7f81b42a2f1fcd6f866ebc9aba11746806573631d4383fb2af1ca06eb`. The minimum is 12 px, so
    both prints pass. The record is
    `measure/runs/asset_storytime_l2u2_look1_20261111/line-gate-look1-3.txt`. The maker made the
    judge batch `u2l1-line-t3` (docs/storytime/l2-unit2/judge/prod/u2l1-line-t3.json), and its
    judge copy is out/storytime-review/judge/prod-u2/l2-w10-story-page-put-on-your-t-shirt-line-t3.png.
    The batch names the new line file. The maker ran no judge. The orchestrator runs the frozen
    judge and the action check next.
  - Line try 3 passes on one judge. The orchestrator ran the frozen judge and the action check. The
    result file is `measure/runs/asset_storytime_l2u2_look1_20261111/judge-u2l1-line-t3.json`. The v6
    verdict is `pass` and the defect class is `none`. That judge saw no action prompt. Its action
    check reads a yes, b yes, c yes, d yes, e yes, f yes, g yes. The note says the vest is a simple
    band, and item g covers the pose, the hands, and the T-shirt. The summary reads 1 file, 1 pass,
    0 fail. So both parts of D6 pass on one judge, and no second judge ran. The T-shirt has a passing
    color (m2) and a passing line (try 3), so it is not a fail row. The maker ran no call in this
    step. Spend 0 USD.
- [x] Task 4 (sha pending): Delivery, hand-off, and PM report (D7, D8). Spend 0 USD. Write `approvals-look1.json`
  (the hat-pip entry, and the T-shirt entry only if it passes). Write `deliver-look1.mts` and run it
  through `heavy-run.sh` into `out/storytime/l2/unit2/delivery-muse-v1-look1/`. Run the pixel check and
  the folder-state check (before and after). Build the hand-off folder
  `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1/` with the hard links,
  `manifest.json`, the spend log copy, `contact-sheet.png`, `README.md`, `not-delivered/` (only when the
  T-shirt fails), and `MANIFEST.txt`. Run `sha256sum --quiet -c MANIFEST.txt`. Write `pm-report.md`
  (D8). List, then delete, `/tmp/opencode/l2look1/` and any staging folder this track made.
  - Part 1, the delivery (D7). The maker wrote `approvals-look1.json` in the form of
    `approvals-repair1.json`. It holds the `version` 1 and the picture list pin
    `63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec`. It holds 2 entries: the
    hat-pip row with the version 3, the color print `l2-w10-story-page-put-on-your-hat-pip-m3-color-print.png`
    and the line print `l2-w10-story-page-put-on-your-hat-pip-m3-line-print-2.png`, and the T-shirt
    row with the version 2, the color print `l2-w10-story-page-put-on-your-t-shirt-m2-color-print.png`
    and the line print `l2-w10-story-page-put-on-your-t-shirt-m2-line-print.png`. The 4 prints sit in
    `out/storytime/l2/unit2/w10/muse/`, and their SHA-256 values are
    `6db86851b359760ea88e9feb67cf2bc784720ac4466abc5419af6f1dfff6bdff` (hat-pip color),
    `1474680276aa160dd972cd78b8559039a765032e703323cdb1ff41f0583aa9e1` (hat-pip line),
    `8e1baee103a536b26071781754118ff757072a75a5a13837ada6439c2dc406b2` (T-shirt color), and
    `675a7ef4d25dcc22f7533c1caf0296c9fdd5abf1773972b5531a4c8403f514d7` (T-shirt line). The maker ran
    `deliver-look1.mts` through heavy-run.sh. It wrote the delivery folder
    `out/storytime/l2/unit2/delivery-muse-v1-look1/` with 5 files: the 4 PNG files and
    `manifest.json`. The manifest SHA-256 is
    `0341b4f939d1b644da587431565ec82fc644bafa6fe0aa0a8a0cdacbcbbf3d84`. The runner reported 2
    delivered rows, 2 color files, 2 line files, 0 skipped rows, and 0 file problems. The staging
    folder `/tmp/opencode/l2look1/delivery-stage-look1` held hard links and the runner removed it.
    The pixel check `measure/runs/asset_storytime_l2u2_look1_20261111/pixel-check-look1.txt` gives
    `result: pass` with 0 failures: the 4 delivered files have the SHA-256 of their Muse prints,
    the manifest holds 2 jobs, every candidate version and every `selectedVersion` is 1, no
    candidate holds a `lineWidthException`, and the delivered names are the `-v1` names of the
    picture list. The T-shirt values changed against the old v1 values: the color is
    `8e1baee103a536b26071781754118ff757072a75a5a13837ada6439c2dc406b2` and the old value is
    `9e207c3c72db52d323fd8ef64c9565588f853460ec7abcfa0fda5a053bd925e4`, and the line is
    `675a7ef4d25dcc22f7533c1caf0296c9fdd5abf1773972b5531a4c8403f514d7` and the old value is
    `71e2ba056c09ad66a1beecb565941616becfdecf4fccd107e86bbbe0b9e1ca7e`. The folder-state check
    `measure/runs/asset_storytime_l2u2_look1_20261111/folder-state-look1-before.txt` and
    `folder-state-look1-after.txt` give the same file count and the same state SHA-256 for the 6
    old folders of D8, so no old folder changed. Spend 0 USD.
  - Part 2, the hand-off and the PM report (D8). The maker wrote
    `measure/runs/asset_storytime_l2u2_look1_20261111/make-handoff-look1.mjs` and ran it once with
    node. It built the hand-off folder `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1/`
    with 9 files: the 4 PNG files as hard links of the delivered files, `contact-sheet.png`,
    `manifest.json`, `spend-log.tsv`, `README.md`, and `MANIFEST.txt`. The MANIFEST.txt SHA-256 is
    `6ae4e14f0f37914eb542596a5d756c5a41a2de6abfc728f176bbd0d09aa6c077`. The check
    `sha256sum --quiet -c MANIFEST.txt` gives no FAILED line, and
    `sha256sum -c MANIFEST.txt | grep -c ': OK$'` gives 8 OK lines. The contact sheet has 2 rows: the
    hat-pip row and the T-shirt row, each with the color print beside the line print and the row id
    under the pair. The maker wrote `measure/runs/asset_storytime_l2u2_look1_20261111/pm-report.md`.
    Its first line is `Status: done.`. It holds the folder path, the MANIFEST.txt SHA-256, the OK
    count, the 2 spend lines, the judge results of each try, the words of D2, the old and new SHA-256
    values of the T-shirt, the 6 unchanged folders, and the Facts changed list. The maker listed and
    deleted `/tmp/opencode/l2look1/`. Spend 0 USD.
- [b] Phase 1 gate: phase acceptance by the checker at an immutable HEAD. The checker runs the GREEN
  command and the typecheck, probes `U2_LOOK_TRY` with fixture cost files, compares the `costs.tsv`
  sum with the spend log, checks the hat-pip SHA-256 values, the pixel check, the MANIFEST check, and the
  folder state of the 6 old folders, and greps FR-11 and FR-12. deferred:checker

## Track-level roles

- [b] Closeout: archive the track, update the registry, and run the doctor. The generator does not run
  while `measure/generated/` holds foreign changes. The run records in
  `measure/runs/asset_storytime_l2u2_look1_20261111/` are committed. Foreign changes stay out of the
  closeout commit. deferred:closeout

The light lane has no final acceptance role.

## Human gate

The PM opened the spend with the order quoted in the specification. A stop or a blocked call goes to the
PM and not to Daniel. The only recorded acceptance is Daniel's words of D2 for the hat-pip row. The
T-shirt picture is model evidence until Daniel looks at it.

## Risks

| Risk | Control |
| --- | --- |
| The model keeps the light-blue shirt of picture 1 and draws a double shirt again. | D3 names that shirt as not worn and gives Ben a white vest. The action check item (e) refuses a double shirt. |
| The judge passes a wrong action, because v6 treats the action as a note. | D6 adds the action check. A try passes only when every item is yes. |
| The line print shows a different pose from the color print. | The line prompt keeps the pose (D3). Action check item (g) shows the color print as a second picture. |
| The judge fails a picture only for the light-blue shirt of the cast note. | The fail stands, and the second-judge rule applies. The PM report names the cause. |
| The guard refuses on `U2_RUN.capUsd` (18.33 USD). | The maker never edits `U2_RUN.capUsd`. A refusal goes to the PM. |
| A network fault uses a try. | The network check runs before each call. A failed check uses no try. |
| A foreign hunk in `measure/tracks.md` enters a commit. | The author stages the registry entry through a blob. |
| A heavy run starts while the machine has no free slot. | The orchestrator checks the slot, and every `vitest` and `tsc` run goes through `heavy-run.sh`. |
| A text claims an acceptance other than D2. | FR-11. The checker greps the track files, the manifest, and the report. |

## Evidence

- Track creation commit: recorded at creation (message `measure(storytime_l2u2_look1): create the track`).
- Run records: `measure/runs/asset_storytime_l2u2_look1_20261111/` (spend log, judge files, owner record,
  line gate records, maker logs, PM report, acceptance result).
