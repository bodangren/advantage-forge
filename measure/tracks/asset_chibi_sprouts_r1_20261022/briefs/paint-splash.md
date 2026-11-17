# Brief: paint-splash

Track: asset_chibi_sprouts_r1_20261022, Phase 5, the week 3 props for the song videos.
Date of the brief: 2026-11-17. The brief came from the maker role prompt of PM order 2026-11-17
(week 3 props).

## The brief as given to the maker (2026-11-17)

assets/paint-splash.ts (name 'paint-splash'). Book: W3 "three big round splashes in a row: red,
blue, yellow". One asset with 3 presets; a scene places three. An upright round splash facing +Z:
a blob 0.30 m across, 0.025 m thick, its bottom edge touching y = 0 with a small flat foot (0.06 x
0.02 x 0.04 m box, same paint) so it stands. The outline: a circle r 0.12 m with 7 rounded lobes
(r 0.03 to 0.045 m) on the rim, and 3 droplets (r 0.015 to 0.022 m) joined to the rim by thin
necks (smoothUnion k 0.01) so no part floats. Glossy, roughness 0.3. Colour from one variant slot
`paint` with presets red #d9443a (default), blue #3f6fa8, yellow #f2c230. Check
./forge render paint-splash --preset all and record that the 3 renders differ in colour.

## Common rules for all the week 3 props

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Stay under 8,000 triangles. Use one
body per material.

## Sources

Source: Storytime inventory section 5, monorepo commit 9255c2711
(`git -C ../reading-advantage-monorepo show 9255c2711:measure/tracks/storytime_advantage_program_20261021/forge-inventory.md`).

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a paint splash | Inventory section 5, row "paint splash": "three big round splashes in a row: red, blue, yellow" |
| Weeks | week 3 | The same row: weeks "3" |
| Count | three splashes in a row | The same row: three big round splashes |
| Colours | red, blue and yellow | The same row fixes the three colours. The hexes #d9443a, #3f6fa8 and #f2c230 are PM defaults, check against the book |
| Size | 0.30 m across | PM default, check against the book |
| Size | 0.025 m thick | PM default, check against the book |
| Size | the circle r 0.12 m | PM default, check against the book |
| Count | 7 lobes | PM default, check against the book |
| Size | the lobes r 0.03 to 0.045 m | PM default, check against the book |
| Count | 3 droplets | PM default, check against the book |
| Size | the droplets r 0.015 to 0.022 m | PM default, check against the book |
| Size | the foot 0.06 x 0.02 x 0.04 m | PM default, check against the book |
| Finish | glossy, roughness 0.3 | PM default, check against the book |
| Colour | one variant slot `paint` with three presets | PM default, check against the book |

## Known differences

- One asset carries the three colours, so a scene places three copies with the red, blue and
  yellow presets.
- The built splash measures 0.289 m wide, 0.251 m tall and 0.04 m deep, and holds 2,026 triangles
  (out/paint-splash/stats.json). The brief asks for 0.30 m across.
- The bottom edge is a flat cut at y = 0. The foot box (0.06 x 0.02 x 0.04 m) sits inside that
  flat edge and fills its middle. The foot is 0.04 m deep while the paint is 0.025 m thick, so
  the foot shows as a small tab in front of and behind the flat edge.
- `forge inspect paint-splash` warns that the asset is all mid-value and that the side view is
  thin. Both follow from a flat splash in one colour.
- The three preset renders differ in colour. The dominant colour of the front view is #f24a3f
  (red), #3d80c9 (blue) and #f7c849 (yellow).
