# stamina-potion (items/consumables/stamina-potion) -> assets/stamina-potion.ts

A stamina potion: the flask filled two thirds with lime green liquid (#7ad83a glow on a dark moss base), a cork stopper, and a small yellow lightning-bolt tag hanging from the twine.

Size: 0.18 m tall, about 0.12 m wide at the belly, flat foot on y = 0, front toward +Z.
Mockup: docs/item-mockups/stamina-potion-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/health-potion.ts. Read it first. Copy the base with cp, keep its ball flask, solid glass body, lip, cork and twine construction, and change only what the description says: the liquid color, the fill level, the stopper, and one identifying mark. Liquid material rule (tested on the base): color = the glow color itself at full brightness (for example #2f6ee8 for a blue potion), emissive = the same color, emissiveIntensity 0.6, roughness 0.25. Never darken the base color: the 0.5 glass already darkens the liquid, and a darkened base reads as mud. A higher intensity than 0.6 washes the liquid out to a pastel. Glass body: keep opacity 0.5 and roughness 0.05 from the base, but set the glass color to the liquid hue at about 45 percent brightness (for example #7a3810 under an orange liquid, #3a6a10 under a lime one, #1a3a7a under a blue one): the base's cool grey tint desaturates warm liquids to salmon. The sprite renderer drops every surface below opacity 0.5, so never lower the glass opacity. Look at the render after the color change: the liquid must read as a saturated color, not a pastel.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render stamina-potion --fast`, then run `./forge all stamina-potion` once. Never commit. Only create or edit assets/stamina-potion.ts.
