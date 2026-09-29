# cave-mouth (nature/terrain/cave-mouth) -> assets/cave-mouth.ts

A rocky cave entrance 4 m wide and 3 m tall: an arch of big faceted grey boulders around a dark opening, a mossy grass mat under and around it, loose small stones at the sides. Stand on y = 0, centered on Y, front toward +Z (the opening faces +Z).

Mockup: bench/overnight/refs/p1-forest/cave-mouth-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Pattern file: assets/rock-cluster.ts (merged faceted stones on a dirt patch; the same stone treatment at larger scale). Read it first and copy its stone and moss recipe.

Palette: stone #8a94a0 with dark crevice #5b6670 and lit crown #aab4bf; grass mat #7ec850 with #4a8a3f in the hollows; moss dots #4a9a4f; the cave interior a near-black #1a1c20. Stone roughness 0.9 with a fine grain bump; grass roughness 0.95.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Arch: seven to nine boulders, each `sdf.box([1.0..1.4, 0.8..1.1, 0.9..1.2], 0.12)` rotated a few degrees, placed on an arc from (-1.8, 0.5) over the top (0, 2.5) to (1.8, 0.5) in the XY plane, with z about 0; `smoothUnion 0.05` into one stone body; the boulders lean inward so the arch reads as a ring. Keep all boulders at least 0.9 m deep in z so the arch has thickness.
2. Interior: a dark body (one rounded box 2.4 x 2.2 x 1.2 at y 1.1, z -0.3, `flat`, near-black, roughness 1) that fills the opening from behind, so the mouth reads as a black hole from the front. Subtract nothing; just place it behind the arch.
3. Ground: a flattened blob (an ellipsoid [2.6, 0.25, 2.0] at y -0.1, displaced with low-frequency noise for a wobbly outline) in grass green; `paintFn` noise for lighter and darker patches; 12 to 16 small moss dot spheres (r 0.06 to 0.1) on its top in the moss green.
4. Loose stones: four to five small faceted boxes (0.25 to 0.4) at the sides and one flat slab in front, same stone body.

Limits: whole asset under 8,000 triangles; `detail` 0.012 on stone and ground, 0.008 on small stones. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/cave-mouth.ts.
