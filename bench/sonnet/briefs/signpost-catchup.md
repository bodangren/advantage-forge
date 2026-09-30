# signpost rework (props/world/signpost) -> assets/signpost.ts

Rework the existing file in place. The current build is a pale washed-out post with two plain arrow boards.

Keep the bounds within 5 percent of the current size (1.25 x 2.15 x 0.48 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Post: weathered wood #7a5634 with a grain in `bump`, a capped or pointed top, slightly darker near the ground.
2. Boards: #a8743e planks with grain in `bump`, darker edges, arrow-shaped ends with a notched tail; 3 or 4 short dark carved strokes on each board to suggest letters (paint).
3. Nails: keep the iron nails.
4. Base: a small pile of stones or a grass tuft around the foot of the post.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render signpost --fast`, then look at out/signpost/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all signpost` once, and look at out/signpost/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/signpost.ts.
