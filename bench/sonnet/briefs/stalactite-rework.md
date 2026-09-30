# stalactite rework (nature/terrain/stalactite) -> assets/stalactite.ts

Rework the existing file in place. The build is clean but the slab is a lumpy loaf with a strange bulging underside, and the three drips are ribbed sausages with ball ends. The mockup docs/item-mockups/stalactite-mock.jpg is a cave-ceiling chunk with clean tapered cones in pale mineral tones. Keep the size and the placement (longest tip on y = 0, slab top at y 1.4).

Changes:
1. Slab: one rounded box [1.05, 0.34, 0.66] radius 0.10 at y 1.23 with a mild `.displace(0.02, noise.fbm(x * 3, y * 3, z * 3, 3))`; remove the lobes and the underside stubs. Stone #6f7680, roughness 0.78, with a dark #4b525c band on the underside via paintWhere (halfSpace below y 1.1).
2. Drips: five clean cones (`sdf.cone`) hanging from the slab underside, base r 0.09 to 0.13 at y 1.1, tapering to r 0.012 at the tips, lengths 1.05 (center), 0.7, 0.55, 0.45 and 0.35 m, at scattered XZ positions within the slab. Blend each into the slab with smoothUnion 0.06 so the roots flare. Give each cone a single wide bulge ring (a torus, smoothUnion 0.04) at one third of its length, no ribbing. Tint the tips: `paintFn` fades from stone at the root to pale mineral #a9b0bb over the lower half; the center cone's lower third goes to pale blue #b9c9d6 as the focal accent.
3. Wet sheen: drips roughness 0.5. A small moss patch #5f7f4d on one slab corner, painted only.

Checks: `FORGE_WORKERS=2 ./forge render stalactite --fast`, look at out/stalactite/render.png; the silhouette must be one clean slab with five smooth cones of different lengths. At most three looks. Then `FORGE_WORKERS=2 ./forge all stalactite` once. Under 6,000 triangles, no `warning:` lines. Update the design note. Never commit. Only edit assets/stalactite.ts.
