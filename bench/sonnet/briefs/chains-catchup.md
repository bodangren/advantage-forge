# chains rework (props/dungeon/chains) -> assets/chains.ts

Rework the existing file in place. A chain on a ring and a coiled pile read, but a plain untextured blue block dominates, and the links are small. This is a dungeon kit piece: read assets/wall-corner.ts for the kit stone recipe (block sizes, bevels, colors) and use it for the block.

Keep the bounds within 5 percent of the current size (0.87 x 0.68 x 0.71 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Block: a short masonry wall stub in the kit style: individual bevelled blocks with dark mortar, the kit blue stone color, a stone texture in `bump`.
2. Chains: two iron wall rings on the front face with chains of larger links (torus R 0.035 m, r 0.012 m, alternating 90 degree turns); one chain ends in an open manacle. Dark iron #34363c with lighter worn edges, metalness 0.8.
3. Keep the coiled pile at the base, rebuilt with the same larger links.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render chains --fast`, then look at out/chains/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all chains` once, and look at out/chains/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/chains.ts.
