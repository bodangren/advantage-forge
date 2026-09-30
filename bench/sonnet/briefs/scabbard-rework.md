# scabbard rework (equipment/accessories/scabbard) -> assets/scabbard.ts

Rebuild in place. The current build lies flat and thin. Match the mockup docs/item-mockups/scabbard-mock.jpg: a sheathed short sword standing upright on its blade tip: a dark leather scabbard with a gold throat and chape, a gold cross guard, a chunky brown leather-wrapped grip with a belt-loop band and two gold rivets, and a round pommel.

Stands on y = 0, 0.8 m tall, faces +Z.
1. Scabbard: a rounded box [0.1, 0.42, 0.05] radius 0.02 from y 0.02 to y 0.44 tapering slightly to the tip, dark leather #5a3a28 with a lighter #8a5a35 center strip; a gold chape cap (rounded box [0.11, 0.06, 0.06]) at the bottom and a gold throat band at y 0.42. Leather one body.
2. Guard: a gold rounded box [0.24, 0.05, 0.06] radius 0.02 at y 0.47, gold #d4a93a, metalness 1, roughness 0.35. One gold body with the chape, throat and rivets.
3. Grip: a chunky capsule r 0.045 from y 0.5 to y 0.72 in leather #a8603a, with a wider belt-loop band (rounded box [0.14, 0.1, 0.09]) at y 0.6 in the same leather with two gold rivets r 0.018 on its front; a pommel: a lobed knob (sphere r 0.05 with two small side bumps) at y 0.76.
4. Under 4,000 triangles.
Checks: `FORGE_WORKERS=2 ./forge render scabbard --fast`, view out/scabbard/render.png (at most two looks): an upright sheathed sword with a gold guard. Then `FORGE_WORKERS=2 ./forge all scabbard` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/scabbard.ts.
