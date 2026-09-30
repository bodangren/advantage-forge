# glaive rework (equipment/weapons/glaive) -> assets/glaive.ts

Rebuild the existing file in place. The current build is a pencil-thin pole with a small dark blade that vanishes at 128 px. Match the mockup docs/item-mockups/glaive-mock.jpg: a chunky pole with a big crescent blade that curls back like a claw, a brass collar under the blade and a brass ball at the butt. Chibi weapons are oversized and thick.

Stands upright on y = 0, 1.6 m tall in total, blade at the top, faces +Z (the blade's flat side faces the camera in the front view). Front view must show the full crescent.

Construction recipe:
1. Pole: a capsule r 0.032 from y 0.05 to y 1.15, walnut #8a5a35 with a spiral leather wrap (torus rings r 0.036 / 0.008 every 0.09 m from y 0.3 to y 0.8, darker #5a3a20). One wood body, one wrap body.
2. Butt: a brass sphere r 0.055 at y 0.05, brass #d4a93a metalness 1 roughness 0.35.
3. Collar: a brass torus R 0.05 r 0.025 at y 1.15 plus a brass cone from r 0.045 at y 1.15 to r 0.03 at y 1.22.
4. Blade: one extruded 2D profile in XY (thickness 0.05 m along Z, edge radius 0.008): a crescent that rises from the collar at (0, 1.2) up to (0.05, 1.55) and curls back toward -X to a tip at (-0.2, 1.5), 0.14 m wide at the belly, tapering to the tip, with a small back spike at (0.08, 1.3). Use `profile.polygon` with about 12 points and `smooth: true`. Steel #c8ccd2 with a darker #8e959e spine painted along the inner edge, metalness 1, roughness 0.3. One body.
5. Keep the total under 4,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render glaive --fast`, look at out/glaive/render.png; the pole must read as a thick rod and the blade as a large crescent in the front view. At most three looks. Then `FORGE_WORKERS=2 ./forge all glaive` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/glaive.ts.
