# stone-wall rework (architecture/building-parts/stone-wall) -> assets/stone-wall.ts

Rework the existing file in place. The current build is pale regular grey bricks with a dark top course and a wood base strip. Match the dark rough stone of the walls in docs/blacksmith-mockups/blacksmith-quest_001.jpg.

Keep the bounds within 5 percent of the current size (2.00 x 1.50 x 0.18 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Stones: rough fieldstone in 5 to 6 courses with irregular block widths per course (noise.random), bevelled, color #6e6a64 to #8a847a per stone, deep dark mortar #3a3632, chipped edges, stone texture in `bump`.
2. Top: a slightly darker capping course with soot darkening near the top.
3. Sill: keep the sill body at the same size (the scenes align walls by it), in dark oak #5a3a22 with grain in `bump`.
4. Keep the wall 0.18 m thick and 2.0 x 1.5 m.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render stone-wall --fast`, then look at out/stone-wall/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all stone-wall` once, and look at out/stone-wall/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/stone-wall.ts.
