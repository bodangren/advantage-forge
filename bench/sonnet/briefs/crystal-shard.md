# crystal-shard (items/crafting/crystal-shard) -> assets/crystal-shard.ts

A crystal shard: not a cut gem but a raw six-sided crystal spike: a hexagonal prism (a cylinder r 0.045 intersected with six half-spaces) 0.22 m tall leaning 15 degrees, with a six-facet pointed tip, in pale violet (#c090f0 at full brightness, emissive #c090f0 at 0.4), a small rock base (lumpy grey sphere r 0.07 cut flat at y = 0) and two tiny side crystals.

Size: 0.16 m tall, 0.14 m wide, standing on its flat bottom on y = 0, one facet toward +Z.
Mockup: docs/item-mockups/crystal-shard-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/gem-ruby.ts (build gem-ruby first from this recipe, then copy it for the others). Read it first. Build the gem as one faceted solid: an ellipsoid [0.07, 0.085, 0.07] at y 0.08 intersected with ten half-spaces (offset 0.06 to 0.065 from the center, five tilted up toward a small flat table at the top, five tilted down to a point-cut bottom cut flat at y = 0), then `.round(0.004)`. Use `flat: true`. Material: the gem color at full brightness, emissive of the same color at intensity 0.35, roughness 0.15, metalness 0, opaque (no opacity: a see-through gem loses its color in sprites). Paint the lower third one step darker for depth. No glass shell, no inner body.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 2,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render crystal-shard --fast`, then run `./forge all crystal-shard` once. Never commit. Only create or edit assets/crystal-shard.ts.
