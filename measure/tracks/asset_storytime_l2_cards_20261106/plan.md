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
- [x] Gate S: Spec review by `measure-spec-review` before Red starts (paraphrase, zoom-out check,
  and zero-decision check). Passed at `7af682db` (round 2; no blocker). Evidence:
  `measure/runs/asset_storytime_l2_cards_20261106/spec-review-7af682d.json`. Open Nit F5 is closed by
  the test strategy: it names the record files of the calibration and the PM report. Tasks 1 to 3
  start with Red after the strategy commit.

The Measure doctor of this repository counts only the markers `[ ]`, `[~]`, and `[x]`. It does not
count `[b]`. Task 0 and Gate S are complete (`[x]`). Red marks Tasks 1 to 3 `[~]` when it starts, so
the plan keeps an open item for the doctor.

## Phase 1: Card guard, card specs, and fixture [checkpoint: cf6fb8db]

- [x] Task 1 (7d1cbdd5): Move the T180 fixture. Copy the Workbooks version 3 list (the bytes of
  Workbooks commit `078917f1`, `content/storytime/l2/print/pictures.json`) into
  `tests/fixtures/storytime/`. The copy is `tests/fixtures/storytime/pictures-v3.json` (the name
  is fixed). Point `LIST_V3_SHADOW_FILE` and `V3_SHADOW_FILE` at the copy. Done when both tests
  read the repository copy, no test path names `/tmp/opencode/wb-shadow`, and both test files
  behave as before with `/tmp/opencode/wb-shadow` absent.
  - Complete at Red `7d1cbdd5`. Green verified, not changed: `tests/storytime-card-fixtures.test.ts`
    passed 5 of 5, `tests/storytime-stage-check.test.ts` passed 3 of 3, and
    `grep -rn 'wb-shadow' tests scripts src` printed nothing (exit 1).
  - Knowledge todo 7050174a closes with this task.
  - The fixture SHA-256 must equal `c3e23cfdace136c7ed602b3aefee83383241833537ba56f0257668eb1e2c686b`.
  - The maker proves the "absent" condition with a run in which the `/tmp` path does not exist (for
    example by running the two test files and checking that no test opens a `/tmp/opencode` path).
  - Red evidence: `tests/storytime-card-fixtures.test.ts` first ran before the move. It had 4 failures and 1 pass (exit 1). After the fixture copies and constant edits, it passed 5 tests (exit 0). Both fixture SHA-256 values matched their pins. `tests/storytime-stage-check.test.ts` passed 3 tests through `heavy-run.sh`. Static `grep -rn 'wb-shadow' tests scripts src` found 0 hits.
