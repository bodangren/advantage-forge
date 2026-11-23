# Chibi Sprouts: new adult base on Teacher Kim, with Mom as the first trial

Status: new. The plan records execution state. `spec.md` holds the acceptance criteria and the
measurement method.

PM decisions 1 to 3 of 2026-11-23 and the authoring decisions (d) to (l): `spec.md`. The source is
`docs/chibi-sprouts/redesign-2026-11-23.md` (approved 2026-11-23).

Lane: light. Phases 1 to 9. Source: PM decisions of 2026-11-23.
Target (orchestrator proposal, not a PM date): shape passes by 2026-11-25.
Spend to date: one unplanned image call, about USD 0.01, recorded in
`out/chibi-sprouts/redesign/costs.tsv`. The track needs no paid call.

Every render and every test run goes through the heavy runner:

```bash
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'
```

A textured forge command also takes a build slot. Shape iteration uses `--fast`, and so do the
renders of AC2 and AC5. A flat or orthographic shape check does not need an atlas.

Files this track touches:

- `measure/tracks/chibi_sprouts_redesign_20261123/*` (new)
- `measure/tracks.md` (one registry row)
- `tests/sprout-base.test.ts` (the skip marker and the scrap reason)
- `tests/sprout-gestures.test.ts` (the skip marker and the scrap reason)
- `tests/sprout-gesture-offset.test.ts` (the hero describe stays active, the other two skip)
- `tests/render-options.test.ts` (new, the renderer pin)
- `tests/sprout-mom-kim.test.ts` (new, the measurement)
- `tests/mom-kim-sheet.test.ts` (new, the sheet layout)
- `assets/flat-render-pin.ts` (new, the pin asset)
- `scripts/proportion-check.mjs` (new)
- `scripts/mom-kim-sheet.mjs` (new)
- `src/cli/forge.ts` (the named views `front-level` and `side-level`, the `ortho` and `flat` options,
  the `flat/` output folder)
- `src/render/page.ts` (the orthographic frame, `useFlatMaterials`, the `flat/` file names)
- `assets/parts/humanoid-kim.ts` (new, exports `KIM_CHIN_Y`)
- `assets/sprout-mom-kim.ts` (new)
- `tests/fixtures/preset-pin.json` (one new key, written by `scripts/make-preset-pin.mjs`)
- `out/sprout-mom-kim/` (not in git)
- `out/chibi-sprouts/redesign/` (not in git)
- `measure/runs/chibi_sprouts_redesign_20261123/` (the logs and the judge record)

The new base is `assets/parts/humanoid-kim.ts`. It imports only `src/index.js` (decision h). The new
asset is `assets/sprout-mom-kim.ts`. It imports the base and `src/index.js`.

No scrapped source changes. No file is deleted. No paid call runs.

## Role brief template

Every task brief in this plan carries these lines:

- Role family: Red is muse. Green is not the Red family; the orchestrator picks Green with
  `ra-quota` at dispatch. The AC4 judge comes from a family other than Green's and Red's
  (spec decision (i)).
- No role calls the `openchamber_image` tool. That tool generates or edits images, and it costs
  money. To look at an image, a role uses the `read` tool.
- No route sends Kim's sheet or Kim's panel to a model or a third party. A route that would do so
  stops the task and reports to the PM.
- A paid call, or an upload of Kim or sprout art to a third party, before the PM approves the shape,
  is a stop-and-report event. The role stops, keeps every file, and reports to the PM.
- Every render and every test run uses the heavy runner below.

## Phase 1: Red

