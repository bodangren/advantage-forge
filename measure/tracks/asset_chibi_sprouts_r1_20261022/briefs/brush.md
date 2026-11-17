# Brief: brush

Track: asset_chibi_sprouts_r1_20261022, Phase 5, first prop batch of 15 new props.
Date of the brief: 2026-11-17 18:04. The brief came from the maker role prompt of commit 1dcca329.
No track file held the brief before this file. The audit of 2026-11-17 (F-D5) asked for this file.

## The brief as given to the maker (2026-11-17 18:04)

A paint brush, 0.17 m long, upright, leaning about 8 degrees, resting on the bristle tip. Wooden
handle (#b5814a) with a warm brown (#8a5a35) grip band, iron (#4a4f55) ferrule, cream (#d8ccb2)
bristles with a red (#c0503c) paint tip. Handle radius 0.012 m or more.

## Common rules for all five props

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Stay under 8,000 triangles. Use one
body per material.

## Sources

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a paint brush | Inventory section 5, `forge-inventory.md` at 9255c2711: W3 "held by children; pink and purple paint". The track spec Props row lists "brush" among the 15 new props |
| Size | 0.17 m long | PM default, check against the book |
| Angle | leans about 8 degrees | PM default, check against the book |
| Size | the handle radius is 0.012 m or more | PM default, check against the book |
| Colour | wooden handle #b5814a | PM default, check against the book. Nearest Chibi Quest palette entry: the rustic wood #7d4a27 in `.claude/skills/forge-assets/references/materials-and-color.md` |
| Colour | warm brown #8a5a35 grip band | PM default, check against the book. Nearest Chibi Quest palette entry: the rustic wood #7d4a27 in the same file |
| Colour | iron #4a4f55 ferrule | PM default, check against the book. Nearest Chibi Quest palette entry: the dungeon iron #3d4047 in the same file |
| Colour | cream #d8ccb2 bristles | PM default, check against the book. Nearest Chibi Quest palette entry: the spooky bone #d8cfb8 in the same file |
| Colour | red #c0503c paint tip | PM default, check against the book. The inventory fixes pink and purple paint, not red. Nearest Chibi Quest palette entry: the accent "flowers #e0533d" in the same file |
| Part | the brush rests on the bristle tip | PM default, check against the book |

## r2 (book colours, 2026-11-18)

PM order 2026-11-18: the group 2 reworks to match the book (Storytime inventory section 5,
monorepo 9255c2711). Book line: W3 "held by children; pink and purple paint".

The brush stays. The red bristle tip became one colour slot, `paint`, with two presets:

| Preset | Colour | Use |
| --- | --- | --- |
| pink (default) | #e87fb0 | W3 pink paint |
| purple | #8e5bb5 | W3 purple paint |

Nothing else on the brush is red. The cream bristles, the wood handle, the grip band and the iron
ferrule keep their colours in every preset. The brush measures 0.043 x 0.169 x 0.029 m and holds
1,510 triangles.

## r3 (paint tip, PM 2026-11-18)

PM order 2026-11-18: the acceptance finding N3 of the group 2 rework. The paint tip was 76 px at
1024 px/m and the brush read as a fat pencil.

The paint now covers the bristles from the tip up to the ferrule edge. Every bristle surface
below the ferrule is the `paint` slot colour, and no cream is left. The bristle radius grows by
20 %: the cone goes from 3.2 mm to 3.84 mm at the tip and from 12.8 mm to 15.36 mm at the
ferrule edge, and the round tip grows from 3.2 mm to 3.84 mm. The length of 0.17 m, the handle,
the ferrule, the lean of 8 degrees and the two presets stay. The brush measures 0.046 x 0.169 x
0.031 m and holds 1,588 triangles.

## Known differences

- The inventory wants pink and purple paint on the brush for W3. The tip is the `paint` colour
  slot: pink #e87fb0 by default, purple #8e5bb5 in the second preset. The red tip is gone.
- The bristles carry the paint from the tip up to the ferrule edge. The cream bristles of the
  first brief are gone, so the whole bristle is the paint colour in every preset.
- The built brush measures 0.169 m long. It stands on the bristle tip and leans 8 degrees toward +X.
  It matches the brief.
- The built grip band is real geometry. The maker log names the risk: a thin ring of the handle can
  read as part of the band.
- The built brush holds 1,588 triangles. It is under the limit of 8,000.
