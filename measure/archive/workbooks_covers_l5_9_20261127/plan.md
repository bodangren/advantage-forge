# Implementation plan: Primary Advantage covers, levels 5 to 9

Track: `workbooks_covers_l5_9_20261127`. Lane: light. One phase.
The request comes from Workbooks (track `book_covers_20261007`, Phase 4) through the PM on 2026-11-27.
No spec, no review, and no gate. The pictures go to Daniel through Workbooks.

Money. Daniel said "Go" on 2026-11-27 (Google Tasks item TEpCMklwY2YxSXZvV3gtSA, relayed by the PM).
The hard stop is 0.40 USD in total for 11 pictures. Forge logs every paid call and stops at the limit.
The model is Muse (`meta/muse-image` at OpenRouter), the aspect ratio is 3:2, and the size is 1920 x 1280 px.

## Phase 1: The 11 wide pictures

- [x] Task: Set up the run and find the Muse script and the key.
  - The Quest 5 test of 2026-10-07 called Muse through the OpenRouter Image API with the model
    `meta/muse-image`, the aspect ratio `3:2`, and the three references as JPEG data URLs.
    `scripts/storytime-muse.mjs` holds that path, and its key comes from the Workbooks dashboard env
    file. The run folder is `out/primary-covers/levels-5-9/` with its own cost file and its own
    0.40 USD cap.
  - Done-when: the tool is written, the three references are copied into the run folder, the key
    reads, the OpenRouter check gives 200, and a dry run lists the 11 pictures.
  - Evidence: `scripts/primary-covers-muse.mjs`, `scripts/primary-covers-muse.d.mts`,
    `tests/primary-covers-muse.test.ts`. The three references sit in
    `out/primary-covers/levels-5-9/references/`. The models endpoint gave 200 on 2026-11-27. The
    dry run listed the 11 pictures of `requests.json`. Commit db02b242 holds the three card files.
- [x] Task: Make the 11 pictures. One attempt each first. Every call is logged with its time, its
      prompt id, its attempt, its cost, its result file, and its result.
  - Done-when: 11 files exist with the output names of `requests.json`, each one 1920 x 1280 px,
    RGB, PNG, and the spend stays at or under 0.40 USD.
  - Evidence: 36 calls, 35 paid, 1 failed at 0 USD. The total spend is 0.35 USD of the 0.40 USD
    stop. The cost file is `out/primary-covers/levels-5-9/costs.tsv` and it holds all 36 rows.
    Every accepted file is 1920 x 1280 px, sRGB, PNG, with no alpha channel.
- [x] Task: Check each picture against the 7-item check list of the request README. A picture that
      fails a check may be redone inside the 0.40 USD limit.
  - Done-when: the check table holds one row per picture with the result of the 7 items.
  - Evidence: `measure/archive/workbooks_covers_l5_9_20261127/check-table.md` and the copy in
    `~/Desktop/handoff/levels-5-9-cover-art-results-2026-11-27/results/check-table.md`. All 11
    pictures pass the 7 items. The check of the middle line used the band x=880 to x=960 of each
    accepted file. 10 of the 11 first attempts failed that item, so 25 redo calls ran inside the
    limit. A second look judge gave 10 of the 11 pictures a full pass. Its one fail is the guardian
    creature of Quest 6.2, which stands in the left part and never reaches the middle line. The
    check table states that point.
- [x] Task: Write the spend log.
  - Done-when: the log holds every call with its cost and the total.
  - Evidence: `measure/archive/workbooks_covers_l5_9_20261127/spend-log.md` and the copy in
    `~/Desktop/handoff/levels-5-9-cover-art-results-2026-11-27/results/spend-log.md`. The log holds
    all 36 calls and the total of 0.35 USD.
- [x] Task: Write the return folder.
  - Done-when: `~/Desktop/handoff/levels-5-9-cover-art-results-2026-11-27/results/` holds the 11
    files with the output names of `requests.json`, the spend log, and the check table.
  - Evidence: the folder holds the 11 PNG files, `spend-log.md`, and `check-table.md`. The accepted
    attempts are Quest 5 try 2, Quest 6.1 try 5, Quest 6.2 try 2, Adventure 7.1 try 6, Adventure 7.2
    try 4, Adventure 8.1 try 6, Adventure 8.2 try 2, Adventure 8.3 try 1, Adventure 9.1 try 2,
    Adventure 9.2 try 2, and Adventure 9.3 try 3. No picture is rejected.
