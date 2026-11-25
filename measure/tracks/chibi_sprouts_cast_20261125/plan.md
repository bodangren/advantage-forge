# Chibi Sprouts cast on the Kim base: plan

Status: new (created 2026-11-25). No character work has started. The plan records execution state.
`spec.md` holds the contract, the tables, and the acceptance criteria.

Source: `QUEUE.md` item 3 and the PM approval of Mom at identity 7.5 on 2026-11-25. The design page
is `docs/chibi-sprouts/redesign-2026-11-23.md` (approved).

Lane: light (PM rule 2026-11-25). Four phases, one per group: the measuring tools, the adults, the
children, and the delivery.

Every render and every test run uses the heavy runner:

```bash
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'
```

A textured Forge command also takes a build slot. Shape iteration uses `--fast`.

## Gates this track does not run

- No Review A, no Review B, and no Review C (spec decision o). Phase 1 runs one adversarial round,
  because two scripts change. Phases 2 to 4 run no adversarial round.
- No UX review. The look judge is the only look gate.
- No paid call, no `openchamber_image`, and no hosted model other than the approved judge route.
- No cut-out, no sprite, no walk clip, no song render, and no game skin.

The orchestrator may add Review A to Phase 1 if it judges the script risk higher. That is the only
permitted addition.

## Files this track touches

- `measure/tracks/chibi_sprouts_cast_20261125/*` (new)
- `measure/tracks.md` (one registry row)
- `measure/generated/status.md` (the generator run)
- `tests/proportion-cast-options.test.ts` (new, Red)
- `tests/sprout-cast-panel.test.ts` (new, Red)
- `tests/sprout-dad-kim.test.ts`, `tests/sprout-grandma-kim.test.ts`,
  `tests/sprout-grandpa-kim.test.ts`, `tests/sprout-tom-kim.test.ts`,
  `tests/sprout-lily-kim.test.ts` (new, Red)
- `scripts/proportion-check.mjs` (Green: `--base`, `--table`, `--record`, the child table, the crown
  source)
- `scripts/sprout-cast-panel.mjs` (new, Green)
- `assets/parts/humanoid-kim.ts` (Green: three aliases; no other change)
- `assets/parts/humanoid-kim-child.ts` (new, Green)
- `assets/sprout-dad-kim.ts`, `assets/sprout-grandma-kim.ts`, `assets/sprout-grandpa-kim.ts`,
  `assets/sprout-tom-kim.ts`, `assets/sprout-lily-kim.ts` (new, Green)
- `tests/fixtures/preset-pin.json` (five new keys, written by `scripts/make-preset-pin.mjs`)
- `out/sprout-*-kim/` and `out/chibi-sprouts/cast/` (not in git)
- `measure/runs/chibi_sprouts_cast_20261125/` (the judge records and the handoff)

The track changes no scrapped source, no Mom asset, no shipped asset, and no game file.

## Role brief template

Every task brief carries these lines:

- Red writes tests only. Green writes the scripts and the assets. The orchestrator records each
  role's model id and family in the task record.
