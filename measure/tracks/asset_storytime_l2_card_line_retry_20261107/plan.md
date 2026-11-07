# Storytime Level 2 card line-art retry (ham and family)

Status: in progress, Phase 2 round 1 (2026-11-07). Two line calls ran: ham try 4 and family try 4.
Spend of this track: 0.02 USD. The total of `costs.tsv` is 0.97 USD in 97 calls. The Sonnet judge
verdicts for both tries are pending.
The [specification](./spec.md) owns the scope and the acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track.
- Owned paths are in the "Owned paths" section of the specification. The owned planning paths are
  this folder and `measure/runs/asset_storytime_l2_card_line_retry_20261107/`.
- Do not change `assets/fireball.ts` or `out/fireball/`. Their owner review stays separate.
- Do not change the judge kit, `scripts/storytime-muse.mjs`, `scripts/storytime-judge-batch.mjs`,
  `src/storytime/muse-delivery.ts`, or the block `CARD_RUN`.
- The question tool is denied. Route every question for Daniel through the PM orchestrator.

### Orchestrator decisions 2026-11-07

The orchestrator answered the author questions on 2026-11-07. The maker applies them.

1. Ham `mustShow`: yes. The maker removes only the phrase "a small white plate" from the ham
   `mustShow`, because the PM ordered a slice with no plate. The two other phrases stay.
2. Color-only row: yes. A row that fails all its tries stays out of `manifest.json` and out of
   `delivery-muse-v2`. It appears in `MANIFEST.txt` and in the PM report with its color file.
3. Width gate for the ham: yes. A ham try that passes the judge and measures below 12 px is a
   failed try.
4. Retry start time: yes. The constant is the real UTC time at Task 1, cut to the minute. It is
   not an example time.

The family stroke ladder keeps the fixed steps E4 to E6 of the specification.
- Other agents share the git index. Commit explicit paths only.
- Muse calls, judge batches, and the delivery script are light roles. They run with `node` or
  `tsx` and without `heavy-run.sh`.
- Run every full test suite and the typecheck with
  `bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. Exit code 75
  means hold. Record `lock wait over 600 s` and stop the run.
- No song or video command runs.
- Spend limit: 0.05 USD for this track (5 calls at most). The total of `costs.tsv` then reaches
  1.00 USD at most. The guard cap of 1.60 USD stays the hard stop.
- The delivery is model evidence. It is not acceptance. No text may claim that Daniel or Workbooks
  accepted a picture.
- Defaults recorded by the author (each one is open to a PM change): see the section "Open
  questions answered by default" of the specification.

PM 2026-11-03: light lane. The PM put this whole track on the light lane: one maker
(`measure-jr-green`) and one checker (`measure-phase-acceptance`), then closeout. No spec review,
test strategy, Red, Review A, Review B, Review C, adversarial, UX review, or final acceptance role
runs. The maker writes the code, the tests, the prompt edits, and the pictures. The checker checks
each phase at an immutable HEAD.

### Task markers

`[x]` means complete. `[~]` means in progress. `[ ]` means ready and not started. `[b]` means
blocked, with a trailing `deferred:<owner>` field. The orchestrator changes `[b]` to `[~]` when
the blocker clears and the task starts. Tasks 1 and 2 are complete. The Phase 1 gate passed at
93f8021b. Task 3 is in progress. The blocker of Tasks 4 to 7 is the acceptance of the phase before
each one. The doctor counts only `[ ]`, `[~]`, and `[x]`, so the open tasks keep the track open
for the doctor.

## Phase 0: Authoring [checkpoint: eb8e77f]

- [x] Task 0: Author the track: specification, plan, metadata, index, spec review note, and the
  registry entry. The creation commit has the message
  `measure(storytime_l2_card_line_retry): create the track`.

The light lane has no spec review gate.

## Phase 1: Guard and prompts [checkpoint: 93f8021]

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`).

