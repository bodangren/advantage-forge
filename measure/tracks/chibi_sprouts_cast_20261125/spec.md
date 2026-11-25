# Chibi Sprouts cast on the Kim base: Dad, Grandma, Grandpa, Tom and Lily

## Purpose

Five Chibi Sprouts release 1 cast members remain. They are Dad, Grandma and Grandpa on the approved
adult base, and Tom and Lily on a new child base.

The PM approved Mom at identity 7.5 on 2026-11-25. Mom is the shape reference for the three adults.

This track finishes the five characters. It adds one proportion pin and one independent look judge
for each character. It adds no cut-out, no sprite, no song, and no game skin.

**No customer-facing claim is made.** The track publishes no page, post, deck, video, or email. The
five assets and their panels stay internal. The PM decides any external use. Daniel's look gate
stays open.

## Context

- `QUEUE.md` item 3 asks for the rest of the release 1 cast.
- The adult base is `assets/parts/humanoid-kim.ts`. Mom is `assets/sprout-mom-kim.ts`. Both merged
  as `7478b2af`.
- The Mom acceptance record is `measure/runs/chibi_sprouts_redesign_20261123/judge-p9-bf4158a.json`.
  The route was `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`.
- The design page is `docs/chibi-sprouts/redesign-2026-11-23.md` (approved 2026-11-23). It holds
  the Kim ratios, the drawing pixel rows, and the direction line for each character.
- The five drawings are `docs/sprout-mockups/dad.jpg`, `grandma.jpg`, `grandpa.jpg`, `tom.jpg`, and
  `lily.jpg`. Each is 1600 × 1600 px.
- The page says: use Kim's ratios for the adults, and the drawing ratios for the children with
  Kim's eye-size cap.
- The scrapped base and its models stay in git and are untouched. The new files use a different
  name for that reason.
- The PM rule of 2026-11-25 asks for the lightest gates the risk allows.
- Every render and every test run uses the heavy runner:
  `HEAVY_MIN_AVAIL_MB=1500 bash /home/daniebo/Desktop/advantage-pr/scripts/jobs/heavy-run.sh -c '<cmd>'`.
- A textured Forge command takes one of the two machine build slots. Shape iteration uses `--fast`.
- The current measurement method is in the redesign spec (`measure/tracks/chibi_sprouts_redesign_20261123/spec.md`,
  "Measurement method"). This track extends it. It changes no scrapped file.

## Standing rules

- No role calls the `openchamber_image` tool. It costs money. A role reads an image with `read`.
- No paid generation call runs. The track uses no Muse call, no mmx call, and no hosted API.
- The five drawings may go to the approved look-judge route. They go to no other service.
- The Kim sheet goes nowhere. The Kim sheet is not a judge input.
- No role edits a scrapped source. The scrapped sources are `assets/sprout-*.ts` and
  `assets/parts/sprout-gestures.ts`.
- No role deletes a file.
- No role touches a production `out/` path outside its own worktree. A probe or a fixture stays in
  the worktree or under `/tmp`.
- A paid call, or a forbidden upload, is a stop-and-report event. The role keeps every file and
  reports to the PM.

## Authoring decisions

These decisions are fixed here. Green decides nothing.

