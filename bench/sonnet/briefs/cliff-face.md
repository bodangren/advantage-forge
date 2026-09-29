# cliff-face (nature/terrain/cliff-face) -> assets/cliff-face.ts

A cliff face section 3 m wide (x), 3 m tall, 1 m deep (z): stacked faceted grey and tan rock strata with two jutting ledges, a grass mat on the top, grass patches on the ledges, and a flat back at z = -0.5 so sections join. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-forest/cliff-face-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail: faceted `flat` rock chunks, soft green mats.
Pattern file: assets/cliff-edge.ts (turf over faceted rock; the same rock and turf recipe). Read it first.

Palette: rock grey #8a94a0 with tan #b5a37f on the front faces and dark crevice #5b6670; grass #7ec850 top, #4a8a3f underside. Rock roughness 0.92 with a fine grain bump, `flat: true` on the rock body; grass roughness 0.9.
Art direction (Chibi Quest): chunky faceted rock with soft green mats; oversized readable features. One body per material.

Construction recipe:
1. Core: a box 2.6 x 3.0 x 0.9 at y 1.5, z -0.05, in the rock body.
2. Chunks: 14 to 18 rotated rounded boxes (0.5 to 1.1 m, radius 0.04, random rotations up to 25 degrees) unioned (k 0.02) into the core so the front and sides bulge with facets; more and bigger chunks near the base so the cliff spreads at the foot; smaller ones near the top. Cut the whole rock flat at the back with `intersect(halfSpace([0,0,-1], 0.5))`.
3. Ledges: two flat rounded slabs 1.2 x 0.15 x 0.6 that jut 0.4 m from the face at y 1.0 (right) and y 2.0 (left).
4. Grass: a flattened wobbly mat on the top (a box 2.8 x 0.12 x 1.0 rounded 0.06, displaced with low-frequency noise for a lobed outline) hanging 0.05 over the edges; a grass slab on each ledge; three small grass wedges (flattened cones) on the face.
5. `paintFn`: tan on faces with normals toward +Z (front-lit), grey elsewhere, dark in the crevices (lower noise value).

Limits: whole asset under 7,000 triangles; `detail` 0.014 on rock, 0.01 on grass. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/cliff-face.ts.

## Rework notes (2026-09-29, after three medium passes scored 5.0, 6.5, 6.5)
The rock body in assets/cliff-face.ts is accepted as is (tapering faceted chunks, spread foot, tan/grey split, flat back). Do not change the rock body or its detail/maxError settings (0.07 / 0.04 were needed to stay under the cap).
The grass fails: the top mat reads as a flat saucer wider than the rock, and the ledge mats and wedges are small blobs. Target, from the mockup: a thick (0.25 m) turf cap whose outline follows the rock top with 5 to 6 rounded lobes that overhang the front and side edges by 0.1 to 0.25 m, with a drooping lip on the front; two ledge turfs that sit on the ledge slabs and overhang their front edge; three flat grass wedges leaning on the face. The mat must not extend past the flat back plane (z -0.5) and must not be wider than the rock plus the overhang.
Approach that should work: build the cap as an extruded 2D profile (`sdf.extrude(profile.polygon(points, { smooth: true }), 0.25)` rotated to lie flat), where the points trace the rock's top outline with lobes, then `.round(0.06)`; sample the rock outline from the chunk positions in the file. Grass body `detail` 0.016, `maxError` 0.006, no `maxTriangles`.
