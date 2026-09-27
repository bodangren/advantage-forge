# Dungeon masonry contract (v2 — canon: the round-1 `wall` by deepseek)

Every dungeon asset that shows coursed stone must match the canon wall exactly. Round 1
produced five different stone languages because trial workspaces are isolated; v2 makes the
best built asset the model for all others. The canon plate is `mockups/masonry-canon.png`
(also `docs/dungeon-mockups/masonry-canon.png`) — the actual round-1 wall render.

## Canon metrics (measured from the canon wall, 2.004 × 1.205 × 0.447 m, 2,626 tris)

- Courses: exactly **2** per 1.2 m wall height — course height **0.60 m**.
- Blocks: about **0.55 m long** full blocks with half-blocks at the ends (about 3.5 blocks per
  2 m course); slight length jitter only.
- Bevel: **deep rounded, about 0.04 m** — pillow-like chunky blocks, not bricks, not drums.
- Joints: recessed, deep navy `#2a3547`, about 0.03 m wide.
- Faces: mid blue-gray `#4a5d75`, slightly convex; worn tops `#7a8ba0`.
- Moss: small `#3fae9a` clumps at the base only. Never a blob on top of the wall.
- Stone roughness 0.9, metalness 0. Total wall about 2,600 triangles — keep this economy.

## Forbidden (the round-1 failure modes)

- Brick courses smaller than the canon (the 0.13 m brick look).
- Crazy-paving / Voronoi cells.
- Smooth stacked drums without joints.
- Smooth trapezoid voussoirs that drift lighter than the wall gray.

## Application per asset

- `wall-corner`: two 2 m runs meeting at a right angle, same 2 courses, same blocks.
- `wall-alcove`: niche cut through both courses, jamb of whole blocks either side.
- `arch`, `door` jamb: opening 1.0 × 1.6 m; arch ring in radial segments of the same 0.60 m
  course height; jambs are stacks of canon blocks; keystone slightly proud.
- `stairs`: cheeks in canon blocks; treads smooth slabs about 0.18 m tall with worn pale tops.
- `pillar`: square base and capital plinths, shaft of canon block courses — not drums.
- `torch-sconce`: 0.4 m wide stub of canon-block wall carrying the iron bracket and torch.
- `cell-bars` posts, `sarcophagus`, `altar`, `rubble` (looser): same block dimensions wherever
  coursed masonry appears.
- Floor paving stays its own slab language but must match palette and value (never paler than
  `#7a8ba0`).

## Review rule

A masonry asset passes only if, rendered beside `masonry-canon.png`, course count, block size,
bevel depth, and joint color read as the same wall built by the same hand.