| #   | Decision                   | Rule                                                                                                                                                                                                                                            | Why                                                                                                                                               |
| --- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| a   | Asset names                | `sprout-dad-kim`, `sprout-grandma-kim`, `sprout-grandpa-kim`, `sprout-tom-kim`, `sprout-lily-kim`, in `assets/<name>.ts`. The child base is `assets/parts/humanoid-kim-child.ts`.                                                               | The `-kim` suffix records the base family, as `sprout-mom-kim` does. The scrapped files stay untouched.                                           |
| b   | Adults use the adult base  | Each adult asset imports `buildKim` and `KIM` from `assets/parts/humanoid-kim.ts`. The base module does not change, except for the three aliases of decision (d).                                                                               | Mom passed on this base. A second adult base adds risk for no gain.                                                                               |
| c   | Child base                 | One base module for Tom and Lily. It holds the skeleton, the head and face, the torso, the arms, the open hands with the palms toward the legs, the legs, the feet, and one `idle` clip. It uses the child derived targets of "The child base". | The two drawings share one body shape. One base keeps the pair consistent.                                                                        |
| d   | The measured-base contract | Every base module exports `BASE_CROWN_Y`, `BASE_CHIN_Y`, and `BASE_HANDS`. `assets/parts/humanoid-kim.ts` adds the three names as aliases of `KIM.crown`, `KIM_CHIN_Y`, and `KIM_HANDS`. The `KIM_*` names stay.                                | A bun or a hat must not move the measured head. The crown is a model landmark, as the chin already is.                                            |
| e   | Measurement options        | `scripts/proportion-check.mjs` takes `--base <stem>` (default `humanoid-kim`), `--table <name>` (default `kim`), and `--record <path>` (default `out/chibi-sprouts/redesign/measure.json`). The base path is `assets/parts/<stem>.ts`.          | The child base and the child table need a named route. The record path is per asset. The defaults keep the Mom command and the Mom pin unchanged. |
| f   | The tables                 | Two named tables: `kim` (the current eleven ranges, unchanged) and `child` (the table of "The child table"). `checkRows(rows, table = 'kim')` keeps its current default. The script exports `TABLES`.                                           | The four adults pass the page's Kim rows. The two children pass their own drawing rows.                                                           |
| g   | The crown source           | `heightInHeads`, `legShare`, `eyeLine`, `eyeHeight`, the head-width band, and the eye window use the projected `BASE_CROWN_Y`, not the mask's top row. The mask top guard becomes: the mask top row is at or above the projected crown row.     | The page's rule excludes buns and loose hair tips. Grandma's bun sits above her skull.                                                            |
| h   | The palm rule              | Every asset's rest pose keeps the palms toward the legs and the thumbs forward. The palm check of the redesign spec runs on both hands of every asset.                                                                                          | The owner named forward palms as a fault.                                                                                                         |
| i   | Per-character pin          | Each asset gets one test file `tests/<name>.test.ts`. It runs the script on the asset and the table of its group. It requires exit 0, eleven rows, each value inside the range of `TABLES`, and both palms ok.                                  | One pin per character is the proportion acceptance.                                                                                               |
| j   | Look judge route           | The judge route is `nvidia/nvidia/nemotron-3.5-super-vl-120b-a12b`, family nvidia. The route is not muse, not hy4, and not OpenAI. A missing route waits; the track does not substitute.                                                        | This route passed Mom. The PM rule names it.                                                                                                      |
| k   | Judge input                | Each panel holds the character's lit front render, its lit side render, and its drawing at one 700 px scale. The judge brief holds the eleven rows as text. No Kim sheet, no Mom panel, and no LATO.2 image is an input.                        | The judge must see the character, not the reference sheet.                                                                                        |
| l   | Judge scores               | The judge rates identity and proportion out of 10. Both scores are 7.5 or more. A lower score returns the phase to Green with the comment as the work list.                                                                                     | This is the Mom pass line and the owner bar for characters.                                                                                       |
| m   | Panels and sheet           | `scripts/sprout-cast-panel.mjs` writes one panel per character and one cast sheet. It reads only local files. It refuses a linked output folder and a linked output file. It takes `--root <dir>` for its test.                                 | The PM needs one panel per character and one sheet.                                                                                               |
| n   | Drawing rows               | The panel scales each drawing by the page's pixel pair: Dad 80–1525, Grandma 143–1520, Grandpa 83–1520, Tom 87–1521, Lily 83–1522.                                                                                                              | The page measured these rows. A background scan would catch the cast shadow.                                                                      |
| o   | Gates                      | One phase per group. No Review A, B, or C. One adversarial round runs in Phase 1, because two scripts change. No other phase runs an adversarial round.                                                                                         | The PM rule of 2026-11-25 asks for the lightest gates. The orchestrator may add Review A if it judges the risk higher.                            |
| p   | Identity source            | The drawing is the identity source. The page's direction line names the main features. Green adds no feature that the drawing does not show.                                                                                                    | The owner rejected a model that did not look like its drawing.                                                                                    |

## The measured-base contract

This section extends the redesign spec. It changes three parts.

1. **Three exports.** A base module exports `BASE_CROWN_Y` and `BASE_CHIN_Y` (rest-pose world
   meters on the centre plane) and `BASE_HANDS`
   (`{ L: Hand; R: Hand }` with `palmCentre`, `thumbTip`, and `fingerTip`).
   `Hand` is the `KimHand` type of the redesign spec.
2. **The crown is a model landmark.** The crown row is the projected `BASE_CROWN_Y`. The mask
   gives the sole, the head width, the eye marks, and the face. The mask top may sit above the
   projected crown, because hair may rise above the skull. The mask top may not sit below the
   projected crown, because nothing may hide the skull.
