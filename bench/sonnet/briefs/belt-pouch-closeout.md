# belt-pouch rework (equipment/accessories/belt-pouch) -> assets/belt-pouch.ts

Rework the existing file in place. Priority P1: the target score is 7.0 of 10. Reference: docs/item-mockups/belt-pouch-mock.jpg.

The current pouch is a sagging blob: a trapezoid with lumps, a broken zigzag band, and a lumpy brass stud. The mock is a neat, puffy leather pouch.

Build it again from clean parts:
1. Body: a puffy rounded box about 0.2 m wide, 0.16 m tall, 0.08 m deep, with a round bottom (the lower corners have a large radius) and flat sides. Leather #b8683a, roughness 0.6.
2. Lower front panel: a darker leather band #6b3a24 across the lower third of the front, with a row of small triangle teeth (a zigzag trim) along its top edge, as in the mock.
3. Flap: a rounded flap from the top edge down over two thirds of the front, 0.008 m thick and proud of the body, with a scalloped (wavy) stitched border: a cream stitch line #e8cfa0 painted 0.01 m inside the edge.
4. Strap: a vertical strap in the center, 0.045 m wide, from the top of the flap to below the flap edge, ending in a point, with stitched edges. A brass round button #c9a04a (a dome, radius 0.016 m) on the strap at the flap middle, and a brass bar slider (0.06 x 0.016 m) below it.
5. Back: keep a belt loop on the back.
6. A stitched welt (a thin raised rim) around the body edge.

Keep the size within 10 percent of the current bounds (0.2 x 0.145 x 0.1 m), standing on y = 0, facing +Z.

Rules: put fine surface detail (grain, grooves, stitching, pits) in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick. Keep the file path, the `name`, the export, and the catalog role. 

Checks: `FORGE_WORKERS=2 ./forge render belt-pouch --fast`, then look at out/belt-pouch/render.png and compare with the reference. At most 4 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all belt-pouch` once (it can wait for a build slot; give it a long timeout), and look at out/belt-pouch/sprites/preview.png once. No `warning:` lines. Run `node scripts/typecheck-asset.mjs belt-pouch` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/belt-pouch.ts.
