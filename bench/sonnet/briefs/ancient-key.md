# ancient-key (items/quest-and-treasure/ancient-key) -> assets/ancient-key.ts

An ancient key: a larger key (scale 1.25) in dark green-tinted bronze (#6e7a52, shadow #3f4a2e, highlight #a8b088, metalness 0.7, roughness 0.6), a square bow with a glowing teal rune slot in the middle (emissive #3fe0c0 on a dark base, intensity 1.5), and a bit of three uneven teeth.

Size: 0.24 m long, 0.09 m across the bow, lying flat on y = 0, bow toward -X, bit toward +X.
Mockup: docs/item-mockups/ancient-key-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/key-iron.ts. Read it first. Copy the base with cp, keep its bow, shaft, collar and bit construction, and change only the material, the bow shape, and the bit teeth as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render ancient-key --fast`, then run `./forge all ancient-key` once. Never commit. Only create or edit assets/ancient-key.ts.
