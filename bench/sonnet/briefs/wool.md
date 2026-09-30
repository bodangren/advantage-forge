# wool (items/crafting/wool) -> assets/wool.ts

A ball of wool: a fluffy cream ball (sphere r 0.1 displaced by 0.012 with fbm, #f2ead8 with #d8ccb0 in the dips, roughness 0.95) sitting on y = 0 with two loose curls of wool (chains r 0.015) trailing from it.

Size: about 0.3 m wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/wool-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Cloth surfaces get a soft fold relief in bump (0.003 m fbm) and a painted weave tint variation; nothing thinner than 0.015 m. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render wool --fast`, then run `./forge all wool` once. Never commit. Only create or edit assets/wool.ts.
