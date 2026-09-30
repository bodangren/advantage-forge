# rune-stone rework (equipment/magic/rune-stone) -> assets/rune-stone.ts

Rebuild the existing file in place. The current build is a smooth grey pebble with a small blue slit on top. Match the mockup docs/item-mockups/rune-stone-mock.jpg: a chunky faceted grey stone standing on its rounded base, taller than wide, with a big round glowing cyan gem set in a hollow on its front face.

Stands on y = 0, 0.5 m tall, 0.42 m wide, faces +Z.

Construction recipe:
1. Stone: an ellipsoid [0.21, 0.26, 0.19] at y 0.25 intersected with about ten random half-spaces at offset 0.19 to 0.22 from the center (so it gets flat facets) and `.round(0.015)`, `flat: true`. Cut a spherical hollow: subtract a sphere r 0.12 at (0, 0.27, 0.16). Stone #7d8a99 with #55606c in the hollow via paintWhere, roughness 0.85. One body.
2. Gem: a sphere r 0.095 at (0, 0.27, 0.13) so it bulges out of the hollow. Color #40e0ff (full brightness), emissive #40e0ff, emissiveIntensity 0.6, roughness 0.1. One body.
3. A soft blue tint on the stone around the hollow rim: paintWhere a sphere r 0.15 at the hollow center in #8fb8cc.
4. Under 4,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render rune-stone --fast`, look at out/rune-stone/render.png; the front view must show a faceted upright stone with a large glowing gem in its face. At most two looks. Then `FORGE_WORKERS=2 ./forge all rune-stone` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/rune-stone.ts.
