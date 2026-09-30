# crate rework (props/containers/crate) -> assets/crate.ts

Rework the existing file in place. The current build is a clean plank box with iron edge bands, but it reads as a trunk (overhanging lid, back latch). Make it a classic wooden crate.

Keep the bounds within 5 percent of the current size (0.54 x 0.41 x 0.44 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Faces: horizontal planks with visible gaps (grooves in `bump` or a shallow 0.006 m subtract), inside a frame of corner posts and edge battens on every face.
2. Braces: a diagonal brace on the front, the back, and both sides.
3. No overhanging lid and no latch. Optional small iron corner brackets.
4. Wood: planks #b98450, frame #8a5a30, grain in `bump`, a stencilled mark on the front is optional.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render crate --fast`, then look at out/crate/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all crate` once, and look at out/crate/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/crate.ts.
