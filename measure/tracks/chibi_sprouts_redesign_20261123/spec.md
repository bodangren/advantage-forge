# Chibi Sprouts: new adult base on Teacher Kim, with Mom as the first trial

## Purpose

The owner scrapped the Chibi Sprouts 3D base on 2026-11-23. His note names four faults: the arms are
too long, the eyes are too large, the face is out of proportion, and the palms face forward. He asked
for Teacher Kim's proportions as the base.

This track starts one new SDF base. The base uses Kim's measured ratios. Mom is the first character
on it. The track proves the shape with numbers and with an independent look. Then it stops for PM
review, before any song cut-out or sprite. A second, separate trial runs a LATO.2 image-to-mesh test
on our own VM under a USD 5 cap (Phase 6). It feeds the PM decision and does not replace the SDF
base.

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
  page's rows and drops the shadow. Mom has one drawing and no side drawing.
- The Forge render command uses a perspective camera. The front view sits 8 degrees above level and
  the side view 6 degrees above level. The command has no orthographic view and no flat view.
- `/home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh` guards machine load. Every render
  and test run of this track uses it.
- The mid-red gate of `measure_interphase_checks.py` (`non_test_paths`) accepts only `measure/`
  paths, `tests/` paths, and test files. A Red commit of this track holds tests only.

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

Decision L, later on 2026-11-23: "Approve $5 for testing the process. If it works well, the cost is
quite low for better results." It narrows the LATO.2 clause of decision 2 for one trial under the
USD 5 cap. Phase 6 holds the trial.

Separate item: the old_browser A7 scanner fix belongs to a different track. This track does not own
it.

## Standing rules

These rules hold for every role of this track. The PM approved them on 2026-11-23.

- No role calls the `openchamber_image` tool. That tool generates or edits images, and it costs
  money. To look at an image, a role uses the `read` tool.
- Kim art goes to no remote model, no hosted demo, and no third party. The approved own-VM LATO.2
  trial is allowed (decision m).
- Mom's render and Daniel's drawing may go to the established look-judge routes, as in the earlier
  sprout looks.
- The Kim review sheet is built and kept locally for the PM. No route sends it out.
- A paid call, or a forbidden upload, is a stop-and-report event. The role stops, keeps every file,
  and reports to the PM.
- A paid call is recorded in `out/chibi-sprouts/redesign/costs.tsv`, with the header and the row
  shape of `out/chibi-sprouts/faces-r2/muse/costs.tsv`.

## Authoring decisions

The page leaves seven rules open. This track fixes them here, so Red and Green decide nothing.

