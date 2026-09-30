# tankard rework (props/food/tankard) -> assets/tankard.ts

Rework the existing file in place. Reference: docs/tavern-mockups/tavern-quest_001.jpg (tavern tableware). The current build has a pewter body crumpled with dents, a lumpy handle, and a lid that is a thin flat disc.

Keep the bounds within 5 percent of the current size (0.13 x 0.18 x 0.11 m), standing on y = 0 and facing +Z, handle on +X as now. Priority P1: the target score is 7.0 of 10. Triangle budget: 3,000 in total.

Construction recipe:
1. Body: a clean revolve profile, slightly tapered (wider at the base), with a foot ring and two raised bands. No `displace`: the dents came from displacement. Pewter #8a9096 with darker bands #5e656b, metalness 0.8, roughness 0.45.
2. Lid: a domed lid 0.012 m thick with a small finial, a hinge knuckle on the handle side, and a thumb-lift that rises from the hinge. Closed, not askew.
3. Handle: a smooth C curve (sdf.chain or capsules), 0.016 m thick, joined to the body with small fillets.
4. Surface: a faint hammered texture in `bump` only (amplitude 0.0006 m or less).

Rules: put fine surface detail (grain, grooves, weave, pits, hammer marks) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick, or scaled up to read on small items. Stay inside the triangle budget: raise `maxTriangles` only when the build warns. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render tankard --fast`, then look at out/tankard/render.png; compare with the reference. At most four looks. Then `FORGE_WORKERS=2 ./forge all tankard` once, and look at out/tankard/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/tankard.ts.
