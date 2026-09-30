# fern rework (nature/plants/fern) -> assets/fern.ts

Rework the existing file in place. The current build has tubular stalks with striped curled tips that read as green worms. Build a real fern.

Keep the bounds within 5 percent of the current size (0.68 x 0.54 x 0.65 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Fronds: 7 to 9 arching fronds from a central crown. Each frond is a curved rachis (`sdf.chain` of 5 points, radius 0.008 to 0.004 m) with 12 to 16 pairs of leaflets along it. Write a helper that places leaflets along the rachis.
2. Leaflets: small flattened ellipsoids or extruded leaf profiles, 0.05 m long near the base tapering to 0.015 m at the tip, at least 0.012 m thick, angled forward.
3. Center: one or two young fiddleheads (a tightly curled chain).
4. Color: green #3f8a2e with lighter tips #7cbf45 (paintFn along the frond), a small dark soil tuft at the base.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render fern --fast`, then look at out/fern/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all fern` once, and look at out/fern/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/fern.ts.