- [ ] T1 Red: Skip the scrapped contract tests with the scrap reason, and keep the hero assertions
      active. Files: `tests/sprout-base.test.ts`, `tests/sprout-gestures.test.ts`,
      `tests/sprout-gesture-offset.test.ts`.
  - `tests/sprout-base.test.ts`: the one describe becomes `describe.skip` with the title suffix
    ` — sprout base scrapped 2026-11-23 (Daniel)`. Two tests skip:
    `has the bone names, clip names, and equip sockets of the avatar base` and
    `keeps the hero head and a shorter body`.
  - `tests/sprout-gestures.test.ts`: the one describe becomes `describe.skip` with the same suffix.
    Four tests skip: `keeps the child clap plane and hand gap`, `keeps the child touch points`,
    `keeps the child chest and hip points`, and
    `moves each adult goal to the same place on the grown-up body`.
  - `tests/sprout-gesture-offset.test.ts`: add a new active describe
    `hero clip contracts (not scrapped)` above the two others. It holds three tests, moved out of
    the skipped bodies:
    - `keeps the hero clip inventory: the 8 base clips`, from lines 209-210,
    - `keeps the hero default pose digest: size 8, digest 68442177`, from line 220,
    - `keeps the hero cheer wrist-to-head distance: 0.27635 m`, from lines 243-244.
      The two other describes become `describe.skip` with the suffix. Their hero lines leave the
      bodies. Nine tests skip: the three of the first describe and the six of the second.
  - Each file gets the line `// sprout base scrapped 2026-11-23 (Daniel)` above its first import.
  - No other test file changes. `tests/song-timeline.test.ts` reads no scrapped source, and it
    stays.
  - Done-when: `grep -c 'describe.skip('` gives 1, 1, and 2 on the three files, and
    `grep -c 'hero clip contracts'` gives 1 on the third.
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-base.test.ts tests/sprout-gestures.test.ts tests/sprout-gesture-offset.test.ts'`
    exits 0 with 3 files, 3 passed tests, and 15 skipped tests. `prettier --check` exits 0 on the
    three files.
  - Record: the baseline of 3 files and 15 passed tests at the track start (2026-11-23), the three
    hero test names that stay, the 15 skipped names, the four skip sites, and the command output.
  - Note: the three files pass before the skip. The skip retires a contract of the scrapped base; it
    does not repair a failure.

- [ ] T2 Red: Pin the renderer options with a behaviour test. Files: `tests/render-options.test.ts`
      (new), `assets/flat-render-pin.ts` (new).
  - The pin asset: one box 0.40 × 1.00 × 0.20 m at the origin, with the bottom on y = 0, and a
    0.05 m block at +Z near the top. The box body is one colour and the block another. No skeleton
    and no variants, so the preset pin ignores it.
  - The test runs
    `./forge render flat-render-pin --fast --views front-level,side-level --ortho --flat --bg none --size 256`
    through the runner and asserts:
    1. `out/flat-render-pin/flat/front-level.png` and `side-level.png` exist at 256 × 256,
    2. the corner pixel has alpha 0,
    3. the box pixel at the projected centre holds the box hex within 1 of 255,
    4. the block pixel holds the block hex within 1 of 255,
    5. the crown-to-sole heights of the two views differ by 2 px or less,
    6. on the side view, the block's column is left of `W/2` by 0.02 m·`ppm` or more (spec decision
       j),
    7. `--views front-level` without `--ortho` still writes the named view, and `--flat` without
       `--fast` fails with `--flat needs --fast and --bg none`.
  - Done-when: the test exits 1, and each case fails on the absent option or the absent output file,
    not on a syntax or import error. The pin asset builds with `./forge render flat-render-pin --fast`
    (vertex colours) and no `warning:` line.
  - Record: the command, the seven case names, the failure text, and the pin asset size.

## Phase 2: Green

- [ ] T3 Green: Add the renderer options. Files: `src/cli/forge.ts`, `src/render/page.ts`.
  - `src/render/page.ts` exports `ORTHO_MARGIN = 1.10`, `orthoFrame(bounds, size)` (it returns
    `{ left, right, top, bottom, pixelsPerMetre }` from decision (f)), and
    `useFlatMaterials(root)` (it swaps each mesh material for a
    `MeshBasicMaterial({ color, vertexColors, toneMapped: false, side })`, hides the ground, and
    returns the restore function). `ViewsRequest` gains `readonly ortho?: boolean` and
    `readonly flat?: boolean`. `renderViews` chooses the orthographic camera under `ortho`, applies
    `useFlatMaterials` under `flat`, and restores both at the end.
  - `src/cli/forge.ts`: `NAMED_VIEWS['front-level'] = { azimuth: 0, elevation: 0 }` and
    `NAMED_VIEWS['side-level'] = { azimuth: 90, elevation: 0 }`. `parseArgs` gains
    `ortho: { type: 'boolean' }` and `flat: { type: 'boolean' }`. `--flat` writes
    `join(out, 'flat', `${view}.png`)` and leaves `views/` alone. The command rejects `--flat`
    without `--fast` and `--bg none` with `--flat needs --fast and --bg none`.
  - Done-when:
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/render-options.test.ts'`
      exits 0 with 7 cases.
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit'`
      reports no error in the two changed files.
    - The three existing render commands of `forge inspect` and `forge render` on one other asset
      still write `views/` as before.
    - `prettier --check` exits 0 on the two changed files.
  - Record: the exported symbols, the option names, the test run, and one shaded render of an
    existing asset that shows no change.

## Phase 3: Red

