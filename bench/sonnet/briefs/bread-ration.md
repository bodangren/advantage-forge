# bread-ration (items/consumables/bread-ration) -> assets/bread-ration.ts

A bread ration: a short oval crusty roll wrapped in a cream cloth (#e8dcc0) that leaves both ends of the bread showing, tied around the middle with a thin twine loop (#a88a5a). Crust #d99a48, light top #f0c070, underside #9a5a26. Matte bread and cloth (roughness 0.85).

Size: 0.2 m long, 0.09 m wide, 0.07 m tall, lying on y = 0 with its length along X.
Mockup: docs/item-mockups/bread-ration-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/loaf.ts. Read it first. Copy the base with cp and rebuild the shape as described; keep its crust paint approach.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render bread-ration --fast`, then run `./forge all bread-ration` once. Never commit. Only create or edit assets/bread-ration.ts.
