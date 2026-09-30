# javelin rework (equipment/weapons/javelin) -> assets/javelin.ts

Rebuild the existing file in place. The current build is a thin stick lying flat. Match the mockup docs/item-mockups/javelin-mock.jpg: standing upright, a chunky pale shaft, a big faceted golden leaf point, an orange collar under the point, and an orange ring plus a rounded orange butt at the bottom.

Stands on y = 0, 1.3 m tall, faces +Z.

Construction recipe:
1. Shaft: a capsule r 0.03 from y 0.1 to y 1.0, pale ash #e0c48a with grain in bump. One body.
2. Butt: an orange knob ellipsoid [0.05, 0.06, 0.05] at y 0.05 and an orange torus R 0.04 r 0.015 at y 0.13. Collar: an orange torus R 0.045 r 0.02 at y 1.0. Orange #e0602a, roughness 0.6. One body for the three orange parts.
3. Point: a faceted golden leaf: an ellipsoid [0.07, 0.18, 0.04] centered at y 1.14 intersected with six tilted half-spaces so it has flat facets and a sharp tip at y 1.3, `flat: true`. Gold #d8b040 with a #a88020 painted lower half, metalness 0.9, roughness 0.35. One body.
4. Under 3,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render javelin --fast`, look at out/javelin/render.png; the front view must show an upright shaft with a big gold leaf on top. At most two looks. Then `FORGE_WORKERS=2 ./forge all javelin` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/javelin.ts.
