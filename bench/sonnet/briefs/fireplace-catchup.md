# fireplace rework (props/furniture/fireplace) -> assets/fireplace.ts

Rework the existing file in place. The current build is a brick hearth in pale cold grey-white with a flat peach flame. Match the warm tavern hearth in docs/tavern-mockups/tavern-quest_001.jpg.

Keep the bounds within 5 percent of the current size (1.66 x 1.50 x 0.48 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Stone: warm rough fieldstone of irregular sizes (#a08a70 to #7a6a5a, per-stone variation with noise.random), bevelled, with dark mortar #3e342c and a stone texture in `bump`.
2. Mantel: a heavy wooden beam #6a4424 across the top of the opening, proud by 0.06 m, with a few small items on it optional.
3. Opening: soot-dark inside #201a16, a log pile, a glowing ember bed.
4. Flames: 3 to 5 tongue shapes (tapered cones or short chains, slightly twisted, different heights), a yellow core #ffd23a inside orange #ff7a1a tongues, full-brightness base colors with emissive in the same hue at emissiveIntensity 0.5 to 0.7. A dark base with a high intensity renders pale salmon, which is the current fault. Keep the body names stone, embers, logs, and flames.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render fireplace --fast`, then look at out/fireplace/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all fireplace` once, and look at out/fireplace/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/fireplace.ts.
