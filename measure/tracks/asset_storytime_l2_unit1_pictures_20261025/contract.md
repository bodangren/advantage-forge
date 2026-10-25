# Picture pipeline contract

## Commands

Use `node --import tsx scripts/storytime-book-pictures.ts <command>`.

- `plan`: read the packages and write `jobs.json`. Never change a package.
- `render`: render missing candidates sequentially from versioned scene files. Require the current
  source hash to match `jobs.json`.
- `precheck-minimax --paid`: run the MiniMax VLM on one candidate or calibration picture.
- `manifest`: rebuild the manifest from jobs, pictures, and review logs.
- `sheet`: make a labelled contact sheet for human review. Labels stay out of book pictures.
- `verify`: check file structure and review evidence. `--release` requires both model passes and
  a passing person count for every selected candidate.

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

MiniMax writes its log through the CLI. The primary agent writes the Kimi log from the independent
reviewer's native-image result. The reviewer does not edit the candidate or the pipeline.

## Person count logs

One person log lives at `reviews/<job-id>-vN-person.json`. It contains the same file identity,
the page text, observed object counts, `verdict`, `checkedBy`, `checkedAt`, and `evidenceClass`.
The evidence class is `owner-passed` for Daniel or `person-checked` for his named reviewer.
The manifest treats a model pass as a pre-check only.

## Manifest and batch hash

`manifest.json` records all jobs and all candidate versions. A candidate is `ready` only when its
PNG passes structural checks, both model logs pass, and its person log passes. Missing evidence
keeps the candidate `pending`. A failed check keeps it `failed`. The newest ready version is the
selected release candidate. No candidate is marked ready from model results alone.

Each selected file has its own SHA-256. Each week and book kind is a batch. The batch SHA-256 is
the SHA-256 of the canonical JSON array of `{file, sha256}` entries sorted by file. The manifest
records this algorithm.

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
