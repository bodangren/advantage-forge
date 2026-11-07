# Specification: Storytime Level 2 family-word pictures (19 words)

## Overview

The Storytime app shows a family word with no picture as text only. 51 words have no picture
today. Workbooks covers 32 of them with cards, color patches, and number dots. This track draws
color pictures for the 19 words that remain, with the approved Storytime Muse path, and delivers
them to the PM. The date needed is 2026-11-10. Daniel sees the pictures in his 11-16 check.

This track follows the closed track `asset_storytime_l2_cards_20261106` (archived in
`measure/archive/`). That track holds the card spec form, the guard `CARD_RUN`, the judge flag
`--cards`, the delivery form, and the approved card pictures. This track reuses them. It changes
only the paths that the "Owned paths" list names.

The pictures are color only. No line art is made. 18 words get a new picture. The word family
reuses the color picture that the card track made and that passed the judge.

## Owner order

PM request 2026-11-07, word for word:

> WHAT: 19 Storytime family-word pictures for the app, color only, in the style of your approved card pictures (storytime_l2_cards, ~/Desktop/handoff/storytime-l2-card-pictures/): w01 friend; w04 family; w05 eyes, ears, nose, hands, arms, legs, feet; w06 cat, dog, bird, fish, frog, duck, horse; w07 ball, kite, drum. 1500 x 1500, the same file naming (l2-w0N-card-<word>-v1.png), a contact sheet, and a manifest. No line art needed.
> SPEND: the remaining part of Daniel's 1.60 USD card limit ("Go", 11-06): the card track spent 0.74 USD, so the hard stop is 0.86 USD more for these 19. Same rules: 3 attempts at most per picture, the first without a hard defect wins. Log the spend.
> RULES: characters keep the race-unmarked printed picture-book look (hair and clothes, never skin or ethnicity); body-part pictures show a child pointing to the part; no text in the picture.
> WHY: the app shows a family word with no picture as text only; 51 words have none today (Workbooks covers 32 with cards, color patches, and number dots).
> DONE WHEN: the 19 pictures are in ~/Desktop/handoff/storytime-l2-family-word-pictures/ with MANIFEST.txt (SHA-256), and the PM has one status line with the spend. Date: 11-10. Daniel sees them in his 11-16 check. Facts changed: none expected.

Date needed: 2026-11-10.

The word "approved" in the PM request names the card pictures of the card track, as the PM wrote it.
Track text does not use the word for a picture of this track (see FR-12).

## Inputs (read-only)

Forge reads these files and never changes them.

| File | SHA-256 | Source |
| --- | --- | --- |
| `tests/fixtures/storytime/pictures-v7.json` (copy of Workbooks list v7, 227 rows) | `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf` | Workbooks commit `95043edc` |
| `out/storytime/l2/unit1/cards/muse/l2-w04-card-family-m1-color-print.png` (the family picture, 1500 x 1500, 8-bit, no alpha) | `ab6067eedf8de3efebb40509c6032f81f7ecee178b212eac8c3727d40a8bff62` | card track, Muse call m1, color, 2026-11-06 |

Author check (2026-11-07): the PNG has the SHA-256 above and the size 1500 x 1500, 8-bit, 3
channels, no alpha. The card judge record
`measure/runs/asset_storytime_l2_cards_20261106/judge-cards-cards-r1-color.json` (31 files, 30
pass, 1 fail) holds a pass for `l2-w04-card-family` color try 1. The failed file of that record is
the goodbye color, and its second judge passed it. The family card failed only in line art.

Only the word family is a row of list v7 (`l2-w04-card-family`, use `card`, size class C). The 18
other words are not rows of list v7. The PM request is their row source. This track writes no
Workbooks file and proposes no list row.

## The 19 rows

Each row id is `l2-w0N-card-<word>`. Each delivered file is `<id>-v1.png`. Week and word come
from the PM request.

