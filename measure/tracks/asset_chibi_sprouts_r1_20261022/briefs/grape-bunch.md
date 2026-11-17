# Brief: grape-bunch

Track: asset_chibi_sprouts_r1_20261022, Phase 5, the week 3 props for the song videos.
Date of the brief: 2026-11-17. The brief came from the maker role prompt of PM order 2026-11-17
(week 3 props).

## The brief as given to the maker (2026-11-17)

assets/grape-bunch.ts (name 'grape-bunch'). Book: W3 "a bunch, purple". 0.20 m tall. 16 purple
(#7b4a9e) grapes, spheres r 0.022 m, packed in a downward cone (4, 4, 3, 3, 2 per row from top),
each grape touching its neighbours; the bottom grapes rest on y = 0. A brown (#6b4a2e) stem capsule
r 0.006 m, 0.04 m long, from the top centre. One green (#5fa364) grape leaf (flat 5-point extruded
profile, 0.07 m across, 0.008 m thick) at the stem. Slight value variation per grape (#6c3f8c to
#8a56ad by random) and roughness 0.4 for a soft shine.

## Common rules for all the week 3 props

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Stay under 8,000 triangles. Use one
body per material.

## Sources

Source: Storytime inventory section 5, monorepo commit 9255c2711
(`git -C ../reading-advantage-monorepo show 9255c2711:measure/tracks/storytime_advantage_program_20261021/forge-inventory.md`).

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a bunch of grapes | Inventory section 5, row "grape": "a bunch, purple" |
| Weeks | week 3 | The same row: weeks "3" |
| Colour | purple | The same row fixes purple ("a bunch, purple"). The hex #7b4a9e is a PM default, check against the book |
| Size | 0.20 m tall | PM default, check against the book |
| Count | 16 grapes | PM default, check against the book |
| Size | the grape spheres r 0.022 m | PM default, check against the book |
| Shape | the rows hold 4, 4, 3, 3 and 2 grapes from the top | PM default, check against the book |
| Shape | the bottom grapes rest on y = 0 | PM default, check against the book |
| Size | the stem capsule r 0.006 m, 0.04 m long | PM default, check against the book |
| Shape | one flat five-point leaf, 0.07 m across, 0.008 m thick | PM default, check against the book |
| Colour | the brown stem #6b4a2e | PM default, check against the book |
| Colour | the leaf green #5fa364 | PM default, check against the book |
| Colour | the grape values from #6c3f8c to #8a56ad | PM default, check against the book |
| Finish | roughness 0.4 for a soft shine | PM default, check against the book |

## Known differences

- The asset name is `grape-bunch`; the inventory row is named "grape".
- The built bunch measures 0.116 m wide, 0.257 m tall and 0.106 m deep, and holds 7,552 triangles
  (out/grape-bunch/stats.json). The bunch of grapes is 0.196 m tall; the stem and the leaf add
  0.061 m. The brief asks for 0.20 m tall.
- Each row is a ring around the bunch's axis, so the bunch is round in plan. The rows are 0.038 m
  apart and the ring radius makes every grape touch its neighbours.
- The leaf's five-point profile reads as a star rather than a rounded grape leaf. The profile
  keeps the brief's five points.
- The leaf's front and back edges are rounded by 2.5 mm. A sharp rim reads black at the cut-out's
  outline, and `cutout-check` then fails the front view with a dark halo.
