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
- [~] Task 3: The T-shirt line tries (D5, D6). Paid, at most 3 calls. Run only if Task 2 gives a
  passing color m<n>. Before each call, write the worst case and run the network check. Run one line
  call: `node scripts/storytime-muse.mjs line <spec> --from <n> --tries 1`. Run the print gate on the
  line print and its despeckled print BEFORE the judge, and write
  `line-gate-look1-<try>.txt`. The orchestrator runs the frozen judge, the action check (item g shows
  the passing color as a second picture), and the second judge if the first judge fails. Stop at the
  first pass. A row with no passing line after 3 tries is a fail row. Log each call in `spend-log.tsv`.
- [b] Task 4: Delivery, hand-off, and PM report (D7, D8). Spend 0 USD. Write `approvals-look1.json`
  (the hat-pip entry, and the T-shirt entry only if it passes). Write `deliver-look1.mts` and run it
  through `heavy-run.sh` into `out/storytime/l2/unit2/delivery-muse-v1-look1/`. Run the pixel check and
  the folder-state check (before and after). Build the hand-off folder
  `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1/` with the hard links,
  `manifest.json`, the spend log copy, `contact-sheet.png`, `README.md`, `not-delivered/` (only when the
  T-shirt fails), and `MANIFEST.txt`. Run `sha256sum --quiet -c MANIFEST.txt`. Write `pm-report.md`
  (D8). List, then delete, `/tmp/opencode/l2look1/` and any staging folder this track made. deferred:maker
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
