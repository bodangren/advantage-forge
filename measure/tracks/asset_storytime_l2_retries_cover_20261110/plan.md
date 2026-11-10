# Storytime Level 2 unit 2 picture retries and the teacher cover front art

Status: new (2026-11-10). Phase 0 authors the track. Phase 1 writes the guard exception, the cover
class, the specs, and the writer option (0 USD). Phase 2 runs the paid retries and the cover.
Phase 3 repairs the manifest version of 9 rows, packages 4 card rows, and runs the hat-pip line call.

The track gives 9 unit 2 book rows one extra try each (item a, cap 0.15 USD) and makes one color
picture for the Teacher Book front (item b, stop 0.10 USD). The [specification](./spec.md) owns the
scope, the decisions D1 to D22, and the acceptance gates.

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

## Phase 2: Retries and cover (paid) [checkpoint: 10af0915]

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`). The orchestrator
runs the frozen judge. The stops are 0.15 USD for item (a) and 0.10 USD for item (b).

- [x] Task 4 (51077171): Retry pool, print gate, and judge batches (D1, D2, D3, D11). Write the worst case. Run
  hat-pip color try 4 (once). If the orchestrator's judge passes it, run the hat-pip line call (line
  try 2). Run line try 4 once for each of the 8 other rows, from its m1 color. Run the print gate before
  the judge on each new line print and its despeckled print. The orchestrator runs the judge batches and
  the second judge. Log each paid call in `spend-log.tsv`.
  - The pool of item (a) is done. The spend is 0.10 USD of the 0.15 USD stop, over 13 calls. 4 rows pass
    the judge and the print gate, and they go to the retry delivery. 5 rows are fail rows, and each one
    keeps its best try in the `not-delivered/` folder of the retry hand-off.
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
  - Step D1 (this step, 0 USD). The second exception of D15 is in the guard, and its 7 tests are in
    `tests/storytime-u2-extra-try.test.ts`. The commit is
    8a4819c62468aa9df2bf0928021b3bf5ef37e5da, with the message
    `feat(storytime_l2_retries_cover): the network retry exception for 3 rows`. The field `netRetry`
    is true on 3 rows of `U2_EXTRA_TRY`: the color row of hat-pip, the line row of
    tom-can-see-the-mop, and the line row of rice. The guard allows their second try when their
    first exception try cost 0 USD, and it refuses a third try. The other 7 rows keep their rule of
    one try. The GREEN command of the specification passes: 19 test files, 280 tests, 0 failures.
    The typecheck gives 38 errors, and the paths `src/storytime/`, `scripts/storytime-`, and
    `tests/storytime-` give 0 errors. This step made no Muse call and spent 0 USD. The 3 calls of
    the pool wait for the next step.
  - Step D2 (this step, paid 0.03 USD). The 3 network retry calls of the PM order of 2026-11-10 ran,
    one after another, and each one cost 0.01 USD. The D11 worst case was 3 calls x 0.01 USD =
    0.03 USD, the highest item (a) call cost seen. With the item (a) spend of 0.06 USD, the sum of
    0.09 USD is under the 0.15 USD stop, so the pool ran. The guard refused no call. The calls: the
    hat-pip color try 5 at 2026-11-10T12:17:28Z, 0.01 USD, the file
    `l2-w10-story-page-put-on-your-hat-pip-m3-color.png`; the tom-can-see-the-mop line try 5 at
    2026-11-10T12:18:17Z, 0.01 USD, the file
    `l2-w09-story-page-tom-can-see-the-mop-m1-line-4.png`; the rice line try 5 at
    2026-11-10T12:19:04Z, 0.01 USD, the file `l2-w09-card-rice-m1-line-4.png`. The item (a) spend
    is 0.09 USD of the 0.15 USD stop, over 12 calls. No call was above 0.03 USD. The hat-pip line
    call did not run, because the line call comes only after the judge passes the new color.
  - Step D2, the network checks. The check of the PM order ran before each paid call:
    `curl -sS -m 20 -o /dev/null -w '%{http_code}\n' https://openrouter.ai/api/v1/models`. The first
    check failed with a DNS timeout and gave the code 000, and the retry after 60 s gave 200. The 3
    checks before the 3 calls gave 200, 200, and 200. A failed check uses no try.
  - Step D2, the print gate (D3). The gate calls the writer check code `inspectLineArtPng` at the
    class size of each row. The tom-can-see-the-mop line try 5 passes at 16 px, and its despeckled
    print passes at 16 px. The rice line try 5 passes at 13 px, and its despeckled print passes at
    13 px. Both line rows pass the gate. The record is
    `measure/runs/asset_storytime_l2_retries_cover_20261110/line-gate-p2d.txt`.
  - Step D2, the judge batches (built, not judged).
    `docs/storytime/l2-unit2/judge/prod/u2rc-d-color-t5.json` holds 1 entry, the color try 5
    picture of hat-pip. `docs/storytime/l2-unit2/judge/prod/u2rc-d-line-t5.json` holds 2 entries,
    the line try 5 pictures of tom-can-see-the-mop and of rice. The orchestrator runs the frozen
    judge on both batches.
  - Judge of step D2 (2026-11-10). The orchestrator's frozen judge passed all 3 files. The color
    batch `u2rc-d-color-t5` holds 1 file and 1 pass: the hat-pip color try 5 shows 7 children,
    Teacher Kim, and Pip, each once. The line batch `u2rc-d-line-t5` holds 2 files and 2 passes:
    the line try 5 of tom-can-see-the-mop and the line try 5 of rice. The result files are
    `judge-u2rc-d-color-t5.json` and `judge-u2rc-d-line-t5.json`. The hat-pip line call of D1 runs
    now, because the judge passes the new color.
  - Step E (this step, paid 0.01 USD). The hat-pip line call of D1 ran on the passing color m3. The
    D11 worst case was 1 call x 0.01 USD = 0.01 USD, the highest item (a) call cost seen. With the
    item (a) spend of 0.09 USD, the sum of 0.10 USD is under the 0.15 USD stop, so the pool ran. The
    guard refused no call. The call: the hat-pip line try 2 at 2026-11-10T12:29:37Z, 0.01 USD, the
    file `l2-w10-story-page-put-on-your-hat-pip-m3-line.png`. The item (a) spend is 0.10 USD of the
    0.15 USD stop, over 13 calls. No call was above 0.03 USD.
  - Step E, the network check. The check of the PM order ran before the paid call:
    `curl -sS -m 20 -o /dev/null -w '%{http_code}\n' https://openrouter.ai/api/v1/models`. It gave
    200. A failed check uses no try.
  - Step E, the print gate (D3). The gate calls the writer check code `inspectLineArtPng` at the
    class size of the row, which is class story: 4000 x 3000 px. The hat-pip line try 2 passes at
    13 px, and its despeckled print passes at 12 px. The line row passes the gate. The record is
    `measure/runs/asset_storytime_l2_retries_cover_20261110/line-gate-p2e.txt`.
  - Step E, the judge batch (built, not judged).
    `docs/storytime/l2-unit2/judge/prod/u2rc-e-line-t2.json` holds 1 entry, the line try 2 picture
    of hat-pip. The orchestrator runs the frozen judge on it.
  - Judge of step E (2026-11-10). The first judge (`judge-u2rc-e-line-t2.json`) and the second judge
    (`judge-u2rc-e-line-t2-second.json`) fail the hat-pip line try 2 with the class wrong-character.
    Teacher Kim has big curly hair. The cast gives smooth hair in a low ponytail. The count of 7
    children, Teacher Kim, and Pip is correct. Hat-pip is a fail row now, with no more tries
    (PM 2026-11-10).
