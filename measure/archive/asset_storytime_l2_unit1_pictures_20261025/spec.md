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
camera.
Replaced by the amendment of 2026-11-01 (Muse path).
Workbooks picture specification v1 arrived on 2026-10-27. It fixes the picture sizes and
the line-art format.

## Decisions and boundaries

- Daniel selected Forge 3D renders on 2026-10-25: "We can use the same style for the entire
  system, I think. We have the 3D assets from Forge. If they need more poses, we can request them.
  If we need additional assets, we can create them. One character look for both books and videos
  seems like a good idea!"
  Replaced by the amendment of 2026-11-01 (Muse path).
- The same approved cast and look serves the books and future song videos. Do not substitute a
  different character look.
- Daniel added print line art on 2026-10-25 (PM relay, about 21:10 ICT). His words:

  > We should have a workbook with the writing parts and "build your own" readers like Reading
  > A-Z does. That means B&W (probably line drawings) pages of the book organized to slice out,
  > fold, and staple.

- The PM instructions for that change: make the line art from the same 3D scenes and cameras as
  the color renders. Do not stop the color renders. Render the Nan window page in both versions
  first. Report the two file paths to the PM for Daniel's look. Continue while the sample waits.
  Replaced by the amendment of 2026-11-01 (Muse path).
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
  Replaced by the amendment of 2026-11-01 (Muse path).
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

## Amendment 2026-11-01: Muse picture path and week 1 delivery contract

This amendment changes the picture path, the line art, and the week 1 delivery contract. The
earlier text stays in place. The line "Replaced by the amendment of 2026-11-01 (Muse path)."
follows each earlier statement that this amendment replaces. When an earlier statement conflicts
with this amendment, this amendment applies.

### Decision 1: the Muse picture path

Daniel gave this decision in Tasks at 09:34 ICT on 2026-11-01. The PM relayed it. His words:

> The Muse version is obviously better in all cases and your reading of the hand is wrong because
> it's a what is it called perspective problems of the hand is reaching out towards the towards
> the viewer so we'll keep Muse and then don't even bother with a cap because we have to pay what
> we have to pay here finally I think we can leave the 3D models as is

The PM orders that follow from it:

- Muse composition from the 3D elements is the picture path for Storytime (week 1 first, then
  weeks 2 to 8). The inputs are character renders, prop renders, an empty set render, and a page
  description. Muse never gets a finished page render.
- The line art comes from the approved Muse color picture: thick, simple, closed lines; no blush,
  eyelash ticks, hair strands, gray, or text. Muse line art replaces the 3D line art. Nan keeps
  her eyelash mark.
- Foreshortening is not a defect.
- The 3D cast fix stops. The 3D models are reference sources only. Committed changes stay.
- No cost cap. Every paid Muse call is logged with `usage.cost`, and each report gives the
  running total. Retry only for a real defect.
- Muse calls need no heavy lock and no slot; they run 4 at a time.
- An independent review and a strict clean check run on every page. A page is clean only when it
  has no defect of any kind ("no known defects in print").
- The nurse and Teacher Kim get Muse cast sheets, described by hair and clothes only
  (race-unmarked).
- Print size: local crop or pad and enlargement to the list size; the line art stays pure black
  and white.
- The tool is `scripts/storytime-muse.mjs`; the page specs are
  `docs/storytime/l2-unit1/w01/muse/<row-id>.json`; the outputs are
  `out/storytime/l2/unit1/w01/muse/`.

### Decision 2: the week 1 delivery contract

The PM gave this decision at 11:3x ICT on 2026-11-01. It is the delivery contract for the week 1
hand-off to Workbooks. The target date is 2026-11-04. The PM words:

```text
PM decision (the shape of 11a06b9c stays the contract):
1. The Muse flow delivers the week 1 list rows.
2. At the delivery batch root, write one manifest.json in the 11a06b9c shape, with one entry per picture-list row.
3. job.id = the picture-list row id (for example l2-w01-story-page-hello-i-am-pat).
4. candidate.file = the approved 4000 x 3000 color print file, named as the list names it: <row id>-v1.png. lineArt.file = the approved 4000 x 3000 1-bit line-art print file: <row id>-line-v1.png. Copy the approved Muse print files to those names in the delivery folder; keep the Muse originals.
5. Workbooks matches the file name part only, so the folder prefix is free.
6. Only clean rows go into the manifest. Any change to this contract goes through the PM first.
```

Forge accepted the decision with two notes:

- (a) The 12 class C rows (check rows and practice lines) go at the list size 1500 x 1500. Class A
  and class B rows go at 4000 x 3000.
- (b) The 11a06b9c review fields (`reviews.minimax`, `reviews.kimi`, `reviews.person`) take only
  Kimi reviews in `reviews.kimi`. Mimo reviews and orchestrator checks stay in the review logs.
  No row gets a person review that no person gave.

The manifest shape is `StorytimeManifest` in `src/storytime/book-pictures.ts` lines 238 to 243:
`version` 1, `batchHashAlgorithm`, `jobs`, and `batches`.

