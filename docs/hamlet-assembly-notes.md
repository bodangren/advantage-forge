# Hamlet assembly notes (for scene setup)

One-page handoff for assembling the Chibi Quest hamlet from the built assets.
Component ids and instance counts come from `docs/hamlet-mockups/components.tsv`;
the layout grid comes from `docs/hamlet-mockups/README.md`.

## World conventions

- Units are meters. +Y is up, +Z faces south toward the default camera. Ground plane is y = 0.
- Ground and road tiles are exactly 2 × 2 m with their walking surface flush at y = 0.08.
- Roads: 1.2 m packed warm-brown width. River channel: 1.4 m, water surface at y = 0.05.
- Grass/river/road tiles mate edge-to-edge with no seams; do not scale tiles.
- The planning grid is 12 columns (west → east) by 8 rows (north → south), from the mockup README.

## Placement notes

- `well-apron` goes down first; `well` stands on top of it (pad is 2.38 m round, 4 cm thick).
- `river-bank` has its water edge at +Z; rotate 180° for the opposite bank.
- `stepping-stone` is a 2 m path piece: lay from cottage doors toward the nearest road.
- `clothesline` spans about 2.2 m along X; put one in a cottage yard.
- Two `hay-bale`s flank the barn in the southwest farm.
- Four `lantern`s ring the central well crossing; two `signpost`s at the west and east road exits (row 4).
- The `bridge` crosses the stream where the north-south road meets rows 7–8.
- Counts: cottage ×7, shop-stall ×2, lantern ×4, signpost ×2; everything else repeats.

## Inventory (asset, bounding box in meters, triangles)

Each GLB is at `out/<name>/<name>.glb`.

| `cottage` | 2.60 × 2.33 × 2.48 | 5948 |
| `barn` | 5.22 × 4.03 × 4.18 | 4852 |
| `shop-stall` | 2.45 × 2.59 × 1.63 | 14546 |
| `well` | 2.06 × 2.67 × 1.88 | 19366 |
| `bridge` | 4.08 × 1.02 × 1.90 | 13186 |
| `fence` | 1.93 × 1.10 × 0.14 | 5072 |
| `grass-ground` | 2.00 × 0.08 × 2.00 | 38 |
| `dirt-ground` | 2.00 × 0.11 × 2.00 | 784 |
| `dirt-road-straight` | 2.00 × 0.09 × 2.00 | 1394 |
| `dirt-road-corner` | 2.00 × 0.08 × 2.00 | 7837 |
| `dirt-road-t-junction` | 2.00 × 0.09 × 2.00 | 1588 |
| `river-straight` | 2.00 × 0.16 × 2.00 | 2920 |
| `river-bend` | 2.00 × 0.08 × 2.00 | 12256 |
| `river-bank` | 2.00 × 0.08 × 2.00 | 3322 |
| `farm-field` | 4.28 × 0.23 × 3.28 | 13476 |
| `tilled-field` | 2.00 × 0.08 × 2.00 | 1528 |
| `oak-tree` | 3.43 × 4.49 × 3.10 | 11730 |
| `pine-tree` | 3.07 × 5.04 × 3.06 | 33660 |
| `bush` | 0.94 × 0.70 × 0.89 | 25618 |
| `wildflowers` | 0.70 × 0.49 × 0.56 | 28780 |
| `boulder` | 1.25 × 0.78 × 0.96 | 11284 |
| `barrel` | 0.67 × 0.92 × 0.67 | 7700 |
| `lantern` | 0.43 × 1.50 × 0.43 | 6702 |
| `signpost` | 1.25 × 2.15 × 0.48 | 9484 |
| `apple` | 0.12 × 0.13 × 0.12 | 3104 |
| `pumpkin` | 0.45 × 0.36 × 0.45 | 7046 |
| `hay-bale` | 0.91 × 0.88 × 0.66 | 1966 |
| `well-apron` | 2.38 × 0.04 × 2.38 | 2462 |
| `stepping-stone` | 2.00 × 0.16 × 2.00 | 1940 |
| `clothesline` | 2.16 × 1.80 × 0.40 | 4380 |