3. **The guards.** The two flat views give equal crown-to-sole heights within 2 px. The projected
   sole sits on the mask's bottom row within 2 px. The mask top row is at or above the projected
   crown row. Every projected model landmark sits on a mask pixel. The chin row is above the hip
   row. The eye row is above the chin row. The side sign guard is unchanged.

The script keeps its loading order. It parses the arguments, checks the asset and the base files,
imports both, then reads the renders. A missing file exits 1 with `asset <name>: not built` or
`base <stem>: not built`, before any import.

The script reads the table from `TABLES[name]`. An unknown name exits 1 with
`unknown table <name>: known kim, child`. An invalid base stem (empty, absolute, a path separator, or
a dot-dot segment) exits 1 with `unknown base <stem>`. An absent base file exits 1 with
`base <stem>: not built` and names the missing path.

The script writes the record to `--record`. The default stays
`out/chibi-sprouts/redesign/measure.json`, so the Mom pin is unchanged. A record path outside `out/`
exits 1 with `record path outside out/: <path>`. A relative path resolves from the repository root.

The script reads the renders that the asset task wrote. A missing render exits 1 with
`render <view>: not built` and names the asset. The pin test does not run a render.

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

The child skeleton uses the adult bone names: `hips`, `spine`, `chest`, `neck`, `head`,
`upperarm.L/R`, `forearm.L/R`, `hand.L/R`, `leg.L/R`, `shin.L/R`, and `foot.L/R`.
The base builds one `idle` clip. The hands are one body named `hands`, with the palms toward the
legs. The base exports the three landmark names of decision (d).

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
2. the record holds the eleven row names, and every value sits inside its range,
3. the record's two palms are `ok`,
4. `TABLES.kim` and `TABLES.child` equal the two tables of this spec, value for value.

The record path is per asset, so two pins can run together without a race. The asset task writes the
flat and lit renders before the pin runs. A missing render fails the pin with the named line.

## Render commands

```bash
./forge render <name> --fast --views front-level,side-level --ortho --flat --bg none --size 1024
./forge render <name> --fast --views front-level,side-level --ortho --bg none --size 1024
```

The first command writes `out/<name>/flat/`. The second writes `out/<name>/views/`. The two
folders are separate, because a render run clears `views/`.

## The look judge and the panels

`scripts/sprout-cast-panel.mjs` writes two kinds of file.

1. `out/chibi-sprouts/cast/<name>-panel.png`: three cells at one 700 px crown-to-sole scale. The
   cells are the lit front render, the lit side render, and the drawing. Every sole sits on one
   baseline. A caption strip holds the asset name, the date, and the row result.
2. `out/chibi-sprouts/cast/cast-sheet.png`: the five lit front renders in one row at the same
   700 px scale, with one baseline and a caption that names the five and Mom.

The script takes the drawing rows of decision (n) from its `DRAWING_ROWS` export. It refuses a
linked `out/chibi-sprouts/cast` folder or a linked output file with one line. It writes no file
outside `out/chibi-sprouts/cast/`. It takes `--root <dir>` so its test can run on a temporary tree.

The judge brief holds the panel path, the drawing path, the eleven rows as text, and the two
scores to give. The judge writes
`measure/runs/chibi_sprouts_cast_20261125/judge-<name>.json` with the model id, the family, the
route, the panel path and its SHA-256, the two scores, one comment per score, and a verdict.

## Gates

| Phase | Gate                                                                                                                                                                                                                                 |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1     | The two tool tests pass. The Mom pin still passes with every row in range. The Mom GLB hash does not change. One adversarial round covers the two scripts.                                                                           |
| 2     | Three pins pass. Three judges score 7.5 or more on both scores. `./forge check` ends `result ok` for each asset. The preset pin gains three keys and changes no value.                                                               |
| 3     | Two pins pass. Two judges score 7.5 or more on both scores. `./forge check` ends `result ok` for each asset. The preset pin gains two keys and changes no value.                                                                     |
| 4     | The panel test passes on synthetic fixtures. The five real panels and the sheet are recorded with their sizes and baselines. The PM handoff holds the five panels, the sheet, the eleven rows per asset, and the five judge records. |

No phase runs Review A, Review B, or Review C (decision o). Phase 1 runs one adversarial round,
because two scripts change. Phases 2 to 4 run no adversarial round. No phase runs a UX review.

