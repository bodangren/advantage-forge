# Specification: Storytime Level 2 unit 2 run tooling (unpaid)

## Overview

The PM decided on the unit 2 pictures. The paid run starts after Daniel's "Go" on the Workbooks
paid media list (due 2026-11-08 18:00). This track builds the unpaid tools that the paid run
needs: a unit 2 guard entry, a unit 2 option of the judge batch builder, a unit 2 delivery
writer, and a fix to the animal line-art sentence. The track spends 0 USD.

The track follows the archived tracks `asset_storytime_l2_unit2_prep_20261108` (the specs, the
element map, the hand-off folder) and `asset_storytime_l2_card_line_retry_20261107` (a guard
change with a test). It is a chore on the PM light lane of 2026-11-03: one maker and one checker.

## Owner order

PM decision 2026-11-08 (about 12:15 ICT), word for word:

> PM receipt: unit 2 picture prep done (~/Desktop/handoff/storytime-l2u2-picture-prep/, 257 OK; e010c5f6..241f7174; 0 USD pictures). Decisions: (1) Style = the unit 1 look (D8): yes. (2) Reuse for the 48 repeated check-row words: yes (same word, same picture, which helps the children; saves about 3.84 USD). (3) The 10 element sheets go in the paid run: yes. (4) Do the unpaid fix round NOW, before the Go: the unit 2 guard entry (its cap stays empty, so the guard refuses to run until the PM writes the approved limit), the judge-batch unit 2 option, the unit 2 delivery writer, and the fix to the animal line-art sentence. Take your slot through `scripts/jobs/slot wait` in the background (Monorepo goes first). The PM puts your 14.58 USD estimate with the Workbooks paid media list (due 18:00) into one Go request to Daniel.

The PM gave no approval of spend, and Daniel gave no "Go". The cap stays empty in this track.

## Context (read only)

- The prep track made `docs/storytime/l2-unit2/` (`elements.json`, `rows.json`, `prompt-list.*`,
  229 row specs in `w09` to `w16/muse/`, 10 element specs in `w<nn>/muse-elements/`),
  `scripts/storytime-u2-specs.mjs`, `tests/storytime-u2-specs.test.ts`, and the hand-off folder
  `/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep/`. The folder is built by
  `measure/runs/asset_storytime_l2_unit2_prep_20261108/make-handoff.mjs`.
- The muse tool `scripts/storytime-muse.mjs` calls `runGuards(unitRoot, ...)` with `UNIT_ROOT`
  `out/storytime/l2/unit1` (lines 27 and 403 to 414).
- The guard `scripts/storytime-muse-guards.mjs` has `CARD_RUN` (`startTime`, `capUsd`,
  `reportAtUsd`, `marginUsd`, `maxTries`, `outDir`), `CARD_LINE_RETRY`, `classifyOutDir` (kinds
  `card`, `restart`, `invalid`), and `runGuards`. A unit 2 `outDir` is now `invalid` and refused.
- The judge batch builder `scripts/storytime-judge-batch.mjs` has `--cards` and `--family-words`.
- The delivery code `src/storytime/muse-delivery.ts` has `writeMuseDelivery` (picture list rows,
  approval list with the `pictureListSha256` pin, `StorytimeManifest`), `deliverMuseCover`, and
  `deliverMuseColorSet`.
- The frozen judge kit is `docs/storytime/l2-unit1/judge/` (prompt v6 and `cast.json`). Do not
  change it.
- Unit 2 list (read only): `/home/daniebo/Desktop/Workbooks/content/storytime/drafts/l2/print/pictures-u2.json`,
  SHA-256 `63d415000eca9d6be1a6ad533c12ff81e127cd2c76ffac339697f91b99f754ec`.
- Workbooks delivery rule (its `forge-brief.md`, section 7): each batch folder has `manifest.json`
  with, for each file, the file name, the picture-list id, the SHA-256, and the pixel size.

## Decisions

The author set these defaults. The PM can change each one.

