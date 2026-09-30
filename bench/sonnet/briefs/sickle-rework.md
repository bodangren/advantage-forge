# sickle rework (equipment/weapons/sickle) -> assets/sickle.ts

Rebuild the existing file in place. The current build lies flat and the blade is a thin wire. Match the mockup docs/item-mockups/sickle-mock.jpg: standing upright on its handle, a chunky curved wooden handle with two dark dots, a fat steel collar ring, and a thick steel hook blade that curls over like a question mark, with a small barb on its outer edge.

Stands on y = 0, 0.9 m tall, faces +Z (the hook curls in the XY plane so the front view shows the full hook).

Construction recipe:
1. Handle: a `sdf.chain` of three segments r 0.04 to 0.035 from (0.02, 0.04) curving gently to (0, 0.5), with a rounded knob at the bottom (sphere r 0.045 at y 0.045) and two dark dots (spheres r 0.012, #5a3a20) on the front. Honey wood #d8a060, roughness 0.7. One body.
2. Collar: a fat steel torus R 0.05 r 0.025 at y 0.52 plus a short cylinder r 0.045 from y 0.5 to y 0.56. Steel #b8c0c8, metalness 0.85, roughness 0.35.
3. Blade: a thick hook: a `sdf.chain` of five segments starting r 0.04 at (0, 0.56), rising to (0.02, 0.72), curling over the top to (-0.08, 0.86), then down and back to a tip r 0.008 at (-0.14, 0.7). Add a small barb: a cone from r 0.02 to a point, 0.05 m long, on the outer edge at (0.06, 0.78) pointing up-right. Same steel body as the collar, with the inner edge painted brighter #dde1e6.
4. Under 3,500 triangles.

Checks: `FORGE_WORKERS=2 ./forge render sickle --fast`, look at out/sickle/render.png; the front view must show a thick hook over a chunky handle, upright. At most two looks. Then `FORGE_WORKERS=2 ./forge all sickle` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/sickle.ts.