- [x] Task 5 (026a3e8c): Retry delivery and hand-off (D4). Write `approvals-retry1.json` for the passing rows. Run
  `deliverMuseUnit2` with `approvalsOnly` into `out/storytime/l2/unit2/delivery-muse-v1-retry1/`. Build
  `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1/` with the hard links,
  `manifest.json`, `contact-sheet.png`, `not-delivered/` with its `README.md`, the spend log copy, and
  `MANIFEST.txt`. Run `sha256sum -c MANIFEST.txt` (0 FAILED). Check that the v1 files have the same
  SHA-256 as before.
  - The approval list `approvals-retry1.json` holds 4 entries and the picture list pin
    `63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec`. The 4 rows are
    `l2-w13-card-throw`, `l2-w14-card-windy`, `l2-w09-story-page-tom-can-see-the-mop` and
    `l2-w09-card-rice`. Each row names the color print of m1 and its passing line print.
  - The m1 color of each of the 4 rows passed the judge in the archived track. The archived
    approvals-u2.json holds no entry for these 4 rows, because they were among the 9 skipped rows.
    The archived judge files name m1 as the passing color of each row:
    `judge-u2-w13-r1-color.json` for the throw row, `judge-u2-w14-r1-color.json` for the windy row,
    `judge-u2-w09-r1-color.json` for the rice row, and `judge-u2-w09-r1-color-mop-t2.json` for the
    tom-can-see-the-mop row. The 2 color rows of the tom-can-see-the-mop row are a network error at
    0 USD and the m1 call, so the m1 file is the color try 2 of that row.
  - The line judge of each row is in the judge files of this track. The line try 4 of the throw row
    and of the windy row pass in `judge-u2rc-a-line-t4.json`. The line try 5 of the
    tom-can-see-the-mop row and of the rice row pass in `judge-u2rc-d-line-t5.json`. The print gate
    files `line-gate-p2a.txt` and `line-gate-p2d.txt` give 13 px, 19 px, 16 px and 13 px.
  - The runner `deliver-retry1.mts` is built on `deliver-u2.mts`. It links the 8 approved prints,
    calls `deliverMuseUnit2` with `approvalsOnly`, and checks every delivered file. The delivery
    folder `out/storytime/l2/unit2/delivery-muse-v1-retry1/` holds 9 files: 8 PNG files and
    `manifest.json`. The manifest holds 4 jobs. The file checks give 0 problems, and the skip
    callback stayed quiet. The runner made no paid call and no network call.
  - The hand-off folder `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1/` holds
    23 files: 8 hard links of the delivered PNG files, `manifest.json`, `contact-sheet.png`,
    `spend-log.tsv`, `MANIFEST.txt`, the `README.md` of `not-delivered/`, and 10 hard links in
    `not-delivered/`. The contact sheet is 644 x 1416 px and holds the 4 rows, the color print beside
    the line print and the row id under each pair. It was made with sharp and no browser.
  - The check `sha256sum -c MANIFEST.txt` in the hand-off folder gives 22 OK and 0 FAILED, and no
    warning. The MANIFEST.txt holds 22 hash lines and 22 size lines.
  - The 5 fail rows keep their best try in `not-delivered/`, and the README.md names each row, its
    tries, its best try and why, and the reason it failed:
    - `l2-w12-card-hippo`: the color m1 of color try 1, and the line print of line try 4 at 9 px.
      The prints of tries 2, 3 and 4 passed the judge and are all 9 px, so the later try wins the
      tie. Every line print of the row is under the 12 px print gate.
    - `l2-w12-card-ruler`: the color m1 of color try 1, and the line print of line try 4 at 8 px.
      The prints of tries 3 and 4 are both 8 px, so the later try wins the tie. Every line print of
      the row is under the 12 px print gate.
    - `l2-w13-card-clap`: the color m1 of color try 1, and the line print of line try 3 at 11 px,
      the widest of the judge-passing prints. Every line print of the row is under the 12 px print
      gate.
    - `l2-w14-card-cold`: the color m1 of color try 1, and the line print of line try 4 at 10 px,
      the widest of the judge-passing prints. Every line print of the row is under the 12 px print
      gate.
    - `l2-w10-story-page-put-on-your-hat-pip`: the color m3 of color try 5, the latest color that
      passed the judge, and the line print of line try 2, which is the m3 print at 13 px. No line
      print of the row passed the judge, so the widest line print is the best one. The line try 2
      fails the judge with the class wrong-character: Teacher Kim has big curly hair, and the cast
      gives smooth hair in a low ponytail.
  - The v1 hash check holds. The delivery folder `out/storytime/l2/unit2/delivery-muse-v1/` has 441
    files and the combined hash `69025314d447dc1d6ec3920215ab6b3b0794f125bb240917a17c9ba3e498f2fc`.
    The v1 hand-off folder has 469 files and the combined hash
    `edc67a8d01477b91c0f333acf194332c2101c4d0ca7fb734050772f74c93a1ed`. Both values are the same
    before and after this task, so the v1 delivery and the v1 hand-off have no change.
  - The README.md of `not-delivered/` says that the judge result is model evidence, not acceptance.
    A search of the hand-off folder and of the files of this task for a text that says that Daniel,
    the PM, or Workbooks accepted a picture gave no hit.
