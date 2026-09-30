# silver-ore (items/crafting/silver-ore) -> assets/silver-ore.ts

A silver ore chunk: the rock in a dark slate tint (#5a5e66 with #3a3d44 shadows), a bright silver metal face (#dfe3e8, metalness 1, roughness 0.25) and two pale silver veins; no rust.

Size: 0.3 m wide, 0.32 m tall, standing on y = 0, the metal face toward +Z.
Mockup: docs/item-mockups/silver-ore-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/iron-ore.ts. Read it first. Copy the base with cp, keep its lumpy rock body, its metal face and its paint structure, and change only the rock tint, the metal color and finish, and the vein color as the description says. Metals use metalness 0.9 and roughness 0.3 to 0.4; a bright metal face is the focal point.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render silver-ore --fast`, then run `./forge all silver-ore` once. Never commit. Only create or edit assets/silver-ore.ts.
