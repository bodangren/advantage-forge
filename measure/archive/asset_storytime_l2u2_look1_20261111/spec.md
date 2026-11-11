# Specification: Storytime Level 2 unit 2 look1 (hat-pip owner job and the t-shirt redo)

## Overview

Daniel looked at the unit 2 pictures on 2026-11-11 and gave a verdict on two pictures of Task 2.8 of
Workbooks unit 2. The hat-pip picture passes for Daniel. The "Put on your T-shirt" picture does not.
The PM turned the verdict into one small light-lane order with two jobs.

Job 1 packages the hat-pip picture as a delivery job, with Daniel's words as the recorded acceptance.
This job costs 0 USD. Job 2 makes the T-shirt picture again with Muse: color first (up to 3 tries), then
line art from the passing color (up to 3 tries). The stop is 0.10 USD. Both jobs go to a new
hand-off folder. The old folders do not change.

The track follows the archived tracks `asset_storytime_l2_unit2_pictures_20261108` and
`asset_storytime_l2_retries_cover_20261110`. It is a feature on the PM light lane of 2026-11-03.

## Owner order

### D1 The PM order

PM order, word for word:

> PM ORDER (Daniel look, Task 2.8 of Workbooks unit 2; Daniel's words, Tasks 2026-11-11 06:27 ICT: "Hat-pip image passes, but the w10 put on your t shirt image doesn't pass."). One small light task, 1 role (slot wait first), paid stop 0.10 USD inside the unit 2 budget (Daniel's Go, hard stop 25.21 USD; unit 2 spend about 17.5 USD): (1) HAT-PIP, 0 USD: make a delivery job for l2-w10-story-page-put-on-your-hat-pip from color m3 + line try 3 (the files in storytime-l2u2-book-pictures-repair1/not-delivered/), with Daniel's words above as the recorded acceptance (the judges' wrong-character fail is waived by the owner). (2) REDO l2-w10-story-page-put-on-your-t-shirt (v1 in storytime-l2u2-book-pictures/, color 9e207c3c…, line 71e2ba05…). PM diagnosis: the action does not read as "Put on your T-shirt": in the color print the boy already wears a yellow T-shirt and pulls a second yellow cloth over his head like a hood; the line print shows a cap and waving hands, so color and line do not match. Target: the same boy and room, mid-action: his head and both arms are through a yellow T-shirt, and he pulls it down over his body (a white vest under it, so no bare skin); the T-shirt is the clear focus. Color first (up to 3 tries), then the line art from the passing color (up to 3 tries), with your calibrated judge; the line print must show the same action. Deliver both jobs in a NEW folder ~/Desktop/handoff/storytime-l2u2-book-pictures-look1/ with MANIFEST.txt and a contact sheet; old folders unchanged. Report the path, the MANIFEST sha256, the spend lines, and the judge results. Facts changed list at the end.

The order is the source of the owner acceptance in D2 and of the guard exception in D4.

## Context (read only)

- The v1 T-shirt delivery is in `out/storytime/l2/unit2/delivery-muse-v1/` and in the hand-off folder
  `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures/`. The v1 color file has the SHA-256
  `9e207c3c72db52d323fd8ef64c9565588f853460ec7abcfa0fda5a053bd925e4`. The v1 line file has the SHA-256
  `71e2ba056c09ad66a1beecb565941616becfdecf4fccd107e86bbbe0b9e1ca7e`. The v1 job used color m1 and the
  line print `l2-w10-story-page-put-on-your-t-shirt-m1-line-print-2.png`.
- The T-shirt spec is `docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt.json`.
  Its Muse folder is `out/storytime/l2/unit2/w10/muse/`. Its `costs.tsv` has 3 rows for the id since
  the unit 2 start: color m1 (2026-11-08T15:18:26Z, 0.01), line m1 (2026-11-08T17:37:46Z, 0.01), and
  line m1 redo 2 (2026-11-08T20:13:20Z, 0.01). The id has 1 color try and 2 line tries.
  `U2_RUN.maxTries` is 3. Without an exception, the guard allows 2 more color tries and 1 more line try.
- The words that give the double shirt and the hood. The `goal` and the `colorPrompt` both say "pulls a
  big yellow T-shirt on over his clothes". The cast note in the `colorPrompt` gives Ben "a light-blue
  T-shirt", and the sentence "Do not change anyone's hair or clothes." tells the model to keep it. The
  model therefore draws the light-blue shirt, a yellow shirt on top, and a second yellow cloth. The
  `linePrompt` names no action. It copies the line from the color print, so a defect in the color
  print comes through to the line print.
- The frozen judge kit is `docs/storytime/l2-unit1/judge/` (`judge-prompt.md` v6, SHA-256 `db5b443a...`;
  `cast.json`, SHA-256 `2eb4a6a1...`). The model is `claude-code/claude-sonnet-5-5#high`. The v6
  prompt does not judge the action: its notes say "Action: put on (note only)". The v1 pictures passed
  the judge for this reason. D6 adds an action check.
- The hat-pip files. Both are in `out/storytime/l2/unit2/w10/muse/` and the same bytes are in
  `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-repair1/not-delivered/`:
  - color: `l2-w10-story-page-put-on-your-hat-pip-m3-color-print.png`, SHA-256
    `6db86851b359760ea88e9feb67cf2bc784720ac4466abc5419af6f1dfff6bdff`;
  - line, try 3: `l2-w10-story-page-put-on-your-hat-pip-m3-line-print-2.png`, SHA-256
    `1474680276aa160dd972cd78b8559039a765032e703323cdb1ff41f0583aa9e1`.
  - The line print passes the 12 px print gate. Both judges gave `fail`, `wrong-character` (round
    glasses on Teacher Kim; no red collar and no gold tag on Pip). The files are
    `measure/runs/asset_storytime_l2_retries_cover_20261110/judge-u2rc-p3-line-t3.json` and
    `judge-u2rc-p3-line-t3-second.json`. Daniel saw these 2 pictures as `hat-pip.jpg` in
    `/home/daniebo/Desktop/handoff/storytime-l2u2-picture-look-2026-11-11/`.
- The guard `scripts/storytime-muse-guards.mjs` (and its `.d.mts`) holds `U2_RUN` (`capUsd` 18.33,
  `maxTries` 3), `U2_EXTRA_TRY` (closed: cap 0.15 USD, spend 0.11 USD), `COVER_RUN`, `CARD_RUN`,
  `CARD_LINE_RETRY`, and `TRY_EXCEPTIONS`. It also holds `runGuards`, `maxTriesFor`,
  `countExceptionRows`, `exceptionSpendOf`, `exceptionEntryFor`, `cliGuardOptions`, and the message
  constants. Do not reuse `U2_EXTRA_TRY`.
- The writer `src/storytime/muse-delivery-u2.ts` has the options `approvalsOnly` and `versionFromList`.
  An approval entry is `{ rowId, version, colorPrint, linePrint }`. The writer takes the delivered names
  from the picture list (the `-v1` names), so the writer needs no change. The unit 2 manifest holds no
  judge result (`reviews` is `{}`).
- The judge batch tool is `node scripts/storytime-judge-batch.mjs --unit2 --ids <id> --kind color|line
  --try <n> --out <group>`. The batch file goes to `docs/storytime/l2-unit2/judge/prod/<group>.json`, and
  the judge copy goes to `out/storytime-review/judge/prod-u2/`. The orchestrator runs the judges, never
  the maker.
- The forms of the old run folder `measure/runs/asset_storytime_l2_retries_cover_20261110/` are the
  model for this run folder: `spend-log.tsv`, `line-gate-p3d.txt`, `approvals-repair1.json`,
  `deliver-repair1.mts`, `folder-state-p3e.py`, `pixel-check-p3e.py`, `make-handoff-repair1.mjs`,
  `handoff-retry1.mjs` (it makes `contact-sheet.png` with sharp), and `pm-report.md`.
- The hand-off folder `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-repair1/` shows the
  form of `MANIFEST.txt`: the title comment, the `sha256` lines, the `# <bytes> <file>` lines, and the
  check command `grep -E '^[0-9a-f]{64}  ' MANIFEST.txt | sha256sum -c -`.
- The Muse tool `scripts/storytime-muse.mjs` makes the next version m<n> for a color call. It makes a
  line print from color m<n> for `line <spec> --from <n> --tries <k>`. It sends no call outside the
  guard `runGuards`.

## Decisions

The PM order sets D1 and the paid stop. The author set the other defaults. The section "Open questions
answered by default" lists them. The PM can change each default.

- **D2 Hat-pip owner acceptance (0 USD).** Daniel's words "Hat-pip image passes" are the recorded
  owner acceptance. They waive the judges' wrong-character fail for this row only.
  - The job uses the 2 files and the 2 SHA-256 values of the Context section. The approval version is
    3, because the files are color m3 and line try 3.
  - The maker records the words in `measure/runs/asset_storytime_l2u2_look1_20261111/owner-look1.json`
    (a separate file, because the approval entry has no note field). The file holds the row id, the 2
    file names, the 2 SHA-256 values, the source "Daniel, Tasks, 2026-11-11 06:27 ICT", the words
    "Hat-pip image passes, but the w10 put on your t shirt image doesn't pass.", and the text that the
    owner waives the 2 judge results of the old track for this row.
  - The same words go to the hand-off `README.md` and to `pm-report.md`.
  - This is the only place where a text may say that the owner accepted a picture. The T-shirt picture
    gets no acceptance text.
  - The waiver does not change the 2 judge files of the old track. They stay as the record of the
    model result.
- **D3 The T-shirt prompt edit (0 USD).** The maker edits only the 3 fields `goal`, `colorPrompt`, and
  `linePrompt` of the T-shirt spec. No other field changes. The picture shows the same boy (Ben) and
  the same room (the dress-up corner), mid-action: his head and both arms are through a yellow
  T-shirt, both hands pull it down over his body, a white vest shows under it, he wears exactly one
  T-shirt with no hood, no cap, and no second cloth, and the T-shirt is the clear focus.
  - **New `goal`** (replaces the old text):
    `Ben (drawn young, about five years old) is in the middle of putting on a big yellow T-shirt next to the same dress-up box: his head and both arms are through the yellow T-shirt, and both of his hands pull it down over his body, with a big smile.`
  - **`colorPrompt`, 3 replacements.** The maker keeps every other character of the field.
    1. The text `Do not change anyone's hair or clothes.` becomes
       `Do not change Ben's hair, shorts, or sneakers.`
    2. The text `a light-blue T-shirt, dark-blue shorts, grey sneakers` (the Ben cast note) becomes
       `a white vest that shows under the yellow T-shirt, dark-blue shorts, grey sneakers`.
    3. The text of the sentence that starts with `The picture: Ben (drawn young` and ends with `with a
       big smile.` becomes `The picture: ` followed by the new `goal` and these added sentences:
       `The big yellow T-shirt is the clear focus of the picture, and it is plainly yellow. A white vest shows under the hem of the T-shirt, so no bare skin of his body shows. Ben wears exactly one T-shirt: the yellow one. In picture 1 Ben wears a light-blue T-shirt; do not draw that light-blue T-shirt in this picture. Ben has no hood, no cap, and no second cloth over his head or on his shoulders.`
  - **`linePrompt`, one sentence added at the end:**
    `Keep the exact pose of picture 1: Ben's head and both arms are through the yellow T-shirt, and both hands hold the T-shirt hem and pull it down over his body. He wears one T-shirt only, drawn as one closed shape with its neck opening and its two sleeves, and a vest hem as one closed band under it. Draw no cap, no hood, and no waving hands.`
  - The words "over his clothes", which gave the double shirt, are gone from the 2 fields that held them
    (`goal` and `colorPrompt`). The `linePrompt` held no such words.
  - The maker records the old and the new SHA-256 of the spec file and each new sentence in the plan.
  - After a failed try, the orchestrator may give the maker at most 1 added sentence that names the
    defect (D5). The maker adds it to `colorPrompt` (or `linePrompt` for a line try) and records it.
- **D4 The guard exception `U2_LOOK_TRY` (0 USD).** The maker adds a new constant to
  `scripts/storytime-muse-guards.mjs` and to its `.d.mts`.
  - Fields: `startTime` (the real UTC time of the guard commit, cut to the minute), `capUsd` 0.10,
    `reportAtUsd` 0.08, `marginUsd` 0.01, and `rows` with 2 entries for
    `l2-w10-story-page-put-on-your-t-shirt`: kind `color` with `allowedTries` 3, and kind `line` with
    `allowedTries` 3. Each row has the fields `id`, `kind`, `allowedTries`, and `source` (the PM
    words of D1).
  - The exception spend is the sum of the `usage_cost` rows of the listed id (all kinds) at or after
    `startTime`, read from the unit 2 week cost files.
  - For the listed id and kind, the rows at or after `startTime` count against `allowedTries`. A failed
    call at 0 USD counts. `U2_RUN.maxTries` does not refuse these tries. A fourth try of a kind is
    refused.
  - A call is refused when the exception spend plus `marginUsd` for each planned call is over the cap.
    The comparison keeps a tolerance of one billionth of a dollar, like the rule of `U2_EXTRA_TRY`.
  - `U2_RUN.capUsd` still applies to every call. The look spend does not count against `U2_EXTRA_TRY`,
    and the `U2_EXTRA_TRY` spend does not count against `U2_LOOK_TRY`.
  - The notice prints once at 0.08 USD of exception spend, like the other report points.
  - The test-only cap key is `u2LookCapUsd`. `cliGuardOptions` removes it. An empty or invalid value
    refuses a call of the listed id. A message constant `U2_LOOK_CAP_MESSAGE` gives the refusal text.
  - Every other row and constant keeps its rule and its value: `U2_RUN`, `U2_FW_RUN`, `U2_EXTRA_TRY`,
    `COVER_RUN`, `CARD_RUN`, `CARD_LINE_RETRY`, and `TRY_EXCEPTIONS`. An id that is not listed keeps the
    normal rule.
  - The tests are LK1 to LK15 in `tests/storytime-u2-look1.test.ts` (FR-1 to FR-3).
  - Commit message: `feat(storytime_l2u2_look1): U2_LOOK_TRY exception, 0.10 USD for the t-shirt row`.
- **D5 The try order.** Before each paid call the maker runs the network check
  `curl -sS -m 20 -o /dev/null -w '%{http_code}\n' https://openrouter.ai/api/v1/models`. The answer must
  be 200. A failed check uses no try.
  - The maker makes 1 call for each step. The orchestrator judges between calls (D6).
  - Color first: at most 3 tries, one call at a time, with `node scripts/storytime-muse.mjs color
    <spec>`. Stop at the first pass. The new colors are m2, m3, and m4, because m1 is the v1 color.
  - Then the line tries from the passing color m<n>: at most 3 tries, one call at a time, with
    `node scripts/storytime-muse.mjs line <spec> --from <n> --tries 1`. Stop at the first pass.
  - Each line print and its despeckled print go through the print gate BEFORE the judge: the 12 px line
    width and the 90 percent white edge frame, with the writer's own check code `inspectLineArtPng`.
    The form of the record is `measure/runs/asset_storytime_l2_retries_cover_20261110/line-gate-p3d.txt`.
    The record is `measure/runs/asset_storytime_l2u2_look1_20261111/line-gate-look1-<try>.txt`.
  - After a failed try, the orchestrator may give the maker at most 1 added prompt sentence that names
    the defect. The maker records it in the plan.
  - A row that has no passing color after 3 tries, or no passing line after 3 tries, is a fail row. It
    gets no more spend. Its best try goes to `not-delivered/` of the hand-off. The best color is the
    latest color that passed the judge, or the latest color if none passed. The best line is the print
    that passed with the widest line, or the widest print if none passed. Ties go to the later try.
- **D6 The judge and the action check.** The frozen judge v6 runs without change: the prompt and the
  cast stay as they are. The orchestrator runs it with the batch tool, one group for each try.
  - The judge try number is the ordinal of the cost row of the id and kind. Color m2 is color try 2,
    m3 is try 3, and m4 is try 4. The new line tries are line tries 3, 4, and 5.
  - Because v6 treats the action as a note only, each judge also answers a fixed action check for this
    row. The check is a separate call of the same model, `claude-code/claude-sonnet-5-5#high`. The
    maker writes its prompt in `measure/runs/asset_storytime_l2u2_look1_20261111/action-check-prompt.md`
    in Task 1, from the items below. The v6 prompt and the batch tool have no change.
    - (a) His head is through the neck opening.
    - (b) Both arms are through the sleeves.
    - (c) Both hands pull the T-shirt down over his body.
    - (d) A white vest shows under the T-shirt, and no bare skin of the body shows.
    - (e) He wears exactly one T-shirt, and no hood, no cap, and no second cloth.
    - (f) The yellow T-shirt is the clear focus.
    - (g) For a line print only: the pose, the hands, and the T-shirt match the passing color print,
      which the judge sees as a second picture.
  - A try passes only when the v6 verdict is `pass` and every action item is `yes`.
  - The second-judge rule of the old track applies. A second judge (independent, each file alone)
    runs before a fail stands. A second-judge pass of both parts (the v6 verdict and the action check)
    clears a fail.
  - The form of the judge result is the form of `judge-u2rc-p3-line-t3.json` (`group`, `judgePrompt`,
    `cast`, `model`, `status`, `time`, `results`, `summary`) with one added object in each result:
    `actionCheck`: `{ "a": "yes"|"no", "b": ..., "c": ..., "d": ..., "e": ..., "f": ..., "g":
    "yes"|"no"|"n/a", "note": "<text>" }`. The value of `g` is `n/a` for a color print. The result files
    are `judge-u2l1-color-t<n>.json`, `judge-u2l1-line-t<n>.json`, and the same names with `-second`.
  - The judge results are model evidence, not acceptance. Only the words of D2 are an acceptance.
- **D7 The delivery (0 USD).** The approval list is
  `measure/runs/asset_storytime_l2u2_look1_20261111/approvals-look1.json`, in the form of
  `approvals-repair1.json` (the same `version` and the same `pictureListSha256`).
  - It holds the hat-pip entry (version 3, the 2 files of the Context section) and, only if the T-shirt
    passes, the T-shirt entry (the passing color m<n> and the passing line print).
  - The runner is `deliver-look1.mts` in the form of `deliver-repair1.mts`, with the options
    `approvalsOnly` true and `versionFromList` true. The delivery root is
    `out/storytime/l2/unit2/delivery-muse-v1-look1/`. The names come from the picture list (the `-v1`
    names).
  - Orchestrator default: the look1 T-shirt files keep the `-v1` names of the picture list and replace
    the v1 T-shirt files of `storytime-l2u2-book-pictures/`. The old folder does not change on disk.
    The README gives the old SHA-256 values (color
    `9e207c3c72db52d323fd8ef64c9565588f853460ec7abcfa0fda5a053bd925e4`, line
    `71e2ba056c09ad66a1beecb565941616becfdecf4fccd107e86bbbe0b9e1ca7e`) and the new SHA-256 values.
  - A pixel check (the form of `pixel-check-p3e.py`) proves that each delivered file has the SHA-256 of
    its Muse print.
- **D8 The hand-off.** The new folder is
  `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1/`. It holds:
  - hard links of the delivered PNG files (the disk is 97 percent full);
  - a copy of `manifest.json`;
  - a copy of the spend log;
  - `contact-sheet.png`: one row for each job, the color print beside the line print, made with sharp;
  - `README.md`: the old and new SHA-256 of the T-shirt files, the 2 judge results for each T-shirt try,
    the words of D2 for hat-pip, and the text "model evidence, not acceptance" for the T-shirt;
  - `not-delivered/`, only when the T-shirt fails: the best try and a `README.md` with the reasons;
  - `MANIFEST.txt` in the form of the repair1 file: the `sha256` lines, the `# <bytes> <file>` lines,
    the title comment `# Storytime Level 2 unit 2 book pictures, look1`, and the check command.
  - A folder-state check (the form of `folder-state-p3e.py`) proves, before and after, that these folders
    do not change: `out/storytime/l2/unit2/delivery-muse-v1/`, `delivery-muse-v1-retry1/`,
    `delivery-muse-v1-repair1/`, and the hand-off folders `storytime-l2u2-book-pictures/`,
    `storytime-l2u2-book-pictures-retry1/`, and `storytime-l2u2-book-pictures-repair1/` in
    `/home/daniebo/Desktop/handoff/`.
  - The PM report is `measure/runs/asset_storytime_l2u2_look1_20261111/pm-report.md`. The first line is
    `Status: done.`, `Status: partial.` (the T-shirt is a fail row), or `Status: blocked.` It gives the
    path, the SHA-256 of `MANIFEST.txt`, the spend lines, the judge results, the words of D2, and a
    `Facts changed:` list.
- **D9 Lane and roles.** This track is on the PM light lane of 2026-11-03: one maker
  (`measure-jr-green`) and one checker (`measure-phase-acceptance`), then closeout. No spec review, Red,
  Review A, B, or C, adversarial, UX, or final acceptance role runs.
  - The maker runs each task and each paid step in turn. The orchestrator runs the judges and the
    between-call steps (D5, D6). One role runs at a time. The orchestrator checks the slot first and
    waits when no slot is free.
  - The spend log is `measure/runs/asset_storytime_l2u2_look1_20261111/spend-log.tsv`, in the form of
    the old log: one line for each paid call with `time` (UTC), `tool`, `prompt id`, `attempt`,
    `cost USD`, and `result file`, then one total line
    `total<TAB>look1<TAB>calls <n><TAB>stop 0.10 USD<TAB>spend <usd>`. The stop is 0.10 USD for this
    track.
  - Before each paid step the maker writes the worst case in the maker log: the planned calls times the
    highest call cost seen, at least 0.01 USD. If the worst case passes the stop, the maker runs nothing
    and writes `blocked: a call would pass the look1 stop`. A call above 0.03 USD stops the run.
    Nobody edits `costs.tsv`.
  - Every full `tsc` and every `vitest` run goes only through
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`
    (PM load rule 2026-11-11). Exit code 75 means hold: run again.
  - No PNG or JPG enters git. Judge results are model evidence, not acceptance, except the words of D2.

## Functional Requirements

- **FR-1 Guard values.** `U2_LOOK_TRY` holds the values of D4: `capUsd` 0.10, `reportAtUsd` 0.08,
  `marginUsd` 0.01, and 2 rows for the T-shirt id (color and line, each `allowedTries` 3). The source of
  each row holds the PM words. `startTime` is a UTC minute at or after the HEAD time of the Phase 1
  start.
- **FR-2 Guard limits.** Tests with fixture cost files in temp folders show:
  - a first, a second, and a third color try of the T-shirt id are allowed, with rows before
    `startTime` ignored, and the fourth is refused;
  - the same for the line kind (the 2 old line rows before `startTime` do not count);
  - a failed call at 0 USD counts as a try;
  - an id that is not listed (for example `l2-w10-card-t-shirt` and
    `l2-w10-story-page-put-on-your-hat-pip`) keeps the normal rule;
  - an exception spend plus the margin over 0.10 USD is refused, and a spend that lands exactly on the
    cap is allowed;
  - rows before `startTime` do not count against the cap;
  - `U2_RUN.capUsd` still refuses a listed call;
  - the look spend and the `U2_EXTRA_TRY` spend do not count against each other;
  - the notice prints at 0.08 USD.
- **FR-3 Existing values and the CLI strip.** `U2_RUN`, `U2_FW_RUN`, `U2_EXTRA_TRY`, `COVER_RUN`,
  `CARD_RUN`, `CARD_LINE_RETRY`, and `TRY_EXCEPTIONS` keep their values (a test compares them with the
  values at commit `7b346f43`). `cliGuardOptions` removes `u2LookCapUsd`. An empty or invalid
  `u2LookCapUsd` refuses a call of the listed id.
- **FR-4 Spec edit.** The T-shirt spec differs from its version at `7b346f43` only in the fields `goal`,
  `colorPrompt`, and `linePrompt`. The 3 fields hold the sentences of D3. The words "over his clothes"
  and "a light-blue T-shirt, dark-blue shorts" are not in the spec. A test shows it (LK15).
- **FR-5 Try rule and checks.** Each try follows D5 and D6. The records show the network check, the
  gate result before the judge for each line print, and the action check. No try is past 3 for a kind.
- **FR-6 Hat-pip job.** The hat-pip entry meets D2 and D7. `owner-look1.json`, the hand-off
  `README.md`, and `pm-report.md` hold the words of Daniel. The 2 SHA-256 values of the delivered
  hat-pip files equal the 2 values of the Context section.
- **FR-7 Delivery and pixel check.** The delivery folder and the pixel check meet D7. Each delivered
  file has the SHA-256 of its Muse print. The manifest holds 1 job (hat-pip) or 2 jobs (hat-pip and
  T-shirt). Every candidate version is 1.
- **FR-8 Hand-off.** The hand-off folder meets D8. `sha256sum --quiet -c MANIFEST.txt` gives no FAILED
  line. The contact sheet has one row for each job.
- **FR-9 Old folders.** The folder-state check shows that the 6 folders of D8 have the same state
  SHA-256 before and after.
- **FR-10 Spend and report.** The spend log meets D9, and its sum equals the `costs.tsv` rows of the
  T-shirt id since `U2_LOOK_TRY.startTime`. The spend stays at or under 0.10 USD. `pm-report.md` meets
  D8.
- **FR-11 Claims.** No file of the track says that Daniel, the PM, or Workbooks accepted a picture, with
  one exception: the words of D2 for the hat-pip row. The text may quote the PM order, because it
  opened the spend only.
- **FR-12 Git and frozen files.** No PNG or JPG enters git. Each task commits explicit paths only. The
  frozen paths below have no change.

## Non-Functional Requirements

- All prose follows ASD-STE100.
- The maker marks a task `[~]` before the task changes a file outside `measure/`.
- The maker never writes a cap value other than D4. The maker never changes the judge kit or any unit 1
  path.
- Other agents share the git index. The maker commits explicit paths only.
- No speech, song, or video command runs. No image tool and no API key outside the Muse tool.
- Scratch goes only under `/tmp/opencode/l2look1/`. The last maker task deletes it and any staging
  folder this track made.

## Test commands

GREEN test command (the 19 files of the archived track, plus the new test file of this track):

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-u2-guards.test.ts tests/storytime-u2-judge-batch.test.ts tests/storytime-u2-delivery.test.ts tests/storytime-u2-specs.test.ts tests/storytime-card-guards.test.ts tests/storytime-card-line-retry.test.ts tests/storytime-muse-attempts.test.ts tests/storytime-judge-batch.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-muse-delivery-adversarial.test.ts tests/storytime-card-adversarial.test.ts tests/storytime-family-word-judge.test.ts tests/storytime-family-word-delivery.test.ts tests/storytime-u2-family-words.test.ts tests/storytime-u2-extra-try.test.ts tests/storytime-cover-guards.test.ts tests/storytime-u2-retry-delivery.test.ts tests/storytime-cover-judge-copy.test.ts tests/storytime-cover-specs.test.ts tests/storytime-u2-look1.test.ts --maxWorkers=1'
```

The new test file is `tests/storytime-u2-look1.test.ts` (D3, D4, FR-1 to FR-4). It holds the tests LK1
to LK15:

- LK1: the values of `U2_LOOK_TRY` and the PM words in the sources (FR-1).
- LK2: 3 color tries are allowed and the fourth is refused, with the old color row ignored (FR-2).
- LK3: 3 line tries are allowed and the fourth is refused, with the 2 old line rows ignored (FR-2).
- LK4: a failed call at 0 USD counts as a try (FR-2).
- LK5: an id that is not listed keeps the normal rule (FR-2).
- LK6: the spend plus the margin over 0.10 USD is refused, and the exact cap is allowed (FR-2).
- LK7: rows before `startTime` do not count (FR-2).
- LK8: `U2_RUN.capUsd` still refuses a listed call (FR-2).
- LK9: the look spend and the `U2_EXTRA_TRY` spend do not count against each other (FR-2).
- LK10: the notice prints at 0.08 USD (FR-2).
- LK11: an empty or invalid `u2LookCapUsd` refuses a call (FR-3).
- LK12: `cliGuardOptions` removes `u2LookCapUsd` (FR-3).
- LK13: the old constants keep their values (FR-3).
- LK14: a pool of the listed id and one unlisted id is refused when the listed id has 3 tries since
  `startTime`, and the unlisted id alone keeps the normal rule (FR-2).
- LK15: the spec edit of D3 (FR-4).

When `scripts/` changes, the maker also runs `./node_modules/.bin/tsc --noEmit -p .` through
`heavy-run.sh`. The old repository count of type errors may stay. `src/storytime/`, `scripts/storytime-`,
and `tests/storytime-` must give 0 new errors.

## Owned paths

- `scripts/storytime-muse-guards.mjs` (and its `.d.mts`): only the new constant `U2_LOOK_TRY`, its
  message constant, and its rule in `runGuards`
- `scripts/storytime-muse.mjs` (routing only, and only if the look class needs it)
- `docs/storytime/l2-unit2/w10/muse/l2-w10-story-page-put-on-your-t-shirt.json` (the 3 fields of D3)
- `docs/storytime/l2-unit2/judge/prod/u2l1-*.json` (the judge batch files)
- `tests/storytime-u2-look1.test.ts`
- `out/storytime/l2/unit2/w10/muse/**` (the Muse files of the T-shirt row; not in git)
- `out/storytime/l2/unit2/delivery-muse-v1-look1/` and `out/storytime-review/judge/prod-u2/` (not in git)
- `/home/daniebo/Desktop/handoff/storytime-l2u2-book-pictures-look1/`
- `measure/tracks/asset_storytime_l2u2_look1_20261111/`
- `measure/runs/asset_storytime_l2u2_look1_20261111/`
- `measure/tracks.md` (the registry entry and the closeout)

## Frozen paths

No task changes these paths:

- the judge kit `docs/storytime/l2-unit1/judge/` and every unit 1 path;
- `scripts/storytime-judge-batch.mjs` and `src/storytime/muse-delivery.ts`;
- `src/storytime/muse-delivery-u2.ts` (the writer needs no change);
- `assets/**` and the Workbooks repository;
- every spec file other than the T-shirt spec, and every other field of the T-shirt spec;
- `U2_RUN`, `U2_FW_RUN`, `U2_EXTRA_TRY`, `COVER_RUN`, `CARD_RUN`, `CARD_LINE_RETRY`, and
  `TRY_EXCEPTIONS`;
- the 3 delivery folders `delivery-muse-v1/`, `delivery-muse-v1-retry1/`, and
  `delivery-muse-v1-repair1/`, and the 3 old hand-off folders of D8;
- the hand-off folders `storytime-cover-teacher-front-forge/` and `storytime-l2u2-picture-look-2026-11-11/`;
- the archived track `measure/archive/asset_storytime_l2_retries_cover_20261110/` and its run folder;
- every existing test file (a pin of the old T-shirt text, if one exists, goes to the PM first).

## Acceptance Criteria

1. The GREEN test command passes at the audited HEAD, and the typecheck gives 0 new errors in the
   storytime paths.
2. The checker probes `U2_LOOK_TRY` with fixture cost files (FR-2, FR-3).
3. The spec edit meets D3 (FR-4), and the spec differs only in the 3 fields.
4. The `costs.tsv` total of the T-shirt id since `startTime` matches the spend log, and the spend stays
   at or under 0.10 USD (FR-10).
5. The records show the network check, the print gate before each line judge, and the action check for
   each try (FR-5). No kind has a fourth try.
6. The hat-pip files have the SHA-256 values of D2, and the owner words are in the 3 places of D2 (FR-6).
7. The delivery, the pixel check, and the hand-off meet FR-7 and FR-8, and the MANIFEST check gives 0
   FAILED.
8. The folder-state check shows no change in the 6 old folders (FR-9).
9. The checker greps FR-11 and FR-12 and finds no violation.
10. The scratch is gone and the kept files remain.

## Human gate

The PM opened the spend with the order of D1. The PM checks the report. A stop or a blocked call goes to
the PM and not to Daniel. The only recorded acceptance is Daniel's words of D2 for the hat-pip row. The
T-shirt picture is model evidence until Daniel looks at it.

## Out of Scope

- Any paid call other than the T-shirt color tries and the T-shirt line tries of D5 (at most 6 calls).
- A fourth try of a kind, and any row other than the T-shirt row.
- Any change to the judge kit, the batch tool, the writer, or the closed constant `U2_EXTRA_TRY`.
- The old T-shirt card row `l2-w10-card-t-shirt`.
- Speech, songs, and video.

## Risks

| Risk | Control |
| --- | --- |
| The model keeps the light-blue shirt from picture 1 and draws a double shirt again. | D3 names the light-blue shirt as not worn and gives Ben a white vest. D6 item (e) refuses a double shirt. |
| The judge passes a picture with a wrong action, because v6 treats the action as a note. | D6 adds the action check. A try passes only when every item is yes. |
| The line print shows a different pose from the color print. | The line prompt keeps the pose (D3). D6 item (g) shows the color print as a second picture. |
| The judge fails the picture only because the cast note gives Ben a light-blue shirt. | The fail stands. The second-judge rule applies. The PM report names the cause, and the PM decides. |
| The guard refuses on `U2_RUN.capUsd` (18.33 USD) while the spend is about 17.5 USD. | The maker never edits `U2_RUN.capUsd`. A refusal goes to the PM, who raises the cap. |
| A network fault uses a try. | The network check runs before each call. A failed check uses no try. |
| A foreign hunk in `measure/tracks.md` enters a commit. | The author stages the registry entry through a blob. |
| A heavy run starts while the machine has no free slot. | The orchestrator checks the slot. All `vitest` and `tsc` runs go through `heavy-run.sh`. |
| A text claims a picture acceptance other than D2. | FR-11. The checker greps the track files, the manifest, and the report. |

## Open questions answered by default

1. **Failed call at 0 USD.** It counts as a try of the id and kind, like the rule of the archived track
   (D4).
2. **Judge try number.** The ordinal of the cost row of the id and kind: color tries 2 to 4, and line
   tries 3 to 5 (D6).
3. **Action check as a separate call.** The v6 prompt and the batch tool stay frozen, so the action check
   is a separate call of the same model with its own prompt file (D6).
4. **Clothes of Ben in the color prompt.** The PM target needs a white vest under the yellow T-shirt, so
   the cast note and the "Do not change" sentence change in this row only (D3).
5. **File names of the T-shirt.** The look1 T-shirt files keep the `-v1` names and replace the v1
   T-shirt files in use. The old folders do not change on disk (D7).
6. **Hat-pip approval version.** Version 3, from color m3 and line try 3 (D2, D7).
7. **Report status line.** `Status: done.` when both jobs are delivered, `Status: partial.` when the
   T-shirt is a fail row, and `Status: blocked.` when a stop prevents the calls (D8).
8. **Fail only on the cast shirt color.** The fail stands. The PM report names the cause (Risks).
9. **Scratch folder.** `/tmp/opencode/l2look1/`.
