# antidote (items/consumables/antidote) -> assets/antidote.ts

An antidote: a small flask (scale 0.8 of the base) filled two thirds with pale green liquid (#9fe08a glow on a dark green base), a cork stopper, and a green leaf tag on the twine.

Size: 0.18 m tall, about 0.12 m wide at the belly, flat foot on y = 0, front toward +Z.
Mockup: docs/item-mockups/antidote-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/health-potion.ts. Read it first. Copy the base with cp, keep its flask, glass shell, cork and twine construction, and change only what the description says: the liquid color (emissive rule: a dark base color under the glow, emissiveIntensity 1.4 to 1.8), the fill level, the stopper, and one identifying mark. Keep the glass opacity at about 0.35.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render antidote --fast`, then run `./forge all antidote` once. Never commit. Only create or edit assets/antidote.ts.
