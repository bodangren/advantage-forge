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

## r2 brief (2026-11-17, commit b51f0ae7)

The redo brief, from the audit of 2026-11-17 item 2:

- Cream #efe6d2 matte body.
- No red band.
- A warm brown #8a5a35 foot ring, 0.006 m.
- Flat paint 0.003 m below the rim.
- Three drips: front 0.040 m, 50 degrees 0.028 m, 200 degrees 0.034 m; 0.010 to 0.014 m wide;
  0.003 m proud; with rim lips.
- All paint one body on the variant slot.

The r2 build supersedes the first-brief numbers below where they differ: the band is gone, the
paint is a flat surface with drips, and the paint roughness is 0.3.

## Known differences

- The orchestrator review note of 2026-11-17 reads: "paint-pot reads weak: a red rim band, not
  paint". The red band does not read as paint.
- The first build's paint was a mound. The r2 build is a flat pool 0.003 m below the rim, with 3
  drips and rim lips, as the r2 brief asks. The pool stays hidden in the delivery views; the drips
  and the lips carry the colour.
- The built pot measures 0.084 m tall with the lips (the pot body is 0.080 m) and 0.072 m across.
  The first brief asked for 0.085 m and 0.075 m; the r2 brief sets no height.
- The built paint has roughness 0.3. The first build used 0.25.
- The built pot holds 2,218 triangles. It is under the limit of 8,000.
- The maker log records faint vertical streaks on the cream wall. They come from the mesh grid.
- The checker (Sonnet max, PASS 7.0) found the foot ring does not read as a ring (F1). The brown
  torus exists at `assets/paint-pot.ts:178`, but the pot flare covers it; the pictures show a ragged
  brown line about 1 px tall at 128 px. This is the largest remaining difference and the reason the
  rating stays at 7.0. Source:
  `measure/runs/asset_chibi_sprouts_r1_20261022/acceptance-paint-pot-08f32c2.json`.
- The r2 measured facts above (height, diameter, roughness, triangles) come from the same
  acceptance file and `out/paint-pot/stats.json` at audited HEAD 08f32c29.
