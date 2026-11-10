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