- [x] Task 2 (91b2a1ca): Card run guard. `scripts/storytime-muse-guards.mjs` exports one constant
  `CARD_RUN` (types in `scripts/storytime-muse-guards.d.mts`):
  `{ startTime: '2026-11-06T00:00:00Z', capUsd: 1.6, reportAtUsd: 0.8, marginUsd: 0.01,
  maxTries: 3, outDir: 'out/storytime/l2/unit1/cards/muse' }`. The restart config
  (`RESTART_START` `2026-11-04T07:54:00Z`, cap 1.00 USD) and its tests stay unchanged.
  - No other file holds a copy of these values. `scripts/storytime-muse.mjs` and
    `scripts/storytime-judge-batch.mjs` import `CARD_RUN`.
  - Reason for the start time (orchestrator evidence, 2026-11-06): the newest restart cost row in
    any `out/storytime/l2/unit1/*/muse/costs.tsv` is `2026-11-05T03:32:05.918Z` (`w01/muse/costs.tsv`,
    `l2-w01-story-page-a-nut` m5 line). The maker does not choose or record a start time.
  - The card spend and the card try count read only
    `out/storytime/l2/unit1/cards/muse/costs.tsv` (and `cards/muse/elements/costs.tsv` if it
    exists), rows at or after `CARD_RUN.startTime`.
  - `scripts/storytime-muse.mjs` picks `CARD_RUN` when every spec of a call has `outDir`
    `CARD_RUN.outDir`. A call that mixes card specs and other specs exits with code 3 and makes no
    provider call.
  - `scripts/storytime-judge-batch.mjs` gets one new flag, `--cards`. With `--cards`, the spec
    folder is `docs/storytime/l2-unit1/cards` and the try count uses `CARD_RUN`. Without `--cards`,
    its behavior stays unchanged (`SPEC_DIR` of the A-48 folder and `RESTART_START`).
  - New guard tests go in `tests/storytime-card-guards.test.ts`. They cover: card cap and report
    point from `CARD_RUN`, a fourth try refused, a mixed call refused with exit code 3, restart
    rows not counted in the card spend, rows before `CARD_RUN.startTime` not counted, the
    `--cards` flag of the judge batch script, the unchanged behavior without `--cards`, and an
    unchanged restart config.
  - Gate: `tests/storytime-muse-attempts.test.ts` and `tests/storytime-judge-batch.test.ts` pass
    unchanged.
  - Red evidence: `RED_TEST_COMMAND` exited 1. It reported `Test Files  2 failed | 1 passed (3)` and `Tests  11 failed | 15 passed (26)`. The fixtures file passed all 5 tests. CG1, CG3, CG4, CG8, CG10, and CG11 failed on assertions. They require `CARD_RUN`, caller imports, card-specific guard behavior, mixed-call refusal, and `--cards`. Green must add the card guard and wire both callers. CS3 to CS7 failed on assertions for the 31 missing specs and their contract. Green must add those specs. The run had no load, syntax, or module-resolution errors.
  - Green evidence (implementation commit `5f344886`). The guard module holds `CARD_RUN`,
    `isCardCall`, `isMixedCardCall`, and `scanCardCostFiles`. `runGuards` refuses a mixed call before
    any cost scan, uses the card cost files for a card call, and returns `run` and `reportAt`.
    `scripts/storytime-muse.mjs` imports `CARD_RUN` and prints the card report point for a card call.
    `scripts/storytime-judge-batch.mjs` imports `CARD_RUN`, takes the card spec folder below `root`,
    starts the tries at `CARD_RUN.startTime`, and parses `--cards`.
  - Green gate: `GREEN_TEST_COMMAND` gave `Test Files  1 failed | 5 passed (6)` and
    `Tests  2 failed | 65 passed (67)`. The guards file passed 11 of 11. The three old files passed
    41 of 41. The only failures are the two train failures of Task 3. Counts: N_new 26, N_old 41,
    and 67 = 26 + 41. Typecheck: `owned tsc errors: 8`, all inside the three Red test files.
  - Mutation self-check M1 to M7 (scratch copy, guards file alone): M1 `CG1 CG4`, M2 `CG10`,
    M3 `CG8`, M4 `CG11`, M5 `CG11`, M6 `CG1 CG5`, M7 `CG7` (also CG4, CG5, CG6, CG8). The restored
    copy passed 11 of 11.
  - Green round 3 (commit `e68b4b4f`, Red round 3 `96a581a0`): the restart `scanCostFiles` skips
    the direct child folder `cards`, so card spend never counts toward the restart cap (F1).
    `classifyOutDir` resolves each spec `outDir` against the repository root. It calls the exact
    card folder a card call, allows `<unit root>/<child>/muse` and its `elements` folder, and
    refuses every other path with exit 3 before the key read (F2). `runGuards` projects the whole
    pool (one margin per call, plus one margin for a color pool) and refuses a projected sum over
    the cap; `scripts/storytime-muse.mjs` runs the guard again before each call in the pool and
    stops starting calls (F3). The notice line uses `guards.reportAt` (F5). The fan spec says
    "a blue handle", like the list row (F4).
  - Round 3 gate: `GREEN_TEST_COMMAND` passed `Test Files  6 passed (6)` and
    `Tests  70 passed (70)`. `owned tsc errors: 0`. Mutations: M1 `CG1 CG4 CG14`, M2 `CG10`,
    M3 `CG8 CG12 CG14`, M4 `CG11`, M5 `CG11`, M6 `CG1 CG5`, M7 `CG4 CG5 CG6 CG7 CG8 CG12 CG14`;
    MF1 (no cards skip) `CG12 CG14`; MF2 (exact string match) `CG13`; MF3 (no projection) `CG14`.
    The restored copy passed 14 of 14.
  - Remediation round 3 (review-b F1 to F3), Red test commit `96a581a001a990243f5015e71a384e26a518ecf9`.
    Added CG12, CG13, and CG14. The targeted command exited 1: 3 failed and 11 passed across 14 tests;
    only CG12, CG13, and CG14 failed, with no load error. Typecheck reported 0 owned errors and 38
    total errors outside the owned Storytime paths. Strategy counts add these 3 tests: N_new 29
    (prior 26 plus 3), N_old remains 41, and the full aggregate target becomes 70.
  - Remediation round 4 (review-a RA2-1), Red test commit `3206662f959ecef24848dc97b67483b4710d75ba`.
    Added CG15 for invalid paths below `cards/`, guarded element-folder spend, and CLI refusal before
    key access. The targeted command exited 1: 1 test failed and 14 passed. Only CG15 failed, with no
    load error. Typecheck found 0 owned errors and 38 total project errors. Strategy counts add this
    one test: N_new 30 (prior 29 plus 1), N_old remains 41, and the aggregate target becomes 71.
  - Green round 4 (commit `91b2a1ca`, Red round 4 `3206662f`): `classifyOutDir` returns `invalid`
    for every path below the child folder `cards` except the exact resolved card folder. The element
    folder `cards/muse/elements`, a mutated child such as `cards/other/muse`, and `cards/muse2` are
    refused with exit 3, before `readKey` and before any cost scan, and the message names the raw
    outDir. A week, cover, or elements path of another child stays `restart` (F6).
  - Round 4 gate: `GREEN_TEST_COMMAND` passed `Test Files  6 passed (6)` and
    `Tests  71 passed (71)`. `owned tsc errors: 0`. Mutation MF4 (classify `cards/muse/elements` as
    restart again) failed `CG15`, with 1 failed and 14 passed; the restored copy passed 15 of 15.
