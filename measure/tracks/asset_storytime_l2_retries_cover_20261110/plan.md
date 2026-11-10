# Storytime Level 2 unit 2 picture retries and the teacher cover front art

Status: new (2026-11-10). Phase 0 authors the track. Phase 1 writes the guard exception, the cover
class, the specs, and the writer option (0 USD). Phase 2 runs the paid retries and the cover.

The track gives 9 unit 2 book rows one extra try each (item a, cap 0.15 USD) and makes one color
picture for the Teacher Book front (item b, stop 0.10 USD). The [specification](./spec.md) owns the
scope, the decisions D1 to D14, and the acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track.
- Owned paths are in the "Owned paths" section of the specification. The owned planning paths are this
  folder and `measure/runs/asset_storytime_l2_retries_cover_20261110/`.
- Do not change the judge kit, any unit 1 file, `assets/**`, the Workbooks repository, the brief folder,
  the v1 book delivery, or the v1 hand-off. Never write a cap value other than D1 and D7.
- The question tool is denied. Route every question for Daniel through the PM orchestrator. A stop or a
  blocked rerun goes to the PM.
- Other agents share the git index. The maker commits explicit paths only.
- The maker marks a task `[~]` before the task changes a file outside `measure/` (measure-guard).
- No PNG or JPG goes into git. Test fixtures are generated in temp folders.
- Every role writes scratch only under `/tmp/opencode/l2rc/` (D13).
- Muse calls, judge copies, and the delivery writer are light roles. They run with `node` and without
  `heavy-run.sh`. Tests and `tsc` run with
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`,
  one at a time. Exit code 75 means hold: run again.
- The orchestrator runs `slot check` before each role. One role runs at a time. The Storytime app roles
  keep the first claim on free slots.
- Spend limits: item (a) 0.15 USD (report point 0.12 USD), item (b) 0.10 USD (report point 0.08 USD). A
  call above 0.03 USD stops the run. The guard owns both stops.
- The delivery and the cover are model evidence. They are not acceptance. No text may claim that Daniel,
  the PM, or Workbooks accepted a picture.

PM 2026-11-03: light lane. The PM put this track on the light lane: one maker (`measure-jr-green`) and
one checker (`measure-phase-acceptance`) for each phase, then closeout. No spec review, Red, Review A,
Review B, Review C, adversarial, UX review, or final acceptance role runs. The maker writes the code, the
tests, and the pictures. The checker checks each phase at an immutable HEAD. The orchestrator, not the
maker, runs the frozen judge.

### Task markers

`[x]` means complete. `[~]` means in progress. `[ ]` means ready and not started. `[b]` means blocked,
with a trailing `deferred:<owner>` field. The owner changes `[b]` to `[~]` when the blocker clears and the
task starts. The doctor counts only `[ ]`, `[~]`, and `[x]`.

## Phase 0: Authoring [checkpoint: 699fb46]

- [x] Task 0 (699fb466): Author the track: specification, plan, metadata, index, spec review note, and the registry
  entry. The creation commit has the message `measure(storytime_l2_retries_cover): create the track`.

The light lane has no spec review gate. A second small commit marks Task 0 and puts the checkpoint on
this heading.

## Phase 1: Guard exception, cover class, specs, and writer option (unpaid)

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`). Spend 0 USD.

- [ ] Task 1: Guard blocks and tests (D1, D7). Add `U2_EXTRA_TRY` and `COVER_RUN` to
  `scripts/storytime-muse-guards.mjs` and the `.d.mts`. Add the kind `cover`, the exception rule in
  `runGuards`, and the test-only keys `u2ExtraCapUsd` and `coverCapUsd` (stripped by `cliGuardOptions`).
  Set both `startTime` values to the real UTC time of this commit, cut to the minute. Keep the values of
  `U2_RUN`, `U2_FW_RUN`, `CARD_RUN`, and `CARD_LINE_RETRY`. Add
  `tests/storytime-u2-extra-try.test.ts` and `tests/storytime-cover-guards.test.ts` with the cases of
  FR-1 to FR-4. Run the GREEN command. Commit with explicit paths. The maker replies with the guard
  commit and the start time.
- [ ] Task 2: The 9 spec edits, the cover spec, and the aspect check (D2, D5, D6). Edit only the named
  prompt field of each of the 9 specs. Write the cover spec and the cover prompt of D5 and D6. Copy the 4
  brief files into `out/storytime/covers/teacher-front/refs/` and check each SHA-256 against the brief
  MANIFEST. Check, with no paid call, that the model accepts `3:4` and that the crop is centered; record
  the ratio and the reason. Add `tests/storytime-cover-specs.test.ts`. Record each new sentence in this
  task's evidence. Commit with explicit paths.
- [ ] Task 3: The writer option and the cover judge-copy helper (D4, D9). Add the option `approvalsOnly`
  to `deliverMuseUnit2` with `tests/storytime-u2-retry-delivery.test.ts`. Write
  `scripts/storytime-cover-judge-copy.mjs` (and its `.d.mts`) with
  `tests/storytime-cover-judge-copy.test.ts`, and the cover judge brief
  `docs/storytime/covers/teacher-front/judge-brief.md`. Run the GREEN command and the typecheck. Commit
  with explicit paths.
