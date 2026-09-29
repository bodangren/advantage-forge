# townhouse (architecture/structure/townhouse) -> assets/townhouse.ts

A narrow two-storey townhouse 3 m wide (x), 4 m deep (z), 6 m tall: a cream plaster ground floor with a brown timber frame and an arched plank door, a half-timber upper floor that juts 0.3 m out over the ground floor on all sides with a diagonal brace pattern and shuttered windows, a steep terracotta tile roof with fat rounded tiles, a chimney, and two potted shrubs at the door. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-village/townhouse-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Pattern file: assets/farmhouse.ts (a timber-frame house with a tile roof; the same treatment). Read it first.

Palette: plaster cream #f0e2a8 with #e2d090 in shade; timber warm brown #8a5a35 with dark walnut #6b4226; roof terracotta #d9764a with dark #b45a36; chimney straw #e0bb60; door dark walnut with a small terracotta diamond; shrubs leaf green #5cb85c in #8a5a35 pots. Plaster roughness 0.95, wood 0.85, tile 0.8.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features (few big tiles and beams). One body per material.

Construction recipe:
1. Ground floor: a box 2.8 x 2.6 x 3.6 at y 1.3, plaster; timber corner posts and a sill beam (0.18 square, rounded 0.04) in brown; a rounded arched door 1.0 x 1.8 at the front with 3 plank grooves and a small diamond; a stack of three red bricks at the left corner as in the mockup.
2. Upper floor: a box 3.4 x 2.4 x 4.2 at y 4.0 (juts 0.3 out), plaster; a timber floor beam under its front and side edges with 4 small corbel blocks; 6 timber studs, a diagonal V brace on the front, X braces on the sides (all 0.16 wide beams), a top plate.
3. Windows: two on the front upper floor (a 4-pane grid of thin brown mullions in a recessed cream box 0.7 x 0.6), one on each side per floor; every window has a brown shutter on each side.
4. Roof: a steep gable (ridge along z at y 6.0) of 4 rows of fat rounded tiles per slope (each 0.7 x 0.1 x 0.55, radius 0.04, staggered), overhang 0.3 front and back and 0.25 at the sides; a rounded ridge cap; a straw chimney box 0.5 x 1.1 x 0.5 with a darker cap on the right slope.
5. Two green cone-sphere shrubs in brown pots at the door sides.

Limits: whole asset under 9,000 triangles; `detail` 0.014 on the walls, 0.012 on the roof and frame, 0.01 on the door and windows. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/townhouse.ts.
