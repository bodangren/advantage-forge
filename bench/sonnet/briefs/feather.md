# feather (items/crafting/feather) -> assets/feather.ts

A feather: one big plume standing at 70 degrees in a small clay pot? No pot: the quill (capsule r 0.012, 0.3 m long, cream #f0e8d8) leans on a small pebble; the vane is a flattened ellipsoid [0.06, 0.012, 0.22] along the quill, white #f8f6f0 with a soft blue-grey tip painted (#a8c0d0) and a painted center line; add two small notches in the vane edge.

Size: about 0.25 m in its longest dimension, standing or lying on y = 0 so the front view shows its full shape.
Mockup: docs/item-mockups/feather-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch with two to four primitives per the description; chunky proportions, soft bevels, nothing thinner than 0.015 m. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render feather --fast`, then run `./forge all feather` once. Never commit. Only create or edit assets/feather.ts.
