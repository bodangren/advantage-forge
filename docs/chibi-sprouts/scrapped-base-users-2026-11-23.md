# Scrapped sprout base: every asset or deliverable that uses it

Date: 2026-11-23. The owner scrapped the Chibi Sprouts 3D sprout base model.
Scope of the scrap: `assets/sprout-base.ts`, `assets/sprout-adult-base.ts`, every
`assets/sprout-<name>.ts` built on them (lily, tom, mom, dad, grandma, grandpa,
pat, sam, mia, may, ben, pip, nan, adventurer), `assets/parts/sprout-gestures.ts`,
and their outputs.

Method: grep for `sprout-base`, `sprout-adult-base`, and `sprout-` in `assets/`,
`src/`, `scripts/`, `demo/`, `tests/`; listing of `out/sprout-*/`,
`out/chibi-sprouts/**`, `out/apk2d/`, and `out/packs/`; the Workbooks song scene
videos; the local hand-off `~/Desktop/handoff/storytime-song-art/` (MANIFEST);
Drive uploads named in `measure/tracks/asset_chibi_sprouts_r1_20261022/plan.md`;
delivered outputs named in that plan. Dates come from `git log -1 --format=%cs`
for tracked sources (marked "git") or file mtime for untracked or ignored
`out/` outputs (marked "mtime"). `out/` is git-ignored.

## Workbooks song videos

| Asset or deliverable | File or folder (repo-relative) | Made from (which sprout model) | Date (source) | State |
| --- | --- | --- | --- | --- |
| Week 1 song video, stills, sheet | `out/chibi-sprouts/r1/week1/song/` (`song.mp4`, `song-cut2.mp4`, `song-cut3.mp4`, `sheet.png`, stills) | pip, pat, sam, mia, may, ben, nan, adventurer | 2026-10-23 (mtime) | Shipped to Storytime and Workbooks 2026-10-23; owner pass on test cut (F5/C2) |
| Week 2 song cuts | `out/chibi-sprouts/r1/week2/song/` (`song-cut1/2/3.mp4` + sheets, stills) | pip, pat, sam, mia, may, ben, nan, adventurer | 2026-10-23 (mtime) | Shipped to Storytime and Workbooks; Storytime muxed audio, cut on owner page (C1W2) |
| Week 3 song cuts | `out/chibi-sprouts/r1/week3/song/` (`song-cut1/2.mp4` + sheets, stills) | pip, pat, sam, mia, may, ben, nan, adventurer | 2026-10-23 (mtime) | Shipped to Storytime and Workbooks; cut on owner page (C1W3) |
| Week 5 song cuts | `out/chibi-sprouts/r1/week5/song/` (`song-cut1/2.mp4` + sheets, stills) | pip, pat, sam, mia, may, ben, nan, adventurer | 2026-10-23 (mtime) | Shipped to Storytime and Workbooks; owner PASS 2026-10-24 |
| Week 6 song cuts | `out/chibi-sprouts/r1/week6/song/` (`song-cut1/2.mp4` + sheets, stills) | pip, pat, sam, mia, may, ben, nan, adventurer | 2026-10-23 (mtime) | Shipped to Storytime and Workbooks; cut on owner page (C1W6) |
| Week 2 to 7 gesture cutouts, Workbooks shape | `out/chibi-sprouts/r1/week2-7/gestures/` (pat, sam, mia, may, lily, tom, mom, adventurer + `manifest.json`) | sprout-pat, sprout-sam, sprout-mia, sprout-may, sprout-lily, sprout-tom, sprout-mom, sprout-adventurer | 2026-11-22 (mtime) | Shipped to Workbooks; Workbooks used the set in commit `bc025fb` (45 song-line pictures) |
| Adult gesture cutouts | `out/chibi-sprouts/r1/week2-7/gestures-adult/` (mom, dad, grandma, grandpa + `manifest.json`) | sprout-mom, sprout-dad, sprout-grandma, sprout-grandpa (adult-base line) | 2026-11-22 (mtime, by sibling folder) | Local only; no delivery recorded in the plan |

## Storytime song art hand-off

| Asset or deliverable | File or folder (repo-relative, or Drive folder id) | Made from (which sprout model) | Date (source) | State |
| --- | --- | --- | --- | --- |
| 100 gesture cutouts for Pat, Sam, Mia, May | `~/Desktop/handoff/storytime-song-art/cutouts/` (outside the repo; rows in `MANIFEST.tsv`) | sprout-pat, sprout-sam, sprout-mia, sprout-may | 2026-11-22 (mtime of MANIFEST); source commit `65e233fb` | Handed off to Storytime through the local folder |
| Week 4 and week 7 classroom and rug scenes | `~/Desktop/handoff/storytime-song-art/scenes/` (`w04` and `w07` classroom, rug, manifest rows in `MANIFEST.tsv`) | Classroom scene renders shipped in the same bundle, not sprout-derived | 2026-11-22 (mtime of MANIFEST); source commit `65e233fb` | Handed off to Storytime through the local folder |

## 2D game sprites

