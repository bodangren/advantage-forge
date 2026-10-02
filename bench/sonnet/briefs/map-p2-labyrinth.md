# Labyrinth -> scenes/maps/labyrinth.ts

Read `bench/sonnet/briefs/map-p2-rules.md` first. Slug: `labyrinth`. P2 bar: 7.0 of 10.

Mockup: `docs/map-mockups/labyrinth.jpg` (the layout and style anchor; one view, so infer the rest).
Generator: `scripts/design-labyrinth.mjs`. Output: `scenes/maps/labyrinth.ts` and `docs/map-mockups/labyrinth.md`.
Lighting group (set by the orchestrator): dark.
Size: 16 m x 16 m maze of low walls, one winding solution path, goal in the middle.
Shot distances: 3q `dist=34`, top `dist=32`.

What the map holds: A square maze built from hedge or stone-wall pieces (low, 1.2 m), the corridor 2 m wide on the tile grid, torches at corners, a statue at one dead end, a door/portal goal in the middle, a start gate on the south. Make the solution path clear in the top view.

Pieces likely to fit (check each exists in `out/`): hedge, stone-wall, wall, torch-sconce, torch, statue, portal-frame, portal, wall-gate, floor, stone-ground, moss-tuft, bone-pile, chest.

Final shots: `docs/map-mockups/labyrinth-3q.png` and `docs/map-mockups/labyrinth-top.png`.
