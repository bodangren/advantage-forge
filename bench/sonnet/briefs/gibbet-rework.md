# gibbet rework (props/world/gibbet) -> assets/gibbet.ts

Rework the existing file in place. The post, arm, brace, gold stud and cobble base build clean and stay. The cage is the focal point and it fails: it is a small lantern-sized cone. Make it a real hanging cage, and make the wood read as hewn timber like the mockup docs/item-mockups/gibbet-mock.jpg.

Stands on y = 0, 2.0 m tall, faces +Z. The arm reaches toward -X; the cage hangs under the arm end.

Changes:
1. Cage: 0.55 m tall and 0.34 m wide, a barrel shape (a revolve profile: r 0.12 at the top ring, r 0.17 at the belly, r 0.13 at the bottom ring). Build it from iron bars: eight vertical bars (capsules r 0.012) spaced around the barrel profile, plus three hoop rings (torus r 0.012) at the top, belly and bottom, plus a solid dished floor plate 0.02 m thick. A dome cap at the top with a ring for the chain. Iron #4a4f55 with #a8acb1 highlight on the hoops, roughness 0.5, metalness 0.7.
2. Inside the cage: one skull (sphere r 0.07 with two dark eye pits and a jaw block) resting on the floor plate, and two bone capsules. Bone #f0e2c4, roughness 0.45.
3. Chain: three linked torus rings (R 0.03, r 0.008) from the arm hook to the cage cap, so the cage top hangs at y 1.35 and the cage bottom at y 0.8.
4. Wood: the post and arm get a hewn look: `.displace(0.006, (x, y, z) => noise.fbm(x * 4, y * 9, z * 4, 3))` on the post, a chamfered square section (rounded box radius 0.02), and a slightly wider foot. Keep the existing wood colors. Keep the post at 0.16 x 0.16 m section.
5. Keep everything else. Cage clearance: the cage must not touch the post in any view (offset the arm end 0.45 m from the post axis).

Checks: `FORGE_WORKERS=2 ./forge render gibbet --fast`, look at out/gibbet/render.png; the cage must be the largest iron mass, about a quarter of the total height, with the skull visible through the bars in the front view. At most three looks. Then `FORGE_WORKERS=2 ./forge all gibbet` once. Under 9,000 triangles, no `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/gibbet.ts.