- [x] Task 1 (0d47c15): The line retry allowance in the guard, with a test.
  Implementation commit
  `0d47c15749f8712de0532de44f7349266233d91e` (2026-11-07).
  - `CARD_LINE_RETRY_START` is `2026-11-07T02:00:00Z`, from `date -u +%Y-%m-%dT%H:%M:%SZ` at
    02:00:24Z, cut to the minute. It is later than the last row of `costs.tsv`
    (`2026-11-07T00:26:13.647Z`).
  - `CARD_LINE_RETRY.rows` holds `l2-w04-card-ham: 2` and `l2-w04-card-family: 3` for the line
    kind. `lineRetryGuard` counts the line tries of the row since the start time. A row without an
    entry gets `null`. `runGuards` uses the retry rule only for a card line call of the two rows.
  - `CARD_RUN` is byte equal (the `git diff` of that block is empty).
  - The new test `tests/storytime-card-line-retry.test.ts` holds 8 tests and imports `CARD_RUN`.
    It holds no literal of the card start time.
  - Test command (the 4 files of the brief): 4 files pass, 73 tests pass, exit 0.
    `tests/storytime-card-guards.test.ts` and `tests/storytime-card-adversarial.test.ts` pass
    without change.
  - Typecheck: `tsc --noEmit` gives 38 errors in the repository (the old count) and 0 errors in
    `src/storytime/`, `scripts/storytime-`, and `tests/storytime-`.
  - Literal check: `grep -rlF 2026-11-06T00:00:00Z scripts tests` names exactly
    `scripts/storytime-muse-guards.mjs`, `tests/storytime-card-adversarial.test.ts`, and
    `tests/storytime-card-guards.test.ts`.
  - The guard required a checkpoint on the Phase 0 heading before Phase 1 could start. The heading
    now holds `[checkpoint: eb8e77f]`, the creation commit of Phase 0.
  - No Muse call and no provider call ran. Spend stayed 0.00 USD.
- [x] Task 2 (fbfa5fd): The ham prompt edit.
  Implementation commit
  `fbfa5fd9c120f59eaba978714f43b02573f4b702` (2026-11-07).
  - `linePrompt` is the exact text of the specification (byte comparison gives equal).
    `mustShow` lost "a small white plate" and keeps "one slice of ham" and "a slice of pink ham".
    The `git diff` touches only `linePrompt` and `mustShow`. `colorPrompt` is byte equal.
  - Card spec test: 1 file passes, 10 tests pass, exit 0.
  - The family prompt edits happen in Task 5, one step before each try.
- [x] Phase 1 gate (93f8021b): phase acceptance by the checker passed at 93f8021b.
  - Evidence: `measure/runs/asset_storytime_l2_card_line_retry_20261107/acceptance-p1-93f8021.json`
    (`status: pass`, no blocking finding) and its log `acceptance-p1-93f8021.log`.
  - The checker runs the test command, checks that `CARD_RUN` is byte equal and that the literal
    of the card start time is only in the three files that held it, and checks the ham diff.
  - The maker log is
    `measure/runs/asset_storytime_l2_card_line_retry_20261107/maker-p1.log`.
  - Checker finding F1 was a Nit about the plan marker lines. This phase moves the SHA to the
    first line of Task 1 and Task 2.