The project gate stays `PROJECT_TESTS` with the TD-40 exclusion. `tsc --noEmit` is not a gate while
TD-35 to TD-39 are open. A task records its before and after error count and requires no error in
its changed files.

## Scope

- One child base module.
- Five asset modules.
- Two script changes: `scripts/proportion-check.mjs` and the new
  `scripts/sprout-cast-panel.mjs`.
- Three aliases in `assets/parts/humanoid-kim.ts`.
- Five pin test files and two tool test files.
- Five preset pin keys.
- Five panels, one cast sheet, five judge records, and one handoff note.

## Exclusions

- No cut-out, no sprite, no walk clip, and no gesture clip.
- No song scene, no song render, and no game skin.
- No change to a scrapped source: `assets/sprout-*.ts`, `assets/parts/sprout-gestures.ts`, and the
  `ADULT` and `AGE5` sets of `assets/parts/humanoid-kind.ts`.
- No change to `assets/sprout-mom-kim.ts` and no change to Mom's preset.
- No change to the hero base, the avatar base, the avatar pack, or a shipped asset.
- No change to a game, a song page, the monorepo, or a delivery folder.
- No deletion.
- No paid generation call.
- No customer-facing text.
- No claim that a judge score proves the look. Daniel's look stays the last gate.

## Acceptance criteria

### AC1: the measuring contract holds, and Mom does not move

1. `assets/parts/humanoid-kim.ts` exports `BASE_CROWN_Y`, `BASE_CHIN_Y`, and `BASE_HANDS` as
   aliases. `KIM.crown`, `KIM_CHIN_Y`, and `KIM_HANDS` stay.
2. `scripts/proportion-check.mjs` takes `--base`, `--table`, and `--record`. The defaults are
   `humanoid-kim`, `kim`, and `out/chibi-sprouts/redesign/measure.json`. An unknown value exits 1
   with the named line of "The measured-base contract".
3. The script exports `TABLES`. `TABLES.kim` equals the adult table, value for value.
   `TABLES.child` equals the child table, value for value.
4. The crown of every measured asset is the projected `BASE_CROWN_Y`. The mask-top guard is the
   rule of decision (g).
5. The Mom command still exits 0. Her eleven rows stay inside the adult table. Her GLB hash is
   unchanged before and after the script change.
6. The Mom pin test passes unchanged.
7. A child base that is absent exits 1 with `base humanoid-kim-child: not built`, before any
   import.

### AC2: Dad

1. `assets/sprout-dad-kim.ts` exists. It imports `buildKim` and `KIM` from the adult base.
2. `tests/sprout-dad-kim.test.ts` passes: eleven rows in the adult table and both palms ok.
3. `./forge check sprout-dad-kim` ends `result ok`.
4. A look judge scores identity 7.5 or more and proportion 7.5 or more.
5. The preset pin holds one new key `sprout-dad-kim`, and no existing value changes.

### AC3: Grandma

1. `assets/sprout-grandma-kim.ts` exists and uses the adult base.
2. Her bun may sit above the projected crown. The measured head uses the skull crown, so her
   height in heads is the adult value.
3. `tests/sprout-grandma-kim.test.ts` passes: eleven rows in the adult table and both palms ok.
4. `./forge check sprout-grandma-kim` ends `result ok`.
5. A look judge scores identity 7.5 or more and proportion 7.5 or more.
6. The preset pin holds one new key `sprout-grandma-kim`, and no existing value changes.

### AC4: Grandpa

1. `assets/sprout-grandpa-kim.ts` exists and uses the adult base.
2. `tests/sprout-grandpa-kim.test.ts` passes: eleven rows in the adult table and both palms ok.
3. `./forge check sprout-grandpa-kim` ends `result ok`.
4. A look judge scores identity 7.5 or more and proportion 7.5 or more.
5. The preset pin holds one new key `sprout-grandpa-kim`, and no existing value changes.

### AC5: the child base and Tom

1. `assets/parts/humanoid-kim-child.ts` exists. It imports only `src/index.js`. It builds the
   skeleton with the adult bone names, one `idle` clip, the hands body, and the three landmark
   exports.
