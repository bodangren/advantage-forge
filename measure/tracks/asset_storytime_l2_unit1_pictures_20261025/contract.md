# Picture pipeline contract

## Commands

Use `node --import tsx scripts/storytime-book-pictures.ts <command>`.

- `plan`: read the packages and write `jobs.json`. Never change a package.
- `render`: render missing candidates sequentially from versioned scene files. Require the current
  source hash to match `jobs.json`. One render of a reader page writes the color twin and the
  line-art twin together. `--dry-run` prints both planned paths and renders nothing.
- `render` usage note: the candidate version is the stage version. Without `--version`, `render`
  uses the newest existing version. If that version is complete, it reports `skipped` and prints
  `next free version: vN`. To make a new version, write the stage file `<job-id>-vN.json` and pass
  `--version N`.
- `lineart-smoke --job <id>`: one bounded smoke run for Phase 2 task 3. It writes one still and one
  fixture pass under `smoke/lineart-<UTC stamp>/` and prints labeled checks. It writes no
  candidate, version, evidence, manifest entry, or ledger line. `manifest` and `verify` ignore
  `smoke/`.
- `precheck-minimax --paid`: run the MiniMax VLM on one candidate or calibration picture. Each call
  writes its raw output to a new file under `raw/` with the `callId` in the name, as the Kimi raw
  files do. A call never overwrites an earlier raw file.
- `precheck-kimi --begin`: write the before-call ledger entry and the review prompt.
- `precheck-kimi --record <callId> --raw <file>`: write the after-call entry with `status: success`
  and the Kimi log from the reviewer's raw native-image output.
- `precheck-kimi --record <callId> --failed --reason <text>`: write the after-call entry with
  `status: failure` and the reason. It writes no log and no raw file. `--failed` with `--raw` is
  refused. An empty reason is refused.
- Both record modes refuse a `callId` with no before-call entry and a `callId` that already has an
  after-call entry. They also refuse a `--calibration`, `--job`, or `--version` value that differs
  from the before-call entry. A refused record writes nothing.
- `manifest`: rebuild the manifest from jobs, pictures, and review logs.
- `sheet`: make a labelled contact sheet for human review. Labels stay out of book pictures. A
  reader page shows its color twin and its line-art twin side by side.
- `verify`: check file structure and review evidence. `--release` requires both model passes and
  a passing person count for every selected color candidate. For a reader page, `--release` also
  requires a ready line-art twin. `--output color` or `--output lineart` limits the check to one
  output kind. An empty selection always fails. `--release` first runs the calibration gate
  (`assertCalibrationReady`). Missing, stale, or changed calibration fails the release.

Every paid command also has a dry-run mode. Dry runs make no provider call and write no ledger
entry. The output root must stay inside the Forge `out/` directory.

Every render batch first runs the live heavy pre-flight check. A `hold` stops the batch. The batch
then uses `scripts/heavy-lock.ts`. A lock wait over ten minutes goes to the PM in one line.

## Source jobs

`jobs.json` holds 112 jobs. A job has:

- `id`: `w01-readalong-p01` through `w07-decodable-p08`.
- `week`, `bookKind`, `bookTitle`, `page`, `text`, `sourcePrompt`, and `characters`.
- `sourcePackage`: the read-only Workbooks package path.
- `sourceSha256`: the package hash at planning time.
- `slug`: a short description of the pictured subject, not a gesture.
- `directory`: `w01/readalong` or the matching week and book kind.
- `use`: `readalong`, `decodable`, `cover`, or `small`.
- `size`: `story`, `cover`, or `small`.

The initial full source extraction has 16 jobs per week. A week filter never changes the source
hash recorded in the complete job file.

## Scene files

A versioned scene file lives at `docs/storytime/l2-unit1/wNN/<job-id>-vN.json`.
It names approved Forge actors, poses, props, map, marks, and camera. The scene file preserves the
source prompt's content. It contains no song, audio, or video instructions.

