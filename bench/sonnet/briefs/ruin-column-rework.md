# ruin-column rework (architecture/structure/ruin-column) -> assets/ruin-column.ts

Rework the existing file in place. The build reads as a tall intact fluted column with a green cap: it is too tall, the break is a flat top, the base is a plain plinth and the ruin has too little rubble. Match the mockup docs/item-mockups/ruin-column-mock.jpg: a short thick column stump with a heavy square capital block, three or four fallen chunky blocks around it, and moss cushions spreading over the ground and the capital.

Stands on y = 0, faces +Z. New size: 1.25 m tall in total, footprint 1.2 x 1.0 m.

Changes:
1. Shaft: a thick cylinder r 0.16, from y 0.12 to y 0.82, with eight wide shallow flutes (subtract eight capsules r 0.03 along the shaft, spaced around it); keep the stone paint. The top is a jagged break: `.subtract(sdf.box([0.5, 0.2, 0.5]).rotate(12, 0, -8).at(0.05, 0.9, 0))` plus two small chipped spheres on the rim.
2. Capital: a square block [0.5, 0.16, 0.5] radius 0.03 resting on the shaft at y 0.9, so the top reads at y 0.98, with a taper ring (torus R 0.2, r 0.04) under it. Moss on the capital top: a flattened lumpy ellipsoid [0.28, 0.06, 0.28] displaced with noise, plus two drips down the side.
3. Base: a plinth [0.6, 0.12, 0.6] radius 0.02 on the ground.
4. Rubble: four chunky blocks (rounded boxes 0.28 x 0.2 x 0.22, radius 0.03, each tilted a different way) lying around the plinth at x -0.45, +0.45 and z +0.4, and one square drum fragment [0.3, 0.16, 0.3] fallen on +X. All in the same stone paint, one body.
5. Ground moss: three lumpy flat moss cushions (ellipsoids [0.3, 0.06, 0.25] displaced) between the blocks in moss #7ec850 / #4a8a3f, roughness 0.8, joined into the moss body.
6. Keep the four bodies: base, shaft (the shaft and capital may share one body), fallen, moss.

Checks: `FORGE_WORKERS=2 ./forge render ruin-column --fast`, look at out/ruin-column/render.png; the silhouette must be a short stump with a wider capital and rubble at the foot, not a tall pillar. At most three looks. Then `FORGE_WORKERS=2 ./forge all ruin-column` once. Under 8,000 triangles, no `warning:` lines. Update the design note. Never commit. Only edit assets/ruin-column.ts.
