# Specification: Storytime Level 2 card pictures (31 cards)

## Overview

The Workbooks picture list version 7 adds 31 card rows to the Storytime Level 2 print list. Each
card row has a color file and a line-art file. This track draws those 62 files with the approved
Storytime Muse path and delivers them to the PM. Workbooks checks the cards before the 11-19 card
kit. The date needed is 2026-11-12.

This track follows the closed track `asset_storytime_l2_unit1_pictures_20261025` (archived in
`measure/archive/`). That track holds the Muse path, the Sonnet judge kit, the guards, and the
delivery form. This track reuses them and changes none of them, except the guard files that the
owned paths list names.

The track also does one carried task. PM 2026-11-05: the T180 test fixture in
`/tmp/opencode/wb-shadow` must move into the repository test folder in the next track (knowledge
todo 7050174a). This track is that next track (Task 1).

## Owner order

PM relay 2026-11-06. Daniel, word for word: 'Go'. Limit 1.60 USD.

The PM order, word for word:

> Render only the 31 rows with use card. The first 196 rows stay as they are.

> Use the approved Storytime Muse path. Use the character sheets for the person cards (Mom, Dad,
> Grandma, Grandpa, Tom, Lily, Teacher Kim, Pat, Ben, Nan). The family card shows all six. The
> doll, teddy and train copy the book objects. Use the calibrated Sonnet judge at card size. The
> first passing try is the delivery, and line art gets at most 3 tries. Log the spend, and stop at
> 1.60 USD.

Delivery, word for word: 'the same folder and manifest form as the week deliveries, with a
contact sheet. Back up the delivery to Drive.'

Done when, word for word: '62 files are delivered with the manifest, and the PM has the path, the
spend, and any row that failed.'

Date needed: 2026-11-12 (Workbooks checks the cards before the 11-19 card kit).

## Inputs (read-only)

Forge reads these files and never changes them.

| File | SHA-256 | Commit |
| --- | --- | --- |
| `/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json` (list v7, 227 rows) | `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf` | Workbooks `95043edc` |
| `/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/card-pictures.json` | `50df23ae690ce143578e301c2930c931f8b53a0c85805139b72fe6fbf79fa0ca` | Workbooks `95043edc` (same folder) |
| `/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.md` | `3232a33bbc6a49aa651f7eeb544caef6b4ba8430ebdd1295dbb3e66e5cc2c8be` | Workbooks `95043edc` (same folder) |

Author check (2026-11-06): `git show 95043edc:content/storytime/l2/print/pictures.json` has the
SHA-256 above, and the working file has the same SHA-256.

The card spec test reads a repository copy of list v7, not the Workbooks path. The copy is
`tests/fixtures/storytime/pictures-v7.json` (Task 3). Its bytes are the bytes of Workbooks commit
`95043edc`, path `content/storytime/l2/print/pictures.json`, SHA-256
`ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf`. A shell step in Task 5 checks
the live Workbooks file against this SHA-256 before the first Muse call (see "Preconditions").

The 31 card rows have the id `l2-wNN-card-<word>`. Each card row has `sizeClass` C, 1500 x 1500 px,
`fileName` `<id>-v1.png`, `lineArtFileName` `<id>-line-v1.png`, and `objectCounts` with the card
word only. The first 196 rows of the list stay as they are. This track does not touch them.

The 31 cards (id suffix, week):

- Week 1: hello, goodbye, boy, girl, teacher.
- Week 2: fan, astronaut.
- Week 3: sheep, cap, pineapple.
- Week 4: jam, ham, mom, dad, brother, sister, grandma, grandpa, family.
- Week 5: dress, sad, sandwich.
- Week 6: boat, tomato.
- Week 7: pot, mop, otter, doll, car, train, teddy.

## Decisions and boundaries

- The picture path is the approved Storytime Muse path: `scripts/storytime-muse.mjs`
  (`meta/muse-image` through OpenRouter). Color comes first. Line art is a Muse call from the
  passing color picture. No local filter makes line art (FR-14 of the closed track stays replaced).
