# mushroom-cap (items/crafting/mushroom-cap) -> assets/mushroom-cap.ts

A mushroom cap item: no clump; one big red mushroom cap (a sphere r 0.09 cut flat at y 0.02, #d83a2a) with six white spots (#f4f0e6) and a pale gill underside painted, resting cap-up on the ground, with a stub of cream stem (cylinder r 0.03, 0.03 m tall) under it.

Size: 0.2 m tall, 0.18 m wide, standing on y = 0 on a small dirt clump, front toward +Z.
Mockup: docs/item-mockups/mushroom-cap-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch: a small lumpy dirt clump (sphere r 0.06 displaced by 0.006 with fbm, cut flat at y = 0, #6f5235), two or three stems (capsules r 0.012 leaning outward), and the leaves, petals or cap the description gives. Leaves are flattened ellipsoids [0.05, 0.012, 0.03] with a painted center vein; make every part chunky (nothing thinner than 0.012 m). One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render mushroom-cap --fast`, then run `./forge all mushroom-cap` once. Never commit. Only create or edit assets/mushroom-cap.ts.