| # | Row id | Kind | Call | Subject | References |
| --- | --- | --- | --- | --- | --- |
| 1 | `l2-w01-card-friend` | person | new | Pat and Nan side by side, both smile, full body | Pat render, Nan look, Nan face |
| 2 | `l2-w04-card-family` | person | none (reuse) | the six family members of the card track | none |
| 3 | `l2-w05-card-eyes` | body part | new | Nan points to her eyes | Nan look, Nan face |
| 4 | `l2-w05-card-ears` | body part | new | Pat points to an ear | Pat render |
| 5 | `l2-w05-card-nose` | body part | new | Nan points to her nose | Nan look, Nan face |
| 6 | `l2-w05-card-hands` | body part | new | Pat holds up one open hand and points to it | Pat render |
| 7 | `l2-w05-card-arms` | body part | new | Nan raises one arm and points to it | Nan look, Nan face |
| 8 | `l2-w05-card-legs` | body part | new | Pat, full body, points down to a leg | Pat render |
| 9 | `l2-w05-card-feet` | body part | new | Nan, full body, points down to her feet | Nan look, Nan face |
| 10 | `l2-w06-card-cat` | animal | new | one cat | cat view |
| 11 | `l2-w06-card-dog` | animal | new | one dog (not Pip) | dog view |
| 12 | `l2-w06-card-bird` | animal | new | one small blue bird | bird sheet |
| 13 | `l2-w06-card-fish` | animal | new | one fish | fish view |
| 14 | `l2-w06-card-frog` | animal | new | one green frog | frog view |
| 15 | `l2-w06-card-duck` | animal | new | one white duck | ducks sheet |
| 16 | `l2-w06-card-horse` | animal | new | one white horse | horse sheet |
| 17 | `l2-w07-card-ball` | object | new | one red-and-yellow ball | toys sheet |
| 18 | `l2-w07-card-kite` | object | new | one red-and-yellow kite | toys sheet |
| 19 | `l2-w07-card-drum` | object | new | one small red drum with two sticks | toys sheet |

The row `l2-w04-card-family` is the only row with no Muse call. The other 18 rows each get one
to three color calls.

## Decisions and boundaries

- The picture path is the approved Storytime Muse path: `scripts/storytime-muse.mjs`
  (`meta/muse-image` through OpenRouter). Only `color` calls run. No `line`, `print`, `despeckle`,
  or `import` call runs for the 18 new rows.
- Each picture has the aspect `1:1`, the print size 1500 x 1500, and a pure white `#FFFFFF`
  background (size class C of Workbooks picture specification v1).
- No letters, words, or numbers appear in any picture.
- Forge writes only inside this repository and the handoff folder. No Workbooks or monorepo file
  changes. No bucket upload, deployment, or public release.
- No Drive backup. The PM did not ask for one. This is a recorded default. The card track made
  one because its order named it.
- No song or video command runs.
- PNG and JPG files stay out of git.
- The delivery is model evidence. It is not acceptance. No text of this track may claim that
  Daniel or Workbooks accepted a picture.
- The rating is G. Every picture suits a five-year-old child.

## Method

### Spec files

18 spec files sit in `docs/storytime/l2-unit1/family-words/<id>.json`, one for each new row. The
form is the form of the card specs in `docs/storytime/l2-unit1/cards/`. The cards folder stays
at its 31 files: the card spec test pins that folder. The word family has no new spec file. Its
card spec stays in the cards folder.

Each file has `id`, `text` (the word), `pageText` (the word), `use` (`card`), `goal`, `mustShow`,
`deliverAs` (`<id>-v1.png`), `references`, `colorPrompt`, `print` (`crop`), `aspect` (`1:1`),
`printSize` (`[1500, 1500]`), and `outDir` (`out/storytime/l2/unit1/cards/muse`). No file has a
`linePrompt`. The `goal` states the one subject or the one pointing child that the picture shows.
The `mustShow` phrases name the word, the subject, and the part that the child points to.

### Prompts

- A prompt follows the card prompt of the same kind in `docs/storytime/l2-unit1/cards/`: one
  subject large in the middle, the whole subject in view, a pure white background with a wide
  empty margin, a soft shadow or none, no text, no letters, no numbers, no logos, rated G, and the
  soft, round, bright 3D render look of the book.
- Person prompts name each person by hair and clothes only. No prompt of any row holds a word for
  skin color, race, or ethnicity. The test checks the words `skin`, `race`, `racial`, `ethnic`,
  `ethnicity`, and `complexion` as whole words, in every text field of every spec file. The card prompts hold the sentences "Do not change anyone's skin tone, hair, or
  clothes" and "pale skin flap". The person specs of this track use "Do not change anyone's hair
  or clothes" and "a tiny dark tick mark at the outer corner of an eye". The cast look comes from
  the reference pictures.