## Phase 2: Tries, delivery, and report

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`).

- [x] Task 3 (cfeefcd2): Preconditions.
  - Evidence: `measure/runs/asset_storytime_l2_card_line_retry_20261107/maker-p2.log`. All checks
    pass: the three input SHA-256 values, 95 cost rows at 0.9500 USD, the 58 v1 files, the judge
    prompt and cast unchanged since `cadf975d`, and the start time after the last cost row.
  - Check and record in the role log: the three SHA-256 values of the section "Inputs"; the
    `costs.tsv` check (95 call rows, 0.95 USD); the SHA-256 of `approved.json` and of the 58 files
    of `delivery-muse-v1`; that the judge kit is unchanged since the calibration record
    (`git diff` of `docs/storytime/l2-unit1/judge/` against the record commit is empty); that
    `CARD_LINE_RETRY_START` is later than the last `costs.tsv` row.
  - If a check fails, stop and report to the PM. No Muse spend.
- [~] Task 4: Ham line tries.
  - Try 4 on 2026-11-07: `l2-w04-card-ham-m1-line-4.png` (1600 x 1600, 0.01 USD), print
    `l2-w04-card-ham-m1-line-print-4.png` at 27 px (gate 12 px), judge batch
    `docs/storytime/l2-unit1/judge/prod/cards-retry-ham-t4.json`. The judge verdict is pending.
  - Follow the section "Tries, order, and stop rules". Call, measure the width, judge at card
    size (`--cards --kind line --try <n>`), second judge on a fail. Try 4 first, then try 5 only
    if try 4 does not pass. Stop at the first pass or at try 5.
  - Record for each try: the file, the width, the judge result file, the verdict, and the defect
    class.
- [~] Task 5: Family line tries.
  - Orchestrator decision 2026-11-07: ham try 4 and family try 4 run in the same round. The two
    rows are independent, so both calls share one judge cycle.
  - E4 applied on 2026-11-07 (try 4): the first sentence now asks for "extremely thick, heavy,
    even black marker lines (about ten times a normal outline)", and the later line asks for
    "about twelve times a normal outline, as thick as a fat marker". `colorPrompt` and
    `references` are byte equal. Card spec test: 10 tests pass, exit 0.
  - Try 4 on 2026-11-07: `l2-w04-card-family-m1-line-4.png` (1600 x 1600, 0.01 USD), print
    `l2-w04-card-family-m1-line-print-4.png` at 12 px (gate 12 px, so the try goes to the judge),
    judge batch `docs/storytime/l2-unit1/judge/prod/cards-retry-family-t4.json`. The judge verdict
    is pending.
  - Before each call, apply the next step of the ladder (E4 for try 4, E5 for try 5, E6 for try
    6) to `docs/storytime/l2-unit1/cards/l2-w04-card-family.json`, and run the card spec test.
    Commit each edit before its call (explicit path).
  - After each call, measure the width. Below 12 px: a failed try, no judge. At 12 px or more:
    judge at card size, and a second judge on a fail. Stop at the first pass or at try 6.
  - Stop both rows at the spend stop of 0.05 USD in total.
- [b] Task 6: Delivery folder, handoff folder, `MANIFEST.txt`, and contact sheet.
  deferred:Task 5
  - The form follows the section "Delivery". Write `approved-v2.json` and the folder
    `out/storytime/l2/unit1/cards/delivery-muse-v2/` with `writeMuseDelivery`. Copy the old
    handoff `MANIFEST.txt` and `manifest.json` to the run folder first. The family-word run
    folder holds a model script for the contact sheet and the manifest text
    (`measure/runs/asset_storytime_l2_family_words_20261107/make-handoff.mts`).
  - Check that the 58 old files have the same SHA-256 in the v1 folder, the v2 folder, and the
    handoff folder. Check every new PNG at 1500 x 1500 px, 8-bit, no alpha.
  - A failed row: add its color print and note, and name its best try.
  - Report the corner values below 250 of the new color files (report item, not a gate).
  - `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -` in the handoff folder gives OK for
    every file. The handoff `manifest.json` equals the v2 `manifest.json`.
- [b] Task 7: Report record for the PM:
  `measure/runs/asset_storytime_l2_card_line_retry_20261107/pm-report.md`. deferred:Task 6
  - It follows the section "PM report" of the specification.
- [b] Phase 2 gate: phase acceptance by the checker at an immutable HEAD. deferred:Tasks 3 to 7

## Track-level roles

- [b] Closeout: archive the track, update the registry, run the generator and the doctor, and
  commit the run records in `measure/runs/asset_storytime_l2_card_line_retry_20261107/`. Foreign
  generated facts stay out of the closeout commit unless their owner has committed them.
  deferred:Phase 2 gate

The light lane has no final acceptance role.

## Human gate

Workbooks checks the pictures after the delivery. Daniel sees the print cards in his 11-16 check.
Both checks are outside this track. The track records no Workbooks or Daniel acceptance.

## Risks

| Risk | Control |
| --- | --- |
| The retry allowance opens more tries than the PM gave. | The allowance is per row (ham 2, family 3), counted from a start time, and the spend stop is 0.05 USD. FR-1 tests the limits. |
| The guard change breaks the card rules. | `CARD_RUN` stays byte equal. Other rows and kinds keep the 3-try rule. The two old guard tests pass without change. |
| The start time lies in the future or before the last cost row. | Task 1 reads `date -u`. Task 3 checks it against the last row of `costs.tsv`. |
| The judge fails a correct ham picture for the missing plate. | The ham `mustShow` loses the plate phrase (Task 2). The report records the difference. |
| The ham slice still reads as a plate, a pizza, or a pie. | The prompt draws the slice only, with one fat rim band and long grain lines. The row stops at try 5 and then names its best try. |
| The family strokes stay below 12 px. | The ladder E4 to E6 thickens the strokes at each try. A try below 12 px goes to no judge. After try 6 the row falls back to the color file. |
| A thick family line loses the faces. | The judge checks the persons and the faces at card size. The ladder keeps the eyes and the smile in every step. |
| A prompt edit drifts from the text in the file. | The maker stops when a sentence of a step is not in the current text. The test of the card specs runs after each edit. |
| The old handoff files change. | The checker compares the SHA-256 of the 58 old files in three folders. The old `MANIFEST.txt` and `manifest.json` are copied first. |
| Text calls the delivery accepted. | FR-10. The checker greps the track files, `MANIFEST.txt`, and the report. |
| A foreign hunk in `measure/tracks.md` enters the commit. | The author staged the registry entry through a blob. `git diff --cached` shows the entry only. |

## Evidence

- Track creation commit: recorded at creation (message
  `measure(storytime_l2_card_line_retry): create the track`).
- Run records: `measure/runs/asset_storytime_l2_card_line_retry_20261107/` (role logs, judge
  result files, width record, delivery script, PM report, acceptance results).