- The look judge is a separate role on `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family
  nvidia. The route is not muse, not hy4, and not OpenAI. A missing route waits; do not substitute.
- No role calls the `openchamber_image` tool. A role reads an image with `read`.
- No role edits a scrapped source and no role deletes a file.
- Every render and every test run uses the heavy runner.
- Every probe and every fixture stays in this worktree or under `/tmp`.
- A paid call, or a forbidden upload, is a stop-and-report event.

The spec review is not run in this delegated session. The reason is in `spec-review.md`, and the
orchestrator runs the review as the first step of Phase 1.

## Phase 1: The measuring tools

- [ ] T1 Red: Pin the measuring options, the child table, and the panel script.
      Files: `tests/proportion-cast-options.test.ts`, `tests/sprout-cast-panel.test.ts` (both new).
  - `tests/proportion-cast-options.test.ts` asserts:
    1. `--base humanoid-kim-child` reads `assets/parts/humanoid-kim-child.ts`; an absent file exits 1
       with `base humanoid-kim-child: not built` before any import.
    2. `--base` with an empty value, an absolute path, a path separator, or a dot-dot segment exits 1
       with `unknown base <stem>`.
    3. `--table child` uses the child table; an unknown name exits 1 with
       `unknown table <name>: known kim, child`.
    4. `--record <path>` writes the record at the named path. A path outside `out/` exits 1 with
       `record path outside out/: <path>`.
    5. `TABLES.kim` equals the eleven pairs of the adult table, value for value.
    6. `TABLES.child` equals the eleven pairs of the child table, value for value.
    7. `checkRows(rows)` still uses `kim`, and `checkRows(rows, 'child')` uses `child`.
    8. `heightInHeads`, `legShare`, `eyeLine`, `eyeHeight`, the head-width band, and the eye window
       use the projected `BASE_CROWN_Y`. The mask top may sit above the crown row by any amount and
       may not sit below it.
    9. `BASE_CROWN_Y`, `BASE_CHIN_Y`, and `BASE_HANDS` are the three exports of the adult base, and
       they equal `KIM.crown`, `KIM_CHIN_Y`, and `KIM_HANDS`.
  - `tests/sprout-cast-panel.test.ts` builds a temporary tree under `--root` with two synthetic
    256 × 256 renders and one synthetic 1600 × 1600 drawing per asset. It asserts:
    1. one panel per name at `out/chibi-sprouts/cast/<name>-panel.png`,
    2. three cells at one 700 px body scale with one baseline (mask rows 698 to 700, sole ± 2 px),
    3. the caption holds the asset name and the date,
    4. the `DRAWING_ROWS` export equals the five pairs of spec decision (n),
    5. a missing render exits 1 with `render <view>: not built`,
    6. a linked cast folder or a linked output file exits 1 with one line and is not followed,
    7. the sheet holds five figures at one scale and one baseline.
  - Done-when: each file exits 1 inside its cases on an absent option or an absent script. No
    collection error, no syntax error, and no import error. `prettier --check` exits 0 on both
    files.
  - Record: the case names, the fixture body, and the failure text.

- [ ] T2 Green: Add the options, the child table, the crown source, and the panel script.
      Files: `scripts/proportion-check.mjs`, `scripts/sprout-cast-panel.mjs` (new),
      `assets/parts/humanoid-kim.ts` (three aliases).
  - `scripts/proportion-check.mjs`: add `--base <stem>`, `--table <name>`, and `--record <path>`,
    the `TABLES` export, `checkRows(rows, table = 'kim')`, the `BASE_*` reads, the record-path rule,
    and the crown rule of spec decision (g). The name checks and the one-line errors are those of
    the spec. The loading order is unchanged. The default record path stays
    `out/chibi-sprouts/redesign/measure.json`.
  - `scripts/sprout-cast-panel.mjs`: the five panels and the cast sheet of spec AC7, with the
    `DRAWING_ROWS` export. It reads the lit views, the five drawings, and the five drawing row
    pairs. It takes `--root <dir>`, refuses a linked output folder or a linked output file, and
    writes only under `out/chibi-sprouts/cast/`.
  - `assets/parts/humanoid-kim.ts` adds `BASE_CROWN_Y = KIM.crown`, `BASE_CHIN_Y = KIM_CHIN_Y`, and
    `BASE_HANDS = KIM_HANDS`. No other line changes.
  - Done-when:
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/proportion-cast-options.test.ts tests/sprout-cast-panel.test.ts'`
      exits 0.
    - The Mom pin still exits 0:
      `node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts`.
      The plan records her eleven rows before and after the change, and every row stays in range.
    - The Mom GLB hash is unchanged: `./forge build sprout-mom-kim --fast` before and after, with
      matching SHA-256 sums of `out/sprout-mom-kim/sprout-mom-kim.glb`.
    - `prettier --check` exits 0 on the three changed files.
    - `tsc --noEmit` reports the baseline error count of TD-35 to TD-39 and no error in the changed
      files.
  - Record: the exported symbols, the option names, the before and after Mom rows, the GLB hashes,
    and the two test runs.
  - Note: this task changes no renderer option and no existing render path. The two new named views
    already exist from the redesign track.