The render size is a parameter of the render. The stage file contains no output size. Stage
files and their cameras are kept and versioned. A render at a larger size, such as an A3 teacher
print, uses the same stage file and camera and writes a new version. A3 (about 1.414:1) differs
from the 4:3 story ratio, so an A3-ratio render changes the framing. The final print size and
ratio wait for picture specification v1. The teacher color PDF layout stays with Workbooks.

The renderer uses the existing in-scene GLB engine. A book page is a still at a declared time.
The renderer does not run a song or video command. The manifest records the scene file and its
SHA-256 for each candidate.

## Candidate files

A story candidate is `<directory>/l2-wNN-<use>-<slug>-vN.png`. Versions start at 1 and increase
after every change. A retry never overwrites an earlier picture.

- Story pages: 3000 x 2250, 4:3.
- Covers: 3600 x 2700, 4:3, with a calm top 30 percent.
- Small pictures: 1500 x 1500 on white.
- Every file is an opaque 8-bit sRGB PNG. There is no bleed.
- No picture contains words, letters, numbers, signatures, or watermarks.

Provider review scratch stays under `candidates/<job-id>/vN/`.

## Line-art twins (provisional format)

Each reader page (`readalong` and `decodable`) has a line-art twin for print. The cover and small
pictures have no line-art twin unless picture specification v1 asks for one. The format below is
provisional until Workbooks picture specification v1 (due 2026-10-28).

### Source and technique

- The line-art twin comes from the same render run as its color twin. The run uses the same stage
  file bytes, the same still time, and the same camera. One page load and one seek give both twins.
- The render capture `captureBookStill` opens the page and calls `window.__song.load(timeline)`. It
  checks the returned page notes with `assertPageNotes`. Only then does it seek. `render` uses
  `captureBookStill` by default. The smoke capture uses the same load step.
- The line art is a render pass of the same three.js scene. A threshold then makes the picture
  1-bit. The lines show silhouettes and form edges. Examples: depth and normal discontinuities, a
  material-ID edge pass, or an inverted-hull outline.
- Hidden edges stay hidden. A line behind a closer surface does not show.
- Mesh triangle edges never show. A smooth surface has no lines inside its silhouette. A wireframe
  material, a `WireframeGeometry`, and a line object without the depth test are not allowed.
- A depth edge uses the view distance, not the packed depth value. The pass converts each depth
  sample to the distance from the camera with the camera `near` and `far` values. It compares two
  neighbor samples by the relative gap `|a - b| / min(a, b)`.
- A relative gap of 7.5 percent (4.0 m and 4.3 m) is a depth edge. A relative gap of 0.5 percent
  (4.0 m and 4.02 m) is not a depth edge. The implementer sets the limit between these values.
- `lineArtTechnique` names one technique. A change to the pass, a threshold, or the depth rule needs
  a new ID. The view-distance pass is `song-page-form-edges-viewdepth-1bit-v2`. The ID `song-page-scene-render-pass-1bit-v1` names only the passes before it.
- A filter of the color PNG alone is not allowed. It loses the scene geometry. A filter of the
  color picture can add painted features, such as eyes and mouths, to the scene-pass edges.
- The color twin keeps the song engine's look. The book page does not copy scene-building code
  from `src/song/main.ts`.
- The engine hook: `src/song/main.ts` publishes `window.__bookStill` at the end of each `seek`,
  after the frame render. It holds the scene, the camera, the renderer, and a value copy of the
  camera state. `load` clears it. The hook is additive. It changes no song rendering, no timing,
  and no part of `window.__song`. Phase 2 task 3 owns it, with `tests/song-timeline.test.ts` in
  its gate and a PM note. Any other song-engine change stops the implementer for a new task.
- The recorded camera state is the state of the color still. The capture reads it after the seek
  and before the line-art pass.
- The pass restores everything that it changes: the camera aspect and projection matrix, the
  renderer size and pixel ratio, the render target, the clear color and alpha, the scene
  background, the override material, and object visibility and materials. It disposes each render
  target and material that it makes.
