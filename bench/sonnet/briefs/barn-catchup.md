# barn rework (architecture/structure/barn) -> assets/barn.ts

Rework the existing file in place. The current build is a plain gable shed: cream roof, flat red walls, a small door, a plain side and back. Match the mockup reference/barn_001.jpg (already the file's reference).

Keep the bounds within 5 percent of the current size (5.22 x 4.03 x 4.18 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Roof: a gambrel roof (on each side a steep lower slope and a shallow upper slope), red or dark-red planks with plank lines in `bump`, a white trim board 0.05 m wide along every roof edge and the ridge.
2. Walls: red #b8322a vertical planks, grooves in `bump` (not geometry), white trim boards on every corner and along the eaves.
3. Front: big double doors with a white frame and a white X brace on each leaf; above them an arched hay-loft door with a small hood; a small round vent near the peak.
4. Sides: one framed window on each side wall. Back: a smaller single door or two windows, so no view is a blank red plane.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render barn --fast`, then look at out/barn/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all barn` once, and look at out/barn/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/barn.ts.
