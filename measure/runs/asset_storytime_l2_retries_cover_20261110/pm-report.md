Status: done.

# Storytime Level 2 unit 2 picture retries and the teacher cover front art

Track: `asset_storytime_l2_retries_cover_20261110`. Phase 2. Report date: 2026-11-10.

## The spend

| item | calls | stop | spend |
| --- | --- | --- | --- |
| a, the retry rows | 13 | 0.15 USD | 0.10 USD |
| b, the cover tries | 6 | 0.10 USD | 0.06 USD |
| total | 19 | | 0.16 USD |

No call was above 0.03 USD. The spend log is
`measure/runs/asset_storytime_l2_retries_cover_20261110/spend-log.tsv`.

## The rows done for item (a)

The retry delivery holds 4 rows. Each row has a color print and a line print.

- `l2-w13-card-throw`: the color print of m1 and the line print of line try 4.
- `l2-w14-card-windy`: the color print of m1 and the line print of line try 4.
- `l2-w09-story-page-tom-can-see-the-mop`: the color print of m1 and the line print of line try 5.
- `l2-w09-card-rice`: the color print of m1 and the line print of line try 5.

The delivery folder is `out/storytime/l2/unit2/delivery-muse-v1-retry1/`.
The hand-off folder is `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1/`.

## The 5 fail rows

Each fail row keeps its best try in the `not-delivered/` folder of the retry hand-off.
The judge result is model evidence, not acceptance.

- `l2-w12-card-hippo`: the best try is the color m1 and the line print of line try 4. The line print
  passes the judge and fails the print gate at 9 px. The gate needs 12 px. The row has no more tries.
- `l2-w12-card-ruler`: the best try is the color m1 and the line print of line try 4. The line print
  passes the judge and fails the print gate at 8 px. The gate needs 12 px. The row has no more tries.
- `l2-w13-card-clap`: the best try is the color m1 and the line print of line try 3. The line print
  passes the judge and fails the print gate at 11 px. The gate needs 12 px. The row has no more tries.
- `l2-w14-card-cold`: the best try is the color m1 and the line print of line try 4. The line print
  passes the judge and fails the print gate at 10 px. The gate needs 12 px. The row has no more tries.
- `l2-w10-story-page-put-on-your-hat-pip`: the best try is the color m3 of color try 5 and the line
  print of line try 2. The line print fails the judge with the class wrong-character. Teacher Kim has
  big curly hair, and the cast gives smooth hair in a low ponytail. The second judge fails the same
  file with the same class. The row has no more tries.

## The cover file

The cover file is `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/l2-u1-cover-quest-teacher-front-forge-v1.png`.
Its SHA-256 is `c91719903d3803bc02498f8e097528c9a64ddae263102ebf28d06d8d37f11a53`.
The file is a hard link of `out/storytime/covers/teacher-front/muse/l2-u1-cover-quest-teacher-front-m6-color-print.png`.
The file is PNG, 2480 x 3508 px, RGB, with no alpha.

The source try is m6, the sixth cover try. The judge result of m6 is model evidence, not acceptance.
Daniel's look gate covers the final cover.

The PM decision D16 of 2026-11-10, about 22:20 ICT, word for word:

> COVER LAYOUT (PM decision): option 1. The 20/12 layout is the rule for the teacher front; D6's 78 % line is withdrawn for this cover. Deliver m6 to ~/Desktop/handoff/storytime-cover-teacher-front-forge/ with a MANIFEST, marked "model evidence, not acceptance" (Daniel's look gate covers the final cover).

## The hand-off folders

| folder | MANIFEST OK | SHA-256 of MANIFEST.txt |
| --- | --- | --- |
| `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-retry1/` | 22 of 22 | `0e7a5223ac4c238bd1d84e025835f9443bc825a871e5668c5407398fcb0be748` |
| `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/` | 3 of 3 | `50069dce22d85fc75bf833ac06538fdd3a17f295541ee8cefb72534ee106e128` |

The check `sha256sum -c MANIFEST.txt` in each folder gives 0 FAILED.

## The defect of CVG9 and the fix

The test CVG9 of `tests/storytime-cover-guards.test.ts` wrote a fixture row into the real cover cost
file `out/storytime/covers/teacher-front/muse/costs.tsv`. The test then deleted that file.
The GREEN run of step D1 did this at about 19:02 ICT on 2026-11-10.
The real cost file held 6 cover rows, and the file was gone after the run.
Without the file, the cover guard counts 0 cover spend and 0 tries, so it cannot stop a 7th cover call.

