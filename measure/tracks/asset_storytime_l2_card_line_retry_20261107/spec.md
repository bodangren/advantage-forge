# Specification: Storytime Level 2 card line-art retry (ham and family)

## Overview

Two print cards of the Level 2 card pictures have a color picture but no line art: the ham card
and the family card. Both color pictures passed the Sonnet judge in the card track. The line art
of both rows failed after 3 tries. The print cards need line art for the 11-16 check. The PM
decided that the rows get more tries inside the card limit. The date needed is 2026-11-09.

This track gives the ham row up to 2 more line tries and the family row up to 3 more line tries.
It then delivers the passed rows in a new delivery folder and in the handoff folder, and it
reports to the PM. A row that fails all its tries is reported, with its best try named.

This track follows two closed tracks, archived in `measure/archive/`:
`asset_storytime_l2_cards_20261106` (the card spec form, the guard `CARD_RUN`, the judge flag
`--cards`, the delivery writer `writeMuseDelivery`, the 29 delivered card rows) and
`asset_storytime_l2_family_words_20261107` (the calibration record of 2026-11-07). The whole
track is on the PM light lane: one maker and one checker.

## Owner order

PM request 2026-11-07, word for word:

> PM → Forge: family-word pictures received, thank you. Your open question (ham card retry) is a PM decision within the approved card limit (0.95 of 1.60 USD used): YES.
> What: (1) ham line art: up to 2 more tries (0.02 USD max). Change the shape, not only the words: a simple ham slice with a clear fat rim and no plate, or a whole ham leg, whichever the color file supports. (2) family line art for the print card: up to 3 tries (0.03 USD max), from the passed color file. Light lane (one maker, one checker). Why: both print cards need line art for the 11-16 check. Done-when: delivered into ~/Desktop/handoff/storytime-l2-card-pictures/ with MANIFEST.txt and manifest.json updated (sha256 OK), or the best try named if all tries fail; then Workbooks picks the greyscale color file as the fallback. Date: 11-09.

Date needed: 2026-11-09.

The word "approved" in the PM request names the card limit that Daniel gave on 2026-11-06. Track
text does not use the word for a picture of this track (see FR-10).

## Inputs (read-only)

Forge reads these files and never changes their bytes.

| File | SHA-256 | Source |
| --- | --- | --- |
| `out/storytime/l2/unit1/cards/muse/l2-w04-card-ham-m1-color-print.png` (ham color, 1500 x 1500) | `1b1e93e0bd8251ae1a31a7353bc47c82371485db12b7d829e5638c59d9eb795c` | card track, Muse call m1, color |
| `out/storytime/l2/unit1/cards/muse/l2-w04-card-ham-m1-color.png` (the source of the line call) | `97444a8d8a03e7b6ae5321d8c88d20a0de7ebf437cb082e34a9fa967630a41f2` | card track, Muse call m1, color |
| `out/storytime/l2/unit1/cards/muse/l2-w04-card-family-m1-color-print.png` (family color, 1500 x 1500) | `ab6067eedf8de3efebb40509c6032f81f7ecee178b212eac8c3727d40a8bff62` | card track, Muse call m1, color |
| `out/storytime/l2/unit1/cards/muse/approved.json` (29 entries) | measured by the maker in Task 3 | card track |
| `out/storytime/l2/unit1/cards/delivery-muse-v1/` (58 PNG and `manifest.json`) | the SHA-256 of each file in its `manifest.json` | card track |
| `measure/runs/asset_storytime_l2_family_words_20261107/calibration-record.json` | measured by the maker in Task 3 | judge calibration of 2026-11-07 |

Author check (2026-11-07): the ham color print has the SHA-256 above. The card judge record
`measure/runs/asset_storytime_l2_cards_20261106/judge-cards-cards-r1-color.json` holds a pass for
the ham color and the family color. The ham color shows one smooth round pink slice with a
slightly paler raised rim band, on a plain white plate. It supports a ham slice with a fat rim.
It does not support a whole ham leg, so this track draws the slice (PM option 1).