- The capture reads the camera three times. Read 1, after the seek, is the published copy
  `window.__bookStill.cameraState`. Read 1 is the evidence camera.
- Read 2, before the pass, and read 3, after the pass, read the live `window.__bookStill.camera`:
  position, field of view, aspect, near, far, and the 16 projection matrix elements.
- Read 1 must equal read 2 in position, field of view, aspect, near, and far. Read 3 must equal
  read 2 in every field. Any difference is a camera drift. A second read of the published copy is
  never a drift check.
- After read 3, the capture seeks the same time again and takes a second color screenshot. A camera
  drift or a pixel difference between the two color screenshots fails the run.
- A failure in the line-art pass writes neither twin. A color twin never exists without its
  line-art twin for a reader page.

### Filename

A line-art twin is `<directory>/lineart/l2-wNN-<use>-<slug>-vN-lineart.png`. The `<use>`,
`<slug>`, and `vN` values are the same as its color twin. The `-lineart` suffix after the version
keeps the name outside the Workbooks color pattern. The rename to the specification v1 name
changes only the name. The manifest records the old name and the new name.

A twin version is one render run. A change to either twin makes a new version of both twins. A
retry never overwrites an earlier line-art picture.

### Format checks (interim)

- The width and the height are equal to the color twin's width and height.
- The file is an opaque PNG with one 8-bit grey channel and no alpha channel.
- After decoding, every pixel is exactly 0 (black) or 255 (white). One grey pixel fails the file.
- White background: 255 is the most frequent value. At least 90 percent of the pixels in an
  edge frame 2 percent wide are white.
- Ink coverage: the black-pixel share is at least 0.5 percent and at most 25 percent. The check
  prints the measured share as a labeled value. An empty page and a flooded page fail.
- No words, letters, numbers, signatures, or watermarks. There is no bleed.
- The 90, 0.5, and 25 percent limits are provisional. A change to a limit needs a contract change
  and a new `lineArtFormatVersion`. Specification v1 replaces these limits where it differs.

### Render evidence

One render evidence record per job version binds both twins. It contains `renderer`, `jobId`,
`version`, `stageFile`, `stageSha256`, `at`, `camera`, `colorFile`, `colorSha256`, `lineArtFile`,
`lineArtSha256`, `lineArtFormatVersion`, `lineArtTechnique`, `width`, `height`, and `warnings`. The `camera` value is
the camera state that the page reports after the seek: position, target, and field of view. The
record has one value for each of the stage hash, the time, and the camera. A twin with a
different value is not a twin.

### Line-art review and release

- Model pre-checks are not required for line art. A model result on line art is recorded as
  `model-pre-check` only and never changes the line-art status.
- One person look log lives at `reviews/<job-id>-vN-lineart-person.json`. It has the person-log
  fields and the line-art file SHA-256. Its verdict records that every counted object of the page
  is visible as lines.
- One style look record lives at `reviews/lineart-style-look.json`. It records Daniel's look at
  the Nan window sample, relayed by the PM: `verdict`, `checkedBy`, `relayedBy`, `checkedAt`,
  `sampleFiles` with SHA-256, `lineArtTechnique`, `lineArtFormatVersion`, and
  `evidenceClass: owner-passed`. The technique and format values come from the sample's render
  evidence.
- The style look applies to one technique and one format version, not to one file. The sample
  files are only the evidence of the look.
- The style look passes for a twin when all of these are true: the record has `verdict: pass` and
  `evidenceClass: owner-passed`; each `sampleFiles` SHA-256 equals the SHA-256 of that sample
  file; and the twin's render evidence has the record's `lineArtTechnique` and
  `lineArtFormatVersion`.
- A twin with another technique or format version stays `pending` until a new style look passes.
  An empty or absent `sampleFiles` list, a missing sample file, or a different sample SHA-256
  makes the style look invalid. Then every twin that uses the look is `failed`.
