# key-iron rework (items/quest-and-treasure/key-iron) -> assets/key-iron.ts

Rework the existing file in place. The current build is a dark key lying flat; it reads only from above and vanishes at 128 px. Match docs/item-mockups/key-iron-mock.jpg (already the file's reference): a rusty key with a double-ring bow. Stand it up: the bounds change for this asset, and that is accepted.

Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Pose: upright, about 0.3 m tall, bow at the top facing +Z, bit at the bottom, standing in a small flat grey stone base (0.12 x 0.03 x 0.08 m) so it stands on y = 0.
2. Bow: a big ring (torus R 0.05 m, r 0.014 m) with a small second ring (R 0.025 m) hanging through it, as in the mockup.
3. Shaft: a cylinder r 0.016 m with two collar rings; bit with two chunky teeth (0.04 x 0.035 x 0.02 m).
4. Material: rusty iron #7a4a2a, darker #4a2e1e in the recesses, orange rust #a8663a on edges (paintFn), metalness 0.6, roughness 0.55.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render key-iron --fast`, then look at out/key-iron/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all key-iron` once, and look at out/key-iron/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/key-iron.ts.