| #   | Decision                                                | Rule                                                                                                                                                                                                                                                  | Why                                                                                                                                                                           |
| --- | ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| d   | Level orthographic renders need two new render options  | Add the named views `front-level` and `side-level` (azimuth 0 and 90, elevation 0), a `--ortho` flag, and a `--flat` flag.                                                                                                                            | The page demands level orthographic views. The camera today is perspective and tilted.                                                                                        |
| e   | The measurement render is the flat vertex-colour render | `--flat` draws each mesh unlit in its own colour, with no tone mapping, no environment light, and no ground. It writes `out/<name>/flat/<view>.png`.                                                                                                  | A lit, tone-mapped render moves the skin, hair, and eye colours by 30 % or more. A colour rule over it is not reliable.                                                       |
| f   | The orthographic frame is fixed for the whole run       | World height `H = max(size.x, size.y, size.z) × 1.10`, a square frame, centred on the bounds centre. `ppm = imageSize / H`.                                                                                                                           | The page compares heights and widths in one image. One scale for both views lets a width compare with a depth.                                                                |
| g   | The new asset needs a preset pin row                    | The new asset declares `variants` and `presets`. Green compares the parsed pin with the role baseline and requires one new key and no changed value.                                                                                                  | `tests/preset-colour.test.ts` fails on an asset that is not in the pin. The PM forbids skipping that test.                                                                    |
| h   | The new base imports no scrapped module                 | `assets/parts/humanoid-kim.ts` imports only `src/index.js`. It does not import `assets/parts/humanoid-kind.ts`.                                                                                                                                       | The scrapped base holds the hero torso and the palm-forward hand code. A new base must not inherit either.                                                                    |
| i   | Role families                                           | Green is not the Red family. Red is muse. The orchestrator picks Green with `ra-quota` at dispatch and records its model id in the plan. The AC4 judge comes from a family other than Green's and Red's.                                              | The judge must not share the builder's blind spots, and the builder must not review its own Red. This rule names no fixed model.                                              |
| j   | The side projection sign                                | At azimuth 90 the camera sits at +X and looks toward −X, so image right is −Z: `u = (cz − z)·ppm + W/2`. A front landmark (larger z) lands left of centre.                                                                                            | `Studio.aim` places the camera on +X. The first draft used `z − cz`, which mirrors the side landmarks.                                                                        |
| k   | The judge input holds no Kim art                        | The judge sees `mom-panel.png`, Mom's lit front and side render beside Mom's drawing, and the numeric Kim ratios. The Kim panel exists only on the local PM sheet.                                                                                    | Decision 1 forbids Kim art to a third party. Mom's render may use the established look-judge routes.                                                                          |
| l   | The sheet uses the lit render                           | The sheet panels come from `views/front-level.png` and `views/side-level.png`. The flat render feeds the numbers only.                                                                                                                                | The sheet shows a person beside two drawings. An unlit vertex-colour figure does not compare with them.                                                                       |
| m   | The LATO.2 trial runs on our own VM                     | One Spot L4 in `asia-southeast1` on project `reading-advantage`, with a 3 hour VM cap and no hosted API and no public demo. The trial uses no fallback compute. If the Spot create fails, the task stops, cleans up, and reports, and the PM decides. | PM decision L caps the spend at USD 5, and decision 1 keeps Kim art off third-party services. The orchestrator withdrew a standard L4 fallback on 2026-11-23 after review r4. |

## Scope

- One new base module for Kim's adult proportions. It builds the skeleton, the head and face, the
  torso, the arms, the open hands with the palms toward the legs, the legs, and the feet. It holds
  Mom's rest pose and one `idle` clip. It exports the chin height and both hand landmarks.
- One new asset for Mom. It adds her identity: long brown waves, a knit sweater, jeans, brown flats,
  and small pearl studs.
- Two render options in the Forge CLI and the render page, with a behaviour pin.
- One measurement script, one measurement test, and one sheet-layout test.
- One review sheet script for the local sheet and the Mom-only judge panel.
- One independent look judge and its record.
- The skip marker on the scrapped contract tests, with the hero assertions kept active.
- One preset pin entry for the new asset.
- One LATO.2 GPU trial on our own VM, with its log and its result note.

## Exclusions

- No other character. Lily, Dad, Grandma, Grandpa, Tom, and the children stay untested on this base.
- No 900 px song cut-out and no idle or walk sprite. Phase 9 holds them behind the PM approval.
- No paid generation call, except the LATO.2 GPU trial of Phase 6 under the USD 5 cap (decision L).
  The track runs no Muse call, no mmx call, no hosted API call, and no public demo call. It sends no
  Kim art to a remote model, a hosted demo, or a third party. The approved own-VM LATO.2 trial is
  allowed (decision m), because the crop and the model both stay on our own VM.
- No edit of a scrapped source: `assets/sprout-*.ts`, `assets/parts/sprout-gestures.ts`, and the
  ADULT and AGE5 sets of `assets/parts/humanoid-kind.ts` stay byte for byte.
- No deletion. The scrapped outputs under `out/sprout-*/` stay.
- No change to the `hero` base, the avatar base, the avatar pack, or any shipped asset.
- No change to a game, a song page, the monorepo, or a shipped delivery folder.
- No skip of `tests/preset-colour.test.ts`, `tests/song-timeline.test.ts`, or the two Storytime spec
  tests that read the Pat render fixture.
- No Red commit of an asset, a script, or a `src/` file. A Red task holds `tests/` paths only.

## Measurement method

This section is the one definition of every measured value. AC2 and AC3 hold the tests to it.

### Inputs

