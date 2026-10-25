# Specification: Storytime Level 2 unit 1 book pictures

## Overview

Daniel's order of 2026-10-25 resumes Storytime release 1 picture work. The order lifts the
2026-10-24 stop for this scope only. Song and video renders remain paused.

The source packages are `Workbooks/content/storytime/l2/w01.json` through `w07.json`.
Forge reads those files without changing them. The source holds 112 book pages: 16 pages in each
of seven weeks. Each week has one eight-page read-along and one eight-page decodable.

Week 1 contains "Hello!" and "Nan Can Nod". Its pictures are due 2026-11-01. Weeks 2 to 7 and
the Level 2 cover render are due 2026-11-15.

Each reader page has two outputs: a color picture and a black-and-white line-art picture. The
color picture serves the app read-along and the song videos. The line-art picture serves a
printed workbook with "build your own" readers. Both outputs come from the same 3D scene and
camera. The line-art format is provisional until Workbooks picture specification v1.

## Decisions and boundaries

- Daniel selected Forge 3D renders on 2026-10-25: "We can use the same style for the entire
  system, I think. We have the 3D assets from Forge. If they need more poses, we can request them.
  If we need additional assets, we can create them. One character look for both books and videos
  seems like a good idea!"
- The same approved cast and look serves the books and future song videos. Do not substitute a
  different character look.
- Daniel added print line art on 2026-10-25 (PM relay, about 21:10 ICT). His words:

  > We should have a workbook with the writing parts and "build your own" readers like Reading
  > A-Z does. That means B&W (probably line drawings) pages of the book organized to slice out,
  > fold, and staple.

- The PM instructions for that change: make the line art from the same 3D scenes and cameras as
  the color renders. Do not stop the color renders. Render the Nan window page in both versions
  first. Report the two file paths to the PM for Daniel's look. Continue while the sample waits.
- Daniel added a teacher print on 2026-10-25 (PM relay, about 21:25 ICT). His words:

  > yes, right for the student, but we can produce color pdfs for the teachers to printo on A3
  > and lead class with.

- The PM meaning: the color renders are also a print deliverable for A3 teacher PDFs. A3 at
  300 ppi is about 4961 x 3508 pixels, so 3000 x 2250 can be too small. Workbooks sets the final
  size in specification v1 by 2026-10-28. Nothing else changes.
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

### Render size and the A3 teacher print

- Render size is a parameter of the render. The stage file does not contain it.
- Stage files and cameras are kept and versioned. A later render at a larger size needs no new
  scene work and no extra cost.
- A3 (about 1.414:1) has a different ratio from the 4:3 story page. A render at the A3 ratio
  changes the framing. The final size and ratio wait for specification v1.

### Interim line-art format (provisional)

This format is provisional. Workbooks sends picture specification v1 by 2026-10-28 with the
line-art size, color depth, and line weight for the cut-and-fold page. Until then:

- Line art has the same pixel size as its color twin: 3000 x 2250 for a story page.
- Pure black lines on white. No grey fill. Every pixel is black (0) or white (255).
- Opaque PNG. No letters or numbers. No bleed.
- A provisional filename that does not match the Workbooks color pattern. The contract defines it.
- Line art is required for the 112 reader pages. The cover and small pictures have no line art
  unless specification v1 asks for it.

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
14. **FR-14 Line-art output.** Produce one line-art picture for each reader page. Make it in the
    same render run as its color twin, from the same stage file, still time, and camera. Use a
    render pass of the 3D scene, not only a filter of the color picture. The lines show
    silhouettes and form edges, never mesh triangle edges. The song engine gets one additive
    still hook for this pass.
    Daniel's style look applies to the approved line-art technique and format version.
15. **FR-15 Line-art sample.** Render the Nan window page in color and line art first. Report
    both paths to the PM for Daniel's look. Continue the pipeline while the look is pending.
16. **FR-16 Line-art release.** A line-art picture is ready only with structural checks, a ready
    color twin, a passing person look, and Daniel's passing style look. A model result is not
    acceptance.
17. **FR-17 Specification v1.** Reconcile the line-art format with Workbooks picture
    specification v1. Record each rename, resize, or new render.

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
- Sixteen versioned line-art PNG files exist, one for each color picture.
- Each line-art file passes the interim or v1 line-art format checks and binds to its color twin.
- Daniel's look at the Nan window sample is recorded through the PM.
- Daniel or his named reviewer records a look and verdict for every line-art picture.

### Track completion

- All 112 page pictures and the Level 2 cover render meet the same gates.
- All 112 line-art pictures meet the line-art gates and the specification v1 format.
- The final Workbooks picture list is reconciled with this track.
- The manifest has no unresolved failed or missing release candidate.
- The plan, metadata, registry, and generated facts reflect the delivered state.
- `./measure/generate.sh` and `./measure/doctor.sh` run before track closure.

## Out of Scope

- Song, video, animation, audio, phoneme, and word-time production.
- Book text editing, Thai editing, app development, and bucket uploads.
- Final cover layout, cover typography, PDF generation, and print deployment.
- Workbook layout, the writing parts, page imposition, slicing, folding, stapling, and the
  workbook PDF. Workbooks owns them. Forge supplies the line-art pictures only.
- The teacher color PDF and its A3 layout. Workbooks owns them. Forge supplies the color renders.
- Unapproved cast changes, substitute styles, and improvised poses.
