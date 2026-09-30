# resistance-potion (items/consumables/resistance-potion) -> assets/resistance-potion.ts

A resistance potion: the flask filled two thirds with violet liquid (#9a4de8 glow on a dark plum base), a cork stopper, and a small round iron shield emblem on the front of the belly (an extruded disc, 0.02 m across, iron #4a4f55).

Size: 0.18 m tall, about 0.12 m wide at the belly, flat foot on y = 0, front toward +Z.
Mockup: docs/item-mockups/resistance-potion-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/health-potion.ts. Read it first. Copy the base with cp, keep its ball flask, solid glass body, lip, cork and twine construction, and change only what the description says: the liquid color, the fill level, the stopper, and one identifying mark. Liquid material rule (tested on the base): color = the glow color at about 75 percent brightness (for example #c01424 under a #ff2a3c glow), emissive = the glow color, emissiveIntensity 0.5, roughness 0.25. A higher intensity washes the liquid out to a pastel through the glass. Keep the glass body exactly as the base has it: color #4a5a64, opacity 0.5, roughness 0.05. The sprite renderer drops every surface below opacity 0.5, so never lower the glass opacity. Look at the render after the color change: the liquid must read as a saturated color, not a pastel.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render resistance-potion --fast`, then run `./forge all resistance-potion` once. Never commit. Only create or edit assets/resistance-potion.ts.
