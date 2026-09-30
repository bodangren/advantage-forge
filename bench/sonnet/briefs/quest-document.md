# quest-document (items/quest-and-treasure/quest-document) -> assets/quest-document.ts

A quest document: a parchment sheet (rounded box 0.2 x 0.015 x 0.28) propped at 70 degrees with a curled bottom edge (a torus quarter), six painted text lines (#6b4a2a), a painted red ribbon at the top corner and a small gold stamp disc at the bottom.

Size: about 0.25 m tall or wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/quest-document-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch per the description. Documents stand propped at 70 degrees on a small wedge so the front view shows the face; relics are chunky with one glowing or gold focal part. Emissive parts use a full-brightness base color with emissiveIntensity 0.35 to 0.5. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render quest-document --fast`, then run `./forge all quest-document` once. Never commit. Only create or edit assets/quest-document.ts.