- [ ] T4 Red: Add the proportion check. Files: `scripts/proportion-check.mjs` (new),
      `tests/sprout-mom-kim.test.ts` (new).
  - The script measures one asset from the six inputs of `spec.md` "Measurement method": the two
    flat level renders, the two lit level renders, `stats.json`, the GLB, the asset `variants`, and
    `KIM_CHIN_Y`. It writes `out/chibi-sprouts/redesign/measure.json` per AC2 rule 1, prints one
    line per row, and exits 0 or 1 per AC2 rules 2 and 3. It exports `checkRows(rows)`,
    `palmNormal(vertices, side)`, and `measurePixels()`.
  - `tests/sprout-mom-kim.test.ts` holds these cases: the AC1 skip guard, the level and
    orthographic proof on the asset render, the pass table, the eleven doctored rows, the five
    synthetic figures, the two signed palm cases, and the hand-edge cases.
  - Done-when:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'`
    exits 1. The skip guard passes. The pass-table case fails with `asset sprout-mom-kim: not
built`, and not with a collection or syntax error. `HEAVY_MIN_AVAIL_MB=1500 bash
/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/tsx
scripts/proportion-check.mjs --asset sprout-mom-kim'` exits 1 with that message.
    `prettier --check` exits 0 on the two new files.
  - Record: the script usage, the failure text, and the five synthetic mutation results.

## Phase 4: Green

- [ ] T5 Green: Build the new base and Mom. Files: `assets/parts/humanoid-kim.ts` (new),
      `assets/sprout-mom-kim.ts` (new), `tests/fixtures/preset-pin.json`.
  - The base: the skeleton with the bone names `hips`, `spine`, `chest`, `neck`, `head`,
    `upperarm.L/R`, `forearm.L/R`, `hand.L/R`, `leg.L/R`, `shin.L/R`, and `foot.L/R`; the head with
    the face paint of the pass table; the torso; the arms; the open hands as one body named `hands`
    with the palms toward the legs and the thumbs forward; the legs; the feet; one `idle` clip. It
    exports `KIM_CHIN_Y`. The numbers start from the derived target table of `spec.md`.
  - Mom's asset: the long brown waves, the knit sweater, the jeans, the brown flats, and the pearl
    studs. The `variants` table holds the four slots with Mom's colours first, and one preset `mom`.
  - Shape loop: `./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none`
    through the runner, then read `out/sprout-mom-kim/views/front-level.png` and `side-level.png`
    with the `read` tool. Write the three largest differences, then fix the largest first.
  - The preset pin: run `./node_modules/.bin/tsx scripts/make-preset-pin.mjs`, then compare the
    parsed pin with the role baseline:
    `git show <role-baseline>:tests/fixtures/preset-pin.json > /tmp/pin-baseline.json`, then a node
    check that the key sets differ by `sprout-mom-kim` alone and that every baseline asset, preset,
    and slot value is unchanged. A changed value or a second new key stops the task for the PM.
  - Done-when:
    - The two renders of `spec.md` exit 0, and
      `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/tsx scripts/proportion-check.mjs --asset sprout-mom-kim'`
      prints eleven rows, each a pass.
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts tests/preset-colour.test.ts tests/render-options.test.ts'`
      exits 0.
    - `./forge check sprout-mom-kim` ends with `result ok`, through the runner.
    - `tsc --noEmit` through the runner reports no error in the changed files. The plan records the
      baseline count of TD-35 to TD-39 and the new count.
    - The full suite command exits 0, and the plan records its reporter line.
    - `prettier --check` exits 0 on every new or changed text file.
  - Record: the eleven rows, the three largest differences of each look round, the Green model id,
    the two render commands, the type-check counts, the suite reporter line, and the pin key check.
  - No cut-out and no sprite in this task (AC6).

## Phase 5: Red

- [ ] T6 Red: Pin the sheet layout. Files: `tests/mom-kim-sheet.test.ts` (new).
  - The test runs `node scripts/mom-kim-sheet.mjs` through the runner on a fixture set and asserts
    per AC5:
    1. the sheet is at least 1536 × 1560 px, and `mom-panel.png` exists,
    2. the three front cells and the three side cells sit on one baseline,
    3. each body's crown-to-sole height is 700 px within 2 px,
    4. the render rows in the sheet equal `measure.json` `rows.lit`,
    5. the caption strip holds the asset name, the date, the pass result, and the Green model id,
    6. the side row's third cell reads `no side drawing`,
    7. `mom-panel.png` holds no Kim pixel: its width is two cells, not three.
  - Done-when: the test exits 1 on the absent script, inside the case. No syntax or import error.
  - Record: the seven case names and the failure text.

## Phase 6: Green

