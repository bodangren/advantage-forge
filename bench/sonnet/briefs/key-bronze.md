# key-bronze (items/quest-and-treasure/key-bronze) -> assets/key-bronze.ts

A bronze key: the same layout as the iron key in bronze (#b5763a, shadow #7a4a1e, highlight #e0a86a, metalness 0.9, roughness 0.45), a plain round bow with a heart-shaped hole, and a single wide tooth.

Size: 0.24 m long, 0.09 m across the bow, lying flat on y = 0, bow toward -X, bit toward +X.
Mockup: docs/item-mockups/key-bronze-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/key-iron.ts. Read it first. Copy the base with cp, keep its bow, shaft, collar and bit construction, and change only the material, the bow shape, and the bit teeth as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render key-bronze --fast`, then run `./forge all key-bronze` once. Never commit. Only create or edit assets/key-bronze.ts.
