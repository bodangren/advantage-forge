# Specification: Storytime Level 2 unit 1 book pictures

## Overview

Daniel's order of 2026-10-25 resumes Storytime release 1 picture work. The order lifts the
2026-10-24 stop for this scope only. Song and video renders remain paused.

The source packages are `Workbooks/content/storytime/l2/w01.json` through `w07.json`.
Forge reads those files without changing them. The source holds 112 book pages: 16 pages in each
of seven weeks. Each week has one eight-page read-along and one eight-page decodable.

Week 1 contains "Hello!" and "Nan Can Nod". Its pictures are due 2026-11-01. Weeks 2 to 7 and
the Level 2 cover render are due 2026-11-15.

## Decisions and boundaries

- The books use the Primary printed picture-book style from design section 6.5 and decision S7.
- Chibi Sprouts remains the app and video style. This track does not change the approved models.
- Race and ethnicity stay unmarked. Prompts describe hair, clothes, eyes, and the scene.
- Decision S19 assigns cover layout and text to Workbooks. Forge supplies the cover render only.
- The Workbooks print track will supply the picture size specification. Week 1 starts at
  1024 x 1024 pixels and aligns after that specification arrives.
- The delivery root is `out/storytime/l2/unit1/`.
- Forge writes only inside this repository. No Workbooks or monorepo file changes are allowed.
- No bucket upload, deployment, public release, deletion, song render, or video render is allowed.

## Functional Requirements

1. **FR-1 Source extraction.** Extract all 112 page prompts, texts, books, and character lists
   from the seven source packages. Record a source hash for each package.
2. **FR-2 Week order.** Produce and review week 1 before starting batch production for later weeks.
3. **FR-3 Prompt contract.** Keep each source scene prompt unchanged. Add the house style and
   character looks. The scene age overrides an older age in a character look.
4. **FR-4 Picture contract.** Produce one opaque PNG per book page. Pictures contain no words,
   letters, numbers, signatures, or watermarks.
5. **FR-5 Version contract.** Use descriptive versioned filenames. Never overwrite a changed
   picture under the same filename.
6. **FR-6 Paid-call contract.** Run paid generation sequentially. Log each call's purpose and
   price before the call in `out/storytime/l2/unit1/cost-ledger.jsonl`.
7. **FR-7 Calibration.** Calibrate the picture rubric before production. It must fail the known
   bad "One sun" thumbnail and pass an owner-approved character picture.
8. **FR-8 Model pre-check.** Check every release candidate with native image input from MiniMax
   and Moonshot. Save each raw result. A failure returns to production before human review.
9. **FR-9 Person count.** Daniel or his named reviewer counts the objects in every picture against
   its text. Record the person, time, counts, and verdict. A model pre-check is not acceptance.
10. **FR-10 Manifest.** Record each picture's book, page, text, prompt, source hash, dimensions,
    versions, model pre-checks, person count, and status in `manifest.json`.
11. **FR-11 Cover render.** Produce the Level 2 cover render under S19 after its print brief and
    size arrive. Keep layout and text out of scope.
12. **FR-12 Progress report.** Report when week 1 pictures and checks are ready. Record remaining
    human gates explicitly.

## Non-Functional Requirements

- Keep paid work inside the existing MiniMax shared quota and the OpenCode plan.
- Check quota before production. Stop on quota exhaustion or a provider cap.
- Keep the video quota untouched.
- Use one generation call at a time. Preserve unrelated working-tree changes.
- Use automated tests for source extraction, prompt construction, filenames, and manifest checks.
- Label evidence as automated, model pre-check, person-checked, or owner-passed.

## Acceptance Criteria

### Week 1 milestone

- Sixteen versioned PNG files exist for "Hello!" and "Nan Can Nod".
- Automated file and manifest checks pass.
- Both model providers pass every release candidate after successful calibration.
- Raw model outputs and the paid-call ledger accompany the pictures.
- Daniel or his named reviewer records an object count and verdict for every picture.
- A contact sheet and the manifest support the progress report.

### Track completion

- All 112 page pictures and the Level 2 cover render meet the same gates.
- The print size specification is recorded and applied.
- The manifest has no unresolved failed or missing release candidate.
- The plan, metadata, registry, and generated facts reflect the delivered state.
- `./measure/generate.sh` and `./measure/doctor.sh` run before track closure.

## Out of Scope

- Song, video, animation, audio, phoneme, and word-time production.
- Book text editing, Thai editing, app development, and bucket uploads.
- New cast models, model revisions, gesture production, and scene production.
- Final cover layout, cover typography, PDF generation, and print deployment.