- [ ] T3 Measure: One adversarial round on the two scripts.
  - It reads the T2 commit and attacks the table selection, the base name, the record path, the
    crown source, the panel scale, and the linked output. Report-only. It changes no file.
  - Done-when: the round writes
    `measure/runs/chibi_sprouts_cast_20261125/adversarial-p1-<sha>.json` with one finding per fault
    and a verdict. A finding that needs a fix returns to T2; the plan records each disposition.
  - Record: the audited commit, the findings, and the dispositions.

- [ ] T4 Measure: The Phase 1 gate.
  - Done-when:
    - the two tool tests exit 0,
    - the Mom pin exits 0 with every row in range,
    - `./measure/generate.sh` exits 0 and `./measure/doctor.sh --structural-only` exits 0,
    - the plan holds the adversarial verdict and the Mom row record.
  - Record: the commands, the row record, and the verdict.

## Phase 2: The adult variants

- [ ] T5 Red: Pin Dad, Grandma, and Grandpa.
      Files: `tests/sprout-dad-kim.test.ts`, `tests/sprout-grandma-kim.test.ts`,
      `tests/sprout-grandpa-kim.test.ts` (all new).
  - Each file runs `--asset <name> --table kim --record out/chibi-sprouts/cast/<name>-measure.json`
    on the renders that the Green task wrote. It requires exit 0, the eleven rows of `TABLES.kim`,
    each value in range, both palms ok, and the record path.
  - Done-when: each file exits 1 inside its case on the absent asset, with no collection error.
    `prettier --check` exits 0 on the three files.
  - Record: the case names and the failure text.

- [ ] T6 Green: Dad. File: `assets/sprout-dad-kim.ts` (new).
  - Build the identity of the spec: black swept-back hair, square jaw, thick brows, open smile, a
    red-and-black plaid shirt over a white tee, dark blue jeans, and brown boots. Import `buildKim`
    and `KIM`. Declare `variants` and one preset `dad`.
  - Shape loop: render `front-level` and `side-level`, read both with `read`, write the three largest
    differences, fix the largest first.
  - Done-when:
    - the two render commands exit 0,
    - `tests/sprout-dad-kim.test.ts` exits 0 with eleven rows in the adult table and both palms ok,
    - `./forge all sprout-dad-kim` exits 0 with no warning line,
    - `./forge check sprout-dad-kim` ends `result ok`,
    - `scripts/sprout-cast-panel.mjs --asset sprout-dad-kim` writes the panel,
    - `scripts/make-preset-pin.mjs` adds exactly the key `sprout-dad-kim` and changes no value,
    - `prettier --check` exits 0 on the new asset,
    - `tsc --noEmit` has the baseline count and no error in the new file.
  - Record: the eleven rows, each look round's three differences, the Green model id, the GLB stats,
    the pin key check, and the panel path.

- [ ] T7 Green: Grandma. File: `assets/sprout-grandma-kim.ts` (new).
  - Build the identity of the spec: white hair in a high bun, round cheeks, smile lines, pearl studs,
    a green cardigan over a pale green dress, a mid-calf skirt, and brown flats. The bun may rise
    above the skull. The measured crown is the base crown. Declare `variants` and one preset
    `grandma`.
  - Shape loop and gates are T6's, with her own file and key.
  - Done-when: T6's list for `sprout-grandma-kim`, plus her `heightInHeads` and `eyeLine` rows come
    from the skull crown and sit in the adult table, and her bun stays in the side silhouette.
  - Record: T6's record for her, plus the crown row, the projected crown, and the mask top row.

