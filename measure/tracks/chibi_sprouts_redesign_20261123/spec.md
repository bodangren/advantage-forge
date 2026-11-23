# Chibi Sprouts: new adult base on Teacher Kim, with Mom as the first trial

## Purpose

The owner scrapped the Chibi Sprouts 3D base on 2026-11-23. His note names four faults: the arms are
too long, the eyes are too large, the face is out of proportion, and the palms face forward. He asked
for Teacher Kim's proportions as the base.

This track starts one new SDF base. The base uses Kim's measured ratios. Mom is the first character
on it. The track proves the shape with numbers and with an independent look. Then it stops for PM
review, before any song cut-out or sprite.

## Context

- The owner's words, 2026-11-23: "The 3D images look almost nothing like the 2D image. Arms are too
  long. Faces are oddly proportioned. They look alien. Scrap the base model and go back to the
  drawing board."
- The owner's second note, 2026-11-23, Tasks `amtHbHFL`: "You have giant eyes when no adults have
  giant eyes. They crowd the rest of the face. The palms of the hand are facing forward instead of
  toward the legs. The arms are too long, as mentioned in #1. Why not use Teacher Kim's proportions
  as the base?"
- The page `docs/chibi-sprouts/redesign-2026-11-23.md` holds the landmark measurements, the Kim
  ratios, the four options, the Mom trial, and the pass table. The PM approved it on 2026-11-23.
- The page measures Kim's front panel at 3.64 heads, arm over torso 1.33, leg share .39, head over
  shoulders 1.19, wrist −.06 and fingertip .51 of the hip-to-knee distance, eye line .62, eye height
  .11, spacing over head .38, eye width over face .24, and spacing over face .47.
- The inventory `docs/chibi-sprouts/scrapped-base-users-2026-11-23.md` lists every asset and
  deliverable that uses the scrapped base. The scrapped sources stay in git and are untouched.
- The scrapped contract tests pass at the track start, on 2026-11-23:

  ```bash
  node node_modules/vitest/vitest.mjs run --maxWorkers=1 tests/sprout-base.test.ts tests/sprout-gestures.test.ts tests/sprout-gesture-offset.test.ts
  ```

  The run gives 3 files, 15 tests, and exit 0.

- The test files that import a scrapped source are exactly these three. They hold four top-level
  `describe` calls:
  - `tests/sprout-base.test.ts:8` imports `assets/sprout-base.ts` and `AGE5`/`HERO`.
  - `tests/sprout-gestures.test.ts:11` imports `assets/parts/sprout-gestures.ts` and `ADULT`/`AGE5`.
  - `tests/sprout-gesture-offset.test.ts:199` and `:251` import six `assets/sprout-*.ts` files,
    `assets/sprout-adult-base.ts`, `assets/parts/sprout-gestures.ts`, and `AGE5`.
- `tests/song-timeline.test.ts` names the asset ids `sprout-pip` as strings. It imports only
  `src/song/timeline.ts`. It reads no scrapped model, so it stays as it is.
- `tests/preset-colour.test.ts` reads `tests/fixtures/preset-pin.json`, and
  `tests/storytime-card-specs.test.ts` and `tests/storytime-family-word-specs.test.ts` read the Pat
  render fixture. Those files stay valid. They are not skipped.
- Kim's sheet is 1920 × 1280 px with four panels. The front figure spans columns 77 to 429, crown
  row 102, sole row 1195. This scan matched the page's own rows on 2026-11-23.
- Mom's drawing is 1600 × 1600 px. The page's rows are crown 71 and sole 1528. The scan finds the
  figure from row 68 to row 1551, because row 1551 holds the cast shadow. The sheet script uses the
  page's rows and drops the shadow.
- The Forge render command uses a perspective camera. The front view sits 8 degrees above level and
  the side view 6 degrees above level. The command has no orthographic view and no flat view.
- The `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` wrapper guards machine load.
  Every render and test run of this track uses it.

## PM decisions, 2026-11-23

Decision 1: "Mom trial approved: a NEW SDF base, Mom on Kim's ratios, zero paid calls (no Muse, no
mmx, no cloud, no LATO.2, no Kim art to any demo or third party), the pass table as written in the
page (heights in heads, arm over torso, leg share, head over shoulders, wrist and fingertip reach,
eye line, eye height, eye spacing over head, eye width over face, eye spacing over face; palms
toward the legs). Level orthographic front and side views beside Kim and Mom's drawing. STOP for PM
review after the shape passes, BEFORE the 900 px song cut-out and the 128 px sprite. Run full type
checks and renders through `HEAVY_MIN_AVAIL_MB=1500 bash
/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'` (a textured forge command
also needs a build slot; use `--fast` for shape iteration)."

