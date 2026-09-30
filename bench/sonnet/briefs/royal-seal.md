# royal-seal (items/quest-and-treasure/royal-seal) -> assets/royal-seal.ts

A royal seal: a gold seal stamp standing upright: a gold disc base r 0.08, 0.03 m thick, with a raised crown emblem on top (a small crown: a ring with five points), and a chunky turned gold handle above it (chain of three bulbs, 0.16 m tall), gold #d4a93a metalness 1 roughness 0.35, with a red velvet band (#a02030) around the handle.

Size: about 0.25 m tall or wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/royal-seal-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Documents stand propped at 70 degrees on a small wedge so the front view shows the face; relics are chunky with one glowing or gold focal part. Emissive parts use a full-brightness base color with emissiveIntensity 0.35 to 0.5. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render royal-seal --fast`, then run `./forge all royal-seal` once. Never commit. Only create or edit assets/royal-seal.ts.
