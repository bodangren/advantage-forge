# staff rework (equipment/magic-weapons/staff) -> assets/staff.ts

Rework the crystal of the existing file in place. The shaft, grip and ferrule are accepted. The top fails: it is a pale blue blob inside a glass skin, and the "three curling wood claws" read as a fork. Match the mockup docs/item-mockups/staff-mock.jpg: a big faceted teardrop crystal, bright cyan, sitting in a gold cup of four leaf-shaped prongs, over a dark wood knot.

Size stays: 1.2 m tall, stands on y = 0, faces +Z.

Changes:
1. Remove the `orb-shell` body entirely (a glass skin over an emissive body reads as a pale blob).
2. Crystal: a faceted teardrop: intersect an ellipsoid [0.075, 0.12, 0.075] with eight half-spaces rotated around Y (each at offset 0.062 from the axis, tilted 12 degrees so the facets taper to a point at the top), with `flat: true`. Center at y 1.1, tip at y 1.24. Material: color #38c8ff (full brightness), emissive #38c8ff, emissiveIntensity 0.6, roughness 0.15. One body.
3. Cup: four gold leaf prongs (extruded leaf profiles 0.09 m tall, 0.05 m wide, 0.015 m thick) around the crystal base at y 0.98, leaning inward 15 degrees, plus a gold torus R 0.06 r 0.02 at y 0.97. Gold #d4a93a, metalness 1, roughness 0.35. One body.
4. Knot: a dark wood bulb ellipsoid [0.06, 0.05, 0.06] under the cup at y 0.94 joining the shaft, in the shaft's wood body.
5. Keep the total under 6,000 triangles.

Checks: `FORGE_WORKERS=2 ./forge render staff --fast`, look at out/staff/render.png; the top must read as a bright cyan faceted crystal in a gold cup in the front view. At most two looks. Then `FORGE_WORKERS=2 ./forge all staff` once. No `warning:` lines. Update the design note. Never commit. Only edit assets/staff.ts.