- **D1 Guard.** A new constant `U2_RUN` in `scripts/storytime-muse-guards.mjs` holds `startTime`
  (the real UTC time of Task 1, cut to the minute), `capUsd` null (empty), `reportAtUsd` null,
  `marginUsd` 0.01, `maxTries` 3, and `unitRoot` `out/storytime/l2/unit2`.
  - `classifyOutDir` gets the kind `u2` for `out/storytime/l2/unit2/w<nn>/muse` and
    `out/storytime/l2/unit2/w<nn>/muse/elements` only (w09 to w16).
  - A `u2` call reads only unit 2 cost files.
  - While `capUsd` is null or not a positive number, `runGuards` refuses every `u2` call with
    code 3 and the message `refused: the unit 2 cap is empty; the PM writes the approved limit in U2_RUN.capUsd`.
  - A call that mixes `u2` specs with other specs is refused.
  - Unit 1, card, and line-retry behavior does not change. Their tests pass without change.
  - The muse tool changes only as much as it must to send unit 2 specs to the unit 2 root. It
    has no other change.
  - The later PM-approved change writes the cap in one line. That change is outside this track.
- **D2 Judge batch.** A `--unit2` option.
  - Spec folder: `docs/storytime/l2-unit2/w<nn>/muse` (and `muse-elements` for element ids).
    Batch files go to `docs/storytime/l2-unit2/judge/prod/`. Judge copies go to
    `out/storytime-review/judge/prod-u2/` (story and cover 900 px long side, class C 360 px, as now).
  - The try count reads the unit 2 cost rows since `U2_RUN.startTime`, in time order. The
    zero-cost failure rule stays.
  - `mustShow` of a unit 2 row is the cast names of `rows.json` plus the object counts of the list
    row (`<count> <object>`), or the card word for class C.
  - The frozen judge prompt and `cast.json` are used as they are.
  - `--unit2` cannot run with `--cards` or `--family-words`.
- **D3 Delivery writer.** `deliverMuseUnit2` in `src/storytime/muse-delivery.ts` (or in a new file
  `src/storytime/muse-delivery-u2.ts`) writes one delivery folder with `manifest.json`. The
  manifest has the `StorytimeManifest` shape of unit 1 and the pin of the list SHA-256 above.
  - A row with a Muse approval entry copies the color and line print files. Class A and B are
    4000 x 3000. Class C is 1500 x 1500. The format is PNG, 8-bit, with no alpha.
  - The 48 reuse rows (the `reuse` source in `rows.json`, PM decision 2) copy the color file of
    the reuse source and its line twin under the new row names, with the same checks. A reuse
    source that is missing or fails a check stops the write and names the row id.
  - A row with no entry and no reuse gets no job and the `onSkip` callback reports it.
- **D4 Animal line sentence.** The check-row line prompts of the face words reuse the cat ear
  sentence. A duck or a doll gets ears, and the elephant trunk is not named (checker finding F8
  of the prep track). The fix is in `scripts/storytime-u2-specs.mjs` with one line-feature
  sentence for each word:
  - duck: a flat bill and folded wings, no ears;
  - doll: hair and a dress, no animal ears;
  - elephant: big round ears and a long trunk;
  - horse: pointed ears and a mane;
  - goat: pointed ears, small horns, and a small beard;
  - dog, cat, fish, and hen: the maker writes the sentence of the same form.
  The maker regenerates the specs and the prompt list, rebuilds the hand-off folder with
  `make-handoff.mjs`, and `sha256sum -c MANIFEST.txt` gives 0 failures. The test
  `tests/storytime-u2-specs.test.ts` gets a check that no line prompt of duck, doll, fish, or hen
  names ears, and that the elephant line prompt names the trunk.
- **D5 Spend 0 USD.** No Muse or OpenRouter call runs. The `costs.tsv` files stay unchanged
  (the SHA-256 before and after are equal). Tests use temp folders and small generated PNG
  fixtures.

## Functional Requirements

- **FR-1 Guard refusal.** With `capUsd` null, 0, negative, or a string, every `u2` call is
  refused with code 3 and the exact message of D1. A test-only cap value lets a `u2` call pass the
  cap check in the unit test. A mixed call is refused.
- **FR-2 Guard scope.** `classifyOutDir` gives `u2` for the 8 weekly `muse` folders and their
  `elements` folders, and `invalid` for every other unit 2 path (a mutated name or a `..` escape).
- **FR-3 Unit 1 unchanged.** The blocks `CARD_RUN` and `CARD_LINE_RETRY` are byte equal. The tests
  of unit 1, card, and line retry pass without change.
- **FR-4 Judge option.** `--unit2` builds the batch files and the judge copies of D2 from temp
  fixtures. It refuses `--cards` and `--family-words` together with `--unit2`.
- **FR-5 Delivery.** `deliverMuseUnit2` meets D3. Tests cover the fixtures, the reuse copy, the
  size check, the alpha check, and the pin refusal.
- **FR-6 Line sentence.** D4 and its test pass. `sha256sum -c MANIFEST.txt` in the hand-off folder
  gives 0 failures.
