# bread rework (items/food/bread) -> assets/bread.ts

Rework the existing file in place. The current build is a smooth yellow ellipsoid on a board: no crust shading and no score cuts.

Keep the bounds within 5 percent of the current size (0.40 x 0.17 x 0.25 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Loaf: an elongated rounded loaf with a flat bottom and a slightly lumpy top (displace 0.004 at most), three diagonal score slashes cut across the top (smoothSubtract), the pale crumb #f3dca0 visible inside the cuts.
2. Crust: golden brown #c58a3c at the sides to darker #9a5f24 on the top (paintFn by height), a light flour dusting as pale specks.
3. Board: keep the cutting board, #a0703f with grain in `bump` and a darker edge.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render bread --fast`, then look at out/bread/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all bread` once, and look at out/bread/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/bread.ts.
