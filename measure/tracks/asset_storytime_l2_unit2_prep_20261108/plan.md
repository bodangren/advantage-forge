# Storytime Level 2 unit 2 picture prep (unpaid)

Status: new (2026-11-08). The track drafts the Muse specs, the element map, and the local renders
for the 229 unit 2 pictures, with 0 USD spend. The [specification](./spec.md) owns the scope and
the acceptance gates.

## Method and ownership

- Primary owner: the Measure orchestrator for this track.
- Owned paths are in the "Owned paths" section of the specification. The owned planning paths are
  this folder and `measure/runs/asset_storytime_l2_unit2_prep_20261108/`.
- Do not change `assets/fireball.ts` or `out/fireball/`. Their owner review stays separate.
- Do not change the judge kit, the guard `scripts/storytime-muse-guards.mjs`,
  `scripts/storytime-muse.mjs`, `scripts/storytime-judge-batch.mjs`, or any unit 1 file.
- The question tool is denied. Route every question for Daniel through the PM orchestrator.
- Other agents share the git index. The maker commits explicit paths only.
- The maker marks a task `[~]` before the task changes a file outside `measure/` (measure-guard).
- No PNG or JPG goes into git. The renders and hand-off pictures stay in `out/` and in the
  hand-off folder.
- Every render, test run, and typecheck runs with
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`,
  one at a time. Exit code 75 means hold: retry later.
- Spend limit: 0 USD. No Muse, OpenRouter, or other paid call runs.
- The hand-off folder is a model-made draft. It is not acceptance, and it is not a "Go".
- Time box end: 2026-11-08 12:20 ICT.

PM 2026-11-03: light lane. The PM put this whole track on the light lane: one maker
(`measure-jr-green`) and one checker (`measure-phase-acceptance`), then closeout. No spec review,
test strategy, Red, Review A, Review B, Review C, adversarial, UX review, or final acceptance role
runs. The maker writes the script, the test, the specs, and the renders. The checker checks the
phase at an immutable HEAD.

### Task markers

`[x]` means complete. `[~]` means in progress. `[ ]` means ready and not started. `[b]` means
blocked, with a trailing `deferred:<owner>` field. The doctor counts only `[ ]`, `[~]`, and `[x]`.

## Phase 0: Authoring [checkpoint: e010c5f]

- [x] Task 0 (e010c5f6): Author the track: specification, plan, metadata, index, spec review note, and the
  registry entry. The creation commit has the message
  `measure(storytime_l2_unit2_prep): create the track`.

The light lane has no spec review gate. The orchestrator adds the checkpoint of the creation
commit to this heading before Phase 1 starts (measure-guard).

## Phase 1: Prompt drafts, renders, and hand-off

Light lane. One maker (`measure-jr-green`). One checker (`measure-phase-acceptance`).

- [x] Task 1 (7ff505ef): Input record. Write the SHA-256 of the inputs in
  `measure/runs/asset_storytime_l2_unit2_prep_20261108/inputs.txt`. Stop and report when
  `pictures-u2.json` differs from `63d41500...`. Write the baseline `sha256sum` of every
  `out/storytime/**/costs.tsv` in `costs-before.txt`.
- [x] Task 2 (f02e1e28): Element map and row table. Write `docs/storytime/l2-unit2/elements.json`, the row
  table `docs/storytime/l2-unit2/rows.json` (per row: cast names, set, props with their element
  sources, reuse source if D3 applies), and the drafted new element specs (D5 c).
- [x] Task 3 (f02e1e28): Spec maker and test. Write `scripts/storytime-u2-specs.mjs` (node, no network,
  inputs by path arguments). It writes the 229 row specs in the unit 1 spec shape, `prompt-list.tsv`,
  and `prompt-list.md` (row id, week, use, class, size, text, element sources, reuse source, new or
  reuse, color prompt). It copies the shared rule text of `colorPrompt` and `linePrompt` word for
  word from the named approved unit 1 specs of the same use (story page and cover: week 7 or 8;
  check-row: week 7; card: `docs/storytime/l2-unit1/cards/`). Write
  `tests/storytime-u2-specs.test.ts`. It checks: 229 specs; ids and order equal the list; class A
  and B are 4:3; class C is 1:1 with `printSize` 1500 x 1500; every reference exists on disk or is
  the output path of a drafted new element spec; no forbidden word; every `colorPrompt` says no
  letters, words, or numbers; `outDir` is below `out/storytime/l2/unit2/`. Run the test with
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-u2-specs.test.ts --maxWorkers=1'`.
- [x] Task 4 (7ff505ef): Local 3D renders by D6, one at a time, only for an asset with no views file. Write
  `render-log.txt` (command, exit code, time, the file made, no `warning:` line).
