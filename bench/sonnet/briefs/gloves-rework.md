# gloves rework (equipment/armor/gloves) -> assets/gloves.ts

Rework in place. The current build is two flat hands lying on the ground, so the front view is a sliver. Match the mockup docs/item-mockups/gloves-mock.jpg: a pair of chunky leather gauntlet gloves standing up on their cuffs, fingers up, leaning against each other, with wide flared cuffs and three stitch marks.

Stands on y = 0, faces +Z, pair 0.5 m wide, 0.6 m tall. Chibi hands: fat mitten-like fingers.
1. Build one glove upright in a local frame: cuff = a flared cone from r 0.11 at y 0 to r 0.09 at y 0.18; palm = an ellipsoid [0.1, 0.14, 0.06] at y 0.3; four fat finger capsules r 0.03, 0.14 m long, fanned from the palm top; a thumb capsule r 0.03 off the side. smoothUnion 0.015. Leather #b0603a with a darker #7a3e26 cuff band and three pale stitch bars on the cuff front. Place the left glove at x -0.12 leaning 12 degrees toward +X and the right at x 0.12 leaning -12 degrees, palms facing the camera. One leather body.
2. Two brass stitch bars on each cuff (small boxes) in #c8a040.
3. Under 5,000 triangles.
Checks: `FORGE_WORKERS=2 ./forge render gloves --fast`, view out/gloves/render.png (at most two looks): two upright gloves with visible fingers. Then `FORGE_WORKERS=2 ./forge all gloves` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/gloves.ts.