- [b] Phase 1 gate: phase acceptance by the checker at an immutable HEAD. The checker probes the
  exception and the cover class with fixture cost files, greps FR-12 and FR-14, and runs the GREEN
  command and the typecheck. deferred:checker

## Phase 2: Retries and cover (paid)

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`). The orchestrator
runs the frozen judge. The stops are 0.15 USD for item (a) and 0.10 USD for item (b).

- [b] Task 4: Retry pool, print gate, and judge batches (D1, D2, D3, D11). Write the worst case. Run
  hat-pip color try 4 (once). If the orchestrator's judge passes it, run the hat-pip line call (line
  try 2). Run line try 4 once for each of the 8 other rows, from its m1 color. Run the print gate before
  the judge on each new line print and its despeckled print. The orchestrator runs the judge batches and
  the second judge. Log each paid call in `spend-log.tsv`. deferred:maker
- [b] Task 5: Retry delivery and hand-off (D4). Write `approvals-retry1.json` for the passing rows. Run
  `deliverMuseUnit2` with `approvalsOnly` into `out/storytime/l2/unit2/delivery-muse-v1-retry1/`. Build
  `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1/` with the hard links,
  `manifest.json`, `contact-sheet.png`, `not-delivered/` with its `README.md`, the spend log copy, and
  `MANIFEST.txt`. Run `sha256sum -c MANIFEST.txt` (0 FAILED). Check that the v1 files have the same
  SHA-256 as before. deferred:maker
- [b] Task 6: Cover rounds and judge copies (D5, D8, D9, D11). Write the worst case. Run round 1: 3 color
  calls, one after another. Make the judge copies for each version. The orchestrator runs the frozen
  judge and the second judge. Run round 2 only if no version passes. Log each paid call. Stop at 6 calls
  or at 0.10 USD. deferred:maker
- [b] Task 7: Cover hand-off (D10). Deliver the passing picture as
  `l2-u1-cover-quest-teacher-front-forge-v1.png` (2480 x 3508 px, RGB, no alpha). Build
  `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/` with the PNG, the zone-line copy,
  `README.md`, and `MANIFEST.txt`. Run `sha256sum -c MANIFEST.txt` (0 FAILED). If no try passes, skip
  this task and record the best try for the report. deferred:maker
- [b] Task 8: Report and scratch delete (D13, D14). Write `pm-report.md`. List, then delete,
  `/tmp/opencode/l2rc/` and any staging folder this track made under `out/`. Keep the files that D13
  names. deferred:maker
- [b] Phase 2 gate: phase acceptance by the checker at an immutable HEAD. The checker compares the
  `costs.tsv` sums with the spend log, runs the `sha256sum -c` checks of both hand-off folders, checks the
  v1 hashes, the PNG size and mode, and greps FR-12 and FR-14. deferred:checker

## Track-level roles

- [b] Closeout: archive the track, update the registry, and run the doctor. The generator does not run
  while `measure/generated/` holds foreign changes. The run records in
  `measure/runs/asset_storytime_l2_retries_cover_20261110/` are committed. Foreign changes stay out of
  the closeout commit. deferred:closeout

The light lane has no final acceptance role.

## Human gate

The PM opened the spend with the messages quoted in the specification. A stop or a blocked rerun goes to
the PM and not to Daniel. The track records no acceptance of a picture by Daniel, the PM, or Workbooks.

## Risks

| Risk | Control |
| --- | --- |
| The exception spend passes 0.15 USD, or the cover spend passes 0.10 USD. | The guard classes (D1, D7) refuse the call. The maker writes the worst case before each pool (D11). A call above 0.03 USD stops the run. |
| An unlisted row, a second extra try, or a wrong kind gets a call. | The exception lists 9 ids and kinds with `pastLimit`, and tests refuse each case (FR-2). |
| A cap value drifts or a CLI option sets a cap. | `cliGuardOptions` strips every test-only cap key. The checker probes the guard with fixture files. |
| Cover spend counts against a book cap, or the reverse. | Separate scans and separate start times. The checker probes both. |
| A thin line print passes the judge but fails the 12 px gate. | D3 runs the print gate before the judge, and a row passes only when both pass. |
| The aspect `3:4` is not accepted, or the crop does not trim the sides. | Task 2 checks it with no paid call, and the fallback ratio must be at least 0.7069. |
| The logo tile or the plaque covers a face or the book. | D6 keeps the top 30 percent calm and the bottom 22 percent free. The zone-line copy shows it. |
| The v1 delivery or the v1 hand-off changes. | D4 uses new folders. The checker compares the v1 hashes. |
| A text claims a picture acceptance. | FR-12. The checker greps the track files, the manifests, and the report. |
| A foreign hunk in `measure/tracks.md` enters a commit. | The author stages the registry entry through a blob. |
| A heavy build runs while the machine has no free slot. | D12: `slot check`, one role at a time, and `heavy-run.sh` for tests and `tsc`. |

## Evidence

- Track creation commit: `699fb466` (message `measure(storytime_l2_retries_cover): create the track`).
- Run records: `measure/runs/asset_storytime_l2_retries_cover_20261110/` (spend log, judge files, role
  logs, PM report, acceptance results).
