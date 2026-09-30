# hide (items/crafting/hide) -> assets/hide.ts

An animal hide: a flat pelt lying on y = 0, an extruded profile shaped like a stretched hide (a rounded body 0.32 x 0.26 with four short leg lobes and a neck lobe), 0.03 m thick, brown fur #8a5a35 with a lighter #c8a070 belly patch and a pale pink underside, plus fur relief in bump.

Size: about 0.3 m wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/hide-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Cloth surfaces get a soft fold relief in bump (0.003 m fbm) and a painted weave tint variation; nothing thinner than 0.015 m. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render hide --fast`, then run `./forge all hide` once. Never commit. Only create or edit assets/hide.ts.