`out/storytime/l2/unit1/cards/muse/costs.tsv` holds 95 call rows and 0.95 USD. The guard
`CARD_RUN` of `scripts/storytime-muse-guards.mjs` has the cap 1.60 USD. The ham line and the
family line each hold 3 tries since 2026-11-06, so the guard refuses a new line call for both.

## The 2 rows

| Row id | Color | Line tries so far | New line tries | Source of the line call |
| --- | --- | --- | --- | --- |
| `l2-w04-card-ham` | passed (card track, m1) | 3 failed, two judges each (read as a plate, a pizza, or a pie) | up to 2 (tries 4 and 5) | the ham color m1 |
| `l2-w04-card-family` | passed (card track, m1) | 3 failed on width: 4, 8, and 7 px against the 12 px gate (try 1 passed the judge) | up to 3 (tries 4, 5, and 6) | the family color m1 |

The maximum spend is 5 calls, which is 0.05 USD. The total of `costs.tsv` then reaches 1.00 USD at
most. The cap of 1.60 USD stays.

## Decisions and boundaries

The orchestrator set these decisions. The maker decides none of them.

1. **Guard.** A per-row line retry allowance goes into `scripts/storytime-muse-guards.mjs` and
   its type file. Every other row and kind keeps the `CARD_RUN` rule. The spend cap and its start
   time stay.
2. **Ham.** The ham line prompt changes the shape. It draws the slice only, with no plate.
3. **Family.** The family line prompt gets thicker strokes by a fixed ladder, one step for each
   try.
4. **Order.** One try at a time. The family stroke width is measured after each call. A try
   below 12 px fails with no judge.
5. **Judge.** The frozen judge kit, Sonnet, line batches at card size (360 px). The calibration
   record of 2026-11-07 counts. No new calibration.
6. **Delivery.** A new folder `delivery-muse-v2`. The v1 folder and its 58 files stay as they
   are.
7. **No Drive update.** The PM did not ask for one.
8. **Light lane.** One maker (`measure-jr-green`) and one checker (`measure-phase-acceptance`).
   No spec review, strategy, Red, review, adversarial, or final acceptance role runs.

## Method

### Guard

`scripts/storytime-muse-guards.mjs` gets these new exports. The type file
`scripts/storytime-muse-guards.d.mts` gets the same shape.

- `CARD_LINE_RETRY_START`: a UTC time string in the form `YYYY-MM-DDTHH:MM:00Z`. The maker sets
  it once in Task 1. The value is the UTC time of that moment (the command `date -u`), cut to
  the minute. It is later than the last row of `costs.tsv` and not later than the first new
  call. The maker does not use a time of the future.
- `CARD_LINE_RETRY`: an object with the field `startTime` (the constant above) and the field
  `rows`, a map from row id to allowance: `l2-w04-card-ham` is 2 and `l2-w04-card-family` is 3.
- `lineRetryGuard(rows, id, requested)`: gives `{ ok, count, max, reason? }` in the form of
  `tryGuard`. It counts the line tries of the row id since `CARD_LINE_RETRY.startTime` with
  `countTries`. It refuses when `count + requested` is more than the allowance. It returns
  `{ ok: true }` with `max` equal to the allowance when the row has an entry. A row with no entry
  gets `null`.

`runGuards` uses `lineRetryGuard` for a card call with the command `line` when the row id has an
entry. It then does not apply the `CARD_RUN` try rule to that row and kind. The refusal message
has the form of the existing message: `refused: <id> line count <n> (max <allowance>)`. The
`runGuards` code path for every other row, kind, and the restart run stays as it is. The block
`CARD_RUN` stays byte equal. The spend check (cap, margin, projected spend) runs before the try
check, as it does now.

A call that fails and costs 0 USD is not a try (the existing rule of `countTries`).

The literal `2026-11-06T00:00:00Z` stays only in the three files that hold it now. The new test
file and the new constant do not hold that literal. The new test imports `CARD_RUN`.

### Prompts

Only the `linePrompt` field changes, in the two card spec files, plus one `mustShow` change for
the ham (see below). The `colorPrompt`, the `goal`, the references, and every other field stay.
The spec test `tests/storytime-card-specs.test.ts` passes after each edit.

