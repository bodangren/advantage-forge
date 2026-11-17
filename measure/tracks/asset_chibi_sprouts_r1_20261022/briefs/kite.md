# Brief: kite

Track: asset_chibi_sprouts_r1_20261022, Phase 5, first prop batch of 15 new props.
Date of the brief: 2026-11-17 18:04. The brief came from the maker role prompt of commit 1dcca329.
No track file held the brief before this file. The audit of 2026-11-17 (F-D5) asked for this file.

## The brief as given to the maker (2026-11-17 18:04)

A paper kite, 0.5 m tall, 0.36 m wide, standing on its two lower wing tips, tilted back about 10
degrees, a tail of 3 cloth bows on the ground behind. Red (#c0503c) sail, cream (#efe6d2) cross spars
and edge band, wooden spars (#8a5a35) on the front, a string loop at the top. Sail 0.01 m thick or
more.

## Common rules for all five props

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Stay under 8,000 triangles. Use one
body per material.

## Sources

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a paper kite | Inventory section 5, `forge-inventory.md` at 9255c2711: W2 "two kites, one red and one yellow, high in sky"; W7 "one red-and-yellow kite, flies high over green park". The track spec Props row lists "kite" among the 15 new props |
| Size | 0.5 m tall | PM default, check against the book |
| Size | 0.36 m wide | PM default, check against the book |
| Size | 0.01 m thick sail or more | PM default, check against the book |
| Angle | tilted back about 10 degrees | PM default, check against the book |
| Part | a tail of 3 cloth bows | PM default, check against the book. The inventory names no tail |
| Colour | red #c0503c sail | The inventory fixes red for the W2 kite. The hex is a PM default, check against the book. Nearest Chibi Quest palette entry: the accent "flowers #e0533d" in `.claude/skills/forge-assets/references/materials-and-color.md` |
| Colour | cream #efe6d2 spars and edge band | PM default, check against the book. Nearest Chibi Quest palette entry: the light rule "#f2eadb-ish lights" and the trim #efe6d1 in the same file |
| Colour | wooden spars #8a5a35 | PM default, check against the book. Nearest Chibi Quest palette entry: the rustic wood #7d4a27 in the same file |
| Part | a string loop at the top | PM default, check against the book |

## Known differences

- The inventory wants the kite in the sky. The W2 line says "high in sky" and the W7 line says "flies
  high over green park". The built kite stands on the ground on its two lower wing tips.
- The inventory wants two kites for W2, one red and one yellow. The built kite is red only. It has
  no yellow sail and no second kite.
- The built kite measures 0.507 m tall and 0.358 m wide. It matches the brief.
- The maker log records the inspect warning "the side silhouette is very thin". The sail is 14 mm
  thick. The brief allows 10 mm.
- The built kite holds 5,632 triangles. It is under the limit of 8,000.
