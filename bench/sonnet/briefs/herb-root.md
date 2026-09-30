# herb-root (items/crafting/herb-root) -> assets/herb-root.ts

A herb root: a fat tan taproot (a chain of three tapering segments r 0.045 to 0.01, #d8b078 with #b08a50 rings) standing point-down in the clump, two thin side rootlets, and a tuft of three narrow green leaves on top (#6fbf5a).

Size: 0.2 m tall, 0.18 m wide, standing on y = 0 on a small dirt clump, front toward +Z.
Mockup: docs/item-mockups/herb-root-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Base file: none: build from the recipe. Read it first. Build from scratch: a small lumpy dirt clump (sphere r 0.06 displaced by 0.006 with fbm, cut flat at y = 0, #6f5235), two or three stems (capsules r 0.012 leaning outward), and the leaves, petals or cap the description gives. Leaves are flattened ellipsoids [0.05, 0.012, 0.03] with a painted center vein; make every part chunky (nothing thinner than 0.012 m). One body per material.

Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features, a silhouette that reads at 128 px. One body per material with its own roughness and metalness. Emissive bodies use a dark base color under the glow.

Limits: whole asset under 3,000 triangles; `detail` 0.0035 to 0.005. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Iterate with `./forge render herb-root --fast`, then run `./forge all herb-root` once. Never commit. Only create or edit assets/herb-root.ts.