1. `out/<asset>/flat/front-level.png` and `out/<asset>/flat/side-level.png`: 1024 × 1024 px, RGBA,
   transparent background, flat vertex colours.
2. `out/<asset>/views/front-level.png` and `out/<asset>/views/side-level.png`: 1024 × 1024 px, RGBA,
   transparent background, the normal lit render. The sheet uses these (decision l).
3. `out/<asset>/stats.json`: the model bounds.
4. `out/<asset>/<asset>.glb`: the skeleton joint nodes, the hand body vertices, and the hand body
   triangles in the rest pose.
5. `assets/<asset>.ts`: the `variants` table, for the skin and eye colours.
6. `assets/parts/humanoid-kim.ts`: the export `KIM_CHIN_Y: number` and the export
   `KIM_HANDS: { L: KimHand; R: KimHand }` with
   `KimHand = { palmCentre: readonly [number, number, number]; thumbTip: readonly [number, number, number]; fingerTip: readonly [number, number, number] }`.
   The points are in rest-pose world meters. `KIM_CHIN_Y` is the chin bottom on the centre plane,
   above the hip height.
   Why exports: the chin is the bottom of a blended chin shape, so a vertex minimum would pick the
   neck or the hair. The hand landmarks name the palm face and the thumb on a shape that has no
   bone for either.

### How the script loads its inputs

The script never imports the asset statically. The order is:

1. Parse the arguments.
2. Check that `assets/<name>.ts` and `out/<name>/<name>.glb` exist. A missing file exits 1 with
   `asset <name>: not built`, and names the missing path.
3. `await import('../assets/<name>.ts')` and read `variants` from its default export.
4. Check the asset module of the base (`assets/parts/humanoid-kim.ts`) and
   `await import('../assets/parts/humanoid-kim.ts')` for `KIM_CHIN_Y` and `KIM_HANDS`.
5. Read the two flat renders and the two lit renders, then measure.

Why: a static import of the base module fails to resolve before the module exists. The Red run must
report the named missing-asset error, not a module-resolution error.

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

### Evaluation order

The face and eye measures form a chain, never a cycle. Each step uses only the values of the earlier
steps. The script prints this order and each value in `measure.json` under `order`.

1. Read the flat front and side masks. A mask pixel has alpha 128 or more.
2. `crownRow` is the top row of the front mask, and `soleRow` is its bottom row.
3. `chinRow` is the projected `KIM_CHIN_Y`. `headHeight = chinRow − crownRow`. Fail
   `chin: not on the head` when the projected chin is not on the mask, or when its row is above
   `crownRow + 0.80·headHeight`.
4. `headWidth` is the widest front-mask row span over the rows from `crownRow` to
   `crownRow + 0.70·headHeight`. Why 0.70: the temples sit above the eye line at 0.62, and this band
   needs no eye value.
5. `eyeWindow`: the rows from `crownRow + 0.55·headHeight` to `crownRow + 0.80·headHeight`, and the
   columns from `W/2 − 0.5·headWidth` to `W/2 + 0.5·headWidth`.
6. The eye pixels are the dark pixels of the window. A dark pixel has alpha 250 or more, a
   largest-channel distance from the skin colour above 60 of 255, and a relative luminance under
   0.45. The skin colour is the first option of `variants.skin`, and the eye colour is the first
   option of `variants.eyes`.
7. An eye component is an 8-connected group of eye pixels inside the window. It qualifies when its
   width is 0.4 of its height or more, its width is 0.40 of `headWidth` or less, its area is 0.02 of
   the window area or more, and its centre column is within 0.35·`headWidth` of `W/2`. Why 0.02 of
   the window and not of the face: a face area would need the eyes.
8. Exactly two components must qualify. Another count fails with
   `eye components: found <n>, expected 2`. A component that touches the window edge fails with
   `eye component touches the window`. The left eye has the smaller centre column.
9. `eyeWidth` is the mean of the two bounding-box widths, `eyeHeight` the mean of the two
   bounding-box heights, `pupilRow` the mean of the two bounding-box centre rows, and `pupilSpacing`
   the distance between the two centre columns. `eyeRow = pupilRow`.
