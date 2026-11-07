Status: done. 19 of 19 family-word pictures delivered; spend 0.21 USD (total 0.95 USD of the 1.60 USD card limit).

# Storytime Advantage Level 2 family-word pictures: report for the PM

Track: `asset_storytime_l2_family_words_20261107`. Date: 2026-11-07.
This record is model evidence, not acceptance. Workbooks checks the pictures.

## Hand-off

- Folder: `/home/daniebo/Desktop/handoff/storytime-l2-family-word-pictures/`.
- The folder holds 22 files: 19 PNG files, `manifest.json`, `MANIFEST.txt`, and the contact sheet
  `storytime-l2-family-word-pictures-contact-sheet.png`.
- The contact sheet holds 19 cells, 5 cells per row, with the word under each card.
- The delivery folder `out/storytime/l2/unit1/family-words/delivery-muse-v1/` holds the same 19
  PNG files and the same `manifest.json`. The two folders hold equal bytes for all 20 shared
  files.
- The check `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -` in the handoff folder gave
  19 OK and 0 FAILED.
- Drive backup: none. The PM did not ask for one.

## Spend

- Calls: 21 Muse color calls. The track spend is 0.21 USD.
- The total of `out/storytime/l2/unit1/cards/muse/costs.tsv` is 0.95 USD in 95 calls.
- The cap is 1.60 USD. The report point of 0.80 USD was reached at the 6th new call. The maker
  recorded the total and continued, and stopped nowhere before the cap.

## What was delivered

- 19 of the 19 family-word rows. That is 19 color files, and no line art.
- Every delivered PNG is 1500 x 1500 px, 8-bit, 3 channels, srgb, with no alpha channel.
- The Sonnet judge used the prompt version 6. The judge was calibrated first: both control files
  failed.
- 15 rows passed the judge on color try 1, in
  `measure/runs/asset_storytime_l2_family_words_20261107/judge-fw-r1-color.json`.
- The arms row passed on color try 2, in
  `measure/runs/asset_storytime_l2_family_words_20261107/judge-fw-r2-color-arms.json`.
- The legs row and the feet row passed on color try 2, in
  `measure/runs/asset_storytime_l2_family_words_20261107/judge-fw-r2-color-legs-feet.json`.
- The family row reuses the color print of the card track. Its judge pass is in
  `measure/runs/asset_storytime_l2_cards_20261106/judge-cards-cards-r1-color.json`. No Muse call
  ran for it.

## The three try 2 decisions

The PM rule says a body-part picture shows a child pointing to the part. Three body-part rows
failed that rule on their first try. By the same rule in each case, the first try counts as a
failed try and the row gets a color try 2.

- **Arms.** The try 1 picture passed both judges, but both judges recorded that the pointing
  finger touches Nan's chest near the star and does not reach the raised arm. Try 2 holds one arm
  straight out to the side, with the index finger of the other hand on that arm.
- **Legs.** The try 1 picture showed Pat with both arms hanging. The judge note read "one hand
  hangs by the side with the finger pointing down". Try 2 shows Pat reaching down with both
  hands, with the index fingertip of each hand on the front of his leg.
- **Feet.** The try 1 picture showed Nan standing with both arms hanging. The judge note read
  "her arms hang down with the fingers pointing down ... The pointing is a weak action (note
  only)". Try 2 shows Nan sitting with both legs out, with the index fingertip of one hand on the
  toe of one shoe.

Only the picture sentences of the three `colorPrompt` files and their `goal` lines changed. No
other row changed, and no other row made a second call.

## The legs picture is the weakest one

The legs picture is the weakest pointing picture of the 19. The judge notes say the legs
fingertips rest at the shorts hem, and both judges record that they touch the thighs. The judge
passed it and called the two pointing hands a small mark, not a defect. This report names the
legs row so that the picture gets a close look in Daniel's 11-16 check.

## Rows that failed

None. Every row of the 19 has a judge pass.

## Corner note for Workbooks

The class C rule asks for all four corners of a color file at 250 or higher. 12 of the 19
delivered color files do not reach that. This is a report item, not a delivery gate.

| File | Lowest corner value |
| --- | --- |
| l2-w05-card-ears-v1.png | 215 |
| l2-w06-card-bird-v1.png | 244 |
| l2-w04-card-family-v1.png | 247 |
| l2-w06-card-horse-v1.png | 247 |
| l2-w07-card-kite-v1.png | 247 |
| l2-w01-card-friend-v1.png | 248 |
| l2-w05-card-legs-v1.png | 248 |
| l2-w06-card-dog-v1.png | 248 |
| l2-w06-card-duck-v1.png | 248 |
| l2-w07-card-ball-v1.png | 248 |
| l2-w05-card-feet-v1.png | 249 |
| l2-w05-card-nose-v1.png | 249 |

11 of these files hold the low value at the bottom-left corner only. Their corners are a faint
near-white from the soft shadow of the render. The ears file holds a faint gray gradient at all
four corners, and its lowest value is 215. The same class C rule held for 22 of the 29 delivered
color files of the card track, and Daniel saw those. The maker delivers the files as they are.
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
- The legs and the feet decision of 2026-11-07, after the contact sheet: the legs color try 1 and
  the feet color try 1 count as failed tries under the PM rule, because both pictures show
  hanging arms and the judge notes call the pointing weak.

## Human gate

Daniel sees the pictures in his 11-16 check. That check is outside this track. The track claims no
Workbooks or Daniel acceptance. The legs row is the one to look at first.

Facts changed: none.
