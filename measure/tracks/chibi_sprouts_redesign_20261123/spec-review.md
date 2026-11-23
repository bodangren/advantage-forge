Author model: opencode-go/deepseek-v4.1-flash

## Created 2026-11-23

- Source: the PM decisions of 2026-11-23 (items 1 and 3) and the approved page
  `docs/chibi-sprouts/redesign-2026-11-23.md`. The owner scrapped the sprout base on 2026-11-23.
  The track starts Mom only, and it stops for PM review after the shape passes.
- Recount of the scrapped users with `grep -rn 'sprout-base\|sprout-adult-base\|sprout-gestures\|humanoid-kind' tests/`:
  three test files import a scrapped source. `tests/sprout-base.test.ts:8` holds one top-level
  `describe`, `tests/sprout-gestures.test.ts:11` holds one, and `tests/sprout-gesture-offset.test.ts`
  holds two (`:199` and `:251`). The count is four skip sites and 15 tests.
  `tests/song-timeline.test.ts` holds only `sprout-pip` strings, and it imports `src/song/timeline.ts`
  alone, so it stays. `tests/preset-colour.test.ts` reads the pin fixture, and two Storytime spec
  tests read the Pat render fixture, so they stay.
- Baseline, checked 2026-11-23: the three files pass, 15 tests, exit 0. The skip retires a contract;
  it does not repair a failure. AC1 records that fact.
- The page's Kim pixel rows were checked against the sheet on 2026-11-23 with a background scan. The
  front figure spans columns 77 to 429, crown row 102, sole row 1195. The page's rows match. Mom's
  drawing spans rows 68 to 1551 with the cast shadow, and the page's rows 71 and 1528 drop it.
- Measurement method: the page measures a drawing by hand. This track keeps the page's landmark
  definitions and formulas word for word. It fixes the source of each landmark in the spec, because
  a silhouette cannot show a joint. The crown, sole, head width, chin, face width, and eye marks come
  from pixels. The shoulder, hip, knee, wrist, and fingertip come from the built model. Every
  projected joint must sit on a mask pixel, so a render that disagrees with the model fails.
- Why two new render options: the page demands level orthographic views, and the Forge camera is
  perspective with an 8-degree front tilt and a 6-degree side tilt. A flat, unlit render gives one
  exact colour per paint mark; a lit, tone-mapped render does not. Decision (e) records the reason.
- Why the preset pin is in scope: `tests/preset-colour.test.ts` fails on an asset that declares
  variants and presets and is absent from the pin. The PM forbids skipping that test. Decision (g)
  bounds the pin diff to one new entry.
- Checked: the two format tracks `old_browser_builtins_20261122` and
  `audio_game_integration_20261014` for the five track files, the registry row, and the metadata
  fields. The new track follows both.
- Checked: `node measure/tools/generate.mjs --check` and `./measure/doctor.sh --structural-only` pass
  on the working tree before the track files land. The two commands run again after the track lands,
  and the plan records the result.

## Open at creation

- PM items 1, 2, and 3 are in the spec as decision rows. Item 2 arrived on 2026-11-23. Item 4 (the
  old_browser A7 scanner fix) belongs to a different track, and this track does not own it.
- Authoring incident, 2026-11-23: one image tool call ran by mistake while this track was written.
  The call used `openrouter/meta/muse-image` with `out/storytime-review/muse-cast/teacher-kim-sheet.png`
  as a reference image, and it wrote `/tmp/opencode/generated-images/image-2026-11-23T08-02-59-374.webp`.
  The intent was to look at the sheet; the tool generates or edits an image, so it is a paid call and
  it sent Kim art to a third party. Decision 1 forbids both.
- Facts the orchestrator confirmed on 2026-11-23: the output file exists, 223,938 bytes (224 KB),
  1920 × 1280, outside the repo. The PM confirmed the provider is the same OpenRouter route as the
  earlier Muse calls, `openrouter/meta/muse-image`, so no new party received our art. The earlier
  Muse calls cost USD 0.01 each (`out/chibi-sprouts/faces-r2/muse/costs.tsv`), so this call is about
  USD 0.01. The amount is an estimate and the PM holds it as unconfirmed. The orchestrator reported
  the incident to the PM on 2026-11-23. The file stays, nothing uses it, and the call is recorded as
  the track's spend in `out/chibi-sprouts/redesign/costs.tsv`.
