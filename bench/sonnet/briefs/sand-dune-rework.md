# sand-dune rework (nature/terrain/sand-dune) -> assets/sand-dune.ts

Rework the existing file in place. The build is a symmetric cone with evenly stacked ring ripples: it reads as a wedding cake. Match the mockup docs/item-mockups/sand-dune-mock.jpg: a soft asymmetric mound with a rounded crest off center, broad flowing ripples that sweep around one side, and a wide apron at the foot.

Size stays: 2.5 m long (X), 1.7 m deep (Z), 0.8 m tall, flat base on y = 0.

Changes:
1. Mound: two blended ellipsoids: the main one [1.15, 0.8, 0.8] at (-0.2, 0.05, 0.05) and a lower lobe [0.75, 0.45, 0.6] at (0.7, 0.02, -0.15), smoothUnion 0.25, cut flat at y = 0 with a halfSpace and blended into a thin apron: a flat ellipsoid [1.3, 0.08, 0.9] at y 0.02, smoothUnion 0.15. The crest sits at (-0.2, 0.8, 0.05).
2. Ripples: replace the ring stack with a displacement of the whole mound: `.displace(0.025, (x, y, z) => Math.sin(x * 9 + z * 4 + 2.5 * noise.fbm(x * 1.5, 0, z * 1.5, 2)) )` so the ridges run diagonally and wander; their amplitude fades to zero at the foot (multiply by clamp((y) / 0.25, 0, 1)). Ridges must be soft, never sharp.
3. Paint: lit sand #f0dfae on the +Y and -X faces, shaded #b8945c on the +X and lower slopes, a faint ridge highlight from the same sine (positive half only) in #f6e9c0. Keep the grit bump.
4. One body, roughness 0.95.

Checks: `FORGE_WORKERS=2 ./forge render sand-dune --fast`, look at out/sand-dune/render.png; the silhouette must be an asymmetric mound with the crest left of center in the front view, and the ripples must wander instead of stack. At most three looks. Then `FORGE_WORKERS=2 ./forge all sand-dune` once. Under 6,000 triangles, no `warning:` lines. Update the design note. Never commit. Only edit assets/sand-dune.ts.