- The look of each child follows `docs/storytime/l2-unit1/judge/cast.json` (the `nan` and `pat`
  notes) and the reference files of the card specs `l2-w01-card-girl` (Nan) and `l2-w01-card-boy`
  (Pat). Nan has two round buns with smooth red ring bands, an orange T-shirt with a white star,
  red shorts, and white sneakers. Pat has short messy black hair with a fringe, a green T-shirt,
  brown cargo shorts, and brown sandals. The prompt for Pat says that he holds no teddy bear and
  carries no bag. The prompt for Nan keeps her one short eyelash flick at each outer eye corner,
  as the card specs do.
- A pointing child points with one hand, and the pointing hand has one clear index finger and
  other fingers curled. The pointing hand never covers the named part.
- A hand of a child that is open shows five clear short fingers and a thumb.

### Person rows

The author of the specs picks the cast child for each body-part row. The choice is a decision of
this specification:

| Row | Child | View | What the child does |
| --- | --- | --- | --- |
| friend | Pat and Nan | full body, side by side, both face the camera | both smile, they stand close, no touch needed |
| eyes | Nan | head and shoulders | points with one finger at her eyes; both eyes stay in clear view |
| ears | Pat | head and shoulders | points with one finger at one ear; both ears show |
| nose | Nan | head and shoulders | points with one finger at her nose |
| hands | Pat | waist up | holds up one open hand, palm toward the viewer; the other hand points to it |
| arms | Nan | waist up | raises one arm, bent at the elbow; the other hand points to that arm |
| legs | Pat | full body | stands and points down with one finger to one leg; both legs show |
| feet | Nan | full body | stands and points down with one finger to her feet; both shoes show |

The named part is large and clear in each picture. The picture shows exactly one child, except
the friend row, which shows exactly two.

### Animal and object rows

Each of the 10 animal and object rows shows one subject, whole and in full view. Each row has
one reference file, because a delivered book picture shows the same animal or object (a check
row or a story page). The reference files decided for each row:

| Row | Reference file | Handling in the prompt |
| --- | --- | --- |
| cat | `out/cat/views/three-quarter.png` | the check-row wording of `docs/storytime/l2-unit1/w01/muse/l2-w01-check-row-cat.json`; ignore the gray background |
| dog | `out/dog/views/three-quarter.png` | the check-row wording of `l2-w01-check-row-dog.json`; a dog, not the puppy Pip; ignore the gray background |
| fish | `out/fish/views/side.png` | the check-row wording of `l2-w01-check-row-fish.json`; ignore the gray background |
| frog | `out/frog/views/three-quarter.png` | the reference of the w06 story page "I can see a frog"; ignore the gray background |
| bird | `out/storytime/l2/unit1/w06/muse/elements/prop-blue-bird-sheet-m1-color.png` | draw one bird only, from the sheet |
| duck | `out/storytime/l2/unit1/w02/muse/elements/prop-ducks-sheet-m1-color.png` | draw one white duck only, from the sheet |
| horse | `out/storytime/l2/unit1/w06/muse/elements/prop-white-horse-sheet-m1-color.png` | draw one white horse only, from the sheet; no fence and no meadow |
| ball, kite, drum | `out/storytime/l2/unit1/w07/muse/elements/prop-toys-sheet-m1-color.png` | draw only the named toy from the sheet: the red-and-yellow ball; the red-and-yellow kite with its short tail of small red bows; the small red drum with two wooden sticks |

The dog row has no link to Pip. No animal or object has a face unless the reference shows one
(the duck, the bird, the fish, the frog, the cat, the dog, and the horse show their natural
eyes).

### Reference files for the people

All reference files exist. They stay at these paths.

| Reference | File |
| --- | --- |
| Pat render | `out/storytime-review/batch-22/sprout-pat-render.png` (leave his teddy bear out) |
| Nan look | `out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-look-reference.png` |
| Nan face | `out/storytime/l2/unit1/w01/muse/elements/nan-ref-clean-face-crop.png` |

