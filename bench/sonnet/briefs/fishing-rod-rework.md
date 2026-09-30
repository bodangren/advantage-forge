# fishing-rod rework (equipment/tools/fishing-rod) -> assets/fishing-rod.ts

Rebuild the existing file in place. The current build is a thin rod lying flat: it vanishes at 128 px. Match the mockup docs/item-mockups/fishing-rod-mock.jpg: a chunky segmented rod standing upright and curving at the top, a big red reel with a wooden housing near the grip, a line hanging straight down from the tip to a white and red bobber.

Stands on y = 0, 1.5 m tall, faces +Z. The rod leans 15 degrees toward -X and curves further at the top; the line hangs on the +X side.

Construction recipe:
1. Rod: a `sdf.chain` of tapered segments from r 0.035 at the grip (y 0) to r 0.015 at the tip, points running up and bending toward +X at the top: [(0, 0, 0, 0.035), (-0.1, 0.5, 0, 0.03), (-0.15, 0.95, 0, 0.022), (-0.1, 1.3, 0, 0.017), (0.02, 1.5, 0, 0.012)]. Five bamboo node rings along it. Honey #d9a656 with #b48a3c nodes. Grip: a thicker darker cylinder r 0.045 from y 0 to y 0.3, walnut #8a5a35. Rod and grip one wood body.
2. Reel: a red disc (cylinder r 0.09, height 0.06) on the +X side of the rod at y 0.45, with a wooden housing ring (torus R 0.09 r 0.02, #d9a656), a small crank arm and knob, and a hub. Red #d84a3a, roughness 0.5. One body for the reel, the housing joins the wood body.
3. Line: a chain of r 0.01 from the tip straight down to y 0.55 at x 0.3 (slight sag). Cream #efe4c8.
4. Bobber: a white sphere r 0.05 at (0.3, 0.6) over a red sphere r 0.06 at (0.3, 0.5). One body, two colors painted.
5. Under 4,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render fishing-rod --fast`, look at out/fishing-rod/render.png; the front view must show a thick upright rod with a big red reel and the bobber hanging beside it. At most three looks. Then `FORGE_WORKERS=2 ./forge all fishing-rod` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/fishing-rod.ts.