- [x] Task 6 (22ec70dc): Cover rounds and judge copies (D5, D8, D9, D11). Write the worst case. Run round 1: 3 color
  calls, one after another. Make the judge copies for each version. The orchestrator runs the frozen
  judge and the second judge. Run round 2 only if no version passes. Log each paid call. Stop at 6 calls
  or at 0.10 USD.
  - The 6 cover tries are done, in 2 rounds of 3 calls. Each call cost 0.01 USD. The item (b) spend is
    0.06 USD of the 0.10 USD stop. No call was above 0.03 USD. The 6 spend lines are the lines 18 to 20
    and 22 to 24 of `spend-log.tsv`.
  - The PM decision D16 (2026-11-10, about 22:20 ICT) sets the 20/12 layout for the teacher front and
    withdraws the 78 percent line of D6 for that cover. The deliverable is m6. The hand-off folder is
    `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/`.
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
  - Judge of round 2 (2026-11-10). The first judge (`judge-cover-r2.json`) and the second judge
    (`judge-cover-second-r2.json`) fail m4, m5, and m6, so all 6 cover tries fail against D6. Both
    judges rank m6 best, with the rank 6, 5, 4. Its only faults are the free band and the bottom
    band: a corner of the open book crosses the 78 percent line by about 60 px. The second judge
    passes m6 against the PM layout, with the top 20 percent calm and the bottom 12 percent free.
    All 6 cover tries are used, and the item (b) spend is 0.06 USD of the 0.10 USD stop. Task 7
    waits for a PM decision on the layout.
  - Step F (2026-11-10, 0 USD). The orchestrator found a defect. The test CVG9 of
    `tests/storytime-cover-guards.test.ts` wrote a fixture row into the real cover cost file
    `out/storytime/covers/teacher-front/muse/costs.tsv` and then deleted that file. The GREEN run of
    step D1 ran at about 19:02 ICT, and the folder time of that run is 19:02:10 ICT. The file with
    its 6 cover rows was gone, so the guard counted 0 cover spend and 0 tries and could not stop a
    7th cover call.
    - The restore. The file was restored on 2026-11-10 from `spend-log.tsv` and the 6 files
      `l2-u1-cover-quest-teacher-front-m1.json` to `m6.json`, because the test CVG9 deleted the
      original at 19:02:10 ICT. Each row was checked against its sidecar and its spend log row.
      The file holds the header of `TSV_HEAD` and 6 rows, one per try m1 to m6. Every row has the
      kind color, the cost 0.01, the note ok, and the size 1280x1920. The SHA-256 of the restored
      file is `2ef0e1b15cce56ca2376695e688c5962259850cbbd6f29c410e16fd1ba02159c`.
    - The dry guard check, with no call and no key. The run is cover, the refusal is true, the code
      is 3, the spend is 0.06, and the message is `refused: l2-u1-cover-quest-teacher-front color
      count 6 (max 6)`. The guard refuses a 7th cover call again.
    - The test fixes. The commit `3b22a6af5f11ef6bb5bf70f05d16c7b0aa7a984a` holds them. The test
      CVG9 now reads the real cost file and writes, changes, and deletes nothing under the real
      `out/` folder. The check of the scan path has two parts: the production path compares the
      rows of the real file with the rows of the scan, and the fixture path uses a unit root
      outside the repository. The tests U2G11 and U2G10 of `tests/storytime-u2-guards.test.ts` ran
      the CLI in the real repository and deleted the real unit 2 folder and the real family-word
      folder when the run had created them. They now run the CLI in a temp repository, so the
      guard root and every write of the CLI stay in the temp folder. The other 17 test files of the
      GREEN command hold no write, delete, or mkdir of a path under the repository root.
    - The hash check. The SHA-256 of the restored cover cost file and of each unit 2 cost file
      were recorded before the GREEN run and again after it. The 18 values are the same. No file
      and no folder under `out/` changed during the run. The GREEN command of the specification
      passes with 19 test files, 280 tests, 0 failures, and the exit status 0.
