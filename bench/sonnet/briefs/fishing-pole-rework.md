# fishing-pole rework (equipment/tools/fishing-pole) -> assets/fishing-pole.ts

Rebuild the existing file in place. The current build is a thin cane lying flat: it vanishes at 128 px. Match the mockup docs/item-mockups/fishing-pole-mock.jpg: a chunky bamboo cane standing almost upright, leaning 12 degrees, with a thick line curving down from the tip to a fat yellow float, and a wooden reel knob near the butt.

Stands on y = 0, 1.5 m tall, faces +Z (the line and float hang on the +X side, in the front view's plane).

Construction recipe:
1. Cane: a cone from r 0.04 at the butt (y 0.02) to r 0.02 at the tip (y 1.5), leaning 12 degrees toward -X (rotateZ), with five bamboo nodes: torus rings R matching the local radius, r 0.008, at even spacing, blended smoothUnion 0.01. Bamboo #e0b45a with a darker #b48a3c on the nodes, roughness 0.7. One body.
2. Butt cap: a brass torus at the bottom and a small wooden reel knob: a short cylinder r 0.05, height 0.06, on the -X side of the cane at y 0.2, walnut #8a5a35.
3. Line: a `sdf.chain` of radius 0.012 (thick on purpose) from the cane tip that arcs out to +X and down: points [(tip), (+0.2, 1.4), (+0.32, 1.2), (+0.34, 0.95)]. Cream #efe4c8. One body.
4. Float: a fat ellipsoid [0.07, 0.1, 0.07] at the line end (x 0.34, y 0.85) in yellow #f0c040 with a grey cap sphere r 0.035 on top and a red band painted around the middle. One body. A small hook (torus R 0.03 r 0.006, cut to a J) hanging 0.1 m below the float in steel.
5. Under 4,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render fishing-pole --fast`, look at out/fishing-pole/render.png; the front view must show a thick leaning cane with the float hanging beside it. At most three looks. Then `FORGE_WORKERS=2 ./forge all fishing-pole` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/fishing-pole.ts.