- [ ] T8 Green: Grandpa. File: `assets/sprout-grandpa-kim.ts` (new).
  - Build the identity of the spec: a bald crown with white side hair, round dark-brown glasses, a
    white moustache, an open smile, a green V-neck sweater over a pale green collared shirt, brown
    trousers, and brown shoes. The glasses and the moustache are paint. Declare `variants` and one
    preset `grandpa`.
  - Shape loop and gates are T6's, with his own file and key.
  - Done-when: T6's list for `sprout-grandpa-kim`, plus no warning line from the glasses paint and
    the two eye components separate from the brow.
  - Record: T6's record for him.

- [ ] T9 Measure: The three adult look judges.
  - One brief per character. Each brief holds the panel path, the drawing path, the eleven rows as
    text, and the two scores. The route and the record shape are spec decisions (j), (k), and (l).
  - Done-when: `measure/runs/chibi_sprouts_cast_20261125/judge-<name>.json` exists for each of the
    three, and identity and proportion are both 7.5 or more. A lower score returns the phase to the
    Green task of that character with the comment as the work list.
  - Record: the route, the model id and family, the panel SHA-256, both scores, and the verdict.

- [ ] T10 Measure: The Phase 2 gate.
  - Done-when: the three pins exit 0, the three judges pass, `./forge check` ends `result ok` for
    each asset, the preset pin holds three new keys and no changed value,
    `./measure/generate.sh` exits 0, and `./measure/doctor.sh --structural-only` exits 0.
  - Record: the commands, the three judge verdicts, and the pin diff.

## Phase 3: The children

- [ ] T11 Red: Pin Tom and Lily.
      Files: `tests/sprout-tom-kim.test.ts`, `tests/sprout-lily-kim.test.ts` (both new).
  - Each file runs
    `--asset <name> --base humanoid-kim-child --table child --record out/chibi-sprouts/cast/<name>-measure.json`
    on the renders that the Green task wrote. It requires exit 0, the eleven rows of `TABLES.child`,
    each value in range, both palms ok, and the record path.
  - Done-when: each file exits 1 inside its case on the absent asset. `prettier --check` exits 0.
  - Record: the case names and the failure text.

- [ ] T12 Green: The child base. File: `assets/parts/humanoid-kim-child.ts` (new).
  - Build the base of spec "The child base": the derived targets at 1.050 m, the adult bone names,
    one `idle` clip, the hands body with the palms toward the legs, and the three landmark exports.
    Import only `src/index.js`.
  - Done-when:
    - the module exports `BASE_CROWN_Y`, `BASE_CHIN_Y`, and `BASE_HANDS`,
    - `import { buildKimChild } from '../assets/parts/humanoid-kim-child.js'` has no type error,
    - the file imports no other asset module,
    - `prettier --check` exits 0.
  - Record: the derived targets, the skeleton bone names, the clip name, and the three export values.
  - Note: Tom's asset gives the first render. A base fault that Tom's render shows returns to this
    task in the same phase.

- [ ] T13 Green: Tom. File: `assets/sprout-tom-kim.ts` (new).
  - Build the identity of the spec on the child base: brown tousled hair with a side tuft, freckles,
    an open smile, a blue-and-orange striped tee, green shorts, white socks, and grey sneakers.
    Declare `variants` and one preset `tom`.
  - Shape loop as T6. The flat front render is the first check of the child base.
  - Done-when:
    - the two render commands exit 0,
    - `tests/sprout-tom-kim.test.ts` exits 0 with eleven rows in the child table and both palms ok,
    - `./forge all sprout-tom-kim` exits 0 with no warning line,
    - `./forge check sprout-tom-kim` ends `result ok`,
    - the panel script writes Tom's panel,
    - the preset pin adds exactly the key `sprout-tom-kim` and changes no value,
    - `prettier --check` and the type check are clean for the new files.
  - Record: the eleven rows, the three-difference rounds, the base edits that the render forced, the
    Green model id, and the pin key check.