- [x] Task 7 (c92fba04d704f5d46db47dc3f086cfa45b82d4be): Cover hand-off (D10). Deliver the passing picture as
  `l2-u1-cover-quest-teacher-front-forge-v1.png` (2480 x 3508 px, RGB, no alpha). Build
  `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/` with the PNG, the zone-line copy,
  `README.md`, and `MANIFEST.txt`. Run `sha256sum -c MANIFEST.txt` (0 FAILED). If no try passes, skip
  this task and record the best try for the report.
  - The hand-off folder holds 4 files: the cover PNG, the zone copy for review only, the README, and the
    MANIFEST. The cover PNG is a hard link of the m6 print file, and its SHA-256 is
    `c91719903d3803bc02498f8e097528c9a64ddae263102ebf28d06d8d37f11a53`. The check
    `sha256sum -c MANIFEST.txt` gives 3 OK and 0 FAILED. The SHA-256 of MANIFEST.txt is
    `50069dce22d85fc75bf833ac06538fdd3a17f295541ee8cefb72534ee106e128`.
  - The README names the source try m6, the SHA-256 of the print file, the brief check of 9 of 9 OK, the
    PM decision D16 word for word, the judge result of m6 in both judges, the native size, the upscale,
    the cut, and the 6 spend lines of item (b). It says that the judge result is model evidence, not
    acceptance. No line of the folder says that Daniel, the PM, or Workbooks accepted the picture.
