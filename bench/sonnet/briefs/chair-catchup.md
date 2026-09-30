# chair rework (props/furniture/chair) -> assets/chair.ts

Rework the existing file in place. The current build is a clean but plain chunky chair: a flat back, a flat seat, no grain. Tavern style (docs/tavern-mockups/tavern-quest_001.jpg).

Keep the bounds within 5 percent of the current size (0.42 x 0.72 x 0.45 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Back: two side posts with a curved top rail and two or three vertical slats (or a heart cut-out in a solid back board).
2. Seat: three planks with small gaps and a rounded front edge.
3. Legs: slightly splayed, with a turned ring at mid height and stretchers between them.
4. Wood: seat #b07a45, frame #8a5a30, grain in `bump`, a slightly lighter worn edge on the seat front.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render chair --fast`, then look at out/chair/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all chair` once, and look at out/chair/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/chair.ts.
