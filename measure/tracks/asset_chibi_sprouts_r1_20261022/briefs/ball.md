# Brief: ball

Track: asset_chibi_sprouts_r1_20261022, Phase 5, first prop batch of 15 new props.
Date of the brief: 2026-11-17 18:04. The brief came from the maker role prompt of commit 1dcca329.
No track file held the brief before this file. The audit of 2026-11-17 (F-D5) asked for this file.

## The brief as given to the maker (2026-11-17 18:04)

A child's stitched leather ball, 0.16 m across, 0.16 m tall. Two cream (#efe6d2) panels and two red
(#c0503c) panels, dark seam lines (#5a4030) painted and in bump, a soft dent, roughness 0.75. Seams
must read at 128 px.

## Common rules for all five props

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Stay under 8,000 triangles. Use one
body per material.

## Sources

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a child's stitched leather ball | Inventory section 5, `forge-inventory.md` at 9255c2711: W2 "five colorful balls in a row, bouncing on green grass"; W7 "one red-and-yellow ball bouncing" |
| Size | 0.16 m across | PM default, check against the book |
| Size | 0.16 m tall | PM default, check against the book |
| Colour | cream #efe6d2, two panels | PM default, check against the book. Nearest Chibi Quest palette entry: the light rule "#f2eadb-ish lights" and the trim #efe6d1 in `.claude/skills/forge-assets/references/materials-and-color.md` |
| Colour | red #c0503c, two panels | PM default, check against the book. Nearest Chibi Quest palette entry: the accent "flowers #e0533d" in the same file |
| Colour | dark seam #5a4030 | PM default, check against the book. Nearest Chibi Quest palette entry: the dark rule "#1a1410-ish darks" |
| Material | leather, roughness 0.75 | PM default, check against the book. The palette table gives leather roughness 0.6 to 0.7 |
| Detail | the seams are painted and in bump | PM default, check against the book |
| Detail | a soft dent | PM default, check against the book |
| Check | the seams read at 128 px | PM default, check against the book |

## r2 (book colours, 2026-11-18)

PM order 2026-11-18: the group 2 reworks to match the book (Storytime inventory section 5,
monorepo 9255c2711). Book lines: W2 "five colorful balls in a row, bouncing on green grass"; W7
"one red-and-yellow ball bouncing".

The shape, the 4 gores, the dark seams and the dent stay. The fixed cream and red gores became two
colour slots, `panelA` (2 gores) and `panelB` (the other 2). The presets (the first is the default):

| Preset | panelA | panelB | Use |
| --- | --- | --- | --- |
| redyellow (default) | #d9443a | #f2c230 | W7 "one red-and-yellow ball bouncing" |
| bluewhite | #3f6fa8 | #f4f1ea | one of the W2 row of five |
| greenyellow | #4f9a4a | #f2c230 | one of the W2 row |
| orangewhite | #e8892c | #f4f1ea | one of the W2 row |
| purplewhite | #7b4a9e | #f4f1ea | one of the W2 row |

The seam #5a4030 and the floor shadow #6f503a keep a fixed colour in every preset. The ball
measures 0.16 x 0.16 x 0.159 m and holds 1,184 triangles.

## r3 (preset colour fix, PM 2026-11-18)

PM order 2026-11-18: the Red of the preset colour gate found the drift in the stored texels. The
leather used a positive shade, `k.tint(slot, 0.03 + 0.05 * sheen)`. A positive shade mixes toward
white in linear light, so the stored texel was not the slot colour. The recolour rule then
multiplies each channel by option over default, and the lighter texel drifts.

The leather now keeps the slot colour and darkens by 6 % where the sheen is low:
`k.tint(slot, -0.06 * (1 - sheen))`. A negative shade is a multiply, and the recolour rule keeps
it. The shape, the four gores, the dent, the seam, the floor shadow and the presets do not change.

`scripts/preset-colour-check.mjs ball` exits 0. Every preset slot lands on its option within
8/255. The anchor error is 5 to 7 of 255 and the formula residual is 0 or 1.

## Known differences

- The inventory wants five colourful balls in a row for W2. One ball asset serves the row through
  its five presets. Placing the five balls in a row is the scene's job.
- The inventory wants a red-and-yellow ball for W7. The default preset is red #d9443a with yellow
  #f2c230.
- The leather shade is darker only. A positive shade (a lift toward white) made the recolour rule
  drift. The lit leather is now the slot colour and the shaded leather is 6 % darker.
- The built ball measures 0.16 m across and 0.16 m tall. It stands on y = 0. It matches the brief.
- The built ball holds 1,184 triangles. It is under the limit of 8,000.
