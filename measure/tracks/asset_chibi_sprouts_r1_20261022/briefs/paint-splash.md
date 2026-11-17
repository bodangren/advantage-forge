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

## r2 (B1, 2026-11-18)

The week 3 acceptance run rated the splash 6.5 of 10, below the bar of 7.0. The finding named four
faults: a foot tab on both faces, ring seams on the face, one flat mid-value, and a scalloped badge
outline. The maker changed the asset only.

### The five changes

1. The foot is 0.02 m deep, not 0.04 m. The paint is 0.025 m thick at the rim, so the foot now
   sits inside the thickness of the blob and shows no tab in front of or behind the faces. The
   width stays 0.06 m and the height stays 0.02 m.
2. Every lobe, drop and neck joins the disc with one smoothUnion of k 0.025 m. The old joins used
   k 0.004 m for the lobes and k 0.01 m for the drops, and each left a ring on the face. The lobes
   and the drops are soft domes now, so the face carries no ring seam.
3. The faces curve. A dome ellipsoid lifts the centre of the blob 0.008 m above the rim: 0.033 m
   thick at the centre, 0.025 m at the rim. The roughness is 0.25, so the paint reads wet.
4. The outer 0.015 m of the outline is painted 25 % darker than the paint colour, through the
   `paint` slot (k.tint('paint', -0.25)). The band follows the silhouette on the front face, the
   back face and the rim. A preset recolours the whole slot, so each preset keeps its own dark rim.
5. The splash keeps 0.30 m across, stands on y = 0, faces +Z, and holds 1,968 triangles.

### The evidence after the change

- out/paint-splash/stats.json: 0.291 x 0.252 x 0.05 m, 1,968 triangles, the bottom at y = -0.001 m.
- `node measure/runs/asset_hy4_maker_trial_20261116/mech-check.mjs paint-splash`: ok:true, no
  warning line, the type check exits 0.
- `node scripts/cutout-check.mjs out/chibi-sprouts/r1/props`: the last line is result ok. The front
  and the three-quarter cutouts of the splash are ok.
- The preset cutouts: `out/chibi-sprouts/r1/props/presets/blue` and
  `out/chibi-sprouts/r1/props/presets/yellow`. cutout-check says result ok for both folders.
- The mean colour of the front cutout is #e74f45. The old build read #f3635c, a pale coral.

## Known differences

- One asset carries the three colours, so a scene places three copies with the red, blue and
  yellow presets.
- The built splash measures 0.291 m wide, 0.252 m tall and 0.05 m deep, and holds 1,968 triangles
  (out/paint-splash/stats.json). The brief asks for 0.30 m across. The paint is 0.025 m thick at
  the rim and 0.033 m at the centre; the wide fillet adds about 7 mm at the lobe joins, so the
  bounding box is 0.05 m deep.
- The bottom edge is a flat cut at y = 0. The foot box (0.06 x 0.02 x 0.02 m) sits inside that
  flat edge and fills its middle. The foot is 0.02 m deep, so it stays inside the 0.025 m
  thickness of the paint and shows no tab.
- `forge inspect paint-splash` still warns that the asset is almost all mid-value and that the side
  view is thin. The dark rim adds value, but the studio light lifts the rim, so the face reads
  pale in the middle.
- The wide fillet of 0.025 m absorbs the thin necks. The three droplets read as round bumps on the
  rim, not as separate drops with a thread between them. The brief asked for necks and the finding
  asked for one wide fillet, so the fillet wins.
- The dark band is cut from the footprint of the outline, the same outline made tall. Its inner
  edge follows the silhouette within a few millimetres. The foot lies inside the band, so the foot
  is dark too.
- The three preset renders differ in colour. The mean colour of the front cutout is #e74f45 (red),
  #487fbf (blue) and #f0c447 (yellow).