- [x] Task 8 (c92fba04d704f5d46db47dc3f086cfa45b82d4be): Report and scratch delete (D13, D14). Write `pm-report.md`. List, then delete,
  `/tmp/opencode/l2rc/` and any staging folder this track made under `out/`. Keep the files that D13
  names.
  - The report is `measure/runs/asset_storytime_l2_retries_cover_20261110/pm-report.md`. Its first line is
    `Status: done.` It holds the spend of both items, the 4 rows of item (a), the 5 fail rows, the cover
    file, both hand-off folders, the defect of CVG9 and its fix, the 3 network timeouts, and the
    `Facts changed:` list.
  - The scratch delete: the list came first, then the delete. `/tmp/opencode/l2rc/` (11 files),
    `/tmp/opencode/l2rc-sumtest/` (2 files), and `/tmp/judge-u2rc/` (1 file) are gone. The staging folders
    under `out/storytime/covers/` and `out/storytime/l2/unit2/` are none. The kept files of D13 are in
    place. The record is `scratch-delete-p2h.txt`.
- [x] Phase 2 gate (10af0915): phase acceptance by the checker passed at 10af0915.
  - The acceptance file is `measure/runs/asset_storytime_l2_retries_cover_20261110/acceptance-p2-10af091.json`.
    Its status is pass. The GREEN command passed 19 test files and 280 tests. The checker model was
    `kimi-code-plan-cn/kimi-for-coding#high`. It holds 2 nonblocking findings: the hardening of
    `tests/storytime-u2-guards.test.ts` is safe, and the v1 combined-hash form was not reproducible,
    but the counts and the mtimes match.

