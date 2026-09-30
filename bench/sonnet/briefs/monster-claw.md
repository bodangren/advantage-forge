# monster-claw (items/crafting/monster-claw) -> assets/monster-claw.ts

A monster claw: a thick curved talon standing point-up: a chain of four tapering segments r 0.045 to 0.008 curving 60 degrees, 0.24 m tall, dark horn #3a3236 with a #6a5a60 sheen band and a pale tip, on a small dark knuckle base (sphere r 0.05 cut flat).

Size: about 0.25 m in its longest dimension, standing or lying on y = 0 so the front view shows its full shape.
Mockup: docs/item-mockups/monster-claw-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch with two to four primitives per the description; chunky proportions, soft bevels, nothing thinner than 0.015 m. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render monster-claw --fast`, then run `./forge all monster-claw` once. Never commit. Only create or edit assets/monster-claw.ts.
