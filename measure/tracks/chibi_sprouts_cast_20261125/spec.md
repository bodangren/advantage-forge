# Chibi Sprouts cast on the Kim base: Dad, Grandma, Grandpa, Tom and Lily

## Purpose

Five Chibi Sprouts release 1 cast members remain. They are Dad, Grandma and Grandpa on the approved
adult base, and Tom and Lily on a new child base.

The independent look judge scored Mom at identity 7.5 and proportion 8.5 and returned a pass
(`measure/runs/chibi_sprouts_redesign_20261123/judge.json`). The PM stopped on her shape at T12 of
the redesign plan and approved it. Mom is the shape reference for the three adults. The later Phase 9
record `judge-p9-bf4158a.json` covers her cut-out and her sprite only. It is not the shape approval
and nothing here cites it as one.

This track finishes the five characters. It adds one proportion pin and one independent look judge
for each character. It adds no cut-out, no sprite, no song, and no game skin.

**No customer-facing claim is made.** The track publishes no page, post, deck, video, or email. The
five assets and their panels stay internal. The PM decides any external use. Daniel's look gate
stays open.

## Context

- `QUEUE.md` item 3 asks for the rest of the release 1 cast.
- The adult base is `assets/parts/humanoid-kim.ts`. Mom is `assets/sprout-mom-kim.ts`. Both merged
  as `7478b2af`.
- Mom's shape approval is `measure/runs/chibi_sprouts_redesign_20261123/judge.json` (identity 7.5,
  proportion 8.5, verdict pass), recorded at redesign plan T10. The PM approved the shape at
  redesign plan T12. The shape record's `model_id` is `opencode/nemotron-3.5-super-vl-free`,
  family nvidia. The later Phase 9 record names the new fixed route.
- The later record `judge-p9-bf4158a.json` covers the Phase 9 cut-out and the idle sprite. It records
  identity 8 and proportion 7.5 per export. It does not record the shape judgment.
- The design page is `docs/chibi-sprouts/redesign-2026-11-23.md` (approved 2026-11-23). It holds
  the Kim ratios, the drawing pixel rows, and the direction line for each character.
- The five drawings are `docs/sprout-mockups/dad.jpg`, `grandma.jpg`, `grandpa.jpg`, `tom.jpg`, and
  `lily.jpg`. Each is 1600 × 1600 px.
- The page says: use Kim's ratios for the adults, and the drawing ratios for the children with
  Kim's eye-size cap.
- The scrapped base and its models stay in git and are untouched. The new files use a different
  name for that reason.
- `out/` is not in git. A fresh checkout holds no Mom GLB, no stats, and no level render. T0
  prepares them in the worktree `out/` before any pin runs. See "The output tree".
- The PM rule of 2026-11-25 asks for the lightest gates the risk allows.
- Every render and every test run uses the heavy runner:
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
- A textured Forge command takes one of the two machine build slots. Shape iteration uses `--fast`.
- The current measurement method is in the redesign spec
  (`measure/archive/chibi_sprouts_redesign_20261123/spec.md`, "Measurement method"). This track
  extends it. It changes no scrapped file.

## Standing rules

- No role calls the `openchamber_image` tool. It costs money. A role reads an image with `read`.
- No paid generation call runs. The track uses no Muse call, no mmx call, and no hosted API, with one
  exception: the approved look judge of decisions (j) and (k). The judge is the sole hosted call
  this track makes.
- Only the judge inputs of decision (k) leave the worktree: the character panel
  `out/chibi-sprouts/cast/<name>-panel.png` and the brief text. Nothing else leaves, and the
  drawings stay local except inside that panel.
- The five drawings may go to the approved look-judge route. They go to no other service.
- The Kim sheet goes nowhere. The Kim sheet is not a judge input.
- No role edits a scrapped source. The scrapped sources are `assets/sprout-*.ts` and
  `assets/parts/sprout-gestures.ts`.
- No role deletes a source file, a committed file, or a production file. This rule does not forbid
  a routine replacement of generated output inside the worktree `out/` tree. `./forge render`
  replaces its own `views/` and `flat/` folders, `./forge build` replaces its own `textures/`
  folder, and the panel script replaces its own panels and sheet. These are internal generator
  steps, not deletions.
- No role touches a production `out/` path outside its own worktree. A probe or a fixture stays in
  the worktree or under `/tmp`.
- A paid call, or a forbidden upload, is a stop-and-report event. The role keeps every file and
  reports to the PM.

## Authoring decisions

These decisions are fixed here. Green decides nothing.

