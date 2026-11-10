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

- [x] Task 1 (d5f938b2): Guard blocks and tests (D1, D7). Add `U2_EXTRA_TRY` and `COVER_RUN` to
  `scripts/storytime-muse-guards.mjs` and the `.d.mts`. Add the kind `cover`, the exception rule in
  `runGuards`, and the test-only keys `u2ExtraCapUsd` and `coverCapUsd` (stripped by `cliGuardOptions`).
  Set both `startTime` values to the real UTC time of this commit, cut to the minute. Keep the values of
  `U2_RUN`, `U2_FW_RUN`, `CARD_RUN`, and `CARD_LINE_RETRY`. Add
  `tests/storytime-u2-extra-try.test.ts` and `tests/storytime-cover-guards.test.ts` with the cases of
  FR-1 to FR-4. Run the GREEN command. Commit with explicit paths. The maker replies with the guard
  commit and the start time.
  - `U2_EXTRA_TRY` holds the cap of 0.15 USD, the report point of 0.12 USD, the margin of 0.01 USD, and
    10 rows for 9 ids. Each row names its id, its kind, its `pastLimit` flag, and the PM words.
  - `COVER_RUN` holds the cap of 0.10 USD, the report point of 0.08 USD, the margin of 0.01 USD, 6 tries,
    and the folder `out/storytime/covers/teacher-front/muse`.
  - Both start times are `2026-11-10T08:57:00Z`. That is the UTC minute of the commit `d5f938b2`.
  - `classifyOutDir` gives the kind `cover` for exactly that folder. Every other folder below
    `out/storytime/covers/` stays `invalid`.
  - The 2 new test files hold 22 tests. They pass.
- [x] Task 2 (82144c4b): The 9 spec edits, the cover spec, and the aspect check (D2, D5, D6). Edit only the named
  prompt field of each of the 9 specs. Write the cover spec and the cover prompt of D5 and D6. Copy the 4
  brief files into `out/storytime/covers/teacher-front/refs/` and check each SHA-256 against the brief
  MANIFEST. Check, with no paid call, that the model accepts `3:4` and that the crop is centered; record
  the ratio and the reason. Add `tests/storytime-cover-specs.test.ts`. Record each new sentence in this
  task's evidence. Commit with explicit paths.
  - The new sentence of the hat-pip `colorPrompt`:
    "Count the people: exactly seven children (Sam, May, Ben, Mia, Pat, Lily, and Nan), Teacher Kim, and
    Pip. Nan, in her orange T-shirt with the white star, is in full view. The seven children stand in one
    line, side by side, each in full view, from left to right: Sam, May, Ben, Mia, Pat, Lily, and Nan; Pip
    sits in the big open dress-up box in front of the line, and Teacher Kim stands once behind the line.
    Each child shows exactly once, with his or her own hair and own clothes from the pictures. Exactly the
    characters named here are in the picture, and no other person or animal."
  - The new sentence of the tom-can-see-the-mop `linePrompt`:
    "Dad has no glasses. His eyes are two simple dots. Keep the very thick lines."
  - The new sentence of the rice `linePrompt`:
    "The rice is many small separate closed ovals (grains) heaped in the bowl, with no big blobs."
  - The new sentence of the `linePrompt` of the hippo, ruler, clap, throw, cold, and windy cards:
    "Draw the object or the child large, filling most of the square, with few details. Every line is about
    one fiftieth of the picture width (2 percent) thick, never thinner. This line width replaces any other
    line width in this prompt."
  - The 4 brief files are copied into `out/storytime/covers/teacher-front/refs/`. Each copy holds the
    SHA-256 and the byte size of the brief MANIFEST: `style-student-front-final.jpg` 00498aea, 1258522
    bytes; `cast-teacher-kim.png` 9b61d82e, 177248 bytes; `cast-nan.png` d6db81aa, 62018 bytes;
    `cast-sam.png` 48a204da, 76232 bytes. The awk check of the brief MANIFEST gives 9 of 9 OK.
  - The aspect check of D5, with no paid call: the muse script sends the value of the spec as
    `aspect_ratio` with no change and no check. The OpenRouter image documentation of 2026-11-10 lists
    `3:4` among the accepted values of `aspect_ratio`. The ratio `3:4` is 0.75, and the target ratio
    2480 / 3508 is 0.7069, so the crop trims the sides at `left = floor((width - target width) / 2)`. The
    fallback ratio, if the model refuses `3:4`, is `4:5` at 0.8. That ratio is at least 0.7069 too.
  - The cover spec holds the id, the 7 references, the prompt, `crop`, `3:4`, the print size of
    2480 x 3508 px, and the cover folder. It has no `linePrompt`. The 10 tests of
    `tests/storytime-cover-specs.test.ts` pass.