- A line-art twin is `ready` only when it passes the format checks, its render evidence binds it to
  its color twin, the color twin is `ready`, its person look passes, and the style look passes.
  Missing evidence keeps it `pending`. A failed check or look makes it `failed`.

## Paid-call ledger

`cost-ledger.jsonl` is the only cost ledger. A `before-call` entry precedes every paid provider
call. It contains `callId`, `recordedAt`, `operation`, `provider`, `model`, `modelSource`,
`purpose`, `jobId`, `version`, and `price`. The price records the existing-plan basis and the zero
marginal cash estimate. An `after-call` entry with the same `callId` records success or failure.
A failed call remains in the ledger. Local Forge renders have no paid-call entry.

- Each `callId` has one `after-call` entry at most. A failed call without a raw answer gets its
  entry from the `precheck-kimi --failed` mode or from the MiniMax runner.
- Paid calls run one at a time. A `before-call` entry comes after the `after-call` entry of the
  call before it.
- `modelSource` is `declared` when the model value comes from this pipeline. It is `reported` when
  the provider output names the model. A `before-call` entry is always `declared`.

## Model pre-check logs

One review log lives at `reviews/<job-id>-vN-<provider>.json`. It contains:

- `kind: model-pre-check`, `jobId`, `version`, `file`, `provider`, `model`, and `modelSource`.
- `callId` and `rawFile`: the call that made the log and its raw output file under `raw/`.
- `price`, `rubricVersion`, `sourceText`, `sourcePrompt`, and `time: still`.
- `verdict: pass | fail`, `reason`, `observedCounts`, `issues`, and `rawOutput`.
- `checkedAt` and the output file's SHA-256.

A new call on the same target replaces the log. Earlier raw files stay, and the ledger keeps every
call. MiniMax writes its log through the CLI. The task executor writes the Kimi log through `precheck-kimi --record` from the independent reviewer's raw native-image output. The orchestrator stays read-only. The reviewer does not edit the candidate or the pipeline.

## Person count logs

One person log lives at `reviews/<job-id>-vN-person.json`. It contains the same file identity,
the page text, observed object counts, `verdict`, `checkedBy`, `checkedAt`, and `evidenceClass`.
The evidence class is `owner-passed` for Daniel or `person-checked` for his named reviewer.
The manifest treats a model pass as a pre-check only.

## Manifest and batch hash

`manifest.json` records all jobs and all candidate versions. A color candidate is `ready` only when
its PNG passes structural checks, both model logs pass, and its person log passes. The line-art
section defines the line-art `ready` rule. Missing evidence
keeps the candidate `pending`. A failed check keeps it `failed`. The newest ready version is the
selected release candidate. No candidate is marked ready from model results alone.

Each selected file has its own SHA-256. Each week, book kind, and output kind (`color` or
`lineart`) is a batch, for example `w01/readalong/color` and `w01/readalong/lineart`. A line-art
change thus never changes a color batch hash. The batch SHA-256 is the SHA-256 of the canonical
JSON array of `{file, sha256}` entries sorted by file. The manifest records this algorithm.

The manifest lists each line-art twin under its job version with its file, SHA-256, color twin
file, render evidence file, status, and any provisional name. The newest ready line-art version
is the selected line-art release candidate.

## Calibration

Calibration uses the same rubric and both providers before book production:

1. `bad-one-sun`: the known bad gesture thumbnail must fail against "How many suns? One sun!".
2. `good-nan`: the owner-approved Nan cutout must pass against its character contract.

The call text of `good-nan` has no approval words. `sourceText` is `Hello, I am Nan.`. The
`sourcePrompt` is the character part of the Workbooks image prompt for `w01-readalong-p05`
(`../Workbooks/content/storytime/l2/w01.json`), without the scene part:

`Nan, a five-year-old girl with large dark-brown eyes, short black hair in two small bunches, an orange T-shirt with a white star, red shorts, and white sneakers.`

Calibration logs live in `calibration/` and use the same review fields and ledger. A failed
calibration blocks production until the rubric or provider call is corrected.

