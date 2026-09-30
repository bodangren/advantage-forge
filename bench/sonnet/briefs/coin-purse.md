# coin-purse (items/quest-and-treasure/coin-purse) -> assets/coin-purse.ts

A coin purse: a plump round leather pouch (brown #8a5a35, shadow #5c3a22, roughness 0.8) gathered at the top by a drawstring, the gathered neck flaring into a short ruffle, a twine drawstring (#c9a878) with two knotted ends hanging down, and three gold coins (#f2c14e, metalness 1) spilling from the mouth.

Size: 0.16 m wide, 0.15 m tall, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/coin-purse-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/belt-pouch.ts. Read it first. Copy the base with cp for its leather material; rebuild the body as described.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render coin-purse --fast`, then run `./forge all coin-purse` once. Never commit. Only create or edit assets/coin-purse.ts.
