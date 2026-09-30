# cottage rework (architecture/structure/cottage) -> assets/cottage.ts

Rework the existing file in place. The current build is a red gable house that copies the barn mockup. Change `reference` to 'docs/village-mockups/village-quest_001.jpg' and match the cottages in the top left of that picture. Read assets/farmhouse.ts and assets/roof-thatch.ts for the thatch and half-timber recipe that the village already uses.

Keep the bounds within 5 percent of the current size (2.60 x 2.33 x 2.48 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Walls: white plaster #efe8d8 with a dark timber frame #5a3a22: corner posts, a sill beam, a top beam, and diagonal braces on each wall.
2. Roof: a thick golden thatch #c89b4a with layered scalloped overhanging edges and a rounded ridge, straw texture in `bump`, darker #a07a38 underside.
3. Front: a plank door with an X brace in a timber frame; two small windows with timber frames and shutters. Each side wall and the back wall get one window, so no view is a blank plane.
4. Keep the stone chimney; keep or drop the shrubs.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render cottage --fast`, then look at out/cottage/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all cottage` once, and look at out/cottage/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/cottage.ts.
