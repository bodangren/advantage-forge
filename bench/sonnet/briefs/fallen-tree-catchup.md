# fallen-tree rework (nature/terrain/fallen-tree) -> assets/fallen-tree.ts

Rework the existing file in place. Reference: docs/item-mockups/fallen-tree-mock.jpg (a thick, chunky, short-looking log with a cut end that shows rings, bark cracks, and moss clumps on top). The current build is a thin log with a large upright root disc that reads as a plate.

Keep the bounds within 5 percent of the current size (3.58 x 1.04 x 1.04 m, x by y by z), lying on y = 0: scenes place this asset. Priority P1: the target score is 7.0 of 10. Triangle budget: 9,000 in total.

Construction recipe:
1. Trunk: one thick log, diameter about 0.75 m at the root end, tapering to about 0.6 m, lying along X and slightly sunk into the ground (0.05 m). It must fill most of the 1.04 m height and depth, not sit as a thin stick in a large box.
2. Root end (keep it on the same side as now): a root flare with 5 to 7 thick roots (0.08 to 0.14 m) that splay out and down into the ground. No flat upright disc.
3. Other end: a flat saw-cut or broken face with 4 to 6 concentric growth rings painted pale #c89a62 and dark #8a5a32, and a darker bark rim.
4. Bark #6e4a2c to #4e3420 with vertical cracks in `bump` and color, 2 short branch stubs, moss clumps #5d8f2a on the top only (3 to 5 clumps, thick enough to read), and 2 or 3 small ferns or grass tufts at the base if the budget permits.

Rules: put fine surface detail (grain, grooves, weave, pits, hammer marks) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick, or scaled up to read on small items. Stay inside the triangle budget: raise `maxTriangles` only when the build warns. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render fallen-tree --fast`, then look at out/fallen-tree/render.png; compare with the reference. At most four looks. Then `FORGE_WORKERS=2 ./forge all fallen-tree` once, and look at out/fallen-tree/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/fallen-tree.ts.
