# yurt (architecture/structure/yurt) -> assets/yurt.ts

A felt yurt 4 m wide and 3 m tall: a round cream felt wall with a soft puffy surface, one red rope band around the wall and one at the roof line, a shallow conical roof with a scalloped lower edge, a crown ring with a small red finial on top, and a brown wooden arched door on the front (+Z) with a red knob. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-village/yurt-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Pattern file: assets/hut.ts (a round hut with a conical roof and a door; copy its structure). Read it first.

Palette: felt cream #efe4cc with #dccfb2 in the shadows; band red #e8766a with dark red #c5524a in the folds; door warm brown #8a5a35 with dark walnut #6b4226 planks; knob red #c8423a; crown ring pale cut wood #c9a06a. Felt roughness 1 with a soft noise `bump`; wood roughness 0.8.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Wall: `sdf.revolve` of a profile r 2.0 at y 0, bulging to r 2.05 at y 0.9, back to r 1.9 at y 1.7; edges rounded. `.displace(0.02, fbm)` at low frequency (about 1.5 per meter) for the puffy felt.
2. Roof: `sdf.cone` from (0, 1.6, 0) r 2.1 to (0, 2.75, 0) r 0.25 with the base edge rounded; a second, shorter cone skirt (y 1.6 to 2.0, r 2.15 to 1.85) whose lower edge is scalloped: intersect it with a ring of 14 spheres or use a cosine `.displace` of the angle around Y so the edge waves.
3. Crown: a torus (R 0.3, r 0.06) at y 2.75 in pale wood; a short red cone finial (0.15 tall) on top at y 3.0.
4. Bands (one red body): a flattened torus at the roof line (y 1.62, R 2.05, r 0.09, scale y 0.7) and a wall band at y 0.65 (R 2.03, r 0.08). Both `smoothUnion` into nothing; keep them separate bodies from the felt.
5. Door: a rounded box 0.9 wide x 1.5 tall x 0.16 deep with a half cylinder top (arch), pushed into the front wall at z 1.95 so its face is 0.05 m proud; three shallow plank grooves via `subtract`; a small red knob sphere. Cut a matching arch recess 0.1 m deep into the wall around it.

Limits: whole asset under 6,000 triangles; `detail` 0.012 on the felt and roof, 0.008 on the door and crown. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/yurt.ts.