| #   | Decision                   | Rule                                                                                                                                                                                                                                                                                                                                                              | Why                                                                                                                                               |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | Asset names                | `sprout-dad-kim`, `sprout-grandma-kim`, `sprout-grandpa-kim`, `sprout-tom-kim`, `sprout-lily-kim`, in `assets/<name>.ts`. The child base is `assets/parts/humanoid-kim-child.ts`.                                                                                                                                                                                 | The `-kim` suffix records the base family, as `sprout-mom-kim` does. The scrapped files stay untouched.                                           |
| b   | Adults use the adult base  | Each adult asset imports `buildKim` and `KIM` from `assets/parts/humanoid-kim.ts`. The base module does not change, except for the three aliases of decision (d). The face difference is a face layer in the asset, per "The face layer and the paint".                                                                                                           | Mom passed on this base. A second adult base adds risk for no gain.                                                                               |
| c   | Child base                 | One base module for Tom and Lily. It holds the skeleton, the head and face, the torso, the arms, the open hands with the palms toward the legs, the legs, the feet, and one `idle` clip. It uses the child derived targets of "The child base".                                                                                                                   | The two drawings share one body shape. One base keeps the pair consistent.                                                                        |
| d   | The measured-base contract | Every base module exports `BASE_CROWN_Y`, `BASE_CHIN_Y`, and `BASE_HANDS`. `assets/parts/humanoid-kim.ts` adds the three names as aliases of `KIM.crown`, `KIM_CHIN_Y`, and `KIM_HANDS`. The `KIM_*` names stay. The child base also exports `BASE_JOINTS`, a bone-name map of rest-pose joints; the adult base adds no fourth name.                                                                                                       | A bun or a hat must not move the measured head. The crown is a model landmark, as the chin already is. The child joint seam lets a test check a fixed joint without a private import. |
| e   | Measurement options        | `scripts/proportion-check.mjs` takes `--base <stem>` (default `humanoid-kim`), `--table <name>` (default `kim`), and `--record <path>` (default `out/chibi-sprouts/redesign/measure.json`). The base path is `assets/parts/<stem>.ts`.                                                                                                                            | The child base and the child table need a named route. The record path is per asset. The defaults keep the Mom command and the Mom pin unchanged. |
| f   | The tables                 | `TABLES` is an object of named, ordered arrays of `{ name, lo, hi }`: `kim` and `child`. The selected table is authoritative: it decides every range and the row order. `checkRows(rows, table = 'kim')` keeps its current default. The script exports `TABLES`.                                                                                                  | The four adults pass the page's Kim rows. The two children pass their own drawing rows. A range in a row must never override the table.           |
| g   | The crown source           | `heightInHeads`, `legShare`, `eyeLine`, `eyeHeight`, the head-width band, and the eye window use the projected `BASE_CROWN_Y` row, rounded to the nearest pixel. The mask top may sit above the projected crown by any amount. It may not sit more than 2 px below it.                                                                                            | The page's rule excludes buns and loose hair tips. Grandma's bun sits above her skull.                                                            |
| h   | The palm rule              | Every asset's rest pose keeps the palms toward the legs and the thumbs forward. The palm check of the redesign spec runs on both hands of every asset.                                                                                                                                                                                                            | The owner named forward palms as a fault.                                                                                                         |
| i   | Per-character pin          | Each asset gets one test file `tests/<name>.test.ts`. It runs the script on the asset and the table of its group. It requires exit 0, the eleven rows of the named table in table order, each value inside the named table's range, row limits equal to the table, and both palms ok.                                                                             | One pin per character is the proportion acceptance. A row's own limits are not evidence.                                                          |
| j   | Look judge route           | The judge route is `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia. The route is not muse, not hy4, and not OpenAI. The judge family differs from the Red family and the Green family. A separate role on a shared family is not an independent judge. A missing route waits; the track does not substitute.                                       | This route passed Mom. The PM rule names it. A same-family judge can repeat a same-family error.                                                  |
| k   | Judge input                | Each panel holds the character's lit front render, its lit side render, and its drawing at one 700 px scale. The judge brief holds the eleven rows as text. No Kim sheet, no Mom panel, and no LATO.2 image is an input. The panel PNG is the only file that leaves the worktree.                                                                                    | The judge must see the character, not the reference sheet.                                                                                        |
| l   | Judge scores               | The judge rates identity and proportion out of 10. Both scores are 7.5 or more. A lower score returns the phase to Green with the comment as the work list. A verdict binds to one asset revision, one base revision, one record hash, one render set, and one panel hash. At most two judge rounds run per character. A second round runs only after a failing score or after a changed input voids the first verdict; a passing asset with unchanged inputs gets one judgment. A second failure, a third round, or a route that is still absent at the phase gate escalates to the PM. | This is the Mom pass line and the owner bar for characters. An unbound score proves nothing about the final bytes.                                |
| m   | Panels and sheet           | `scripts/sprout-cast-panel.mjs` writes one panel per character at `out/chibi-sprouts/cast/<name>-panel.png` and one cast sheet at `out/chibi-sprouts/cast/cast-sheet.png`. It reads local files only. It copies the `maskSpan` and `textSvg` conventions of `scripts/mom-kim-sheet.mjs`, maps a panel cell by clamped nearest-neighbour sampling, and imports nothing from it. A literal `sharp.extract` takes a negative top on Dad's crown row 80, which sits above 8 % of the band, and throws; the mean difference to the extract-plus-resize path is 1.6 of 255. It takes `--asset`, `--all`, `--sheet`, `--date`, and `--root`. `--sheet` writes the sheet alone and no panel. It refuses a linked or outside destination before any write. | The PM needs one panel per character and one sheet. The sheet must be writable at Phase 4 without a new panel date or a voided judge record.     |
| n   | Drawing rows               | The panel scales each drawing by the page's pixel pair: Dad 80–1525, Grandma 143–1520, Grandpa 83–1520, Tom 87–1521, Lily 83–1522. The crop keeps 8 % of the band above the crown, so a bun stays visible above the band.                                                                                                                                         | The page measured these rows. A background scan would catch the cast shadow.                                                                      |
| o   | Gates                      | One phase per group. No Review A, B, or C. One adversarial round runs in Phase 1, because two scripts change. Phase 2 starts only after a passing adversarial verdict with every blocking finding closed. No other phase runs an adversarial round.                                                                                                               | The PM rule of 2026-11-25 asks for the lightest gates. A failed round must not read as a passed gate.                                             |
| p   | Identity source            | The drawing is the identity source. The page's direction line names the main features. Green adds no feature that the drawing does not show.                                                                                                                                                                                                                      | The owner rejected a model that did not look like its drawing.                                                                                    |
| q   | Face layer and paint       | The adult base head does not change. Each adult asset adds one face layer body over it, recreates the eye paint on that layer, and paints the face there. A silhouette difference is a separate skin body. Mom declares no face layer and no `castMeta`. The rules are in "The face layer and the paint".                                                                 | The base holds one private head with one smile and one jaw. The identities need a defined route that leaves Mom alone.                          |
| r   | Build and render sequence  | One `./forge build <name> --fast`, then the flat level render, then the lit level render. No `./forge all`. The pin, the panel, and the judge read that one build and those images.                                                                                                                                                                               | `./forge all` clears `views/`, renders the default turnaround, and generates sprites. It would break both the order and the no-sprite scope.      |
| s   | Output tree                | `out/` is the worktree's own isolated tree. T0 prepares the Mom inputs there. Each Green task prepares its own asset before its pin. A fixture stays under `/tmp` or under `--root`.                                                                                                                                                                              | The outputs are not in git. A fresh worktree cannot pass from committed files alone.                                                              |
| t   | Closeout path              | `metadata.json` holds `"lane": "light"`. The Phase 4 gate is the track acceptance record. The orchestrator reads the lane, records the final-acceptance exception, and runs the closeout role after T19. No separate final-acceptance role runs.                                                                                                                  | A light-lane track closes on its phase gates and the PM word, not on a second acceptance pass.                                                    |

## The measured-base contract

This section extends the redesign spec. It changes six parts.

### The exports

A base module exports `BASE_CROWN_Y` and `BASE_CHIN_Y` (rest-pose world meters on the centre plane)
and `BASE_HANDS` (`{ L: Hand; R: Hand }` with `palmCentre`, `thumbTip`, and `fingerTip`). `Hand` is
the `KimHand` type of the redesign spec.

### The crown, the rounding, and the mask guards

1. The script projects the crown and rounds the row to the nearest whole pixel:
   `projectedCrownRow = Math.round(projFront([0, BASE_CROWN_Y, 0])[1])`. It rounds the projected
   sole row the same way, into `projectedSoleRow`. The renderer projects fractional pixels, so the
   rounding rule is part of the contract.
2. `heightInHeads`, `legShare`, `eyeLine`, `eyeHeight`, the head-width band, and the eye window use
   `projectedCrownRow`. They never use the mask top. `headHeight = chinRow - projectedCrownRow`.
3. The mask top stays in the field `detail.crownRow`, with its current meaning. The mask-top guard is
   one-sided. The mask top may sit above `projectedCrownRow` by any amount. It may not sit more than
   2 px below it. A failure prints `GUARD top on mask: <maskTop> vs <projectedCrownRow>`.
4. The sole guards are: the front mask bottom is within 2 px of the projected sole row; the side
   mask bottom is within 2 px of the same row; the two flat views' crown-to-sole heights differ by
   2 px or less.
5. The side mask crown is not a head measurement. The side mask top must be at or above
   `projectedCrownRow + 2`.
6. The chin row is above the hip row. The eye row is above the chin row. The side sign guard is
   unchanged.
7. The five landmark checks do not change: shoulder, hip, tip, wristAtTip, and kneeAtHip each sit on
   a mask pixel or on one of its eight neighbours.

### The tables

`TABLES` is an object of named, ordered arrays. Each row is `{ name, lo, hi }`.

```js
TABLES = {
  kim: [{ name: 'heightInHeads', lo: 3.54, hi: 3.74 } /* ... eleven rows, "The adult table" order */],
  child: [{ name: 'heightInHeads', lo: 2.79, hi: 3.03 } /* ... eleven rows, "The child table" order */],
};
```

1. The selected table is authoritative. `checkRows(rows, table = 'kim')` reads the ranges from
   `TABLES[table]` in table order. It never uses a row's own range for the pass decision.
2. A row's `lo` and `hi` must equal the table's pair. A different pair fails with
   `FAIL <name>: row limits <lo>..<hi> disagree with table <table>`. This catches a row that carries
   its own loose limits.
3. The row set must equal the table's names. A missing, duplicate, or unknown row fails with the
   existing `checkRows: ...` lines.
4. An unknown or empty `--table` value exits 1 with `unknown table <name>: known kim, child`.
5. The selected table decides. `heightInHeads = 3.00` passes `child` and fails `kim`. `3.60` passes
   `kim` and fails `child`. The tests pin both directions. A row with a wrong `lo` and `hi` fails even
   when its value sits inside its own limits.
6. An invalid option value exits 1 before any output. No record is written and no directory is
   created.

### The record

`--record <path>` writes one JSON record. The default is `out/chibi-sprouts/redesign/measure.json`,
so the Mom command and the Mom pin do not change. The shape is fixed:

- Top-level keys: `asset`, `base`, `baseSha256`, `order`, `rows`, `imageSize`, `ppm`, `ppmSource`,
  `glb`, `glbSha256`, `flatFront`, `flatSide`, `litFront`, `litSide`, `flatFrontSha256`,
  `flatSideSha256`, `litFrontSha256`, `litSideSha256`, `detail`, `guards`, `handEdge`, `sideSign`,
  `palms`.
- `base` is the base stem, and `baseSha256` is the SHA-256 of `assets/parts/<base>.ts`. The four
  render hashes and `glbSha256` are taken after the lit render (spec "Build and render sequence"),
  so the record binds the final GLB, the final stats, and the final render set.
- `faceMarks` is present only when the asset's `castMeta` declares one. It copies the declared
  object, so the record shows the colour the eye mask used.
- `rows` holds exactly twelve keys: the eleven row names in table order, plus `lit`. Each of the
  eleven is `{ value, lo, hi, pass }`, with `lo` and `hi` copied from the selected table.
- `rows.lit` is not a numeric row. It holds `front: { crown, sole, height }` and
  `side: { crown, sole, height }`, as today.
- `detail` holds the current fields plus `projectedCrownRow` and `projectedSoleRow` (numbers in the
  flat front pixel space). `detail.crownRow` keeps its current meaning: the mask top. No
  `detail.maskTop` field exists or is added. Every mask-top reader uses `detail.crownRow`, and every
  projected-crown reader uses `detail.projectedCrownRow`. The panel script reads
  `projectedCrownRow`, `projectedSoleRow`, and `soleRow`. It reads no mask to infer them.
- The record keeps the current field names. `flatFrontSha256` and `flatSideSha256` stay, and the two
  new hashes use the same shape.
- A row with a non-numeric value fails as today (`FAIL <name>: not a number`).

### The destinations

Every write resolves under the repository root, or under `--root` for the panel script. Before it
writes or creates a directory, the script checks the destination and every existing parent:

1. The resolved destination is inside the permitted tree: `<root>/out/` for a record,
   `<root>/out/chibi-sprouts/cast/` for a panel or the sheet. Otherwise it exits 1 with
   `destination outside <tree>: <path>`.
2. Every existing parent directory and the existing destination file must be a real directory or a
   real file. The check uses `lstat`, never `stat`, so it never follows a link. A link exits 1 with
   `destination is a link: <rel>`. A destination that is a directory exits 1 with
   `destination is a directory: <rel>`.
3. The checks run before the first `mkdir` or write. A rejected destination writes nothing and
   leaves every existing file byte-identical. A test hashes the tree before and after to prove it.
4. Each error is one line. No stack trace is printed.

The measure script applies rules 1 to 4 to `--record`, with `out/` as the tree. The panel script
applies rules 1 to 4 to the cast folder, the sheet, and every panel.

### The landmark checks and fixtures

The script keeps its loading order. It parses the arguments, checks the asset and the base files,
imports both, then reads the renders. A missing file exits 1 with `asset <name>: not built` or
`base <stem>: not built`, before any import.

An invalid base stem (empty, absolute, a path separator, or a dot-dot segment) exits 1 with
`unknown base <stem>`. An absent base file exits 1 with `base <stem>: not built` and names the path.
A missing render exits 1 with `render <view>: not built` and names the asset.

`measureFigure(figure)` reads `projectedTop`, `projectedSole`, `chinRow`, and the landmarks from the
caller. It does not scan a projection from a mask. Red builds each fixture with explicit numbers, so
a fixture moves the projection, the mask, or both, one at a time. The script exports
`measureFigure` for the test seam, and the fixture field names stay `projectedTop`,
`projectedSole`, `chinRow`, and `landmarks`.

The existing fixture API does not change. `measurePixels()` keeps exactly its five figures of the
redesign spec: `pass`, `crown-high`, `sole-low`, `wide-head`, and `merged-eyes`, with the same
numbers, the same `params`, and the same results. It returns no sixth item, because
`tests/sprout-mom-kim.test.ts:305` asserts the exact five names in order. The two new fixtures are
explicit figure objects that `tests/proportion-cast-options.test.ts` builds and passes to the
exported `measureFigure`:

1. `bun-above-crown`: the mask top is 24 px above the rounded projected crown. Every row passes, and
   `headHeight` equals `chinRow - projectedCrownRow`, not `chinRow - detail.crownRow`. This proves
   that a bun does not shrink the head.
2. `wrong-crown`: the projected crown row is 20 px above the mask top. The run fails with
   `GUARD top on mask`. This proves that a hidden skull fails.

## The child base

The child base starts from Tom's drawing rows at a height of 1.050 m. The page's Tom rows are
crown 87, chin 583, sole 1521, head width 501, face width 325, pupil row 408, pupil spacing 157,
eye width 73, eye height 69, shoulder span 233, shoulder row 670, hip row 1042, knee row 1228,
wrist row 1019, fingertip row 1122, and horizontal reach 73 px.

The scale is 1.050 m over 1434 px. The derived targets are:

| Item                        | Target           |
| --------------------------- | ---------------- |
| height, crown               | 1.050 m          |
| chin                        | 0.687 m          |
| head height                 | 0.363 m          |
| head width, half width      | 0.367 m, 0.183 m |
| face width                  | 0.238 m          |
| eye line                    | 0.815 m          |
| eye width, eye height       | 0.053 m, 0.051 m |
| eye spacing                 | 0.115 m          |
| shoulder height, half width | 0.623 m, 0.085 m |
| hip, knee                   | 0.351 m, 0.214 m |
| wrist                       | 0.368 m          |
| fingertip, fingertip x      | 0.292 m, 0.139 m |
| ankle                       | 0.035 m          |

### The landmarks and the tolerances

Two kinds of number decide the child base. The first kind is fixed in the module. The second kind
is measured in the flat front render.

| Kind        | Number                           | Fixed value      | Tolerance                                  |
| ----------- | -------------------------------- | ---------------- | ------------------------------------------ |
| fixed model | `BASE_CROWN_Y`                   | 1.050 m          | ± 0.002 m                                  |
| fixed model | `BASE_CHIN_Y`                    | 0.687 m          | ± 0.002 m                                  |
| fixed model | shoulder joint `upperarm.L` y    | 0.623 m          | ± 0.005 m                                  |
| fixed model | hip joint `leg.L` y              | 0.351 m          | ± 0.005 m                                  |
| fixed model | knee joint `shin.L` y            | 0.214 m          | ± 0.005 m                                  |
| fixed model | wrist joint `hand.L` y           | 0.368 m          | ± 0.005 m                                  |
| fixed model | ankle joint `foot.L` y           | 0.035 m          | ± 0.005 m                                  |
| fixed model | fingertip landmark y, x          | 0.292 m, 0.139 m | ± 0.005 m                                  |
| measured    | mask top                         | —                | at most `projectedCrownRow` + 2 px         |
| measured    | sole row                         | —                | ± 2 px of `projectedSoleRow`               |
| measured    | eye rows, head width, face width | —                | the guards of "The measured-base contract" |
| ratio       | the eleven rows                  | —                | the selected table                         |

The 1.050 m crown is a base landmark. A hair style may rise above it, so the asset's silhouette
height is not a pin. The eleven ratios and the absolute pin are separate checks.

The bone, clip, and body inventory is fixed. The skeleton holds exactly 17 bones: the five central
bones `hips`, `spine`, `chest`, `neck`, and `head`, and the six pairs `upperarm.L/R`, `forearm.L/R`,
`hand.L/R`, `leg.L/R`, `shin.L/R`, and `foot.L/R`. A built child GLB holds exactly one animation
named `idle`. The hands are exactly one body named `hands`.

### The inspection seam

The child base exports the four names of decision (d) plus `BASE_JOINTS`. `BASE_JOINTS` is an object
from bone name to its rest-pose `[x, y, z]` in world meters, for all 17 bones. `BASE_HANDS` is the
existing `{ L: Hand; R: Hand }` shape with `palmCentre`, `thumbTip`, and `fingerTip`.

`tests/sprout-child-base.test.ts` imports only the module's named exports and Tom's built GLB. It
reads no private variable and no internal shape:

1. The fixed model values come from `BASE_CROWN_Y`, `BASE_CHIN_Y`, `BASE_JOINTS`, and `BASE_HANDS`.
   It compares `BASE_JOINTS['upperarm.L'][1]`, `['leg.L'][1]`, `['shin.L'][1]`, `['hand.L'][1]`, and
   `['foot.L'][1]` with the table above.
2. The same joint names are read from Tom's built GLB. Each built joint y must equal the module value
   within 0.002 m, so a built asset cannot drift from its module.
3. The fingertip landmark comes from the built `hands` body: its lowest left-hand vertex. That point
   must equal `BASE_HANDS.L.fingerTip` within 0.005 m in y and x.
4. The inventory cases read the built GLB and require 17 joints with the names above, one animation
   named `idle`, and one body named `hands`.

The test fails with `landmark <name>: <value> not <expected> ± <tolerance>` and with
`inventory <kind>: <found>`.

### The Lily hair and chin check

The check reads the flat front and side renders, the record's `detail.chinRow` and
`detail.headHeight`, and the asset's declared hair color. The hair color is the first option of the
asset's `variants.hair` slot, which is the default look that the render and the pin measure. If the
asset declares no `variants.hair`, the run exits 1 with `hair colour: not declared`. Lily declares
one `hair` slot whose first option is her brown. The check adds three guards, and it runs only for
`sprout-lily-kim`:

1. `GUARD lily chin: hair crosses the chin at row <r>` — between the row
   `chinRow - 0.15 * headHeight` and `chinRow`, no pixel within 40 (Chebyshev) of the declared hair
   color sits inside the face component's column span, inset by 1 px at each edge.
2. `GUARD lily side chin: hair at the front` — on the side mask, the frontmost column at the rows
   `chinRow - 2` to `chinRow` is a skin pixel, not a hair pixel.
3. `GUARD lily bangs: hair in the eye window` — no hair pixel sits inside the eye window above the
   eye components' top row.

Pass means zero of these guards. A synthetic fixture plants one hair row across the chin and expects
the first named line.

### The skeleton and the module

The child skeleton uses the adult bone names. The base builds one `idle` clip. The hands are one body
named `hands`, with the palms toward the legs. The base exports the three landmark names of decision
(d) and the `BASE_JOINTS` seam.

The base module imports only `src/index.js`. It does not import `assets/parts/humanoid-kim.ts`.

The first render of the child base comes from Tom's asset. A base fault that Tom's render shows
returns to the base task in the same phase.

## The five identities

| Character | Height               | Identity from the drawing                                                                                                                                                   |
| --------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dad       | 1.500 m (adult base) | Black swept-back hair, square jaw, thick brows, open smile, red-and-black plaid shirt over a white tee, dark blue jeans, brown boots.                                       |
| Grandma   | 1.500 m (adult base) | White hair in a high bun, round cheeks, smile lines, pearl stud earrings, green cardigan over a pale green dress, mid-calf skirt, brown flats.                              |
| Grandpa   | 1.500 m (adult base) | Bald crown with white side hair, round dark-brown glasses, white moustache, open smile, green V-neck sweater over a pale green collared shirt, brown trousers, brown shoes. |
| Tom       | 1.050 m (child base) | Brown tousled hair with a side tuft, freckles, open smile, blue-and-orange striped tee, green shorts, white socks, grey sneakers.                                           |
| Lily      | 1.050 m (child base) | Brown bob to the jaw with straight soft bangs, open smile, blue tee with a white Peter Pan collar, red pleated skirt, white mid-calf socks, red sneakers.                   |

Each adult asset adds clothes and hair as separate bodies over the base. Each child asset adds
clothes, hair, and face paint over the child base. Each asset declares `variants` and one preset.

### The face layer and the paint

The adult base builds one private head with one closed smile, one brow, and one jaw. No adult asset
changes it, and no asset imports the private head shape. Each adult asset adds its own face layer
over the base head. The rules are fixed:

1. The face layer is one skin body. It rebuilds the published `KIM` head volume from
   `sdf.ellipsoid([KIM.headRX, KIM.headRY, KIM.headRZ]).at(0, KIM.headY, 0)` and the `KIM` chin
   ellipsoid, adds a nose volume at the base nose position, and inflates the union by 0.002 m
   (`.round(0.002)`). It is cut to the front with `z >= 0.02 m` and uses `textureDensity: 2`. Its
   colour is the first option of the asset's `variants.skin`.
2. The layer covers the base mouth, brow, and eye paint, because all four are paint on the base
   surface and the layer sits 2 mm outside it. The asset therefore recreates the eyes on its own
   layer: the eye white, iris, pupil, and glint at the `KIM.eyeX` and `KIM.eyeY` positions with the
   `KIM` radii, painted with the extruded-stencil method. The recreated pair must give two eye
   components in the flat front render. A layer without the pair fails the existing two-component
   rule.
3. The layer moves the crown, the chin, and the head width by 2 mm or less. The measured crown stays
   `BASE_CROWN_Y`, and the crown tolerance of the adult base absorbs the 2 mm offset.
4. A silhouette difference is a second body in the skin material, blended into the face layer, not a
   change to the base module. Dad's square jaw and thick brow are such a body. Grandma's round
   cheeks are such a body.
5. The mouth, brows, smile lines, freckles, glasses, and moustache are paint on the face layer, made
   by the extruded-stencil method of the AGENTS recipe. No mouth is a separate dark body.
6. The child base builds its own open smile, because the base is new. Tom's freckles are paint on the
   child face. Lily's hair is her own body.
7. Mom is unchanged. Her asset declares no face layer and no `castMeta`, so her geometry, her paint,
   and her measurement are those of the redesign track. Her pin must pass unchanged.

### The asset metadata and the eye mask

`src/asset.ts` has no `faceMarks` field, so the declaration is a typed local export in each cast
asset. `defineAsset` returns the asset, so a named export sits beside the default export:

```ts
export type CastMeta = {
  readonly faceMarks?: {
    readonly glasses?: `#${string}`;
    readonly moustache?: `#${string}`;
  };
};
export const castMeta: CastMeta = { faceMarks: { glasses: '#3b2a1e' } };
```

1. The proportion script imports the asset module to build it, then reads `mod.castMeta`. An absent
   export means no declared mark. `src/asset.ts` does not change.
2. Each declared colour must differ by more than 24 in Chebyshev distance from every eye colour of
   `variants.eyes` and from the pupil `#14100e`. A closer mark fails with
   `faceMarks <name>: too close to the eye paint`. Without that rule a frame colour could delete the
   iris from the eye mask.