- [x] Task 3 (5f344886, Red fix ad9cc588): The 31 card spec files in
  `docs/storytime/l2-unit1/cards/<id>.json`, and a test that checks them against list v7: ids,
  text, file names, size, aspect, `outDir`, and that every reference file exists. The maker copies
  list v7 (the bytes of Workbooks commit `95043edc`, `content/storytime/l2/print/pictures.json`,
  SHA-256 `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf`) to
  `tests/fixtures/storytime/pictures-v7.json`. The references follow the table in the
  specification. The maker records each prompt difference (Nan buns, teddy, car, and any other) in
  the plan note.
  - The test file is `tests/storytime-card-specs.test.ts`. It reads only
    `tests/fixtures/storytime/pictures-v7.json` and checks its SHA-256 first. A SHA mismatch is a
    hard failure, not a skip. The test reads no path outside the repository.
  - The test checks 13 person cards, 3 prop cards with references, and 15 cards without references.
  - No Muse call and no provider call runs in this phase. Spend stays 0.00 USD.
  - Red amendment against `29524b07`: corrected the train reference to the week 7 file and fixed all eight
    owned TypeScript errors with type annotations, casts, and safe narrowing. No assertion, expected
    value, or test id changed.
  - Amendment verification: the six-file `GREEN_TEST_COMMAND` passed all 6 files and 67 tests.
    Typecheck reported 38 project errors, including 0 owned errors in Storytime sources, scripts,
    and tests. The repository-wide typecheck remains nonzero because other project errors remain.
  - Prompt differences recorded: (1) Nan in hello, goodbye, and girl has two round buns with smooth
    red ring bands, per the `cast.json` note, not the list "two small bunches"; (2) the teddy is
    small and brown with no bow, per the card prompt, not the white teddy of the week 7 toy sheet;
    (3) the car is red, per the card prompt, not the blue book car; (4) the doll follows the
    `cast.json` Pam note (yellow yarn hair, cream cloth face, two black button eyes, stitched smile,
    red dress); (5) the train adds the red wagon of the specification table, and its reference is the
    week 7 toy sheet with only the train drawn; (6) goodbye drops the open door of the list prompt
    and keeps the wave and the school bag on a pure white background; (7) sad gives Ben a sad face
    and a lowered head, although the `cast.json` note gives him a happy smile, so the list prompt
    wins for the expression and the cast note wins for the look; (8) every card replaces the list
    phrase "a plain light background" with "plain white" or "pure white"; (9) the train spec adds
    "four small black wheels" to the colorPrompt and "four small wheels" to mustShow. The list
    prompt does not name the wheels. The week 7 toy sheet shows them. The phrase stays (orchestrator
    decision 2026-11-06).
  - Green round 2 (implementation `5f344886`, Red round 2 `ad9cc588`): Green reran
    `GREEN_TEST_COMMAND` at `ad9cc588` and it exited 0 with `Test Files  6 passed (6)` and
    `Tests  67 passed (67)`. Green changed no file under `tests/`. The mutation self-check M1 to M7
    of test-strategy 4.5 passed at `5f344886`, and the guard code is unchanged since then.
- [x] Phase 1 gates (cf6fb8db): review gates assigned by the test strategy, then phase acceptance
  at an immutable HEAD. Evidence:
  `measure/runs/asset_storytime_l2_cards_20261106/phase-acceptance-cf6fb8d.json`.

