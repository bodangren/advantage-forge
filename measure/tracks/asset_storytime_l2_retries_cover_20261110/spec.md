# Specification: Storytime Level 2 unit 2 picture retries and the teacher cover front art

## Overview

The PM woke the Forge session on 2026-11-10 with two paid items. Item (a) gives 9 unit 2 book rows
one extra try each. Item (b) makes one color picture: the front art of the Storytime Level 2 unit 1
Teacher Book cover. Both items use Muse, the frozen Sonnet judge, a delivery folder or a hand-off
folder with a MANIFEST, and a spend log.

The track follows the archived track `asset_storytime_l2_unit2_pictures_20261108`. That track
delivered 220 of 229 book rows and left 9 rows out. This track tries the 9 rows once more and then
leaves each row that fails again to Workbooks. This track is a feature on the PM light lane of
2026-11-03.

## Owner order

PM message, 2026-11-10, word for word:

> PM → Forge, WAKE (Claude is GO again, weekly reset 15:00). You have 1 slot now (cap 4). Do these two items as ONE light-lane track, in this order: (a) Unit 2 retries: 1 try for hat-pip and 1 try for each of the 8 rows from your list (about 0.12 USD total). PM decision: the spend guard gets a written exception for exactly these 9 rows, 1 extra try each, cap 0.15 USD for (a). Record the exception in the track spec. A row that fails again goes to Workbooks as a fail row (no more tries). Output: a new delivery folder, with a MANIFEST (SHA-256) and the spend log. (b) Teacher cover front art from `~/Desktop/handoff/storytime-cover-teacher-front-brief/` (MANIFEST checked 9/9 OK). Stop at 0.10 USD. Done by 2026-11-13. New input from today: the cover top now holds the Storytime Advantage logo on an amber tile (Daniel's notes of 12:24 and 14:50), so keep the top 20 % of the art calm (sky or leaves, no faces or key objects). The bottom 12 % holds the level plaque. Deliver the front art to `~/Desktop/handoff/` with a MANIFEST, for Workbooks. Log each paid call in the spend log. Delete your own scratch at the end. No other paid work. Reply: one status line when you start, then the hand-off with paths, SHA-256, and spend.

PM answer, 2026-11-09, about the open rows of the archived track, word for word:

> Hat-pip page: yes, one more try (about 0.02 USD). The other 8 open rows: option (a), one more try each (about 0.10 USD). A row that fails again goes to Workbooks by option (d), with its best try in not-delivered/.

The PM message of 2026-11-10 is the source of the exception in D1. The PM answer of 2026-11-09 is the
source of the 9 rows and of the fail rule in D3.

## Risk record: the OpenRouter key and the stops

The archived track spent 4.50 USD (book 4.32, app 0.18). This track adds at most 0.15 USD for item (a)
and 0.10 USD for item (b), so 0.25 USD in total. The maker makes no balance call. A call above
0.03 USD stops the run (D11).

## Context (read only)

- Facts from the costs.tsv files (orchestrator, 2026-11-10 15:21 ICT):
  - `l2-w10-story-page-put-on-your-hat-pip` has 3 color tries and 1 line try. Color try 1 was the
    HTTP 400 at 0 USD. Color try 3 (m2) passed the second judge but holds 9 children for 7 named.
    The line try failed with 9 children.
  - Each of `l2-w09-story-page-tom-can-see-the-mop`, `l2-w09-card-rice`, `l2-w12-card-hippo`,
    `l2-w12-card-ruler`, `l2-w13-card-clap`, `l2-w13-card-throw`, `l2-w14-card-cold`, and
    `l2-w14-card-windy` has 3 line tries. 6 cards pass the judge but have lines of 8 to 11 px against
    the 12 px print gate. For tom-can-see-the-mop, try 2 passes the judge at 11 px, and try 3 is 19 px
    but Dad wears glasses. For rice, try 2 passes the judge at 10 px, and try 3 is 15 px but reads as
    beans.
  - `U2_RUN` (cap 18.33 USD, `maxTries` 3) has 4.32 USD spent.
- The guard `scripts/storytime-muse-guards.mjs` (and its `.d.mts`) holds `U2_RUN`, `U2_FW_RUN`,
  `CARD_RUN`, `CARD_LINE_RETRY`, `TRY_EXCEPTIONS`, `classifyOutDir`, `cliGuardOptions`,
  `scanU2CostFiles`, `tryGuard`, `spendGuard`, and `runGuards`. The test-only cap keys are `u2CapUsd`
  and `u2FwCapUsd`.
- The muse tool `scripts/storytime-muse.mjs` reads a spec with the fields `id`, `colorPrompt`,
  `references`, `print` (`crop` or `pad`), `aspect`, `printSize`, and `outDir`. It resolves a
  reference path against the repository root. It sends `aspect` to the model as `aspect_ratio`. Its
  `reframe` function in `crop` mode cuts the sides only when the model picture is wider than the
  target ratio. A model picture at or below the target ratio is not cut.
- The writer `deliverMuseUnit2` in `src/storytime/muse-delivery-u2.ts` pins the list SHA-256
  `63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec`. It refuses a line print
  below the 12 px line width and a print that fails the 90 percent white edge frame. Its check code is
  `inspectLineArtPng` in `src/storytime/muse-delivery.ts`.
- The judge batch tool `scripts/storytime-judge-batch.mjs` has the options `--unit2`, `--ids`,
  `--kind`, `--try`, and `--out`.
- The frozen judge kit is `docs/storytime/l2-unit1/judge/` (`judge-prompt.md` v6, `cast.json`,
  `calibration-set.json`). Do not change it.
- The brief folder `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-brief/` holds
  `README.md`, `refs/`, `avoid/`, `layout/zones.png`, and `MANIFEST.txt`. Its MANIFEST has three
  columns (SHA-256, size, path), so plain `sha256sum -c MANIFEST.txt` cannot read it. The author
  checked it with `awk '{print $1"  "$3}' MANIFEST.txt | sha256sum -c` on 2026-11-10: 9 of 9 OK. The
  SHA-256 of the brief `README.md` is
  `0fee24e21239cbdefcdfa461955503081e38c8660e5009620b8252b2bf4f2dbc`.
- The Forge cast pictures are `out/storytime-review/judge/cast/teacher-kim.png`, `nan.png`, and
  `sam.png`. The Muse model is `meta/muse-image`.
- The precedent hand-off folder `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures/` shows the
  form of `MANIFEST.txt`, `README.md`, and `not-delivered/`.

## Decisions

The PM and the owner order set D1 to D22. The author set the defaults that the section "Open
questions answered by default" lists. The PM can change each default.

- **D1 Retry exception (item a).** The guard gets a written exception for exactly 9 rows. The source
  is the PM message of 2026-11-10 and the PM answer of 2026-11-09 (both quoted above).
  - Add the constant `U2_EXTRA_TRY` to `scripts/storytime-muse-guards.mjs` and to the `.d.mts`.
    - `startTime`: the real UTC time of the Phase 1 guard commit, cut to the minute. The maker writes it.
    - `capUsd` 0.15, `reportAtUsd` 0.12, `marginUsd` 0.01.
    - `rows`: one entry for each id and kind, each with the fields `id`, `kind`, `pastLimit`, and
      `source` (the PM words):
      - `l2-w10-story-page-put-on-your-hat-pip`, kind `color`, `pastLimit` true (color try 4, once);
      - `l2-w10-story-page-put-on-your-hat-pip`, kind `line`, `pastLimit` false (line try 2, inside
        the normal limit, once);
      - kind `line`, `pastLimit` true (line try 4, once), for each of `l2-w09-story-page-tom-can-see-the-mop`,
        `l2-w09-card-rice`, `l2-w12-card-hippo`, `l2-w12-card-ruler`, `l2-w13-card-clap`,
        `l2-w13-card-throw`, `l2-w14-card-cold`, and `l2-w14-card-windy`.
  - The guard allows a try past `U2_RUN.maxTries` only for a listed id and kind with `pastLimit` true,
    only once, and only while the exception spend plus the next call stays at or under 0.15 USD.
  - The exception spend is the sum of the `usage_cost` rows of the 9 listed ids (all kinds) at or after
    `U2_EXTRA_TRY.startTime`, read from the unit 2 week cost files. The next call adds one margin
    (0.01 USD) for each planned provider call.
  - The "once" count is the number of rows of the id and kind at or after `U2_EXTRA_TRY.startTime`,
    including a failed call at 0 USD. A listed id and kind has at most one such row. Any call of a
    listed id after the start time, also a call inside the normal limit, must pass the exception cap.
  - A call of an id that is not listed keeps the normal rule: the guard refuses a try past 3.
  - The book cap 18.33 USD still applies to every call. `U2_RUN`, `CARD_RUN`, `CARD_LINE_RETRY`, and
    `U2_FW_RUN` keep their values. `TRY_EXCEPTIONS` keeps its entries.
  - At 0.12 USD of exception spend the guard prints the notice once, like the other report points.
  - The test-only cap key is `u2ExtraCapUsd`. `cliGuardOptions` removes it, with the other test-only
    cap keys. An empty or invalid value of the key refuses a call of a listed id.
  - Hat-pip then gets 1 line call from its new color only if that color passes the judge. That call is
    line try 2, inside the normal limit, and it counts against the 0.15 USD cap.
  - Commit message: `feat(storytime_l2_retries_cover): U2_EXTRA_TRY exception, 0.15 USD for 9 rows`.
- **D2 Retry prompts.** The maker edits only the named prompt field of each spec in
  `docs/storytime/l2-unit2/w<nn>/muse/<id>.json`. No other field changes.
  - `l2-w10-story-page-put-on-your-hat-pip`, field `colorPrompt`: replace the text from
    `Count the people:` up to and including the next `no other person or animal.` with this text:
    `Count the people: exactly seven children (Sam, May, Ben, Mia, Pat, Lily, and Nan), Teacher Kim, and Pip. Nan, in her orange T-shirt with the white star, is in full view. The seven children stand in one line, side by side, each in full view, from left to right: Sam, May, Ben, Mia, Pat, Lily, and Nan; Pip sits in the big open dress-up box in front of the line, and Teacher Kim stands once behind the line. Each child shows exactly once, with his or her own hair and own clothes from the pictures. Exactly the characters named here are in the picture, and no other person or animal.`
    This is the form of the round 8 "Here!" sentence, which passed.
  - `l2-w09-story-page-tom-can-see-the-mop`, field `linePrompt`: add at the end:
    `Dad has no glasses. His eyes are two simple dots. Keep the very thick lines.`
  - `l2-w09-card-rice`, field `linePrompt`: add at the end:
    `The rice is many small separate closed ovals (grains) heaped in the bowl, with no big blobs.`
  - `l2-w12-card-hippo`, `l2-w12-card-ruler`, `l2-w13-card-clap`, `l2-w13-card-throw`,
    `l2-w14-card-cold`, and `l2-w14-card-windy`, field `linePrompt`: add at the end:
    `Draw the object or the child large, filling most of the square, with few details. Every line is about one fiftieth of the picture width (2 percent) thick, never thinner. This line width replaces any other line width in this prompt.`
  - The maker records each new sentence in the plan (Task 2 evidence).
- **D3 Retry checks.** The order for each new try is: print gate, then the first judge, then the
  second judge if the first judge fails.
  - The delivery print gate (12 px line width and the 90 percent white edge frame, with the writer's own
    check code `inspectLineArtPng`) runs on each new line print and on its despeckled print BEFORE the
    judge. The form of the record is `measure/runs/asset_storytime_l2_unit2_pictures_20261108/line-gate-r6.txt`
    (lessons-learned 2026-11-09).
  - Then the frozen judge runs: model `claude-code/claude-sonnet-5-5#high`, `judge-prompt.md` v6,
    `cast.json` unchanged. The batches use `scripts/storytime-judge-batch.mjs --unit2` at the try
    number. The orchestrator, not the maker, runs the judge.
  - A second judge (each file alone) runs before a fail stands. A second-judge pass clears a fail.
  - A row passes only when its color and its line pass the judge and its line print passes the gate.
  - A row that fails again is a fail row: no more tries, no more spend. It goes to Workbooks by option
    (d), with its best try in `not-delivered/`.
- **D4 Retry delivery.**
  - Add the option `approvalsOnly` (default false) to `MuseUnit2DeliveryOptions` in
    `src/storytime/muse-delivery-u2.ts`. When it is true, `deliverMuseUnit2` delivers only the rows of
    the approval list: no reuse row, no job for a row without an entry, and no call of `onSkip`. The list
    pin, the check of each entry against the list, and every file check stay. When the option is false or
    absent, the behavior has no change. The maker adds tests (FR-7).
  - Output folder `out/storytime/l2/unit2/delivery-muse-v1-retry1/` (a new folder): the passing retry
    rows (color print and line print, PNG, class size) and `manifest.json`. The approval list is
    `measure/runs/asset_storytime_l2_retries_cover_20261110/approvals-retry1.json`. The runner is
    `deliver-retry1.mts` in the same folder, built on `deliver-u2.mts` of the archived run.
  - Hand-off folder `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1/`:
    - hard links of the delivered PNG files;
    - a copy of `manifest.json`;
    - one contact sheet `contact-sheet.png` (sharp, no Chrome);
    - `not-delivered/`: hard links of the best try of each fail row over all its tries, and a
      `README.md` with each reason;
    - a copy of the spend log;
    - `MANIFEST.txt`: the SHA-256 and the byte size of every other file (the form is in the default
      list). `sha256sum -c MANIFEST.txt` gives 0 FAILED.
  - The v1 delivery `out/storytime/l2/unit2/delivery-muse-v1/` and the v1 hand-off stay unchanged.
- **D5 Cover picture (item b).** One color picture.
  - File `l2-u1-cover-quest-teacher-front-forge-v1.png`: 2480 x 3508 px, RGB, no alpha, PNG.
  - Spec `docs/storytime/covers/teacher-front/l2-u1-cover-quest-teacher-front.json`. The `id` is
    `l2-u1-cover-quest-teacher-front`. The `outDir` is `out/storytime/covers/teacher-front/muse`.
    Color only: the spec has no `linePrompt`. `print` is `crop`. `printSize` is `[2480, 3508]`. `aspect`
    is `3:4`, so the crop trims the sides only.
  - Phase 1 check for the aspect, with no paid call: the maker checks that the model accepts `3:4` from
    the script, the OpenRouter docs, or earlier calls, and that the crop is centered (the `reframe`
    function cuts `left = floor((width - target width) / 2)`). The target ratio is 2480 / 3508 = 0.7069.
    A model ratio must be at least 0.7069, or the crop does not trim the sides. If `3:4` is not accepted,
    the maker uses the nearest accepted portrait ratio that is at least 0.7069, and records the ratio and
    the reason in the plan.
  - References: at most 10, each file exists, never a file of `avoid/`. The maker copies the 4 brief
    files into `out/storytime/covers/teacher-front/refs/` (the brief folder stays unchanged) and checks
    each copy against the brief MANIFEST SHA-256. The reference list, in this order:
    1. `out/storytime/covers/teacher-front/refs/style-student-front-final.jpg`;
    2. `out/storytime/covers/teacher-front/refs/cast-teacher-kim.png`;
    3. `out/storytime/covers/teacher-front/refs/cast-nan.png`;
    4. `out/storytime/covers/teacher-front/refs/cast-sam.png`;
    5. `out/storytime-review/judge/cast/teacher-kim.png`;
    6. `out/storytime-review/judge/cast/nan.png`;
    7. `out/storytime-review/judge/cast/sam.png`.
  - The `colorPrompt` holds these parts, in this order:
    1. A picture guide: picture 1 is the style reference, and the picture does not copy its scene;
       pictures 2 to 4 are the cast pictures of the brief (use the notes of brief section 7: in picture 2
       copy only the woman, Teacher Kim; in picture 3 copy only the girl, Nan, and not the puppy; in
       picture 4 copy only the 3D figure of Sam and not the small flat drawing); pictures 5 to 7 are the
       approved 3D cast pictures of Teacher Kim, Nan, and Sam.
    2. The style of brief section 5, word for word (the sentences from "The style is bright painted anime
       fantasy key art." up to "Not 3D. Not a render. Not clay.").
    3. The scene of brief section 6, word for word.
    4. The three cast notes of brief section 7, word for word (the text in the three code spans).
    5. The count: exactly three people (Teacher Kim, Nan, and Sam), no Pip, no other animal, and no other
       person.
    6. AF-1 to AF-4 as positive statements: Sam's red T-shirt shows exactly two white stripes across the
       chest and nothing else; Nan's orange T-shirt shows one white star and no letters; Nan wears the
       orange T-shirt with the white star and Sam wears the red T-shirt with the two white stripes, and
       each child keeps his or her own clothes; Teacher Kim shows the open book to the children, looks at
       them, and smiles, and the open pages face Nan and Sam and not the viewer.
    7. The layout of D6.
    8. The never-list of brief section 10: no letters, no words, no numbers, no signatures, no
       watermarks, no logos, no borders, no frames, no rulers, and no flag-like shape (a single circle,
       star, cross, or stripe pattern alone on a plain field); the star on Nan's T-shirt and the stripes
       on Sam's T-shirt are cast marks and stay.
- **D6 Cover layout.** The default meets the brief and Daniel's new notes. The PM can change it.
  - The top 30 percent of the height is sky and leaves only: calm, with no face, no hand, no book, and no
    key object.
  - The faces, the hands, and the open book stay between 30 percent and 78 percent of the height.
  - The bottom 22 percent holds only grass, flowers, and feet.
  - The brief puts the frame at 0 to 29 percent and the plaque at 78 to 94 percent. Daniel's notes put
    the logo tile in the top 20 percent and the plaque in the bottom 12 percent. The default covers
    both: the top 30 percent is calm, and the bottom 22 percent has no face, hand, or book.
  - D16 (PM 2026-11-10) sets the layout of the teacher front cover and withdraws the 78 percent line
    for that cover.
- **D7 Cover guard.** A cover class in the guard for exactly the folder
  `out/storytime/covers/teacher-front/muse`.
  - Add the constant `COVER_RUN` with `startTime` (the real UTC time of the Phase 1 guard commit, cut to
    the minute), `capUsd` 0.10, `reportAtUsd` 0.08, `marginUsd` 0.01, `maxTries` 6, and
    `outDir` `out/storytime/covers/teacher-front/muse`.
  - `classifyOutDir` gives the new kind `cover` for exactly that folder. Any other folder below
    `out/storytime/covers/` stays `invalid`.
  - A cover call reads only `costs.tsv` of that folder at or after `COVER_RUN.startTime`. The book, app,
    and exception caps do not count cover spend, and the cover cap does not count their spend.
  - A call that mixes `cover` with any other kind is refused. A `line` call of the cover class is refused,
    because the cover is color only.
  - The test-only cap key is `coverCapUsd`. `cliGuardOptions` removes it. An empty or invalid value is
    refused.
  - The try limit is 6 color tries for the id.
  - Add the tests (FR-3). Commit message: `feat(storytime_l2_retries_cover): cover guard class, 0.10 USD`.
    The maker may put D1 and D7 in one commit with one start time.
- **D8 Cover rounds.**
  - Round 1: 3 color calls of the spec, one after another (concurrency 1), versions m1 to m3. The
    orchestrator runs the frozen judge on all 3. If one or more pass, the track delivers the pass with the
    fewest notes (the orchestrator names it).
  - If none pass, round 2: at most 3 calls, after prompt fixes for the judge faults. The maker edits only
    `colorPrompt` and records each change.
  - Stop at 6 calls or at the 0.10 USD stop. If no try passes, item (b) is blocked: the report names the
    best try, and Workbooks uses its fallback picture.
  - Worst case of round 1: no cover cost is known yet, so the maker uses 0.03 USD for each call (0.09
    USD for 3 calls). For round 2 the maker uses the highest cover cost seen, at least 0.01 USD.
- **D9 Cover judge.** The frozen Sonnet judge, run by the orchestrator.
  - The maker makes two judge copies with sharp under `out/storytime-review/judge/cover/` for each
    version, from `<id>-m<n>-color-print.png`: a clean copy at 1448 x 2048 px
    (`<id>-m<n>-clean.png`), and a copy with the zone lines drawn at 20, 29, 30, 78, 88, and 94 percent of
    the height (`<id>-m<n>-zones.png`). The helper is `scripts/storytime-cover-judge-copy.mjs`.
  - The maker writes the cover judge brief `docs/storytime/covers/teacher-front/judge-brief.md`. It lists
    the checks and the result form. The judge kit has no change.
  - The judge checks section 11 of the brief (AF-1 to AF-4 fixed, no text, the cast correct, exactly three
    people, faces, hands, and the open book in the 30 to 78 percent band, no flag-like shape), the calm top
    30 percent, and the style of the student front.
  - The second-judge rule of D3 applies. The result files are
    `measure/runs/asset_storytime_l2_retries_cover_20261110/judge-cover-r<round>.json` and
    `judge-cover-second.json`.
  - The judge result is model evidence, not acceptance. Workbooks looks at the native size.
- **D10 Cover hand-off.** Folder `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/`:
  - the PNG `l2-u1-cover-quest-teacher-front-forge-v1.png`;
  - the zone-line copy `l2-u1-cover-quest-teacher-front-forge-v1-zones.png` (for review only);
  - `README.md`: the brief MANIFEST SHA-256 (the README SHA-256 above and the awk check result), the D6
    default, the judge result marked "model evidence, not acceptance", the native size of the model
    picture, and the spend lines of item (b);
  - `MANIFEST.txt`: the SHA-256 and the byte size of every other file. `sha256sum -c MANIFEST.txt`
    gives 0 FAILED.
- **D11 Spend log.** `measure/runs/asset_storytime_l2_retries_cover_20261110/spend-log.tsv`.
  - One line for each paid call, with the columns `time` (UTC), `tool`, `prompt id` (the spec id and
    the kind, for example `l2-w09-card-rice line`), `attempt` (the try number), `cost USD` (the
    `usage_cost` of the costs.tsv row), and `result file`.
  - Then one total line for each item, in the form
    `total<TAB>item a<TAB>calls <n><TAB>stop 0.15 USD<TAB>spend <usd>` (item b: `item b`, stop
    0.10 USD).
  - Before each pool the maker writes the worst case in the maker log: the planned calls times the
    highest call cost seen, at least 0.01 USD. If the worst case passes the stop of the item, the maker
    runs nothing and writes `blocked: a rerun would pass the <item> stop`.
  - A call above 0.03 USD stops the run. Nobody edits `costs.tsv`. No OpenRouter call runs outside
    `scripts/storytime-muse.mjs`.
- **D12 Slots and roles.** The orchestrator runs `slot check` before each role. One role runs at a time.
  The Storytime app roles go first. Muse calls, judge copies, and the delivery writer are light and run
  with `node`. Tests and `tsc` run only through
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  Exit code 75 means hold: run again.
- **D13 Scratch.** Every role writes scratch only under `/tmp/opencode/l2rc/`. The last maker task lists,
  then deletes, `/tmp/opencode/l2rc/` and any staging folder this track made under `out/`. It keeps the
  `costs.tsv` files, the Muse files, the judge copies, the delivery and hand-off folders, and the files
  in `measure/runs/asset_storytime_l2_retries_cover_20261110/`.
- **D14 Report.** `measure/runs/asset_storytime_l2_retries_cover_20261110/pm-report.md`. The first line
  is `Status: done.` (or `Status: blocked.`). It then gives:
  - the spend for each item, with the calls and the stop;
  - the rows done for item (a);
  - each fail row with its best try;
  - the cover file with its SHA-256;
  - the folders with their MANIFEST OK counts;
  - a `Facts changed:` list.
- **D15 Second exception (PM 2026-11-10).** The PM order of 2026-11-10, word for word:

  > DECISION on your question: YES, one more try for the 3 timed-out rows only. They failed on a network fault at 0 USD, so no real try happened. Write the new guard exception (3 rows, 1 try each), inside the same 0.15 USD cap (spent 0.06). Use the same network check before each call that you plan for step B.

  - The guard gets a second exception for 3 rows. Each row of step A that failed on a network fault
    at 0 USD gets one more try.
  - Add the field `netRetry` with the value `true` to 3 rows of `U2_EXTRA_TRY`, these id and kind
    pairs:
    - `l2-w10-story-page-put-on-your-hat-pip`, kind `color`;
    - `l2-w09-story-page-tom-can-see-the-mop`, kind `line`;
    - `l2-w09-card-rice`, kind `line`.
  - Add the PM words of 2026-11-10 to the `source` of each of the 3 rows. No other row gets the
    field `netRetry`, and no other field of any row changes.
  - A row with `netRetry` true allows exactly one more try past the once rule of D1. That gives 2
    exception tries in total for that id and kind.
  - The second try is allowed only when the first exception try of that id and kind cost 0 USD. The
    first exception try is the first cost row of that id and kind since `U2_EXTRA_TRY.startTime`.
    A third try of that id and kind is refused.
  - The spend of these tries counts with the other exception spend against the same 0.15 USD cap,
    because the start time is the same. The cap, the report point, and the margin keep their values.
  - The hat-pip line row (`pastLimit` false) keeps its rule of D1: one line call after a passing
    color, inside the normal line limit, and inside the cap.
  - The maker makes no Muse call in the step that writes this exception.
- **D16 Cover layout (PM 2026-11-10).** The PM decision of 2026-11-10, about 22:20 ICT, word for word:

  > COVER LAYOUT (PM decision): option 1. The 20/12 layout is the rule for the teacher front; D6's 78 % line is withdrawn for this cover. Deliver m6 to ~/Desktop/handoff/storytime-cover-teacher-front-forge/ with a MANIFEST, marked "model evidence, not acceptance" (Daniel's look gate covers the final cover).

  - The 20/12 layout is the rule for the teacher front cover. The top 20 percent holds the logo tile
    and calm sky, and the bottom 12 percent holds the plaque.
  - The 78 percent line of D6 is withdrawn for this cover. The judge files of round 2 keep the zone
    lines of the judge brief, so the free band and the bottom band checks of the first judge fail m6
    at the green line.
  - The deliverable is try m6, the sixth cover try of the cover spec.
  - The hand-off folder is `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/`.
  - The zone-line copy of the hand-off is named
    `l2-u1-cover-quest-teacher-front-forge-v1-zones-review-only.png`, because the file is for review
    only.
- **D17 PM order of Phase 3 (PM 2026-11-10).** The PM sent 2 messages on 2026-11-10, after the
  acceptance of Phase 2. The first message, word for word:

  > PM order (Workbooks → PM → Forge, after your Phase 2 acceptance, same light track, 1 role): (1) MANIFEST/version repair, 0 USD, NO render: Workbooks PICTURE_CHECK_U2 selects version 2 or 3 for 9 main rows, but the delivered files are named -v1: l2-w10-check-row-ten, l2-w11-story-page-here, l2-w11-story-page-ten-men-in-the-den, l2-w11-story-page-the-den-is-on-dad, l2-w12-story-page-open-your-book-nan, l2-w13-cover-look-at-me, l2-w13-check-row-dot, l2-w13-d4-prompt-jump, l2-w15-cover-look-a-bus. A probe with those 9 version fields set to 1 gives 224 of 229. Fix the manifest version fields (or the names, whichever matches the delivered pixels) in a NEW hand-off folder with a MANIFEST; the v1 folders stay unchanged. (2) hat-pip: 1 line-only retry from its passing color m3, inside the open retry stop (0.05 USD left of 0.15 USD); 1 call; no other paid call. Report the folder path, the MANIFEST sha256, the spend line, and the hat-pip result. Facts changed list at the end.

  The second message, word for word:

  > PM addition to the repair order (same new hand-off folder, 0 USD, no render): also package the 4 card fail rows as delivery jobs from their best try: hippo, ruler, clap, cold = color m1 + the widest judge-passing line print, each with the line width recorded as an exception in manifest.json (Workbooks prints only the color file of a card row, card-kit.ts:584). So the folder holds: the 9 version-field repairs, the 4 card delivery jobs, and the hat-pip line retry (1 call, in the 0.05 USD left). One MANIFEST for the folder.

  - Phase 3 has 4 steps. The version repair, the card jobs, and the hand-off cost 0 USD. The hat-pip
    line call is the only paid call of Phase 3, and it uses the 0.05 USD left of the 0.15 USD stop of
    item (a).
  - No step of Phase 3 makes a render.
- **D18 The version defect.** The v1 manifest (`out/storytime/l2/unit2/delivery-muse-v1/manifest.json`)
  gives each of the 9 rows of D17 a candidate with `version` 2 or 3. That value is the Muse version of
  the row in the approval list `approvals-u2.json`. The file of the candidate is `<id>-v1.png`, the
  name in the picture list.
  - The cause is the line `version = entry?.version ?? listVersion(row.fileName)` in
    `src/storytime/muse-delivery-u2.ts` (line 379).
  - The delivered name and the delivered pixels are the v1 picture of the list. The repair sets the
    version field of these 9 candidates to 1 and keeps the names.
  - The Muse version stays in the approval list and in the README of the hand-off.
- **D19 Writer options (Task 10).** `MuseUnit2DeliveryOptions` in `src/storytime/muse-delivery-u2.ts`
  gets 2 options. With both absent, the behavior has no change.
  - `versionFromList` (default false). When it is true, the manifest version of a candidate is
    `listVersion(row.fileName)`. The same version goes to the candidate and to the review mapping.
    - Orchestrator default (2026-11-11): the review mapping takes the list version too. Reason:
      `verifyManifest` refuses a review whose version differs from the candidate version
      (book-pictures.ts:2176). The Muse version stays in the approval list and in the README of Task 12.
  - `lineWidthExceptions` (default none). The value is a map from a row id to
    `{ measuredPx, requiredPx: 12, reason }`. For a listed row, the writer accepts only the line-width
    error of the line print gate. Every other line error and every color error still refuses the row.
    The manifest candidate of that row records
    `lineWidthException: { measuredPx, requiredPx, reason }`.
    - Orchestrator default (2026-11-11): the record holds `waivedError` too, the exact removed error
      text. Reason: the record of the exception stays in manifest.json. The waiver needs three facts.
      The width error must be in `line.errors`. The measured value of the error must equal
      `measuredPx`. The `requiredPx` must be 12 and must equal the required width of the error. The
      writer removes that one error and sets `line.valid`. A failed condition stops the delivery and
      writes nothing. A listed row id that the delivery does not deliver also stops it.
  - The maker adds the tests of FR-17.
- **D20 Hat-pip line (Task 11).** The hat-pip line row of `U2_EXTRA_TRY` gets `allowedTries: 2` and
  the PM words of D17 in its `source`. The row then allows 2 exception line tries since
  `U2_EXTRA_TRY.startTime`. A third exception line try is refused.
  - The spend counts against the same 0.15 USD cap. The spend of item (a) is 0.10 USD, so 0.05 USD
    is left.
  - `U2_RUN.maxTries` 3 still applies. The hat-pip line has 2 line tries, so the new call is line
    try 3.
  - The `linePrompt` of `docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-hat-pip.json`
    gets at the end: `Teacher Kim keeps her hair exactly as in the color picture: smooth,
    medium-length, dark-brown hair in a low ponytail. Her hair is never curly.`
  - The call is `node scripts/storytime-muse.mjs line <spec> --from 3 --tries 1`. The network check of
    step B runs before it: `curl -sS -m 20 -o /dev/null -w '%{http_code}\n'
    https://openrouter.ai/api/v1/models` must give 200. A failed check uses no try.
  - Then the print gate of D3 runs, and the orchestrator runs the frozen judge and the second judge.
- **D21 The repair delivery (Task 12).** The approval list
  `measure/runs/asset_storytime_l2_retries_cover_20261110/approvals-repair1.json` holds:
  - the 9 entries of `approvals-u2.json`, unchanged;
  - the 4 card entries, each with color m1 and the line print of the best try of the `not-delivered/`
    folder of the retry1 delivery: hippo line try 4 at 9 px, ruler line try 4 at 8 px, clap line try
    3 at 11 px, and cold line try 4 at 10 px;
  - the hat-pip entry, only if its new line passes.
  - The runner `deliver-repair1.mts` runs `deliverMuseUnit2` with `approvalsOnly`, `versionFromList`,
    and `lineWidthExceptions` for the 4 cards. The output folder is
    `out/storytime/l2/unit2/delivery-muse-v1-repair1/`.
  - The delivered PNG file of each of the 9 rows has the same SHA-256 as its file in
    `out/storytime/l2/unit2/delivery-muse-v1/`.
  - The hand-off folder `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-repair1/` holds:
    - hard links of the delivered PNG files;
    - a copy of `manifest.json`;
    - a `README.md` with the 9 repairs and their old and new version, the 4 card exceptions, the
      hat-pip result, and the text "model evidence, not acceptance";
    - a copy of `spend-log.tsv`;
    - a `MANIFEST.txt` in the form of the retry1 hand-off.
  - The v1 delivery folder and the v1 hand-off folder stay unchanged. The retry1 delivery folder and
    the retry1 hand-off folder stay unchanged.

- **D22 Cover README title (PM 2026-11-11).** The PM receipt of 2026-11-11, word for word:

  > PM receipt: teacher front cover folder storytime-cover-teacher-front-forge received, MANIFEST 50069dce22d8… 3/3 OK, passed to Workbooks as HAND-OFF TC1. One fix at your closeout, 0 USD: the README title says "Storytime Level 2 unit 2", but the files and the spec are l2-u1 (unit 1). Correct the title, rebuild MANIFEST.txt, and report the new MANIFEST sha256. Do not change the PNG files.

  - In `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/`, line 1 of `README.md`
    becomes `# Teacher front cover art, Storytime Level 2 unit 1`.
  - The title comment line of `MANIFEST.txt` becomes
    `# Teacher front cover art, Storytime Level 2 unit 1 (model evidence, not acceptance)`.
  - No other README line changes.
  - `MANIFEST.txt` keeps its form. Only the README hash line and the README bytes line change.
  - The 2 PNG files keep their bytes, their SHA-256, and their inode.
  - The generator `measure/runs/asset_storytime_l2_retries_cover_20261110/make-cover-handoff.mjs` gets
    the same 2 title changes, at its lines 86 and 168. The generator is not run again.
  - The old SHA-256 of `MANIFEST.txt` is
    `50069dce22d85fc75bf833ac06538fdd3a17f295541ee8cefb72534ee106e128`.
  - The log and the PM report addendum record the old and the new SHA-256.
  - The cost is 0 USD.

## Functional Requirements

- **FR-1 Exception values and scope.** `U2_EXTRA_TRY` holds the values of D1: `capUsd` 0.15,
  `reportAtUsd` 0.12, `marginUsd` 0.01, and 10 entries for 9 ids (hat-pip color and line, and 8 line
  entries). The source text of each entry names the PM words. No other cap value is new in the guard file
  except D7.
- **FR-2 Exception limits.** Tests with fixture cost files in temp folders show:
  - a try 4 for an id that is not listed is refused;
  - a second extra try of a listed id and kind is refused;
  - the wrong kind is refused (for example a color try 4 of rice, or a line try 4 of hat-pip);
  - an exception spend above 0.15 USD (spend plus the next call) is refused;
  - rows before `U2_EXTRA_TRY.startTime` do not count against the exception cap or the once rule;
  - the book cap 18.33 USD still refuses a listed call;
  - the hat-pip line call after the new color is allowed once and counts against 0.15 USD.
- **FR-3 Cover class.** Tests show:
  - `classifyOutDir` gives `cover` for exactly one folder, and `invalid` for a sibling or child folder;
  - a cover call above 0.10 USD (spend plus the margin) is refused;
  - a cover `line` call is refused, and a mixed call is refused;
  - the 7th color try of the id is refused;
  - the book, app, and exception spend does not count against the cover cap, and the reverse.
- **FR-4 Existing values and the CLI strip.** `U2_RUN`, `U2_FW_RUN`, `CARD_RUN`, and
  `CARD_LINE_RETRY` keep their values. The old tests pass without change. `cliGuardOptions` removes
  `u2ExtraCapUsd` and `coverCapUsd`, with the old keys. A test shows that an empty or invalid test-only
  cap is refused for both new classes.
- **FR-5 Specs.** The 9 retry specs have only the D2 edits. The cover spec meets D5: the 7 references
  exist, none is in `avoid/`, the cast notes are word for word, the prompt names exactly three people and
  no Pip, and the layout of D6 is in the prompt. The aspect check is recorded.
- **FR-6 Retry rule and checks.** Each retry row follows D3. The records show the gate result before the
  judge for each new line print. A row with a second-judge pass is cleared. A row that fails again has no
  further call.
- **FR-7 Writer option.** `approvalsOnly` meets D4. Tests show: with the option, only the approval rows
  are delivered and no reuse row is delivered; without the option, the output equals the old output; an
  entry for a row that is not in the list throws; a list pin mismatch throws.
- **FR-8 Retry delivery and hand-off.** The delivery folder and the hand-off folder meet D4. The file
  checks show 0 problems. `sha256sum -c MANIFEST.txt` gives 0 FAILED. The `manifest.json` of the v1
  delivery and the `MANIFEST.txt` of the v1 hand-off have the same SHA-256 before and after the track.
- **FR-9 Cover picture.** The delivered PNG meets D5: 2480 x 3508 px, RGB, no alpha, PNG. The cover
  spend stays at or under 0.10 USD and the calls stay at or under 6.
- **FR-10 Cover judge and hand-off.** The judge copies, the judge files, and the hand-off folder meet D9
  and D10. The README marks the judge result as model evidence, not acceptance.
- **FR-11 Spend and report.** The spend log meets D11, and its sums equal the `costs.tsv` rows since the
  start times (item a: the 9 ids since `U2_EXTRA_TRY.startTime`; item b: the cover folder since
  `COVER_RUN.startTime`). `pm-report.md` meets D14.
- **FR-12 Claims.** No file of the track says that Daniel, the PM, or Workbooks accepted a picture. The
  text may quote the PM messages above, because they opened the spend only.
- **FR-13 Git.** No PNG or JPG enters git. Each task commits explicit paths only.
- **FR-14 Frozen files.** The judge kit, every unit 1 path, `assets/**`, the Workbooks repository, the
  brief folder, the v1 book delivery, and the v1 hand-off have no change. `src/storytime/muse-delivery.ts`
  has no behavior change.
- **FR-15 Scratch.** The scratch of D13 is gone at the end of Task 8. The kept files of D13 remain.
- **FR-16 The second exception.** Tests with fixture cost files in temp folders show:
  - each of the 3 `netRetry` rows: after one exception try at 0 USD, one more try is allowed;
  - each of the 3 `netRetry` rows: after one exception try at 0 USD and one more try, a third try is
    refused;
  - a `netRetry` row whose first exception try cost more than 0 USD: a second try is refused;
  - a row without `netRetry`, for example `l2-w12-card-hippo` line, after its exception try: a
    second try is refused;
  - the wrong kind, for example a line try 5 of hat-pip past the normal limit: refused;
  - an exception spend of 0.15 USD with the next call over the cap: refused;
  - the values of `U2_EXTRA_TRY` other than the 3 `netRetry` fields and their source text are the
    same as at commit `22ec70dc`.
- **FR-17 The writer options and the hat-pip guard.** Tests show:
  - `versionFromList` absent: the manifest version of a candidate is the Muse version of the approval
    entry. `versionFromList` true: the manifest version of a candidate is `listVersion(row.fileName)`,
    and the review mapping uses the list version too.
  - `lineWidthExceptions` absent: a row with a line print under 12 px is refused. With an exception
    for that row: the row is delivered, and the manifest candidate records `lineWidthException` with
    the measured width, the required width, the reason, and the removed error text.
  - a row without an exception still refuses its line print. A color error of a row with an exception
    still refuses the row.
  - the hat-pip line row allows a second exception line try, and a third is refused.
  - a row without `allowedTries` still refuses its second exception try.
  - the `netRetry` rule has no change. The 0.15 USD cap still refuses a call over the cap.
  - the other rows and the other values of `U2_EXTRA_TRY` are the same as at commit `10af0915`.
- **FR-18 The pixel check and the old folders.** The delivered PNG file of each of the 9 repaired rows
  has the same SHA-256 as its file in `out/storytime/l2/unit2/delivery-muse-v1/`. The v1 delivery
  folder and the v1 hand-off folder have no change in Phase 3. The retry1 delivery folder and the
  retry1 hand-off folder have no change in Phase 3.

- **FR-19 The cover README title.** The title of the README and the title of the MANIFEST say unit
  1. `sha256sum --quiet -c MANIFEST.txt` gives no FAILED line. The SHA-256 values of the 2 PNG
  files are `c91719903d3803bc02498f8e097528c9a64ddae263102ebf28d06d8d37f11a53` and
  `41e290053869085734f926b165ca252944260443f030db837a1837e22994c678`.

## Non-Functional Requirements

- All prose follows ASD-STE100.
- The maker marks a task `[~]` before the task changes a file outside `measure/`.
- The maker never writes a cap value other than D1 and D7. The maker never changes the judge kit or any
  unit 1 path.
- Other agents share the git index. The maker commits explicit paths only.
- No song, speech, or video command runs. No image tool and no API key outside the Muse tool.
- No PNG or JPG enters git. Test fixtures are generated in temp folders.

## Test commands

GREEN test command (the 14 files of the archived track, plus the new test files of this track):

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-u2-guards.test.ts tests/storytime-u2-judge-batch.test.ts tests/storytime-u2-delivery.test.ts tests/storytime-u2-specs.test.ts tests/storytime-card-guards.test.ts tests/storytime-card-line-retry.test.ts tests/storytime-muse-attempts.test.ts tests/storytime-judge-batch.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-muse-delivery-adversarial.test.ts tests/storytime-card-adversarial.test.ts tests/storytime-family-word-judge.test.ts tests/storytime-family-word-delivery.test.ts tests/storytime-u2-family-words.test.ts tests/storytime-u2-extra-try.test.ts tests/storytime-cover-guards.test.ts tests/storytime-u2-retry-delivery.test.ts tests/storytime-cover-judge-copy.test.ts tests/storytime-cover-specs.test.ts --maxWorkers=1'
```

The 5 new test files are:

- `tests/storytime-u2-extra-try.test.ts` (D1, FR-1, FR-2);
- `tests/storytime-cover-guards.test.ts` (D7, FR-3, FR-4);
- `tests/storytime-u2-retry-delivery.test.ts` (D4, FR-7);
- `tests/storytime-cover-judge-copy.test.ts` (D9);
- `tests/storytime-cover-specs.test.ts` (D2, D5, FR-5).

When `src/` changes, the maker also runs `./node_modules/.bin/tsc --noEmit -p .` through `heavy-run.sh`.
The old repository count of type errors may stay. `src/storytime/`, `scripts/storytime-`, and
`tests/storytime-` must give 0 new errors.

## Owned paths

- `scripts/storytime-muse-guards.mjs` (and its `.d.mts`)
- `scripts/storytime-muse.mjs` (routing only, if the cover class needs it)
- `scripts/storytime-cover-judge-copy.mjs` (and its `.d.mts`)
- `src/storytime/muse-delivery-u2.ts`
- `docs/storytime/l2-unit2/w09`, `w10`, `w12`, `w13`, and `w14` (the 9 spec files named in D2, one field each)
- `docs/storytime/covers/teacher-front/**`
- `tests/storytime-u2-extra-try.test.ts`, `tests/storytime-cover-guards.test.ts`,
  `tests/storytime-u2-retry-delivery.test.ts`, `tests/storytime-cover-judge-copy.test.ts`, and
  `tests/storytime-cover-specs.test.ts`
- `out/storytime/l2/unit2/**`, `out/storytime/covers/**`, and `out/storytime-review/judge/cover/**` (not in git)
- `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1/`
- `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/`
- `measure/tracks/asset_storytime_l2_retries_cover_20261110/`
- `measure/runs/asset_storytime_l2_retries_cover_20261110/`
- `measure/tracks.md` (the registry entry and the closeout)

Not owned: the judge kit, every unit 1 path, `src/storytime/muse-delivery.ts` (read only), `assets/**`,
the Workbooks repository, the brief folder, the v1 book delivery, and the v1 hand-off.

## Acceptance Criteria

1. The GREEN test command passes at the audited HEAD of each phase, and the typecheck gives 0 new errors
   in the storytime paths.
2. The checker probes the exception and the cover class with fixture cost files (FR-2, FR-3).
3. The `costs.tsv` totals since the start times match the spend log, and each item stays under its stop
   (FR-11).
4. The delivery and the two hand-off folders give 0 FAILED in `sha256sum -c MANIFEST.txt`. The v1
   hashes did not change (FR-8).
5. The cover PNG meets D5 (FR-9), and the judge files exist (FR-10).
6. `pm-report.md` meets D14.
7. The checker greps FR-12 and FR-14, and finds no violation.
8. The scratch is gone and the kept files remain (FR-15).

## Human gate

The PM opened the spend with the messages above. The PM will check the report. Daniel has no gate inside
this track. A stop or a blocked rerun goes to the PM and not to Daniel. The track records no acceptance of
a picture by Daniel, the PM, or Workbooks.

## Out of Scope

- Any paid work other than the 9 retry calls (at most 10 with the hat-pip line call) and the cover calls.
- A third try of a fail row, and any row other than the 9 rows.
- Speech, songs, and video.
- A change to the judge kit, to unit 1 behavior, to the Workbooks repository, or to the brief folder.
- The frame, the text, the logo tile, and the plaque of the cover (Workbooks draws them on top).

## Open questions answered by default

1. **Guard start time.** The real UTC time of the Phase 1 guard commit, cut to the minute. `U2_EXTRA_TRY`
   and `COVER_RUN` share it (D1, D7).
2. **Extra try for a failed call.** A failed call at 0 USD (for example an HTTP 400) counts as the one
   extra try of the id and kind, like the book rule of the archived track (D1).
3. **Hat-pip line call.** The guard allows one line call after the start time, even though it is inside
   the normal limit. This keeps the PM answer "one more try" strict (D1).
4. **Cover layout.** The top 30 percent calm and the bottom 22 percent with no face, hand, or book. The
   PM can change it (D6).
5. **Cover references.** The maker copies the 4 brief files into `out/` and checks their SHA-256, so the
   brief folder stays read only (D5).
6. **Cover judge brief.** The maker writes the cover checks in a new file and leaves the judge kit
   unchanged (D9).
7. **Best try of a fail row.** The best color is the latest color that passed the judge, or the latest
   color if none passed. The best line is the print that passed the judge with the widest line, or the
   widest line print if none passed. Ties go to the later try (D4).
8. **File names in the retry delivery.** The writer's names stay unchanged. The row ids in
   `manifest.json` name the rows, and the folder differs from the v1 delivery (D4).
9. **MANIFEST form.** One hash line `<SHA-256>  <file>` for each file, which `sha256sum -c` checks, and
   one comment line `# <bytes> <file>` for each file, which gives the byte size (D4, D10).
10. **Native size.** The README states the native size of the model picture. A print file larger than the
    model picture is an upscale (D10).
11. **Brief MANIFEST check.** The awk form of the Context section replaces the plain `sha256sum -c`, which
    cannot read the three-column file.
