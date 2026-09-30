# shell (items/crafting/shell) -> assets/shell.ts

A seashell: a fan scallop shell standing upright on its hinge: a half-disc r 0.12, 0.05 m thick at the hinge tapering to 0.015 at the rim, with eight radial ridges (capsules) on the front, pale peach #f4d8c0 with #e0a890 in the grooves, a small hinge knob at the bottom.

Size: about 0.25 m in its longest dimension, standing or lying on y = 0 so the front view shows its full shape.
Mockup: docs/item-mockups/shell-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch with two to four primitives per the description; chunky proportions, soft bevels, nothing thinner than 0.015 m. One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render shell --fast`, then run `./forge all shell` once. Never commit. Only create or edit assets/shell.ts.