**Ham line prompt.** The new `linePrompt` of `docs/storytime/l2-unit1/cards/l2-w04-card-ham.json`
is exactly this text:

> Picture 1 is a 3D-rendered children's book picture. Convert picture 1 to line art for a student book: thick, even black lines (about three times a normal outline), simple closed shapes that a 5-year-old can color, on pure white. No fine detail, no shading, no gray, no texture lines, no text. Draw only the slice of ham, large in the middle, in the same place and the same size as in picture 1. Do not draw the plate: no plate, no ring, no ground line, no shadow, and no background shapes. The slice is one closed round outline with a softly wavy edge. Draw the wide fat rim as one closed band inside the outline, along the whole edge of the slice, bounded by a second wavy closed line well inside the outline. Draw three or four long, thin, curved lines across the pink meat inside the rim, for the marbled grain of ham; each line ends on the fat rim. Draw no dots and no small circles. The ham has no eyes and no face: draw no eyes, no pupils, and no face anywhere. Every line inside the object ends on another line, with no loose ends. Do not draw any text, letters, or numbers.

The thick-line rule, the "pure white" rule, the "no gray" rule, and the no-text rule stay.

**Ham `mustShow`.** The ham spec lists the phrase "a small white plate" in `mustShow`. The judge
fails a line picture that lacks a `mustShow` item (`wrong-or-missing-prop`). The PM ordered a
slice with no plate. So the maker removes the phrase "a small white plate" from `mustShow` in the
ham spec. The phrases "one slice of ham" and "a slice of pink ham" stay. This is the only change
outside `linePrompt`. The delivered ham color keeps its plate; the difference is recorded in the
PM report.

**Family line prompt ladder.** The maker edits `linePrompt` of
`docs/storytime/l2-unit1/cards/l2-w04-card-family.json` before each try. Each step builds on the
steps before it. The sentences are exact.

| Step | Try | Edit to the current `linePrompt` |
| --- | --- | --- |
| E4 | 4 | In the first sentence, replace "very thick, bold, even black lines (about five times a normal outline)" with "extremely thick, heavy, even black marker lines (about ten times a normal outline)". Replace "about eight times a normal outline" with "about twelve times a normal outline, as thick as a fat marker". |
| E5 | 5 | Replace "about ten times a normal outline" with "about fourteen times a normal outline" and "about twelve times a normal outline, as thick as a fat marker" with "about sixteen times a normal outline, as thick as a fat crayon". Delete the sentence "Draw each hand as a closed outline with each finger as a separate rounded shape." Replace "Each hand is one small closed rounded shape." with "Each hand is one plain rounded mitten shape with no separate fingers." |
| E6 | 6 | Replace "Draw each eye as a closed outline with a big solid black pupil (a filled black circle) inside it." with "Draw each eye as one big solid black dot with no outline." Replace "Each face has two eyes with solid black pupils and one smile curve." with "Each face has two big solid black eye dots and one smile curve." Replace "Each face has only two eyes (each a closed outline with a big solid black pupil) and one smile curve" with "Each face has only two big solid black eye dots and one smile curve". |

The prompt keeps the six persons, the order, and the shapes of the color file. The prompt keeps
the no-text rule. If a sentence of a step is not in the current text, the maker stops and
reports (the text drifted).

### Tries, order, and stop rules

- The maker runs one Muse line call at a time, with `--tries 1` and `--from 1`:
  `node scripts/storytime-muse.mjs line docs/storytime/l2-unit1/cards/<spec>.json --from 1 --tries 1`.
  The ham row runs first, then the family row. The tool names the files `-line-4`, `-line-5`
  (and `-line-6`) because it takes the next free try number.
- After each call, the maker measures the stroke width of the new line print
  (`<id>-m1-line-print-<n>.png`) with `inspectLineArtPng` of `src/storytime/book-pictures.ts`
  (gate `MIN_LINE_ART_LINE_WIDTH_PX`, 12 px, at 1500 x 1500). The maker records the width of
  every try of both rows.
