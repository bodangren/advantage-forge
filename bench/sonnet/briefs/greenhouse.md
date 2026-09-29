# greenhouse (architecture/structure/greenhouse) -> assets/greenhouse.ts

A small greenhouse 3 m long (x), 2 m wide (z), 2.5 m tall: a painted wooden frame, see-through glass panes, a pitched glass roof with a ridge beam and exposed rafters, an arched door in the front (+Z) wall, potted plants inside, and a low wooden base slab. Stand on y = 0, centered on Y, front toward +Z.

Mockup: bench/overnight/refs/p1-village/greenhouse-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail. The frame color is warm cream white #ece0c8 (the description says white-painted; the mockup shows a warm peach; use the warm cream).
Pattern file: assets/cabin.ts (a house on a base slab with posts, beams, and a pitched roof; copy its structure). Read it first.

Palette: frame cream white #ece0c8 with pale cut wood #c9a06a where paint is worn; glass tinted #cfe6ea, opacity 0.35, roughness 0.08, metalness 0; leaf green #5cb85c with dark green #3d8a3d; pots warm brown #8a5a35; base slab honey oak #b5814a.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Base: a rounded box 3.4 x 0.14 x 2.4 (radius 0.04) at y 0.07, honey oak.
2. Frame (one body, cream): four corner posts 0.14 square, 2.0 m tall; a sill beam and a top plate on each wall; two mullions per long wall; a gable post on each short wall; a ridge beam at y 2.5 with 0.1 m overhang at the ends; five rafters per roof slope (rounded boxes rotated to the slope) that stick 0.12 m past the eave. Round every member (radius 0.03).
3. Glass (one body, `opacity: 0.35`): a thin (0.03) box per wall plane and per roof slope, inset 0.01 inside the frame members so the frame overlaps the panes. Build the roof slopes as boxes rotated by the roof angle.
4. Door: an arched opening on the front wall (a rounded box plus a cylinder along z at the top), framed by a thicker cream arch; the door panel is a glass pane in the frame.
5. Plants: five clusters of 3 to 4 smoothUnion spheres (leaf green, r 0.15 to 0.25) sitting in brown cylinder pots (r 0.18, h 0.25) on the base inside the walls; two or three small cone shrubs outside at the front corners.

Limits: whole asset under 7,000 triangles; `detail` 0.01 on the frame and base, 0.012 on glass, 0.008 on plants. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/greenhouse.ts.