- **FR-7 Zero spend.** `costs.tsv` hashes before and after are equal. No paid call ran.
- **FR-8 Claims.** No file of the track says that Daniel or Workbooks accepted a unit 2 picture or
  gave a "Go". No file writes a cap value in `U2_RUN`.
- **FR-9 Git.** No PNG or JPG enters git. The track commits explicit paths only.
- **FR-10 Frozen files.** The judge kit, every unit 1 path, `assets/fireball.ts`, `out/fireball/`,
  and Workbooks have no change.

## Non-Functional Requirements

- All prose follows ASD-STE100.
- Every full test run and typecheck runs through `heavy-run.sh`, one at a time.
- The maker commits explicit paths only. Other agents share the git index.
- No song or video command runs.

## Test commands

GREEN test command:

```
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/vitest run tests/storytime-u2-guards.test.ts tests/storytime-u2-judge-batch.test.ts tests/storytime-u2-delivery.test.ts tests/storytime-u2-specs.test.ts tests/storytime-card-guards.test.ts tests/storytime-card-line-retry.test.ts tests/storytime-muse-attempts.test.ts tests/storytime-judge-batch.test.ts tests/storytime-muse-delivery.test.ts tests/storytime-muse-delivery-adversarial.test.ts tests/storytime-card-adversarial.test.ts tests/storytime-family-word-judge.test.ts tests/storytime-family-word-delivery.test.ts --maxWorkers=1'
```

When `src/` changes, the maker also runs `./node_modules/.bin/tsc --noEmit -p .` through
`heavy-run.sh`. The old repository count of type errors may stay, but `src/storytime/`,
`scripts/storytime-`, and `tests/storytime-` must give 0 new errors.

## Owned paths

- `scripts/storytime-muse-guards.mjs` (and its `.d.mts`)
- `scripts/storytime-muse.mjs` (the unit 2 routing only)
- `scripts/storytime-judge-batch.mjs` (and its `.d.mts`)
- `src/storytime/muse-delivery.ts` or `src/storytime/muse-delivery-u2.ts`
- `scripts/storytime-u2-specs.mjs`
- `docs/storytime/l2-unit2/**`
- `tests/storytime-u2-guards.test.ts`, `tests/storytime-u2-judge-batch.test.ts`,
  `tests/storytime-u2-delivery.test.ts`, `tests/storytime-u2-specs.test.ts`
- `/home/daniebo/Desktop/handoff/storytime-l2u2-picture-prep/`
- `measure/tracks/asset_storytime_l2_unit2_tooling_20261108/`
- `measure/runs/asset_storytime_l2_unit2_tooling_20261108/`
- `measure/tracks.md` (the registry entry and the closeout)

Not owned: every unit 1 path, the judge kit, `assets/**`, `assets/fireball.ts`, `out/fireball/`,
and Workbooks.

## Acceptance Criteria

1. The GREEN test command passes at the audited HEAD, and the typecheck gives 0 new errors in the
   storytime paths.
2. The checker probes the guard: every `u2` call is refused with an empty cap, and the unit 1 and
   card calls behave as before.
3. The checker runs `sha256sum -c MANIFEST.txt` in the hand-off folder and gets 0 failures.
4. The checker finds the `costs.tsv` hashes equal before and after.
5. The line prompts meet D4.
6. `pm-report.md` exists. Its first line is `Status: done.` It then names the hand-off MANIFEST
   count, the guard state `cap empty, refuses all unit 2 calls`, and a `Facts changed:` list.
7. The checker greps FR-8, and finds no violation.

## Human gate

Daniel's "Go" on the Workbooks paid media list opens the paid run. The PM writes the approved
limit in `U2_RUN.capUsd` after the "Go". Both steps are outside this track.

## Out of Scope

- Any paid Muse, OpenRouter, or other provider call.
- A value in `U2_RUN.capUsd`.
- A change to the judge kit, to unit 1 behavior, or to the Workbooks repository.
- The paid run itself and the judge of any unit 2 picture.

## Open questions answered by default

1. **Guard start time.** The real UTC time of Task 1, cut to the minute (D1).
2. **Element ids in the judge option.** They use `muse-elements` folders (D2).
3. **File choice of the delivery writer.** The maker may use a new file `muse-delivery-u2.ts` to
   keep `muse-delivery.ts` small (D3).
4. **Sentence form for dog, cat, fish, and hen.** The maker follows the form of the five given
   sentences (D4).