The friend row uses all three. A row of Pat uses the Pat render. A row of Nan uses the Nan look
and the Nan face.

### Judge

- The judge is the frozen Sonnet judge kit: `docs/storytime/l2-unit1/judge/judge-prompt.md`
  (version 6) and `cast.json`. The folder `docs/storytime/l2-unit1/judge/` stays frozen. This
  track changes no file in it.
- The batches run through `scripts/storytime-judge-batch.mjs` at card size: a 360 px long side
  (`longSideOf`, use `card`).
- Calibration first. Before the first judge batch, the maker runs the two gate control files of
  `calibration-set.json` through the judge once and records the result. The controls are the
  `a-nose` version 1 line art (no nose) and the `nan-can-get-a-pan` m3 line art try 1 (no pan
  handle). Both must fail. This step costs no Muse spend. If a control passes, the maker stops
  and reports to the PM. No new picture is judged on an uncalibrated judge.
- Daniel's bar of 2026-11-01 applies. Only what a teacher or a child sees at card size is a
  defect. A small mark is a note and not a retry.
- A fail stands only if a second judge that looks at the file alone also fails it.
- A judge result is model evidence. It is not acceptance.
- The family picture has its judge pass in the card record (see "Inputs"). No new judge batch
  runs for it.

### Judge batch input

`scripts/storytime-judge-batch.mjs` gets one new flag: `--family-words`. With `--family-words`:

- the spec folder is `docs/storytime/l2-unit1/family-words`;
- the tries start at `CARD_RUN.startTime`, as with `--cards`;
- the tool reads `out/storytime/l2/unit1/cards/muse/costs.tsv` to find the tries, as with
  `--cards`, and writes no cost file.

The flags `--cards` and `--family-words` together are an error: the command stops with exit code
1 and writes no file. Without `--family-words`, the behavior stays unchanged. The `specDir`
option of `buildBatch` stays as it is.

### Tries and spend

- The first try without a hard defect (a judge pass) is the delivery.
- Each of the 18 new rows gets at most 3 color tries. No line art is made.
- A row that fails after its tries is reported with its best try. It is not delivered.
- A judge fail stands only if the second judge also fails the file (see "Judge").
- The spend limit has one owner: `CARD_RUN` in `scripts/storytime-muse-guards.mjs` (cap 1.60 USD,
  start `2026-11-06T00:00:00Z`, `maxTries` 3, `outDir` `out/storytime/l2/unit1/cards/muse`). The
  18 new specs name that `outDir`. The guard counts every call in that folder. The card track
  made 74 calls for 0.74 USD, so the guard allows 0.86 USD more. This track changes no value of
  `CARD_RUN`.
- The spend of this track is the sum of `usage_cost` of the rows of `costs.tsv` whose row id is
  one of the 18 new ids. The sum of the whole file is 0.74 USD plus that spend and stays at or
  below 1.60 USD.
- One color call costs about 0.01 USD. The minimum is 18 calls (0.18 USD). The maximum is 54
  calls (0.54 USD), which is below the allowed 0.86 USD.
- The guard report point of 0.80 USD in `CARD_RUN` is reached after about 6 calls, because 0.74
  USD is already spent. At that point the maker continues. The maker records the total, the
  track spend, and the projection in its role log once, and does not stop. The maker stops only
  at the guard cap of 1.60 USD.
- A failed call with cost 0 does not count as a try.
- The maker logs every call and its cost in `out/storytime/l2/unit1/cards/muse/costs.tsv`. The
  rows of the card track in that file stay unchanged.

### Guard interaction

No guard code changes. The 18 specs have the class `card` (`classifyOutDir`), so the tool uses
`CARD_RUN`. A color call of the 18 specs projects the spend plus (calls + 1) x 0.01 USD against
the cap of 1.60 USD. A test checks that the 18 spec `outDir` values classify as `card`.

### Preconditions

- Before the first Muse call, the maker checks that `tests/fixtures/storytime/pictures-v7.json`
  has the SHA-256 `ba3956fc10de8f0c37ccdbd6cd70b1c11d35a1a67608e0aa3d0fe3d410078ddf` and that the
  family PNG has the SHA-256 `ab6067eedf8de3efebb40509c6032f81f7ecee178b212eac8c3727d40a8bff62`.
  On a mismatch the maker stops and reports to the PM.
