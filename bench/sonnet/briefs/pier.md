# pier (architecture/structure/pier) -> assets/pier.ts

A wooden pier section 4 m long (z) and 2 m wide (x), deck top 1.2 m above y = 0: a plank deck on thick round posts, a low rope railing on one side (+X), a mooring post with a ball cap at the front corners. Stand on y = 0, centered on Y, front toward +Z (the water end points to -Z).

Mockup: bench/overnight/refs/p1-village/pier-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail: the mockup is a stubby square deck; this asset is longer (4 m) and higher (1.2 m) with a rope railing.
Pattern file: assets/dock.ts (a plank deck on log posts with a bollard; the same family, lower and shorter). Read it first and copy its structure.

Palette: deck planks pale cut wood #c9a06a with honey oak #b5814a variation, posts warm brown #8a5a35 with dark walnut #6b4226 shadows, post caps honey oak, rope straw #e0bb60 / #c8a86b. Wood roughness 0.85, rope roughness 0.92, no metal.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Deck: 11 planks across (each a rounded box 0.17 x 0.1 x 4.0, radius 0.02, gap 0.015), deck top at y 1.2; alternate plank length by 2 to 4 cm so ends stagger; `paintFn` with noise for grain and per-plank tone.
2. Two beams under the planks along z (0.15 x 0.15) at x = +-0.8.
3. Posts: six round posts r 0.13 from y 0 to y 1.1 at x = +-0.85, z = -1.7, 0, 1.7, plus a diagonal brace pair at each end. The four corner posts continue up to y 1.75 and end in a rounded cap block with a sphere on top (r 0.13), as in the mockup.
4. Rope railing on the +X side only: a rope `sdf.chain` sagging between the corner post tops (y 1.65 at the posts, y 1.5 mid-span), r 0.03, through the middle post top.
5. A rope coil on the deck near the front-left corner (a flattened torus stack) as the focal point.

Limits: whole asset under 6,000 triangles; `detail` 0.01 on planks and posts, 0.008 on caps and rope. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/pier.ts.
