# Chibi Sprouts: new adult base on Teacher Kim, with Mom as the first trial

Status: new. The plan records execution state. `spec.md` holds the acceptance criteria and the
measurement method.

PM decisions 1 and 3 of 2026-11-23 and the authoring decisions (d) to (h): `spec.md`. The source is
`docs/chibi-sprouts/redesign-2026-11-23.md` (approved 2026-11-23).

Lane: light. Phases 1 to 5. Source: PM decisions of 2026-11-23.
Target (orchestrator proposal, not a PM date): shape passes by 2026-11-25.
Spend to date: one unplanned image call, about USD 0.01, recorded in
`out/chibi-sprouts/redesign/costs.tsv`. The track needs no paid call.

Every render and every test run goes through the heavy runner:

```bash
HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'
```

A textured forge command also takes a build slot. Shape iteration uses `--fast`, and so do the two
renders of AC2 and AC5. A flat or orthographic shape check does not need an atlas.

Files this track touches:

- `measure/tracks/chibi_sprouts_redesign_20261123/*` (new)
- `measure/tracks.md` (one registry row)
- `tests/sprout-base.test.ts` (the skip marker and the scrap reason)
- `tests/sprout-gestures.test.ts` (the skip marker and the scrap reason)
- `tests/sprout-gesture-offset.test.ts` (two skip markers and the scrap reason)
- `tests/sprout-mom-kim.test.ts` (new)
- `scripts/proportion-check.mjs` (new)
- `scripts/mom-kim-sheet.mjs` (new)
- `src/cli/forge.ts` (the named views `front-level` and `side-level`, the `--ortho` flag, the
  `--flat` flag, and the `flat/` output folder)
- `src/render/page.ts` (the orthographic camera, the flat pass, and the `flat/` file names)
- `assets/parts/humanoid-kim.ts` (new)
- `assets/sprout-mom-kim.ts` (new)
- `tests/fixtures/preset-pin.json` (one new entry, written by `scripts/make-preset-pin.mjs`)
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
- A paid call, or an upload of Kim or sprout art to a third party, before the PM approves the shape,
  is a stop-and-report event. The role stops, keeps every file, and reports to the PM.
- Every render and every test run uses the heavy runner below.

## Phase 1: Red

- [ ] T1 Red: Skip the scrapped contract tests with the scrap reason. Files:
      `tests/sprout-base.test.ts`, `tests/sprout-gestures.test.ts`,
      `tests/sprout-gesture-offset.test.ts`.
  - The change: each of the four top-level `describe` calls becomes `describe.skip`, and its title
    ends with ` — sprout base scrapped 2026-11-23 (Daniel)`. The four calls are
    `tests/sprout-base.test.ts:8`, `tests/sprout-gestures.test.ts:11`,
    `tests/sprout-gesture-offset.test.ts:199`, and `tests/sprout-gesture-offset.test.ts:251`.
    Each file also gets the line `// sprout base scrapped 2026-11-23 (Daniel)` above its first
    import.
  - No other test file changes. `tests/song-timeline.test.ts` reads no scrapped source, and it
    stays. `tests/preset-colour.test.ts`, `tests/storytime-card-specs.test.ts`, and
    `tests/storytime-family-word-specs.test.ts` stay.
  - Done-when:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-base.test.ts tests/sprout-gestures.test.ts tests/sprout-gesture-offset.test.ts'`
    exits 0 with 3 files, 0 passed tests, and 15 skipped tests. `grep -c 'describe.skip('` gives 1,
    1, and 2 on the three files. `node_modules/.bin/prettier --check` exits 0 on the three files.
  - Record: the baseline of 3 files and 15 passed tests at the track start (2026-11-23), the four
    call sites, the skip count, and the command output.
  - Note: the three files pass before the skip. The skip retires a contract of the scrapped base; it
    does not repair a failure.

