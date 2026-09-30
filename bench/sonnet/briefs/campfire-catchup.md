# campfire rework (props/world/campfire) -> assets/campfire.ts

Rework the existing file in place. The stone ring and the crossed logs read, but the flame is one pale peach teardrop.

Keep the bounds within 5 percent of the current size (0.63 x 0.26 x 0.62 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Flames: 3 to 5 tongue shapes (tapered cones or short chains, slightly twisted, different heights), a yellow core #ffd23a inside orange #ff7a1a tongues, full-brightness base colors with emissive in the same hue at emissiveIntensity 0.5 to 0.7. A dark base with a high intensity renders pale salmon, which is the current fault. The flame may rise to 0.45 m.
2. Embers: a glowing bed #ff5a1a (emissive 0.5) under the logs, with a few dark coal lumps.
3. Logs: keep the crossed logs; darken the ends that point into the fire (charred #2a1e18).
4. Stones: 8 to 10 stones of varied size with slightly faceted shapes and lighter tops; a dark ash disc inside the ring.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render campfire --fast`, then look at out/campfire/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all campfire` once, and look at out/campfire/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/campfire.ts.
