# Chibi Sprouts cast on the Kim base: plan

Status: new (created 2026-11-25). No character work has started. Amendment round 1 answers the spec
review of 2026-11-25. The plan records execution state. `spec.md` holds the contract, the tables,
and the acceptance criteria. `test-strategy.md` holds the test plan.

Source: `QUEUE.md` item 3 and the Mom shape approval (redesign plan T12; judge record
`measure/runs/chibi_sprouts_redesign_20261123/judge.json`, identity 7.5 and proportion 8.5). The
design page is `docs/chibi-sprouts/redesign-2026-11-23.md` (approved).

Lane: light (PM rule 2026-11-25). `metadata.json` holds `"lane": "light"`. Four phases, one per
group: the measuring tools, the adults, the children, and the delivery.

Every render and every test run uses the heavy runner:

```bash
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'
```

A textured Forge command also takes a build slot. Shape iteration uses `--fast`.

**No customer-facing claim is made.** The track publishes nothing. The five panels, the cast sheet,
the judge records, and the handoff stay internal. The PM decides any external use, and Daniel's look
stays the last gate.

## Gates this track does not run

- No Review A, no Review B, and no Review C (spec decision o). Phase 1 runs one adversarial round,
  because two scripts change. Phase 2 starts only after a `pass` verdict with every blocking finding
  closed. Phases 2 to 4 run no adversarial round.
- No UX review. The look judge is the only look gate.
- No paid call, no `openchamber_image`, and no hosted model other than the approved judge route.
- No cut-out, no sprite, no walk clip, no song render, and no game skin.
- No `./forge all`.

The orchestrator may add Review A to Phase 1 if it judges the script risk higher. That is the only
permitted addition.

## Files this track touches

- `measure/tracks/chibi_sprouts_cast_20261125/*` (new)
- `measure/tracks.md` (one registry row)
- `measure/generated/status.md` (the generator run)
- `tests/proportion-cast-options.test.ts` (new, Red)
- `tests/sprout-cast-panel.test.ts` (new, Red)
- `tests/sprout-child-base.test.ts` (new, Red)
- `tests/cast-isolation.test.ts` (new, Red)
- `tests/fixtures/cast-baseline.json` (new, T0)
- `tests/sprout-dad-kim.test.ts`, `tests/sprout-grandma-kim.test.ts`,
  `tests/sprout-grandpa-kim.test.ts`, `tests/sprout-tom-kim.test.ts`,
  `tests/sprout-lily-kim.test.ts` (new, Red)
- `scripts/proportion-check.mjs` (Green: `--base`, `--table`, `--record`, `TABLES`, the child table,
  the rounded crown source, the destinations, the `faceMarks` exclusion, the Lily guards)
- `scripts/sprout-cast-panel.mjs` (new, Green)
- `assets/parts/humanoid-kim.ts` (Green: three aliases; no other change)
- `assets/parts/humanoid-kim-child.ts` (new, Green)
- `assets/sprout-dad-kim.ts`, `assets/sprout-grandma-kim.ts`, `assets/sprout-grandpa-kim.ts`,
  `assets/sprout-tom-kim.ts`, `assets/sprout-lily-kim.ts` (new, Green)
- `tests/fixtures/preset-pin.json` (five new keys, written by `scripts/make-preset-pin.mjs`)
- `out/sprout-*-kim/` and `out/chibi-sprouts/cast/` (not in git)
- `measure/runs/chibi_sprouts_cast_20261125/` (the judge records, the escalation file, the handoff)

The track changes no scrapped source, no Mom asset, no shipped asset, and no game file.

## Role brief template

Every task brief carries these lines:

- Red writes tests only. Green writes the scripts and the assets. The orchestrator records each
  role's model id and family in the task record.
