# letter-sealed (items/quest-and-treasure/letter-sealed) -> assets/letter-sealed.ts

A sealed letter: a folded envelope (rounded box 0.24 x 0.02 x 0.16) propped at 70 degrees, cream #f2e3c2 with the flap triangle painted in a slightly darker #e0cfa8, a big red wax seal disc (cylinder r 0.03, 0.01 m thick, #a4221b) with a painted crest, and a thin red ribbon band around it.

Size: about 0.25 m tall or wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/letter-sealed-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Documents stand propped at 70 degrees on a small wedge so the front view shows the face; relics are chunky with one glowing or gold focal part. Emissive parts use a full-brightness base color with emissiveIntensity 0.35 to 0.5. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render letter-sealed --fast`, then run `./forge all letter-sealed` once. Never commit. Only create or edit assets/letter-sealed.ts.
