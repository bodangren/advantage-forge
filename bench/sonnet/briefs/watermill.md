# watermill (architecture/structure/watermill) -> assets/watermill.ts

A watermill 4 m wide (x), 5 m tall: a stone-and-timber mill house with a big wooden water wheel on its +X side, a wooden chute above the wheel, an arched door at the front (+Z) with three stone steps, a chimney, a stepped terracotta tile roof, and a small ground pad with a water patch under the wheel. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-village/watermill-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Pattern file: assets/farmhouse.ts (a stone-and-timber house on a base pad; the same wall and roof treatment) and assets/windmill.ts for a big wooden wheel with spokes. Read farmhouse.ts first.

Palette: stone cream #c9bda2 / tan #b5a37f / grey #a39a8c blocks with mortar #6f6759; timber warm brown #8a5a35 with dark walnut #6b4226; roof terracotta #d9764a with dark #b45a36 in the joints; door arch straw yellow #e0bb60; wheel dark walnut #6b4226 with #8a5a35 rims; water #3fa8c8; grass #7ec850; a few stones #8a94a0. Stone roughness 0.9, wood 0.85, tile 0.8, water roughness 0.2.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features (few big blocks and tiles). One body per material.

Construction recipe:
1. House: a box 2.4 x 3.2 x 2.4 at x -0.6 with rounded stone blocks proud on the walls (3 courses on the lower half, cream), a timber frame (corner posts, a mid beam, two braces) on the upper half in warm brown with a plaster cream fill.
2. Roof: a pitched roof (ridge along x at y 4.6) of 3 rows of fat rounded tile slabs per slope (each 0.8 x 0.08 x 0.6, radius 0.03) in terracotta, overhanging 0.3; a rounded ridge cap; a square stone chimney 0.5 x 1.0 x 0.5 at the back left.
3. Door: an arched opening at the front with a thick straw-yellow arch frame (0.25 wide) and a dark interior; three rounded stone steps down to the pad.
4. Wheel: at x 1.4, a wheel r 1.3, 0.35 thick, in the YZ plane: two rims (torus R 1.2, r 0.08), eight paddle boxes between the rims, six spokes (0.1 x 0.1 rounded boxes) from a hub cylinder r 0.2, axle into the house wall; the wheel bottom at y 0.15. A straw-yellow bracket arch (a thick torus segment) over the wheel as in the mockup.
5. Chute: a wooden trough (a box 0.4 x 0.25 x 1.6 with a hollow cut) from the house roof eave down to the top of the wheel, tilted 20 degrees.
6. Pad: a flattened rounded box 4.4 x 0.12 x 3.4 in grass with a water patch (a blue rounded box 1.8 x 0.06 x 2.0 proud by 0.02 under the wheel) and six small stones around the water.

Limits: whole asset under 9,000 triangles; `detail` 0.014 on the house and pad, 0.012 on the roof and wheel, 0.01 on the door and chute. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/watermill.ts.
