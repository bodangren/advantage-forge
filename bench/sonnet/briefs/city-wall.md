# city-wall (architecture/structure/city-wall) -> assets/city-wall.ts

A city wall section 4 m long (x), 3 m tall, 0.8 m thick (z): three courses of big rounded stone blocks, a walkway on top behind a crenellated parapet on the front (+Z) face, a short stone stair on the back (-Z) side up to the walkway, and flat ends at x = +-2 so sections join. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-village/city-wall-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail. Use the cream stone from the mockup.
Pattern file: assets/stone-wall.ts (ashlar blocks in recessed mortar) for the block treatment, and assets/wall-corner.ts for the flush-end convention. Read stone-wall.ts first.

Palette: stone cream #c9bda2 dominant, tan #b5a37f on lower blocks, grey #a39a8c in shade, mortar #6f6759. Stone roughness 0.9 with a fine grain bump.
Art direction (Chibi Quest): rounded chunky forms, soft bevels everywhere, oversized readable features (few big blocks, not many small ones). One body per material.

Construction recipe:
1. Core: one box 4.0 x 2.4 x 0.7 at y 1.2 in the mortar color, flush at x = +-2.
2. Blocks: three courses of rounded boxes (radius 0.06) proud of the core by 0.05 on both faces: course heights 0.8; block lengths 0.9 to 1.4 with a running bond (offset each course by half a block); cut the end blocks flat at x = +-2 by intersecting the whole block body with a 4.0-wide box. Vary block tone with `paintFn` per block.
3. Walkway: the top surface at y 2.4, 0.6 deep, with a thin stone slab; a front parapet 0.6 tall and 0.2 thick at z 0.3 with five merlons (0.5 wide, 0.4 tall, radius 0.05) and four crenels.
4. Stair: a short flight of four rounded steps on the back (-Z) face at the left end rising from y 0 to y 2.4, each step a rounded box 1.0 wide (x), 0.6 tall, 0.5 deep, stacked outward to -z, as in the mockup.

Limits: whole asset under 7,000 triangles; `detail` 0.012 on the blocks and core, 0.01 on the parapet and stair. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/city-wall.ts.