3. The script drops the exact declared colour and a 1 px edge around it from the eye mask. The 1 px
   edge holds the blend pixels that touch a pixel of the exact colour. The guard keeps any other
   pixel that sits in an eye-shaped blob of the mark-free mask. A cast asset must paint its mark
   with exactly the declared hex. A mark painted off the declared hex is not excluded. The script
   copies the declared object into the record's `faceMarks`. The eye window, the two-component rule,
   and the face-component seed do not change. Grandpa declares his glasses colour.
4. The fixture `glasses-frame` draws two eyes and a frame that joins them in the declared glasses
   colour. With the declaration the run finds two eye components. Without it the run fails with
   `eye components: found 1, expected 2`.

### The eye-component width limit

1. The eye-component width limit is 0.60 of the head width for the cast tables, `kim` and `child`.
   The cast script applies the one limit of 0.60 to every asset it measures.
2. The archived redesign spec fixes the limit at 0.40
   (`measure/archive/chibi_sprouts_redesign_20261123/spec.md`, "Evaluation order" step 7). That
   0.40 stays the measured rule of Mom's table, and the archived spec does not change.
3. Mom's results under both limits are identical. Green recorded her eleven Mom rows unchanged in
   the T2 re-run, with the 0.60 limit in place (plan T2). The Phase 1 adversarial round found
   `measurePixels()` identical under 0.40 and 0.60. No Mom row moves.
