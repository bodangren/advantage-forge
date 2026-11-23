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
  - `tests/sprout-base.test.ts:8` imports `assets/sprout-base.ts` and `AGE5`/`HERO`. Both of its
    tests test the scrapped base and the scrapped `AGE5` table.
  - `tests/sprout-gestures.test.ts:11` imports `assets/parts/sprout-gestures.ts` and `ADULT`/`AGE5`.
    All four of its tests test the scrapped gesture module and the scrapped `ADULT` table.
  - `tests/sprout-gesture-offset.test.ts:199` holds three tests. Two test the scrapped characters
    only. The third also holds the only hero assertions of the file, at lines 209-210, 220, and
    243-244. The hero is not scrapped.
  - `tests/sprout-gesture-offset.test.ts:251` holds six tests. Every one uses `sproutGestures`,
    `AGE5`, `lily`, or `lilyLikeKind`, so every one is a scrapped-model contract.
- `tests/song-timeline.test.ts` names the asset ids `sprout-pip` as strings. It imports only
  `src/song/timeline.ts`. It reads no scrapped model, so it stays as it is.
- `tests/preset-colour.test.ts` reads `tests/fixtures/preset-pin.json`, and
  `tests/storytime-card-specs.test.ts` and `tests/storytime-family-word-specs.test.ts` read the Pat
  render fixture. Those files stay valid. They are not skipped.
- Kim's sheet is 1920 × 1280 px with four panels. The front figure spans columns 77 to 429, crown
  row 102, sole row 1195. The side figure spans columns 1036 to 1334. This scan matched the page's
  own rows on 2026-11-23.
- Mom's drawing is 1600 × 1600 px. The page's rows are crown 71 and sole 1528. The scan finds the
  figure from row 68 to row 1551, because row 1551 holds the cast shadow. The sheet script uses the
  page's rows and drops the shadow.
- The Forge render command uses a perspective camera. The front view sits 8 degrees above level and
  the side view 6 degrees above level. The command has no orthographic view and no flat view.
- `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` guards machine load. Every render
  and test run of this track uses it.

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
- No route sends Kim's sheet or Kim's panel to a model or to a third party. A route that would do so
  stops the task and reports to the PM.
- A paid call is recorded in `out/chibi-sprouts/redesign/costs.tsv`, with the header and the row
  shape of `out/chibi-sprouts/faces-r2/muse/costs.tsv`.

## Authoring decisions

The page leaves six rules open. This track fixes them here, so Red and Green decide nothing.

| #   | Decision                                                | Rule                                                                                                                                                                                                     | Why                                                                                                                              |
| --- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| d   | Level orthographic renders need two new render options  | Add the named views `front-level` and `side-level` (azimuth 0 and 90, elevation 0), a `--ortho` flag, and a `--flat` flag.                                                                               | The page demands level orthographic views. The camera today is perspective and tilted.                                           |
| e   | The measurement render is the flat vertex-colour render | `--flat` draws each mesh unlit in its own colour, with no tone mapping, no environment light, and no ground. It writes `out/<name>/flat/<view>.png`.                                                     | A lit, tone-mapped render moves the skin, hair, and eye colours by 30 % or more. A colour rule over it is not reliable.          |
| f   | The orthographic frame is fixed for the whole run       | World height `H = max(size.x, size.y, size.z) × 1.10`, a square frame, centred on the bounds centre. `ppm = imageSize / H`.                                                                              | The page compares heights and widths in one image. One scale for both views lets a width compare with a depth.                   |
| g   | The new asset needs a preset pin row                    | The new asset declares `variants` and `presets`. Green compares the parsed pin with the role baseline and requires one new key and no changed value.                                                     | `tests/preset-colour.test.ts` fails on an asset that is not in the pin. The PM forbids skipping that test.                       |
| h   | The new base imports no scrapped module                 | `assets/parts/humanoid-kim.ts` imports only `src/index.js`. It does not import `assets/parts/humanoid-kind.ts`.                                                                                          | The scrapped base holds the hero torso and the palm-forward hand code. A new base must not inherit either.                       |
| i   | Role families                                           | Green is not the Red family. Red is muse. The orchestrator picks Green with `ra-quota` at dispatch and records its model id in the plan. The AC4 judge comes from a family other than Green's and Red's. | The judge must not share the builder's blind spots, and the builder must not review its own Red. This rule names no fixed model. |
| j   | The side projection sign                                | At azimuth 90 the camera sits at +X and looks toward −X, so image right is −Z: `u = (cz − z)·ppm + W/2`. A front landmark (larger z) lands left of centre.                                               | `Studio.aim` places the camera on +X. The first draft used `z − cz`, which mirrors the side landmarks.                           |
| k   | The judge input holds no Kim art                        | The judge sees a Mom-only panel. The Kim panel exists only on the local PM sheet.                                                                                                                        | Decision 1 forbids Kim art to a third party, and a remote judge is a third party.                                                |
| l   | The sheet uses the lit render                           | The sheet panels come from `views/front-level.png` and `views/side-level.png`. The flat render feeds the numbers only.                                                                                   | The sheet shows a person beside two drawings. An unlit vertex-colour figure does not compare with them.                          |