- The Red family and the Green family differ from each other and from the judge family. The judge is
  a separate role on `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia. The route is not
  muse, not hy4, and not OpenAI. A missing route waits; do not substitute.
- No role calls the `openchamber_image` tool. A role reads an image with `read`.
- No role edits a scrapped source and no role deletes a file.
- Every render and every test run uses the heavy runner.
- Every probe and every fixture stays in this worktree or under `/tmp`.
- A paid call, or a forbidden upload, is a stop-and-report event.
- A panel or a record is written only under the worktree `out/`. A linked, outside, or directory
  destination is a stop-and-report event.

The spec review is not run in this delegated session. The reason is in `spec-review.md`, and the
orchestrator started the review as the first step of Phase 1 on the review commit `b58aad2`.
Amendment round 1 answers every finding before Red.

## Phase 1: The measuring tools

- [ ] T0 Measure: Prepare the worktree outputs and the baselines.
  - Build and render Mom in the worktree `out/`, in this order (spec "The output tree"):
    `./forge build sprout-mom-kim --fast`, then the flat level render, then the lit level render.
  - Write `tests/fixtures/cast-baseline.json` from the track base commit `b58aad2`: one SHA-256 per
    scrapped source (`assets/sprout-*.ts`, `assets/parts/sprout-gestures.ts`), the `ADULT`, `AGE5`,
    and `HERO` export values, and Mom's preset entry of `tests/fixtures/preset-pin.json`.
  - Done-when: `out/sprout-mom-kim/sprout-mom-kim.glb`, `stats.json`, `flat/front-level.png`,
    `flat/side-level.png`, `views/front-level.png`, and `views/side-level.png` exist; the baseline
    file parses and holds every key; the plan records the six SHA-256 sums and the six paths.
  - Record: the commands, the six hashes, and the baseline key list.
  - Note: this task writes no asset, no test, and no script. A fresh worktree runs it again. The
    outputs are not committed.

- [ ] T1 Red: Pin the measuring options, the tables, the fixtures, the panel script, and the
      isolation baseline.
      Files: `tests/proportion-cast-options.test.ts`, `tests/sprout-cast-panel.test.ts`,
      `tests/sprout-child-base.test.ts`, `tests/cast-isolation.test.ts` (all new).
  - `tests/proportion-cast-options.test.ts` asserts:
    1. `--base humanoid-kim-child` reads `assets/parts/humanoid-kim-child.ts`; an absent file exits 1
       with `base humanoid-kim-child: not built` before any import.
    2. `--base` with an empty value, an absolute path, a path separator, or a dot-dot segment exits 1
       with `unknown base <stem>`.
    3. `--table child` uses the child table; an unknown or empty name exits 1 with
       `unknown table <name>: known kim, child`.
    4. `--record <path>` writes the record at the named path. A path outside `out/` exits 1 with
       `destination outside out/: <path>`.
    5. `TABLES` is an object of ordered arrays of `{ name, lo, hi }`, and `TABLES.kim` and
       `TABLES.child` equal the two spec tables, name, order, `lo` and `hi`.
    6. The selected table decides: `heightInHeads 3.00` passes `child` and fails `kim`; `3.60` passes
       `kim` and fails `child`.
    7. A row with `lo` and `hi` that differ from the table fails with
       `FAIL <name>: row limits <lo>..<hi> disagree with table <table>`, even when the value sits
       inside the row's own limits.
    8. The record holds the eleven table names in table order plus `lit`, and `rows.lit` is the
       `{ crown, sole, height }` pair per view.
    9. `checkRows(rows)` still uses `kim`, and `checkRows(rows, 'child')` uses `child`.
    10. `heightInHeads`, `legShare`, `eyeLine`, `eyeHeight`, the head-width band, and the eye window
        use the rounded projected crown. The mask top may sit above it by any amount and may not sit
        more than 2 px below it.
    11. The `bun-above-crown` fixture passes with a mask top 24 px above the crown, and its head
        height equals `chinRow - crownRow`. The `wrong-crown` fixture fails with
        `GUARD top on mask`. The five `measurePixels()` figures keep their results.
    12. The `glasses-frame` fixture finds two eye components with `faceMarks.glasses` and fails with
        `eye components: found 1, expected 2` without it.
    13. The Lily hair fixtures produce the three named Lily guards, and a planted hair row across the
        chin gives `GUARD lily chin: hair crosses the chin at row <r>`.
    14. A destination that is a link, a directory, or outside the tree exits 1 with the named line,
        and the tree hash is unchanged.
    15. `BASE_CROWN_Y`, `BASE_CHIN_Y`, and `BASE_HANDS` are the three exports of the adult base, and
        they equal `KIM.crown`, `KIM_CHIN_Y`, and `KIM_HANDS`.
  - `tests/sprout-cast-panel.test.ts` builds a temporary tree under `--root` with two synthetic
    256 × 256 renders, one synthetic 800 × 1600 drawing, and one record per asset. It asserts:
    1. one panel per name at `out/chibi-sprouts/cast/<name>-panel.png`, 1416 × 900,
    2. three cells at one 700 px body scale with one baseline at row 780 and the crown at row 80,
    3. the caption holds the asset name, the date, and the row result,
    4. the bun fixture keeps its bun pixels above the 700 px band, inside the 56 px headroom,
    5. the sheet is 1544 × 900, holds five figures at 466.667 px per metre, and one baseline; an
       adult is 700 px and a child 490 px,
    6. the `DRAWING_ROWS` export equals the five pairs of spec decision (n),
    7. a missing render exits 1 with `render <view>: not built`,
    8. a linked cast folder, a linked output file, a directory destination, and an outside
       destination each exit 1 with one line and are not followed, and the tree hash is unchanged,
    9. `--asset sprout-tom-kim` writes one panel and no sheet, and `--all` writes five panels and the
       sheet.
  - `tests/sprout-child-base.test.ts` asserts the fixed landmarks within the tolerances of spec
    "The landmarks and the tolerances", the 15-bone name set, one `idle` clip, one `hands` body, and
    that the module imports only `src/index.js`.
  - `tests/cast-isolation.test.ts` asserts every scrapped source hash, the `ADULT`, `AGE5`, and
    `HERO` values, and Mom's preset entry against `tests/fixtures/cast-baseline.json`.
  - Done-when: each file exits 1 inside its cases on an absent option, asset, or script. No collection
    error, no syntax error, and no import error. `prettier --check` exits 0 on the four files.
  - Record: the case names, the fixture bodies, and the failure text.

- [ ] T2 Green: Add the options, the tables, the rounded crown, the destinations, the face-mark
      exclusion, and the panel script.
      Files: `scripts/proportion-check.mjs`, `scripts/sprout-cast-panel.mjs` (new),
      `assets/parts/humanoid-kim.ts` (three aliases).
  - `scripts/proportion-check.mjs`: add `--base <stem>`, `--table <name>`, and `--record <path>`,
    the `TABLES` export of ordered `{ name, lo, hi }` arrays, `checkRows(rows, table = 'kim')` with
    the selected table authoritative and the row-limit check, the rounded projected crown and its
    one-sided mask guard, the destination checks of spec "The destinations", the `faceMarks`
    exclusion, the Lily guards, and the two new fixtures. The name checks and the one-line errors are
    those of the spec. The loading order is unchanged. The default record path stays
    `out/chibi-sprouts/redesign/measure.json`.
  - `scripts/sprout-cast-panel.mjs`: the five panels and the cast sheet of spec AC7, with the
    `DRAWING_ROWS` export, the `--asset`, `--all`, `--date`, and `--root` options, the copied
    `maskSpan`, `panel`, and `textSvg` conventions, the 56 px headroom, the 466.667 px per metre
    sheet scale, and the destination checks. It imports nothing from `scripts/mom-kim-sheet.mjs`.
  - `assets/parts/humanoid-kim.ts` adds `BASE_CROWN_Y = KIM.crown`, `BASE_CHIN_Y = KIM_CHIN_Y`, and
    `BASE_HANDS = KIM_HANDS`. No other line changes.
  - Done-when:
    - `HEAVY_MIN_AVAIL_MB=1500 bash ... heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts'`
      exits 0.
    - The Mom pin still exits 0:
      `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts`.
      The plan records her eleven rows before and after the change, and every row stays in range.
    - The Mom GLB, stats, and render hashes are unchanged before and after the change, with the same
      build type: `./forge build sprout-mom-kim --fast` on both sides, and a SHA-256 sum of the GLB,
      `stats.json`, and the four level renders.
    - `prettier --check` exits 0 on the three changed files.
    - `tsc --noEmit` reports the baseline error count of TD-35 to TD-39 and no error in the changed
      files.
  - Record: the exported symbols, the option names, the before and after Mom rows and hashes, and the
    two test runs.
  - Note: this task changes no renderer option and no existing render path. The two new named views
    already exist from the redesign track.

