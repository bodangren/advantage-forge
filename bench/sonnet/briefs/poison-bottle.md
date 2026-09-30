# poison-bottle (items/consumables/poison-bottle) -> assets/poison-bottle.ts

A poison bottle: a flask with a wider squat belly, filled two thirds with dark green liquid (#3fae2a glow on a very dark green base), a black cork, and a small cream label on the front with a black skull mark (an extruded rounded rectangle 0.05 m by 0.035 m, with a dark circle and two small squares as the skull).

Size: 0.18 m tall, about 0.12 m wide at the belly, flat foot on y = 0, front toward +Z.
Mockup: docs/item-mockups/poison-bottle-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/health-potion.ts. Read it first. Copy the base with cp, keep its flask, glass shell, cork and twine construction, and change only what the description says: the liquid color (emissive rule: a dark base color under the glow, emissiveIntensity 1.4 to 1.8), the fill level, the stopper, and one identifying mark. Keep the glass opacity at about 0.35.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render poison-bottle --fast`, then run `./forge all poison-bottle` once. Never commit. Only create or edit assets/poison-bottle.ts.