4. The joined glasses blob of the `glasses-frame` fixture is 0.57 of the head width. Under 0.40 the
   undeclared run finds 0 components. Under 0.60 it finds 1 and fails with
   `eye components: found 1, expected 2`, which this spec requires.
5. A dark bar of 0.41 to 0.59 of the head width qualifies as an eye component. A bar of 0.61 or more
   is still dropped.

## The pass tables

The script holds both tables. The adult table is the current table, unchanged.

### The adult table (`kim`)

| Row               | Range         |
| ----------------- | ------------- |
| `heightInHeads`   | 3.54 to 3.74  |
| `armToTorso`      | 1.25 to 1.41  |
| `legShare`        | 0.36 to 0.42  |
| `headToShoulders` | 1.11 to 1.27  |
| `wrist`           | −0.16 to 0.04 |
| `fingertips`      | 0.41 to 0.61  |
| `eyeLine`         | 0.59 to 0.65  |
| `eyeHeight`       | 0.09 to 0.13  |
| `spacingHead`     | 0.35 to 0.41  |
| `eyeWidthFace`    | 0.22 to 0.24  |
| `spacingFace`     | 0.44 to 0.50  |

### The child table (`child`)

Each row is one band. The band is the midpoint of the two drawing values, plus or minus a half
width. The half width is the row width below plus the larger distance from the midpoint to a
drawing value.

