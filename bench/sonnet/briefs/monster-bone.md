# monster-bone (items/crafting/monster-bone) -> assets/monster-bone.ts

A monster bone: a big cartoon bone lying flat: a shaft capsule r 0.03, 0.28 m long, with two lobed knobs at each end (two spheres r 0.045 each, smoothUnion 0.02), bone #f0e2c4 with #c8b898 in the creases, roughness 0.6.

Size: about 0.25 m in its longest dimension, standing or lying on y = 0 so the front view shows its full shape.
Mockup: docs/item-mockups/monster-bone-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch with two to four primitives per the description; chunky proportions, soft bevels, nothing thinner than 0.015 m. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render monster-bone --fast`, then run `./forge all monster-bone` once. Never commit. Only create or edit assets/monster-bone.ts.