## Phase 2: Card pictures and delivery

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`).

- [x] Task 4 (e872a8aa): Judge calibration check. Run the two gate control files of
  `calibration-set.json` (the `a-nose` version 1 line art and the `nan-can-get-a-pan` m3 line art
  try 1) through the frozen Sonnet judge once. Both must fail. Record the result file and the
  verdicts. No Muse spend. If a control passes, stop and report to the PM. Evidence:
  `measure/runs/asset_storytime_l2_cards_20261106/calibration-record.json`. Both controls fail.
- [x] Task 5 (e872a8aa): Color calls for the 31 cards, then judge batches at card size (360 px
  long side). The first passing try is the delivery. At most 3 color tries for each card. A fail
  needs a second judge on the file alone before it stands. Log every call in `costs.tsv`. Stop at
  the cap of 1.60 USD.
  - Evidence: `measure/runs/asset_storytime_l2_cards_20261106/judge-cards-cards-r1-color.json`
    holds 31 files, 30 pass and 1 fail. The file
    `measure/runs/asset_storytime_l2_cards_20261106/judge-cards-cards-r1-color-goodbye-second.json`
    holds the second judge on the goodbye color file. It passes, so the fail did not stand.
    Color try 1 (m1) is the passing color of all 31 cards.
  - Precondition (a shell step, not a test): before the first Muse call, check that the live
    Workbooks file `/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json` still
    has SHA-256 `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf`. On a mismatch,
    stop and report to the PM. Record the check in the role log.
  - Muse calls run 4 at a time at most.
  - At the report point of 0.80 USD the maker records the spend and the projection in its role log
    and continues. The maker stops only at the cap of 1.60 USD.
- [~] Task 6: Line calls from each passing color with the judge. Each line call is a Muse call from
  the passing color picture. At most 3 line tries for each card. No local filter.
  - Orchestrator decision 2026-11-06, after the second judges: the line prompt of the ham and the
    tomato changed so the line art reads as ham and as a tomato. The ham prompt now names the
    slice as the main shape, the pale fat rim band, and 8 to 12 small closed dots. The tomato
    prompt now names the short thick stem, the star calyx of five sepals, and three short curved
    lobe lines.
  - One sentence left each prompt. The sentence "Draw no fat lines and no texture lines on the
    ham." left the ham prompt. The sentence "Draw no shine lines and no texture lines." left the
    tomato prompt. Each sentence blocked the new marks. The thick-line rule, the "pure white"
    rule, the "no gray" rule, and the no-text rule stay in both prompts.
  - Only the `linePrompt` changed in each file. The card spec test passed after the change:
    `Test Files  1 passed (1)`, `Tests  10 passed (10)`, exit 0.
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
| The restart cap of 1.00 USD counts card spend (the scan includes `cards/muse/`). | Task 2 exports `CARD_RUN`, which reads only the card cost files from its start time. A guard test checks that restart rows do not count in the card spend. |
| A second copy of the card run values drifts from `CARD_RUN`. | `CARD_RUN` is the only owner. The muse tool and the judge batch script import it. The acceptance search finds no second copy. |
| The live Workbooks list changes before the first Muse call. | The Task 5 shell step checks its SHA-256. On a mismatch the maker stops and reports to the PM. |
| The judge passes a card that has a wrong person (similar cast looks). | The cast note in `cast.json` and the references bind each person. The checker looks at the contact sheet. |
| A reference differs from the card prompt (Nan buns, teddy, car, doll). | The specification records the decision. The maker records each difference. |
| The spend passes 1.60 USD through retries. | The guard refuses at the cap. At 0.80 USD the maker records the spend and the projection in its role log and continues. The maker stops only at the cap of 1.60 USD. |
| A delivered file has no judge pass. | The delivery writer takes only judged tries. The checker compares the manifest with the judge result files. |
| Text calls the delivery accepted. | FR-12. The checker greps the track files, `MANIFEST.txt`, and the report. |
| A foreign hunk in `measure/tracks.md` enters the commit. | The author staged the registry entry through a blob. `git diff --cached` shows the entry only. |

## Evidence

- Track creation commit: recorded at creation (message `measure(storytime_l2_cards): create the track`).
- Spec review result: `measure/runs/asset_storytime_l2_cards_20261106/spec-review-7af682d.json`
  (status `pass`, SHA `7af682db`; written by `measure-spec-review`). Round 1:
  `spec-review-ac5acf0.json`.
- Test strategy: `test-strategy.md` in this folder (commit message
  `measure(storytime_l2_cards): test strategy and Gate S closed`).
