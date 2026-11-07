Status: done. Family line art delivered (try 4, 12 px); ham line art failed after 2 more tries (best
try 5 named, ham color file added for the greyscale fallback); spend 0.03 USD (total 0.98 USD of
1.60 USD).

# PM report: Storytime L2 card line-art retry

Date: 2026-11-07. Track: `asset_storytime_l2_card_line_retry_20261107`.

## Handoff

- Handoff folder: `/home/daniebo/Desktop/handoff/storytime-l2-card-pictures/`.
- The folder holds 61 PNG files: 30 color files, 30 line files, and the ham color file.
- `MANIFEST.txt` holds 61 file lines and the notes. `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt |
  sha256sum -c -` gives OK for every file.
- `manifest.json` in the handoff folder equals the `manifest.json` of
  `out/storytime/l2/unit1/cards/delivery-muse-v2/` (SHA-256 `e60b10efb37e7e5754d9205038b7b17b16c53b59a08e28ecb14ce6861d1fc6f6`).
- The contact sheet `storytime-l2-card-pictures-contact-sheet.png` holds 31 cells: 30 color+line
  pairs, and the ham cell with its color and the words "line art failed".

## Spend

- This track: 4 cost rows since `2026-11-07T02:00:00Z`, 3 paid calls, 0.03 USD.
- The total of `costs.tsv`: 0.98 USD in 99 rows. The guard cap is 1.60 USD. The PM limit of 0.05
  USD for this track was not reached.

## Calls

| Try | File | Width | Cost | Judge result |
| --- | --- | --- | --- | --- |
| Ham line try 4 | `l2-w04-card-ham-m1-line-4.png` | 27 px | 0.01 USD | fail, two judges |
| Family line try 4 | `l2-w04-card-family-m1-line-4.png` | 12 px | 0.01 USD | pass |
| Ham line try 5, first call | no file | - | 0 USD | network failure, not a try |
| Ham line try 5, repeat | `l2-w04-card-ham-m1-line-5.png` | 36 px | 0.01 USD | fail, two judges |

The widths are the median stroke width of the 1500 x 1500 print files, measured with
`inspectLineArtPng` (gate 12 px).

## Judge results

- Ham try 4: `fail`, class `wrong-or-missing-prop`. The judges see a round disc with a wavy
  scalloped edge and an inner ring. They read it as a pie, a tart, or a ball. Files:
  `judge-cards-retry-ham-t4.json` and `judge-cards-retry-ham-t4-second.json`.
- Ham try 5: `fail`, class `wrong-or-missing-prop`. The judges see an oval with a rim and three
  wavy lines. They read it as a plate, a lid, a bowl, a bun, or a ball. Files:
  `judge-cards-retry-ham-t5.json` and `judge-cards-retry-ham-t5-second.json`.
- Family try 4: `pass`. The judges see six people in one row with clear faces and no text. File:
  `judge-cards-retry-family-t4.json`.

The judge is model evidence. It is not acceptance.

## Failed row and best try

- The ham row fails. It used its 2 retry tries, and both tries failed two judges.
- Best try by the spec rule (fewest hard defects; a tie goes to the later try): try 5,
  `out/storytime/l2/unit1/cards/muse/l2-w04-card-ham-m1-line-print-5.png`, 36 px.
- The handoff holds the ham color print as `l2-w04-card-ham-v1.png`. Workbooks makes the
  greyscale fallback from it.
- The family row is delivered at try 4: `l2-w04-card-family-v1.png` and
  `l2-w04-card-family-line-v1.png`.

## The ham `mustShow` difference

The ham spec lost the phrase "a small white plate" from `mustShow`, because the PM ordered a slice
with no plate. The phrases "one slice of ham" and "a slice of pink ham" stay. The delivered ham
color picture keeps its plate. The line art has no plate.

## Builder note

The zero-cost network failure row holds builder position 5. The batch builder therefore selected
the try 5 picture with `--try 6`, and the judge copy is named
`l2-w04-card-ham-line-t6.png`. The frozen builder did not change. The judge copy has the same
pixels as a 360 px copy of the try 5 Muse file.

## Corner values

- The new color files below 250: `l2-w04-card-family-v1.png` at 247, at the bottom-left corner.
  The ham color file is 254. The family line file is 255.
- This is a report item, not a gate. The old corner note of the card handoff keeps its 22 files,
  and the family file is the 23rd.

## Facts changed

- The card handoff folder now holds the family color and line pair and the ham color file.
- `manifest.json` and `MANIFEST.txt` of the handoff folder changed.
- The delivered card rows move from 29 to 30. The ham row stays color only.
- The spend total moves from 0.95 USD to 0.98 USD.

The delivery is model evidence. Workbooks checks the pictures.
