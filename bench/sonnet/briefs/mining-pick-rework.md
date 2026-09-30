# mining-pick rework (equipment/tools/mining-pick) -> assets/mining-pick.ts

Rebuild the existing file in place. The current build is a thin handle with a lumpy black head lying flat: it reads as a dead bat. Match the mockup docs/item-mockups/mining-pick-mock.jpg: a hammer-pick standing upright on its butt: a chunky steel head with a flat hammer face on one side and a curved pick spike on the other, a fat rounded wooden grip with a cream wrapped band and a rounded pommel.

Stands on y = 0, 0.8 m tall, faces +Z (the head runs along X so the front view shows the hammer face on -X and the pick on +X).

Construction recipe:
1. Handle: a chain of round segments along Y: a pommel sphere r 0.055 at y 0.05, a narrower neck r 0.03, a fat grip ellipsoid [0.05, 0.13, 0.05] at y 0.22, a cream wrapped band (five torus rings r 0.045 / 0.012 stacked from y 0.32 to y 0.42, #e8d9a8), and an upper bulb ellipsoid [0.055, 0.09, 0.055] at y 0.5. Wood #c8763a with the grip painted #a85a28 at the neck. Wood one body, wrap one body.
2. Head: a steel block: rounded box [0.16, 0.09, 0.09] radius 0.02 centered at y 0.66 on the top of the handle, with a square hammer face on the -X end (a rounded box [0.07, 0.11, 0.11] at x -0.1), a pick spike on the +X end: a `sdf.cone` from r 0.04 at x 0.08 curving down to a tip at (0.28, 0.5) built as a chain of three tapering segments. A small square hole outline painted dark on the block face. Steel #a8acb1 with #6c737a shading and a #dde1e6 highlight on the hammer face, metalness 0.85, roughness 0.4. One body.
3. A brass collar torus where the handle meets the head.
4. Under 4,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render mining-pick --fast`, look at out/mining-pick/render.png; the front view must show the upright tool with a hammer face left and a curved pick right. At most three looks. Then `FORGE_WORKERS=2 ./forge all mining-pick` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/mining-pick.ts.