- **Family.** A try below 12 px is a failed try with no judge. A try at 12 px or more goes to the
  judge.
- **Ham.** Every try goes to the judge. A ham try that passes the judge and measures below 12 px
  is not a delivery (the writer refuses it). It counts as a failed try.
- The first try that passes the judge and the width gate is the delivery of the row. The maker
  stops the row at that pass or at its try limit.
- A judge fail stands only when a second judge on the file alone also fails it. The second judge
  is the same command run again for the same id and try, with a new `--out` name that ends in
  `-second`.
- Spend stop: 0.05 USD for this track (the total of `costs.tsv` is then 1.00 USD). The maker
  stops at that sum even if a row has tries left. The guard cap of 1.60 USD stays the hard stop.
- A call that fails with cost 0 is not a try. The maker repeats it once. After 2 failed calls in
  a row for one row, the maker stops and reports.

### Judge

The judge is the frozen kit `docs/storytime/l2-unit1/judge/` (`judge-prompt.md` version 6,
`cast.json`), role model `claude-code/claude-sonnet-5-5#high`. The command for one try is:

`node scripts/storytime-judge-batch.mjs --ids <id> --kind line --try <n> --cards --out <name>`

The calibration record of 2026-11-07
(`measure/runs/asset_storytime_l2_family_words_20261107/calibration-record.json`) counts for this
track. The maker does not calibrate again. In Task 3 the maker checks that the judge prompt, the
cast file, and the calibration record have not changed since that record (`git diff` of the
kit folder is empty against the commit of the record). The maker keeps each judge result file and
log in `measure/runs/asset_storytime_l2_card_line_retry_20261107/`.

The judge is model evidence. It is not acceptance.

### Delivery

The delivery writes a new folder `out/storytime/l2/unit1/cards/delivery-muse-v2/` with
`writeMuseDelivery` of `src/storytime/muse-delivery.ts` (no code change). The maker writes a
one-time script in the run folder, in the form of the card delivery, and an approval list
`out/storytime/l2/unit1/cards/muse/approved-v2.json`. The file `approved.json` stays unchanged.

- The approval list holds the 29 entries of `approved.json` without change, plus one entry for
  each row that passed: `rowId`, `version` 1, `colorPrint` (the existing color print file name),
  `linePrint` (the plain print of the passing try, `<id>-m1-line-print-<n>.png`, not a
  despeckled file), and `notes` with the judge result files. It keeps the picture list pin
  `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf`.
- The delivery folder is new. The writer holds 29 rows plus the rows that passed (29, 30, or 31
  rows). Each row has `<id>-v1.png` and `<id>-line-v1.png`, 1500 x 1500 px, 8-bit, no alpha.
- The 58 files of the 29 old rows have the same bytes as in the folder `delivery-muse-v1/`. The
  v1 folder stays.

Handoff folder `/home/daniebo/Desktop/handoff/storytime-l2-card-pictures/`:

- The maker first copies the old `MANIFEST.txt` and `manifest.json` into the run folder
  (`handoff-before/`).
- The folder keeps its 58 PNG files without change. It gets the new PNG files of the passed rows
  (2 files for each passed row), the `manifest.json` of the v2 delivery, a new `MANIFEST.txt`,
  and a new contact sheet with the same file name
  (`storytime-l2-card-pictures-contact-sheet.png`).
- `MANIFEST.txt` has the form of the old file: header, file lines (SHA-256, two spaces, name),
  judge result files, failed rows, corner note, spend, and the check command. Every file line
  gives OK with `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -`. The header counts the
  rows (29, 30, or 31 of the 31 card rows). The text about the 2 missing rows changes to match
  the result. The spend line gives the new total.
- The contact sheet shows one tile for each file of the folder, one label for each row, and each
  label sits under its own card.

**Failed row.** A row that fails all its tries is not in `delivery-muse-v2` and not in
`manifest.json`. The handoff folder gets its passed color print as `<id>-v1.png` (the bytes of
the color print), with a `MANIFEST.txt` file line and this note: "color only; the line art
failed; Workbooks makes the greyscale fallback". For the family row the color file has the same
bytes as `l2-w04-card-family-v1.png` of the family-word delivery (SHA-256
`ab6067eedf8de3efebb40509c6032f81f7ecee178b212eac8c3727d40a8bff62`). `MANIFEST.txt` and the PM
report name the best try of the row with its file path and SHA-256:

