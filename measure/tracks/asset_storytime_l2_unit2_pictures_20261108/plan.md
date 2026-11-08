# Storytime Level 2 unit 2 paid pictures (book rows, element sheets, app family words)

Status: in progress (2026-11-08). Phase 1 is done and accepted at d99aa896 (caps and the ten row,
0 USD). Phase 2: Task 3 and Task 4 are done. The 10 element sheets pass the judge at m1. Task 5
starts the 182 row color pool.

The track writes the unit 2 caps into the guard, fixes the ten row, makes 182 new book rows and 10
element sheets, and makes 18 app family-word pictures. The [specification](./spec.md) owns the
scope, the decisions D1 to D9, and the acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track.
- Owned paths are in the "Owned paths" section of the specification. The owned planning paths are
  this folder and `measure/runs/asset_storytime_l2_unit2_pictures_20261108/`.
- Do not change `assets/fireball.ts` or `out/fireball/`. Their owner review stays separate.
- Do not change the judge kit or any unit 1 file. Never write a cap value other than D1.
- The question tool is denied. Route every question for Daniel through the PM orchestrator. A stop or
  a blocked rerun goes to the PM.
- Other agents share the git index. The maker commits explicit paths only.
- The maker marks a task `[~]` before the task changes a file outside `measure/` (measure-guard).
- No PNG or JPG goes into git. Test fixtures are generated in temp folders.
- Muse calls, judge batches, and the delivery writer are light roles. They run with `node` and
  without `heavy-run.sh`. Tests and `tsc` run with
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`,
  one at a time. Exit code 75 means hold: run again.
- The orchestrator runs `slot check` before each role. One role runs at a time. The Storytime app
  roles keep the first claim on free slots.
- Spend limits: book 18.33 USD (report point 14.66 USD), app 0.29 USD (report point 0.23 USD). The
  whole unit 2 hard stop is 25.21 USD. The guard owns both stops.
- The delivery is model evidence. It is not acceptance. No text may claim that Daniel, the PM, or
  Workbooks accepted a picture.

PM 2026-11-03: light lane. The PM put this track on the light lane: one maker (`measure-jr-green`)
and one checker (`measure-phase-acceptance`) for each phase, then closeout. No spec review, Red,
Review A, Review B, Review C, adversarial, UX review, or final acceptance role runs. The maker writes
the code, the tests, and the pictures. The checker checks each phase at an immutable HEAD.

### Task markers

`[x]` means complete. `[~]` means in progress. `[ ]` means ready and not started. `[b]` means
blocked, with a trailing `deferred:<owner>` field. The owner changes `[b]` to `[~]` when the
blocker clears and the task starts. The doctor counts only `[ ]`, `[~]`, and `[x]`.

## Phase 0: Authoring [checkpoint: 677ecaa]

- [x] Task 0 (677ecaa0): Author the track: specification, plan, metadata, index, spec review note, and the
  registry entry. The creation commit has the message
  `measure(storytime_l2_unit2_pictures): create the track`.

The light lane has no spec review gate. The second small commit marked Task 0 and put the checkpoint
on this heading.

## Phase 1: Caps and the ten row (unpaid) [checkpoint: d99aa89]

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`). Spend 0 USD.

- [x] Task 1 (57fe034e): Caps (D1). Add `U2_FW_RUN`, the kind `u2fw`, and the separate scans. Write the caps
  18.33 and 14.66 in `U2_RUN`. Strip every test-only cap key in `cliGuardOptions`. Route `u2fw` specs
  in the muse tool, with no other change. Update `tests/storytime-u2-guards.test.ts` and add the
  family-word cases: the empty or invalid cap refusal for both kinds, the separate scans, the mixed
  call, and the CLI strip. Set `U2_FW_RUN.startTime` to the real UTC time of this task, cut to the
  minute. Run the GREEN test command. Commit with explicit paths and the message
  `feat(storytime_l2_unit2_pictures): unit 2 caps 18.33 and 0.29 USD`. The maker replies with the
  guard commit and the start time.
- [x] Task 2 (7c53c29a): The ten row (D2). Add the named exclusion rule to `scripts/storytime-u2-specs.mjs`,
  regenerate `docs/storytime/l2-unit2`, update `tests/storytime-u2-specs.test.ts` and the delivery
  test counts (182 new, 47 reuse: 45 and 2), rebuild the prep hand-off folder with `make-handoff.mjs`,
  and run `sha256sum -c MANIFEST.txt` (0 FAILED). Run the GREEN test command and the typecheck (0 new
  errors in the storytime paths). Commit with explicit paths.
