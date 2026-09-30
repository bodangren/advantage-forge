# oak-tree rework (nature/trees/oak-tree) -> assets/oak-tree.ts

Rework the existing file in place. The trunk and the roots are good; keep them. The crown is smooth green lumps that read as broccoli. Match the round leafy oaks in docs/village-mockups/village-quest_001.jpg and docs/forest-mockups/forest-quest_001.jpg.

Keep the bounds within 5 percent of the current size (3.43 x 4.49 x 3.10 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Crown: 14 to 20 leaf clusters (ellipsoids 0.5 to 0.9 m) in a broad dome, with gaps between some clusters so 3 or 4 branches from the trunk fork show as they enter the crown.
2. Leaves: leaf texture in `bump` on the crown (a small-scale fbm), a scalloped cluster edge (displace 0.01 m at most).
3. Value: dark #3a6e26 underside and inner clusters, lighter #6fae3c on top and outer clusters (paintFn by height and distance from the center), a few lighter highlight clusters. The renderer lifts greens a step, so stay at these values or darker.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render oak-tree --fast`, then look at out/oak-tree/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all oak-tree` once, and look at out/oak-tree/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/oak-tree.ts.