- Resolved on 2026-11-23: the builder's model family. Decision (i) of the spec fixes the rule rather
  than a model. Green is not the Red family (Red is muse). The orchestrator picks Green at dispatch
  and records the model id in T3. The judge comes from a third family.
- The `--ortho` and `--flat` options touch `src/cli/forge.ts` and `src/render/page.ts`, which other
  tracks also edit. T2 keeps the change to the two named views, the two flags, the camera choice, and
  the `flat/` folder, so a merge stays small.

## Amendment after r1 (2026-11-23)

Source: `measure/runs/chibi_sprouts_redesign_20261123/spec-review-61db4f1.json` (11 blockers, 4
majors, baseline `61db4f1`). Scope: `spec.md`, `plan.md`, and this file. No implementation and no
test change.

- F1 closed: the plan splits the renderer work. T2 Red pins the options with
  `tests/render-options.test.ts` and the pin asset `assets/flat-render-pin.ts`. T3 Green implements
  the options in `src/cli/forge.ts` and `src/render/page.ts`, and names `ORTHO_MARGIN`, `orthoFrame`,
  `useFlatMaterials`, `ViewsRequest.ortho`, `ViewsRequest.flat`, `NAMED_VIEWS['front-level']`, and
  `NAMED_VIEWS['side-level']`. T4 Red then adds the proportion check. The tasks run T1 to T12, and
  each SHA line stays empty.
- F2 closed: `tests/sprout-base.test.ts` and `tests/sprout-gestures.test.ts` skip wholly, and their
  test names are listed in AC1. `tests/sprout-gesture-offset.test.ts` keeps the hero assertions of
  lines 209-210, 220, and 243-244 in a new active describe `hero clip contracts (not scrapped)`, with
  three named tests. The other two describes skip nine named tests. The three files then hold 18
  tests: 3 pass and 15 skip.
- F3 closed: the spec names the export `KIM_CHIN_Y` in `assets/parts/humanoid-kim.ts`, its data shape
  and its import path from the proportion script. It fixes the face and eye rules: the skin and eye
  colours, the skin and dark pixel tests, the face window and component, the 8-connected rule, the
  face centre fallback, the face area and width, the eye band, the qualifying test, the exact count
  of two, the mean widths and heights, the bounding-box pupil centre, the row and spacing rules, and
  the named failure for an empty, extra, or edge-touching component.
- F4 closed: AC3 and "The hand rules" take the vertices of each side in world space (x > 0 and
  x < 0), state the unweighted covariance, the degenerate test, the sign that orients each normal
  toward the body, and the signed pass: left `n·x̂ ≤ −0.906`, right `n·x̂ ≥ 0.906`. The test covers
  both hands and a mirrored cloud.
- F5 closed: "The hand rules" fix the band rows with the 10 % cut, the body run, the hand run on each
  side, the widest-run choice, the 80 % row floor, the 2 px gap, the median front width, and the
  0.60 depth factor. The hand depth comes from the model, with the reason that the side mask and the
  forearm row cannot separate the hand.
- F6 closed: the spec holds the flat pixel contract: the material swap and its fields, the hidden
  ground, the sRGB output and `toneMapped: false`, the 1 of 255 base-colour and 24 of 255 paint
  tolerance, the alpha 128 mask and alpha 250 colour rule, the `--fast` and `--bg none`
  requirement, the named error, and the material restore. T2 counts seven renderer cases.
- F7 closed: decision (j) and the projection table set the side column to `u = (cz − z)·ppm + W/2`,
  because `Studio.aim` puts the azimuth-90 camera at +X with image right at −Z. AC2 adds a guard and
  T2 a case: the frontmost mask column in the head band sits left of `W/2`.
- F8 closed: decision (k) and AC4 give the judge `mom-panel.png`, which holds Mom's lit front and
  side renders and Mom's drawing. The Kim sheet stays local to the PM sheet. AC4 rule 7 and the
  standing rules stop the task when a route would send Kim art.
- F9 closed: T11 and T12 stay `deferred:pm`. AC6 says an amendment adds the walk clip source as its
  own Red and Green task pair. T12 asks for an idle sprite sample only, and AC6 rule 2 forbids a
  cut-out or a sprite before the approval only.
- F10 closed: T6 Red adds `tests/mom-kim-sheet.test.ts` with seven layout cases, and T7 Green writes
  `scripts/mom-kim-sheet.mjs`. T8 is the judge task only, and it writes `judge.json` alone.
