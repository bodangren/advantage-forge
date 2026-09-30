# treasure-map (items/quest-and-treasure/treasure-map) -> assets/treasure-map.ts

A treasure map: the parchment aged darker (#e2c48e with burnt brown edges #6a4020 painted along all four sides), the drawing simplified to an island outline in ink, a dashed red trail, three palm-tree dots and a big red X, and a small brass compass rose painted in one corner.

Size: 0.42 m x 0.28 m, lying on y = 0 with both short ends rolled up, front toward +Z.
Mockup: docs/item-mockups/treasure-map-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/map.ts. Read it first. Copy the base with cp, keep the rolled parchment sheet and its painted drawing method, and change only the paper tint, the edge treatment and the drawing as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render treasure-map --fast`, then run `./forge all treasure-map` once. Never commit. Only create or edit assets/treasure-map.ts.
