# cabbage rework (props/food/cabbage) -> assets/cabbage.ts

Rework the existing file in place. Reference: docs/item-mockups/cabbage-mock.jpg (a round pale-green head of overlapping, cupped, wrinkled leaves, held in a ring of darker, wide, wavy outer leaves). Do not model the face in the mockup: food items in the catalog carry no face. The current build has 5 tall petal leaves that stand up like a lotus around a smooth head.

Keep the bounds within 5 percent of the current size (0.25 x 0.20 x 0.24 m), standing on y = 0 and facing +Z. Priority P1: the target score is 7.0 of 10. Triangle budget: 4,000 in total.

Construction recipe:
1. Head: a slightly flattened sphere, about 0.17 m across, pale green #b8dc84. Show 3 to 4 overlapping leaf layers on it: thin shells of the head cut into broad cupped leaf shapes whose edges wrap over the top, each edge a raised lip 0.005 m high.
2. Veins and wrinkles: a central rib and branching veins on each leaf, paler #d8efb0, and a fine crinkle, both in `bump` and paint.
3. Outer leaves: 5 to 7 wide darker leaves #5f9e3a with wavy edges, cupped around the lower half of the head and flaring out low and wide. Their tips stay below the top of the head.

Rules: put fine surface detail (grain, grooves, weave, pits, hammer marks) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick, or scaled up to read on small items. Stay inside the triangle budget: raise `maxTriangles` only when the build warns. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render cabbage --fast`, then look at out/cabbage/render.png; compare with the reference. At most four looks. Then `FORGE_WORKERS=2 ./forge all cabbage` once, and look at out/cabbage/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/cabbage.ts.
