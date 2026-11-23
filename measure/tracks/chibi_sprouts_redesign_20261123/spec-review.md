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
