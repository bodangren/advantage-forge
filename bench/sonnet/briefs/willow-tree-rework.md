# willow-tree rework (nature/trees/willow-tree) -> assets/willow-tree.ts

Rework the existing file in place. The trunk and roots are accepted. The crown fails: it is a cluster of smooth green balls, and the hanging strands are strings of beads that look like pea pods. Match the mockup docs/item-mockups/willow-tree-mock.jpg: a dome of many small leaf clumps in a yellow-green, with slim tapered leaf fronds hanging from the crown edge.

Size stays: 3.2 m tall, stands on y = 0, faces +Z.

Changes:
1. Crown: one dome body from about 24 small ellipsoids [0.32, 0.22, 0.28] scattered over a dome of radius 1.1 m centered at y 2.3, blended with smoothUnion 0.06 so the surface reads as scalloped clumps, plus a flat underside cut at y 1.75. Displace the crown with `.displace(0.03, noise.fbm(x*3, y*3, z*3, 2))`. Colors: sunlit #a9d95a on top fading to #5cb85c on the sides and #3f9248 underneath via paintFn on y. Roughness 0.74.
2. Fronds: 14 hanging fronds around the crown rim, each a `sdf.cone` from r 0.06 at the crown edge (y 1.85) to r 0.012 at the tip, 0.9 to 1.4 m long, with a slight outward lean of 6 degrees and no bead segments. Add 3 small leaf ellipsoids [0.05, 0.09, 0.03] along each frond at even spacing to suggest leaf pairs. Fronds in #8fd14f at the top fading to #5cb85c at the tip. One frond body, roughness 0.74. The front and side views must show fronds hanging past the crown underside, but the trunk stays visible between them at the front.
3. Trunk: keep. Make sure the trunk's top disappears into the crown underside (no gap).

Checks: `FORGE_WORKERS=2 ./forge render willow-tree --fast`, look at out/willow-tree/render.png; the crown must read as one scalloped dome, not separate balls, and the fronds as slim tapering curtains. At most three looks. Then `FORGE_WORKERS=2 ./forge all willow-tree` once. Under 12,000 triangles, no `warning:` lines. Update the design note. Never commit. Only edit assets/willow-tree.ts.
