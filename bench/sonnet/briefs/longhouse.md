# longhouse (architecture/structure/longhouse) -> assets/longhouse.ts

A viking longhouse 8 m long (x), 4 m wide (z), 4 m tall: honey-oak plank walls, a curved roof of fat overlapping terracotta-and-tan shingles that sweeps up at the gable ends, carved dragon heads on both gable peaks, four rounded corner posts with round studs, an arched plank door on the long front (+Z) side under a small gable porch, two arched windows with carved sun-ray frames, a chimney, and a low stone plinth. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-village/longhouse-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail: the mockup's long side faces the camera; that side is the front.
Pattern file: assets/farmhouse.ts (a house on a pad) for structure; assets/cabin.ts for plank walls. Read one first.

Palette: planks honey oak #b5814a with pale cut wood #c9a06a between and dark walnut #6b4226 shadows; roof terracotta #d9764a with tan #e0bb60 rows; carving straw #e0bb60; door dark walnut with grey #8a94a0 iron band; plinth grey stone #a39a8c. Wood roughness 0.85, tile 0.8, stone 0.9.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Plinth: a rounded box 8.4 x 0.3 x 4.4 in grey stone; three stone blocks proud at the front right.
2. Walls: a box 7.6 x 2.4 x 3.6 at y 1.5 with 8 horizontal plank grooves (subtract thin boxes 0.03 deep) and four fat corner posts (0.4 square, rounded 0.08) with two round stud discs each on the front face.
3. Roof: a curved gable roof: revolve or extrude a profile along x whose lower edge sweeps up 0.5 m at each end (build each slope as a bent rounded box: `.bend` a box 8.8 x 0.25 x 2.6 slightly so the eaves lift at the ends), ridge at y 3.6; four rows of fat rounded shingles per slope (each 1.0 x 0.1 x 0.7, radius 0.05, alternating terracotta and tan); a rounded ridge beam; a chimney box 0.6 x 0.9 x 0.6 with a terracotta cap on the back slope.
4. Dragon heads: at each gable peak a `sdf.chain` neck curving up and out (r 0.15 to 0.08, 0.8 m) ending in a wedge head (a rounded box 0.35 x 0.25 x 0.5 with a small horn cone), in straw; a carved crown emblem (three rounded fingers) under the front gable.
5. Door: an arched plank door 1.2 x 2.0 at the front center with a small gable porch (two posts and a mini roof); two arched windows 0.7 x 0.9 on the front with a sun-ray frame (8 short rounded rays around the arch) and a sill.

Limits: whole asset under 9,000 triangles; `detail` 0.016 on the walls and plinth, 0.014 on the roof, 0.01 on the dragons, door, and windows. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/longhouse.ts.
