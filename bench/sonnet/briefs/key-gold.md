# key-gold (items/quest-and-treasure/key-gold) -> assets/key-gold.ts

A gold key: the same layout as the iron key in polished gold (#f2c14e, shadow #a06b1c, metalness 1, roughness 0.3), the bow shaped as a trefoil of three small rings, and a three-tooth bit.

Size: 0.24 m long, 0.09 m across the bow, lying flat on y = 0, bow toward -X, bit toward +X.
Mockup: docs/item-mockups/key-gold-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/key-iron.ts. Read it first. Copy the base with cp, keep its bow, shaft, collar and bit construction, and change only the material, the bow shape, and the bit teeth as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render key-gold --fast`, then run `./forge all key-gold` once. Never commit. Only create or edit assets/key-gold.ts.
