# Specification: Storytime Level 2 unit 1 book pictures

## Overview

Daniel's order of 2026-10-25 resumes Storytime release 1 picture work. The order lifts the
2026-10-24 stop for this scope only. Song and video renders remain paused.

The source packages are `Workbooks/content/storytime/l2/w01.json` through `w07.json`.
Forge reads those files without changing them. The source holds 112 book pages: 16 pages in each
of seven weeks. Each week has one eight-page read-along and one eight-page decodable. The
Workbooks picture list is version 3. It holds 192 rows for weeks 1 to 7.

Week 1 contains "Hello!" and "Nan Can Nod". Its pictures are due 2026-11-02. Weeks 2 to 7 and
the Level 2 cover render are due 2026-11-16.

Each reader page has two outputs: a color picture and a black-and-white line-art picture. The
color picture serves the app read-along and the song videos. The line-art picture serves a
printed workbook with "build your own" readers. Both outputs come from the same 3D scene and
camera. Workbooks picture specification v1 arrived on 2026-10-27. It fixes the picture sizes and
the line-art format.

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
  size in specification v1 by 2026-10-28. Nothing else changes. Specification v1 arrived on
  2026-10-27 in Workbooks commit a9178413.
- Missing poses and additional assets go through the PM. Do not improvise a substitute.
- Decision S19 assigns cover layout and text to Workbooks. Forge supplies the cover render only.
- The delivery root is `out/storytime/l2/unit1/`.
- Forge writes only inside this repository. No Workbooks or monorepo file changes are allowed.
- No bucket upload, deployment, public release, deletion, song render, or video render is allowed.

## Picture specification v1

History: picture specification v0 of 2026-10-25 set 3000 x 2250 story pages, 3600 x 2700 covers,
and 1500 x 1500 small pictures. Version 1 replaces it.

Workbooks supplied specification v1 on 2026-10-27. Workbooks commit a9178413 holds its current
text. Requirement FR-9 of the print track `storytime_print_r1_20261025` holds the rules.

### Size classes

| Class | Use | Pixels | Aspect | Background | Composition |
|---|---|---|---|---|---|
| A | Reader story pages (112) | 4000 x 3000 | 4:3 landscape | The scene, opaque | Every named object, face, and hand in the central 90 percent. Workbooks can cut 5 percent at each edge. |
| B | Reader covers (14) | 4000 x 3000 | 4:3 landscape | The scene, opaque | One in-scene render with the cast in place. The top 30 percent stays calm. |
| C | Check rows, practice lines, cards | 1500 x 1500 | 1:1 | White `#FFFFFF` | One object, or one person who does the action, centered, about 80 percent of the frame. |

The size class follows the use of the row. A story page is class A. A cover is class B. A check
row and a practice line are class C.

Class A and class B give about 378 ppi in the A3 picture box (269 mm wide). That is above the
300 ppi target.

### Color rules

- PNG, 8-bit, sRGB, opaque, with no alpha channel and no CMYK.
- No letters, words, or numbers in the picture.
- Every picture shows the objects in the counts that the text says.
- The cast is the Forge cast at age 5.
- Each batch has a `manifest.json` with the file name and the picture-list id. It also holds the
  SHA-256 and the pixel size.
- Workbooks converts the pictures to CMYK in `make-pdfx.ts`.
- The pictures sit in frames on white pages. They need no bleed.

### File names

- Every row of the picture list names a color file and a line-art file.
- The color file name matches `^l2-w\d{2}-[a-z-]+-v\d+\.png$`.
- The line-art file name is the color file name with `-line` before the version.
- Example: `l2-w01-story-page-a-nest-line-v1.png`.
- The ids and the file names stay unique across the weeks.

### Line-art rules

- Every row of the picture list has two outputs.
- The line-art file has the same pixel size as the color file of its row.
- The line art is a PNG, 8-bit, grayscale, with an opaque white `#FFFFFF` background.
- The line art holds black outlines only, with no gray fill or shading. Anti-aliased edges are
  allowed.
- The outlines are closed, so a child can color the picture.
- No line is thinner than 12 px.
- The line art holds no letters, words, or numbers.
- The line art shows the same scene, cast, and object counts as the color render of the row.
- The line-art file name ends in `-line-v1.png`.

### Render size and the A3 teacher print

- Render size is a parameter of the render. The stage file does not contain it.
- Stage files and cameras are kept and versioned. A later render at a larger size needs no new
  scene work and no extra cost.
- Specification v1 keeps 4:3 for class A and class B. A3 (about 1.414:1) has a different ratio.
  A render at the A3 ratio changes the framing. A later size or ratio needs a new render, and
  every picture gate applies again.

### Picture list version 3

The picture list is `Workbooks/content/storytime/l2/print/pictures.json` at list version 3.
Workbooks commit 078917f1 supplied it. The list has 192 rows.

- Week 1 has 30 rows: 16 of class A, 2 of class B, and 12 of class C.
- Weeks 2 to 7 have 27 rows each: 16 of class A, 2 of class B, and 9 of class C. That is 162 rows.
- The 12 class C rows of week 1 hold the check rows and the practice lines.
- The list holds 112 story pages and 14 reader covers. It also holds 63 check rows and 3 practice
  lines.
- Every row has a color file and a line-art file. The list names 384 files.
- The week 1 rows of version 3 equal the week 1 rows of version 2.
- Version 3 changed four ids in weeks 2 and 6. The suffix moved from `-a` to `-b`.

### Ownership of the class B rows

The class B rows are the 14 reader covers. The Workbooks covers track `storytime_covers_20261027`
lists them as out of scope. The print track owns them as reader pages. Forge renders the B
pictures. Workbooks keeps the layout and the text.

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
14. **FR-14 Line-art output.** Produce one line-art picture for each row of the picture list. Make
    it in the same render run as its color twin, from the same stage file, still time, and camera.
    Use a render pass of the 3D scene, not only a filter of the color picture. The lines show
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

- Thirty versioned color PNG files exist for the 30 week 1 rows of picture list version 3.
- The rows are 16 of size class A, 2 of size class B, and 12 of size class C.
- Every picture meets the pixel size and the format contract of its size class.
- Automated file, layout, and manifest checks pass.
- Both model providers pass every release candidate after successful calibration.
- Raw model outputs and the paid-call ledger accompany the pictures.
- Daniel or his named reviewer records an object count and verdict for every picture.
- A contact sheet and the manifest support the progress report.
- Thirty versioned line-art PNG files exist, one for each color picture.
- Each line-art file passes the specification v1 line-art format checks and binds to its color
  twin.
- Daniel's look at the Nan window sample is recorded through the PM.
- Daniel or his named reviewer records a look and verdict for every line-art picture.

### Track completion

- All 30 color files of week 1 and all 30 line-art files of week 1 meet the same gates.
- All 162 color files of weeks 2 to 7 and all 162 line-art files of weeks 2 to 7 meet the same
  gates.
- All 192 line-art files meet the line-art gates and the specification v1 format.
- The Level 2 cover render meets the same gates.
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
