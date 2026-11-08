# Specification: Storytime Level 2 unit 2 paid pictures (book rows, element sheets, app family words)

## Overview

Daniel gave the "Go" for the unit 2 paid media. The PM assigned this track two paid items. The
first item is the book pictures: 182 new rows and 10 element sheets. The second item is the app
family-word pictures: 18 new words. Both items use Muse, the frozen Sonnet judge, and a delivery
folder with a hand-off folder. The Workbooks repository holds the speech and the songs on the
MiniMax plan, so this track has no speech and no song work.

The track follows the archived tracks `asset_storytime_l2_unit2_prep_20261108` (the specs, the
element map, the prep hand-off), `asset_storytime_l2_unit2_tooling_20261108` (the unit 2 guard,
the `--unit2` judge option, and the unit 2 delivery writer), `asset_storytime_l2_family_words_20261107`
(the paid-run method for family words), and `asset_storytime_l2_cards_20261106` (color calls, then
line calls, with a second judge). It is a feature on the PM light lane of 2026-11-03.

## Owner order

PM message, 2026-11-08 about 20:15 ICT, word for word:

> PM: Daniel's Go for the unit 2 paid media (Tasks, 2026-11-08 20:1x ICT, his word "Go" on the Workbooks list). Your part: (1) Book pictures, 182 new rows + 10 element sheets: expected 14.66 USD, stop 18.33 USD. (2) App family-word pictures, 18 new: expected 0.23 USD, stop 0.29 USD. The whole unit 2 hard stop is 25.21 USD; Workbooks holds the speech and songs on the MiniMax plan. Steps: write these caps into the unit 2 guard (commit), then run with 1 role when `slot check` allows. The Storytime app roles keep the first claim on free slots. Any Chrome composite or sheet build goes through heavy-run.sh. Rules: log each spend, stop at each stop, and if a rerun would pass a stop, stop and report to the PM (not Daniel). Reply with the guard commit and the start time; at the end: spend per item, rows done, failures, and the delivery folder.

The PM also accepted, on 2026-11-08, that `l2-w10-check-row-ten` becomes a new row of the paid
run and `l2-w11-check-row-ten` reuses it. The unit 1 source `l2-w06-check-row-ten-line-v2.png` has
10 px lines, and the minimum is 12 px. The checker finding F6 of the tooling track raised this
point.

The 18 app words come from the Workbooks paid media list
`~/Desktop/handoff/storytime-l2u2-paid-media-2026-11-08/paid-media-list.md`, section 3, SHA-256
`d4e19a58e66b3c8c30df933789faf464d037a13f117fc3dc2827341b85b7492b`:

- egg, milk, cake (week 9);
- hat (week 10);
- bed, table, sofa, box, chair (week 11);
- book, bag, pencil, pen (week 12);
- jump (week 13);
- bus, bike, truck, plane (week 15).

Each app picture is color only, in card style, at 1500 x 1500 px.

## Risk record: the OpenRouter key

On 2026-11-08 about 20:2x ICT the OpenRouter key showed 1.31 of 20.00 USD used for the month, so
18.69 USD stayed. The two stops sum to 18.62 USD (18.33 + 0.29). The margin is 0.07 USD. A rerun
that passes a stop stops the run (D5). The maker records the key balance in the spend record if a
call result shows it. The maker makes no balance call.

## Context (read only)

- The prep track made `docs/storytime/l2-unit2/` (`elements.json`, `rows.json`, `prompt-list.*`,
  229 row specs in `w09` to `w16/muse/`, and 10 element specs in `w<nn>/muse-elements/`) and
  `scripts/storytime-u2-specs.mjs`.
- The tooling track made the unit 2 guard `U2_RUN`, the kind `u2` in `classifyOutDir`, the judge
  option `--unit2`, and the writer `deliverMuseUnit2` in `src/storytime/muse-delivery-u2.ts`.
  `U2_RUN.capUsd` is null at the start of this track.
- The guard `scripts/storytime-muse-guards.mjs` holds `U2_RUN`, `U2_WEEKS`, `classifyOutDir`,
  `isUnit2OutDir`, `cliGuardOptions`, `scanU2CostFiles`, and `runGuards`. The test-only cap key is
  `u2CapUsd`.