- F11 closed: AC2 rule 7 lists five synthetic figures with independent mutations and expected rows:
  the pass figure, a higher crown for `heightInHeads`, a lower sole for `legShare`, a wider head for
  `headToShoulders`, and merged eyes for the named eye-component failure.
- F12 closed: T5 compares the parsed pin with the role baseline and requires one new key and no
  changed value, per decision (g). The diff-line check is gone.
- F13 closed: the derived table solves `0.045² + (T + 0.133)² = (1.33 T)²` for an explicit 0.045 m
  horizontal reach. The torso height becomes 0.409 m, the shoulder 0.994 m, and the arm 0.544 m.
- F14 closed: T9 hands off and writes nothing. T10 records the handoff date, the PM answer, and the
  next task. T9 no longer requires a plan update.
- F15 closed: decision (l) and AC5 name the lit views, the `rows.lit` source in `measure.json`, the
  page's reference rows for both panels of each reference, and the 4 px check of each side figure's
  rows.

## Amendment after r2 (2026-11-23)

Source: `measure/runs/chibi_sprouts_redesign_20261123/spec-review-80ff571.json` (blockers F3, F4, F5,
F8, F16, F17; major F15; nit F18; baseline `80ff571`). Scope: `spec.md`, `plan.md`, and this file. No
implementation and no test change.

- F3 closed: the spec adds "Evaluation order" with twelve numbered steps. Step 4 takes the head width
  over the rows to `crown + 0.70·headHeight`, so it needs no eye value. Step 7 sizes the eye
  components by the window area, not the face area. Step 10 builds the face seed from the two eye
  centres. Step 11 finds the face component, and step 12 takes its area and width. Every step names
  its empty, extra, or edge failure.
- F4 closed: the base exports `KIM_HANDS` with `palmCentre`, `thumbTip`, and `fingerTip` per side. The
  palm direction `d` is signed, the palm patch is the triangles near the palm plane, and the
  area-weighted sum of their winding normals must agree with `d` by 0.90. Landmark contact and the
  radial-front thumb rule follow. AC3 adds three breakage cases: flipped winding, a mirrored cloud,
  and a 180 degree turn about the finger axis.
- F5 closed: "The front hand edge" builds the leg column window from the projected hip and ankle of
  each side, names the leg run, the hand run, and every row without one, counts rows, and fails the
  figure only under 80 % of the band rows. The gap is per row with a named row, and the front width is
  a median.
- F8 closed: the standing rules and decision (k) now follow the PM wording. Kim art goes to no remote
  model, no demo, and no third party, and our own VM is allowed. Mom's render and Daniel's drawing may
  use an established look-judge route. The judge sees `mom-panel.png` and the numeric rows, and the
  Kim sheet stays local. AC4 rule 7 stops the task when the PM demands a local-only judge.
- F15 closed: AC5 fixes the row sources. The render rows come from the two lit masks under
  `rows.lit`. Kim's side panel rows come from the background scan, held within 4 px of 102 and 1195.
  Mom has no side drawing, so no scan runs on one; the Mom side cell holds the render only and the
  third cell holds the text `no side drawing`.
- F16 closed: every Red task commits `tests/` paths only, and the plan states the gate rule. The
  renderer pin writes `assets/_flat-render-pin.ts` at run time and removes it in a `finally` block.
  The measurement script is Green (T6). The tasks run T1 to T14: T1 and T2 Red, T3 Green, T4 and T5
  Red, T6 and T7 Green, T8 Green, T9 the LATO.2 trial, T10 the judge, T11 and T12 the PM stop, and
  T13 and T14 deferred.
- F17 closed: the spec adds "How the script loads its inputs". The script parses the arguments,
  checks `assets/<name>.ts` and the GLB, exits 1 with `asset <name>: not built`, and only then runs
  `await import()` on the asset and the base module. AC2 rule 2 and T4 expect that named error before
  the asset exists.
- F18 closed: Phase 6 holds T9, the LATO.2 GPU trial under the USD 5 cap, with the approval quote in
  decision L and in the Exclusions. The task fixes the Spot L4 and the fallback, the region, the
  project, the 3 hour cap, the five steps, the delete and verify rule, the log header, and the result
  note. AC7 holds its acceptance, and the spec says the trial feeds the PM decision and does not
  replace the SDF base.