- [ ] T7 Green: Write the sheet script. Files: `scripts/mom-kim-sheet.mjs` (new).
  - It reads the lit views, `measure.json` `rows.lit`, Kim's sheet, and Mom's drawing. It finds the
    reference figure bands with a background scan and requires each side figure's rows within 4 px
    of the front rows (Kim 102/1195, Mom 71/1528). It scales each panel to a 700 px crown-to-sole
    height, sets one baseline, draws the caption, and writes `mom-kim-review.png` and
    `mom-panel.png`.
  - Done-when:
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/mom-kim-sheet.test.ts'`
      exits 0.
    - Both files exist, and the review is done with the `read` tool by a role that did not write the
      script.
    - `prettier --check` exits 0 on the new file.
  - Record: the two paths, their sizes, and the measured reference rows.

## Phase 7: Look

- [ ] T8 Measure (owner: the judge role): Run the independent look judge. Files:
      `measure/runs/chibi_sprouts_redesign_20261123/judge.json` (new, not in git).
  - The judge reads `out/chibi-sprouts/redesign/mom-panel.png` and the numeric rows. It reads no Kim
    image (decision k). A route that would need the Kim panel stops the task (AC4 rule 7).
  - The judge is on a family other than Green's and Red's.
  - Done-when: `judge.json` holds the AC4 rule 5 fields, and both scores are 7.5 or more. A lower
    score records the comment as the work list and returns the track to T5.
  - Record: the panel SHA-256, the judge model id and family, both scores, and the verdict.
  - This task uploads nothing and writes no script.

## Phase 8: PM stop

- [ ] T9 Measure: Hand the sheet to the PM. No file changes, and no command runs.
  - The handoff names: the sheet path, its SHA-256, the eleven measured rows, the judge record, the
    two AC3 palm results, the `mom-panel.png` path, and the fact that no cut-out and no sprite exist.
  - Done-when: the PM holds the handoff. The upload to Daniel waits for the PM's word (AC5 rule 7).
    A route that would send the sheet to a third party stops the task.
  - Record: nothing in this task. T10 records the handoff and the answer.

- [ ] T10 Measure: Record the handoff and the PM answer. File: this plan.
  - It records the handoff date, the PM's word, and the next step. A PM answer that asks for a shape
    change returns the track to T5 with the change as the work list. An approval opens Phase 9 by
    amendment (AC6 rule 3).
  - Done-when: this plan holds the handoff date, the PM's word, and the next task.
  - This line runs after T9, so T9 keeps its no-write rule.

## Phase 9: deferred:pm

These tasks start only by an amendment after the PM approves the shape at T10. No earlier task
builds their output (AC6).

- [ ] T11 (deferred:pm) Measure: One 900 px or taller song cut-out of Mom on the new base. Files:
      a cut-out step on the existing cut-out path, and `out/chibi-sprouts/redesign/cutout/`.
  - Every render run uses the wrapper:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
    The cut-out command takes a build slot.
  - Done-when: the amendment lands, the cut-out is transparent at 900 px or taller, and a second
    look judge rates it 7.5 or more. The plan records the command, the file size, and the score.

- [ ] T12 (deferred:pm) Measure: One 128 px idle sprite sample of Mom on the new base. Files:
      `out/sprout-mom-kim/sprites/` and its preview.
  - The sample is idle only. The walk clip comes from a later amendment task pair (AC6 rule 3).
  - Every render run uses the wrapper:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge sprites sprout-mom-kim --clip idle'`.
  - Done-when: the amendment lands, the idle sprites exist at 128 px, the face reads in
    `sprites/preview.png`, and a second look judge rates them 7.5 or more. The plan records the
    command, the preview path, and the score.

## Known limits

- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. T5 records its error count before and
  after the change, and it requires no error in the changed files.
- `PROJECT_TESTS` excludes `tests/storytime-book-pictures.test.ts` while TD-40 is open.
- The proportion check reads a render. A camera change or a frame change moves every row. The check
  pins the frame rule in decision (f) for that reason.
- The eye detector needs the two eyes to separate from the skin and from the brow. A face paint that
  joins an eye to the hair fails the check with a named error, not with a bad value.
- The judge is one opinion. A 7.5 from one family does not prove the look to Daniel. Daniel's look
  is the last gate, and it stays with him.
- The preset pin is a shared file. T5 requires one new key and no changed value, and it compares
  parsed JSON, not a diff line count.
- The pin asset `assets/flat-render-pin.ts` is a test fixture that lives in `assets/`, because the
  CLI reads assets by name. It has no skeleton and no variants, so the pack, catalog, review, and
  preset listings ignore it.
