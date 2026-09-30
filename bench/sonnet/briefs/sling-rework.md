# sling rework (equipment/ranged-weapons/sling) -> assets/sling.ts

Rebuild in place. The current build is a small cup with two thin strings lying flat. Match the mockup docs/item-mockups/sling-mock.jpg: a fat round leather pouch standing upright with a grey stone sitting in its open top, a wide leather strap arching over it like a handle, a pale rim band, and a pale buckle patch on the front.

Stands on y = 0, faces +Z, 0.5 m wide, 0.55 m tall in total.
1. Pouch: a sphere r 0.22 at y 0.22 cut flat at y 0 and at y 0.34 (open top), then a hollow: subtract a sphere r 0.17 at y 0.3. Leather orange-brown #c8683a, roughness 0.7. One body, with a pale rim torus R 0.19 r 0.025 at y 0.34 in #e8c880.
2. Stone: a lumpy grey sphere r 0.13 (displace 0.01 with fbm) at y 0.36, half sunk in the pouch. Stone #8a9298 with lighter #b0b6bc top, roughness 0.9. One body.
3. Strap: a wide leather band (a torus R 0.26 r 0.03 flattened to 0.06 wide along Z, cut to its upper half) arching from the -X rim to the +X rim, peak at y 0.55, same leather. A pale buckle patch: a rounded box [0.1, 0.12, 0.02] radius 0.02 on the front left with a pale disc button. Buckle #e8c880.
4. Under 4,000 triangles.
Checks: `FORGE_WORKERS=2 ./forge render sling --fast`, view out/sling/render.png (at most two looks): a round pouch with a stone and an arched strap. Then `FORGE_WORKERS=2 ./forge all sling` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/sling.ts.
