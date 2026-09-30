# sack rework (props/containers/sack) -> assets/sack.ts

Rework the existing file in place. The current build is a smooth tan blob with a tied neck: no folds, seams, or weave.

Keep the bounds within 5 percent of the current size (0.35 x 0.43 x 0.32 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Body: a slumped sack, wider at the bottom, with 4 to 6 soft vertical folds and creases (smoothSubtract thin capsules, 0.01 m deep).
2. Neck: gathered under a rope tie #8a6a3a, with a flared ruffled top of 6 to 8 lobes.
3. Surface: a fine burlap crosshatch weave in `bump`, color #c9a26a with darker folds #9c7a48 (paintFn), and a sewn patch on the front with stitch dashes.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render sack --fast`, then look at out/sack/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all sack` once, and look at out/sack/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/sack.ts.