- The cards use the 1:1 aspect, the print size 1500 x 1500, and a white `#FFFFFF` background
  (size class C of Workbooks picture specification v1). The card prompt in the list says "a plain
  light background". The spec files ask for a plain white background.
- No letters, words, or numbers appear in any picture.
- Forge writes only inside this repository and the handoff folder. No Workbooks or monorepo file
  changes. No bucket upload, deployment, or public release.
- The Drive backup goes to the private Drive folder named in Task 8 only.
- No song or video command runs.
- The delivery is model evidence. It is not acceptance. No text of this track may claim that
  Daniel or Workbooks accepted a picture.
- The rating is G. Every picture suits a five-year-old child.

## Method

### Spec files

One spec file for each card sits in `docs/storytime/l2-unit1/cards/<id>.json`. The form is the form
of `docs/storytime/l2-unit1/a48/l2-w08-check-row-drum.json`. Each file has `id`, `text`,
`pageText`, `use` (`card`), `goal`, `mustShow`, `deliverAs` (the row `fileName`), `references`,
`colorPrompt`, `linePrompt`, `print`, `aspect` (`1:1`), `printSize` (`[1500, 1500]`), and `outDir`
(`out/storytime/l2/unit1/cards/muse`).

The `text` and the card word come from the list row. The `mustShow` phrases come from the list
prompt. The `goal` states the one object or the one person that the card shows.

### References

All reference files exist. They stay at these paths.

| Cards | Reference files |
| --- | --- |
| hello, goodbye, girl (Nan) | `out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-look-reference.png` and `nan-ref-clean-face-crop.png` (same folder) |
| boy (Pat) | `out/storytime-review/batch-22/sprout-pat-render.png`; leave his teddy bear out |
| sad (Ben) | `out/storytime/l2/unit1/w01/muse/elements/ben-ref-clean-2.png` |
| teacher (Teacher Kim) | `out/storytime/l2/unit1/w01/muse/elements/cast-group-b-2.png` (group of Ben, Nan, Teacher Kim, Pip; draw only Teacher Kim) |
| mom, dad, grandma, grandpa, brother (Tom), sister (Lily) | `out/storytime/l2/unit1/w04/muse/elements/cast-mom-sheet-m1-color.png`, `cast-dad-sheet-m1-color.png`, `cast-grandma-sheet-m2-color.png`, `cast-grandpa-sheet-m2-color.png`, `cast-tom-sheet-m3-color.png`, `cast-lily-sheet-m1-color.png` (one sheet for each person). These files are the `cast.json` sources. |
| family | The six family sheets above. The card shows all six people. |
| doll | `out/storytime/l2/unit1/w04/muse/elements/prop-doll-pam-sheet-m1-color.png` (Pam, the rag doll) |
| train | `out/storytime/l2/unit1/w07/muse/elements/prop-toys-sheet-m1-color.png`; draw only the small green toy train with the red wagon |
| teddy | Pat's brown teddy from `out/storytime-review/batch-22/sprout-pat-render.png`; draw only the bear |
| fan, sheep, cap, jam, ham, dress, boat, pot, mop, astronaut, pineapple, sandwich, tomato, otter, car | No references, like the check rows. The prompt keeps the soft, round, bright 3D render look of the book. |

Count: 13 person cards, 3 prop cards with references (doll, train, teddy), 15 cards without
references. The total is 31.

### Differences between the list prompt and the book (recorded, decided)

- Nan: the card prompt says short black hair in two small bunches. The cast note in
  `docs/storytime/l2-unit1/judge/cast.json` says two round buns with red ring bands. The cast
  note wins.
- Teddy: the week 7 toy sheet shows a white teddy with a blue bow. The card prompt names Pat's
  brown teddy. The card follows the prompt.