## Phase 3: Version repair, card jobs, and the hat-pip line (repair1)

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`). The orchestrator
runs the frozen judge. The stop is the open retry stop of item (a): 0.05 USD is left of 0.15 USD. The
hat-pip line call is the only paid call of this phase.

- [x] Task 9 (a86d4913ffeaaa7bfb6b2585d4f00dd4eb3a95f6): Phase 3 plan and the guard rule of D20. Write D17 to D22 and FR-17 to
  FR-19 in the specification. Add the field `allowedTries` to the hat-pip line row of
  `U2_EXTRA_TRY`, with the PM words of D17 in its source. Add the tests of the guard rule. Make no
  Muse call.
  - The GREEN command of the specification passes with 19 test files and 285 tests, and the exit
    status is 0. The 33 `costs.tsv` files under `out/storytime` have the same SHA-256 before and
    after the run. The guard change gives the hat-pip line row the field `allowedTries: 2`, so the
    row allows 2 exception line tries and refuses a third. The specification holds D17 to D22 and
    FR-17 to FR-19, with D22 added for the PM order of 2026-11-11. The maker made no Muse call.
- [x] Task 10 (sha pending): Writer options of D19 and their tests (FR-17). Add `versionFromList` and
  `lineWidthExceptions` to `MuseUnit2DeliveryOptions`. Add the tests of both options. Make no Muse
  call.
  - The writer gets the 2 options of D19. `versionFromList` takes the version of a candidate and
    the version of its review from the picture list. `lineWidthExceptions` waives the line width
    error of a listed row, and the candidate records the exception with the removed error text.
    The tests R5 to R12 sit in `tests/storytime-u2-retry-delivery.test.ts`. The GREEN command passes
    with 19 test files and 293 tests, and the exit status is 0. The typecheck gives 38 errors, all
    in `assets/**` and in old test files, and 0 errors in `src/storytime/` and in `tests/storytime-`.
    The maker made no Muse call. The limit of `verifyManifest` for the unit 2 writer stays: the
    writer writes flat list names, so the verifier keeps a layout failure for every candidate. The
    v1 delivery manifest has 440 such failures. The maker does not fix this limit, and the tests of
    R5 and R6 check the version that the verifier reads. The type error of
    `tests/storytime-cover-guards.test.ts` line 227 came from commit 3b22a6af of this track, so the
    maker added the non-null assertion on that line only.
- [b] Task 11: Hat-pip line call of D20. Edit the `linePrompt` of the hat-pip spec. Run the network
  check, then the line call `--from 3 --tries 1`, then the print gate, then build the judge batch.
  The orchestrator runs the frozen judge and the second judge. deferred:maker
- [b] Task 12: Repair delivery of D21. Write `approvals-repair1.json`, run `deliver-repair1.mts`, do
  the pixel check, build the hand-off folder with its MANIFEST, and write the report addendum.
  deferred:maker
- [x] Task 13 (b0386c75ffd69940625a7ff86be9937cb306bb72): Cover README title fix of D22 (FR-19).
  - The folder is `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/`. The cost is
    0 USD. Line 1 of the README becomes `# Teacher front cover art, Storytime Level 2 unit 1`, and
    the title line of `MANIFEST.txt` becomes
    `# Teacher front cover art, Storytime Level 2 unit 1 (model evidence, not acceptance)`. The
    generator `make-cover-handoff.mjs` gets the same 2 title changes and is not run again. The
    report names the new SHA-256 of `MANIFEST.txt`. The 2 PNG files do not change.
  - The new SHA-256 of `MANIFEST.txt` is `b63708b128e0b9593005986a18baf57b21b0a83b7715b63564c6be85ad4409a7`. The check
    `sha256sum --quiet -c MANIFEST.txt` in the folder gives no FAILED line and the exit status is 0. The
    2 PNG files keep their SHA-256 and their inode: `c91719903d3803bc02498f8e097528c9a64ddae263102ebf28d06d8d37f11a53` with inode 14332129 and
    `41e290053869085734f926b165ca252944260443f030db837a1837e22994c678` with inode 14332161.
- [b] Phase 3 gate: phase acceptance by the checker at an immutable HEAD. The checker compares the
  pixel hashes of the 9 repaired rows, the MANIFEST check of the hand-off folder, the v1 and retry1
  folders, and the spend line of the hat-pip call. deferred:checker

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
