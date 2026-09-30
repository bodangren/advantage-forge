# rock-cluster rework (nature/terrain/rock-cluster) -> assets/rock-cluster.ts

Rework the existing file in place. The current build is smooth grey blobs on a flat green disc.

Keep the bounds within 5 percent of the current size (1.10 x 0.33 x 0.95 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Stones: 5 to 7 stones of varied size, each a rounded box or ellipsoid intersected with 3 to 4 tilted `halfSpace` cuts (smoothIntersect 0.02) for chunky planar facets.
2. Color: grey #9aa3a6 with lighter tops and darker bases (paintFn by height), speckle and pits in `bump`.
3. Ground: replace the flat green disc with a low irregular dirt and grass patch that hugs the stones (no hard disc edge), with small grass tufts at the stone bases.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render rock-cluster --fast`, then look at out/rock-cluster/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all rock-cluster` once, and look at out/rock-cluster/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/rock-cluster.ts.