- The check is a shell step (`sha256sum`). No test reads a path outside the repository.
- The guard check of `costs.tsv` before the first call: the file holds 74 call rows and the sum is
  0.74 USD. The maker records both values. A different value is a report item and not a stop,
  because the guard counts the file as it is.

### Delivery

- Delivery folder: `out/storytime/l2/unit1/family-words/delivery-muse-v1/`. It holds one 1500 x
  1500 PNG for each delivered row, under the row file name `<id>-v1.png`, and a `manifest.json`
  in the form of the cover delivery: the `StorytimeManifest` of `src/storytime/book-pictures.ts`
  with the color batch only.
- The writer is a new exported function `deliverMuseColorSet` in `src/storytime/muse-delivery.ts`.
  It takes the same inputs as `deliverMuseCover` (approvals, `museRoot`, `deliveryRoot`) with
  many entries. Each entry holds `rowId`, `version` (the Muse `m<n>`), `colorPrint` (a plain file
  name in the Muse folder), `text`, `sourcePrompt`, `reviews`, and `notes`. The caller fills `text`
  and `sourcePrompt` from the spec file of the row (see "Manifest job values"). The function:
  - copies each color print byte for byte under the name `<rowId>-v1.png`;
  - checks each print with `inspectColorPrint` against the size class C size 1500 x 1500
    (`PICTURE_SIZES.small`), 8-bit, no alpha channel;
  - refuses a duplicate `rowId`, a `rowId` that does not match `l2-w0N-card-<word>` (N is 1 to 9),
    a file name with a folder part, a symlinked delivery folder, and an existing delivered file,
    and writes nothing when any check fails;
  - writes a `manifest.json` that holds one color batch and no line-art batch.
  The functions `writeMuseDelivery` and `deliverMuseCover` stay unchanged.

#### Manifest job values

The 18 new ids are not rows of the picture list, so `rowCaptureJob` does not build their jobs.
The writer builds one `StorytimeJob` for each entry. The values follow the form of the card
delivery, `out/storytime/l2/unit1/cards/delivery-muse-v1/manifest.json` (the job
`l2-w07-card-teddy` holds week 7, `bookKind` `readalong`, `bookTitle` empty, page 0, `characters`
empty, `sourcePackage` and `sourceSha256` empty, `slug` equal to the id, `directory` `w07`, `use`
`small`, and `size` `small`). The 19 jobs hold these values:

| Field | Value |
| --- | --- |
| `id` | the row id |
| `week` | N of `l2-w0N-` as a number |
| `directory` | `w0N` |
| `bookKind` | `readalong` |
| `bookTitle` | empty string |
| `page` | 0 |
| `text` | the `text` of the spec file (the word) |
| `sourcePrompt` | the `goal` of the spec file |
| `characters` | empty list |
| `sourcePackage` | empty string |
| `sourceSha256` | empty string |
| `slug` | the row id |
| `use` | `small` |
| `size` | `small` |

The family job takes `text` and `sourcePrompt` (the `goal`) from
`docs/storytime/l2-unit1/cards/l2-w04-card-family.json`. The `sourcePrompt` of a job here is the
spec `goal`, not the list prompt, because the 18 new rows have no list prompt. This is a recorded
difference from the card delivery, where the list prompt filled the field. The color batch holds
one candidate for each job, and the manifest holds no line-art batch.
- The family entry reads the file `l2-w04-card-family-m1-color-print.png` in the Muse folder. The
  18 new entries read the `-m<n>-color-print.png` file of the passing try.
- The handoff folder is `/home/daniebo/Desktop/handoff/storytime-l2-family-word-pictures/`. It
  holds the delivered PNG files, `manifest.json`, `MANIFEST.txt`, and one contact sheet PNG
  `storytime-l2-family-word-pictures-contact-sheet.png`.
- `MANIFEST.txt` follows `/home/daniebo/Desktop/handoff/storytime-l2-card-pictures/MANIFEST.txt`: the
  header fields, then the SHA-256, the pixel size, and the name of each file in the form that
  `sha256sum -c` reads, then the failed rows and the spend. The header names the card track as
  the source of the family file and gives its SHA-256.
