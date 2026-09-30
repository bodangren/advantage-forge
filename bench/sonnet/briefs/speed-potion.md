# speed-potion (items/consumables/speed-potion) -> assets/speed-potion.ts

A speed potion: a taller slimmer flask (belly radius 0.05, total height 0.2 m) filled two thirds with cyan liquid (#31d9e6 glow on a dark teal base), a cork stopper, and two small white feather shapes tied to the neck.

Size: 0.18 m tall, about 0.12 m wide at the belly, flat foot on y = 0, front toward +Z.
Mockup: docs/item-mockups/speed-potion-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/health-potion.ts. Read it first. Copy the base with cp, keep its flask, glass shell, cork and twine construction, and change only what the description says: the liquid color (emissive rule: a dark base color under the glow, emissiveIntensity 1.4 to 1.8), the fill level, the stopper, and one identifying mark. Keep the glass opacity at about 0.35.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render speed-potion --fast`, then run `./forge all speed-potion` once. Never commit. Only create or edit assets/speed-potion.ts.