- Family: the try that passed the judge with the widest stroke; if no try passed the judge, the
  try with the widest stroke. The width of every try is in the record.
- Ham: the try whose judge notes name the fewest hard defects; a tie goes to the later try.

A try file that is not delivered stays in `out/`. No PNG or JPG goes into git.

### PM report

The maker writes `measure/runs/asset_storytime_l2_card_line_retry_20261107/pm-report.md`. It
starts with one status line: `done`, `blocked`, or `in progress`, plus one line of text. It then
holds the handoff path, the spend of this track and the total of `costs.tsv`, the calls, the
width of every try, the judge result for each try, each failed row with its best try, the
difference of the ham `mustShow`, the corner values below 250 of the new color files (a report
item and not a gate), and a "Facts changed:" list. The facts that changed are the count of
delivered card rows (29 to 29, 30, or 31), the line-art status of the ham and the family cards,
and the spend total. The report states that the delivery is model evidence and that Workbooks
checks the pictures.

## Functional Requirements

- **FR-1 Guard.** After Task 1, with three earlier line tries of the row before
  `CARD_LINE_RETRY.startTime`: the ham line tries 4 and 5 are allowed and try 6 is refused. The
  family line tries 4, 5, and 6 are allowed and try 7 is refused. A request for more tries than
  the allowance is refused. Tries before the start time do not count against the allowance. The
  ham color, every other row, and every other kind keep the `CARD_RUN` rule (3 tries). The spend
  cap still refuses. `CARD_RUN` stays byte equal. `tests/storytime-card-guards.test.ts` and
  `tests/storytime-card-adversarial.test.ts` pass without change.
- **FR-2 Ham prompt.** The ham `linePrompt` is the text of "Ham line prompt". The `colorPrompt`
  is byte equal to the value before the track. The ham `mustShow` lacks "a small white plate" and
  keeps the two other phrases. The card spec test passes.
- **FR-3 Family prompt.** Each family try used the step of the ladder for its try number. The
  `colorPrompt` and the references are byte equal to the values before the track. The card spec
  test passes after each edit.
- **FR-4 Tries.** Ham has at most 2 new line tries and family has at most 3. Each call has a row
  in `costs.tsv`. The track spend is at most 0.05 USD. The total is at most 1.00 USD.
- **FR-5 Width.** The record holds the measured width of every new line try. No family try below
  12 px goes to the judge. The delivered line prints measure at least 12 px.
- **FR-6 Judge.** Each judged try has a result file. A failed try that stands has two judge
  results that fail. A delivered try has a pass and a width of 12 px or more.
- **FR-7 Delivery.** The folder `delivery-muse-v2` holds PNG files for the 29 old rows plus the
  passed rows, and `manifest.json`. The 58 old files have the same SHA-256 as in `delivery-muse-v1`.
  Every PNG is 1500 x 1500 px, 8-bit, with no alpha channel.
- **FR-8 Handoff.** The handoff folder holds the new files, the v2 `manifest.json`, the new
  `MANIFEST.txt`, and the contact sheet. Its 58 old PNG files have unchanged bytes. All file
  lines of `MANIFEST.txt` give OK with `sha256sum -c`. The `manifest.json` of the handoff folder
  equals the `manifest.json` of `delivery-muse-v2`.
- **FR-9 Failed row.** A failed row has its color print in the handoff folder, the note of the
  section "Failed row", and its best try named in `MANIFEST.txt` and the PM report.
- **FR-10 Claims.** No file of the track, `MANIFEST.txt`, or the PM report says that Daniel or
  Workbooks accepted a picture. The word "approved" appears only in the PM quotation, in the file
  name `approved.json` and `approved-v2.json`, and in the sentence of the Owner order that
  explains it.
- **FR-11 Git.** No PNG or JPG enters git. The track commits explicit paths only. The files
  `measure/generated/` stay unstaged by the track.
