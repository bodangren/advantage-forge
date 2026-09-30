# thread (items/crafting/thread) -> assets/thread.ts

A spool of thread: a wooden spool (two discs r 0.07 and a core cylinder r 0.045, 0.16 m tall, standing on y = 0, #c8955a) wound with red thread (a cylinder r 0.06 painted with fine spiral lines in #d83a3a and #b02828), and a loose thread end (capsule r 0.008) trailing 0.1 m on the ground.

Size: about 0.3 m wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/thread-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Cloth surfaces get a soft fold relief in bump (0.003 m fbm) and a painted weave tint variation; nothing thinner than 0.015 m. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render thread --fast`, then run `./forge all thread` once. Never commit. Only create or edit assets/thread.ts.