Decision 2: "LATO.2 and GCP: not now (the geometry and rig risks stay). No Kim art to the demo."

Decision 3: "The scrapped sources (`assets/sprout-*.ts`, `assets/parts/sprout-gestures.ts`,
`assets/parts/humanoid-kind.ts` ADULT set) stay in the repo, untouched; their contract tests are
marked skipped with the scrap reason; delete nothing."

Item 4 (the old_browser A7 scanner fix) is a different track. This track does not own it.

## Standing rules

These rules hold for every role of this track. The PM approved them on 2026-11-23.

- No role calls the `openchamber_image` tool. That tool generates or edits images, and it costs
  money. To look at an image, a role uses the `read` tool.
- A paid call, or an upload of Kim or sprout art to a third party, before the PM approves the shape,
  is a stop-and-report event. The role stops, keeps every file, and reports to the PM.
- A paid call is recorded in `out/chibi-sprouts/redesign/costs.tsv`, with the header and the row
  shape of `out/chibi-sprouts/faces-r2/muse/costs.tsv`.

## Authoring decisions

The page leaves six rules open. This track fixes them here, so Red and Green decide nothing.

| #   | Decision                                                | Rule                                                                                                                                                                                                                                            | Why                                                                                                                                                                            |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| d   | Level orthographic renders need two new render options  | Add the named views `front-level` and `side-level` (azimuth 0 and 90, elevation 0), a `--ortho` flag, and a `--flat` flag.                                                                                                                      | The page demands level orthographic views. The camera today is perspective and tilted.                                                                                         |
| e   | The measurement render is the flat vertex-colour render | `--flat` draws each mesh unlit in its own colour with no tone mapping, no environment light, and no ground, and writes `out/<name>/flat/<view>.png`.                                                                                            | A lit, tone-mapped render moves the skin, hair, and eye colours by 30 % or more. A colour rule over it is not reliable. The flat render gives one exact colour per paint mark. |
| f   | The orthographic frame is fixed for the whole run       | World height `H = max(size.x, size.y, size.z) × 1.10`, a square frame, centred on the bounds centre. `pixelsPerMetre = imageSize / H`. Front: `u = (x − cx)·ppm + W/2`, `v = (cy − y)·ppm + H_px/2`. Side from +X: `u = (z − cz)·ppm + W_px/2`. | The page compares heights and widths in one image. One scale for both views makes a width compare with a depth.                                                                |
| g   | The new asset needs a preset pin row                    | The new asset declares `variants` and `presets`. Green regenerates `tests/fixtures/preset-pin.json` with `scripts/make-preset-pin.mjs` and requires the diff to hold one new entry and no changed value.                                        | `tests/preset-colour.test.ts` fails on an asset that is not in the pin. The PM forbids skipping that test.                                                                     |
| h   | The new base imports no scrapped module                 | `assets/parts/humanoid-kim.ts` imports only `src/index.js`. It does not import `assets/parts/humanoid-kind.ts`.                                                                                                                                 | The scrapped base holds the hero torso and the palm-forward hand code. A new base must not inherit either.                                                                     |
| i   | Role families                                           | Green is not the Red family. Red is muse. The orchestrator picks Green with `ra-quota` at dispatch and records its model id in T3. The AC4 judge comes from a family other than Green's and Red's.                                              | The judge must not share the builder's blind spots, and the builder must not review its own Red. This rule names no fixed model.                                               |

## Scope

- One new base module for Kim's adult proportions. It builds the skeleton, the head and face, the
  torso, the arms, the open hands with the palms toward the legs, the legs, and the feet. It holds
  Mom's rest pose and one `idle` clip.
- One new asset for Mom. It adds her identity: long brown waves, a knit sweater, jeans, brown flats,
  and small pearl studs.
- Two render options in the Forge CLI and the render page: level orthographic views and flat views.
- One measurement script and its test over the pass table, the palm direction, and two breakage
  proofs.
- One review sheet script for the Kim, Mom render, and Mom drawing panels.
- One independent look judge and its record.
- The skip marker on the three scrapped contract tests.
- One preset pin entry for the new asset.

## Exclusions

- No other character. Lily, Dad, Grandma, Grandpa, Tom, and the children stay untested on this base.
- No 900 px song cut-out and no 128 px sprite. Phase 5 holds them behind the PM approval.
- No paid generation call. This track runs no Muse call, no mmx call, no cloud call, no LATO.2 run,
  and it sends no Kim art to any demo or third party.
