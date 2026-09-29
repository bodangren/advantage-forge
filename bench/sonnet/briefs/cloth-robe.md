# cloth-robe (equipment/armor/cloth-robe) -> assets/cloth-robe.ts

A plain brown cloth robe standing as on an invisible body, 1.0 m tall: a bell body, two wide sleeves with turned-back cuffs, a twisted rope belt with a knot and two hanging ends, and a hood folded down on the back (no head, no hands). Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-gear/cloth-robe-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail; the mockup shows the hood up around a face, but this asset has no body, so fold the hood down as a soft cowl on the back of the shoulders.
Pattern file: assets/mage-robe.ts (same construction: a revolved bell profile, sleeve cones, a rope belt; copy its structure, change the shapes and colors). Read it first.

Palette: robe brown #8a5a35 dominant, dark walnut #6b4226 in folds and under the cuffs, pale cut wood #c9a06a on the rope with #b5814a strands. Cloth roughness 0.9, rope roughness 0.9, no metal.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, a silhouette that reads at 128 px. One body per material.

Construction recipe:
1. Body: `sdf.revolve(profile.polygon(...))` bell: closed shoulder top at y 1.0, narrow chest (r 0.19) at y 0.8, hem r 0.32 at y 0. Give the hem a soft wave with a small `.displace`.
2. Sleeves: cones from the shoulders (y 0.9) down and out to the cuffs at about (0.42, 0.55, 0.05), r 0.07 to 0.1, `smoothUnion 0.03` into the body, mirrored. Cuffs: a slightly larger short cylinder ring, dark walnut.
3. Front overlap: a thin vertical strip on the chest (a rounded box) that sits 5 mm proud of the body, so the wrap edge reads.
4. Rope belt: a torus around the waist (y 0.5) with `bump` strand grooves, plus a knot sphere in front and two hanging chain ends (`sdf.chain`).
5. Hood: a flattened capsule or ellipsoid on the upper back (y 0.9, z -0.15) in the robe brown, blended 0.02.

Limits: whole asset under 5,000 triangles; `detail` 0.006 (0.008 on the plain bell). No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/cloth-robe.ts.