- **FR-12 Frozen files.** The judge kit, `scripts/storytime-muse.mjs`,
  `scripts/storytime-judge-batch.mjs`, `src/storytime/muse-delivery.ts`, the block `CARD_RUN`,
  and the 31 card spec files other than the ham and the family have no change. `assets/fireball.ts`
  and `out/fireball/` have no change.

## Non-Functional Requirements

- All prose follows ASD-STE100.
- Muse calls, judge batches, and the delivery script run with plain `node` or `tsx` (light roles).
  Full test suites and the typecheck run with
  `bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`. Exit code
  75 means hold.
- The maker commits explicit paths only. Other agents share the git index.
- No song or video command runs.

## Owned paths

- `measure/tracks/asset_storytime_l2_card_line_retry_20261107/` and
  `measure/runs/asset_storytime_l2_card_line_retry_20261107/`
- `measure/tracks.md` (the registry entry, and the closeout)
- `scripts/storytime-muse-guards.mjs` and `scripts/storytime-muse-guards.d.mts` (new exports and the
  `runGuards` branch only)
- `tests/storytime-card-line-retry.test.ts` (new)
- `docs/storytime/l2-unit1/cards/l2-w04-card-ham.json` and
  `docs/storytime/l2-unit1/cards/l2-w04-card-family.json` (`linePrompt` for both; `mustShow` for
  the ham)
- `out/storytime/l2/unit1/cards/muse/` (new files, the appended `costs.tsv`, and
  `approved-v2.json`)
- `out/storytime/l2/unit1/cards/delivery-muse-v2/`
- `/home/daniebo/Desktop/handoff/storytime-l2-card-pictures/` (the additions of the section
  "Delivery")

## Acceptance Criteria

1. FR-1 test file passes; the two old guard test files pass without change; the `git diff` of
   the guard file shows no change in the block `CARD_RUN`; the typecheck shows no new error in
   owned files.
2. The prompt diffs match FR-2 and FR-3; the card spec test passes.
3. `costs.tsv` holds at most 5 new rows; the track spend is at most 0.05 USD; the total is at
   most 1.00 USD.
4. The record holds the width and the judge result of every new try, with the stop rule applied.
5. `delivery-muse-v2` and the handoff folder meet FR-7 and FR-8. The checker runs the SHA-256
   comparison of the 58 old files and `sha256sum -c` on `MANIFEST.txt`.
6. A failed row meets FR-9.
7. The PM report exists and meets the section "PM report".
8. `./measure/doctor.sh` shows no new error from this track. The checker greps for FR-10.

## Human gate

Workbooks checks the pictures after the delivery, and Daniel sees the print cards in his 11-16
check. Both are outside this track. The track records no Workbooks or Daniel acceptance. If a row
fails all its tries, Workbooks picks the greyscale color file as the fallback (PM order).

## Out of Scope

- A new color picture for the ham or the family.
- A whole ham leg.
- A change of the judge kit, the guard `CARD_RUN`, `storytime-muse.mjs`, or the delivery writer.
- A despeckle step or any local filter on a line print.
- More tries than the PM gave, or spend above 0.05 USD for this track.
- A Drive backup.
- A change to the other 29 card rows, or to the 19 family-word rows.

## Open questions answered by default

The author answered these by default. The PM can change each one.

1. **Ham `mustShow`.** The default removes "a small white plate" from the ham `mustShow`, because
   the line art has no plate. Without the change, the judge fails a correct picture.
2. **Color-only row in the manifest.** The default keeps a failed row out of `manifest.json`
   (the writer needs a color file and a line file) and names it only in `MANIFEST.txt` and the
   report.
3. **Family ladder.** The default is the fixed ladder of E4 to E6, because the card-track prompt
   already asks for the thickest lines that keep the faces readable.
4. **Retry start time.** The default is the real UTC time at Task 1, not the example time of the
   request, so the first call is never before the start.
5. **Width gate for ham.** The default measures the ham width too, as a record and as a delivery
   condition, and sends every ham try to the judge as the PM order says.
