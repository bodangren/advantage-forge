# Storytime Level 2 card pictures: report for the PM

Track: `asset_storytime_l2_cards_20261106`. Date: 2026-11-06.
This record is model evidence, not acceptance. Workbooks checks the cards.

## Hand-off

- Folder: `/home/daniebo/Desktop/handoff/storytime-l2-card-pictures/`.
- The folder holds 58 PNG files, `manifest.json`, `MANIFEST.txt`, and the contact sheet
  `storytime-l2-card-pictures-contact-sheet.png`.
- The contact sheet holds 31 cells: 29 cards with their color and line pictures, and 2 cells for
  the rows that failed.
- Drive backup: `cards/delivery-muse-v1` in the private folder `1AWdjGVJrJcc35oY7cIAt_jPqyaLtyK9B`.
  It holds 59 files. The MD5 mismatch count is 0.
- The TSV of the backup is `out/storytime/l2/unit1/drive-backup-2026-11-06-cards.tsv`.

## Spend

- Spend: 0.74 USD in 74 Muse calls.
- The cost rows are in `out/storytime/l2/unit1/cards/muse/costs.tsv`.
- The cap is 1.60 USD. The report point of 0.80 USD was not reached.

## What was delivered

- 29 of the 31 card rows. That is 58 of the 62 files.
- The Sonnet judge used the prompt version 6. The judge was calibrated first: both control files
  failed.
- The judge passed every delivered file.
- Two fails did not stand. A second judge that saw the file alone passed the goodbye color and
  the car line.

## Rows that failed

### l2-w04-card-ham

- The color of try 1 passed the judge.
- The three line tries each failed with two judges. Without color, the plain round slice reads as
  a plate, a pizza, or a pie.
- Best try: line try 1.

### l2-w04-card-family

- The color of try 1 passed the judge.
- Line try 1 passed the judge, but its strokes measure 4 px at 1500 px. Tries 2 and 3 gave 8 px
  and 7 px. The print gate is 12 px.
- Six full-body persons in one square make the lines thin.
- Best try: line try 1.

## Corner note for Workbooks

The class C rule asks for all four corners of a color file at 250 or higher. 22 of the 29 delivered
color files do not reach that. The corners are a faint near-white. The lowest value is 242 of 255.
Most of them sit at the bottom-left corner. The soft shadow of the render causes them.

| File | Corner value |
| --- | --- |
| l2-w04-card-mom-v1.png | 242 |
| l2-w04-card-dad-v1.png | 244 |
| l2-w04-card-grandma-v1.png | 245 |
| l2-w06-card-boat-v1.png | 245 |
| l2-w04-card-grandpa-v1.png | 246 |
| l2-w06-card-tomato-v1.png | 246 |
| l2-w07-card-doll-v1.png | 246 |
| l2-w01-card-teacher-v1.png | 247 |
| l2-w07-card-car-v1.png | 247 |
| l2-w07-card-mop-v1.png | 247 |
| l2-w07-card-otter-v1.png | 247 |
| l2-w07-card-train-v1.png | 247 |
| l2-w02-card-fan-v1.png | 248 |
| l2-w03-card-sheep-v1.png | 248 |
| l2-w04-card-jam-v1.png | 248 |
| l2-w04-card-sister-v1.png | 248 |
| l2-w05-card-dress-v1.png | 248 |
| l2-w05-card-sad-v1.png | 248 |
| l2-w01-card-boy-v1.png | 249 |
| l2-w01-card-hello-v1.png | 249 |
| l2-w03-card-pineapple-v1.png | 249 |
| l2-w04-card-brother-v1.png | 249 |

- The same rule holds for 28 of the 80 class C color files of the week deliveries. Daniel reviewed
  those.
- The orchestrator default is to deliver the files as they are. Workbooks decides at its check.
- The fix options are a corner whitening of the color files, or new color tries.

Question for the PM: does the class C white-corner rule apply to card color files? Default: no;
Workbooks decides at its check.

## Defaults for the PM

Both colors passed. Each option below needs a PM exception to the rule that the first passing try
is the delivery.

### l2-w04-card-ham

- Default: one new color try with a ham form that reads in line art, a ham leg with a bone end.
  Then up to 2 line tries. Cost: about 0.03 USD.
- Other options: Workbooks uses the color card only. Or Workbooks picks another word.

### l2-w04-card-family

- Default: one new color try that shows the six persons from the knees up, larger in the square.
  Then up to 2 line tries. Cost: about 0.03 USD.
- Other option: Workbooks uses line try 1, a judge pass with 4 px lines, as a thin-line exception.

## Notes for Workbooks

The judge recorded these small marks. Each one is a note, not a defect that needs a retry.

- Nan has a small smile on the hello card.
- Nan has a small smile on the goodbye card.
- The school bag of the goodbye card shows mostly as straps behind her body.
- The mustache of Grandpa hides most of his smile.
