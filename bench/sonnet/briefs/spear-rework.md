# spear rework (equipment/weapons/spear) -> assets/spear.ts

Rework the existing file in place. The current build is a thin straight stick with a small head: it vanishes at 128 px. Match the mockup docs/item-mockups/spear-mock.jpg: a chunky gnarled pale-wood shaft with a spiral wrap, a bone-colored socket with two curved prongs, a big leaf-shaped steel head, and a rounded bone butt.

Stands upright on y = 0, 1.7 m tall, faces +Z.

Construction recipe:
1. Shaft: a capsule r 0.035 from y 0.08 to y 1.35, with a spiral wrap: a helix of small capsules (or eight torus rings tilted 20 degrees) r 0.04 / 0.012 from y 0.3 to y 1.2 in a slightly darker wood. Pale wood #e0b878 with #b8905a in the wrap. Displace the shaft by 0.006 with fbm for a gnarled look. One wood body.
2. Butt: a bone-colored rounded knob: ellipsoid [0.06, 0.08, 0.06] at y 0.06, #e8dcc0, roughness 0.7.
3. Socket: a bone cone from r 0.045 at y 1.35 to r 0.03 at y 1.45, with two curved prongs (chains of r 0.015 that curve up and outward like horns, 0.12 m tall) on the +X and -X sides, same bone color. One body with the butt.
4. Head: a leaf blade: extruded 2D profile in XY, 0.03 m thick, edge radius 0.006: 0.14 m wide at its widest (y 1.52), rising to a point at y 1.7, with a rounded base at y 1.44. Steel #c8ccd2 with a darker #8e959e center ridge painted, metalness 1, roughness 0.3. One body.
5. Under 4,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render spear --fast`, look at out/spear/render.png; the shaft must read thick with a visible spiral and the head must read as a broad leaf in the front view. At most three looks. Then `FORGE_WORKERS=2 ./forge all spear` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/spear.ts.
