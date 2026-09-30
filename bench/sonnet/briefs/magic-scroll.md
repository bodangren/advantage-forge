# magic-scroll (items/quest-and-treasure/magic-scroll) -> assets/magic-scroll.ts

A magic scroll: pale blue-white paper (#e8eef8) with a glowing cyan rune band painted around the middle (#40e0ff at full brightness, emissive 0.5, as a separate thin torus body around the roll), silver knobs (#c8ccd2, metalness 1, roughness 0.3), a blue ribbon (#2f6aa8) and a silver seal with a star.

Size: 0.37 m long with its knobs, 0.08 m thick, lying on y = 0 with its axis along X.
Mockup: docs/item-mockups/magic-scroll-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/scroll.ts. Read it first. Copy the base with cp, keep its paper roll, rod, knobs, ribbon and seal construction, and change only the paper tint, the knob material, the ribbon color and the identifying mark as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render magic-scroll --fast`, then run `./forge all magic-scroll` once. Never commit. Only create or edit assets/magic-scroll.ts.
