Status: done. 19 of 19 family-word pictures delivered; spend 0.19 USD (total 0.93 USD of the 1.60 USD card limit).

# Storytime Level 2 family-word pictures: report for the PM

Track: `asset_storytime_l2_family_words_20261107`. Date: 2026-11-07.
This record is model evidence, not acceptance. Workbooks checks the pictures.

## Hand-off

- Folder: `/home/daniebo/Desktop/handoff/storytime-l2-family-word-pictures/`.
- The folder holds 19 PNG files, `manifest.json`, `MANIFEST.txt`, and the contact sheet
  `storytime-l2-family-word-pictures-contact-sheet.png`.
- The contact sheet holds 19 cells, 5 cells per row, with the word under each card.
- The delivery folder `out/storytime/l2/unit1/family-words/delivery-muse-v1/` holds the same 19
  PNG files and the same `manifest.json`. The two folders hold equal bytes for all 20 files.
- The check `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -` in the handoff folder gave
  19 OK and 0 FAILED.
- Drive backup: none. The PM did not ask for one.

## Spend

- Calls: 19 Muse color calls. The track spend is 0.19 USD.
- The total of `out/storytime/l2/unit1/cards/muse/costs.tsv` is 0.93 USD in 93 calls.
- The cap is 1.60 USD. The report point of 0.80 USD was reached at the 6th new call. The maker
  recorded the total and continued, and stopped nowhere before the cap.

## What was delivered

- 19 of the 19 family-word rows. That is 19 color files, and no line art.
- Every delivered PNG is 1500 x 1500 px, 8-bit, 3 channels, srgb, with no alpha channel.
- The Sonnet judge used the prompt version 6. The judge was calibrated first: both control files
  failed.
- 17 rows passed the judge on color try 1, in
  `measure/runs/asset_storytime_l2_family_words_20261107/judge-fw-r1-color.json` (18 files, 18
  pass, 0 fail; that file also holds the first try of the arms row).
- The arms row passed on color try 2, in
  `measure/runs/asset_storytime_l2_family_words_20261107/judge-fw-r2-color-arms.json`.
- The family row reuses the color print of the card track. Its judge pass is in
  `measure/runs/asset_storytime_l2_cards_20261106/judge-cards-cards-r1-color.json`. No Muse call
  ran for it.

## The arms decision

- The arms color try 1 passed both judges. The second judge on that file alone also passed it.
- Both judges recorded the same note: the pointing finger touches Nan's chest near the star, and
  it does not reach the raised arm.
- Orchestrator decision 2026-11-07: the PM rule says a body-part picture shows a child pointing to
  the part. The arms try 1 picture does not show that, so try 1 counts as a failed try under the PM
  rule, and the row got color try 2.
- Try 2 uses a new pose: one arm held straight out to the side at shoulder height, with the index
  finger of the other hand on that arm. Only the picture sentences of the arms `colorPrompt`
  changed, and the `goal` changed with them.
- Try 2 passed the judge. The fingertip rests on the forearm of the outstretched arm.
- The other 17 rows pass on try 1 and got no new call.

## Rows that failed

None. Every row of the 19 has a judge pass.

## Corner note for Workbooks

The class C rule asks for all four corners of a color file at 250 or higher. Ten of the 19
delivered color files do not reach that. This is a report item, not a delivery gate.

| File | Lowest corner value |
| --- | --- |
| l2-w05-card-ears-v1.png | 215 |
| l2-w06-card-bird-v1.png | 244 |
| l2-w04-card-family-v1.png | 247 |
| l2-w06-card-horse-v1.png | 247 |
| l2-w07-card-kite-v1.png | 247 |
| l2-w01-card-friend-v1.png | 248 |
| l2-w06-card-dog-v1.png | 248 |
| l2-w06-card-duck-v1.png | 248 |
| l2-w07-card-ball-v1.png | 248 |
| l2-w05-card-nose-v1.png | 249 |

Nine of these files hold the low value at the bottom-left corner only. The corners are a faint
near-white from the soft shadow of the render. The ears file holds a faint gray gradient at all four
corners, and its lowest value is 215. The same class C rule held for 22 of the 29 delivered color
files of the card track, and Daniel saw those. The maker delivers the files as they are.
Workbooks decides at its check.

## Defaults taken

The defaults of the specification and of the plan. Each one is open to a PM change.

- The 18 new rows write their tries to the card folder, so the existing guard enforces the cap.
- The 18 spec files live in `docs/storytime/l2-unit1/family-words/`, because a card spec test pins
  the cards folder to 31 files.
- The family picture is the card-track color print. No new call ran for it.
- No Drive backup. The PM did not ask for one.
- White corners of class C are a report item and not a gate (the card-track rule).
- The arms decision of 2026-11-07: the arms color try 1 counts as a failed try under the PM rule,
  because the picture does not show a child pointing to the part.

## Human gate

Daniel sees the pictures in his 11-16 check. That check is outside this track. The track claims no
Workbooks or Daniel acceptance.

Facts changed: none.
