# healing-herb (items/consumables/healing-herb) -> assets/healing-herb.ts

A healing herb: three stems with pairs of round bright green leaves (#5cb85c, underside #3f9248) and one white five-petal flower with a yellow center on top (petals as five flattened ellipsoids, r 0.03 each).

Size: 0.2 m tall, 0.18 m wide, standing on y = 0 on a small dirt clump, front toward +Z.
Mockup: docs/item-mockups/healing-herb-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch: a small lumpy dirt clump (sphere r 0.06 displaced by 0.006 with fbm, cut flat at y = 0, #6f5235), two or three stems (capsules r 0.012 leaning outward), and the leaves, petals or cap the description gives. Leaves are flattened ellipsoids [0.05, 0.012, 0.03] with a painted center vein; make every part chunky (nothing thinner than 0.012 m). One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render healing-herb --fast`, then run `./forge all healing-herb` once. Never commit. Only create or edit assets/healing-herb.ts.