## Scope

- One new base module for Kim's adult proportions. It builds the skeleton, the head and face, the
  torso, the arms, the open hands with the palms toward the legs, the legs, and the feet. It holds
  Mom's rest pose and one `idle` clip. It exports the chin height.
- One new asset for Mom. It adds her identity: long brown waves, a knit sweater, jeans, brown flats,
  and small pearl studs.
- Two render options in the Forge CLI and the render page, with their behaviour pin and a pin asset.
- One measurement script, one measurement test, and one sheet-layout test.
- One review sheet script for the local sheet and the Mom-only judge panel.
- One independent look judge and its record.
- The skip marker on the scrapped contract tests, with the hero assertions kept active.
- One preset pin entry for the new asset.

## Exclusions

- No other character. Lily, Dad, Grandma, Grandpa, Tom, and the children stay untested on this base.
- No 900 px song cut-out and no idle or walk sprite. Phase 9 holds them behind the PM approval.
- No paid generation call. This track runs no Muse call, no mmx call, no cloud call, and no LATO.2
  run. It sends no Kim art to any demo, model, or third party.
- No edit of a scrapped source: `assets/sprout-*.ts`, `assets/parts/sprout-gestures.ts`, and the
  ADULT and AGE5 sets of `assets/parts/humanoid-kind.ts` stay byte for byte.
- No deletion. The scrapped outputs under `out/sprout-*/` stay.
- No change to the `hero` base, the avatar base, the avatar pack, or any shipped asset.
- No change to a game, a song page, the monorepo, or a shipped delivery folder.
- No skip of `tests/preset-colour.test.ts`, `tests/song-timeline.test.ts`, or the two Storytime spec
  tests that read the Pat render fixture.

## Measurement method

This section is the one definition of every measured value. AC2 and AC3 hold the tests to it.

### Inputs

1. `out/<asset>/flat/front-level.png` and `out/<asset>/flat/side-level.png`: 1024 × 1024 px, RGBA,
   transparent background, flat vertex colours.
2. `out/<asset>/views/front-level.png` and `out/<asset>/views/side-level.png`: 1024 × 1024 px, RGBA,
   transparent background, the normal lit render. The sheet uses these (decision l).
3. `out/<asset>/stats.json`: the model bounds.
4. `out/<asset>/<asset>.glb`: the skeleton joint nodes and the hand body vertices in the rest pose.
5. `assets/<asset>.ts`: the `variants` table, for the skin and eye colours.
6. `assets/parts/humanoid-kim.ts`: the export `KIM_CHIN_Y: number`. It holds the chin bottom in
   meters on the character's centre plane, in the rest pose. The script imports it as
   `import { KIM_CHIN_Y } from '../assets/parts/humanoid-kim.ts';`, the same way
   `scripts/make-preset-pin.mjs` imports `../src/variants.ts`. The value is a finite number and
   greater than the hip height. Why an export: the chin is the bottom of a blended chin shape, and a
   vertex minimum would pick the neck or the hair.

### The flat pixel contract