10. `faceSeed` is the point at the mean eye centre column and the row
    `eyeRow + 0.5·(chinRow − eyeRow)`.
11. `face` is the 8-connected skin component that holds the skin pixel nearest to the seed, searched
    down first and then up within `0.10·headHeight`. A skin pixel is a pixel with alpha 250 or more
    within 24 of 255 of the skin colour on every channel. A missing component fails with
    `face: no skin component near the seed`.
12. `faceArea` is the pixel count of the face component. `faceWidth` is its widest row span over the
    rows from `chinRow − 0.75·(chinRow − eyeRow)` to `chinRow`. A band with no face row fails with
    `face: empty width band`.

### Landmark sources

| Landmark                   | Source            | Rule                                                                                       |
| -------------------------- | ----------------- | ------------------------------------------------------------------------------------------ |
| crown, sole                | flat front pixels | the mask's top and bottom rows                                                             |
| chin                       | model             | `KIM_CHIN_Y`, projected                                                                    |
| head width                 | flat front pixels | step 4 of the evaluation order                                                             |
| eye marks                  | flat front pixels | steps 5 to 9                                                                               |
| face area, face width      | flat front pixels | steps 11 and 12                                                                            |
| shoulder, hip, knee, wrist | model             | the joint nodes `upperarm.L`, `leg.L`, `shin.L`, and `hand.L` of the GLB, in the rest pose |
| fingertip                  | model             | the lowest vertex of the `hands` body on the left side (x > 0)                             |

The page measures in image pixels with y down. This track keeps that sign. A point above the hip has
a negative reach value.

Head width includes the hair, as the page's rule does. Mom's waves stay close to the head at the eye
line for that reason. They flare below it.

### Projection

With the frame of decision (f), `ppm = size / H`, `W = H_px = size`, and the bounds centre
`(cx, cy, cz)`:

| View                      | Image column             | Image row                |
| ------------------------- | ------------------------ | ------------------------ |
| `front-level` (azimuth 0) | `u = (x − cx)·ppm + W/2` | `v = (cy − y)·ppm + H/2` |
| `side-level` (azimuth 90) | `u = (cz − z)·ppm + W/2` | `v = (cy − y)·ppm + H/2` |

`Studio.aim` puts the azimuth-90 camera at +X. It looks toward −X with +Y up, so image right is −Z.
Decision (j) records the sign. The guard is: on the side view, the frontmost mask column in the head
band is at least `0.02·ppm` left of `W/2`.

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

### The palm check API

The hand checks read the `hands` body of the GLB, the `KIM_HANDS` export, and the flat front view.
`scripts/proportion-check.mjs` exports one function for the palm side:

```js
export function palmCheck(side, mesh, landmarks)
```

- `side`: `'L'` or `'R'`.
- `mesh`: `{ positions, indices }`. `positions` is a `Float32Array` of xyz triples in rest-pose world
  meters, holding the vertices of one side of the `hands` body. `indices` is a `Uint32Array` of
  triangle indices into `positions`, in the GLB winding order.
- `landmarks`: `{ palmCentre, thumbTip, fingerTip }`, each a `[number, number, number]` in the same
  space, taken from `KIM_HANDS[side]`.

The return value is `{ ok: true, normal, sideDot, patchArea, agreement, palmContact, thumbContact, thumbOut, thumbForward }`,
or `{ ok: false, failure }` where `failure` is one of seven named strings. The checks run in this
fixed order, and the first failure returns:

1. `hand <side>: too few vertices`. Fires when `positions` holds fewer than 200 vertices, or when
   `indices.length` is not a positive multiple of 3.
2. `hand <side>: degenerate cloud`. Fires when the largest eigenvalue of the vertex covariance is
   below `1e-8` of the side's squared extent.
3. `hand <side>: palm patch: empty`. Fires when no triangle centre lies within 4 mm of the plane
   through `palmCentre` with normal `d` and within 0.03 m of `palmCentre`. Here
   `d = normalise(palmCentre − centroid)`. The 4 mm band is under one mesh cell, so a real palm
   surface always holds triangles in it.