- [x] Task 3 (ded5d5ff): The writer option and the cover judge-copy helper (D4, D9). Add the option `approvalsOnly`
  to `deliverMuseUnit2` with `tests/storytime-u2-retry-delivery.test.ts`. Write
  `scripts/storytime-cover-judge-copy.mjs` (and its `.d.mts`) with
  `tests/storytime-cover-judge-copy.test.ts`, and the cover judge brief
  `docs/storytime/covers/teacher-front/judge-brief.md`. Run the GREEN command and the typecheck. Commit
  with explicit paths.
  - The option `approvalsOnly` is false by default. When it is true, only the rows of the approval list
    are delivered, the reuse rows stay out, a row without an entry gets no job, and `onSkip` stays quiet.
    The pin check, the check of each entry against the list, and the file checks stay.
  - The helper writes the clean copy at 1448 x 2048 px and the copy with the zone lines at 20, 29, 30,
    78, 88, and 94 percent of the height. The rows are 410, 594, 614, 1597, 1802, and 1925.
  - The judge brief lists the 12 checks of the cover judge and the form of its result.
  - The 4 tests of `tests/storytime-u2-retry-delivery.test.ts` and the 5 tests of
    `tests/storytime-cover-judge-copy.test.ts` pass.
- [x] Phase 1 gate (6ec8ef66): phase acceptance by the checker passed at 6ec8ef66. The checker probes the
  exception and the cover class with fixture cost files, greps FR-12 and FR-14, and runs the GREEN
  command and the typecheck.
  - The result file is `measure/runs/asset_storytime_l2_retries_cover_20261110/acceptance-p1-6ec8ef6.json`.
    Its status is `pass`. The GREEN command gives 19 test files and 273 tests with 0 failures. The
    checker holds 0 blocking findings and 0 nonblocking findings. The checker model is
    `volcengine-agent-plan/glm-latest#high`. This model is a substitution: ra-quota gave the
    metered deepseek route.

