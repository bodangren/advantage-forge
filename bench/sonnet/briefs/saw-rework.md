# saw rework (props/craft-and-trade/saw) -> assets/saw.ts

Rework the existing file in place. It builds clean, but the blade is a thin sheet that vanishes in the front and side views, the teeth are too small to see, and the handle is a small block. Match the mockup docs/item-mockups/saw-mock.jpg: a wide flat blade with big triangular teeth and a chunky closed wooden grip with a flat brass plate.

Lies flat on y = 0, blade toward -X, handle toward +X, teeth on the +Z edge. Total length 0.6 m.

Construction recipe:
1. Blade: an extruded 2D profile in the XZ plane, thickness 0.014 m (thick on purpose so the edge reads from the side), with edge radius 0.003. Outline: 0.44 m long, 0.16 m wide at the handle end, 0.11 m wide at the tip, tip corner cut at 45 degrees. Teeth: 12 triangles along the +Z edge, each 0.03 m wide at the base and 0.022 m tall, built into the same profile (points alternate between the edge line and 0.022 m out). Steel #c8ccd2 with a darker #8e959e band along the back edge via paintWhere, roughness 0.3, metalness 1.
2. Handle plate: a flat rounded box [0.16, 0.018, 0.12] at the handle end, overlapping the blade root by 0.05 m, brown leather-wood #8a5a35, with three dome rivets r 0.008 in iron #4a4f55.
3. Grip: a closed D-grip made from a torus-like loop: a rounded box [0.14, 0.05, 0.16] with radius 0.02 minus a rounded box [0.07, 0.1, 0.09] hole, in pale oak #c8955a with grain bump, roughness 0.8. Sitting on the plate, so its top is at y 0.06: the grip is the tallest part and gives the side view a silhouette.
4. Keep one body per material: steel, plate, grip, rivets.

Checks: `FORGE_WORKERS=2 ./forge render saw --fast`, look at out/saw/render.png. The teeth must be visible as a zigzag in the three-quarter view and the grip must stand above the blade in the side view. At most three looks. Then `FORGE_WORKERS=2 ./forge all saw` once. Under 4,000 triangles, no `warning:` lines. Update the design note at the top of the file. Set `reference` to docs/item-mockups/saw-mock.jpg (it already is). Never commit. Only edit assets/saw.ts.
