# Picture pipeline contract

## Commands

Use `node --import tsx scripts/storytime-book-pictures.ts <command>`.

- `plan`: read the packages and write `jobs.json`. Never change a package.
- `render`: render missing candidates sequentially from versioned scene files. Require the current
  source hash to match `jobs.json`. One render of a reader page writes the color twin and the
  line-art twin together. `--dry-run` prints both planned paths and renders nothing.
- `lineart-smoke --job <id>`: one bounded smoke run for Phase 2 task 3. It writes one still and one
  fixture pass under `smoke/lineart-<UTC stamp>/` and prints labeled checks. It writes no
  candidate, version, evidence, manifest entry, or ledger line. `manifest` and `verify` ignore
  `smoke/`.
- `precheck-minimax --paid`: run the MiniMax VLM on one candidate or calibration picture.
- `precheck-kimi --begin` and `precheck-kimi --record <callId> --raw <file>`: write the before-call ledger entry and the review prompt, then write the after-call entry and the Kimi log from the reviewer's raw native-image output.
- `manifest`: rebuild the manifest from jobs, pictures, and review logs.
- `sheet`: make a labelled contact sheet for human review. Labels stay out of book pictures. A
  reader page shows its color twin and its line-art twin side by side.
- `verify`: check file structure and review evidence. `--release` requires both model passes and
  a passing person count for every selected color candidate. For a reader page, `--release` also
  requires a ready line-art twin. `--output color` or `--output lineart` limits the check to one
  output kind. An empty selection always fails.

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
- The line art is a render pass of the same three.js scene. A threshold then makes the picture
  1-bit. The lines show silhouettes and form edges. Examples: depth and normal discontinuities, a
  material-ID edge pass, or an inverted-hull outline.
- Hidden edges stay hidden. A line behind a closer surface does not show.
- Mesh triangle edges never show. A smooth surface has no lines inside its silhouette. A wireframe
  material, a `WireframeGeometry`, and a line object without the depth test are not allowed.
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
- After the pass, the capture reads the camera state again, seeks the same time again, and takes a
  second color screenshot. A camera state drift or a pixel difference between the two color
  screenshots fails the run.
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
  `sampleFiles` with SHA-256, and `evidenceClass: owner-passed`.
- A line-art twin is `ready` only when it passes the format checks, its render evidence binds it to
  its color twin, the color twin is `ready`, its person look passes, and the style look passes.
  Missing evidence keeps it `pending`. A failed check or look makes it `failed`.

## Paid-call ledger

`cost-ledger.jsonl` is the only cost ledger. A `before-call` entry precedes every paid provider
call. It contains `callId`, `recordedAt`, `operation`, `provider`, `model`, `purpose`, `jobId`,
`version`, and `price`. The price records the existing-plan basis and the zero marginal cash
estimate. An `after-call` entry with the same `callId` records success or failure. A failed call
remains in the ledger. Local Forge renders have no paid-call entry.

## Model pre-check logs

One review log lives at `reviews/<job-id>-vN-<provider>.json`. It contains:

- `kind: model-pre-check`, `jobId`, `version`, `file`, `provider`, and `model`.
- `price`, `rubricVersion`, `sourceText`, `sourcePrompt`, and `time: still`.
- `verdict: pass | fail`, `reason`, `observedCounts`, `issues`, and `rawOutput`.
- `checkedAt` and the output file's SHA-256.

MiniMax writes its log through the CLI. The task executor writes the Kimi log through `precheck-kimi --record` from the independent reviewer's raw native-image output. The orchestrator stays read-only. The reviewer does not edit the candidate or the pipeline.

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

Calibration logs live in `calibration/` and use the same review fields and ledger. A failed
calibration blocks production until the rubric or provider call is corrected.

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
- `--release` fails on a missing, unbound, failed, or unreviewed line-art twin of a reader page.
