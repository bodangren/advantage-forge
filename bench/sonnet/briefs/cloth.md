# cloth (items/crafting/cloth) -> assets/cloth.ts

A bolt of cloth: a rolled bolt (cylinder r 0.07, 0.3 m long along X, lying on y = 0) with a loose flap of cloth unrolled 0.15 m toward +Z (a rounded box 0.3 x 0.015 x 0.15 with a wavy edge), teal blue #3a8aa0 with a lighter #6ab8c8 edge band.

Size: about 0.3 m wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/cloth-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Cloth surfaces get a soft fold relief in bump (0.003 m fbm) and a painted weave tint variation; nothing thinner than 0.015 m. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render cloth --fast`, then run `./forge all cloth` once. Never commit. Only create or edit assets/cloth.ts.