- [x] Phase 1 gate (d99aa896): phase acceptance by the checker passed at d99aa896.
  - Evidence: measure/runs/asset_storytime_l2_unit2_pictures_20261108/acceptance-p1-d99aa89.json
    (status pass, 73 probe cases, 0 FAIL; GREEN 13 files and 213 tests; tsc 38 old errors and 0 in
    the storytime paths; prep hand-off 257 OK and 0 FAILED).
  - Checker findings and orchestrator dispositions: F1 [Nit] stale "48 reuse rows" comment in
    src/storytime/muse-delivery-u2.ts: DEFER to Task 9, which changes that file; F2 [Nit] pool
    recheck at concurrency 4: ACCEPT as an operating rule: when item total + planned calls x the
    highest call cost + 0.03 USD passes the item stop, the pool runs at concurrency 1.

## Phase 2: Book pictures (paid) [checkpoint: ac23e9e]

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`). The orchestrator
runs the frozen judge and the calibration controls. The stop is 18.33 USD.

- [x] Task 3 (9ba5f0e1): Preconditions and calibration (D4, D5). Check the SHA-256 of the book list (the pin of
  D7). Record the state of the `w09` to `w16` cost files and the first spend line (0.00 USD). The
  orchestrator runs the two calibration controls of `calibration-set.json` through the frozen judge
  once. Both must fail. Write `calibration-record.json` in the run folder. If one control passes,
  stop and report to the PM. deferred:maker
- [x] Task 4 (01b97374): Element sheets (D3). Run the color calls for the 10 element sheets, then the judge at
  900 px with the use `element`. At most 3 tries for each sheet. If a sheet passes at `m<n>` with n
  above 1, change the references of the rows that use it, and record the change. Log the pool in the
  spend record. deferred:maker
- [x] Task 5 (d7f5672d): Color pools and judges (D4, D5). Run color try 1 for the 182 new rows at concurrency 4,
  then the judge for each week. Retry a failed row up to 3 color tries in total, with a second judge
  before a fail stands. Log each pool in the spend record. At 14.66 USD record the total and the
  projection once. The task may span rounds. Round 3 (a24f3558 generator): the 7 HTTP 400 group rows reran as color try 2 (7 ok, 0.07 USD). Judge batch u2-r1-color-group-t2 is built, not judged. Round 8 (0e1f8452 base): the color try 2 and 3 judge gave 8 of 10 pass, and l2-w11-story-page-here and l2-w11-story-page-ten-men-in-the-den fail again with 1 color try left each. The 5 rows of N.A ran a new color pool (5 ok, 0.05 USD). Judge batches u2-r3-color-t2 and u2-r3-color-t3 are built, not judged. deferred:maker
  - Real maker models (orchestrator, from the OpenCode session store model-switched rows, 2026-11-09): the requested route opencode/deepseek-v4.1-flash-free#high fell back silently to claude-code/claude-haiku-5-5 at 22:41, 22:44, and 23:40 ICT on 2026-11-08. Commits on DeepSeek: 9ba5f0e1, a1b63217, 01b97374, ff245b58. Commits made fully or partly on Haiku: 9718baa5, a24f3558, f7138831, bd741797, b9ed6043, 179f438a. Phase 1 (57fe034e to d99aa896) ran fully on DeepSeek. From round 6 the maker runs on minimax-cn-coding-plan/MiniMax-M3.1-Flash. The light lane has no Red. The Phase 2 checker runs on a family other than Anthropic, DeepSeek, and MiniMax. The frozen judge stays claude-code/claude-sonnet-5-5#high by the judge kit rule of 2026-11-04; it judges the Muse pictures, not the maker code.
  - Evidence (0 USD, round 11): color passes 182 of 182. 165 rows passed at try 1, 13 at try 2, and 4 at try 3 (17 retried). The judge files are `measure/runs/asset_storytime_l2_unit2_pictures_20261108/judge-u2-*.json` (36 files: the week batches u2-w09-r1 to u2-w16-r1, the round batches u2-r1 to u2-r5, and the `-second` files). 11 provider failures cost 0 USD and still counted as tries: 9 color calls (7 HTTP 400, 2 network timeouts) and 2 line calls (HTTP 502). Each fail stood only after a second judge.
- [x] Task 6 (d34d9e91): Line pools and judges (D4, D5). Run line calls with `--tries 1` from each passing color,
  then the judge. Retry up to 3 line tries in total, with a second judge before a fail stands. Name
  each row with no pass and its best try. Round 7 (b42008b3 base): the line pool ran for the 172
  rows that passed the color judge (1.72 USD, 172 ok, 1 retry). Judge batches u2-w09-r1-line to
  u2-w16-r1-line and u2-w10-r2-line are built, not judged. Round 8 (0e1f8452 base): the color pool
  ran for the 5 rows of N.A (5 ok, 0.05 USD) and the line pool for the 19 rows of O2 (19 ok, 0.19 USD).
  Judge batches u2-r3-color-t2, u2-r3-color-t3, u2-r3-line-t1, and u2-r3-line-t2 are built, not
  judged. Round 9 (1f3a76d7 base): the round 3 judge gave 5 of 5 colors pass and 16 of 19 lines
  pass. The line pool ran for the 7 rows of step R (6 ok, 1 HTTP 502, then 1 retry at concurrency 1).
  Judge batches u2-r4-line-t1, u2-r4-line-t2, and u2-r4-line-t3 are built, not judged.
  Round 10 (b1420a85 base): the round 4 judge gave 6 of 7 lines pass. The last line try of
  l2-w13-check-row-dot ran at line try 3 (1 ok, 0.01 USD). Judge batch u2-r5-line-t3 is built,
  not judged.
  - Evidence (0 USD, round 11): line passes 181 of 182. 164 rows passed at try 1, 15 at try 2, and 2 at try 3.
    l2-w10-story-page-put-on-your-hat-pip is the only line fail: its best try is line try 1, and two judges count
    9 children while the page names 7. Its passing color is try 3 (m2, cleared by the second judge). It has no
    color try left, so it gets no delivery entry and goes to `onSkip`; the PM decides on one try exception.
    The judge files are the same 36 `judge-u2-*.json` files. The last try judged is
    `judge-u2-r5-line-t3.json` (l2-w13-check-row-dot line try 3 passes).
- [x] Task 7 (a6052181): Delivery and hand-off (D7). Run `deliverMuseUnit2` into
  `out/storytime/l2/unit2/delivery-muse-v1/` with the list pin. Build the hand-off folder
  `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures/` with the PNG files, `manifest.json`,
  `MANIFEST.txt`, and one contact sheet for each week (sharp; Chrome only through `heavy-run.sh`).
  Run `sha256sum -c MANIFEST.txt` (0 FAILED).
  - Round 11 (0 USD): the approval list and the runner are ready (`approvals-u2.json`;
    `deliver-u2.mts`). `deliverMuseUnit2` refused the rows whose line prints have lines of 8 to 11 px
    against the 12 px minimum, and the rows that fail the white edge frame. The writer wrote nothing.
    The per-row record is `delivery-gate.txt`. Three rows pass with the despeckled print of the same
    try. The round stops for the PM decision: accept the thin lines, accept the despeckled prints,
    regenerate the lines in a later paid round, or deliver the rows that pass. No delivery folder
    exists. The delivered counts are in the Delivery paragraph below.
  - Delivery (commit a6052181): `out/storytime/l2/unit2/delivery-muse-v1/` holds 220 rows and 440 PNG
    files plus `manifest.json`. 173 approved rows and 47 reuse rows. `onSkip` named exactly the 9
    rows out. File checks: 440 files, 0 problems (class size, 8-bit, no alpha, line grayscale).
    The 3 despeckled prints are delivered (l2-w12-cover-open-your-book,
    l2-w12-story-page-open-your-book-pip, l2-w13-cover-look-at-me).
  - Hand-off `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures/`: 440 hard links,
    `manifest.json`, 8 contact sheets (sharp), `not-delivered/` with 18 hard links and `README.md`,
    and `MANIFEST.txt`. `sha256sum -c MANIFEST.txt`: 468 OK, 0 FAILED.
- [x] Task 8 (ed40d429): Book part of the PM report (D8). Write the book lines of `pm-report.md`: spend, calls,
  the stop, rows done, failures with the best try, and the folders. deferred:maker
- [x] Phase 2 gate (ac23e9e2): phase acceptance by the checker passed at ac23e9e2. Evidence:
  measure/runs/asset_storytime_l2_unit2_pictures_20261108/acceptance-p2-ac23e9e.json. Checker model:
  nvidia/stepfun-ai/step-5-preview#high.
  - Checker findings and orchestrator dispositions: F1 [Nit] stale round 11 counts under Task 7: FIX now (the Task 7 lines name 173 approved rows, 47 reuse rows, 220 delivered, 9 out); F2 [Nit] pm-report.md status line: DECLINE, the final status line belongs to Task 11; F3 [Nit] approvals name the color try only: ACCEPT as a note, the line try comes from the call order, and the app item is color only.

## Phase 3: App family-word pictures

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`). The stop is
0.29 USD.