4. `hand <side>: palm surface faces away from the declared normal`. Fires when `agreement < 0.90`.
   `agreement` is the area-weighted sum of the patch triangles' geometric normals, taken in the
   index order, dotted with `d`, then divided by `patchArea`.
5. `hand <side>: landmark off the surface`. Fires when the nearest vertex to `palmCentre` is over
   3 mm away, or the nearest vertex to `thumbTip` is over 5 mm away.
6. `hand <side>: thumb not on the radial front edge`. Fires when `thumbOut < 0.005` or
   `thumbForward < 0.010`, with `thumbOut = |thumbTip.x| − |palmCentre.x|` and
   `thumbForward = thumbTip.z − palmCentre.z`.
7. `hand <side>: palm faces away from the body`. Fires when `sideDot > −0.90` for the left hand or
   `sideDot < 0.90` for the right hand.

The script calls the function once per side and fails the figure with the returned name. The real
hand passes all seven checks. The hand depth is `max z − min z` of the side's vertices, in meters.

### The palm fixture and the three mutations

The palm cases use a synthetic left hand, built inside the test, at the pass geometry. The real hand
adds one case at T7 only, because the real hand needs the GLB.

The fixture is three boxes: a palm from x 0.150 to 0.190, y 0.450 to 0.520, z 0.030 to 0.090; a
thumb from x 0.170 to 0.190, y 0.495 to 0.505, z 0.090 to 0.115; and fingers from x 0.155 to 0.185,
y 0.430 to 0.450, z 0.035 to 0.085. Each box face is split into 16 × 16 quads with outward winding,
so the palm face has a vertex spacing of 0.0025 m and the fixture holds over 200 vertices. The
landmarks are `palmCentre = [0.150, ȳ, z̄]`, `thumbTip = [0.190, 0.500, 0.115]`, and
`fingerTip = [0.170, 0.430, 0.060]`, where `ȳ` and `z̄` are the vertex centroid's y and z. The x of
`palmCentre` sits on the palm face, so `d = normalise(palmCentre − centroid) = (−1, 0, 0)` exactly,
and the landmark contact is at most 1.8 mm.

The base fixture passes all seven checks: `sideDot = −1`, `agreement = +1`, `palmContact ≤ 1.8 mm`,
`thumbContact = 0`, `thumbOut = 0.040`, and `thumbForward = 0.115 − z̄ ≥ 0.025`, because `z̄` lies
between 0.030 and 0.090.

Each mutation passes that base to `palmCheck('L', mesh, landmarks)`. The table gives the first
failure in the check order of "The palm check API", with the arithmetic on the fixture:

| Mutation        | Change                                                                                                                                    | Check 4                                                      | Check 6                                            | Check 7                                  | First failure                                               |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| Flipped winding | reverse the index order of every palm-patch triangle                                                                                      | `agreement = −1`                                             | unchanged, passes                                  | unchanged, passes                        | check 4, `palm surface faces away from the declared normal` |
| Mirrored hand   | mirror `positions` and the landmarks about x, and reverse the index order of every mirrored triangle                                      | `+1`, because the reversed winding keeps the outward normals | `thumbOut = 0.040`, `thumbForward ≥ 0.025`, passes | `d = (+1, 0, 0)`, `sideDot = +1 > −0.90` | check 7, `palm faces away from the body`                    |
| Turned hand     | rotate `positions` and the landmarks 180 degrees about the axis through `palmCentre` along `fingerTip − palmCentre`, and keep the indices | `+1`, a rotation keeps the winding                           | `thumbForward = z̄ − 0.115 ≤ −0.025 < 0.010`        | reached only after check 6               | check 6, `thumb not on the radial front edge`               |

Checks 1 to 3 and 5 pass in all three rows: the vertex count, the spread, the patch set, and the
contact distances do not change. Check 5 holds because the landmarks move with the geometry. Each
row therefore has one named failure, and no earlier check fires by accident.

Why the mirrored row reverses the indices: a reflection flips the geometric normal of a triangle
that keeps its index order, and check 4 would then fire before check 7. Reversing the mirrored
triangles restores the outward normals, so only the palm direction fails.

### The front hand edge

