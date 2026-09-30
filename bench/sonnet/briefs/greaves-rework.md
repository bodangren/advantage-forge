# greaves rework (equipment/armor/greaves) -> assets/greaves.ts

Rework the existing file in place. The current build is two shiny steel tubes with two leather rings each: it reads as chrome pipes. Match the mockup docs/item-mockups/greaves-mock.jpg: each greave is a leather-red boot-like sleeve with a steel knee plate on top, a steel shin plate and a steel boot foot, with rivets.

Pair standing upright on y = 0, side by side, faces +Z. Sizes follow the chibi hero leg at 2x scale (the equipment fit rule): each greave 0.5 m tall, 0.24 m wide, feet 0.32 m long; the pair 0.62 m wide in total.

Construction recipe (build one greave centered on x 0.16, then `.mirror('x')`):
1. Sleeve: a tapered cylinder (cone) from r 0.11 at y 0.06 to r 0.12 at y 0.5, in leather red #b0603a with a darker #7a3e26 band at the top rim, roughness 0.7. Cut the top open (subtract a cylinder r 0.09 from y 0.42 up).
2. Knee plate: a steel diamond plate (a rounded box [0.16, 0.16, 0.03] rotated 45 degrees around Z, radius 0.02) on the front at y 0.4, z 0.11, with a rivet sphere r 0.02 at its center. Steel #a8acb1 with #6c737a shading, metalness 0.8, roughness 0.4.
3. Shin plate: a curved steel plate that wraps the front half of the sleeve from y 0.12 to y 0.32: intersect a shell of the sleeve (`sleeve.round(0.02).subtract(sleeve.round(-0.005))`) with a halfSpace z > 0.02, then a vertical raised ridge box [0.03, 0.2, 0.02] down its center, and two rivets. Same steel body as the knee plate.
4. Foot: a steel boot: a rounded box [0.2, 0.1, 0.32] radius 0.04 at y 0.05, z 0.06, with a toe cap (ellipsoid) at the front and a sole slab 0.02 m thick in dark #3e3e44.
5. Bodies: leather, steel, sole. Under 6,000 triangles for the pair.

Checks: `FORGE_WORKERS=2 ./forge render greaves --fast`, look at out/greaves/render.png; the front view must show red sleeves with a steel diamond at the knee, a steel shin plate and steel feet. At most three looks. Then `FORGE_WORKERS=2 ./forge all greaves` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/greaves.ts.