- [~] Task 9: The 18 specs, the judge option `--unit2-family-words`, the delivery support
  (`deliverMuseColorSet` or the wrapper `deliverMuseUnit2FamilyWords`), and the tests (D6). Unpaid.
  Spend 0 USD. Commit with explicit paths.
- [b] Task 10: Color pool, judges, delivery, and hand-off (D5, D6). Run color try 1 for the 18 words
  (concurrency 4), then the judge at 360 px. Retry a failed word up to 3 color tries in total, with a
  second judge before a fail stands. Log each pool in the spend record. At 0.23 USD record the total
  and the projection once. Deliver to `out/storytime/l2/unit2/family-words/delivery-muse-v1/` and
  build `/home/daniebo/Desktop/handoff/storytime-l2u2-family-word-pictures/` with the PNG files,
  `manifest.json`, `MANIFEST.txt`, and a contact sheet. Run `sha256sum -c MANIFEST.txt` (0 FAILED).
  deferred:maker
- [b] Task 11: Final PM report (D8). Complete `pm-report.md`: the first line `Status: done.` (or
  `Status: blocked.`), the spend for each item with calls and stop, the rows done, the failures with
  the best try, the delivery and hand-off folders, and `Facts changed:`. deferred:maker
- [b] Phase 3 gate: phase acceptance by the checker at an immutable HEAD. The checker compares the
  app `costs.tsv` total with the spend record, checks the judge files and the delivery manifest, runs
  `sha256sum -c` on the hand-off folder, and greps FR-12 and FR-14. deferred:checker