- [ ] T3 Measure: One adversarial round on the two scripts.
  - It reads the T2 commit and attacks the table selection, the row-limit rule, the base name, the
    record and panel destinations, the crown rounding and mask tolerance, the face-mark exclusion,
    the Lily guards, the panel scale and headroom, and the linked output. Report-only. It changes no
    file.
  - Done-when: the round writes
    `measure/runs/chibi_sprouts_cast_20261125/adversarial-p1-<sha>.json` with one finding per fault,
    a severity per finding, and a verdict. It names the audited commit.
  - Record: the audited commit, the findings, the severity of each, and the dispositions.

- [ ] T4 Measure: The Phase 1 gate.
  - Done-when:
    - the tool tests exit 0,
    - the Mom pin exits 0 with every row in range and the six hashes unchanged,
    - `tests/cast-isolation.test.ts` exits 0 against the T0 baseline,
    - `tests/sprout-child-base.test.ts` records its named absent-module case until T12,
    - the adversarial verdict is `pass`, every blocking finding is `closed`, and a new round ran
      after the last blocking finding,
    - `./measure/generate.sh` exits 0 and `./measure/doctor.sh --structural-only` exits 0,
    - the plan holds the adversarial verdict, every disposition, and the Mom row and hash record.
  - Record: the commands, the row and hash record, the verdict, and the dispositions.
  - Note: a `fail` verdict, or one open blocking finding, stops the gate. Phase 2 does not start.

