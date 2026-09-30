# hay-bale rework (props/farm/hay-bale) -> assets/hay-bale.ts

Rework the existing file in place. The current build is a yellow block with crumpled facets from a strong displace and a few straw sticks on top.

Keep the bounds within 5 percent of the current size (0.91 x 0.88 x 0.66 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Bale: a rounded box with a 0.06 m bevel and no `displace`. Straw texture in `bump`: fbm stretched along X (for example x*4, y*40, z*40).
2. Bands: two twine bands #8a6a3a around the bale, slightly sunk into the straw.
3. Color: straw #e0b84a, a lighter top #f0d070, a darker bottom #b8923a (paintFn by height).
4. Wisps: 20 to 30 loose straw wisps (capsules r 0.006 m, 0.08 to 0.15 m long) sticking out along the top edges and the ends, not only the top.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render hay-bale --fast`, then look at out/hay-bale/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all hay-bale` once, and look at out/hay-bale/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/hay-bale.ts.