- Car: the book toy car is blue. The card prompt says a red toy car. The card follows the prompt.
- Author default for any other difference between a reference file and a named color in the card
  prompt (for example the doll): the card follows the prompt, and the maker records the
  difference in the plan note of Task 3. The cast note of `cast.json` wins for the ten people.

### Judge

- The judge is the frozen Sonnet judge kit: `docs/storytime/l2-unit1/judge/judge-prompt.md`
  (version 6) and `cast.json`. This track does not change the kit.
- The batches run through `scripts/storytime-judge-batch.mjs` at card size: a 360 px long side
  (`longSideOf`, use `card`).
- Calibration first. Before the first card judge batch, the maker runs the two gate control files
  of `calibration-set.json` through the judge once and records the result. The controls are the
  `a-nose` version 1 line art (no nose) and the `nan-can-get-a-pan` m3 line art try 1 (no pan
  handle, finding B43-PAN-2). Both must fail. This step costs no Muse spend. If a control passes,
  the maker stops and reports to the PM. No new picture is judged on an uncalibrated judge.
- Daniel's bar of 2026-11-01 applies. Only what a teacher or a child sees at card size is a
  defect. A small mark is a note and not a retry.
- A fail stands only if a second judge that looks at the file alone also fails it.
- A judge result is model evidence. It is not acceptance.

### Tries and spend

- The first passing try is the delivery.
- Each card gets at most 3 color tries and at most 3 line-art tries.
- A row that fails after its tries is reported with its best try. It is not delivered.
- The spend cap for this track is 1.60 USD. The report point is 0.80 USD. The tool refuses a call
  when the sum plus 0.01 USD passes the cap. The maker stops only at the cap of 1.60 USD.
- At the report point of 0.80 USD the maker records the spend and the projection in its role log
  and continues. The maker does not stop at the report point.
- The card run values have one owner: the exported constant `CARD_RUN` in
  `scripts/storytime-muse-guards.mjs` (see "Card run constant"). The spend and the try count read
  only the card cost files, rows at or after `CARD_RUN.startTime`.
- Muse calls cost about 0.01 USD each. The minimum is 62 calls (about 0.62 USD). The cap allows
  about 160 calls.
- A failed call with cost 0 does not count as a try (the rule of the restart guard).
- The maker logs every call and its cost in `out/storytime/l2/unit1/cards/muse/costs.tsv`.

### Card run constant

`scripts/storytime-muse-guards.mjs` exports one constant, and its types are in
`scripts/storytime-muse-guards.d.mts`:

```js
export const CARD_RUN = {
  startTime: '2026-11-06T00:00:00Z',
  capUsd: 1.6,
  reportAtUsd: 0.8,
  marginUsd: 0.01,
  maxTries: 3,
  outDir: 'out/storytime/l2/unit1/cards/muse',
};
```

- No other file holds a copy of these values. `scripts/storytime-muse.mjs` and
  `scripts/storytime-judge-batch.mjs` import `CARD_RUN`.
- Reason for the start time (orchestrator evidence, 2026-11-06): the newest restart cost row in any
  `out/storytime/l2/unit1/*/muse/costs.tsv` is `2026-11-05T03:32:05.918Z` (file
  `w01/muse/costs.tsv`, row `l2-w01-story-page-a-nut` m5 line). The start time is later than that
  row. The maker does not choose or record a start time.