The fix has 2 commits. Commit 3b22a6af changes the cover guard test so that it reads the real cost
file only. Commit 7b942018 holds the restore of the cost file and the rest of the test fix.
The cost file was rebuilt from the spend log and the 6 sidecar files.
Its SHA-256 is `2ef0e1b15cce56ca2376695e688c5962259850cbbd6f29c410e16fd1ba02159c`, and its size is
3021 bytes. The GREEN command of the specification passes with 19 test files, 280 tests, and 0
failures.

## The 3 network timeouts and the second exception

The 3 calls of step A failed at the transport level. The calls were the hat-pip color try 4, the
tom-can-see-the-mop line try 4, and the rice line try 4. Each cost 0 USD and wrote no picture.
The once rule of D1 recorded each call and repeated none.

The PM order of 2026-11-10 gave one more try for those 3 rows.
The second exception of D15 is in the guard, and its 7 tests are in
`tests/storytime-u2-extra-try.test.ts`. The commit is
`8a4819c62468aa9df2bf0928021b3bf5ef37e5da`.
The field `netRetry` is true on the color row of hat-pip, the line row of tom-can-see-the-mop, and the
line row of rice. The 3 calls ran in step D2, and each cost 0.01 USD.

## The scratch delete

The list came first, then the delete.

- `/tmp/opencode/l2rc/`: 11 files, 12599 bytes. Deleted.
- `/tmp/opencode/l2rc-sumtest/`: 2 files, 88 bytes. The scratch of the MANIFEST check of this step.
  Deleted.
- `/tmp/judge-u2rc/`: 1 file, 3196 bytes. The judge scratch of the PM of 2026-11-10. Deleted.
- The staging folders under `out/storytime/covers/` and `out/storytime/l2/unit2/`: none.

The `costs.tsv` files, the Muse files, the judge copies, the delivery and hand-off folders, and the
files of `measure/runs/asset_storytime_l2_retries_cover_20261110/` are kept.

Facts changed:

- Forge spend 0.16 USD.
- Unit 2 book rows delivered 220 to 224 of 229.
- 5 rows to Workbooks as fail rows.
- The teacher front art m6 delivered under the 20/12 layout.

## Addendum 2026-11-11: cover README title (D22)

The PM order of 2026-11-11 corrected the title of the cover hand-off folder.

- Folder: `/home/daniebo/Desktop/handoff/storytime-cover-teacher-front-forge/`
- Old title: `# Teacher front cover art, Storytime Level 2 unit 2`
- New title: `# Teacher front cover art, Storytime Level 2 unit 1`
- Old SHA-256 of `MANIFEST.txt`: `50069dce22d85fc75bf833ac06538fdd3a17f295541ee8cefb72534ee106e128`
- New SHA-256 of `MANIFEST.txt`: `b63708b128e0b9593005986a18baf57b21b0a83b7715b63564c6be85ad4409a7`
- New SHA-256 of `README.md`: `f0278bab5ecd95f67945d96f176654ae820160a69226572ab4f462433e10e1f1`
- `sha256sum --quiet -c MANIFEST.txt` in the folder gives no FAILED line. The exit status is 0.
  The 3 files give OK: the cover picture, the zones picture, and the README.
- The 2 PNG files keep their SHA-256 and their inode:
  - `l2-u1-cover-quest-teacher-front-forge-v1.png`: `c91719903d3803bc02498f8e097528c9a64ddae263102ebf28d06d8d37f11a53`
  - `l2-u1-cover-quest-teacher-front-forge-v1-zones-review-only.png`: `41e290053869085734f926b165ca252944260443f030db837a1837e22994c678`
- The cost is 0 USD. The maker made no Muse call and read no API key.
- The generator `make-cover-handoff.mjs` gets the same title change at its lines 86 and 168. The maker did not run the generator.

Facts changed: the cover README title says unit 1; the cover MANIFEST.txt SHA-256 changed; no picture changed.

## Addendum 2026-11-11: Phase 3 repair1 (D17 to D21)

Status: repair1 delivered; hat-pip stays a fail row.

