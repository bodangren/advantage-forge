# Brief: cloud

Track: asset_chibi_sprouts_r1_20261022, Phase 5, the week 3 props for the song videos.
Date of the brief: 2026-11-17. The brief came from the maker role prompt of PM order 2026-11-17
(week 3 props).

## The brief as given to the maker (2026-11-17)

assets/cloud.ts (name 'cloud'). Book: W3 "one small white cloud". 0.50 m wide, 0.26 m tall, 0.22 m
deep. smoothUnion (k 0.04) of 5 spheres: centre r 0.12 at (0, 0.14, 0); r 0.09 at (±0.13, 0.11, 0);
r 0.07 at (±0.21, 0.08, 0); flatten the bottom with a halfSpace cut at y = 0 (intersected), so it
rests on y = 0. White #f7f7f2, the lower third shaded #d9dee6 by paintFn gradient, roughness 0.95.
No face.

## Common rules for all the week 3 props

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Stay under 8,000 triangles. Use one
body per material.

## Sources

Source: Storytime inventory section 5, monorepo commit 9255c2711
(`git -C ../reading-advantage-monorepo show 9255c2711:measure/tracks/storytime_advantage_program_20261021/forge-inventory.md`).

| Value | In the brief | Source |
| --- | --- | --- |
| Item | one small white cloud | Inventory section 5, row "cloud": "one small white cloud" |
| Weeks | week 3 | The same row: weeks "3" |
| Colour | white | The same row fixes white ("one small white cloud"). The hex #f7f7f2 is a PM default, check against the book |
| Size | 0.50 m wide | PM default, check against the book |
| Size | 0.26 m tall | PM default, check against the book |
| Size | 0.22 m deep | PM default, check against the book |
| Shape | five smooth-unioned spheres | PM default, check against the book |
| Shape | a flat bottom at y = 0 | PM default, check against the book |
| Colour | the lower third shaded #d9dee6 | PM default, check against the book |
| Finish | roughness 0.95 | PM default, check against the book |
| Face | none | The same row names no face |

## Known differences

- The sphere positions in the brief leave the lowest point at 0.01 m, so the cloud is lowered
  0.01 m to rest on y = 0. The built cloud is 0.25 m tall, not 0.26 m.
- The built cloud measures 0.56 m wide, 0.25 m tall and 0.24 m deep, and holds 2,248 triangles
  (out/cloud/stats.json). The brief asks for 0.50 x 0.26 x 0.22 m: the sphere positions it fixes
  (±0.21 with r 0.07, and the centre sphere r 0.12) make the cloud wider and deeper than the
  summary size.
- The shaded band reaches 0.085 m up, which is the lower third of the 0.25 m cloud.
- The flat bottom is a narrow cut: the two small lumps touch the ground, so the cloud stands on
  two small patches.
