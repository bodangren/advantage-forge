# dragon-scale (items/crafting/dragon-scale) -> assets/dragon-scale.ts

A dragon scale: one big shield-shaped scale standing propped at 70 degrees: an extruded rounded shield profile 0.22 m wide, 0.26 m tall, 0.03 m thick, deep red #c02830 with a darker #801820 rim and a ridge line painted down the middle, metalness 0.3, roughness 0.35, leaning on a small dark wedge.

Size: about 0.25 m in its longest dimension, standing or lying on y = 0 so the front view shows its full shape.
Mockup: docs/item-mockups/dragon-scale-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch with two to four primitives per the description; chunky proportions, soft bevels, nothing thinner than 0.015 m. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render dragon-scale --fast`, then run `./forge all dragon-scale` once. Never commit. Only create or edit assets/dragon-scale.ts.
