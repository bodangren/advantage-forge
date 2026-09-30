# earring rework (equipment/accessories/earring) -> assets/earring.ts

Rebuild in place. The current build is two tiny wire hoops with green balls lying flat. Match the mockup docs/item-mockups/earring-mock.jpg: two fat gold stud earrings standing upright side by side, each a thick gold ring bezel holding a big green cabochon with four small gold claws.

Stand on y = 0, faces +Z, each stud 0.2 m across, pair 0.5 m wide. Chibi jewelry is thick.
1. Bezel: a gold torus R 0.08 r 0.035 standing upright (hole facing +Z) at x -0.14 and x 0.14, y 0.1, with a flat gold back disc (cylinder r 0.09 h 0.03, rotated to face +Z). Gold #d4a93a, metalness 1, roughness 0.35. One body.
2. Cabochon: a green dome (sphere r 0.075 cut flat at the back) sitting in the bezel, bulging 0.04 m toward +Z. Green #58c85a at full brightness, roughness 0.2, with a soft lighter highlight painted. One body.
3. Claws: four small gold cones (r 0.012, 0.03 m long) leaning over the dome rim at 45, 135, 225 and 315 degrees. Part of the gold body. Lean the right stud 10 degrees for variety.
4. Under 3,000 triangles.
Checks: `FORGE_WORKERS=2 ./forge render earring --fast`, view out/earring/render.png (at most two looks): two big gold studs with green domes in the front view. Then `FORGE_WORKERS=2 ./forge all earring` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/earring.ts.