- The muse tool `scripts/storytime-muse.mjs` sends a unit 2 spec to the unit 2 root through
  `isUnit2OutDir` and calls `runGuards` with `cliGuardOptions`.
- The writer `deliverMuseColorSet` in `src/storytime/muse-delivery.ts` checks the row id against
  `/^l2-w0([1-9])-card-[a-z]+$/` and writes the folder `w0<N>`. A unit 2 family-word id such as
  `l2-w10-family-hat` does not match, so the maker expects to need a thin wrapper (D6).
- The unit 1 family-word specs in `docs/storytime/l2-unit1/family-words/` give the spec form (card
  style, color only, `print` `crop`, `aspect` `1:1`, `printSize` 1500 x 1500).
- The frozen judge kit is `docs/storytime/l2-unit1/judge/`: `judge-prompt.md` v6, `cast.json`, and
  `calibration-set.json`. Do not change it.
- The unit 2 picture list (read only) is
  `/home/daniebo/Desktop/Workbooks/content/storytime/drafts/l2/print/pictures-u2.json`, SHA-256
  `63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec`.
- Workbooks delivery rule (its `forge-brief.md`, section 7): each batch folder has `manifest.json`
  with, for each file, the file name, the picture-list id, the SHA-256, and the pixel size.

## Decisions

The author set these defaults from the PM message. The PM can change each one.

- **D1 Caps.** The caps go into `scripts/storytime-muse-guards.mjs` in one commit before any paid
  call.
  - `U2_RUN`: `capUsd` 18.33 and `reportAtUsd` 14.66. `startTime` and the other fields stay as they
    are.
  - New constant `U2_FW_RUN`: `startTime` is the real UTC time of Task 1 cut to the minute, `capUsd`
    0.29, `reportAtUsd` 0.23, `marginUsd` 0.01, `maxTries` 3, `outDir`
    `out/storytime/l2/unit2/family-words/muse`. The file `.d.mts` gets the type.
  - `classifyOutDir` gives the new kind `u2fw` for exactly that folder. Every other unit 2 path that
    is not a `u2` folder stays `invalid`.
  - A `u2fw` call reads only the `costs.tsv` of that folder since `U2_FW_RUN.startTime`. A `u2` call
    reads only the `w09` to `w16` cost files. Book spend never counts against the app stop, and the
    app spend never counts against the book stop.
  - The refusal of an empty or invalid cap (null, 0, negative, NaN, or a non-number) applies to both
    kinds. The tests keep that meaning through the test-only cap options `u2CapUsd` and a new
    `u2FwCapUsd`.
  - A call that mixes `u2fw` with any other kind is refused.
  - `cliGuardOptions` removes every test-only cap key, also the new one. A CLI option cannot set a
    cap.
  - The blocks of unit 1, the card run, and the line retry stay byte equal.
  - The muse tool sends `u2fw` specs to the guard like `u2` specs. It has no other change.
  - Commit message: `feat(storytime_l2_unit2_pictures): unit 2 caps 18.33 and 0.29 USD`.
- **D2 The ten row.** `scripts/storytime-u2-specs.mjs` excludes the unit 1 reuse source
  `l2-w06-check-row-ten-line-v2.png`. A named rule in the script cites the PM decision of
  2026-11-08. Then `l2-w10-check-row-ten` has `reuse` null, and `l2-w11-check-row-ten` reuses
  `l2-w10-check-row-ten` with the kind `unit2-earlier-row`.
  - The maker regenerates `docs/storytime/l2-unit2` with the command of the prep track (the usage
    line of the script names the four arguments).
  - Counts after: 47 reuse rows (45 of unit 1 and 2 earlier-row) and 182 new rows (229 in total).
  - The maker updates `tests/storytime-u2-specs.test.ts` and the counts in the delivery test.
  - The maker rebuilds the prep hand-off folder with
    `node measure/runs/asset_storytime_l2_unit2_prep_20261108/make-handoff.mjs` and runs
    `sha256sum -c MANIFEST.txt` (0 FAILED).
- **D3 Element sheets first.** The 10 specs in `docs/storytime/l2-unit2/w<nn>/muse-elements/` get
  color calls first. They get line calls only if a row spec names an element line file. The default
  is color only. The judge reads each element at 900 px with the use `element`.
  - Row specs name element files as `<id>-m1-color.png`.
  - If an element passes at `m<n>` with n above 1, the maker changes the row references to the
    `m<n>` file before the row pool. Only the `references` field changes. The maker records the
    change.
