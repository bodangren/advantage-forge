# ration (items/consumables/ration) -> assets/ration.ts

A travel ration: a rounded bundle (rounded box 0.2 x 0.1 x 0.14, radius 0.03) wrapped in tan cloth (#c8b088) with a twine cross tied over it (two torus bands and a small bow), a corner of dark bread (#8a5a35) and a piece of yellow cheese (#f0c040) showing at one open end.

Size: about 0.2 m wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/ration-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/bread-ration.ts. Read it first. Copy the base with cp for its cloth and twine materials, then rebuild the body as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render ration --fast`, then run `./forge all ration` once. Never commit. Only create or edit assets/ration.ts.