## Phase 2: The adult variants

- [ ] T5 Red: Pin Dad, Grandma, and Grandpa.
      Files: `tests/sprout-dad-kim.test.ts`, `tests/sprout-grandma-kim.test.ts`,
      `tests/sprout-grandpa-kim.test.ts` (all new).
  - Each file runs `--asset <name> --table kim --record out/chibi-sprouts/cast/<name>-measure.json`
    on the build and renders that the Green task wrote. It requires exit 0, `Object.keys(record.rows)`
    equal to the eleven table names plus `lit`, each value inside `TABLES.kim`, each row limit equal
    to the table, both palms ok, and the record path.
  - The Grandma file also requires `GUARD top on mask` to be absent with a bun above the crown, and
    the record's `detail.maskTop` to be above `detail.projectedCrownRow`.
  - The Grandpa file also requires two eye components and the declared `faceMarks.glasses` in the
    record.
  - Done-when: each file exits 1 inside its case on the absent asset, with no collection error.
    `prettier --check` exits 0 on the three files.
  - Record: the case names and the failure text.

- [ ] T6 Green: Dad. File: `assets/sprout-dad-kim.ts` (new).
  - Build the identity of the spec: black swept-back hair, square jaw, thick brows, open smile, a
    red-and-black plaid shirt over a white tee, dark blue jeans, and brown boots. Import `buildKim`
    and `KIM`. Add the face layer, the jaw and brow body, and the mouth and brow paint of spec "The
    face layer and the paint". Declare `variants` and one preset `dad`.
  - Shape loop: build and run the lit level render, read it with `read`, write the three largest
    differences, fix the largest first.
  - Done-when:
    - `./forge build sprout-dad-kim --fast` exits 0 and writes the GLB and `stats.json`,
    - the flat and lit level renders exit 0 (spec "Build and render sequence"),
    - `tests/sprout-dad-kim.test.ts` exits 0 with the eleven rows of `TABLES.kim`, row limits equal
      to the table, and both palms ok,
    - `./forge check sprout-dad-kim` ends `result ok` (the check needs no sprite and no `./forge all`),
    - `scripts/sprout-cast-panel.mjs --asset sprout-dad-kim` writes the 1416 × 900 panel,
    - `scripts/make-preset-pin.mjs` adds exactly the key `sprout-dad-kim` and changes no value,
    - `prettier --check` exits 0 on the new asset,
    - `tsc --noEmit` has the baseline count and no error in the new file.
  - Record: the eleven rows, each look round's three differences, the Green model id and family, the
    GLB stats, the pin key check, the panel path, and the panel SHA-256.