## Track-level roles

- [b] Closeout: archive the track, update the registry, and run the doctor. The generator does not
  run if `measure/generated/` holds foreign changes. Closeout commits `measure/runs/<track>/` with
  the archive. deferred:closeout

The light lane has no final acceptance role.

## Human gate

Daniel's "Go" opened the spend. A stop, a blocked rerun, or a failed calibration control goes to the
PM and not to Daniel. The track records no acceptance of a picture by Daniel, the PM, or Workbooks.

## Risks

| Risk | Control |
| --- | --- |
| The spend passes a stop. | The guard caps (D1) refuse the call. The maker computes the worst case before each pool (D5). A call above 0.03 USD stops the run. |
| The OpenRouter key runs out. The key had 18.69 USD left and the stops sum to 18.62 USD. | A rerun that would pass a stop is blocked and reported to the PM. The maker makes no balance call. |
| A cap value drifts or a CLI option sets a cap. | `cliGuardOptions` strips every test-only cap key. The checker probes the guard with fixture files. |
| Book spend counts against the app stop, or the reverse. | Separate scans for `u2` and `u2fw`. The checker probes both. |
| The judge passes a wrong picture. | The frozen judge kit, two calibration controls before the first paid call, and a second judge on every fail. |
| The 10 px ten line enters the delivery. | D2 excludes the unit 1 source. `l2-w10-check-row-ten` becomes a new row. |
| An element sheet changes after the row references name it. | D3: the maker updates the row references to the passing `m<n>` file before the row pool. |
| `deliverMuseColorSet` refuses the unit 2 family ids. | D6: the thin wrapper `deliverMuseUnit2FamilyWords`, with no behavior change in `muse-delivery.ts`. |
| A text claims a picture acceptance. | FR-12. The checker greps the track files, the manifests, and the report. |
| A foreign hunk in `measure/tracks.md` enters a commit. | The author staged the registry entry through a blob. |
| A heavy build runs while the machine has no free slot. | D9: `slot check`, one role at a time, and `heavy-run.sh` for tests, `tsc`, and Chrome. |

## Evidence

- Track creation commit: recorded at creation (message
  `measure(storytime_l2_unit2_pictures): create the track`).
- Phase 1 maker (measure-jr-green, 2026-11-08): commits `57fe034e` (the caps and the guard entry)
  and `7c53c29a` (the ten row). `U2_FW_RUN.startTime` is 2026-11-08T13:39:00Z. The GREEN command
  gave 13 files and 213 tests, pass. The typecheck gave 38 known old errors and 0 errors in the
  storytime paths. The prep hand-off gave 257 OK and 0 FAILED (258 files). The 16 `costs.tsv`
  hashes equal `measure/runs/asset_storytime_l2_unit2_tooling_20261108/costs-after.txt`. Spend
  0 USD. The maker log is
  `measure/runs/asset_storytime_l2_unit2_pictures_20261108/maker-p1.log`.
- Run records: `measure/runs/asset_storytime_l2_unit2_pictures_20261108/` (spend record, calibration
  record, judge files, role logs, PM report, acceptance results).
