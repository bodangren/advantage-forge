# magic-rune rework (props/world/magic-rune) -> assets/magic-rune.ts

Rebuild the existing file in place. The current build is a thin flat slab with a purple line drawing painted on it; from the front it is a plate. Match the mockup docs/item-mockups/magic-rune-mock.jpg: a raised chunky base of nine pale stone blocks, a thick glowing purple disc on top with raised concentric rings and a bright white-hot center.

Size: 1.2 x 1.2 m footprint, stands on y = 0, faces +Z, total height 0.32 m.

Construction recipe:
1. Base: a 3 x 3 grid of rounded boxes [0.38, 0.2, 0.38] radius 0.05 with 0.02 m gaps, each displaced by 0.008 with fbm noise for a hewn look; pale stone #cfc6d6 with #9a8fa6 in the gaps and on the sides. One body, roughness 0.9.
2. Disc: a cylinder r 0.5, height 0.06, at y 0.23, edge radius 0.02, plus two raised rings (torus R 0.36 r 0.025 and R 0.2 r 0.02) on its top, blended with smoothUnion 0.01, plus a dome r 0.09 at the center. Magic purple: color #c07af0 (full brightness), emissive #c07af0, emissiveIntensity 0.6, roughness 0.3. One body.
3. Center glow: a flat disc r 0.07, height 0.02, at the top of the dome, color #ffffff, emissive #f4e8ff, emissiveIntensity 0.9. One body.
4. Rune marks: eight short raised bars (boxes [0.08, 0.015, 0.03]) between the two rings, spaced evenly, in the same purple material (part of the disc body).
5. No painted line art: every mark is geometry. Nothing below y = 0.

Checks: `FORGE_WORKERS=2 ./forge render magic-rune --fast`, look at out/magic-rune/render.png; the front view must show a thick block base with a raised glowing disc on top. At most three looks. Then `FORGE_WORKERS=2 ./forge all magic-rune` once. Under 7,000 triangles, no `warning:` lines. Update the design note. Never commit. Only edit assets/magic-rune.ts.