| Asset or deliverable | File or folder (repo-relative) | Made from (which sprout model) | Date (source) | State |
| --- | --- | --- | --- | --- |
| (none) | `out/apk2d/` holds no `*sprout*` entry; all 40 sprite folders are non-sprout assets | n/a | n/a | Confirmed absent: no 2D game sprite sheet was made from a sprout GLB |

## Packs

| Asset or deliverable | File or folder (repo-relative) | Made from (which sprout model) | Date (source) | State |
| --- | --- | --- | --- | --- |
| (none) | `out/packs/avatar/1.0.0/` and `1.1.0/` catalogs hold no sprout entry | n/a | n/a | Confirmed absent: the avatar packs use no sprout model |

## Other

| Asset or deliverable | File or folder (repo-relative, or Drive folder id) | Made from (which sprout model) | Date (source) | State |
| --- | --- | --- | --- | --- |
| Scrapped sources | `assets/sprout-base.ts`, `assets/sprout-adult-base.ts`, `assets/sprout-lily.ts`, `assets/sprout-tom.ts`, `assets/sprout-mom.ts`, `assets/sprout-dad.ts`, `assets/sprout-grandma.ts`, `assets/sprout-grandpa.ts`, `assets/sprout-pat.ts`, `assets/sprout-sam.ts`, `assets/sprout-mia.ts`, `assets/sprout-may.ts`, `assets/sprout-ben.ts`, `assets/sprout-pip.ts`, `assets/sprout-nan.ts`, `assets/sprout-adventurer.ts`, `assets/parts/sprout-gestures.ts` | n/a (they are the scrapped models) | 2026-10-31 to 2026-11-22 (git; per-file dates in the inventory log) | Scrapped by the owner 2026-11-23; still in the repo |
| Per-model build outputs | `out/sprout-*/` (GLB, renders, views, sprites, animation strips; e.g. `out/sprout-pat/sprout-pat.glb`) | Each folder's own sprout model | 2026-10-22 to 2026-11-22 (mtime) | Local only |
| Week 1 cast cutouts | `out/chibi-sprouts/r1/week1/cast/` (sprout-adventurer, sprout-ben, sprout-may, sprout-mia, sprout-nan, sprout-pat, sprout-pip, sprout-sam; front + three-quarter) | The 8 age-5 cast models | 2026-10-22 (mtime) | Shipped to Storytime and Workbooks in the `out/chibi-sprouts/r1/` delivery folder, 2026-10-22 |
| Week 1, 4, 7 classroom and rug scenes | `out/chibi-sprouts/r1/week1/scenes/`, `out/chibi-sprouts/r1/week4/scenes/`, `out/chibi-sprouts/r1/week7/scenes/` | Classroom scene renders, not sprout-derived; shipped in the same bundles | 2026-10-22 (mtime) | Shipped to Storytime and Workbooks with the cast |
| Faces round 2 compare sheets on Drive | Drive folder `1XLjQ9bEI_3h_xw8NFwjDE81hZsNzK7fM` (`faces-r2` under `1W6iwGCe0qQ3EXqPASvzat5fLqNnEIbaA`); locals in `out/chibi-sprouts/faces-r2/sheets/` | sprout-lily, sprout-tom, sprout-mom, sprout-grandma, sprout-grandpa | 2026-11-22 upload (plan); locals 2026-11-22 (mtime) | Shipped to Drive 2026-11-22; five of six sheets present (dad missing, see below) |
| Faces round 2 dad rounds | `out/chibi-sprouts/faces-r2/dad-rounds/` | sprout-dad | 2026-11-22 (mtime, by sibling files) | In progress, local only; no dad compare sheet and no Drive upload |
| Pat reference render | `out/storytime-review/batch-22/sprout-pat-render.png` | sprout-pat | 2026-11-01 (mtime) | Local only; used as a test fixture by `tests/storytime-card-specs.test.ts` and `tests/storytime-family-word-specs.test.ts` |
| Nan review calibration target | `src/storytime/book-pictures.ts` (`good-nan` target on `out/chibi-sprouts/r1/week1/cast/sprout-nan/front.png`) | sprout-nan | Source tracked in git; target PNG 2026-10-22 (mtime) | Local only (Muse review calibration, no paid call recorded as shipped) |
| Contract tests | `tests/sprout-base.test.ts`, `tests/sprout-gestures.test.ts`, `tests/sprout-gesture-offset.test.ts`, `tests/song-timeline.test.ts` | Import the scrapped sources | Tracked in git | Local only; they fail or go stale with the scrap |

## Count per group

- Workbooks song videos: 7 rows.
- Storytime song art hand-off: 2 rows.
- 2D game sprites: 0 rows (confirmed none).
- Packs: 0 rows (confirmed none).
- Other: 9 rows.

## Anything not confirmed

- Whether Storytime or Workbooks already forwarded sprout renders into their own shipped products (Workbooks video repo, Storytime app). This inventory covers this repo and the local hand-off only.
- The missing sixth faces-r2 sheet (dad): the plan records five uploads and notes "five sheets sit in the folder, not six". No dad compare sheet exists locally either.
- The `gestures-adult` set has no delivery note in the plan; its state above is "local only" by absence of proof, not by a recorded decision.
- `docs/sprout-mockups/*.jpg` are Daniel's 2D drawings. They are the reference for the redesign, not scrapped outputs, so they stay outside the table.
