# map-fragment (items/quest-and-treasure/map-fragment) -> assets/map-fragment.ts

A map fragment: only a torn quarter of the map, 0.24 m x 0.2 m, flat (no rolled ends), with a jagged torn edge along two sides (a polygon profile with notches), parchment #efdcae, half of a red X at the torn edge, a bit of coastline and two forest dots.

Size: 0.42 m x 0.28 m, lying on y = 0 with both short ends rolled up, front toward +Z.
Mockup: docs/item-mockups/map-fragment-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/map.ts. Read it first. Copy the base with cp, keep the rolled parchment sheet and its painted drawing method, and change only the paper tint, the edge treatment and the drawing as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render map-fragment --fast`, then run `./forge all map-fragment` once. Never commit. Only create or edit assets/map-fragment.ts.