1. The hand band covers the front rows from `v_wrist + 0.1·(v_tip − v_wrist)` to
   `v_tip − 0.1·(v_tip − v_wrist)`, where `v_wrist` and `v_tip` are the projected wrist row and the
   projected fingertip row. The 10 % cut keeps the sleeve and the fingertip out of the band.
2. The leg column window of a side spans `[min(u_hip, u_ankle) − 0.03·ppm, max(u_hip, u_ankle) + 0.03·ppm]`,
   where `u_hip` and `u_ankle` are the projected hip and ankle columns of that side. The legs have a
   gap at the centre column, so the centre column never names a leg.
3. In a band row, the runs are the horizontal runs of the mask. The leg run is the run that holds
   the centre column of the leg window. A row with no such run is recorded as `row <v>: no leg run`.
4. The hand run on the left is the widest run whose start is right of the leg run's end and whose
   centre is right of `u_hip + 0.02·ppm`. The right side mirrors the rule. A row with no such run is
   recorded as `row <v>: no hand run`.
5. A row counts when it holds both runs. The figure fails when under 80 % of the band rows count,
   with `hand <side>: separated rows under 80 % (<n> of <m>)`. A single row never fails the figure by
   itself; it is named in the record.
6. The gap of a counted row is the hand run's start minus the leg run's end. The smallest gap must be
   2 px or more, or the check fails with `hand <side>: gap <g> px under 2 px at row <v>`.
7. The front width is the median of the hand run widths over the counted rows. The pass is
   `frontWidth ≤ 0.60 · handDepth · ppm`, and a failure is
   `hand <side>: front width <w> px over <limit> px`.
8. Why the depth comes from the model: a hanging hand overlaps the thigh in the side view, and the
   forearm row touches the sleeve, so no pixel row separates either.

### Derived targets

