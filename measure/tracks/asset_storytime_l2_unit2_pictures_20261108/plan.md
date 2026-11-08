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

## Phase 2: Book pictures (paid)

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
- [b] Task 5: Color pools and judges (D4, D5). Run color try 1 for the 182 new rows at concurrency 4,
  then the judge for each week. Retry a failed row up to 3 color tries in total, with a second judge
  before a fail stands. Log each pool in the spend record. At 14.66 USD record the total and the
  projection once. The task may span rounds. deferred:maker
- [b] Task 6: Line pools and judges (D4, D5). Run line calls with `--tries 1` from each passing color,
  then the judge. Retry up to 3 line tries in total, with a second judge before a fail stands. Name
  each row with no pass and its best try. deferred:maker
- [b] Task 7: Delivery and hand-off (D7). Run `deliverMuseUnit2` into
  `out/storytime/l2/unit2/delivery-muse-v1/` with the list pin. Build the hand-off folder
  `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures/` with the PNG files, `manifest.json`,
  `MANIFEST.txt`, and one contact sheet for each week (sharp; Chrome only through `heavy-run.sh`).
  Run `sha256sum -c MANIFEST.txt` (0 FAILED). deferred:maker
- [b] Task 8: Book part of the PM report (D8). Write the book lines of `pm-report.md`: spend, calls,
  the stop, rows done, failures with the best try, and the folders. deferred:maker
- [b] Phase 2 gate: phase acceptance by the checker at an immutable HEAD. The checker compares the
  `costs.tsv` totals with the spend record, the calibration record, the judge files, and the delivery
  manifest, and runs `sha256sum -c` on the hand-off folder. deferred:checker

## Phase 3: App family-word pictures

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`). The stop is
0.29 USD.

- [b] Task 9: The 18 specs, the judge option `--unit2-family-words`, the delivery support
  (`deliverMuseColorSet` or the wrapper `deliverMuseUnit2FamilyWords`), and the tests (D6). Unpaid.
  Spend 0 USD. Commit with explicit paths. deferred:maker
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
