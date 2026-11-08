# Specification: Storytime Level 2 unit 2 picture prep (unpaid)

## Overview

Daniel decides on the Workbooks paid media list at 18:00 on 2026-11-08. After his "Go", the paid
run for the 229 unit 2 pictures must start at once. This track does every unpaid step before the
"Go". It drafts one Muse spec for each of the 229 rows, maps each row to its element sources,
makes the local 3D element renders that the Muse composites need, and puts all of it in one
hand-off folder with a MANIFEST. The track spends 0 USD.

The track follows the archived tracks `asset_storytime_l2_unit1_pictures_20261025`,
`asset_storytime_l2_cards_20261106`, and `asset_storytime_l2_card_line_retry_20261107`. It is a
chore on the PM light lane of 2026-11-03: one maker and one checker.

## Owner order

PM request 2026-11-08 (about 10:16 ICT), word for word:

> PM → Forge: a slot is free, and you have no running role. Next work (P1, Storytime unit 2): prepare every unpaid step for the unit 2 pictures now, so that the paid run can start at once after Daniel's "Go" on the Workbooks paid media list (due 11-08 18:00). Steps: (1) read the approved unit 2 English text and scene list in the Workbooks repo (read only); (2) draft the Muse prompts per picture in the printed-book style B (hair and clothes, never skin or ethnicity); (3) make the local 3D element renders that the Muse composites need, only through heavy-run.sh. Spend 0 USD. Done when: a hand-off folder holds the prompt list, the renders, and a MANIFEST with checksums, and you send me one line (folder, count, open questions with your defaults). Route by `ra-quota pick` (Kimi and MiniMax are WAIT). Time box: 2 h.

Time box end: 2026-11-08 12:20 ICT. The word "approved" in the PM text names the unit 2 English text.
Daniel approved that text on 2026-11-07 at 05:04 ICT (the `approval` source in `w09.json`, with 6
defaults). Daniel has not approved any unit 2 picture or any spend.

## Inputs (read only)

Forge never writes in `/home/daniebo/Desktop/Workbooks`.

| File (under `/home/daniebo/Desktop/Workbooks/`) | SHA-256 |
| --- | --- |
| `content/storytime/drafts/l2/print/pictures-u2.json` (229 rows: id, week, use, text, prompt, objectCounts, sizeClass, fileName, lineArtFileName, width, height) | `63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec` |
| `content/storytime/drafts/l2/print/card-pictures-u2.json` | `d24d534361d84ad9b4ebc27f3571e0380fc59f6d493442043d4207fa7eae9059` |
| `content/storytime/drafts/l2/print/pictures-u2.md` | `fbf80559419b1fefcc97834cd146c245f437e479365c507c1616cb094bb4e24f` |
| `measure/tracks/storytime_l2_unit2_20261106/forge-brief.md` (scenes, cast, and props per week; read sections 3 and 4) | `c1bbb491a35f10b60bea5f43d30d09d5ac3daab39924c2996b25ba1a98b4ef83` |
| `content/storytime/drafts/l2/w09.json` to `w16.json` (the English text) | measured by the maker in Task 1 |

The Workbooks spec of that track has default D8 "Picture style: The unit 1 style without change"
and D4 "The unit 1 cast only: no new character, so no new Forge cast sheet".

## Decisions

The orchestrator set these decisions. The maker decides none of them. The PM report names each
one as a default.

- **D1 Style.** The unit 1 Muse look without change (Workbooks D8). Forge reads the PM words
  "printed-book style B" as the approved picture-book look of unit 1: smooth, clean, bright,
  soft, round 3D render look, as in the unit 1 specs. A prompt describes a person by hair and
  clothes only. No prompt names skin color, skin tone, complexion, race, or ethnicity. The unit 1
  eye rule text about "a pale skin flap" at an eye corner is a rendering-error rule and stays.
- **D2 Rows.** All 229 rows of `pictures-u2.json` get one Muse spec each, in list order. The goal
  text of a row starts from the Workbooks row prompt. The Workbooks list has priority over the
  brief.
- **D3 Same word, same use.** A class C check-row whose word already has a delivered unit 1
  check-row picture, or an earlier unit 2 check-row of the same word, is marked `reuse` in the
  prompt list with the source file. Its spec is still written. Default for the paid run: copy
  the reuse source under the new row name (0 USD), unless the PM says otherwise.
- **D4 Cast.** The unit 1 cast only. The cast reference files are the `source` paths of
  `docs/storytime/l2-unit1/judge/cast.json` (read only; the judge kit stays frozen). Nan also
  takes `nan-ref-clean-face-crop.png` as in the unit 1 specs. No new cast sheet and no new pose
  render.