- **D4 Book rows.** Color try 1 runs for all 182 new rows at concurrency 4.
  - The orchestrator runs the frozen judge for each week with the batches of
    `scripts/storytime-judge-batch.mjs --unit2`. The judge copy is 900 px for class A and B and
    360 px for class C. A row has at most 3 color tries.
  - Then line calls run from each passing color, with `--tries 1` for each call. The judge reads each
    line. A row has at most 3 line tries.
  - A fail stands only after a second judge on the file alone.
  - On a retry the maker changes only the picture sentences of that row prompt, from the judge
    notes. The maker records the reason.
  - A row with no pass after 3 tries gets no delivered file. The report names the row and its best
    try.
  - The 47 reuse rows get no call.
  - The orchestrator, not the maker, runs the frozen judge: model `claude-code/claude-sonnet-5-5#high`,
    `judge-prompt.md` v6, and `cast.json` unchanged. The orchestrator also runs the two calibration
    controls of `calibration-set.json` once before the first paid call. Both must fail. If one
    passes, the run stops and the orchestrator reports to the PM.
  - Judge result files go to `measure/runs/asset_storytime_l2_unit2_pictures_20261108/judge-u2-<group>.json`.
- **D5 Spend rules, both items.** The guard caps are the stops.
  - The maker logs each pool in `measure/runs/asset_storytime_l2_unit2_pictures_20261108/spend-record.txt`.
    A line holds the UTC time, the item (`book` or `app`), the calls, the pool spend, the item total,
    the item stop, and the amount left.
  - Before a pool or a rerun the maker computes the worst case: the planned calls times the highest
    call cost seen, and at least 0.01 USD. If the worst case would pass the item stop, the maker
    runs nothing and writes `blocked: a rerun would pass the <item> stop` with the numbers. The
    orchestrator then reports to the PM.
  - One call above 0.03 USD stops the run.
  - At the report point (14.66 USD for the book, 0.23 USD for the app) the maker records the total
    and a projection once and continues.
  - Nobody edits `costs.tsv`. No OpenRouter call runs outside `scripts/storytime-muse.mjs`.
- **D6 App family words.** The maker writes 18 specs in
  `docs/storytime/l2-unit2/family-words/<id>.json` with the id `l2-w<nn>-family-<word>`. The week
  comes from the list in the Owner order section.
  - The `outDir` is `out/storytime/l2/unit2/family-words/muse`.
  - The form is the unit 1 family-word spec form: card style, color only, `print` `crop`, `aspect`
    `1:1`, `printSize` 1500 x 1500, a plain pure white background, and a wide empty white margin.
    Hair and clothes only: never skin, race, or ethnicity.
  - The jump row shows one cast child of week 13 who jumps with both feet off the ground. The default
    is the first cast child of the week 13 story rows in `rows.json`, which is Sam
    (`l2-w13-story-page-i-can-run`). Pat is the default if the week has no cast child. The reference
    is the unit 1 cast sheet of that child (`elements.json`, `castPeople`).
  - An object row uses a unit 2 or unit 1 Forge render or element file as its reference where one
    exists for that object. Otherwise it has no reference.
  - A new judge option `--unit2-family-words` in `scripts/storytime-judge-batch.mjs` (and its
    `.d.mts`): the spec folder is `docs/storytime/l2-unit2/family-words`, the cost rows come from
    the app folder since `U2_FW_RUN.startTime`, the judge copies (360 px) go to
    `out/storytime-review/judge/prod-u2/`, and the batch files go to
    `docs/storytime/l2-unit2/judge/prod/`. `mustShow` is `[word]`. For jump it is
    `a child jumping with both feet off the ground`. The option cannot run with any other flag.
  - Delivery uses `deliverMuseColorSet` if it takes the unit 2 inputs unchanged. Otherwise the maker
    writes the thin wrapper `deliverMuseUnit2FamilyWords` in `src/storytime/muse-delivery-u2.ts`. A
    helper export from `src/storytime/muse-delivery.ts` is allowed if its behavior stays unchanged.
  - The delivery folder is `out/storytime/l2/unit2/family-words/delivery-muse-v1/`. The hand-off
    folder is `/home/daniebo/Desktop/handoff/storytime-l2u2-family-word-pictures/` with the PNG
    files, `manifest.json`, `MANIFEST.txt`, and a contact sheet.
  - A word has at most 3 color tries. The stop is 0.29 USD.