| Row               | Drawing values        | Row width | Half width | Range         |
| ----------------- | --------------------- | --------- | ---------- | ------------- |
| `heightInHeads`   | Tom 2.89, Lily 2.93   | .10       | .12        | 2.79 to 3.03  |
| `armToTorso`      | Tom 1.23, Lily 1.36   | .15       | .22        | 1.08 to 1.51  |
| `legShare`        | Tom .33, Lily .36     | .03       | .045       | 0.30 to 0.39  |
| `headToShoulders` | Tom 2.15, Lily 2.03   | .20       | .26        | 1.83 to 2.35  |
| `wrist`           | Tom −.12, Lily −.02   | .18       | .23        | −0.30 to 0.16 |
| `fingertips`      | Tom .43, Lily .53     | .18       | .23        | 0.25 to 0.71  |
| `eyeLine`         | Tom .647, Lily .644   | .03       | .032       | 0.61 to 0.68  |
| `eyeHeight`       | Tom .139, Lily .138   | .02       | .021       | 0.12 to 0.16  |
| `spacingHead`     | Tom .313, Lily .327   | .03       | .04        | 0.28 to 0.36  |
| `eyeWidthFace`    | the page's .22 to .24 | —         | —          | 0.22 to 0.24  |
| `spacingFace`     | Tom .483, Lily .479   | .03       | .032       | 0.45 to 0.51  |

The row widths come from the page's confidence note. It gives ±20 px for the drawing shoulder, hip,
knee, and reach rows. A ±20 px error over Lily's 214 px hip-to-knee distance is .18, so the two
reach rows take .18. The same error over a 241 px shoulder span is .17, so `headToShoulders` takes
.20. `armToTorso` takes .15. The height rows take .10. The face rows keep the adult widths. The eye
opening keeps the page's .22 to .24 cap.

A child row that the child base cannot meet is a design fault. The task stops and records the
conflict. It does not widen a range.

## The per-character pin

Each asset gets `tests/<name>.test.ts`. The file runs
`scripts/proportion-check.mjs --asset <name> --record out/chibi-sprouts/cast/<name>-measure.json`
with the arguments of its group:

| Asset                | Base                 | Table   |
| -------------------- | -------------------- | ------- |
| `sprout-dad-kim`     | default              | `kim`   |
| `sprout-grandma-kim` | default              | `kim`   |
| `sprout-grandpa-kim` | default              | `kim`   |
| `sprout-tom-kim`     | `humanoid-kim-child` | `child` |
| `sprout-lily-kim`    | `humanoid-kim-child` | `child` |

The test requires:

1. the script exits 0 and writes `out/chibi-sprouts/cast/<name>-measure.json`,
2. `Object.keys(record.rows)` holds the eleven table names in table order plus `lit`,
3. every value sits inside the range of `TABLES[table]`, not the range in the row,
4. each row's `lo` and `hi` equal the table's pair,
5. the record's two palms are `ok`,
6. `TABLES.kim` and `TABLES.child` equal the two tables of this spec, name, order, `lo` and `hi`.

The Phase 2 and Phase 3 gates also run `tests/cast-isolation.test.ts`. It proves that the scrapped
sources, the `ADULT`, `AGE5`, and `HERO` exports, and Mom's preset are unchanged against the baseline
of `tests/fixtures/cast-baseline.json`. The file is written at T0 from the track base commit: one
SHA-256 per scrapped source, the imported `ADULT`, `AGE5`, and `HERO` values, and Mom's preset entry
of `tests/fixtures/preset-pin.json`. The test fails with `source changed: <path>` or
`contract changed: <name>` and prints both values. The existing hero clauses of
`tests/sprout-base.test.ts` stay active and unchanged.

The record path is per asset, so two pins can run together without a race. Each Green task writes the
build and both level renders before the pin runs. A missing render fails the pin with the named line.

## Build and render sequence

Every asset is prepared with one build and two level render passes, in this order:

```bash
./forge build <name> --fast
./forge render <name> --fast --views front-level,side-level --ortho --flat --bg none --size 1024
./forge render <name> --fast --views front-level,side-level --ortho --bg none --size 1024
```

The build writes `out/<name>/<name>.glb` and `out/<name>/stats.json`. The pin reads both. The flat
pass writes `out/<name>/flat/` and leaves `views/` alone. The lit pass clears `views/` first and then
writes `out/<name>/views/`, so it runs last. The flat and the lit pass use the same ortho frame, so a
row in the flat record is the same row in the lit renders. The panel reads the lit views and the
record. The pin, the panel, and the judge therefore read one GLB, one bounds record, and one pair of
images.

### The hashes and the stats comparison

Each render rebuilds the GLB and rewrites `stats.json` (`src/cli/forge.ts:323-340`). The final
artifact hashes are therefore taken after the lit render, and every later step uses those inputs:

1. The five artifact hashes are the GLB and the four level renders: `glbSha256`, `flatFrontSha256`,
   `flatSideSha256`, `litFrontSha256`, and `litSideSha256`. The measure record holds all five, so
   the record hash binds the whole artifact set.
2. `stats.json` holds elapsed milliseconds at the top level, under `texture`, and in each body
   (`src/asset.ts:507`, `src/sdf/mesher.ts:310`). Two independent builds therefore write different
   bytes. Stats equality compares a stable projection: every key named `milliseconds` is removed at
   any depth, and `texture` keeps `size` only. All other keys must match exactly. No gate compares
   the raw `stats.json` bytes.
3. The raw `stats.json` SHA-256 is recorded for traceability only. It is never an equality check.
4. The same build type is used on both sides of every comparison: `./forge build <name> --fast`
   before and after.

`./forge all` is not used. It clears `views/`, renders the default turnaround views, and generates
sprites and animations. This track excludes sprites, so `./forge all` would break the scope and would
leave the pin and the panel on different images.

## The output tree

`out/` is not in git. A fresh checkout holds the sources and the tests but no GLB, no stats, and no
render. Each pin, panel, and judge reads those outputs.

T0 is the preparation step. It runs once per worktree before Phase 1's Red task, and again whenever
an output is missing. It writes only under the worktree's own `out/`:

