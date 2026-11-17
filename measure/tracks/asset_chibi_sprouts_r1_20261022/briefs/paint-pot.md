# Brief: paint-pot

Track: asset_chibi_sprouts_r1_20261022, Phase 5, first prop batch of 15 new props.
Date of the brief: 2026-11-17 18:04. The brief came from the maker role prompt of commit 1dcca329.
No track file held the brief before this file. The audit of 2026-11-17 (F-D5) asked for this file.

## The brief as given to the maker (2026-11-17 18:04)

A ceramic paint pot, 0.085 m tall, 0.075 m across, a small handle, cream (#efe6d2) body, red (#c0503c)
band, paint inside up to two thirds of its height. Presets red #c0503c (default), blue #3f6fa8, yellow
#e0b23c, green #4f8f5a. Paint flat and glossy (roughness 0.3), pot matte.

## Common rules for all five props

Stand on y = 0. Centre on the Y axis. Face +Z. Read at 128 px. Stay under 8,000 triangles. Use one
body per material.

## Sources

| Value | In the brief | Source |
| --- | --- | --- |
| Item | a ceramic paint pot | The track spec Props row lists "paint pot with 4 colour presets" among the 15 new props. Inventory section 5 of `forge-inventory.md` at 9255c2711 names no paint pot |
| Size | 0.085 m tall | PM default, check against the book |
| Size | 0.075 m across | PM default, check against the book |
| Part | a small handle | PM default, check against the book |
| Level | the paint reaches two thirds of the height | PM default, check against the book |
| Colour | cream #efe6d2 body | PM default, check against the book. Nearest Chibi Quest palette entry: the light rule "#f2eadb-ish lights" and the trim #efe6d1 in `.claude/skills/forge-assets/references/materials-and-color.md` |
| Colour | red #c0503c band | PM default, check against the book. Nearest Chibi Quest palette entry: the accent "flowers #e0533d" in the same file |
| Preset count | 4 colour presets | The track spec Props row: "paint pot with 4 colour presets" |
| Preset colour | red #c0503c, the default | Inventory section 5, paint splash row: "three big round splashes in a row: red, blue, yellow". The hex is a PM default, check against the book |
| Preset colour | blue #3f6fa8 | Inventory section 5, paint splash row: "three big round splashes in a row: red, blue, yellow". The hex is a PM default, check against the book |
| Preset colour | yellow #e0b23c | Inventory section 5, paint splash row: "three big round splashes in a row: red, blue, yellow". The hex is a PM default, check against the book |
| Preset colour | green #4f8f5a | PM default, check against the book. The inventory names no green paint |
| Finish | the paint is flat and glossy, roughness 0.3 | PM default, check against the book |
| Finish | the pot is matte | PM default, check against the book |

## Known differences

- The orchestrator review note of 2026-11-17 reads: "paint-pot reads weak: a red rim band, not
  paint". The red band does not read as paint.
- The brief wants a flat pool at two thirds of the height. The built paint is a mound. It clears the
  rim of the pot. The maker log states the reason: a pool inside the cup stays hidden in every
  delivery view.
- The built pot measures 0.084 m tall and 0.072 m across. The brief says 0.085 m and 0.075 m.
- The built paint has roughness 0.25. The brief says 0.3.
- The built pot holds 1,328 triangles. It is under the limit of 8,000.
- The maker log records faint vertical streaks on the cream wall. They come from the mesh grid.
