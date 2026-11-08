Status: done.

# Storytime Level 2 unit 2: final PM report

These pictures are model evidence, not acceptance. No file of this track claims that Daniel, the
PM, or Workbooks gave approval of a picture.

## Spend

Daniel's Go of 2026-11-08 opened the unit 2 spend. The PM holds the 25.21 USD unit stop, and that
stop also covers the Workbooks speech and songs. The Forge spend of this track is 4.50 USD.

| item | calls | spend USD | stop USD |
| --- | --- | --- | --- |
| book | 445 | 4.32 | 18.33 |
| app | 18 | 0.18 | 0.29 |
| Forge total | 463 | 4.50 | 25.21 (the PM holds the unit stop) |

### The book item

The book item spent 4.32 USD of the 18.33 USD stop. The guard needed no stop. The highest call cost
was 0.01 USD, under the 0.03 USD limit. The amounts come from the unit 2 `costs.tsv` rows.

| kind | calls | spend USD |
| --- | --- | --- |
| element sheet calls | 12 | 0.10 |
| color calls | 206 | 1.97 |
| line calls | 227 | 2.25 |
| all calls | 445 | 4.32 |

13 provider failures cost 0 USD. They still counted as tries:

- 2 line calls got HTTP 502: l2-w10-story-page-put-on-your-jacket and l2-w13-d4-prompt-jump.
- 9 color calls failed: 7 got HTTP 400 (the reference list held more than 10 items) and 2 got a
  network connect timeout. The 7 HTTP 400 rows are l2-w09-cover-yum, l2-w10-story-page-put-on-your-hat-pip,
  l2-w11-cover-where-is-pip, l2-w12-cover-open-your-book, l2-w13-story-page-pip-can-catch,
  l2-w15-story-page-look-pip-on-a-bike, and l2-w15-cover-look-a-bus. The 2 network timeouts are
  l2-w09-story-page-tom-can-see-the-mop and l2-w12-cover-the-hen-and-the-hat.
- 2 element color calls on set-nan-bedroom got a network connect timeout.

### The app item

The app item spent 0.18 USD of the 0.29 USD stop. The pool made 18 color calls: 18 ok, 0 failed, 0
refused. The highest call cost was 0.01 USD. The 0.23 USD report point was not reached, so no
projection was recorded. The 18 words of the paid media list each have one color picture.

## Rows done

The book list holds 229 rows. 220 rows are delivered: 173 new rows and 47 reuse rows. The delivery
holds 440 PNG files and one `manifest.json`. Every file has the class size (A and B 4000 x 3000, C
1500 x 1500), 8 bits per sample, no alpha channel, and the line files are grayscale.

3 rows use the despeckled print of the same line try: l2-w12-cover-open-your-book,
l2-w12-story-page-open-your-book-pip, and l2-w13-cover-look-at-me. The largest changed area of the
despeckle is below 0.05 percent of the picture for each row.

The app item holds 18 words. 18 of 18 are delivered: one color file of 1500 x 1500 px per word, and
one `manifest.json`. The judge gave 18 of 18 pass at color try 1, so no word needed a retry.

## The 9 rows out

These rows have no delivery entry. They have no tries left. Their best prints are in
`not-delivered/` and `README.md` names each file.

| row | best color | best line | why it is out |
| --- | --- | --- | --- |
| l2-w10-story-page-put-on-your-hat-pip | m2, color try 3, second judge pass | line try 1 | The color holds 9 children for 7 named. The line fails the judge: two judges count 9 children. |
| l2-w09-story-page-tom-can-see-the-mop | m1 | line try 2 (judge pass, 11 px) | Line try 3 is 19 px but fails the judge: Dad wears glasses. |
| l2-w09-card-rice | m1 | line try 2 (judge pass, 10 px) | Line try 3 is 15 px but fails the judge: the food reads as beans. |
| l2-w12-card-hippo | m1 | line try 3 (judge pass, 9 px) | The line is below the 12 px print gate. |
| l2-w12-card-ruler | m1 | line try 3 (judge pass, 8 px) | The line is below the 12 px print gate. |
| l2-w13-card-clap | m1 | line try 3 (judge pass, 11 px) | The line is below the 12 px print gate. |
| l2-w13-card-throw | m1 | line try 3 (judge pass, 11 px) | The line is below the 12 px print gate. |
| l2-w14-card-cold | m1 | line try 3 (judge pass, 9 px) | The line is below the 12 px print gate. |
| l2-w14-card-windy | m1 | line try 3 (judge pass, 9 px) | The line is below the 12 px print gate. |

## The two open PM questions

1. The hat-pip try exception. The row l2-w10-story-page-put-on-your-hat-pip has no color try left.
   The PM may grant one more color try for that row. Default: the row stays out.
2. The 9 rows. The 9 rows have no tries left. Options: (a) one more try for each (9 line calls and
   1 color call, about 0.10 USD; success is not sure for the thin cards); (b) accept the
   judge-passing thin line prints (8 to 11 px) of the 8 line rows with a writer exception; (c)
   thicken those 8 prints mechanically to 12 px (0 USD, a derived file); (d) leave the 9 rows to
   Workbooks with the best tries in not-delivered/. Default: (d) until the PM chooses.

## Folders

- Book delivery: `out/storytime/l2/unit2/delivery-muse-v1/`. It holds 220 rows, 440 PNG files, and
  `manifest.json`.
- Book hand-off: `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures/`. It holds 440 hard links
  of the delivered PNG files, `manifest.json`, 8 contact sheets, `not-delivered/`, `README.md`, and
  `MANIFEST.txt`. `sha256sum -c MANIFEST.txt` gives 468 OK and 0 FAILED.
- App delivery: `out/storytime/l2/unit2/family-words/delivery-muse-v1/`. It holds 18 PNG files named
  `<id>-v1.png` and `manifest.json`, with 18 manifest jobs and 6 color batches. Every file is
  1500 x 1500 px, 8-bit, and free of alpha.
- App hand-off: `/home/daniebo/Desktop/handoff/storytime-l2u2-family-word-pictures/`. It holds 18 hard
  links of the delivered PNG files, a copy of `manifest.json`, `contact-sheet.png`, and
  `MANIFEST.txt`. `sha256sum -c MANIFEST.txt` gives 20 OK and 0 FAILED.

## Facts changed

- Storytime Level 2 unit 2 picture spend: 4.50 USD (book 4.32, app 0.18).
- Unit 2 book pictures: 220 of 229 rows delivered; 9 rows wait for a PM decision.
- Unit 2 app family-word pictures: 18 of 18 delivered.