```bash
./forge build sprout-mom-kim --fast
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --flat --bg none --size 1024
./forge render sprout-mom-kim --fast --views front-level,side-level --ortho --bg none --size 1024
```

T0 records the five artifact SHA-256 sums after the lit render: the GLB and the four level renders.
It also records the raw `stats.json` SHA-256 for traceability only, and the stable stats projection
of "The hashes and the stats comparison".

The cast inputs are the five assets' build and level renders. Each Green task writes its own before
its pin runs. Phase 4 re-prepares every missing cast output before the sheet and the handoff. A
fixture writes only under `/tmp` or under `--root`. No task writes to another worktree's `out/` or to
a production `out/`.

## The look judge and the panels

`scripts/sprout-cast-panel.mjs` writes two kinds of file. It copies two conventions from
`scripts/mom-kim-sheet.mjs` and changes the third (decision (m)):

- `maskSpan`: the alpha-128 bounding box of a render, the same rule the measurement uses.
- `panel`: clamped nearest-neighbour sampling, so the source crown row lands on panel row 80 and the
  source sole row lands on the baseline, and the width follows the source ratio. Why not
  `sharp.extract` plus `resize`: Dad's crown row 80 sits above 8 % of the band, so a literal extract
  takes a negative top and throws. The mean difference to the resize path is 1.6 of 255.
- `textSvg`: DejaVu Sans text lines at fill `#1c1c1c`, font sizes 22 and 20.

The script does not import `scripts/mom-kim-sheet.mjs`, because that module runs its `main` on
import. It differs from the Mom sheet in two ways: a 56 px headroom band above the 700 px body band,
and a caption read from the measure record.

### The command line and the input contract

```bash
node scripts/sprout-cast-panel.mjs --asset <name> [--date YYYY-MM-DD] [--root <dir>]
node scripts/sprout-cast-panel.mjs --all          [--date YYYY-MM-DD] [--root <dir>]
node scripts/sprout-cast-panel.mjs --sheet        [--date YYYY-MM-DD] [--root <dir>]
```

1. `--asset` writes one panel and no sheet. `--all` writes the five panels and the cast sheet.
   `--sheet` writes the cast sheet and no panel. `--all` is the default. Two of the three together
   exit 1 with `choose one of --asset, --all, or --sheet`.
2. The panel path is `<root>/out/chibi-sprouts/cast/<name>-panel.png`. The sheet path is
   `<root>/out/chibi-sprouts/cast/cast-sheet.png`.
3. `--sheet` reads the five measure records and the five lit front renders. It reads no panel and
   writes no panel, so it never changes a panel hash or voids a judge record.
4. `--date` sets the caption date. The default is the local date of the run. The date is part of the
   panel bytes, so a panel with a different date has a different hash.
5. `--root` sets the tree root. The default is the repository root.
6. An unknown asset exits 1 with `unknown asset <name>`. A missing render exits 1 with
   `render <view>: not built`. A missing record exits 1 with `record <name>: not built`.
7. A linked, outside, or directory destination exits 1 with the named line of "The destinations",
   before any write.

### The panel layout

The numbers are fixed:

| Item          | Value                                 |
| ------------- | ------------------------------------- |
| pad           | 24 px                                 |
| headroom      | 56 px above the body band             |
| body band     | 700 px, crown to sole                 |
| caption strip | 96 px                                 |
| cell width    | 440 px                                |
| panel size    | 1416 × 900 px                         |
| sheet cell    | 280 px                                |
| sheet size    | 1544 × 900 px                         |
| sheet scale   | 466.667 px per metre for every figure |

Each panel holds three cells: the lit front render, the lit side render, and the drawing. Every cell
shares one baseline, the bottom of the body band at row 780. The caption holds the asset name, the
date, and the row result.

1. The lit cells crop by the lit render's `maskSpan`. They scale by
   `700 / (record.detail.soleRow - record.detail.projectedCrownRow)`. The sole sits on the baseline and
   the projected crown lands at row 80.
2. The drawing cell crops from `drawingRow.crown - 0.08 * band` to `drawingRow.sole`, where
   `band = drawingRow.sole - drawingRow.crown`. It scales by `700 / band`. The drawing's crown lands at
   row 80 and the 8 % above it fills the headroom.
3. The bun or hat stays visible above the 700 px band, inside the 56 px headroom. A figure top above
   the cell fails with `figure top above the cell: <name>`.
4. The row result is `<n>/11 rows pass; palms ok` or `palms fail`, read from
   `out/chibi-sprouts/cast/<name>-measure.json`.
5. The cast sheet holds the five lit front renders at the one sheet scale, so the three adults are
   700 px and the two children are 490 px. It keeps the relative body heights and one baseline. Its
   caption names the five and Mom.

### The horizontal crop

Cells are narrower than some sources at their scale. Grandma's 1600 px drawing scales to about
813 px at 0.508, and the cell is 440 px. The horizontal rule is fixed and applies to every panel cell
and every sheet cell:

1. The window is `windowPx = Math.round(cellWidth / scale)` source pixels wide, where `scale` is the
   cell's own pixels per metre. The window is centred on the horizontal centre of the source mask
   over the crown-to-sole band. It is clamped so it lies inside the source image; a clamped window
   takes the free pixels from the other side.
2. The head band must fit. The widest mask run from the crown row to the chin row, scaled, must be at
   most `cellWidth - 16` px. A wider head exits 1 with `figure wider than its cell: <name>`. A head
   never crops, because the face is the judged subject.
3. Pixels outside the window are dropped. The figure is never squeezed, stretched, or scaled down
   horizontally, so the vertical scale stays exactly 700 px per body band and 466.667 px per metre
   on the sheet.
4. Arms, hands, and cloth beyond the window are cropped. The caption records `cropped: yes` for a
   cell whose window is narrower than its scaled mask, and `cropped: no` otherwise. The panel hash
   covers the crop, so the crop is part of the judged bytes.

### The judge record

The judge brief holds the panel path, the drawing path, the eleven rows as text, and the two scores.
The judge writes `measure/runs/chibi_sprouts_cast_20261125/judge-<name>.json` with:

- `model_id`, `model_family`, `red_family`, `green_family`,
- `asset_path`, `asset_commit` (the commit that last changed the asset source),
- `base_path`, `base_commit` (the commit that last changed its base module), `base_sha256`,
- `asset_sha256` (the GLB), `record_sha256` (the measure record),
- `render_sha256`, an object with `flatFront`, `flatSide`, `litFront`, and `litSide`,
- `panel_path` and `panel_sha256`,
- `identity_score`, `identity_comment`, `proportion_score`, `proportion_comment`,
- `round` (1 or 2), `verdict`, and `judged_at`.

Each of the four `render_sha256` values and `asset_sha256` must equal the matching field of the
measure record. A mismatch stops the judge before the call, with
`judge input <field>: <actual> is not <record>`.

The verdict applies only to that asset revision, that base revision, that record, that render set,
and that panel hash. A change to the asset source, the base source, the GLB, a render, the record,
the panel script, the table, or the measurement script voids the verdict. The character is measured
again, gets the hashes checked again, and is judged again only when a score failed or an input
changed.

At most two judge rounds run per character. Round 2 runs only after a score below 7.5 or after a
changed input voids round 1. A passing asset with unchanged inputs keeps its one verdict. A second
score below 7.5, a third round, or a route that is still absent at the phase gate is a human gate.
The orchestrator writes `measure/runs/chibi_sprouts_cast_20261125/escalation-<name>.json` with the
rounds and both comments and reports to the PM. No third family substitutes.

### The gate check of the judge inputs

Every phase gate that accepts a judge re-reads the final inputs and compares them with the record,
at the gate HEAD:

1. `git rev-parse HEAD -- <asset_path>` equals `asset_commit`.
2. `git rev-parse HEAD -- <base_path>` equals `base_commit`, and the SHA-256 of the base file equals
   `base_sha256`. This clause covers the shared child base, so a base change after Tom cannot leave a
   stale Tom verdict.