- **D7 Delivery of the book.** `deliverMuseUnit2` writes `out/storytime/l2/unit2/delivery-muse-v1/`
  and pins the list SHA-256 `63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec`.
  - The hand-off folder is `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures/` with the PNG
    files, `manifest.json`, `MANIFEST.txt` (`sha256sum -c` gives 0 FAILED), and one contact sheet
    for each week.
  - Contact sheets use sharp. Any Chrome composite or sheet build runs only through `heavy-run.sh`.
  - The delivery is model evidence and not acceptance.
- **D8 Report.** The file `measure/runs/asset_storytime_l2_unit2_pictures_20261108/pm-report.md`
  starts with `Status: done.` (or `Status: blocked.`). It then gives the spend for each item (book and
  app) with the calls and the stop, the rows done for each item, the failures with the best try, the
  delivery and hand-off folders, and a `Facts changed:` list.
- **D9 Slots and roles.** The orchestrator runs `slot check` before each role. One role runs at a
  time. The Storytime app roles go first. Muse calls, judge batches, and the delivery writer are
  light: they run with `node` and without `heavy-run.sh`. Tests and `tsc` run only through
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
  Exit code 75 means hold: run again.

## Functional Requirements

- **FR-1 Caps.** `U2_RUN.capUsd` is 18.33 and `U2_RUN.reportAtUsd` is 14.66. `U2_FW_RUN` holds the
  values of D1. No other cap value appears in the guard file.
- **FR-2 Cap scope.** A fixture `costs.tsv` of 18.32 USD in the book folders makes the guard refuse
  the next book call. A fixture of 0.28 USD in the app folder makes the guard refuse the next app
  call. Book spend does not count against the app stop, and the reverse.
- **FR-3 Kinds.** `classifyOutDir` gives `u2fw` for exactly one folder. A mixed call is refused. An
  empty or invalid cap is refused for both kinds. A CLI option cannot set a cap.
- **FR-4 Unit 1 frozen.** The blocks `CARD_RUN` and `CARD_LINE_RETRY` and every unit 1 path have no
  change. The old tests pass without change.
- **FR-5 The ten row.** D2 counts hold: 182 new rows, 47 reuse rows (45 and 2). The prep hand-off
  `sha256sum -c MANIFEST.txt` gives 0 FAILED.
- **FR-6 Element sheets.** Each of the 10 element sheets has a passing judge result before the row
  pool starts, or the report names it with its best try.
- **FR-7 Book rows.** Each of the 182 new rows has a delivered color and line pair, or the report
  names the row and its best try. Every delivered file meets the size rules of `deliverMuseUnit2`.
- **FR-8 App family words.** The 18 specs, the judge option, and the delivery support exist and have
  tests. Each word has a delivered color picture or the report names it.
- **FR-9 Spend.** The spend of the book item stays at or under 18.33 USD. The spend of the app item
  stays at or under 0.29 USD. The spend record matches the sum of the `costs.tsv` rows.
- **FR-10 Judge.** The orchestrator ran the calibration controls once before the first paid call.
  Both controls failed. The judge kit has no change.
- **FR-11 Delivery.** The book delivery and the app delivery have a `manifest.json`. The list pin
  holds for the book. Both hand-off folders pass `sha256sum -c MANIFEST.txt`.
- **FR-12 Claims.** No file of the track says that Daniel, the PM, or Workbooks accepted a picture.
  The text may quote the "Go" of the PM message, because that "Go" opened the spend only.
- **FR-13 Git.** No PNG or JPG enters git. Each task commits explicit paths only.
- **FR-14 Frozen files.** The judge kit, every unit 1 path, `assets/**`, `assets/fireball.ts`,
  `out/fireball/`, and Workbooks have no change. `src/storytime/muse-delivery.ts` has no behavior
  change.

## Non-Functional Requirements

- All prose follows ASD-STE100.
- The maker marks a task `[~]` before the task changes a file outside `measure/`.
- The maker never writes a cap value other than D1. The maker never changes the judge kit or any
  unit 1 path.
- Other agents share the git index. The maker commits explicit paths only.
- No song, speech, or video command runs.
- No PNG or JPG enters git. Test fixtures are generated in temp folders.

