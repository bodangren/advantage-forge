# silver-coin (items/quest-and-treasure/silver-coin) -> assets/silver-coin.ts

A silver coin: the same disc in silver (#d8dde3 dominant, shadow #7d858e, sparkle #ffffff, metalness 1, roughness 0.3) with a crescent moon punched through both faces instead of the star.

Size: 0.12 m across, 0.022 m thick, standing on its edge on y = 0, face toward +Z.
Mockup: docs/item-mockups/silver-coin-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/gold-coin.ts. Read it first. Copy the base with cp, keep the disc, rim and punched emblem construction, and change only the metal and the emblem as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render silver-coin --fast`, then run `./forge all silver-coin` once. Never commit. Only create or edit assets/silver-coin.ts.