The flat render is a contract, not a style choice. `src/render/page.ts` meets it as follows.

1. Every mesh keeps its geometry and its `visible` flag. Its material becomes
   `new THREE.MeshBasicMaterial({ color: material.color, vertexColors: material.vertexColors, toneMapped: false, side: material.side })`.
   Skinning stays, because `MeshBasicMaterial` supports it.
2. The ground mesh is hidden. The environment map and the three lights stay in the scene, because an
   unlit material ignores them.
3. `renderer.outputColorSpace` stays `SRGBColorSpace`, and `toneMapped: false` keeps the transfer
   curve exact. A surface point whose vertex colour is `#rrggbb` renders within 1 of 255 per channel
   of that hex.
4. Paint is stored per vertex. The face of a triangle blends the three vertex colours in linear
   light, and the result is encoded to sRGB. The measurement therefore never matches a paint colour
   exactly. It uses a tolerance of 24 of 255 per channel.
5. The background alpha is 0, and a covered pixel has alpha 255. An antialias edge pixel sits between
   them. The mask counts alpha 128 or more. A colour rule reads only a pixel with alpha 250 or more.
6. `--flat` needs `--fast` (vertex colours) and `--bg none`. Another combination fails with the
   message `--flat needs --fast and --bg none` before the build starts.
7. The original materials come back after the run, so a later command in the same page sees the
   normal render.
8. The camera is the orthographic camera when `--ortho` is set, and the perspective camera
   otherwise.

### Landmark sources

The page measured a drawing. A silhouette cannot show a joint, so the source of each landmark is
fixed:

| Landmark                              | Source            | Rule                                                                                                 |
| ------------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------- |
| crown                                 | flat front pixels | the top row of the mask                                                                              |
| sole                                  | flat front pixels | the bottom row of the mask                                                                           |
| head width                            | flat front pixels | the widest mask width over the rows from the crown to the eye row                                    |
| face                                  | flat front pixels | the skin component of the face, per "Face and eye rules"                                             |
| face width                            | flat front pixels | the widest row span of the face component between the chin row and 75 % of the way up to the eye row |
| eye opening, pupil row, pupil spacing | flat front pixels | the two eye components, per "Face and eye rules"                                                     |
| chin                                  | model             | `KIM_CHIN_Y`, projected onto the front view                                                          |
| shoulder, hip, knee, wrist            | model             | the joint nodes `upperarm.L`, `leg.L`, `shin.L`, and `hand.L` of the GLB, in the rest pose           |
| fingertip                             | model             | the lowest vertex of the `hands` body on the left side (x > 0)                                       |

The page measures in image pixels with y down. This track keeps that sign. A point above the hip has
a negative reach value.

Why the chin comes from the model: a front render of the model shows the jaw as a shading edge, not
as a silhouette edge, because the neck continues below it. Long hair also fills the mask beside the
neck. The page measured the chin by hand on a drawing. The base declares the chin, and the check
projects it.

Head width includes the hair, as the page's rule does. Mom's waves stay close to the head at the eye
line for that reason. They flare below it.

### Face and eye rules

1. The skin colour is the first option of the asset's `variants.skin`. The eye colour is the first
   option of `variants.eyes`.
2. A skin pixel is a pixel with alpha 250 or more whose colour is within 24 of 255 of the skin colour
   on every channel. A dark pixel is a pixel with alpha 250 or more whose colour differs from the
   skin colour by more than 60 of 255 on its largest channel and whose relative luminance is under
   0.45.
3. The face window is the mask's bounding box on the front view, from the crown row to the projected
   chin row.
4. The face component is the 8-connected group of skin pixels that holds the face centre. The face
   centre is the pixel at column `W/2` and the row 25 % of the way from the eye row down to the chin
   row. If that pixel is not skin (the mouth paint can cover it), the search moves up the centre
   column to the nearest skin pixel. An absent component fails with `face: no skin component`.
   Why 8-connected: a painted lash or a hair strand can split a 4-connected group.
5. The face area is the pixel count of the face component. The face width is the widest row span of
   that component over the rows from the chin row up to `chinRow − 0.75·(chinRow − eyeRow)`.