- [ ] T7 Green: Grandma. File: `assets/sprout-grandma-kim.ts` (new).
  - Build the identity of the spec: white hair in a high bun, round cheeks, smile lines, pearl studs,
    a green cardigan over a pale green dress, a mid-calf skirt, and brown flats. The bun may rise
    above the skull. The measured crown is the base crown. Add the face layer and the cheek body of
    spec "The face layer and the paint". Declare `variants` and one preset `grandma`.
  - Shape loop and gates are T6's, with her own file and key.
  - Done-when: T6's list for `sprout-grandma-kim`, plus her `heightInHeads` and `eyeLine` rows come
    from the rounded projected crown and sit in the adult table, her bun stays in the side
    silhouette, and her mask top is above `detail.projectedCrownRow` in the record.
  - Record: T6's record for her, plus the mask top, the projected crown, and the head height.

- [ ] T8 Green: Grandpa. File: `assets/sprout-grandpa-kim.ts` (new).
  - Build the identity of the spec: a bald crown with white side hair, round dark-brown glasses, a
    white moustache, an open smile, a green V-neck sweater over a pale green collared shirt, brown
    trousers, and brown shoes. The glasses and the moustache are paint. Declare `variants`, one preset
    `grandpa`, and `faceMarks.glasses`. Add the face layer of spec "The face layer and the paint".
  - Shape loop and gates are T6's, with his own file and key.
  - Done-when: T6's list for `sprout-grandpa-kim`, plus no warning line from the glasses paint, two
    eye components separate from the frame and the moustache, and the record's `faceMarks`.
  - Record: T6's record for him, plus the eye-component result and the declared face marks.

- [ ] T9 Measure: The three adult look judges.
  - One brief per character. Each brief holds the panel path, the drawing path, the eleven rows as
    text, and the two scores. The route, the family rule, and the record shape are spec decisions
    (j), (k), and (l) and spec "The judge record".
  - The orchestrator computes the asset GLB hash, the record hash, and the panel hash before the
    judge runs. The verdict binds to that asset revision and that panel hash.
  - Done-when: `measure/runs/chibi_sprouts_cast_20261125/judge-<name>.json` exists for each of the
    three, the record holds every field of spec "The judge record", and identity and proportion are
    both 7.5 or more. A lower score returns the phase to the Green task of that character with the
    comment as the work list. A second score below 7.5 escalates to the PM per AC8 rule 6.
  - Record: the route, the model id and family, the Red and Green families, the three hashes, both
    scores, the verdict, the round, and the escalation when one applies.

- [ ] T10 Measure: The Phase 2 gate.
  - Done-when: the three pins exit 0, the three judges pass on the final asset revision and panel
    hash, each panel hash equals its judge record, `./forge check` ends `result ok` for each asset,
    the preset pin holds three new keys and no changed value, `./measure/generate.sh` exits 0, and
    `./measure/doctor.sh --structural-only` exits 0.
  - Record: the commands, the three verdicts, the hash pairs, and the pin diff.