- The contact sheet shows each delivered picture, color only, with the word under it, four tiles
  in each row. It has one tile for each delivered row (19 when no row fails).
- The maker writes `MANIFEST.txt` and the contact sheet with a script that stays in
  `measure/runs/asset_storytime_l2_family_words_20261107/`. The script has no test. The checker
  runs the acceptance commands of "Acceptance Criteria".
- Class C white corners: a color file with a corner pixel below 250 is a report item and not a
  gate (the rule of the card track). The report lists each such file with its lowest corner
  value, and `MANIFEST.txt` holds the same note.

### PM report

The record `measure/runs/asset_storytime_l2_family_words_20261107/pm-report.md` holds the one
status line for the PM and the facts behind it: the handoff path, the count of delivered rows,
the spend of this track and the total in `costs.tsv`, the count of calls, each failed row with
its best try, the white-corner list, and the statement that the delivery is model evidence and
that Daniel sees the pictures in his 11-16 check. The statement "Facts changed: none" appears,
unless a row failed.

### Resource rules

- Muse calls, judge batches, and the delivery writer are light roles. They run with `node` and
  without `heavy-run.sh`.
- Full test suites and the typecheck run with
  `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh`. Exit code 75 means hold.
- The machine has 7.1 GB of RAM. One heavy job runs at a time.

## Functional Requirements

1. **FR-1 Specs.** 18 spec files exist in `docs/storytime/l2-unit1/family-words/`, one for each
   new row, with the fields of "Spec files". A test checks: the 18 file names, `id` equal to the
   file name, `text` equal to the word, `use` `card`, `deliverAs`, `aspect` `1:1`, `printSize`
   `[1500, 1500]`, `outDir` equal to `CARD_RUN.outDir`, no `linePrompt`, that every reference file
   exists and matches the "Reference files" tables of this specification, and that
   `classifyOutDir` returns `card` for each `outDir`. The test reads no path outside the
   repository. The test checks the SHA-256 of the list v7 fixture first. It also checks that
   `l2-w04-card-family` is a row of the fixture and that none of the 18 ids is a row.
2. **FR-2 Prompt rules.** The test checks every text field of the 18 specs: no whole word of the
   forbidden list of "Prompts"; the phrases "no text", "no letters", and "pure white" in each
   `colorPrompt`; the phrase "rated G" in each `colorPrompt`; and, for the person rows, the child
   name and the clothes of the cast note (Nan: orange T-shirt and red shorts; Pat: green T-shirt
   and brown cargo shorts).
3. **FR-3 Cards folder.** The folder `docs/storytime/l2-unit1/cards/` still holds exactly the 31
   card spec files, and the card spec test passes without change.
4. **FR-4 Judge batch.** `scripts/storytime-judge-batch.mjs` accepts `--family-words` as the
   section "Judge batch input" states. A test covers the flag, the spec folder, the try start,
   the error with `--cards`, and the unchanged behavior without the flag.
5. **FR-5 Delivery writer.** `deliverMuseColorSet` behaves as the section "Delivery" states. Tests
   cover the happy path (many entries, one color batch, byte-equal copies, names), a wrong size,
   an alpha channel, a duplicate row, a row id outside the form `l2-w0N-card-<word>`, a path with
   a folder part, an existing file, a symlinked delivery folder, and a failed check that leaves
   the folder empty. One test pins every job value of "Manifest job values" for at least one
   person row (`l2-w01-card-friend` or a body-part row), one animal row (for example
   `l2-w06-card-cat`), and the family row, and checks that the manifest holds the color batch
   only (no batch of the output kind `line`).
6. **FR-6 Calibration.** The two gate control files fail the judge before the first judge
   batch. The result is recorded.
7. **FR-7 Color.** Each of the 18 new rows has one judged passing color picture, or a reported
   failure after 3 tries.
8. **FR-8 Family.** The family picture is the card-track file, with the SHA-256 of "Inputs". No
   Muse call runs for it. The delivery manifest holds its SHA-256.
9. **FR-9 Delivery.** The delivery folder, the handoff folder, `MANIFEST.txt`, and the contact
   sheet exist as "Delivery" states. Every delivered PNG is 1500 x 1500 px.
