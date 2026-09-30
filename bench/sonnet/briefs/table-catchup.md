# table rework (props/furniture/table) -> assets/table.ts

Rework the existing file in place. The current build is a plain square plank table with stretchers, no grain or wear. Tavern style (docs/tavern-mockups/tavern-quest_001.jpg).

Keep the bounds within 5 percent of the current size (0.95 x 0.60 x 0.95 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Top: four planks with visible gaps and rounded ends, grain in `bump`, two or three dark knots (painted ovals), a lighter worn center.
2. Legs: thick square legs with a chamfer, lower stretchers, and small corner brackets under the top.
3. Wood: top #b07a45, frame #7a4e2a.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render table --fast`, then look at out/table/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all table` once, and look at out/table/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/table.ts.