- [ ] T2 Red: Add the proportion check. Files: `scripts/proportion-check.mjs` (new),
      `tests/sprout-mom-kim.test.ts` (new), `src/cli/forge.ts`, `src/render/page.ts`.
  - The render work, a prerequisite of the check: add the named views `front-level`
    (`{ azimuth: 0, elevation: 0 }`) and `side-level` (`{ azimuth: 90, elevation: 0 }`), the
    `--ortho` flag, and the `--flat` flag to the CLI and the render page, per decisions (d), (e),
    and (f) of `spec.md`. `--flat` writes `out/<name>/flat/<view>.png` and keeps `views/` as it is.
    `--ortho` uses the frame rule of decision (f) for every view of one run.
  - `scripts/proportion-check.mjs` measures one asset from the four inputs of `spec.md`
    "Measurement method": the two flat level renders, `stats.json`, the GLB, and the asset module's
    `variants`. It writes `out/chibi-sprouts/redesign/measure.json`, prints one line per row, and
    exits 0 or 1 per AC2 rules 2 and 3. It exports `checkRows(rows)`, `palmNormal(vertices)`, and
    `measurePixels()` for the breakage cases.
  - `tests/sprout-mom-kim.test.ts` holds seven cases: the AC1 skip guard, the level and orthographic
    render proof, the pass table, the eleven doctored row sets, the two synthetic figures, the palm
    normal, and the front hand edge.
  - Run, in this order:
    1. `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge render sprout-mom-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024'`
    2. `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none --size 1024'`
    3. `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './node_modules/.bin/tsx scripts/proportion-check.mjs --asset sprout-mom-kim'`
    4. `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts'`
  - Done-when: the test command exits 1. Steps 1 and 2 fail on the absent `sprout-mom-kim` asset.
    Step 3 fails with a named error for the absent module or the absent render. The pass-table case
    fails with that named error, and not with a collection or syntax error. The script file exists
    and runs. The skip guard case passes. `prettier --check` exits 0 on the three new or changed
    files.
  - Record: the render commands, the two output folders, the script output on the empty state, and
    the failing case names.
  - The breakage proofs run here, before the model exists, on the synthetic figures and on the
    doctored rows. They must fail the correct row at this point.

## Phase 2: Green

- [ ] T3 Green: Build the new base and Mom. Files: `assets/parts/humanoid-kim.ts` (new),
      `assets/sprout-mom-kim.ts` (new), `tests/fixtures/preset-pin.json`.
  - The base: the skeleton with the bone names `hips`, `spine`, `chest`, `neck`, `head`,
    `upperarm.L/R`, `forearm.L/R`, `hand.L/R`, `leg.L/R`, `shin.L/R`, and `foot.L/R`; the head with
    the face paint of the pass table; the torso; the arms; the open hands as one body named `hands`
    with the palms toward the legs and the thumbs forward; the legs; the feet; one `idle` clip. The
    numbers start from the derived target table of `spec.md`.
  - Mom's asset: the long brown waves, the knit sweater, the jeans, the brown flats, and the pearl
    studs. The `variants` table holds the four slots with Mom's colours first, and one preset `mom`.
  - Shape loop: `./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none`
    through the heavy runner, then look at `out/sprout-mom-kim/views/front-level.png` and
    `side-level.png`. Write the three largest differences, then fix the largest first.
  - The preset pin: run `./node_modules/.bin/tsx scripts/make-preset-pin.mjs` and require
    `git diff --stat tests/fixtures/preset-pin.json` to hold one new entry and no other change. A
    diff that touches another asset stops the task for the PM.
  - Done-when:
    - The four commands of T2 exit 0, and the script prints eleven rows, each a pass.
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-mom-kim.test.ts tests/preset-colour.test.ts'`
      exits 0.
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge check sprout-mom-kim'`
      ends with `result ok`.
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/typescript/bin/tsc --noEmit'`
      reports no error in the five changed or new source or test files. The baseline count of
      TD-35 to TD-39 stays as it is, and the plan records both numbers.
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts'`
      exits 0. The plan records the reporter line: the file count, the test count, and the skipped
      count.
    - `prettier --check` exits 0 on every new or changed text file.
  - Record: the eleven measured rows with their values, the three largest differences of each look
    round, the builder's model id, the two render commands, the type-check count, the suite reporter
    line, and the preset pin diff. The orchestrator picks Green with `ra-quota` at dispatch and
    records the model id here. Red is muse, per spec decision (i).
  - No cut-out and no sprite in this task (AC6).