The render gate (`assertCalibrationReady`) checks each of the four logs:

- the expected verdict and a non-empty `rawOutput`;
- `rubricVersion` equal to `PICTURE_RUBRIC_VERSION`;
- `fileSha256` equal to the SHA-256 of the calibration source file;
- `sourceText` and `sourcePrompt` equal to the current calibration target.

One failed check blocks every render. After the `good-nan` text change, the old `good-nan` logs
block the render until `good-nan` runs again on both providers.

## Security rules

- The render wrapper starts `heavy-run.sh` in its argument form. Each CLI argument is one array
  element. No code builds a shell string from a CLI argument.
- The capture server listens on `127.0.0.1`. Under `/out/` it serves only `out/<name>/<name>.glb`
  Forge asset files. Under `/stage/` it serves only the picture files that the loaded timeline names.
- Before a read, the real path of the file must be inside the real `out/` or stage directory. It
  must be outside the real `out/storytime/` tree. This exclusion applies to model and stage reads.
  The server returns and reads the checked real path, not the request candidate. The server never
  serves the ledger, `raw/`, `calibration/`, `candidates/`, or `reviews/`.
- The Vite deny list retains `.env`, `.env.*`, `*.{crt,pem}`, and `**/.git/**`. It adds
  `<absolute-repoRoot>/out/storytime/**`. A relative Storytime pattern does not satisfy this rule.
- No raw answer, review log, ledger entry, failure reason, thrown error, or CLI error log holds a
  credential. A raw answer or failure reason with a credential is refused before evidence writes.
- One shared function checks every decoded key and string value of every JSON object that the provider answer yields.
  It traverses every depth, unknown fields, arrays, model envelopes, and objects decoded from embedded JSON strings, including `content`.
  It calls `secretFindings` before schema validation, field selection, or fallback can discard data.
  Both providers check before a success entry, review write, raw copy, or result log.
  MiniMax checks inside the paid callback and may append only its sanitized failure entry after refusal.
  Kimi checks before any record write. A refused record leaves the begin ledger and source raw file unchanged.
- Both decoded-refusal messages name only the pattern. Both use this suffix: `the raw answer is refused; no review or raw copy is written.`
- Provider error text is redacted and cut to 500 characters.
  The thrown provider error and final CLI error log follow the same redaction and length limit.
- Safe reported MiniMax models stay unchanged. Kimi keeps its declared model and `modelSource` behavior.
- A safe raw answer is kept byte for byte. A `--raw` file must be a regular file of at most 65,536
  bytes, in UTF-8 with no NUL byte. A symlink is refused. A failure reason has 500 characters at most.

## Automated checks

- Source packages yield 112 jobs and 16 jobs per week.
- Filenames follow the Workbooks pattern and describe the subject.
- Output paths cannot escape the Forge `out/` directory.
- A source hash or scene hash change stops rendering.
- Story PNG files are 3000 x 2250, opaque, 8-bit sRGB, and non-empty.
- The cover's top 30 percent has no focal actor or prop.
- `--release` fails on missing files, missing model providers, failed verdicts, or missing person
  counts.
- Contact-sheet labels never modify a candidate PNG.
- Heavy commands run the pre-flight check before taking the heavy lock.
- Line-art twins have the color twin's size, only 0 and 255 pixel values, a white background,
  ink coverage inside the limits, and no alpha channel.
- Line-art names never match the Workbooks color pattern, and color names never match the
  line-art pattern.
- The render evidence binds both twins to one stage hash, one time, and one camera.
- The line-art pass uses no wireframe material and restores the camera and the renderer.
- `captureBookStill` loads the timeline before the first seek. The live camera reads detect drift.
- A depth edge uses the relative view-distance gap. The render evidence names the technique ID.
- A line-art twin outside the sample becomes `ready` with the sample's technique and format version.
- The calibration gate checks the rubric version, the file hash, and the source text.
- `--release` fails on a missing, unbound, failed, or unreviewed line-art twin of a reader page.
