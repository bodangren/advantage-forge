# waterskin (items/consumables/waterskin) -> assets/waterskin.ts

A waterskin: a soft bulging leather bag shaped like a rounded teardrop (tan leather #b07a48, shadow #7a4e2a, roughness 0.8), a dark stitched seam along one edge, a short wooden spout with a cork at the narrow end, and a thin leather strap looped through two small rings.

Size: 0.2 m wide, 0.26 m tall, lying on its side on y = 0, spout toward +X, front toward +Z.
Mockup: docs/item-mockups/waterskin-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/canteen.ts. Read it first. Copy the base with cp for its leather material and strap; rebuild the body as described.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 4,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render waterskin --fast`, then run `./forge all waterskin` once. Never commit. Only create or edit assets/waterskin.ts.
