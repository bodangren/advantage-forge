# crypt-chapel (architecture/structure/crypt-chapel) -> assets/crypt-chapel.ts

A small stone crypt chapel 3 m wide (x), 4 m deep (z), 4.5 m tall: dark blue-grey stone block walls, a pointed arched doorway at the front (+Z) with a dark interior and a stone step, a steep roof of big rounded slate blocks, a small bell tower with a bell at the back of the ridge, two stone gargoyle statues on the front corners, and rounded boulders piled at the base of the front corners. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-dungeon/crypt-chapel-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail: the whole thing is one dark slate-blue stone family with soft bevels.
Pattern file: assets/tower.ts for the stone block and arch treatment; assets/stone-wall.ts for block courses. Read one first.

Palette: stone slate blue #4b525c dominant with lighter #6f7680 on the top faces and darker #363a3f in the joints; interior near-black #14161a; iron door band #4a4f55 (roughness 0.5, metalness 0.7); bell old gold #d4a93a (metalness 1). Stone roughness 0.9 with a fine grain bump.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features (few big blocks). One body per material.

Construction recipe:
1. Walls: a box 2.6 x 2.4 x 3.6 at y 1.2 with three courses of fat rounded blocks proud on every face (each 0.9 x 0.75 x 0.2, radius 0.08, running bond), one stone body with a per-block tone `paintFn`.
2. Doorway: a pointed arch opening 1.1 wide, 2.0 tall at the front (a box plus two rotated boxes meeting at the point), framed by 7 rounded voussoir blocks proud by 0.12 in the same stone and a pointed gable slab above the arch; a dark interior body behind; a rounded stone step 1.4 x 0.15 x 0.5 in front; an iron band across the interior door plane.
3. Roof: a steep gable (ridge along z at y 4.3) of 3 rows of fat rounded slate blocks per slope (each 0.8 x 0.2 x 0.8, radius 0.08, staggered, tilted with the slope), overhang 0.3, with a pointed cap block at each gable end.
4. Bell tower: a small open frame (two posts 0.2 square and a pointed cap 0.8 wide) at the back of the ridge at y 4.3 to 5.2; a gold bell (a revolve of a bell profile, r 0.18) hanging inside.
5. Gargoyles: two crouched stone figures at the front corners at y 2.4: a rounded box body 0.5 x 0.35 x 0.4, a sphere head 0.28 with two horn cones, two folded wing wedges, in the lighter stone.
6. Boulders: 3 to 4 smooth rounded boxes 0.6 to 1.0 m piled at each front corner base.

Limits: whole asset under 9,000 triangles; `detail` 0.014 on the walls and roof, 0.01 on the arch, gargoyles, and bell. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/crypt-chapel.ts.
