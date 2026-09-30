# sarcophagus rework (props/dungeon/sarcophagus) -> assets/sarcophagus.ts

Rework the existing file in place. The current build is a plain blue stone coffin with a lid and a cross, and the build prints `warning: lid: triangle reduction failed its surface check`. It has 58,000 triangles. Fix the warning first. This is a dungeon kit piece: read assets/wall-corner.ts for the kit stone color.

Keep the bounds within 5 percent of the current size (2.05 x 0.81 x 0.76 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Lid: a solid slab with bevelled edges; no thin engraved geometry. The cross is a raised 0.015 m extrude, part of the lid body.
2. Coffin: a raised border molding around each side, two raised panels on each long side, and a carved crest or skull on the front end.
3. Stone: the kit blue stone color, stone texture in `bump`, a few chipped corners and one crack line painted dark.
4. Under 15,000 triangles and no `warning:` lines.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render sarcophagus --fast`, then look at out/sarcophagus/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all sarcophagus` once, and look at out/sarcophagus/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/sarcophagus.ts.
