# wood-log (items/crafting/wood-log) -> assets/wood-log.ts

A wood log crafting item: the base log shortened to 0.45 m and thickened to r 0.11, darker bark (#6b4226 with #4a2c18 grooves), pale ring-marked end caps (#e0c48a with #b08a50 rings), one small branch stub (cone r 0.03, 0.08 m long) on top, and a small green leaf pair on the stub.

Size: 0.5 m long, 0.2 m across, lying on y = 0 with its axis along X.
Mockup: docs/item-mockups/wood-log-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/log.ts. Read it first. Copy the base with cp, keep its bark cylinder and ring-marked end caps, and change only what the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render wood-log --fast`, then run `./forge all wood-log` once. Never commit. Only create or edit assets/wood-log.ts.
