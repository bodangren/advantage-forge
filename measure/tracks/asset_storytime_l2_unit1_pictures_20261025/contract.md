# Picture pipeline contract

## Commands

Use `node --import tsx scripts/storytime-book-pictures.ts <command>`.

- `plan`: read the packages and write `jobs.json`. Never change a package.
- `generate --paid`: make missing candidates sequentially. Require the current source hash to match
  `jobs.json`.
- `precheck-minimax --paid`: run the MiniMax VLM on one candidate or calibration picture.
- `manifest`: rebuild the manifest from jobs, pictures, and review logs.
- `sheet`: make a labelled contact sheet for human review. Labels stay out of book pictures.
- `verify`: check file structure and review evidence. `--release` requires both model passes and
  a passing person count for every selected candidate.

Every paid command also has a dry-run mode. Dry runs make no provider call and write no ledger
entry. The output root must stay inside the Forge `out/` directory.

## Source jobs

`jobs.json` holds 112 jobs. A job has:

- `id`: `w01-readalong-p01` through `w07-decodable-p08`.
- `week`, `bookKind`, `bookTitle`, `page`, `text`, `sourcePrompt`, and `characters`.
- `sourcePackage`: the read-only Workbooks package path.
- `sourceSha256`: the package hash at planning time.
- `prompt`: house style, source prompt, character looks, scene-age rule, and no-text rule.
- `slug`: a short description of the pictured subject, not a gesture.
- `directory`: `w01/readalong` or the matching week and book kind.

The initial full source extraction has 16 jobs per week. A week filter never changes the source
hash recorded in the complete job file.

## Candidate files

A candidate file is `<directory>/pNN-<slug>-vNN.png`. Versions start at 1 and increase after every
change. A retry never overwrites an earlier picture. Generated provider files stay under
`candidates/<job-id>/vNN/`; delivery pictures are opaque PNG files at 1024 x 1024 initially.

## Paid-call ledger

`cost-ledger.jsonl` is the only cost ledger. A `before-call` entry precedes every provider call.
It contains `callId`, `recordedAt`, `operation`, `provider`, `model`, `purpose`, `jobId`, `version`,
and `price`. The price records the existing-plan basis and the zero marginal cash estimate.
An `after-call` entry with the same `callId` records success or failure. A failed call remains in
the ledger.

## Model pre-check logs

One review log lives at `reviews/<job-id>-vNN-<provider>.json`. It contains:

- `kind: model-pre-check`, `jobId`, `version`, `file`, `provider`, and `model`.
- `price`, `rubricVersion`, `sourceText`, `sourcePrompt`, and `time: still`.
- `verdict: pass | fail`, `reason`, `observedCounts`, `issues`, and `rawOutput`.
- `checkedAt` and the output file's SHA-256.

MiniMax writes its log through the CLI. The primary agent writes the Kimi log from the independent
reviewer's native-image result. The reviewer does not edit the candidate or the pipeline.

## Person count logs

One person log lives at `reviews/<job-id>-vNN-person.json`. It contains the same file identity,
the page text, observed object counts, `verdict`, `checkedBy`, `checkedAt`, and `evidenceClass`.
The evidence class is `owner-passed` for Daniel or `person-checked` for his named reviewer.
The manifest treats a model pass as a pre-check only.

## Manifest

`manifest.json` records all jobs and all candidate versions. A candidate is `ready` only when its
PNG passes structural checks, both model logs pass, and its person log passes. Missing evidence
keeps the candidate `pending`. A failed check keeps it `failed`. The newest ready version is the
selected release candidate. No candidate is marked ready from model results alone.

## Calibration

Calibration uses the same rubric and both providers before book production:

1. `bad-one-sun`: the known bad gesture thumbnail must fail against "How many suns? One sun!".
2. `good-pat`: the owner-approved Pat character picture must pass against its character contract.

Calibration logs live in `calibration/` and use the same review fields and ledger. A failed
calibration blocks production until the rubric or provider call is corrected.

## Automated checks

- Source packages yield 112 jobs and 16 jobs per week.
- Prompt construction preserves the source prompt and adds the age and no-text rules.
- Filenames describe the subject and carry a version.
- Output paths cannot escape the Forge `out/` directory.
- A source hash change stops generation.
- PNG files have the expected dimensions and no alpha-only content.
- `--release` fails on missing files, missing model providers, failed verdicts, or missing person
  counts.
- Contact-sheet labels never modify a candidate PNG.
