# barrel rework (props/containers/barrel) -> assets/barrel.ts

Rework the existing file in place. The current build reads as a barrel, but the staves are crumpled facets from a strong displace, and the two hoops are lumpy. Tavern style, like the barrels in docs/tavern-mockups/tavern-quest_001.jpg.

Keep the bounds within 5 percent of the current size (0.67 x 0.92 x 0.67 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Body: `sdf.revolve` of a smooth bulged profile (radius 0.30 m at the ends, 0.335 m at the middle). No `displace` on the staves.
2. Staves: 16 staves as shallow vertical grooves in `bump`, plus `paintFn` that alternates two wood tones by angle (#9a6534 and #86552a) with a fine grain in `bump`.
3. Hoops: four dark iron hoops #3a3d42 (two near each end), 0.035 m tall, proud by 0.012 m, metalness 0.8, roughness 0.45, with 6 small rivets each.
4. Lid: inset 0.02 m below the rim, three plank lines, and a round bung.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render barrel --fast`, then look at out/barrel/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all barrel` once, and look at out/barrel/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/barrel.ts.
