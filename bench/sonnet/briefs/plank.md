# plank (items/crafting/plank) -> assets/plank.ts

A stack of planks crafting item: three flat boards (rounded boxes 0.5 x 0.04 x 0.16, radius 0.008) stacked with a small offset, pale sawn wood (#dcb078 with #b08a50 grain lines painted along the length), two dark knots per board, standing on y = 0. Drop the bark cylinder entirely.

Size: 0.5 m long, 0.2 m across, lying on y = 0 with its axis along X.
Mockup: docs/item-mockups/plank-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/log.ts. Read it first. Copy the base with cp, keep its bark cylinder and ring-marked end caps, and change only what the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render plank --fast`, then run `./forge all plank` once. Never commit. Only create or edit assets/plank.ts.
