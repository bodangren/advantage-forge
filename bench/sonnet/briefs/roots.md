# roots (nature/plants/roots) -> assets/roots.ts

Big gnarled tree roots 1.8 m wide and about 0.6 m tall: a short cut trunk stub in the middle with thick twisted roots spreading over the ground, some arching up and diving into it, with moss patches. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-forest/roots-mock.jpg (set `reference` to that path). Match its idea: the twisted, knuckled roots at the base of the mockup tree; this asset has only a 0.7 m trunk stub and no canopy.
Pattern file: assets/stump.ts (a cut trunk with root flare) for the trunk stub; use `sdf.chain` for the roots as in AGENTS.md. Read stump.ts first.

Palette: bark #8a5a35 with #5f3d22 grooves and lit #a9713c ridges; cut top pale wood #c9a06a with rings in #b5814a; moss #4a9a4f with #2f7a3f. Bark roughness 0.9 with a grain bump, moss roughness 1.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Stub: a cylinder r 0.3, 0.7 tall, with 3 bark grooves (cosine of the angle, amplitude 0.03) and a flat cut top with painted rings.
2. Roots: nine `sdf.chain` roots from the stub base (y 0.35, r 0.14) outward; three arch up to y 0.35 mid-way and dive under the ground (end below y = 0), six run along the ground with knuckles (y wave amplitude 0.06) and taper to r 0.05 at r 0.9 from the center; smoothUnion 0.05 into the stub; two short side branches per root.
3. Moss: five flattened ellipsoid patches (0.2 x 0.05 x 0.15) on the top of the roots and the stub, moss green, smoothUnion 0.02.
4. Ground: a thin dirt disc (r 0.95, 0.04 tall) in #5f3d22 under the roots so the asset sits as one piece.

Limits: whole asset under 5,000 triangles; `detail` 0.008. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/roots.ts.
