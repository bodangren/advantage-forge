# rampart (architecture/structure/rampart) -> assets/rampart.ts

A rampart corner tower 3.5 m tall and 2.5 m wide: a round grey stone tower with a crenellated top and taller pointed merlons, two arrow slits, a small arched plank door at the front (+Z), and a short wall stub 1.2 m long on the +X side and another on the -Z side (the corner joins two walls). Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-village/rampart-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail; omit the grass and sand base from the mockup.
Pattern file: assets/tower.ts (a round stone tower with an arched plank door and a stone arch). Read it first and copy its door and block treatment; this tower is shorter and has no roof.

Palette: stone grey #a8aaae dominant, lighter #c4c6c9 on the parapet band, darker #7e8286 in the joints; door warm brown #8a5a35 with dark walnut #6b4226 planks and a red #c8423a knob; gold #d4a93a studs (metalness 1) on the parapet band. Stone roughness 0.9 with a fine grain bump.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Body: a cylinder r 1.2, 2.6 m tall, with 4 courses of rounded stone blocks proud by 0.04 (each course a ring of 10 rounded boxes, running bond), one stone body with `paintFn` tone per block.
2. Parapet: a wider ring (r 1.35, 0.5 tall, radius 0.06) at y 2.6 to 3.1 in the lighter stone, with 8 merlons on top (0.35 wide, 0.4 tall, radius 0.05); every other merlon is a taller pointed one (a box plus a pyramid cone tip, 0.8 tall), as in the mockup. Four gold stud spheres (r 0.06) on the parapet band front.
3. Wall stubs: two rounded boxes 1.2 x 2.4 x 0.6 in the same stone, one along +X from the body, one along -Z; each with three merlons on top.
4. Door: an arched plank door 0.8 wide, 1.3 tall at the front, in a stone arch of 5 rounded voussoir blocks; a red knob and a gold stud ring.
5. Two arrow slits (narrow dark rounded boxes 0.08 x 0.5, subtracted 0.06 deep) at y 1.8 on the +X and -X sides.

Limits: whole asset under 7,000 triangles; `detail` 0.012 on the body and stubs, 0.008 on the door and merlons. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/rampart.ts.