2. The derived targets of "The child base" hold in the flat front and side views.
3. `assets/sprout-tom-kim.ts` exists and uses the child base.
4. `tests/sprout-tom-kim.test.ts` passes with `--base humanoid-kim-child --table child`.
5. `./forge check sprout-tom-kim` ends `result ok`.
6. A look judge scores identity 7.5 or more and proportion 7.5 or more.
7. The preset pin holds one new key `sprout-tom-kim`, and no existing value changes.

### AC6: Lily

1. `assets/sprout-lily-kim.ts` exists and uses the child base.
2. The bob keeps the eye band clear. The two eye components stay separate from the hair and the
   brow in the flat front view.
3. The bangs sit above the brow. No hair crosses the chin in the front view and in the side view.
4. `tests/sprout-lily-kim.test.ts` passes with `--base humanoid-kim-child --table child`.
5. `./forge check sprout-lily-kim` ends `result ok`.
6. A look judge scores identity 7.5 or more and proportion 7.5 or more.
7. The preset pin holds one new key `sprout-lily-kim`, and no existing value changes.

### AC7: the panels and the cast sheet

1. `scripts/sprout-cast-panel.mjs` writes the five panels and one cast sheet.
2. Every panel holds three cells at one 700 px body scale: the lit front render, the lit side
   render, and the drawing. Every sole sits on one baseline.
3. The sheet holds five figures at the same scale and one baseline.
4. The drawing rows are the five pairs of decision (n).
5. A missing render exits 1 with `render <view>: not built` for the named asset.
6. A linked output folder or a linked output file exits 1 with one line and is never followed.
7. The panel test passes on the synthetic fixtures under `--root`.
8. T17 records the five real panels and the sheet with their sizes, their mask rows, and their
   baselines. No panel holds the Kim sheet, the Mom panel, or a LATO.2 image.

### AC8: the gates

1. Phase 1 runs one adversarial round on the two scripts. Phases 2 to 4 run none.
2. No phase runs Review A, Review B, or Review C.
3. Every phase records its gate result in the plan.
4. The proportion script, the panel script, and every pin run no paid call and no network call.

### AC9: no customer-facing claim

1. The track writes no page, post, deck, video script, email, or sales text.
2. The panels and the sheet stay local to the worktree and to the PM handoff.
3. The plan and the handoff say that no customer-facing claim is made.

## Known limits

- The judge is one opinion. A 7.5 from one family does not prove the look to Daniel.
- The child body rows are wide. The drawings have one front view each, and the page calls the
  shoulder, hip, knee, and reach rows a ±20 px estimate.
- The eye detector needs the two eyes separate from the skin, the brow, and the hair. A face paint
  that joins an eye to the brow fails the check with a named error, not with a bad value.
- Head width includes the hair. A style that widens the head at the eye line moves
  `headToShoulders`.
- A skirt hides the knee in the drawing and in the render. The measured knee comes from the model
  joint, so the skirt does not move a row.
- Grandma's and Grandpa's glasses and moustache are paint. A 3D frame is not required, and the
  judge may score the face on the paint only.
- The judge sees a still. An animation stays unjudged.
- The preset pin is a shared file. Each task requires one new key per asset and no changed value.
  The check compares parsed JSON, not a diff line count.

## Sources

- [The approved redesign page](../../../docs/chibi-sprouts/redesign-2026-11-23.md)
- [The redesign specification](../chibi_sprouts_redesign_20261123/spec.md)
- [The redesign plan](../chibi_sprouts_redesign_20261123/plan.md)
- [The Mom judge record](../../runs/chibi_sprouts_redesign_20261123/judge-p9-bf4158a.json)
- [The adult base](../../../assets/parts/humanoid-kim.ts)
- [Mom on the adult base](../../../assets/sprout-mom-kim.ts)
- [The proportion script](../../../scripts/proportion-check.mjs)
- [The cast queue](../../../QUEUE.md)
- [Dad's drawing](../../../docs/sprout-mockups/dad.jpg)
- [Grandma's drawing](../../../docs/sprout-mockups/grandma.jpg)
- [Grandpa's drawing](../../../docs/sprout-mockups/grandpa.jpg)
- [Tom's drawing](../../../docs/sprout-mockups/tom.jpg)
- [Lily's drawing](../../../docs/sprout-mockups/lily.jpg)

## Scope control

This track adds one child base, five assets, two scripts, three aliases, seven test files, five
preset keys, and the panel records. It changes no scrapped source, no shipped asset, no game, no
song page, no monorepo file, and no delivery folder. It sends no drawing to an unapproved route,
and it deletes nothing.