## Phase 3: Look

- [ ] T4 Measure (owner: the judge role): Compose the review sheet and run the independent judge.
      Files: `scripts/mom-kim-sheet.mjs` (new), `out/chibi-sprouts/redesign/` (not in git),
      `measure/runs/chibi_sprouts_redesign_20261123/judge.json`.
  - The sheet, per AC5: two rows, three panels, 700 px per crown-to-sole body, one baseline. The
    reference rows are the page's Kim rows (102 and 1195) and Mom rows (71 and 1528). The render
    rows come from `measure.json`. Kim's front and side panels come from the figure bands at
    columns 77 to 429 and 1036 to 1334 of the sheet.
  - The judge: a session on a model family other than the builder's family and Red's family. Red is
    muse. It sees the sheet path and its SHA-256, and no other file of this track. It rates identity
    and proportion per AC4.
  - Done-when:
    - `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c 'node scripts/mom-kim-sheet.mjs'`
      exits 0 and writes `out/chibi-sprouts/redesign/mom-kim-review.png` at 1536 × 1560 px or more.
    - The sheet shows three panels in row one and three cells in row two, with one common baseline.
    - `judge.json` holds the model id, both families, the sheet SHA-256, both scores, and the
      verdict.
    - Both scores are 7.5 or more. A lower score records the comment as the work list and returns
      the track to T3.
  - Record: the sheet path, its SHA-256, the judge model id and family, both scores, and the
    verdict.
  - This task uploads nothing and contacts no one.

## Phase 4: PM stop

- [ ] T5 Measure: Hand the sheet to the PM and wait. No file changes, and no command runs.
  - The handoff names: the sheet path, the sheet SHA-256, the eleven measured rows, the judge
    record, the two AC3 palm results, and the fact that no cut-out and no sprite exist.
  - Done-when: the PM holds the handoff, and this plan records the handoff date and the PM's word.
    The track stays `in_progress` until the PM answers.
  - The upload to Daniel waits for the PM's word (AC5 rule 5). This task does not upload.
  - A PM answer that asks for a shape change returns the track to T3 with the change as the work
    list.

## Phase 5: deferred:pm, cut-out and sprite

These two tasks start only after the PM approves the shape at T5. The plan marks them
`deferred:pm`, and no earlier task builds their output (AC6).

- [ ] T6 (deferred:pm) Measure: One 900 px or taller song cut-out of Mom on the new base. Files:
      a cut-out script or an extension of the existing cut-out path, and
      `out/chibi-sprouts/redesign/cutout/`.
  - Every render run uses the wrapper:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<command>'`.
    The cut-out command takes a build slot.
  - Done-when: the PM approves the start, the cut-out is transparent at 900 px or taller, and a
    second look judge rates it 7.5 or more. The plan records the command, the file size, and the
    score.

- [ ] T7 (deferred:pm) Measure: One 128 px idle and walk sprite sample of Mom on the new base.
      Files: `out/sprout-mom-kim/sprites/` and its preview.
  - Every render run uses the wrapper:
    `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c './forge sprites sprout-mom-kim'`.
    `./forge sprites` takes a build slot.
  - Done-when: the PM approves the start, the sprites exist at 128 px, the face reads in
    `sprites/preview.png`, and a second look judge rates them 7.5 or more. The plan records the
    command, the preview path, and the score.

## Known limits

- `tsc --noEmit` is not a gate while TD-35 to TD-39 are open. T3 records its error count before and
  after the change, and it requires no error in the changed files.
- `PROJECT_TESTS` excludes `tests/storytime-book-pictures.test.ts` while TD-40 is open.
- The proportion check reads a render. A camera change or a frame change moves every row. The check
  pins the frame rule in decision (f) for that reason.
- The eye detector needs the two eyes to separate from the skin and from the brow. A face paint that
  joins an eye to the hair fails the check with a named error, not with a bad value.
- The judge is one opinion. A 7.5 from one family does not prove the look to Daniel. Daniel's look
  is the last gate, and it stays with him.
- The preset pin is a shared file. T3 requires a one-entry diff and stops for the PM on any other
  change, because another track may hold its own pin change.