## Test commands

GREEN test command (the 13 files of the tooling track, plus the new tests of this track):

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-u2-guards.test.ts tests/storytime-u2-judge-batch.test.ts tests/storytime-u2-delivery.test.ts tests/storytime-u2-specs.test.ts tests/storytime-card-guards.test.ts tests/storytime-card-line-retry.test.ts tests/storytime-muse-attempts.test.ts tests/storytime-judge-batch.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-muse-delivery-adversarial.test.ts tests/storytime-card-adversarial.test.ts tests/storytime-family-word-judge.test.ts tests/storytime-family-word-delivery.test.ts --maxWorkers=1'
```

The maker adds any new test file of this track (for example `tests/storytime-u2-family-words.test.ts`)
to the command. When `src/` changes, the maker also runs
`./node_modules/.bin/tsc --noEmit -p .` through `heavy-run.sh`. The old repository count of type
errors may stay, and `src/storytime/`, `scripts/storytime-`, and `tests/storytime-` must give 0 new
errors.

## Owned paths

- `scripts/storytime-muse-guards.mjs` (and its `.d.mts`)
- `scripts/storytime-muse.mjs` (routing only)
- `scripts/storytime-judge-batch.mjs` (and its `.d.mts`)
- `src/storytime/muse-delivery-u2.ts`
- `scripts/storytime-u2-specs.mjs`
- `docs/storytime/l2-unit2/**`
- `tests/storytime-u2-*.test.ts`
- `out/storytime/l2/unit2/**` and `out/storytime-review/judge/prod-u2/**` (not in git)
- `/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep/` (rebuild by D2)
- `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures/`
- `/home/daniebo/Desktop/handoff/storytime-l2u2-family-word-pictures/`
- `measure/tracks/asset_storytime_l2_unit2_pictures_20261108/`
- `measure/runs/asset_storytime_l2_unit2_pictures_20261108/`
- `measure/tracks.md` (the registry entry and the closeout)

Not owned: every unit 1 path, the judge kit, `src/storytime/muse-delivery.ts` (read only; a helper
export is allowed if the behavior stays unchanged), `assets/**`, `assets/fireball.ts`,
`out/fireball/`, and Workbooks.

## Acceptance Criteria

1. The GREEN test command passes at the audited HEAD of each phase, and the typecheck gives 0 new
   errors in the storytime paths.
2. The checker probes both caps with fixture cost files (FR-2, FR-3).
3. The `costs.tsv` totals since the start times match the spend record, and each item stays under its
   stop (FR-9).
4. The calibration record shows that both controls failed (FR-10).
5. The counts of the book delivery manifest match the rows done in the report. Both hand-off
   folders give 0 FAILED in `sha256sum -c MANIFEST.txt`.
6. `pm-report.md` meets D8.
7. The checker greps FR-12 and FR-14, and finds no violation.

## Human gate

Daniel's "Go" opened the spend. The PM will check the report. Daniel has no gate inside this track.
A stop or a blocked rerun goes to the PM and not to Daniel. The track records no acceptance of a
picture by Daniel, the PM, or Workbooks.

## Out of Scope

- Speech audio and songs (Workbooks, MiniMax plan).
- Any provider call outside `scripts/storytime-muse.mjs`.
- A change to the judge kit, to unit 1 behavior, or to the Workbooks repository.
- The card pictures of unit 2 (the other cards use a book row or a unit 1 card).
- A picture for the 47 reuse rows.

## Open questions answered by default

1. **Guard start time of the app item.** The real UTC time of Task 1, cut to the minute (D1).
2. **Cast child for the jump word.** Sam, the first cast child of the week 13 story rows (D6).
3. **Element line calls.** None, unless a row spec names an element line file (D3).
4. **Delivery wrapper for the app words.** The maker writes `deliverMuseUnit2FamilyWords` because
   `deliverMuseColorSet` refuses the unit 2 ids (D6).
5. **Cost split of the book stop.** The book stop of 18.33 USD covers the element sheets and the
   rows together, because the `u2` scan reads the element cost files (D1).
6. **Error message for an empty app cap.** The maker writes a message in the form of `U2_CAP_MESSAGE`
   and names the app cap (D1).
7. **Key balance.** The maker makes no balance call. The risk record in this specification holds the
   known balance.
