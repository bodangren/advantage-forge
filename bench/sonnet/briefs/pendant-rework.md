# pendant rework (equipment/accessories/pendant) -> assets/pendant.ts

Rebuild in place. The current build is a flat disc lying on a chain. Match the mockup docs/item-mockups/pendant-mock.jpg: a thick upright teardrop pendant with a silver rim, a big glossy blue teardrop gem, and a fat silver bail ring on top. No chain.

Stands upright on y = 0, faces +Z, 0.42 m tall, 0.28 m wide, 0.08 m thick.
1. Rim: an extruded teardrop profile in XY (0.28 m wide belly at y 0.13, point at the top y 0.32, rounded bottom at y 0.01), thickness 0.08, edge radius 0.02. Silver #c8ccd2, metalness 1, roughness 0.3. One body.
2. Gem: the same profile shrunk by 0.03 m (offsetProfile), extruded 0.06 and rounded 0.02 so it bulges 0.02 m past the rim front; blue #38b8f0 at full brightness, roughness 0.1, with a lighter #8fe0ff highlight patch painted on the upper left. One body.
3. Bail: a silver torus R 0.045 r 0.018 at y 0.37, its hole facing +X, joined to the rim tip by a short silver neck.
4. Remove the chain. Under 3,000 triangles.
Checks: `FORGE_WORKERS=2 ./forge render pendant --fast`, view out/pendant/render.png (at most two looks): an upright teardrop with a blue gem. Then `FORGE_WORKERS=2 ./forge all pendant` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/pendant.ts.
