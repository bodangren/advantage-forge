# workbench rework (props/craft-and-trade/workbench) -> assets/workbench.ts

Rework the existing file in place. Reference: docs/blacksmith-mockups/blacksmith-quest_001.jpg (the smithy workbench). The current build is a plain table with a vise on one corner. The top reads empty in the sprites, and the sprite camera looks down, so the top is the largest face.

Keep the bounds within 5 percent of the current size (1.24 x 0.99 x 0.60 m), standing on y = 0 and facing +Z. Keep the vise. Priority P1: the target score is 7.0 of 10. Triangle budget: 6,000 in total.

Construction recipe:
1. Top: 3 thick planks (0.06 m) with visible seams, knife marks, and 2 dark stains in paint and `bump`.
2. Tools on the top, each thick enough to read at 128 px: a hammer (0.04 m head), a chisel, a small hand saw with a wooden grip, a block of wood, and 3 or 4 curled shavings.
3. A lower shelf on the stretchers with 2 or 3 stacked boards and a small wooden box.
4. Wood #9a6a3c with grain in `bump`; iron parts #3a3a3e, metalness 0.7.

Rules: put fine surface detail (grain, grooves, weave, pits, hammer marks) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick, or scaled up to read on small items. Stay inside the triangle budget: raise `maxTriangles` only when the build warns. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render workbench --fast`, then look at out/workbench/render.png; compare with the reference. At most four looks. Then `FORGE_WORKERS=2 ./forge all workbench` once, and look at out/workbench/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/workbench.ts.
