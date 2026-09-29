# ancient-tree (nature/trees/ancient-tree) -> assets/ancient-tree.ts

A huge ancient oak 5 m tall and about 5 m wide: a very thick twisted trunk with big spreading roots, a dark hollow at the base, a vine loop around the trunk, and a wide rounded canopy of clustered leaf blobs. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-forest/ancient-tree-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Pattern file: assets/ancient-oak.ts exists already (an older, different attempt); read assets/oak-tree.ts first for the canopy clump recipe and copy it; this tree is bigger with far more root and trunk mass.

Palette: bark #8a5a35 with #5f3d22 grooves and lit #a9713c ridges; leaf green #6fae43 with sunlit top #b2d95e and underside #3e7331; the hollow near-black #1a1c20. Bark roughness 0.9, foliage roughness 0.72.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Trunk: a `sdf.cone` from (0, 0, 0) r 0.9 to (0, 2.6, 0) r 0.55 with a gentle twist: `.displace(0.05, fbm)` at low frequency plus 4 vertical bark grooves (cosine of the angle around Y, amplitude 0.04). Three to four fat branch cones from y 2.3 out and up to r 4 at y 3.3, smoothUnion 0.08.
2. Roots: eight `sdf.chain` roots from the trunk base (y 0.6, r 0.3) out to r 1.8 to 2.4 at ground (r 0.12 at the tips), with a slight up-down wave so they knuckle; smoothUnion 0.06 into the trunk. Every root tip touches y = 0.
3. Hollow: subtract a rounded box 0.5 x 0.7 x 0.6 at (0, 0.45, 0.75) from the trunk front and put a dark near-black body inside it.
4. Vine: a torus (R 0.7, r 0.07) tilted 15 degrees around the trunk at y 1.4, in the bark color with a slight offset so it reads as a wrapped loop.
5. Canopy: 16 to 20 overlapping spheres and ellipsoids (r 0.7 to 1.2) in a dome from y 2.6 to y 5.0 spanning x -2.5 to 2.5, smoothUnion 0.12, one foliage body; `paintFn` sunlit on top, darker below, plus scalloped rims from `.displace(0.03, noise)`.

Limits: whole asset under 9,000 triangles; `detail` 0.014 on the canopy, 0.012 on the trunk and roots, 0.01 on the vine. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/ancient-tree.ts.