## Phase 2: Retries and cover (paid)

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`). The orchestrator
runs the frozen judge. The stops are 0.15 USD for item (a) and 0.10 USD for item (b).

- [b] Task 4: Retry pool, print gate, and judge batches (D1, D2, D3, D11). Write the worst case. Run
  hat-pip color try 4 (once). If the orchestrator's judge passes it, run the hat-pip line call (line
  try 2). Run line try 4 once for each of the 8 other rows, from its m1 color. Run the print gate before
  the judge on each new line print and its despeckled print. The orchestrator runs the judge batches and
  the second judge. Log each paid call in `spend-log.tsv`. deferred:maker
  - Step A (this step, paid 0.06 USD). The 9 calls of the pool ran. The D11 worst case was 9 calls
    x 0.01 USD = 0.09 USD, under the 0.15 USD cap of item (a), so the pool ran. The guard refused no
    call. The calls and their cost: l2-w10-story-page-put-on-your-hat-pip color try 4, 0.00 USD;
    l2-w09-story-page-tom-can-see-the-mop line try 4, 0.00 USD; l2-w09-card-rice line try 4,
    0.00 USD; l2-w12-card-hippo line try 4, 0.01 USD; l2-w12-card-ruler line try 4, 0.01 USD;
    l2-w13-card-clap line try 4, 0.01 USD; l2-w13-card-throw line try 4, 0.01 USD;
    l2-w14-card-cold line try 4, 0.01 USD; l2-w14-card-windy line try 4, 0.01 USD. The item (a)
    spend is 0.06 USD of the 0.15 USD stop. No call was above 0.03 USD.
  - Step A, the 3 calls that failed at the transport level: the hat-pip color try 4, the
    tom-can-see-the-mop line try 4, and the rice line try 4. Each cost 0 USD and wrote no picture.
    Each is recorded and none was repeated, by the once rule of D1 and default 2. These 3 rows have
    no new picture, no print, and no judge entry.
  - Step A, the print gate (D3) on each new line print and on its despeckled print, with the writer
    check code `inspectLineArtPng` at the class size: l2-w13-card-throw passes at 13 px and
    l2-w14-card-windy passes at 19 px. l2-w12-card-hippo fails at 9 px, l2-w12-card-ruler fails at
    8 px and 7 px after despeckling, l2-w13-card-clap fails at 10 px, and l2-w14-card-cold fails at
    10 px. The record is `measure/runs/asset_storytime_l2_retries_cover_20261110/line-gate-p2a.txt`.
  - Step A, the judge batch `u2rc-a-line-t4` (6 entries) is built, not judged. Its file is
    `docs/storytime/l2-unit2/judge/prod/u2rc-a-line-t4.json`. No color batch exists, because the
    hat-pip color try 4 call failed. The spend log is
    `measure/runs/asset_storytime_l2_retries_cover_20261110/spend-log.tsv`.
  - Judge of step A (2026-11-10). The orchestrator's frozen judge passed 6 of 6 lines in the batch
    `u2rc-a-line-t4`. The result file is `judge-u2rc-a-line-t4.json`. The rows throw and windy pass
    on all four checks: color m1, line try 4, judge pass, and print gate pass. The rows hippo, ruler,
    clap, and cold fail the print gate. They are fail rows now (PM 2026-11-10). Their best earlier try
    goes to `not-delivered/`. The hat-pip line call did not run, because color try 4 has no picture.
    PM 2026-11-10: one more try for the 3 rows with a network timeout. That work comes in a later
    step.
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
  - Round 1 (2026-11-10). The worst case was 3 calls x 0.03 USD = 0.09 USD, under the 0.10 USD stop of
    item (b). The guard refused no call. The 3 color calls of the cover spec ran one after another.
    Each call had a network check before it, and each check gave 200. The calls: color try 1 (m1) at
    2026-11-10T11:21:42Z, 0.01 USD, native 1280 x 1920 px; color try 2 (m2) at 2026-11-10T11:22:36Z,
    0.01 USD, native 1280 x 1920 px; color try 3 (m3) at 2026-11-10T11:23:36Z, 0.01 USD, native
    1280 x 1920 px. The item (b) spend is 0.03 USD of the 0.10 USD stop. No call was above 0.03 USD.
    The spend log is `measure/runs/asset_storytime_l2_retries_cover_20261110/spend-log.tsv`.
  - Round 1, the evidence: the commit b01148bcda7a7bd5d4bebc414a4abb6e8b1177e4 holds this plan, the
    spend log, the maker log of step B, and the judge file of step A.
  - Round 1, the print check: each print file `<id>-m<n>-color-print.png` holds 2480 x 3508 px, RGB,
    with no alpha. The native ratio 0.6667 is under the target 0.7069, so the crop does not trim the
    sides. The resize trims 2.85 percent of the height at the top and 2.85 percent at the bottom.
  - Round 1, the judge copies of D9, built, not judged. The 6 files sit in
    `out/storytime-review/judge/cover/`: `l2-u1-cover-quest-teacher-front-m1-clean.png` and
    `l2-u1-cover-quest-teacher-front-m1-zones.png`; `l2-u1-cover-quest-teacher-front-m2-clean.png`
    and `l2-u1-cover-quest-teacher-front-m2-zones.png`; `l2-u1-cover-quest-teacher-front-m3-clean.png`
    and `l2-u1-cover-quest-teacher-front-m3-zones.png`.
  - Judge of round 1 (2026-11-10). The first judge and the second judge fail all 3 tries of round 1,
    so the fails stand. The result files are `judge-cover-r1.json` and `judge-cover-second.json`. The
    faults: hands on the knees below the 78 percent line, in the free band and in the bottom band, in
    all 3 tries; a single red circle alone on a book page (no-flag), in the 3 tries of the second judge
    and in m3 of the first judge; and the book flat to the viewer (AF-4), in m1 and m3 of the first
    judge. Each hand is above the 88 percent line, and nothing sits above the 20 percent line. The
    rank of the first judge puts m2 first, and the rank of the second judge puts m1 first.
  - Round 2 (2026-11-10). The 2 prompt edits of D8 are in the spec file, and the python check passes.
    The test CS6 pinned the old scene text, so the step stopped and reported. The orchestrator chose
    option A: update CS6 to pin the new scene text. The test update and the spec are in the commit
    55f7613babf63fe6add8421f2301448c6baadd6b, with the message `feat(storytime_l2_retries_cover):
    cover prompt fixes for round 2`. The test run after the update passes 10 of 10.
    - The edits. E1 replaces `Nan and Sam sit on the grass in front of her.` with `Nan and Sam kneel
      upright on the grass close in front of her and lean toward the book. Each child holds both hands
      up at chest height: one hand on the lower edge of the open book and one hand pointing at it.
      Every hand stays at chest height, above the knees.` E2 replaces `The pages show simple pictures,
      for example a tree and a ball.` with `The book turns toward Nan and Sam, so the viewer sees the
      back of its plain warm brown cover and the edges of its cream pages, and no page picture.`
    - The python check passes: each old sentence is gone, each new sentence is there once, the other
      keys of the spec are unchanged, and the prompt equals the prompt of the old HEAD with the same 2
      replacements.
    - The test update changes only the constant SCENE of CS6. No other test, no assertion, and no
      other line changed. The new constant pins the new scene text, and that text is in the prompt.
    - The worst case of round 2 was 3 calls x 0.01 USD = 0.03 USD, the highest cover cost seen. With
      the spend of round 1 of 0.03 USD, the sum of 0.06 USD is under the 0.10 USD stop of item (b).
    - The 3 color calls ran one after another. Each call had a network check before it, and each check
      gave 200. The calls: color try 4 (m4) at 2026-11-10T11:44:02Z, 0.01 USD, native 1280 x 1920 px;
      color try 5 (m5) at 2026-11-10T11:45:08Z, 0.01 USD, native 1280 x 1920 px; color try 6 (m6) at
      2026-11-10T11:46:45Z, 0.01 USD, native 1280 x 1920 px. The guard refused no call. The item (b)
      spend is 0.06 USD of the 0.10 USD stop, over 6 calls. No call was above 0.03 USD.
    - The print check: each print file `<id>-m<n>-color-print.png` of m4, m5, and m6 holds
      2480 x 3508 px, RGB, with no alpha. The native ratio 0.6667 is under the target 0.7069, so the
      crop trims the top and the bottom, not the sides.
    - The judge copies of D9, built, not judged. The 6 files sit in `out/storytime-review/judge/cover/`:
      `l2-u1-cover-quest-teacher-front-m4-clean.png` and `l2-u1-cover-quest-teacher-front-m4-zones.png`;
      `l2-u1-cover-quest-teacher-front-m5-clean.png` and `l2-u1-cover-quest-teacher-front-m5-zones.png`;
      `l2-u1-cover-quest-teacher-front-m6-clean.png` and `l2-u1-cover-quest-teacher-front-m6-zones.png`.
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
- Phase 1 commits, after the base `4c950a1d`:
  - `d5f938b2` (message `feat(storytime_l2_retries_cover): U2_EXTRA_TRY exception, 0.15 USD for 9 rows`):
    the guard exception, the cover class, and their 2 test files. The start time of both classes is
    `2026-11-10T08:57:00Z`, the UTC minute of that commit.
  - `82144c4b` (message `feat(storytime_l2_retries_cover): the 9 retry prompt edits and the cover spec`):
    the 9 spec edits, the cover spec, and `tests/storytime-cover-specs.test.ts`.
  - `ded5d5ff` (message `feat(storytime_l2_retries_cover): the approvalsOnly option and the cover judge
    copies`): the writer option, the judge copy helper, the judge brief, and their 2 test files.
  - `c386dbea` (message `fix(storytime_l2_retries_cover): the cover guard test fixtures and the judge copy
    test types`): the test fixes found by the GREEN command and the typecheck.
- The GREEN command of the specification passes at `c386dbea`: 19 test files, 273 tests, 0 failures.
- The typecheck gives 38 errors. They all sit in `assets/**` and in 2 old test files. The paths
  `src/storytime/`, `scripts/storytime-`, and `tests/storytime-` give 0 errors.