- [ ] T14 Green: Lily. File: `assets/sprout-lily-kim.ts` (new).
  - Build the identity of the spec: a brown bob to the jaw with straight soft bangs, an open smile,
    a blue tee with a white Peter Pan collar, a red pleated skirt, white mid-calf socks, and red
    sneakers. Declare `variants` and one preset `lily`.
  - The bob keeps the eye band clear. The bangs sit above the brow. No hair crosses the chin. The
    lessons of the scrapped Lily rounds apply: no chin wrap, no jaw wedge, no ear cover, and a thin
    cut edge.
  - Shape loop and gates are T13's, with her own file and key.
  - Done-when: T13's list for `sprout-lily-kim`, plus the two eye components separate from the hair
    and the brow in the flat front view, and no hair in front of the chin in the side view.
  - Record: T13's record for her, plus the eye-component result and the bob measurements.

- [ ] T15 Measure: The two child look judges.
  - The brief and the record are T9's, one per child.
  - Done-when: `judge-<name>.json` exists for Tom and Lily, and both scores are 7.5 or more. A lower
    score returns the phase to the Green task of that character.
  - Record: T9's record for each.

- [ ] T16 Measure: The Phase 3 gate.
  - Done-when: the two pins exit 0, the two judges pass, `./forge check` ends `result ok` for each
    asset, the preset pin holds two new keys and no changed value, the child base imports only
    `src/index.js`, `./measure/generate.sh` exits 0, and
    `./measure/doctor.sh --structural-only` exits 0.
  - Record: the commands, the judge verdicts, and the pin diff.

## Phase 4: The panels and the handoff

- [ ] T17 Measure: The five panels, the cast sheet, and the handoff.
  - Run `scripts/sprout-cast-panel.mjs` on the five assets. It writes five panels and
    `out/chibi-sprouts/cast/cast-sheet.png`.
  - Done-when:
    - the five panels and the sheet exist,
    - every panel holds three cells, a 700 px body, and one baseline,
    - the sheet holds five figures at one scale, with a caption that names the five and Mom,
    - the handoff note `measure/runs/chibi_sprouts_cast_20261125/handoff.md` holds the five panel
      paths and SHA-256 sums, the sheet path and SHA-256, the eleven rows per asset, the five judge
      records, and the sentence "No customer-facing claim is made.",
    - the note names Daniel's look as the last gate.
  - Record: the paths, the SHA-256 sums, and the note path.

- [ ] T18 Measure: The Phase 4 gate and the project gate.
  - Done-when:
    - `tests/sprout-cast-panel.test.ts` passes,
    - the five real panels and the sheet exist, and the record holds their sizes, their mask rows,
      and their baselines,
    - a role that did not write the panel script reads the sheet and records what it sees,
    - `PROJECT_TESTS` exits 0 with the TD-40 exclusion,
    - `PROJECT_LINT` and `PROJECT_CHECKS` exit 0,
    - `./measure/generate.sh` exits 0 and `./measure/doctor.sh` exits 0.
  - Record: the reporter lines, the sheet look record, and the doctor line.

- [ ] T19 Measure: Record the PM's answer.
  - The task records the handoff date, the PM's word, and the next step. An approval closes the
    character work. A change list returns the named character to its Green task.
  - Done-when: this plan holds the handoff date, the PM's word, and the next task. The PM's word
    gates any external use of the five assets.
  - Record: the date and the answer.

## Known limits

- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. Each task records its error count
  before and after and requires no error in its changed files.
- `PROJECT_TESTS` excludes `tests/storytime-book-pictures.test.ts` while TD-40 is open.
- The proportion check reads a render. A camera change or a frame change moves every row.
- The eye detector fails with a named error when an eye joins the skin, the brow, or the hair.
- The child table is wide, because each drawing has one front view.
- The judge is one opinion. Daniel's look is the last gate.
- The preset pin is a shared file. A task compares parsed JSON and requires one new key per asset
  and no changed value.
