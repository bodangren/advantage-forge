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

- Daniel selected Forge 3D renders on 2026-10-25: "We can use the same style for the entire
  system, I think. We have the 3D assets from Forge. If they need more poses, we can request them.
  If we need additional assets, we can create them. One character look for both books and videos
  seems like a good idea!"
- The same approved cast and look serves the books and future song videos. Do not substitute a
  different character look.
- Missing poses and additional assets go through the PM. Do not improvise a substitute.
- Decision S19 assigns cover layout and text to Workbooks. Forge supplies the cover render only.
- The delivery root is `out/storytime/l2/unit1/`.
- Forge writes only inside this repository. No Workbooks or monorepo file changes are allowed.
- No bucket upload, deployment, public release, deletion, song render, or video render is allowed.

## Picture specification v0

Workbooks supplied this specification on 2026-10-25. The full picture list follows by 2026-10-28.

- Story pages: 3000 x 2250 pixels, 4:3.
- Covers: 3600 x 2700 pixels, 4:3. Keep the top 30 percent calm for the title.
- Small pictures: 1500 x 1500 pixels on white.
- PNG, 8-bit sRGB, opaque, with no letters or numbers in the picture.
- No bleed. Workbooks converts the pictures to CMYK.
- Filenames: `l2-w01-<use>-<what-it-shows>-v1.png`.
- One `manifest.json` with SHA-256 per batch.

## Functional Requirements

1. **FR-1 Source extraction.** Extract all 112 page prompts, texts, books, and character lists
   from the seven source packages. Record a source hash for each package.
2. **FR-2 Week order.** Produce and review week 1 before starting batch production for later weeks.
3. **FR-3 Scene contract.** Preserve each source scene prompt. Map each scene to approved Forge
   assets, poses, props, and a camera. Record the stage file and its hash.
4. **FR-4 Picture contract.** Produce each PNG at its required size and color format. Pictures
   contain no words, letters, numbers, signatures, or watermarks.
5. **FR-5 Version contract.** Use the Workbooks filename pattern with descriptive subjects and
   increasing version numbers. Never overwrite a changed picture under the same filename.
6. **FR-6 Heavy-job contract.** Run the live pre-flight check before every heavy run. Use
   `scripts/heavy-lock.ts` for every heavy run. Stop and report a `hold` result.
7. **FR-7 Paid-call contract.** Run paid pre-check calls sequentially. Log each call's purpose and
   price before the call in `out/storytime/l2/unit1/cost-ledger.jsonl`.
8. **FR-8 Calibration.** Calibrate the picture rubric before production. It must fail the known
   bad "One sun" thumbnail and pass the owner-approved Nan cutout.
9. **FR-9 Model pre-check.** Check every release candidate with native image input from MiniMax
   and Moonshot. Save each raw result. A failure returns to production before human review.
10. **FR-10 Person count.** Daniel or his named reviewer counts the objects in every picture
    against its text. Record the person, time, counts, and verdict. A model pre-check is not
    acceptance.
11. **FR-11 Manifest.** Record each picture's book, page, text, prompt, source and stage hashes,
    dimensions, versions, model pre-checks, person count, status, file SHA-256, and batch SHA-256.
12. **FR-12 Cover render.** Produce the Level 2 cover render under S19. Keep the top 30 percent
    calm for the title. Keep layout and text out of scope.
13. **FR-13 Progress report.** Report when week 1 pictures and checks are ready. Record remaining
    human gates explicitly.

## Non-Functional Requirements

- Keep paid pre-checks inside the existing MiniMax shared quota and the OpenCode plan.
- Check quota before paid pre-checks. Stop on quota exhaustion or a provider cap.
- Keep the video quota untouched.
- Use one paid pre-check call at a time. Preserve unrelated working-tree changes.
- Check available memory before every heavy run. Stop when the pre-flight check prints `hold`.
- Wait for a held heavy lock. Report a wait over ten minutes to the PM in one line.
- Use automated tests for source extraction, filenames, scene contracts, manifests, and layout.
- Label evidence as automated, model pre-check, person-checked, or owner-passed.

## Acceptance Criteria

### Week 1 milestone

- Sixteen versioned PNG files exist for "Hello!" and "Nan Can Nod".
- Every picture meets the story-page size and format contract.
- Automated file, layout, and manifest checks pass.
- Both model providers pass every release candidate after successful calibration.
- Raw model outputs and the paid-call ledger accompany the pictures.
- Daniel or his named reviewer records an object count and verdict for every picture.
- A contact sheet and the manifest support the progress report.

### Track completion

- All 112 page pictures and the Level 2 cover render meet the same gates.
- The final Workbooks picture list is reconciled with this track.
- The manifest has no unresolved failed or missing release candidate.
- The plan, metadata, registry, and generated facts reflect the delivered state.
- `./measure/generate.sh` and `./measure/doctor.sh` run before track closure.

## Out of Scope

- Song, video, animation, audio, phoneme, and word-time production.
- Book text editing, Thai editing, app development, and bucket uploads.
- Final cover layout, cover typography, PDF generation, and print deployment.
- Unapproved cast changes, substitute styles, and improvised poses.
