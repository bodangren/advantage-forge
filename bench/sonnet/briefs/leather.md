# leather (items/crafting/leather) -> assets/leather.ts

A leather item: a folded leather square: two stacked rounded slabs 0.26 x 0.03 x 0.2 with the top one folded back at one corner, tan #b07a48 with a darker #7a4e2a underside and painted stitch marks along the edge, plus a small brass buckle tag.

Size: about 0.3 m wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/leather-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Cloth surfaces get a soft fold relief in bump (0.003 m fbm) and a painted weave tint variation; nothing thinner than 0.015 m. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render leather --fast`, then run `./forge all leather` once. Never commit. Only create or edit assets/leather.ts.