10. **FR-10 Spend.** The track spend stays at or below 0.86 USD, and the total of `costs.tsv`
    stays at or below 1.60 USD. The report gives both values and the count of calls.
11. **FR-11 Report.** The PM gets one status line with the handoff path, the count of delivered
    rows, the spend, and each failed row.
12. **FR-12 Wording.** No text claims that Daniel or Workbooks accepted a picture. The word
    "approved" does not describe a picture of this track in any track file or report. It may
    appear in a quotation of the PM request, where it names the card pictures of the card track,
    and in the phrase "the approved Storytime Muse path", which names the method and not a
    picture.

## Non-Functional Requirements

- All new prose uses ASD-STE100.
- Commit explicit paths only. Other agents share the git index.
- Do not change `assets/fireball.ts` or `out/fireball/`.
- Do not change `docs/storytime/l2-unit1/judge/`, `docs/storytime/l2-unit1/cards/`,
  `scripts/storytime-muse-guards.mjs`, or `scripts/storytime-muse.mjs`.
- Do not run `./measure/generate.sh` during this track while foreign changes sit in
  `measure/generated/`. Closeout owns the generated facts.

## Owned paths

- `docs/storytime/l2-unit1/family-words/`
- `out/storytime/l2/unit1/family-words/`
- The new rows of `out/storytime/l2/unit1/cards/muse/` (the new `l2-w0N-card-<word>-m<n>-*` files
  and the new rows of `costs.tsv` only; the card-track files and rows stay unchanged)
- `scripts/storytime-judge-batch.mjs`, only for the flag `--family-words`
- `src/storytime/muse-delivery.ts`, only for `deliverMuseColorSet`
- New tests: `tests/storytime-family-word-*.test.ts`
- `/home/daniebo/Desktop/handoff/storytime-l2-family-word-pictures/`
- `measure/tracks/asset_storytime_l2_family_words_20261107/` and
  `measure/runs/asset_storytime_l2_family_words_20261107/`

## Acceptance Criteria

- The family-word spec tests and the judge batch tests pass. The card tests
  (`tests/storytime-card-specs.test.ts`, `tests/storytime-card-guards.test.ts`) and the delivery
  tests (`tests/storytime-muse-delivery.test.ts`) pass unchanged.
- `git diff` of the track shows no change in `docs/storytime/l2-unit1/judge/`,
  `docs/storytime/l2-unit1/cards/`, `scripts/storytime-muse-guards.mjs`, or
  `scripts/storytime-muse.mjs`.
- The role log records the two SHA-256 checks of "Preconditions" and the cost file check.
- The calibration record shows both gate controls fail.
- No spec, prompt, or role log of this track holds a forbidden word of FR-2 (the test result is
  the evidence for the specs).
- Every delivered file has a judge pass in a record file, or the manifest and the report list the
  row as failed and the file stays out. The family file has the pass of the card record.
- The delivery folder and the handoff folder hold the same PNG files, each 1500 x 1500 px, 8-bit,
  no alpha channel, and a `manifest.json` with the color batch only.
- `MANIFEST.txt` lists the SHA-256, the pixel size, and the name of each file, the failed rows,
  and the spend. `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -` gives OK for every
  file.
- The contact sheet shows every delivered picture with its word label.
- The track spend is at or below 0.86 USD, the total of `costs.tsv` is at or below 1.60 USD, and
  every call is in `costs.tsv`.
- The PM report holds the one status line, the handoff path, the spend, and each failed row.
- `git ls-files` of the delivery shows no PNG or JPG file added by this track.
- `./measure/doctor.sh` adds no error for this track.

## Human gate

Daniel sees the pictures in his 11-16 check. That check is outside this track. The track claims
no Workbooks or Daniel acceptance. A picture that Daniel rejects needs a new order from the PM.

## Out of Scope

- Line art for any of the 19 words.
- The other 32 words that Workbooks covers, and the words that stay without a picture.
- A new row in the Workbooks picture list, and any change to the Workbooks or monorepo
  repositories.
- Any change to the judge kit, the guard values, the card specs, or the card track files.
- New element sheets or new cast sheets. This track reuses the existing reference files.
- A Drive backup.
- Card layout, the card kit, and the PDF. Workbooks owns them.
- Song, video, animation, and audio work.
