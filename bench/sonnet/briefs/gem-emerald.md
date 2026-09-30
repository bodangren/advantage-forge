# gem-emerald (items/crafting/gem-emerald) -> assets/gem-emerald.ts

An emerald: the faceted gem in bright green (#22c860 at full brightness, emissive #22c860 at 0.35), lower third #147a3a; make it 10 percent taller and narrower than the ruby (a rectangular step-cut look: use eight half-spaces, four vertical sides and four bevels).

Size: 0.16 m tall, 0.14 m wide, standing on its flat bottom on y = 0, one facet toward +Z.
Mockup: docs/item-mockups/gem-emerald-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/gem-ruby.ts (build gem-ruby first from this recipe, then copy it for the others). Read it first. Build the gem as one faceted solid: an ellipsoid [0.07, 0.085, 0.07] at y 0.08 intersected with ten half-spaces (offset 0.06 to 0.065 from the center, five tilted up toward a small flat table at the top, five tilted down to a point-cut bottom cut flat at y = 0), then `.round(0.004)`. Use `flat: true`. Material: the gem color at full brightness, emissive of the same color at intensity 0.35, roughness 0.15, metalness 0, opaque (no opacity: a see-through gem loses its color in sprites). Paint the lower third one step darker for depth. No glass shell, no inner body.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 2,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render gem-emerald --fast`, then run `./forge all gem-emerald` once. Never commit. Only create or edit assets/gem-emerald.ts.
