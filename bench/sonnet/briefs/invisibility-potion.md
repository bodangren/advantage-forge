# invisibility-potion (items/consumables/invisibility-potion) -> assets/invisibility-potion.ts

An invisibility potion: the flask filled two thirds with a faint pearly liquid (#dfe9f5 at opacity 0.45, a weak white glow, intensity 0.6 on a pale gray base), a silver cap stopper instead of cork, and a faint wisp of mist (a thin translucent capsule, opacity 0.3) rising from the neck.

Size: 0.18 m tall, about 0.12 m wide at the belly, flat foot on y = 0, front toward +Z.
Mockup: docs/item-mockups/invisibility-potion-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/health-potion.ts. Read it first. Copy the base with cp, keep its flask, glass shell, cork and twine construction, and change only what the description says: the liquid color (emissive rule: a dark base color under the glow, emissiveIntensity 1.4 to 1.8), the fill level, the stopper, and one identifying mark. Keep the glass opacity at about 0.35.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render invisibility-potion --fast`, then run `./forge all invisibility-potion` once. Never commit. Only create or edit assets/invisibility-potion.ts.
