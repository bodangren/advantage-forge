# amulet rework (equipment/accessories/amulet) -> assets/amulet.ts

Rework the existing file in place. The current build is a flat gold coin with a pastel pink ball on it, standing in a chain loop. Match the mockup docs/item-mockups/amulet-mock.jpg: a chunky four-point star medallion (a rounded diamond with a point on each side), a raised oval bezel holding a deep red oval gem, a fat bail ring at the top, and no loose chain.

Stands upright on y = 0, faces +Z, 0.36 m tall, 0.3 m wide. Chibi jewelry is thick: the medallion is 0.06 m deep.

Construction recipe:
1. Medallion: an extruded 2D profile in XY, 0.06 m thick, edge radius 0.015: a four-point star made from a rounded square rotated 45 degrees (0.2 m across) unioned with four short triangular points (0.05 m tall) on the diagonals. Gold #d4a93a with a darker #a07a20 painted in the recesses, metalness 1, roughness 0.35. One body.
2. Bezel: a torus-like oval rim: an ellipsoid [0.075, 0.095, 0.03] minus a smaller one, at the medallion center, proud by 0.02 m, with eight small gold dots (spheres r 0.01) around it. Part of the gold body.
3. Gem: an oval cabochon: ellipsoid [0.055, 0.075, 0.035] inside the bezel, deep red #b01818 at full brightness with emissive #ff2a2a intensity 0.3, roughness 0.15. One body.
4. Bail: a fat gold torus R 0.035 r 0.014 at the top point, rotated so its hole faces +Z, plus a small gold bead below it. No chain on the ground: remove the chain loop entirely.
5. Under 3,500 triangles.

Checks: `FORGE_WORKERS=2 ./forge render amulet --fast`, look at out/amulet/render.png; the front view must show a star-shaped gold medallion with a red oval gem. At most three looks. Then `FORGE_WORKERS=2 ./forge all amulet` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/amulet.ts.