- The card try count reads only `out/storytime/l2/unit1/cards/muse/costs.tsv`, rows at or after
  `CARD_RUN.startTime`. The card spend reads that file and also
  `out/storytime/l2/unit1/cards/muse/elements/costs.tsv`, rows at or after `CARD_RUN.startTime`.
  The `elements` file stays empty, because the tool refuses card element calls (see "Guard
  interaction"). The scope is the folder plus the start time.

### Guard interaction

All rules below describe the code at commit `6d80fba0`.

- The restart scan (`scanCostFiles`) skips the direct child folder `cards` of
  `out/storytime/l2/unit1/`. The restart cap of 1.00 USD, which counts rows since
  `2026-11-04T07:54:00Z`, never counts card spend. The card cap never counts restart spend
  (review-b RB-1).
- The tool classifies each spec `outDir` by its resolved path (`classifyOutDir`). The class is
  `card` when the path resolves to `CARD_RUN.outDir`. The class is `restart` when the path
  resolves to `<unit root>/<child>/muse` or `<unit root>/<child>/muse/elements` for a child other
  than `cards`. A spec without `outDir` uses the w01 default. Every other path is `invalid`. The
  tool refuses a call with an `invalid` spec with exit code 3, before the key read and before any
  cost scan (review-b RB-2).
- `scripts/storytime-muse.mjs` picks `CARD_RUN` when every spec of a call has the class `card`.
- A call that mixes card specs and other specs exits with code 3 and makes no provider call.
- Below the child `cards`, only the exact card folder is valid (review-a RA2-1). The rule is
  active (Green `91b2a1ca`, test CG15). `out/storytime/l2/unit1/cards/muse/elements` and any other path below
  `cards/` are `invalid` and the tool refuses them. No card element call runs in this track.
- The guard projects the batch. It refuses the call when the spend plus (calls + cushion) x 0.01
  USD passes the cap. The value `calls` is the number of specs for a color call, and the number
  of specs x tries for a line-art call. The cushion is 1 for a color call (the line-art call that
  follows a passing color) and 0 for a line-art call. The CLI checks the guard again before each
  provider call in the pool and starts no new call after a refusal (review-b RB-3).
- The restart config (`RESTART_START` `2026-11-04T07:54:00Z`, cap 1.00 USD) and its tests stay
  unchanged. No restart call runs in this track.
- `scripts/storytime-judge-batch.mjs` gets one new flag: `--cards`. With `--cards`, the spec folder
  is `docs/storytime/l2-unit1/cards` and the try count uses `CARD_RUN`. Without `--cards`, the
  behavior stays unchanged (`SPEC_DIR` of the A-48 folder and `RESTART_START`).

### Preconditions

- Before the first Muse call (Task 5), the maker checks that the live Workbooks file
  `/home/daniebo/Desktop/Workbooks/content/storytime/l2/print/pictures.json` still has SHA-256
  `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf`. On a mismatch the maker
  stops and reports to the PM.
- This check is a shell step (`sha256sum`). It is not a test. No test reads a path outside the
  repository.

### Delivery

- Delivery folder: `out/storytime/l2/unit1/cards/delivery-muse-v1/`. It holds the 62 files under
  the row file names, each 1500 x 1500 PNG, and a `manifest.json` in the form of the week
  deliveries (`StorytimeManifest` in `src/storytime/book-pictures.ts`).
- Handoff folder: `/home/daniebo/Desktop/handoff/storytime-l2-card-pictures/`. It holds the 62
  files, `MANIFEST.txt`, and one contact sheet PNG of all 31 cards (color and line, labeled by
  word).
- `MANIFEST.txt` follows `/home/daniebo/Desktop/handoff/a48-forge-pictures-a/MANIFEST.txt`: the
  header fields, then the SHA-256, the pixel size, and the name of each file, then the failed rows
  and the spend.
- PNG and JPG files stay out of git.

### Drive backup

- A subfolder `cards` in the private Drive folder `1AWdjGVJrJcc35oY7cIAt_jPqyaLtyK9B`, made with
  the `gws` CLI.
- The maker checks the MD5 of every uploaded file against the local file. The mismatch count must
  be 0.
- The maker records a TSV in the form of
  `out/storytime/l2/unit1/drive-backup-2026-11-05.tsv` (columns: path, size_bytes, local_md5,
  drive_file_id, drive_md5). The new file is `out/storytime/l2/unit1/drive-backup-2026-11-06-cards.tsv`.

### Resource rules

- Muse calls, judge batches, and the delivery writer are light roles. They run with `node` and
  without `heavy-run.sh`.
- Full test suites and the typecheck run with
  `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh`. Exit code 75 means hold.
- The machine has 7.1 GB of RAM. One heavy job runs at a time.

## Fixture move (Task 1)

The tests `T180` in `tests/storytime-stage-check.test.ts` and the version 3 shadow test in
`tests/storytime-book-pictures.test.ts` read the Workbooks version 3 list from
`/tmp/opencode/wb-shadow/content/storytime/l2/print/pictures.json`. The `/tmp` file is not in git.
It was restored by hand before a green run.

- Source bytes: Workbooks commit `078917f1`, path `content/storytime/l2/print/pictures.json`.
  Author check: `git show 078917f1:content/storytime/l2/print/pictures.json | sha256sum` gives
  `c3e23cfdace136c7ed602b3aefee83383241833537ba56f0257668eb1e2c686b`. This value equals
  `LIST_V3_SHA256` in `tests/storytime-book-pictures.test.ts`.
- The copy is `tests/fixtures/storytime/pictures-v3.json`. The file name is fixed.
- `LIST_V3_SHADOW_FILE` (`tests/storytime-book-pictures.test.ts`, near line 4082) and
  `V3_SHADOW_FILE` (`tests/storytime-stage-check.test.ts`, near line 41) point at the repository
  copy.
- No test path names `/tmp/opencode/wb-shadow` after the move.

## Functional Requirements

1. **FR-1 Fixture.** Both test files read the version 3 list from
   `tests/fixtures/storytime/pictures-v3.json`. The fixture bytes equal Workbooks commit `078917f1`. Both test files behave as before when
   `/tmp/opencode/wb-shadow` is absent.
2. **FR-2 Card guard.** `scripts/storytime-muse-guards.mjs` exports `CARD_RUN` with the values
   of "Card run constant". It is the only owner of the values. `scripts/storytime-muse.mjs` picks
   `CARD_RUN` when every spec of a call has `outDir` `out/storytime/l2/unit1/cards/muse`. A call
   that mixes card specs and other specs exits with code 3. The card spend and the card try count
   read only the card cost files, rows at or after `CARD_RUN.startTime`. The restart scan skips
   the child folder `cards`. The tool classifies each `outDir` by its resolved path and refuses
   every `invalid` path, including any path below `cards/` other than the exact card folder, with
   exit code 3. The guard projects the batch (calls plus a cushion of 1 for a color call) against
   the cap, and the CLI checks the guard again before each provider call in the pool. The restart config
   (`RESTART_START` `2026-11-04T07:54:00Z`, cap 1.00 USD) and its tests stay unchanged.
3. **FR-3 Card specs.** 31 spec files exist in `docs/storytime/l2-unit1/cards/`. A test checks
   them against the repository copy of list v7, `tests/fixtures/storytime/pictures-v7.json`
   (SHA pin; the test checks the SHA first and a mismatch is a hard failure): ids, text, file
   names, size, aspect, `outDir`, and that every reference file exists. The test reads no path
   outside the repository.
4. **FR-4 Judge batch.** `scripts/storytime-judge-batch.mjs` imports `CARD_RUN` and has one new
   flag, `--cards`. With `--cards`, the spec folder is `docs/storytime/l2-unit1/cards` and the try
   count uses `CARD_RUN`. Without `--cards`, its behavior stays unchanged.
5. **FR-5 Calibration.** The two gate control files fail the judge before the first card judge
   batch. The result is recorded.
6. **FR-6 Color.** Each card has one passing color picture, or a reported failure after 3 tries.
7. **FR-7 Line art.** Each card with a passing color picture has one passing line-art picture, or a
   reported failure after 3 tries. The line art is black outlines on pure white, closed shapes, no
   gray, no text, and no line thinner than 12 px (Workbooks picture specification v1).
8. **FR-8 Delivery.** The delivery folder, the handoff folder, `MANIFEST.txt`, and the contact
   sheet exist as the Method section states. Every delivered PNG is 1500 x 1500 px.
9. **FR-9 Backup.** The Drive backup exists and the MD5 mismatch count is 0.
10. **FR-10 Spend.** The track spend stays at or below 1.60 USD. The report gives the total and
    the count of calls.
11. **FR-11 Report.** The PM gets the handoff path, the spend, and each failed row.
12. **FR-12 Wording.** No text claims that Daniel or Workbooks accepted a picture. The word
    "approved" does not describe a card picture in any track file or report.

## Non-Functional Requirements

- All new prose uses ASD-STE100.
- Commit explicit paths only. Other agents share the git index.
- Do not change `assets/fireball.ts` or `out/fireball/`.
- Do not run `./measure/generate.sh` during this track while foreign changes sit in
  `measure/generated/`. Closeout owns the generated facts.

## Owned paths

- `docs/storytime/l2-unit1/cards/`
- `out/storytime/l2/unit1/cards/`
- `scripts/storytime-muse-guards.mjs` and `scripts/storytime-muse-guards.d.mts`
- `scripts/storytime-muse.mjs` and `scripts/storytime-judge-batch.mjs`, only if needed
- New tests: `tests/storytime-card-*.test.ts`
- `tests/fixtures/storytime/` (`pictures-v3.json` and `pictures-v7.json`)
- The fixture constants in `tests/storytime-book-pictures.test.ts` (`LIST_V3_SHADOW_FILE`, near
  line 4082) and `tests/storytime-stage-check.test.ts` (`V3_SHADOW_FILE`, near line 41)
- `/home/daniebo/Desktop/handoff/storytime-l2-card-pictures/`
- `measure/tracks/asset_storytime_l2_cards_20261106/` and `measure/runs/asset_storytime_l2_cards_20261106/`

## Acceptance Criteria

- Both test files read the repository fixture. `grep -rn 'wb-shadow' tests scripts src` finds
  nothing. Both files pass with `/tmp/opencode/wb-shadow` absent.
- The card guard tests pass. The restart guard tests (`tests/storytime-muse-attempts.test.ts`)
  pass unchanged. `CARD_RUN` is the only holder of the card run values: a search of `scripts/` and
  `tests/` finds no second copy of `2026-11-06T00:00:00Z`, `1.6` as the card cap, or `0.8` as the
  card report point outside the guard module and its tests.
- The card spec test passes: 31 specs, the list v7 fixture SHA pin, every reference file exists.
  The test reads no path outside the repository.
- The live Workbooks list had the SHA-256 `ba3956fc…` before the first Muse call (the Task 5 shell
  step). The role log records the check.
- The calibration record shows both gate controls fail.
- 62 files exist in the delivery folder and in the handoff folder, each 1500 x 1500 px. Every file
  holds a judge pass, or the manifest lists the row as failed and the file stays out.
- `MANIFEST.txt` lists the SHA-256, the pixel size, and the name of each file, the failed rows, and
  the spend. `sha256sum -c` on its file lines gives OK for every file.
- The contact sheet shows all 31 cards, color and line art, with the word labels.
- The Drive backup TSV has one row for each uploaded file and 0 MD5 mismatches.
- The spend is at or below 1.60 USD and every call is in `costs.tsv`.
- The PM report names the handoff path, the spend, and each failed row.
- `./measure/doctor.sh` adds no error for this track.

## Human gate

Workbooks checks the cards after the delivery. That check is outside this track. The track claims
no Workbooks or Daniel acceptance. A card that Workbooks rejects needs a new order from the PM.

## Out of Scope

- The first 196 rows of list v7.
- Any change to the judge kit (`judge-prompt.md`, `cast.json`, `calibration-set.json`).
- New element sheets or new cast sheets. This track reuses the existing reference files.
- Card layout, the card kit, and the PDF. Workbooks owns them.
- Song, video, animation, and audio work.
- Any change to the Workbooks or monorepo repositories.