6. The eye band is the rows from `crownRow + 0.55·headHeight` to `crownRow + 0.80·headHeight`, where
   `headHeight = chinRow − crownRow`. The eye pixels are the dark pixels of the face window inside
   that band.
7. An eye component is an 8-connected group of eye pixels. It qualifies when its area is 0.0004 of
   the face area or more, when its width is 0.40 of the face width or less, when its width is 0.4 of
   its height or more, and when its centre column is within 0.35 of the face width from `W/2`.
8. Exactly two components must qualify. Fewer or more fails with
   `eye components: found <n>, expected 2`. The two components are the eyes; the left one has the
   smaller centre column.
9. The eye opening width is the mean of the two bounding-box widths, and the eye opening height is
   the mean of the two bounding-box heights. The page averages the visible openings.
10. The pupil centre of an eye is the centre of its bounding box. The pupil row is the mean of the
    two centre rows. The pupil spacing is the distance between the two centre columns.
11. The eye row is the pupil row. A component that touches the window edge fails with
    `eye component touches the window`.

### Projection

With the frame of decision (f), `ppm = size / H`, `W = H_px = size`, and the bounds centre
`(cx, cy, cz)`:

| View                      | Image column             | Image row                |
| ------------------------- | ------------------------ | ------------------------ |
| `front-level` (azimuth 0) | `u = (x − cx)·ppm + W/2` | `v = (cy − y)·ppm + H/2` |
| `side-level` (azimuth 90) | `u = (cz − z)·ppm + W/2` | `v = (cy − y)·ppm + H/2` |

`Studio.aim` puts the azimuth-90 camera at +X. It looks toward −X with +Y up, so image right is −Z.
Decision (j) records the sign. The test pins it: on the side view, the frontmost mask column in the
head band is at least `0.02·ppm` left of `W/2`.

### The pass table

| Row               | Formula                                          | Pass       |
| ----------------- | ------------------------------------------------ | ---------- |
| `heightInHeads`   | (sole − crown) / (chin − crown)                  | 3.64 ± .10 |
| `armToTorso`      | \|shoulder − fingertip\| / (hip y − shoulder y)  | 1.33 ± .08 |
| `legShare`        | (sole − hip y) / (sole − crown)                  | .39 ± .03  |
| `headToShoulders` | head width / (2 · \|shoulder x\|)                | 1.19 ± .08 |
| `wrist`           | (wrist y − hip y) / (knee y − hip y)             | −.06 ± .10 |
| `fingertips`      | (fingertip y − hip y) / (knee y − hip y)         | .51 ± .10  |
| `eyeLine`         | (pupil row − crown row) / (chin row − crown row) | .62 ± .03  |
| `eyeHeight`       | eye opening height / (chin row − crown row)      | .11 ± .02  |
| `spacingHead`     | pupil spacing / head width                       | .38 ± .03  |
| `eyeWidthFace`    | eye opening width / face width                   | .22 to .24 |
| `spacingFace`     | pupil spacing / face width                       | .47 ± .03  |

### The hand rules

The hand checks read the `hands` body of the GLB and the flat front view.

1. The hand vertices of a side are the vertices of the `hands` body with x > 0 (left) or x < 0
   (right). A vertex with |x| below 1e-6 belongs to neither side. A side with fewer than 200 vertices
   fails with `hand <side>: too few vertices`.
2. The palm normal of a side is the eigenvector of the smallest eigenvalue of the unweighted
   covariance matrix of its vertices about their centroid. Why unweighted: the mesher samples by
   surface area, so each vertex already carries its own area weight.
3. A degenerate cloud fails with `hand <side>: degenerate cloud`. The cloud is degenerate when the
   smallest eigenvalue is below `1e-8` of the largest, or when the ratio of the largest to the
   smallest is below 100.
4. The palm normal is oriented toward the body: the left normal is flipped until `n·x̂ < 0`, and the
   right normal until `n·x̂ > 0`. The signed pass is `n·x̂ ≤ −0.906` for the left hand and
   `n·x̂ ≥ 0.906` for the right hand, which is 25 degrees from the X axis. The test covers both
   hands, so a mirrored or palm-out hand fails.
