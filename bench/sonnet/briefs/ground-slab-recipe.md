# Ground slab recipe (owner decision 2026-10-01)

Every ground tile is a 0.3 m slab, like the tile mockups in `docs/item-mockups/*-mock.jpg`
(grass-floor, desert-ground, tile-floor, stone-ground, river-junction). The worked example is
`assets/grass-ground.ts`: read it first and copy its pattern.

## The contract

1. **Walkable top at y = 0.** Scenes and games stand every prop and character on y = 0. The
   flat part of the top, and all four top edges, are exactly at y = 0. Small decoration (tufts,
   pebbles, flowers, raised cobbles) may rise above y = 0 by 0.05 m or less. Water surfaces and
   road ruts may sit below y = 0.
2. **Body down to y = -0.3.** Add `const SLAB = 0.3;` and `const EDGE = 0.001;` and make the
   main body `sdf.box([2 + 2 * EDGE, SLAB + 2 * EDGE, 2 + 2 * EDGE]).at(0, -SLAB / 2, 0)`, or the
   same box intersected with the existing top shape. The final bounds are 2.002 x (0.302 or
   more) x 2.002 m with min y about -0.301. The outer vertical edges stay square (no rounding),
   so neighbours meet without a gap.
3. **Move the old top down.** The old tiles sit on y = 0 with their top at 0.06 to 0.19 m.
   Subtract the old top height from every y value of the top design (paint thresholds, bump
   thresholds, decoration positions, water levels), so the design is unchanged but its walkable
   surface is at y = 0. Update the paint and bump tests that use `y > <old top>` to `y > -0.01`.
4. **No `tileSurface` plane.** Remove any `k.add(... tileSurface(...))` and its import. In a
   textured build that plane bakes dark blocks onto the top. The box top is already flat.
5. **Paint the sides.** The sides show at the map edge and in the sprites. Paint them with a
   `paintFn` branch for points below the top (y < -0.01), like `sideColorAt` in grass-ground:
   - a lip of the top material (grass, snow, sand, moss) 0.04 to 0.08 m deep with a wavy lower
     edge that repeats along each edge (use `Math.sin(along * Math.PI * n)` with a whole n, where
     `along` is x on the ±z faces and z on the ±x faces);
   - below it the family material with 2 or 3 darker strata and a few pebble specks, darker
     toward the bottom.
   Family materials are in your brief.
6. **Triangles and warnings.** A slab tile is 2,000 to 10,000 triangles. Keep fine texture in
   `bump`. No `warning:` lines.
7. **Keep** the file path, the `name`, the export, the 2 m footprint, and the top design. Update
   the design note and the `description` (0.3 m slab, top at y = 0, the side material).

## Checks for each tile

- `FORGE_WORKERS=2 ./forge render <name> --fast`, then look at `out/<name>/render.png` once:
  the top design is unchanged, the top is at y = 0, the sides show the slab.
- Confirm the bounds line: 2.002 x ... x 2.002 m, and min y about -0.301 in
  `out/<name>/stats.json`.
- When the tile is right, run `FORGE_WORKERS=2 ./forge all <name>` once. Look at
  `out/<name>/render.png` once more only if the fast render showed a problem.
- Never commit. Edit only the files in your brief.
