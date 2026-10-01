# farm-field rework (hamlet kit) -> assets/farm-field.ts

Rework the existing file in place. No reference image: follow this brief and the hamlet palette. The current build is a thin framed soil sheet with scattered sprout dots and no rows. It is an overlay: scenes and the dragon-flight game place it on top of grass tiles, so it stays on y = 0 and it is not a 0.3 m slab.

Keep the bounds within 5 percent of the current size (4.28 x 0.23 x 3.28 m, x by y by z), standing on y = 0. Priority P1 (game-used): the target score is 7.5 of 10. Triangle budget: 12,000 in total. The sprite camera looks down, so the top of the field is the largest face.

Construction recipe:
1. Frame: a low chunky wooden border of 4 beams (0.12 to 0.14 m thick, soft bevels), warm wood #8a5a32 with grain in `bump` and darker end grain, with a corner post at each corner.
2. Soil: dark tilled earth #5d3d23 filling the frame, its surface about 0.06 m above y = 0, with 6 to 8 raised soil ridges (0.03 to 0.04 m high) running along X, dark furrows #452c19 between them, and light soil flecks. See `assets/tilled-field.ts` for a ridge recipe.
3. Crops: on every ridge a row of 8 to 10 young cabbage or lettuce plants, each 3 to 5 cupped leaves (0.08 to 0.12 m across) in fresh green #6fb04a with a lighter center #a8d76c. Each plant must read as a small green rosette at 128 px, not a dot. Keep the crops as one or two bodies.
4. A small accent: a watering can or a sack at one corner inside the frame is optional; skip it if the budget is short.

Rules: put fine surface detail (grain, soil crumbs) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less. Stay inside the triangle budget: raise `maxTriangles` only when the build warns. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render farm-field --fast`, then look at out/farm-field/render.png. At most four looks. Then `FORGE_WORKERS=2 ./forge all farm-field` once, and look at out/farm-field/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/farm-field.ts.
