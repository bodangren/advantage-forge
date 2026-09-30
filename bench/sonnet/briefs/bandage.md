# bandage (items/consumables/bandage) -> assets/bandage.ts

A bandage roll: a fat white cloth roll (cylinder r 0.06, 0.12 m long along X, lying on y = 0, #f4f0e6 with #d8d0c0 spiral edge lines painted) with a loose tail unrolled 0.14 m toward +Z (rounded box 0.12 x 0.012 x 0.14), and a small red cross painted on the tail.

Size: about 0.2 m wide, standing on y = 0, front toward +Z.
Mockup: docs/item-mockups/bandage-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: assets/bread-ration.ts. Read it first. Copy the base with cp for its cloth and twine materials, then rebuild the body as the description says.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,500 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render bandage --fast`, then run `./forge all bandage` once. Never commit. Only create or edit assets/bandage.ts.