- No edit of a scrapped source: `assets/sprout-*.ts`, `assets/parts/sprout-gestures.ts`, and the
  ADULT set of `assets/parts/humanoid-kind.ts` stay byte for byte.
- No deletion. The scrapped outputs under `out/sprout-*/` stay.
- No change to the `hero` base, the avatar base, the avatar pack, or any shipped asset.
- No change to a game, a song page, the monorepo, or a shipped delivery folder.
- No skip of `tests/preset-colour.test.ts`, `tests/song-timeline.test.ts`, or the two Storytime spec
  tests that read the Pat render fixture.

## Measurement method

This section is the one definition of every measured value. AC2 holds the test to it.

### Inputs

1. `out/<asset>/flat/front-level.png` and `out/<asset>/flat/side-level.png`: 1024 × 1024 px, RGBA,
   transparent background, flat vertex colours.
2. `out/<asset>/stats.json`: the model bounds.
3. `out/<asset>/<asset>.glb`: the skeleton joint nodes and the hand body vertices in the rest pose.
4. `assets/<asset>.ts`: the `variants` table, for the skin and eye colours.

The mask is a pixel with alpha 128 or more. The 0.28-alpha ground shadow stays out of the mask, and
the flat render has no ground.

Level proof: a level orthographic camera shows equal crown-to-sole heights in the front and the side
view. The test requires a difference of 2 px or less.

### Landmark sources

The page measured a drawing. A silhouette cannot show a joint, so the source of each landmark is
fixed:

| Landmark                            | Source       | Rule                                                                                           |
| ----------------------------------- | ------------ | ---------------------------------------------------------------------------------------------- |
| crown                               | front pixels | the top row of the mask                                                                        |
| sole                                | front pixels | the bottom row of the mask                                                                     |
| head width                          | front pixels | the widest mask width over the rows from the crown to the eye line                             |
| chin                                | model        | the chin landmark of the base proportion table, projected onto the front view                  |
| face width                          | front pixels | the widest span of skin colour in the band from the chin up to 75 % of the way to the eye line |
| eye opening, pupil y, pupil spacing | front pixels | the dark eye paint in the band from crown + 0.55·head height to crown + 0.80·head height       |
| shoulder, hip, knee, wrist          | model        | the joint nodes `upperarm.L`, `leg.L`, `shin.L`, and `hand.L` of the GLB, in the rest pose     |
| fingertip                           | model        | the lowest vertex of the `hands` body on the left side (x > 0)                                 |

The page measures in image pixels with y down. This track keeps that sign. A point above the hip has
a negative reach value.

Why the chin comes from the model: a front render of the model shows the jaw as a shading edge, not
as a silhouette edge, because the neck continues below it. Long hair also fills the mask beside the
neck. The page measured the chin by hand on a drawing. The base declares the chin, and the check
projects it.

Head width includes the hair, as the page's rule does. Mom's waves stay close to the head at the eye
line for that reason. They flare below it.

The eye paint is a pixel in the eye band whose colour differs from the skin colour by more than 60
of 255 on its largest channel and whose luminance is under 0.45. The components are the connected
dark regions. A component qualifies when its width is 0.4 of its height or more, when its area is
0.0004 of the face area or more, when its width is 0.40 of the face width or less, and when its
centre sits within 0.35·face width of the face centre. The two largest qualifying components are the
eyes. Another count fails the check with a named error.

### The pass table

| Row               | Formula                                         | Pass       |
| ----------------- | ----------------------------------------------- | ---------- |
| `heightInHeads`   | (sole − crown) / (chin − crown)                 | 3.64 ± .10 |
| `armToTorso`      | \|shoulder − fingertip\| / (hip y − shoulder y) | 1.33 ± .08 |
| `legShare`        | (sole − hip y) / (sole − crown)                 | .39 ± .03  |
| `headToShoulders` | head width / (2 · \|shoulder x\|)               | 1.19 ± .08 |
| `wrist`           | (wrist y − hip y) / (knee y − hip y)            | −.06 ± .10 |
| `fingertips`      | (fingertip y − hip y) / (knee y − hip y)        | .51 ± .10  |
| `eyeLine`         | (pupil y − crown) / (chin − crown)              | .62 ± .03  |
| `eyeHeight`       | eye opening height / (chin − crown)             | .11 ± .02  |
| `spacingHead`     | pupil spacing / head width                      | .38 ± .03  |
| `eyeWidthFace`    | eye opening width / face width                  | .22 to .24 |
| `spacingFace`     | pupil spacing / face width                      | .47 ± .03  |

