# key-skeleton (items/quest-and-treasure/key-skeleton) -> assets/key-skeleton.ts

A skeleton key: the same layout in bone white (#e8e0cc, shadow #a89e88, roughness 0.7, no metal), the bow shaped as a small skull (a sphere with two dark eye pits and a row of teeth), and a bit with four thin teeth.

Size: 0.24 m long, 0.09 m across the bow, lying flat on y = 0, bow toward -X, bit toward +X.
Mockup: docs/item-mockups/key-skeleton-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/key-iron.ts. Read it first. Copy the base with cp, keep its bow, shaft, collar and bit construction, and change only the material, the bow shape, and the bit teeth as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render key-skeleton --fast`, then run `./forge all key-skeleton` once. Never commit. Only create or edit assets/key-skeleton.ts.