- Folder: `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-repair1/`. It holds 33 files
  (26 PNG hard links, `manifest.json`, `spend-log.tsv`, root `README.md`, `MANIFEST.txt`, and 3
  `not-delivered/` files). The builder is
  `measure/runs/asset_storytime_l2_retries_cover_20261110/make-handoff-repair1.mjs`. The cost is
  0 USD; no Muse call, no network call, no API key read.
- `MANIFEST.txt` SHA-256:
  `09dfa9f03b12c2042c70fc4a63970e23e7fe15ebb84cd7dfd25993691732de7e`. `sha256sum --quiet -c
  MANIFEST.txt` in the folder gives no FAILED line (exit status 0), and
  `sha256sum -c MANIFEST.txt | grep -c ': OK$'` gives 32.
- The 1 call of this order, word for word from `spend-log.tsv`:
  `2026-11-10T18:42:50.587Z	muse	l2-w10-story-page-put-on-your-hat-pip line	3	0.01	l2-w10-story-page-put-on-your-hat-pip-m3-line-2.png`.
  Item (a) total: `total	item a	calls 14	stop 0.15 USD	spend 0.11` — 0.11 USD of the 0.15 USD
  cap over 14 calls.
- Hat-pip result: the line try 3 passes the print gate at 12 px, and the frozen judge and the
  second judge both fail it with the class wrong-character (Teacher Kim wears round glasses; Pip
  has no red collar and no gold tag). No line try of the row passed the judge, and the row has
  used its 3 line tries. hat-pip has no delivery job; the hand-off folder holds it in
  `not-delivered/`. The best try by default 7 stays the color m3 and the line try 2 print at 13 px.
- The 9 version repairs (D18): `l2-w10-check-row-ten`, `l2-w11-story-page-here`,
  `l2-w11-story-page-ten-men-in-the-den`, `l2-w11-story-page-the-den-is-on-dad`,
  `l2-w12-story-page-open-your-book-nan`, `l2-w13-cover-look-at-me`, `l2-w13-check-row-dot`,
  `l2-w13-d4-prompt-jump`, and `l2-w15-cover-look-a-bus`. The v1 manifest gave each a
  `version` and `selectedVersion` of 2 or 3 (the Muse version of `approvals-u2.json`); the repair1
  manifest gives each 1. The delivered pixels of each row have the same SHA-256 as its file in the
  v1 delivery folder (pixel check `pixel-check-p3e.txt`: `failures: 0`, `result: pass`). Cause: the
  line `version = entry?.version ?? listVersion(row.fileName)` in
  `src/storytime/muse-delivery-u2.ts` (line 379).
- The 4 card jobs (PM addition of 2026-11-10): `l2-w12-card-hippo` (9 px), `l2-w12-card-ruler`
  (8 px), `l2-w13-card-clap` (11 px), and `l2-w14-card-cold` (10 px) are delivery jobs from color
  m1 plus the widest judge-passing line print. Each manifest candidate records a
  `lineWidthException` with `measuredPx`, `requiredPx` 12, a `reason` with the PM words, and a
  `waivedError`.
- Unchanged folders (state SHA-256 before = after, `folder-state-p3e.py`):
  `out/storytime/l2/unit2/delivery-muse-v1/` 441 files `a64ddf5f19a76542ee8806e16e872d23ef4a44308082fabee461f3ca9aec038c`;
  `out/storytime/l2/unit2/delivery-muse-v1-retry1/` 9 files `ca4cc92ff5767edf23c299602b6dc25951c5a6a45f3157c62b2252c4993544b7`;
  `handoff/storytime-l2u2-book-pictures/` 469 files `1146c9a48c77c39ac7ce67974a3f73a6d086d575bb21699f704c35f3c309c592`;
  `handoff/storytime-l2u2-book-pictures-retry1/` 23 files `9ade5c1e3b968ca87d71ab0d6c40503157bc5b1bb4e9be5450178e71f4f03c8a`.

Facts changed:

- Forge spend 0.17 USD in total (item (a) 0.11 USD of 0.15 USD, 14 calls).
- The repair1 manifest gives version 1 to the 9 rows, and their pixels are the same as in v1.
- The 4 card rows (hippo, ruler, clap, cold) are delivery jobs with a line-width exception.
- Forge now gives a job for 228 of the 229 unit 2 rows.
- hat-pip is the 1 fail row left, after 3 line tries.