## Amendment 2026-11-04: one Sonnet judge and the picture restart

This amendment changes FR-7 and FR-9 for the picture restart. The earlier text stays in place.
The line "Amended 2026-11-04." follows each statement that this amendment changes. When an
earlier statement conflicts with this amendment, this amendment applies.

Source. Daniel's word (Tasks, 2026-11-04 14:54 ICT): "Beautiful samples. Approved. Also redo the
incorrect pictures." The PM relayed the restart rules of Daniel (2026-11-03) on 2026-11-04. The
PM also named the work list and the order of work.

### Decision 1: one judge replaces the MiniMax and Kimi pre-checks (FR-9)

- One judge, Sonnet (`claude-code/claude-sonnet-5-5`) with native image input, makes the FR-9
  pre-check. MiniMax and Kimi no longer make a pre-check for the restart pictures.
- The judge result is model evidence. It is not acceptance (FR-10 stays in force).
- The judge uses one fixed prompt: `docs/storytime/l2-unit1/judge/judge-prompt.md`.

### Decision 2: calibrate the judge before any new picture

- The judge must pass the delivery files of weeks 1 to 7 and the cover that Daniel approved.
- The judge must fail the two named-defect files (the gate controls): the `a-nose` v1 line
  art, which has no nose, and the `nan-can-get-a-pan` m3 line art try 1, which has no pan handle
  (finding B43-PAN-2).
- The pictures of the A-48 redraw list and the m3 color file of `nan-can-get-a-pan` are report
  items. The judge may pass or fail them. The run records each verdict.
- Daniel does no new work for the calibration.

### Decision 3: judge at printed size, with Daniel's bar word for word

- The judge looks at each file at the size that the page prints. It does not zoom in.
- The Workbooks print data holds no printed box sizes. The fallback is a 900 px long side for a
  story page and the cover, and a 360 px long side for a check row, a practice line, and any
  other card.
- The bar is Daniel's text of 2026-11-01 at 14:15 ICT:

> The bar for every page is Daniel's text of 2026-11-01 at 14:15 ICT, quoted verbatim in every
> review prompt: marks of that size are not defects (a small mark at the nose, an open C-shaped ear
> line, outlined eyebrow bands, small dark shading inside the ears, a simplified branch or bush). A
> defect is only what a teacher or a child sees at book size: a wrong or changed character, a
> broken face, a clearly wrong hand or limb, a wrong or missing prop the sentence needs, a layout
> fault, text in the picture, gray or shading in the line art, or a line gap that makes coloring
> hard. Foreshortening is correct.

- A small mark is a note. It is not a retry.

### Decision 4: stop rule

- The first passing try is the delivery.
- A color picture gets 3 tries or fewer. A line-art picture gets 3 tries or fewer.
- When no try passes, the best try goes to the PM with a note. The old picture stays.
- Line art stays a Muse call. No local filter makes line art (FR-14 stays replaced).
- The tool `scripts/storytime-muse.mjs` refuses a fourth try of a picture and kind. It counts the
  tries in the `costs.tsv` files since `2026-11-04T07:54:00Z`. A failed call with cost 0 does not
  count. A picture with two ids is one picture (nose; olive and ostrich).

### Decision 5: spend cap (FR-7)

- The cap for the whole restart run is 1.00 USD. The report point is 0.50 USD.
- The tool sums the `usage_cost` of every Muse row since the start time, element sheets
  included. It refuses a call when the sum plus 0.01 USD passes the cap. It prints a notice at or
  above the report point.
- The maker stops and reports before more calls when the projection passes 1.00 USD.
- The maker logs every call and its cost in `costs.tsv`.

### Decision 6: the work list

- The list is `/home/daniebo/Desktop/handoff/a48-forge-picture-list/picture-list.md`, SHA-256
  `dad8b49efbaf8ebdf0308e50dba971759293913ce8c8ab52694b25f886c419d9`.
- It holds 22 pictures: list A (12 pictures that teach the wrong thing), list B (7 reader
  pictures that do not show their text), and list C (moon, mango, and drum; the ostrich of
  A item 7 also fills week 8).
- The order of work is the judge and its calibration, then list A (items 1 to 3 first), then
  list C, then list B. The pictures are needed by 2026-11-09 18:00 ICT.
- A redraw keeps its id with version v2. The new ids are `l2-w02-check-row-axe-v1` and the
  week 8 ostrich id.

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
   Amended 2026-11-04. The restart run has a spend cap of 1.00 USD and a report point of
   0.50 USD. See "Amendment 2026-11-04", Decision 5.
8. **FR-8 Calibration.** Calibrate the picture rubric before production. It must fail the known
   bad "One sun" thumbnail and pass the owner-approved Nan cutout.
9. **FR-9 Model pre-check.** Check every release candidate with native image input from MiniMax
   and Moonshot. Save each raw result. A failure returns to production before human review.
    Amended 2026-11-04. One Sonnet judge replaces MiniMax and Moonshot. See
    "Amendment 2026-11-04", Decisions 1 to 4.
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
    Replaced by the amendment of 2026-11-01 (Muse path).
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
