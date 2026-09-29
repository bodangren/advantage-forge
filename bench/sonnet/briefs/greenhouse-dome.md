# greenhouse-dome (architecture/structure/greenhouse-dome) -> assets/greenhouse-dome.ts

A domed greenhouse 3 m wide and 3 m tall: a white iron frame dome (ribs and rings) with see-through glass panes, on a low round stone base, an open arched door frame at the front (+Z), and leafy plants and pots inside. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-village/greenhouse-dome-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Pattern file: assets/greenhouse.ts if it exists (a sibling built today), else assets/cabin.ts for the structure conventions; assets/alchemy-apparatus.ts for the glass material (opacity 0.3, roughness 0.08). Read one first.

Palette: frame white #f2f0ea with #d8d4cc in the joints (roughness 0.5, metalness 0.3); glass tint #bfe8e0, opacity 0.35, roughness 0.08; base sand #e6d5a8 with pale stone #c9bda2 slabs; leaf green #5cb85c, dark green #3d8a3d; pot terracotta #c8674a; a few red #c8423a and yellow #e0bb60 fruit dots.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Base: a flattened cylinder r 1.7, 0.2 tall (edge radius 0.06) in sand at y 0.1, with three flat stone slabs (rounded boxes) at the door as a path.
2. Frame (one body, white): a vertical wall of 8 posts (r 0.05 capsules) from y 0.2 to y 1.7 on a ring of r 1.4; two horizontal rings (torus R 1.4, r 0.045) at y 0.9 and y 1.7; a dome of 8 rib arcs from the y 1.7 ring up to the crown at y 3.0 (each rib a `sdf.torus` section: intersect a torus of R 1.4 with a half space, rotated per rib) plus one ring at y 2.4 (R 1.05) and a small crown sphere. Add a door frame: two posts and an arch at the front, 0.9 wide, 1.6 tall, proud of the wall by 0.05.
3. Glass (one body, `opacity: 0.35`): a `sdf.cylinder` shell (r 1.38, thickness 0.03) for the wall from y 0.2 to y 1.7 with the door opening subtracted, plus a dome shell (sphere r 1.38 at y 1.7 intersected with y >= 1.7, `.shell(0.03)`), both inset inside the frame so the ribs sit proud.
4. Plants: six clusters of 3 to 4 smoothUnion spheres in leaf green (r 0.15 to 0.3) in terracotta cylinder pots (r 0.2, h 0.28) on the base inside, one taller cluster at the back; two or three small bushes outside at the door; four to six fruit dots (r 0.05) on the clusters.

Limits: whole asset under 7,000 triangles; `detail` 0.012 on the frame and glass, 0.01 on the base, 0.008 on plants. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/greenhouse-dome.ts.