## Phase 3: The children

- [ ] T11 Red: Pin Tom and Lily.
      Files: `tests/sprout-tom-kim.test.ts`, `tests/sprout-lily-kim.test.ts` (both new).
  - Each file runs
    `--asset <name> --base humanoid-kim-child --table child --record out/chibi-sprouts/cast/<name>-measure.json`
    on the build and renders that the Green task wrote. It requires exit 0, the eleven rows of
    `TABLES.child` in table order, each value inside the child table, each row limit equal to the
    table, both palms ok, and the record path.
  - The Lily file also requires the three Lily guards to be absent and the record's `detail` to hold
    the chin and head-height values.
  - Done-when: each file exits 1 inside its case on the absent asset. `prettier --check` exits 0.
  - Record: the case names and the failure text.

- [ ] T12 Green: The child base. File: `assets/parts/humanoid-kim-child.ts` (new).
  - Build the base of spec "The child base": the derived targets at 1.050 m, the 15 adult bone names,
    one `idle` clip, the hands body with the palms toward the legs, and the three landmark exports.
    Import only `src/index.js`.
  - Done-when:
    - the module exports `BASE_CROWN_Y`, `BASE_CHIN_Y`, and `BASE_HANDS`,
    - `tests/sprout-child-base.test.ts` passes its fixed-value cases within the tolerances of spec
      "The landmarks and the tolerances",
    - the file imports no other asset module,
    - `prettier --check` exits 0.
  - Record: the derived targets, the measured absolute values, the skeleton bone names, the clip
    name, and the three export values.

- [ ] T13 Green: Tom. File: `assets/sprout-tom-kim.ts` (new).
  - Build the identity of the spec on the child base: brown tousled hair with a side tuft, freckles,
    an open smile, a blue-and-orange striped tee, green shorts, white socks, and grey sneakers. The
    freckles are paint on the child face. Declare `variants` and one preset `tom`.
  - Shape loop as T6. The flat front render is the first check of the child base.
  - Done-when:
    - the build and the two level renders exit 0,
    - `tests/sprout-tom-kim.test.ts` exits 0 with the eleven rows of `TABLES.child`, row limits equal
      to the table, and both palms ok,
    - `tests/sprout-child-base.test.ts` passes its inventory cases on the built Tom GLB: 15 bones,
      one `idle` clip, one `hands` body,
    - `./forge check sprout-tom-kim` ends `result ok`,
    - the panel script writes Tom's panel,
    - the preset pin adds exactly the key `sprout-tom-kim` and changes no value,
    - `prettier --check` and the type check are clean for the new files.
  - Record: the eleven rows, the three-difference rounds, the base edits that the render forced, the
    absolute landmark values, the Green model id and family, and the pin key check.

- [ ] T14 Green: Lily. File: `assets/sprout-lily-kim.ts` (new).
  - Build the identity of the spec: a brown bob to the jaw with straight soft bangs, an open smile,
    a blue tee with a white Peter Pan collar, a red pleated skirt, white mid-calf socks, and red
    sneakers. Declare `variants` and one preset `lily`.
  - The bob keeps the eye band clear. The bangs sit above the brow. No hair crosses the chin. The
    lessons of the scrapped Lily rounds apply: no chin wrap, no jaw wedge, no ear cover, and a thin
    cut edge.
  - Shape loop and gates are T13's, with her own file and key.
  - Done-when: T13's list for `sprout-lily-kim`, plus the three Lily guards pass in the flat front
    and side views, and no hair is in front of the chin in the side view.
  - Record: T13's record for her, plus the three guard results and the bob measurements.