- **D5 Elements.** Each set and each prop of a row has one element source, in this order:
  (a) a Forge render: `out/<asset>/views/three-quarter.png` (or `side.png` for fish, as in unit 1)
  of an existing Forge asset that unit 1 used or that `assets/` lists (for example dog, cat, fish,
  bed, chicken for the hen, goat, chair, window, bread, bowl, barn, fence, table,
  storytime-school-bus, storytime-child-cup, storytime-low-table, storytime-green-door,
  storytime-picture-book, storytime-school-bag, storytime-crayon-box, storytime-sun-hat);
  (b) a unit 1 Muse element file of `out/storytime/l2/unit1/*/muse/elements/`
  (`set-*-m<n>-color.png`, `prop-*-m<n>-color.png`);
  (c) a new Muse element sheet for the paid run: the maker drafts its spec in the unit 1 element
  shape (`docs/storytime/l2-unit1/w07/muse-elements/set-tom-living-room-empty.json`) with
  `outDir` `out/storytime/l2/unit2/w<nn>/muse/elements`;
  (d) text only, for a simple object.
  The element map goes to `docs/storytime/l2-unit2/elements.json`.
- **D6 Renders.** Local 3D renders run only through
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`
  (exit 75 means hold; retry later), one at a time. The maker renders a Forge asset of the element
  map only when its views file does not exist (`./forge render <asset>`). Existing views are used
  as they are. The maker changes no asset source. The hand-off folder gets a copy of every Forge
  render file that a spec names.
- **D7 Spend 0 USD.** No Muse, OpenRouter, or other paid call runs. Proof: the SHA-256 of every
  `costs.tsv` under `out/storytime/` before and after the work is equal. The guard
  `scripts/storytime-muse-guards.mjs` refuses a unit 2 `outDir`, so the muse tool cannot run a
  unit 2 spec. The track does not change the guard, `scripts/storytime-muse.mjs`, the judge kit,
  or any unit 1 file.
- **D8 Next steps.** These unpaid steps come after the "Go" and are out of scope. The PM report
  names them: a unit 2 entry in the guard with the cap of Daniel's "Go", a unit 2 flag of the
  judge batch builder, and a unit 2 delivery writer.

## Method

### Spec shape and shared rule text

The spec maker `scripts/storytime-u2-specs.mjs` runs with `node`. It uses no network. It takes
its inputs as path arguments. For each row it writes one spec with the unit 1 spec fields: `id`,
`text`, `goal`, `references`, `colorPrompt`, `linePrompt`, `print`, `aspect`, and (for class C)
`printSize`, plus `outDir` `out/storytime/l2/unit2/w<nn>/muse`. The shared rule text of
`colorPrompt` and `linePrompt` is copied word for word from named approved unit 1 specs of the
same use:

- story page and cover: the week 7 or week 8 specs under `docs/storytime/l2-unit1/`;
- check-row: the week 7 specs;
- card: the specs in `docs/storytime/l2-unit1/cards/`.

The maker names the source spec of each use in the script header. Class A and B rows are 4:3.
Class C rows are 1:1 with `printSize` 1500 x 1500.

### Outputs

- `docs/storytime/l2-unit2/elements.json`: the element map (source, order, path, status).
- `docs/storytime/l2-unit2/rows.json`: for each row, the cast names, the set, the props with their
  element sources, and the reuse source when D3 applies.
- `docs/storytime/l2-unit2/w09/muse/<row-id>.json` to `w16/muse/<row-id>.json`: the 229 row specs.
- `docs/storytime/l2-unit2/w<nn>/muse-elements/<element>.json`: the new element specs (D5 c).
- `prompt-list.tsv` and `prompt-list.md`: row id, week, use, class, size, text, element sources,
  reuse source, new or reuse, color prompt.

### Hand-off folder

`/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep/` holds:

- `prompt-list.tsv` and `prompt-list.md`;
- `specs/` with the 229 row specs and the new element specs;
- `renders/` with a copy of every Forge render file that a spec names;
- `elements-reused.tsv`: the unit 1 element files that the specs name, with SHA-256 (not copied);
- a contact sheet of `renders/`;
- `README.md`: the counts (rows, new rows, reuse rows, new element sheets, renders made now and
  reused), the cost estimate at 0.080 USD for each new row plus 0.01 USD for each new element
  sheet, and the open questions with defaults;
- `MANIFEST.txt` in `sha256sum` form for every file. `sha256sum -c MANIFEST.txt` gives 0 failures.

### Run record and report

The run folder `measure/runs/asset_storytime_l2_unit2_prep_20261108/` holds `inputs.txt`,
`costs-before.txt`, `costs-after.txt`, `render-log.txt`, the role logs, the acceptance result,
and `pm-report.md`. The report starts with `Status: done.` and then names the folder, the file
count, and the open questions with their defaults. It ends with a "Facts changed:" list. The
maker sends the PM one line: folder, count, open questions with defaults.

## Functional Requirements

- **FR-1 Input record.** `inputs.txt` holds the SHA-256 of each input. When `pictures-u2.json`
  differs from the SHA-256 in the section "Inputs", the maker stops and reports.
- **FR-2 Specs.** There are 229 specs, with ids and order equal to the list. Class A and B are
  4:3. Class C is 1:1 with `printSize` 1500 x 1500. `outDir` is below `out/storytime/l2/unit2/`.
- **FR-3 References.** Every reference of every spec exists on disk, or it is the output path of
  a drafted new element spec.
- **FR-4 Style words.** No spec holds a forbidden word: skin color, skin colour, skin tone,
  complexion, ethnic, ethnicity, race, racial. Every `colorPrompt` says that the picture has no
  letters, words, or numbers.
- **FR-5 Test.** `tests/storytime-u2-specs.test.ts` checks FR-2 to FR-4 and passes with
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-u2-specs.test.ts --maxWorkers=1'`.
- **FR-6 Reuse.** Each reuse row names its source file. Each reuse source exists on disk.
- **FR-7 Renders.** `render-log.txt` holds, for each render, the command, the exit code, the time,
  and the file made. It holds no `warning:` line. No asset source changes.