5. The hand depth is `max z − min z` of the side's vertices, in meters.
6. The hand band covers the front rows from `v_wrist + 0.1·(v_tip − v_wrist)` to
   `v_tip − 0.1·(v_tip − v_wrist)`, where `v_wrist` and `v_tip` are the projected wrist row and the
   projected fingertip row. The 10 % cut keeps the sleeve and the fingertip out of the band.
7. In a band row, the runs are the horizontal runs of the mask. The body run holds the centre column
   `W/2`. A hand run on the left side is a run whose start is right of the body run's end and whose
   end is right of `W/2`. The mirror rule holds on the right side.
8. A row holds a hand run when at least one hand run exists. When several exist, the widest one
   counts. A row that holds none is left out. If under 80 % of the band rows hold a hand run, the
   check fails with `hand <side>: not separated from the leg`.
9. The gap of a row is the hand run's start minus the body run's end. The smallest gap over the band
   rows must be 2 px or more, or the check fails with `hand <side>: gap under 2 px`.
10. The hand front width is the median of the hand run widths over the band rows. The pass is
    `handFrontWidth ≤ 0.60 · handDepth · ppm`. A palm that faces forward shows about the full palm
    width in front and fails.
11. Why the depth comes from the model and not from the side render: a hanging hand overlaps the
    thigh in the side view, so the side mask cannot separate it. The forearm row is no better,
    because the sleeve touches the torso.

### Derived targets