- [x] Task 5 (7ff505ef): Hand-off folder `/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep/`:
  `prompt-list.tsv`, `prompt-list.md`, `specs/` (the 229 row specs and the new element specs),
  `renders/` (a copy of every Forge render file that a spec names), `elements-reused.tsv` (unit 1
  element files that the specs name, with SHA-256, not copied), a contact sheet of `renders/`,
  `README.md` (counts of rows, new rows, reuse rows, new element sheets, renders made now and
  reused; the cost estimate at 0.080 USD for each new row plus 0.01 USD for each new element
  sheet; the open questions with defaults), and `MANIFEST.txt` in `sha256sum` form for every file.
  `sha256sum -c MANIFEST.txt` gives 0 failures.
- [x] Task 6 (7ff505ef): Zero-spend proof and report. `costs-after.txt` equals `costs-before.txt`. Write
  `measure/runs/asset_storytime_l2_unit2_prep_20261108/pm-report.md`: the first line is
  `Status: done.` with the folder, the file count, and the open questions with defaults; then the
  next unpaid steps of D8; then a "Facts changed:" list. Send the PM one line: folder, count,
  open questions with defaults.
- [b] Phase 1 gate: phase acceptance by the checker (`measure-phase-acceptance`) at an immutable
  HEAD. (deferred:checker)
  - The checker runs the test command of Task 3, `sha256sum -c MANIFEST.txt` in the hand-off
    folder, and the comparison of `costs-after.txt` with `costs-before.txt`.
  - The checker greps FR-4 and FR-10, and checks the frozen files of FR-12 and `git status` for
    asset sources.

## Track-level roles

- [b] Closeout: archive the track, update the registry, and run the doctor. (deferred:closeout)

The light lane has no final acceptance role. Closeout commits `measure/runs/<track>/` with the
archive.

## Human gate

Daniel's "Go" on the Workbooks paid media list (due 2026-11-08 18:00) opens the paid run. It is
outside this track. The track records no Go and no acceptance of a picture.

## Risks

| Risk | Control |
| --- | --- |
| A Muse call runs and costs money. | The guard refuses a unit 2 `outDir`. FR-9 compares the `costs.tsv` hashes before and after. |
| A prompt names skin color or ethnicity. | FR-4 test with the forbidden word list. D1 says hair and clothes only. |
| The Workbooks list changes during the work. | Task 1 records the SHA-256 and stops when `pictures-u2.json` differs. |
| A render overloads the machine. | Every render runs through `heavy-run.sh`, one at a time. Exit 75 means hold. |
| A render changes an asset source or a foreign path. | D6 forbids it. The checker reads `git status`. |
| A reference path does not exist at the paid run. | FR-3 test: each reference exists, or it is the output path of a drafted element spec. |
| The prompt list drifts from the Workbooks row prompt. | D2: the goal starts from the Workbooks row prompt. The script reads the list at run time. |
| A foreign hunk in `measure/tracks.md` enters the commit. | The author staged the registry entry through a blob. `git diff --cached` shows the entry only. |
| The hand-off text says the pictures are accepted. | FR-10. The checker greps the track files, the README, and the report. |

## Evidence

- Track creation commit: recorded at creation (message
  `measure(storytime_l2_unit2_prep): create the track`).
- Run records: `measure/runs/asset_storytime_l2_unit2_prep_20261108/` (inputs, costs, render log,
  role logs, PM report, acceptance result).