- **FR-8 Hand-off.** The hand-off folder meets the section "Hand-off folder". `sha256sum -c
  MANIFEST.txt` gives 0 failures.
- **FR-9 Zero spend.** `costs-after.txt` equals `costs-before.txt`. No Muse or paid call ran.
- **FR-10 Claims.** No file of the track says that Daniel or Workbooks accepted a unit 2 picture or
  gave a "Go". The word "approved" appears only in the PM quotation and in the sentence that
  explains it.
- **FR-11 Git.** No PNG or JPG enters git. The track commits explicit paths only.
- **FR-12 Frozen files.** The guard, `scripts/storytime-muse.mjs`, `scripts/storytime-judge-batch.mjs`,
  the judge kit, every unit 1 path, `assets/fireball.ts`, and `out/fireball/` have no change.

## Non-Functional Requirements

- All prose follows ASD-STE100.
- The spec maker and file checks run with plain `node`. Every render, test run, and typecheck runs
  through `heavy-run.sh`, one at a time.
- The maker commits explicit paths only. Other agents share the git index.
- No song or video command runs.

## Owned paths

- `docs/storytime/l2-unit2/**`
- `scripts/storytime-u2-specs.mjs`
- `tests/storytime-u2-specs.test.ts`
- `out/<asset>/` only for an asset that had no views
- `measure/tracks/asset_storytime_l2_unit2_prep_20261108/`
- `measure/runs/asset_storytime_l2_unit2_prep_20261108/`
- `measure/tracks.md` (the registry entry and the closeout)
- `/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep/`

Not owned: `assets/fireball.ts`, `out/fireball/`, every unit 1 path, the judge kit, the guard, and
the muse tool.

## Acceptance Criteria

1. FR-5 test passes at the audited HEAD, and the spec maker run is repeatable (a second run gives
   equal files).
2. `rows.json`, `elements.json`, and the prompt list agree on the 229 rows, the reuse rows, and the
   element sources.
3. The checker runs `sha256sum -c MANIFEST.txt` in the hand-off folder and gets 0 failures.
4. `costs-after.txt` equals `costs-before.txt`.
5. `render-log.txt` meets FR-7, and `git status` shows no change in an asset source.
6. The PM report exists and meets the section "Run record and report".
7. The checker greps FR-4 and FR-10, and finds no violation.

## Human gate

Daniel's "Go" on the Workbooks paid media list (due 2026-11-08 18:00) opens the paid run. It is
outside this track. The track records no Go, no acceptance of a picture, and no spend approval.

## Out of Scope

- Any paid Muse, OpenRouter, or other provider call.
- The D8 steps: the guard entry for unit 2, the judge batch flag, and the delivery writer.
- A new cast sheet, a new pose render, or a change to an asset source.
- A change to the Workbooks repository.
- A change to the judge kit, the guard, or the muse tool.

## Open questions answered by default

The PM can change each default.

1. **Style B.** The default is the unit 1 look (D1).
2. **Reuse rows.** The default copies the reuse source (D3).
3. **Element source order.** The default is Forge render, then unit 1 Muse element, then new Muse
   element sheet, then text only (D5).
4. **Brief path.** The PM text names `forge-brief.md` under the track path of this repository. The
   file is in the Workbooks repository. The default reads that file by its SHA-256.
5. **Row prompt priority.** The Workbooks row prompt wins over the brief (D2).
