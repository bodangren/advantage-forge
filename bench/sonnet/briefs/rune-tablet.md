# rune-tablet (items/quest-and-treasure/rune-tablet) -> assets/rune-tablet.ts

A rune tablet: a chunky stone slab (rounded box 0.2 x 0.05 x 0.28, radius 0.02, cool grey #7d8a99, displaced 0.006 with fbm) propped at 70 degrees, with one broken corner cut off, and four raised glowing runes on its face (short extruded bars and arcs, color #40e0ff at full brightness, emissive 0.5).

Size: about 0.25 m tall or wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/rune-tablet-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Documents stand propped at 70 degrees on a small wedge so the front view shows the face; relics are chunky with one glowing or gold focal part. Emissive parts use a full-brightness base color with emissiveIntensity 0.35 to 0.5. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render rune-tablet --fast`, then run `./forge all rune-tablet` once. Never commit. Only create or edit assets/rune-tablet.ts.
