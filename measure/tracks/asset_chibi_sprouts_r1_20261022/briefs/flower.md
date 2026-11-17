# Brief: flower

Track: asset_chibi_sprouts_r1_20261022, Phase 5, the week 3 props for the song videos.
Date of the brief: 2026-11-17. The brief came from the maker role prompt of PM order 2026-11-17
(week 3 props).

## The brief as given to the maker (2026-11-17)

assets/flower.ts (name 'flower'). Book: W3 "one big pink flower". 0.45 m tall. A green (#4f8f5a) stem
capsule r 0.012 m from y 0 to 0.33, with 2 leaves (green #5fa364, ellipsoid 0.07 x 0.012 x 0.03 m,
at y 0.12 left and 0.19 right, angled up 30 degrees). A flower head facing +Z, tilted back 10
degrees, centre at y 0.37: 6 pink (#f08cb4) petals (ellipsoid 0.06 x 0.012 x 0.045 m) around a
yellow (#f6c936) centre sphere r 0.03 m; petal tips a deeper pink #d9669a by paintFn. A small
leaf-green base mound (r 0.04, flat at y 0) so it stands.

## Common rules for all the week 3 props

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Stay under 8,000 triangles. Use one
body per material.

## Sources

Source: Storytime inventory section 5, monorepo commit 9255c2711
(`git -C ../reading-advantage-monorepo show 9255c2711:measure/tracks/storytime_advantage_program_20261021/forge-inventory.md`).

| Value | In the brief | Source |
| --- | --- | --- |
| Item | one big pink flower | Inventory section 5, row "flower": "one big pink flower" |
| Weeks | week 3 | The same row: weeks "3" |
| Colour | pink | The same row fixes pink ("one big pink flower"). The hex #f08cb4 is a PM default, check against the book |
| Size | 0.45 m tall | PM default, check against the book |
| Size | the stem capsule r 0.012 m | PM default, check against the book |
| Size | the stem runs from y 0 to 0.33 | PM default, check against the book |
| Size | the leaves are 0.07 x 0.012 x 0.03 m | PM default, check against the book |
| Size | the leaves sit at y 0.12 and 0.19 | PM default, check against the book |
| Angle | the leaves angle up 30 degrees | PM default, check against the book |
| Size | the head's centre at y 0.37 | PM default, check against the book |
| Angle | the head tilts back 10 degrees | PM default, check against the book |
| Count | 6 petals | PM default, check against the book |
| Size | the petals are 0.06 x 0.012 x 0.045 m | PM default, check against the book |
| Size | the centre sphere r 0.03 m | PM default, check against the book |
| Colour | the stem green #4f8f5a | PM default, check against the book |
| Colour | the leaf green #5fa364 | PM default, check against the book |
| Colour | the deeper pink tips #d9669a | PM default, check against the book |
| Colour | the yellow centre #f6c936 | PM default, check against the book |
| Size | the base mound r 0.04, flat at y 0 | PM default, check against the book |

## Known differences

- The stem reaches y 0.355 m, not 0.33 m, so it joins the head's centre sphere. The brief's stem
  ends 0.01 m below the centre sphere and would leave the head floating.
- The stem's capsule starts at y 0.012 m, so its round bottom cap touches the ground. A capsule
  from y 0 reaches 0.012 m below the floor.
- The built flower measures 0.15 m wide, 0.436 m tall and 0.08 m deep, and holds 3,280 triangles
  (out/flower/stats.json). The brief asks for 0.45 m tall.
- The petals face the head's normal: their length runs out from the centre, their width is
  tangential in the head's plane, and their 0.012 m thickness runs along the head's normal. The
  petal centres sit 0.045 m from the head's centre, so the petals grow out of the yellow centre
  and the head is 0.15 m across.
- Each leaf blade is rolled about its length, so its face points up and forward and the leaf
  reads from the front view.
- The base mound reads as a small ball at the foot of the stem. The brief calls it a mound; it is
  a hemisphere of r 0.04 m, flat at y = 0.