### Derived targets

The table fixes the shape. These targets follow from a height of 1.500 m and Kim's ratios. Green
starts from them, and the check decides the result.

| Item                   | Target                                                   |
| ---------------------- | -------------------------------------------------------- |
| head height            | 0.412 m (1.500 / 3.64)                                   |
| crown, chin            | 1.500 m, 1.088 m                                         |
| hip                    | 0.585 m (leg share .39)                                  |
| knee                   | 0.324 m (hip-to-knee 0.261 m, the page's 190 / 1093)     |
| wrist                  | 0.569 m (hip − .06 · 0.261)                              |
| fingertip              | 0.452 m (hip − .51 · 0.261)                              |
| torso height, shoulder | 0.403 m, 0.988 m (the arm ratio 1.33 gives this height)  |
| arm                    | 0.536 m                                                  |
| head width, half width | 0.341 m, 0.170 m (the page's 248/300 of the head height) |
| shoulder half width    | 0.143 m (head width / 1.19)                              |
| face width             | 0.278 m (the page's 202/248 of the head width)           |
| eye width              | 0.064 m (.23 · face width)                               |
| eye spacing            | 0.130 m (.38 · head width and .47 · face width agree)    |
| eye height             | 0.045 m (.11 · head height)                              |
| eye line               | 1.245 m (crown − .62 · head height)                      |

### Render commands

```bash
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none --size 1024
```

The first command writes `out/sprout-mom-kim/flat/`. The second writes
`out/sprout-mom-kim/views/`. The two output folders are separate, because a render run clears
`views/`.

## Acceptance criteria

### AC1: the scrapped contract tests are skipped with the scrap reason

1. Each of the four top-level `describe` calls becomes `describe.skip`, and its title ends with
   ` — sprout base scrapped 2026-11-23 (Daniel)`. The four calls are
   `tests/sprout-base.test.ts:8`, `tests/sprout-gestures.test.ts:11`,
   `tests/sprout-gesture-offset.test.ts:199`, and `tests/sprout-gesture-offset.test.ts:251`.
2. Each of the three files also holds the line `// sprout base scrapped 2026-11-23 (Daniel)` above
   its first import.
3. No other test file changes for the skip. In particular `tests/song-timeline.test.ts`,
   `tests/preset-colour.test.ts`, `tests/storytime-card-specs.test.ts`, and
   `tests/storytime-family-word-specs.test.ts` keep their tests.
4. The suite exits 0. The command is
   `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts`.
   The plan records the reporter line: the file count, the test count, the skipped count, and the
   commit the run tested. The run holds 15 more skipped tests than before the change.
5. A guard case reads the three files and requires the four `describe.skip` titles and the three
   reason comments. The guard fails if a later edit unskips a call or drops a reason.

### AC2: the proportion check

1. `scripts/proportion-check.mjs` measures one asset from the four inputs of the measurement method
   and writes `out/chibi-sprouts/redesign/measure.json`. The record holds each landmark with its
   pixel position, each row with its value and its pass range, the image size, `pixelsPerMetre`, the
   render paths, and the SHA-256 of each render. The script exports `checkRows(rows)`,
   `palmNormal(vertices)`, and `measurePixels()` for the breakage cases and for the test.
2. The script prints one line per row: `row value target±tolerance pass`. It exits 0 when every row
   passes and every guard holds. It exits 1 and prints `FAIL <row>: <value> not in <lo>..<hi>` for
   each failing row.
3. The guards:
   - The two level views give equal crown-to-sole heights within 2 px.
   - The projected sole and the projected model top sit on the mask's bottom and top row within 2 px.
   - Every projected model landmark (chin, shoulder, hip, knee, wrist, fingertip) sits on a mask
     pixel.
   - The chin row is above the hip row, and the eye row is above the chin row.
4. Every row of the pass table holds for `sprout-mom-kim`.
5. `tests/sprout-mom-kim.test.ts` runs the script and requires exit 0, the eleven row names, and each
   value inside its range read from `measure.json`.
6. Breakage proof one, the table: the test calls the exported `checkRows(rows)` with eleven doctored
   row sets, one per row, each moved just outside its range. Each call must fail that row and name
   it. A row that passes a doctored value fails the case.
7. Breakage proof two, the pixels: the test draws two synthetic figures in a temporary folder and
   calls the exported `measurePixels()`. The first figure holds the pass geometry. The second holds
   the same body, the same chin and eye rows, and a crown 15 % higher. The first measures as a pass.
   The second fails `heightInHeads`. This proves the crown, sole, head width, and eye detectors read
   pixels and not only numbers.
8. The check needs no paid call and no network. It reads local files only.

### AC3: the palms face the legs

1. The new base builds both hands as one body named `hands`.
2. `scripts/proportion-check.mjs` takes the left hand's rest-pose vertices (x > 0) of that body from
   the GLB and computes the palm normal as the least-variance axis of the vertex cloud.
3. The palm normal of each hand is within 25 degrees of the ±X axis: `|n·x̂| ≥ 0.906`.
4. The front flat render shows the hand as a separate outer run in the hand band, with a gap of 2 px
   or more from the leg. The width of that run is 1.4 times the forearm width at 2 cm above the
   wrist or less. A hand that touches the leg fails with `hand not separated`.
5. The side view shows the thumbs forward and the backs of the hands out. The review sheet records
   both, and the look judge of AC4 rates the palms.
6. `tests/sprout-mom-kim.test.ts` holds a breakage case: the exported `palmNormal(vertices)` on a
   vertex cloud turned 90 degrees about Y gives `|n·x̂| < 0.906`, so rule 3 fails on a palm-forward
   hand.

### AC4: the independent look judge

1. A judge that did not build the asset, on a model family other than the builder's family and the
   Red family, sees the review sheet of AC5 and nothing else of this track. Decision (i) holds the
   rule.
2. The judge rates two numbers out of 10 against Kim's sheet and Mom's drawing: identity (the long
   brown waves, the knit sweater, the jeans, the face) and proportion (the body and face against
   Kim).
3. Both scores are 7.5 or more. The bar is the character bar of the project.
4. The judge writes `measure/runs/chibi_sprouts_redesign_20261123/judge.json` with the model id, the
   model family, the builder's model family, the sheet path and its SHA-256, the two scores, one
   comment per score, and a verdict.
5. A score under 7.5 returns the track to Green with the comment as the work list. A second judge
   family is not a remedy for a failed score.

### AC5: the review sheet

1. `scripts/mom-kim-sheet.mjs` writes `out/chibi-sprouts/redesign/mom-kim-review.png`.
2. The sheet has two rows. Row one is Kim's front panel, the Mom front render, and Mom's drawing.
   Row two is Kim's side panel, the Mom side render, and a cell that says `no side drawing`.
3. Every panel is scaled so the crown-to-sole height is 700 px, and every sole sits on the same
   baseline. The reference rows are the page's: Kim 102 and 1195, Mom 71 and 1528. The render rows
   come from `measure.json`.
4. The sheet holds the asset name, the date, the pass table result, and the model id of the builder
   in a caption strip.
5. The sheet is not uploaded by this track. T5 hands the path to the PM, and the upload to Daniel
   waits for the PM's word.

### AC6: the stop

1. No song cut-out exists for the new base in this track. No sprite exists for the new base in this
   track.
2. `out/sprout-mom-kim/` holds no `sprites/` folder and no `cutout` output.
3. Phase 5 holds the cut-out and the sprite as `deferred:pm` tasks. They start only after the PM
   approves the shape.

## Sources

- [The approved redesign page](../../../docs/chibi-sprouts/redesign-2026-11-23.md)
- [The scrapped base users](../../../docs/chibi-sprouts/scrapped-base-users-2026-11-23.md)
- [The scrapped track plan](../asset_chibi_sprouts_r1_20261022/plan.md)
- [The Kim sheet](../../../out/storytime-review/muse-cast/teacher-kim-sheet.png)
- [Mom's drawing](../../../docs/sprout-mockups/mom.jpg)
- [The humanoid kind and its adult set](../../../assets/parts/humanoid-kind.ts)
- [The scrapped Mom asset](../../../assets/sprout-mom.ts)
- [The equipment part contract](../../../docs/equipment-parts.md)
- [The Forge authoring guide](../../../AGENTS.md)
- [The render page](../../../src/render/page.ts)
- [The Forge CLI](../../../src/cli/forge.ts)

## Scope control

This track adds two asset modules, one measurement script, one sheet script, one test file, and one
render option pair. It changes the three scrapped test files, the preset pin, the Forge CLI, and the
render page. It changes no scrapped source, no shipped asset, no game, no song page, no monorepo
file, and no delivery folder. It runs no paid call, and it deletes nothing.
