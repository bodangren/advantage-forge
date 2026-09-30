# vial rework (props/containers/vial) -> assets/vial.ts

Rework the existing file in place. Reference: docs/item-mockups/vial-mock.jpg (a round-bottom teardrop flask, green liquid filling about two thirds with a flat top, a short neck with a lip, and a cork). The current bottle has shoulders that read as a figure, the liquid floats as a blob in the middle, and the cork is tall.

Keep the bounds within 5 percent of the current size (0.07 x 0.13 x 0.07 m), standing on y = 0. Priority P1: the target score is 7.0 of 10. Triangle budget: 2,000 in total.

Construction recipe:
1. Glass: a teardrop flask (revolve profile): a wide round belly in the lower half, a smooth conical taper to a short neck, and a lip ring at the top. No shoulders. Keep the current glass opacity and roughness.
2. Liquid: the inside of the flask (the glass shape shrunk by 0.002 m) intersected with a half-space below y = 0.06, so the liquid fills the bottom with a flat top. Keep the liquid green and its current material.
3. Cork: 0.018 to 0.022 m tall, slightly wider at the top, cork color #b88a58 with pores in `bump`.

Rules: put fine surface detail (grain, grooves, weave, pits, hammer marks) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick, or scaled up to read on small items. Stay inside the triangle budget: raise `maxTriangles` only when the build warns. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render vial --fast`, then look at out/vial/render.png; compare with the reference. At most four looks. Then `FORGE_WORKERS=2 ./forge all vial` once, and look at out/vial/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/vial.ts.