3. The SHA-256 of the GLB equals `asset_sha256` and `record.glbSha256`.
4. The SHA-256 of the measure record equals `record_sha256`.
5. The four render SHA-256 sums equal `render_sha256` and the four record hashes.
6. The SHA-256 of the panel equals `panel_sha256`.
7. The stable stats projection equals the projection recorded at the pin.

Any mismatch voids the verdict, and the gate fails with `judge input <field> changed`. The panel
hash check alone is not enough.

## Gates

| Phase | Gate                                                                                                                                                                                                                                                       |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | The tool tests pass. The Mom pin still passes with every row in range. The stable Mom stats projection and the five Mom artifact hashes do not change. One adversarial round covers the two scripts. Its verdict is `pass` and every blocking finding is closed. |
| 2     | Three pins pass. Three judges score 7.5 or more on both scores, and every judge input of "The gate check of the judge inputs" is verified at the gate HEAD. `./forge check` ends `result ok` for each asset. The preset pin gains three keys and changes no value.      |
| 3     | Two pins pass. Two judges score 7.5 or more on both scores, and every judge input of "The gate check of the judge inputs" is verified at the gate HEAD, including the shared child base. `./forge check` ends `result ok` for each asset. The preset pin gains two keys and changes no value. |
| 4     | The panel test passes on synthetic fixtures. The five panels exist and their hashes equal the judge records. The sheet is recorded with its size, its scale, its baseline, and its crop. The PM handoff holds the five panels, the sheet, the rows, and the records. |

Phase 2 starts only after the Phase 1 gate returns `pass`. No phase runs Review A, Review B, or
Review C (decision o). Phase 1 runs one adversarial round, because two scripts change. Phases 2 to 4
run no adversarial round. No phase runs a UX review. This is the lightest gate set the findings
allow.

The project gate stays `PROJECT_TESTS` with the TD-40 exclusion. `tsc --noEmit` is not a gate while
TD-35 to TD-39 are open. A task records its before and after error count and requires no error in its
changed files.

### The closeout path

`metadata.json` holds `"lane": "light"` (decision t). The Phase 4 gate is the track acceptance
record. The orchestrator reads the lane field, records the final-acceptance exception, and runs the
closeout role after T19. The closeout archives the track, updates the registry, and keeps the phase
evidence. No separate final-acceptance role runs for a light-lane track.

## Scope

- One child base module.
- Five asset modules.
- Two script changes: `scripts/proportion-check.mjs` and the new
  `scripts/sprout-cast-panel.mjs`.
- Three aliases in `assets/parts/humanoid-kim.ts`.
- Nine test files: five pins, `tests/proportion-cast-options.test.ts`,
  `tests/sprout-cast-panel.test.ts`, `tests/sprout-child-base.test.ts`, and
  `tests/cast-isolation.test.ts`.
- One baseline file: `tests/fixtures/cast-baseline.json`.
- Five preset pin keys.
- Five panels, one cast sheet, five judge records, and one handoff note.

## Exclusions

- No cut-out, no sprite, no walk clip, and no gesture clip.
- No song scene, no song render, and no game skin.
- No `./forge all`.
- No change to a scrapped source: `assets/sprout-*.ts`, `assets/parts/sprout-gestures.ts`, and the
  `ADULT` and `AGE5` sets of `assets/parts/humanoid-kind.ts`.
- No change to `assets/sprout-mom-kim.ts` and no change to Mom's preset.
- No change to the hero base, the avatar base, the avatar pack, or a shipped asset.
- No change to a game, a song page, the monorepo, or a delivery folder.
- No deletion of a source or committed file. The generators replace their own files inside the
  worktree `out/` tree, as "Standing rules" defines.
- No paid generation call.
- No customer-facing text.
- No claim that a judge score proves the look. Daniel's look stays the last gate.

## Acceptance criteria

### AC1: the measuring contract holds, and Mom does not move

1. `assets/parts/humanoid-kim.ts` exports `BASE_CROWN_Y`, `BASE_CHIN_Y`, and `BASE_HANDS` as
   aliases. `KIM.crown`, `KIM_CHIN_Y`, and `KIM_HANDS` stay.
2. `scripts/proportion-check.mjs` takes `--base`, `--table`, and `--record`. The defaults are
   `humanoid-kim`, `kim`, and `out/chibi-sprouts/redesign/measure.json`. An unknown value exits 1
   with its named one-line error.
3. The script exports `TABLES` as an object of named, ordered arrays of `{ name, lo, hi }`.
   `TABLES.kim` equals the adult table, value for value. `TABLES.child` equals the child table, value
   for value. The selected table decides every range and the row order.
4. The projected crown is rounded to the nearest pixel. The mask top may sit above it by any amount
   and at most 2 px below it. The front and side sole guards hold.
5. The two new fixtures behave as named: `bun-above-crown` passes with a mask top 24 px above the
   crown, and `wrong-crown` fails with `GUARD top on mask`. `measurePixels()` keeps exactly its five
   figures with the same names and `params`, and the two new fixtures reach `measureFigure` directly.
6. The record holds the eleven rows plus `rows.lit`, with row limits equal to the table. A row with
   a wrong `lo` and `hi` fails with the disagreement line. The record holds `glbSha256`, the four
   render hashes, `base`, and `baseSha256`, taken after the lit render.
7. A record or panel destination outside its tree, a linked destination, or a directory destination
   exits 1 with the named line and leaves the tree unchanged.
8. The Mom command still exits 0. Her eleven rows stay inside the adult table. Her stable stats
   projection and her five artifact hashes are unchanged before and after the script change. The raw
   `stats.json` hash is recorded for traceability only.
9. The Mom pin passes unchanged.
10. A child base that is absent exits 1 with `base humanoid-kim-child: not built`, before any
    import.
11. `tests/cast-isolation.test.ts` passes against `tests/fixtures/cast-baseline.json`: the scrapped
    sources, the `ADULT`, `AGE5`, and `HERO` exports, and Mom's preset are unchanged.

### AC2: Dad

1. `assets/sprout-dad-kim.ts` exists. It imports `buildKim` and `KIM` from the adult base. It adds a
   face layer and a jaw body per "The face layer and the paint". It changes no base module.
2. `tests/sprout-dad-kim.test.ts` passes: the eleven rows of `TABLES.kim`, row limits equal to the
   table, and both palms ok.
3. `./forge check sprout-dad-kim` ends `result ok`.
4. A look judge scores identity 7.5 or more and proportion 7.5 or more, bound to the revision and
   the panel hash, with every judge input of "The gate check of the judge inputs" verified.
5. The preset pin holds one new key `sprout-dad-kim`, and no existing value changes.

### AC3: Grandma

1. `assets/sprout-grandma-kim.ts` exists and uses the adult base. She adds a face layer and a cheek
   body per "The face layer and the paint".
2. Her bun may sit above the projected crown. The measured head uses the skull crown, so her
   height in heads is the adult value. The panel keeps the bun inside the 56 px headroom.
3. `tests/sprout-grandma-kim.test.ts` passes: the eleven rows of `TABLES.kim`, row limits equal to
   the table, and both palms ok.
4. `./forge check sprout-grandma-kim` ends `result ok`.
5. A look judge scores identity 7.5 or more and proportion 7.5 or more, bound to the revision and
   the panel hash, with every judge input of "The gate check of the judge inputs" verified.
6. The preset pin holds one new key `sprout-grandma-kim`, and no existing value changes.

### AC4: Grandpa

1. `assets/sprout-grandpa-kim.ts` exists and uses the adult base. He adds a face layer, a glasses
   paint, and a `faceMarks.glasses` declaration.
2. `tests/sprout-grandpa-kim.test.ts` passes: the eleven rows of `TABLES.kim`, row limits equal to
   the table, and both palms ok.