- [ ] T15 Measure: The two child look judges.
  - The brief, the binding, and the record are T9's, one per child.
  - Done-when: `judge-<name>.json` exists for Tom and Lily, the record binds the score to the asset
    revision and the panel hash, and both scores are 7.5 or more. A lower score returns the phase to
    the Green task of that character. A second score below 7.5 escalates to the PM.
  - Record: T9's record for each.

- [ ] T16 Measure: The Phase 3 gate.
  - Done-when: the two pins exit 0, the two judges pass on the final revision and panel hash, each
    panel hash equals its judge record, `./forge check` ends `result ok` for each asset, the preset
    pin holds two new keys and no changed value, the child base imports only `src/index.js`,
    `./measure/generate.sh` exits 0, and `./measure/doctor.sh --structural-only` exits 0.
  - Record: the commands, the verdicts, the hash pairs, and the pin diff.

## Phase 4: The panels and the handoff

- [ ] T17 Measure: The cast sheet, the panel check, and the handoff.
  - The five panels already exist from T6 to T8 and T13 to T14. This task does not rewrite a panel,
    because a new date would change its bytes and void its judge record.
  - Run `scripts/sprout-cast-panel.mjs --all` only when a panel is missing. A missing panel returns
    the character to its Green task and to a fresh judge.
  - Done-when:
    - the five panels and the sheet exist,
    - each panel is 1416 × 900 with three cells, the 700 px band, and the baseline at row 780,
    - each panel hash equals the `panel_sha256` of its judge record,
    - the sheet is 1544 × 900, holds five figures at 466.667 px per metre with one baseline, and its
      caption names the five and Mom,
    - the handoff note `measure/runs/chibi_sprouts_cast_20261125/handoff.md` holds the five panel
      paths and SHA-256 sums, the sheet path and SHA-256, the eleven rows per asset, the five judge
      records, and the sentence "No customer-facing claim is made.",
    - the note names Daniel's look as the last gate.
  - Record: the paths, the SHA-256 sums, the panel sizes, the baselines, and the note path.

- [ ] T18 Measure: The Phase 4 gate, the project gate, and the closeout record.
  - Done-when:
    - `tests/sprout-cast-panel.test.ts` passes,
    - the five real panels and the sheet exist, and the record holds their sizes, their projected
      rows, their hashes, and their baselines,
    - a role that did not write the panel script reads the sheet and records what it sees,
    - `PROJECT_TESTS` exits 0 with the TD-40 exclusion,
    - `PROJECT_LINT` and `PROJECT_CHECKS` exit 0,
    - `./measure/generate.sh` exits 0 and `./measure/doctor.sh` exits 0,
    - the plan records the lane and the acceptance record for the closeout of spec "The closeout
      path".
  - Record: the reporter lines, the sheet look record, and the doctor line.

- [ ] T19 [b] Measure: Record the PM's answer. Owner: the PM. Human gate.
  - This task is blocked until the PM answers. No role starts it.
  - The task records the handoff date, the PM's word, and the next step. An approval closes the
    character work and opens the closeout. A change list returns the named character to its Green
    task and to a fresh judge.
  - Done-when: this plan holds the handoff date, the PM's word, and the next task. The PM's word
    gates any external use of the five assets.
  - Record: the date, the answer, and the closeout or the return.

## Known limits

- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. Each task records its error count
  before and after and requires no error in its changed files.
- `PROJECT_TESTS` excludes `tests/storytime-book-pictures.test.ts` while TD-40 is open.
- The proportion check reads a render. A camera change or a frame change moves every row.
- The eye detector fails with a named error when an eye joins the skin, the brow, the hair, or an
  undeclared face mark.
- The child table is wide, because each drawing has one front view.
- The judge is one opinion. Daniel's look is the last gate.
- The preset pin is a shared file. A task compares parsed JSON and requires one new key per asset
  and no changed value.
- A panel caption holds its date. A later run writes different bytes, so the panel must not be
  regenerated after its judge without a fresh judge.
- The outputs are not in git. A fresh worktree runs T0 and every missing Green build again.