The table fixes the shape. These targets follow from a height of 1.500 m, Kim's ratios, and an
explicit horizontal reach of 0.045 m (the page's 33 px at the 1.5 m scale). Green starts from them,
and the check decides the result.

| Item                          | Target                                                      |
| ----------------------------- | ----------------------------------------------------------- |
| head height                   | 0.412 m (1.500 / 3.64)                                      |
| crown, chin                   | 1.500 m, 1.088 m                                            |
| hip                           | 0.585 m (leg share .39)                                     |
| knee                          | 0.324 m (hip-to-knee 0.261 m, the page's 190 / 1093)        |
| wrist                         | 0.569 m (hip − .06 · 0.261)                                 |
| fingertip                     | 0.452 m (hip − .51 · 0.261)                                 |
| horizontal reach, fingertip x | 0.045 m, 0.188 m (shoulder x + 0.045)                       |
| torso height, shoulder        | 0.4087 m, 0.9937 m (from 0.045² + (T + 0.133)² = (1.33·T)²) |
| arm                           | 0.5436 m (1.33 · 0.4087)                                    |
| head width, half width        | 0.341 m, 0.170 m (the page's 248/300 of the head height)    |
| shoulder half width           | 0.143 m (head width / 1.19)                                 |
| face width                    | 0.278 m (the page's 202/248 of the head width)              |
| eye width                     | 0.064 m (.23 · face width)                                  |
| eye spacing                   | 0.130 m (.38 · head width and .47 · face width agree)       |
| eye height                    | 0.045 m (.11 · head height)                                 |
| eye line                      | 1.245 m (crown − .62 · head height)                         |

### Render commands

```bash
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none --size 1024
```

The first command writes `out/sprout-mom-kim/flat/`. The second writes
`out/sprout-mom-kim/views/`. The two output folders are separate, because a render run clears
`views/`.

## The LATO.2 GPU trial

Phase 6 holds the trial. It runs alongside the SDF shape work, and its result feeds the PM decision.
It does not replace the SDF base, and the pass table of this track stays the SDF acceptance.

1. One Spot L4 in `asia-southeast1` on project `reading-advantage`. The trial uses no fallback
   compute: a failed Spot create stops the task, cleans up, and reports, and the PM decides. The
   orchestrator withdrew a standard L4 fallback on 2026-11-23 after review r4. VM time has a hard
   cap of 3 hours.
2. One Kim full-body front crop. It runs on our own VM only. The weights download to the VM, and the
   trial calls no hosted API and no public demo.
3. The five steps are: create one VM and one temporary boot disk; set up the pinned dependencies and
   the weights; run one image-to-mesh inference on the crop; copy the mesh out and confirm the copy
   opens; delete the VM and the disk in the same session, then verify both are gone.
4. Steps 3 to 5 run even after a failure. The delete and the verify run in the same session as the
   create.
5. Each step writes its start time, its end time, and a bill estimate in USD to
   `out/chibi-sprouts/redesign/lato2-gpu/trial-log.tsv`, with the header
   `step\tstart\tend\tminutes\testimate_usd\tnote`.
6. The outputs are the mesh, a front render and a side render beside Kim, the body rows of the pass
   table, and `measure/runs/chibi_sprouts_redesign_20261123/lato2-gpu/trial-result.md`. The face rows
   are not measurable, because the mesh has no texture, and the note says so.
7. The trial writes no file in the monorepo, in the scrapped sources, or in a delivery folder.
8. No image tool runs in this phase.

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
   names, the four skipped titles, and the three reason comments.

### AC2: the proportion check

1. `scripts/proportion-check.mjs` measures one asset from the inputs of the measurement method and
   writes `out/chibi-sprouts/redesign/measure.json`. The record holds the loading order, each value
   of the evaluation order, each row with its value and its range, the image size, `ppm`, both render
   paths, the SHA-256 of each render, and the lit rows under `rows.lit`. The script exports
   `checkRows(rows)`, `palmCheck(side, mesh, landmarks)`, and `measurePixels()`.
2. The script prints one line per row: `row value target±tolerance pass`. It exits 0 when every row
   passes and every guard holds. It exits 1 and prints `FAIL <row>: <value> not in <lo>..<hi>` for
   each failing row, and `GUARD <name>: <detail>` for each failing guard. A missing asset exits 1
   with `asset <name>: not built`, before any import of the asset or the base module.
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
   outside its range, for each of the eleven rows.
7. Breakage proof two, the pixels: `measurePixels()` runs five synthetic figures in a temporary
   folder, with independent mutations:
   - the pass figure holds the pass geometry and must pass every row,
   - a crown 15 % higher, with the same chin and eye rows, fails `heightInHeads`,
   - a sole 10 % lower, with the same model landmarks, fails `legShare`,
   - a head 12 % wider at the temples, with the same shoulder span, fails `headToShoulders`,
   - two eyes merged into one dark blob fail with `eye components: found 1, expected 2`. The
     mutation draws the two eyes with their centres 0.060 m apart and an eye width of 0.064 m, so
     the union is one blob 0.124 m wide. The pass figure's head width is 0.341 m, so the blob is
     0.364 of head width, under the 0.40 limit of evaluation step 7. Its height is 0.045 m, its area
     is 0.16 of the window, and its centre sits at `W/2`, so it is the one qualifying component. A
     merge at the pass spacing of 0.130 m would be 0.194 m wide, over the limit, and would be
     rejected. The mutation uses the closer spacing for that reason.
8. The check needs no paid call and no network. It reads local files only.

### AC3: the palms face the legs

1. The new base builds both hands as one body named `hands`, with a left half at x > 0, and exports
   `KIM_HANDS` with `palmCentre`, `thumbTip`, and `fingerTip` for each side.
2. `scripts/proportion-check.mjs` exports `palmCheck(side, mesh, landmarks)` per "The palm check
   API", and calls it once per side on the GLB's `hands` triangles and the `KIM_HANDS` landmarks.
3. The real left hand and the real right hand pass all seven checks at T7, when the GLB exists. The
   palm cases of T6 run on the synthetic fixture of "The palm fixture and the three mutations". A
   side with too few vertices, a degenerate cloud, an empty palm patch, a landmark off the surface,
   or a wrong thumb or palm direction fails with its named error, in the order of "The palm check
   API".
4. The front flat view shows each hand as a separate run with a 2 px gap over 80 % of the band rows,
   and the hand front width is 0.60 of the hand depth times `ppm` or less, per "The front hand edge".
   A row without a run is named in the record and does not fail the figure on its own.
5. The side view shows the thumbs forward and the backs of the hands out. The review sheet records
   both, and the look judge of AC4 rates the palms.
6. The three mutations of "The palm fixture and the three mutations" run on the synthetic fixture and
   each produce exactly one named failure:
   - flipped winding gives `hand L: palm surface faces away from the declared normal` (check 4),
   - a mirrored hand with mirrored landmarks and reversed mirrored indices gives
     `hand L: palm faces away from the body` (check 7),
   - a hand turned 180 degrees about its finger axis gives
     `hand L: thumb not on the radial front edge` (check 6).
     The test asserts that name and no other.

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
7. The judge route is an established look-judge route, as in the earlier sprout looks. Mom's render
   and Daniel's drawing may use it. A Kim image may not. If the PM later demands a local-only judge,
   T10 stops and reports.

### AC5: the review sheet

1. `scripts/mom-kim-sheet.mjs` writes `out/chibi-sprouts/redesign/mom-kim-review.png` and
   `out/chibi-sprouts/redesign/mom-panel.png`.
2. The sheet has two rows. Row one is Kim's front panel, the Mom front render, and Mom's drawing.
   Row two is Kim's side panel, the Mom side render, and the text `no side drawing`.
3. Both renders are the lit views `views/front-level.png` and `views/side-level.png` (decision l).
4. Row sources, pinned:
   - the two render rows come from the lit masks (alpha 128 or more) of the two lit views, written in
     `measure.json` under `rows.lit`,
   - Kim's reference rows are the page's 102 and 1195. The script scans Kim's side panel with the
     background scan and requires its measured rows within 4 px of those. Both Kim panels then use
     the page's pair,
   - Mom's reference rows are the page's 71 and 1528, from her one drawing. The script runs no
     background scan on a Mom side drawing, because there is none. The Mom side cell holds the side
     render only, and the third cell holds the text.
5. Every panel is scaled so the crown-to-sole height is 700 px, and every sole sits on the same
   baseline.
6. The caption strip holds the asset name, the date, the pass table result, and the Green model id.
7. The Kim panels stay local. The Mom panel may go to an approved look-judge route only. No route
   sends a Kim panel anywhere. T11 hands the path to the PM, and the upload to Daniel waits for the
   PM's word.

### AC6: the stop

1. Phase 9 holds the cut-out and the sprite as `deferred:pm` tasks. They start only after the PM
   approves the shape at T12.
2. Before the approval, no cut-out exists for the new base and no sprite exists for the new base.
3. Those tasks start only by an amendment. The amendment adds the walk clip source as its own Red
   task and its own Green task, because T7 builds the `idle` clip only. The idle sprite sample does
   not need the walk clip.

### AC7: the LATO.2 GPU trial

1. The trial follows the eight rules of "The LATO.2 GPU trial" and holds the USD 5 approval of
   decision L.
2. `out/chibi-sprouts/redesign/lato2-gpu/trial-log.tsv` holds the header
   `step\tstart\tend\tminutes\testimate_usd\tnote` and one row per step.
3. The delete and the verify are recorded, and the log shows the VM and disk absent.
4. `measure/runs/chibi_sprouts_redesign_20261123/lato2-gpu/trial-result.md` holds the mesh result,
   the front and side render paths, the body rows of the pass table, and the note that the face rows
   are not measurable.
5. The result feeds the PM decision at T12. It does not replace the SDF base, and it changes no row
   of the SDF pass table.

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
- [The spec review of r2](../../runs/chibi_sprouts_redesign_20261123/spec-review-80ff571.json)
- [The LATO.2 README](https://github.com/LoHhhha/LATO.2)

## Scope control

This track adds two asset modules, one measurement script, one sheet script, three test files, two
render options, and one GPU trial. It changes the three scrapped test files, the preset pin, the
Forge CLI, and the render page. It changes no scrapped source, no shipped asset, no game, no song
page, no monorepo file, and no delivery folder. It sends no Kim art to a remote model, a hosted
demo, or a third party, and it deletes nothing.