3. The two eye components are separate from the glasses frame and the moustache. The `glasses-frame`
   fixture proves the exclusion rule.
4. `./forge check sprout-grandpa-kim` ends `result ok`.
5. A look judge scores identity 7.5 or more and proportion 7.5 or more, bound to the revision and
   the panel hash, with every judge input of "The gate check of the judge inputs" verified.
6. The preset pin holds one new key `sprout-grandpa-kim`, and no existing value changes.

### AC5: the child base and Tom

1. `assets/parts/humanoid-kim-child.ts` exists. It imports only `src/index.js`. It builds the
   skeleton with the adult bone names, one `idle` clip, the hands body, the three landmark exports,
   and `BASE_JOINTS`.
2. `tests/sprout-child-base.test.ts` passes: the fixed model landmarks hold within their tolerances,
   `BASE_JOINTS` and the built joints agree, and the 17-bone, clip, and body inventory is exact.
3. `assets/sprout-tom-kim.ts` exists and uses the child base.
4. `tests/sprout-tom-kim.test.ts` passes with `--base humanoid-kim-child --table child`.
5. `./forge check sprout-tom-kim` ends `result ok`.
6. A look judge scores identity 7.5 or more and proportion 7.5 or more, bound to the revision and
   the panel hash, with every judge input of "The gate check of the judge inputs" verified.
7. The preset pin holds one new key `sprout-tom-kim`, and no existing value changes.

### AC6: Lily

1. `assets/sprout-lily-kim.ts` exists and uses the child base, and it declares `variants.hair`.
2. The bob keeps the eye band clear. The two eye components stay separate from the hair and the
   brow in the flat front view.
3. The three Lily guards of "The Lily hair and chin check" pass: no hair on the chin, no hair at the
   side chin, and no hair in the eye window. A fixture that plants a hair row across the chin fails
   with the first named line.
4. `tests/sprout-lily-kim.test.ts` passes with `--base humanoid-kim-child --table child`.
5. `./forge check sprout-lily-kim` ends `result ok`.
6. A look judge scores identity 7.5 or more and proportion 7.5 or more, bound to the revision and
   the panel hash, with every judge input of "The gate check of the judge inputs" verified.
7. The preset pin holds one new key `sprout-lily-kim`, and no existing value changes.

### AC7: the panels and the cast sheet

1. `scripts/sprout-cast-panel.mjs` writes the five panels and one cast sheet. `--sheet` writes the
   sheet alone and no panel.
2. The panel is 1416 × 900 px. It holds three cells at one 700 px body scale: the lit front render,
   the lit side render, and the drawing. Every sole sits on one baseline at row 780. The projected
   crown sits at row 80.
3. The sheet is 1544 × 900 px. It holds five figures at one 466.667 px per metre scale, so the
   relative body heights hold, with one baseline.
4. The drawing rows are the five pairs of decision (n). The crop keeps 8 % above the crown, so the
   bun stays visible above the 700 px band.
5. Every cell crops horizontally by the fixed window of "The horizontal crop". The head band fits
   its cell; a wider head exits 1 with `figure wider than its cell: <name>`. A cropped cell is
   recorded as `cropped: yes`.
6. A missing render exits 1 with `render <view>: not built` for the named asset.
7. A linked, outside, or directory destination exits 1 with the named line and is never followed or
   created.
8. The panel test passes on the synthetic fixtures under `--root`, including the bun fixture, the
   1600 px wide drawing fixture, the `--sheet` case, and the destination fixtures.
9. T17 records the five real panels and the sheet with their sizes, their projected rows, their
   hashes, their baselines, and their crop. Each panel hash equals its judge record. No panel holds
   the Kim sheet, the Mom panel, or a LATO.2 image.

### AC8: the gates

1. Phase 1 runs one adversarial round on the two scripts. Its verdict is `pass` and every blocking
   finding is closed before Phase 2 starts. Phases 2 to 4 run none.
2. No phase runs Review A, Review B, or Review C. No other review gate is added.
3. Every phase records its gate result in the plan.
4. The proportion script, the panel script, and every pin run no paid call and no network call. The
   approved look judge is the only hosted call.
5. The judge family differs from the Red and Green families.
6. A judge verdict binds to the asset revision, the base revision, the record hash, the render set,
   and the panel hash. At most two judge rounds run per character, and a second round runs only on a
   failing score or a changed input. A second failure or an absent route escalates to the PM.
7. T19 is a human-gated task. The PM owns the answer.
8. `metadata.json` holds `"lane": "light"`, and the closeout follows "The closeout path".

### AC9: no customer-facing claim

1. The track writes no page, post, deck, video script, email, or sales text.
2. The panels and the sheet stay local to the worktree and to the PM handoff. The single exception
   is the approved look judge upload of the panel PNG and the brief text.
3. The plan and the handoff say that no customer-facing claim is made.

## Known limits

- The judge is one opinion. A 7.5 from one family does not prove the look to Daniel.
- The child body rows are wide. The drawings have one front view each, and the page calls the
  shoulder, hip, knee, and reach rows a ±20 px estimate.
- The eye detector needs the two eyes separate from the skin, the brow, the hair, and a declared face
  mark. A face paint that joins an eye to the brow, or a face mark that is not declared, fails the
  check with a named error, not with a bad value.
- The face layer covers the base mouth, brow, and eye paint. Each adult asset must recreate the two
  eyes on its layer, or the two-component rule fails with a named error. A base mouth made of
  geometry rather than paint would also show.
- Dad, Grandma, and Grandpa use a jaw or cheek mass for a silhouette change. A large change would
  need a base option, which this track forbids.
- A drawing is 1600 px wide. The panel crops its outer columns to the 440 px cell, so the arms and
  cloth of a wide drawing are not in the judged bytes. The head band always fits.
- Head width includes the hair. A style that widens the head at the eye line moves
  `headToShoulders`.
- A skirt hides the knee in the drawing and in the render. The measured knee comes from the model
  joint, so the skirt does not move a row.
- Grandma's and Grandpa's glasses and moustache are paint. A 3D frame is not required, and the
  judge may score the face on the paint only.
- The judge sees a still. An animation stays unjudged.
- A panel caption holds its date, so a run on another day writes different bytes. A changed hash
  needs a fresh judge.
- The preset pin is a shared file. Each task requires one new key per asset and no changed value.
  The check compares parsed JSON, not a diff line count.

## Sources

- [The approved redesign page](../../../docs/chibi-sprouts/redesign-2026-11-23.md)
- [The redesign specification](../../archive/chibi_sprouts_redesign_20261123/spec.md)
- [The redesign plan](../../archive/chibi_sprouts_redesign_20261123/plan.md)
- [Mom's shape judge record](../../runs/chibi_sprouts_redesign_20261123/judge.json)
- [Mom's Phase 9 cut-out and sprite record](../../runs/chibi_sprouts_redesign_20261123/judge-p9-bf4158a.json)
- [The adult base](../../../assets/parts/humanoid-kim.ts)
- [Mom on the adult base](../../../assets/sprout-mom-kim.ts)
- [The proportion script](../../../scripts/proportion-check.mjs)
- [The Mom sheet script](../../../scripts/mom-kim-sheet.mjs)
- [The cast queue](../../../QUEUE.md)
- [Dad's drawing](../../../docs/sprout-mockups/dad.jpg)
- [Grandma's drawing](../../../docs/sprout-mockups/grandma.jpg)
- [Grandpa's drawing](../../../docs/sprout-mockups/grandpa.jpg)
- [Tom's drawing](../../../docs/sprout-mockups/tom.jpg)
- [Lily's drawing](../../../docs/sprout-mockups/lily.jpg)

## Scope control

This track adds one child base, five assets, two scripts, three aliases, nine test files, one
baseline file, five preset keys, and the panel records. It changes no scrapped source, no shipped
asset, no game, no song page, no monorepo file, and no delivery folder. It sends no drawing to an
unapproved route, and it deletes nothing.