The table fixes the shape. These targets follow from a height of 1.500 m, Kim's ratios, and an
explicit horizontal reach of 0.045 m (the page's 33 px at the 1.5 m scale). Green starts from them,
and the check decides the result.

| Item                          | Target                                                   |
| ----------------------------- | -------------------------------------------------------- |
| head height                   | 0.412 m (1.500 / 3.64)                                   |
| crown, chin                   | 1.500 m, 1.088 m                                         |
| hip                           | 0.585 m (leg share .39)                                  |
| knee                          | 0.324 m (hip-to-knee 0.261 m, the page's 190 / 1093)     |
| wrist                         | 0.569 m (hip − .06 · 0.261)                              |
| fingertip                     | 0.452 m (hip − .51 · 0.261)                              |
| horizontal reach, fingertip x | 0.045 m, 0.188 m (shoulder x + 0.045)                    |
| torso height, shoulder        | 0.409 m, 0.994 m (from d² + (T + r)² = (1.33·T)²)        |
| arm                           | 0.544 m (1.33 · 0.409)                                   |
| head width, half width        | 0.341 m, 0.170 m (the page's 248/300 of the head height) |
| shoulder half width           | 0.143 m (head width / 1.19)                              |
| face width                    | 0.278 m (the page's 202/248 of the head width)           |
| eye width                     | 0.064 m (.23 · face width)                               |
| eye spacing                   | 0.130 m (.38 · head width and .47 · face width agree)    |
| eye height                    | 0.045 m (.11 · head height)                              |
| eye line                      | 1.245 m (crown − .62 · head height)                      |

The torso height and the shoulder come from the arm ratio with the horizontal reach held in the arm
length, not from a vertical approximation. `T` solves `0.045² + (T + 0.133)² = (1.33 T)²` and gives
`T = 0.409`.

### Render commands

```bash
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none --size 1024
```

The first command writes `out/sprout-mom-kim/flat/`. The second writes
`out/sprout-mom-kim/views/`. The two output folders are separate, because a render run clears
`views/`.

## Acceptance criteria

### AC1: the scrapped contract tests are skipped, and the hero stays tested

1. `tests/sprout-base.test.ts` skips its whole describe. The skipped tests are
   `has the bone names, clip names, and equip sockets of the avatar base` and
   `keeps the hero head and a shorter body`.
2. `tests/sprout-gestures.test.ts` skips its whole describe. The skipped tests are
   `keeps the child clap plane and hand gap`, `keeps the child touch points`,
   `keeps the child chest and hip points`, and
   `moves each adult goal to the same place on the grown-up body`.
3. `tests/sprout-gesture-offset.test.ts` keeps the hero assertions active in a new describe
   `hero clip contracts (not scrapped)`, with three tests:
   - `keeps the hero clip inventory: the 8 base clips` (from lines 209-210),
   - `keeps the hero default pose digest: size 8, digest 68442177` (from line 220),
   - `keeps the hero cheer wrist-to-head distance: 0.27635 m` (from lines 243-244).
4. The same file skips its two other describes, and the hero lines leave the skipped bodies. The
   skipped tests are:
   - `keeps the full clip inventory: 26 sprout clips plus 8 base clips`,
   - `keeps the full default pose data per character`,
   - `keeps the key hand distances of point-up, picture-sway, and cheer`,
   - `moves the point-up hand outward by the requested clearance`,
   - `moves the picture-sway hands outward by the requested clearance`,
   - `leaves the other 24 sprout clips identical with the option`,
   - `moves the cheer fists outward by the requested clearance on the kind path`,
   - `leaves the other 7 base clips identical with the kind option`,
   - `Lily opts in: her point-up, picture-sway, and cheer clear the bob hair`.
5. Each skipped describe title ends with ` — sprout base scrapped 2026-11-23 (Daniel)`. Each of the
   three files holds the line `// sprout base scrapped 2026-11-23 (Daniel)` above its first import.
6. No other test file changes for the skip.
7. The three files then hold 18 tests: 3 pass and 15 skip. No test is deleted, and no assertion of
   the hero is lost.
8. The suite exits 0. The command is
   `node node_modules/vitest/vitest.mjs run --maxWorkers=1 --exclude tests/storytime-book-pictures.test.ts`.
   The plan records the reporter line with the file count, the test count, and the skipped count.
9. A guard case reads the three files and requires the active hero describe, the three hero test
   names, the four skipped titles, and the three reason comments. The guard fails when an edit
   unskips a scrap test or drops a reason.

### AC2: the proportion check

1. `scripts/proportion-check.mjs` measures one asset from the inputs of the measurement method and
   writes `out/chibi-sprouts/redesign/measure.json`. The record holds each landmark with its pixel
   position, each row with its value and its range, the image size, `ppm`, both render paths, the
   SHA-256 of each render, and the rows of the lit views under `rows.lit`. The script exports
   `checkRows(rows)`, `palmNormal(vertices, side)`, and `measurePixels()` for the tests.
2. The script prints one line per row: `row value target±tolerance pass`. It exits 0 when every row
   passes and every guard holds. It exits 1 and prints `FAIL <row>: <value> not in <lo>..<hi>` for
   each failing row, and `GUARD <name>: <detail>` for each failing guard.
3. The guards:
   - the two flat views give equal crown-to-sole heights within 2 px,
   - the projected sole and the projected model top sit on the mask's bottom and top row within 2 px,
   - every projected model landmark (chin, shoulder, hip, knee, wrist, fingertip) sits on a mask
     pixel,
   - the chin row is above the hip row, and the eye row is above the chin row,
   - on the side view, the frontmost mask column in the head band is at least `0.02·ppm` left of
     `W/2`.
4. Every row of the pass table holds for `sprout-mom-kim`.
5. `tests/sprout-mom-kim.test.ts` runs the script and requires exit 0, the eleven row names, and each
   value inside its range read from `measure.json`.
6. Breakage proof one, the table: `checkRows(rows)` fails with the row name when one row moves just
   outside its range, for each of the eleven rows. A doctored row that passes fails the case.
7. Breakage proof two, the pixels: `measurePixels()` runs five synthetic figures in a temporary
   folder, with independent mutations:
   - the pass figure holds the pass geometry and must pass every row,
   - a crown 15 % higher, with the same chin and eye rows, fails `heightInHeads`,
   - a sole 10 % lower, with the same model landmarks, fails `legShare`,
   - a head 12 % wider at the temples, with the same shoulder span, fails `headToShoulders`,
   - two eyes drawn as one merged dark shape fail with `eye components: found 1, expected 2`.
     Each case names its own expected failure.
8. The check needs no paid call and no network. It reads local files only.

### AC3: the palms face the legs

1. The new base builds both hands as one body named `hands`, with a left half at x > 0.
2. `scripts/proportion-check.mjs` tests both hands with the signed rule of "The hand rules": left
   `n·x̂ ≤ −0.906`, right `n·x̂ ≥ 0.906`.
3. A side with too few vertices or a degenerate cloud fails with its named error.
4. The front flat view must show each hand as a separate run, with a gap of 2 px or more, and the
   hand front width must be 0.60 of the hand depth times `ppm` or less, per "The hand rules".
5. The side view shows the thumbs forward and the backs of the hands out. The review sheet records
   both, and the look judge of AC4 rates the palms.
6. `tests/sprout-mom-kim.test.ts` holds a breakage case: `palmNormal` on a vertex cloud turned 90
   degrees about Y gives a signed value that fails rule 2, and a cloud mirrored to x < 0 with the
   left-side rule fails too.

### AC4: the independent look judge

1. A judge that did not build the asset, on a model family other than Green's and Red's, rates the
   shape. Decision (i) holds the rule.
2. The judge sees `out/chibi-sprouts/redesign/mom-panel.png`, which holds the lit Mom front render,
   the lit Mom side render, and Mom's drawing at one scale. It also sees the eleven measured rows
   and the Kim ratio numbers as text. It sees no Kim image, per decision (k).
3. The judge rates two numbers out of 10: identity (the long brown waves, the knit sweater, the
   jeans, the face) and proportion (the body and face against Kim's numbers).
4. Both scores are 7.5 or more.
5. The judge writes `measure/runs/chibi_sprouts_redesign_20261123/judge.json` with the model id, the
   model family, the Green and Red model families, the panel path and its SHA-256, the two scores,
   one comment per score, and a verdict.
6. A score under 7.5 returns the track to Green with the comment as the work list. A second judge
   family is not a remedy for a failed score.
7. When no judge route can run without sending Kim's sheet or Kim's panel, the task stops and
   reports to the PM. The track does not fall back to a Kim-containing input.

### AC5: the review sheet

1. `scripts/mom-kim-sheet.mjs` writes `out/chibi-sprouts/redesign/mom-kim-review.png` and
   `out/chibi-sprouts/redesign/mom-panel.png`.
2. The sheet has two rows. Row one is Kim's front panel, the Mom front render, and Mom's drawing.
   Row two is Kim's side panel, the Mom side render, and a cell that says `no side drawing`.
3. Both renders are the lit views `views/front-level.png` and `views/side-level.png` (decision l).
4. The render rows come from `measure.json` under `rows.lit`. The reference rows are the page's Kim
   rows (crown 102, sole 1195) and Mom rows (crown 71, sole 1528). The script measures each side
   figure with its background scan and requires the result within 4 px of those rows, so both
   panels of a reference use the row pair of that reference.
5. Every panel is scaled so the crown-to-sole height is 700 px, and every sole sits on the same
   baseline.
6. The caption strip holds the asset name, the date, the pass table result, and the Green model id.
7. The sheet is local. No route sends it to a model or a third party. T9 hands the path to the PM,
   and the upload to Daniel waits for the PM's word.

### AC6: the stop

1. Phase 9 holds the cut-out and the sprite as `deferred:pm` tasks. They start only after the PM
   approves the shape at T10.
2. Before the approval, no cut-out exists for the new base and no sprite exists for the new base.
3. Those tasks start only by an amendment. The amendment adds the walk clip source as its own Red
   task and its own Green task, because T5 builds the `idle` clip only. The idle sprite sample does
   not need the walk clip.

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
- [The spec review of r1](../../runs/chibi_sprouts_redesign_20261123/spec-review-61db4f1.json)

## Scope control

This track adds two asset modules, one pin asset, one measurement script, one sheet script, three
test files, and two render options. It changes the three scrapped test files, the preset pin, the
Forge CLI, and the render page. It changes no scrapped source, no shipped asset, no game, no song
page, no monorepo file, and no delivery folder. It runs no paid call, it sends no Kim art to a model,
and it deletes nothing.
