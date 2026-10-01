# shortbow rework (equipment/ranged-weapons/shortbow) -> assets/shortbow.ts

Rework the existing file in place. Priority P0: the target score is 7.5 of 10. Reference: docs/item-mockups/shortbow-mock.jpg.

The current bow has the right parts, but the limbs are a light orange brown, the tips are straight cream sticks, and the string is a thick cream rod.

Changes:
1. Limbs: dark walnut #4a3328 (roughness 0.6), a smooth recurve, thicker at the grip (0.03 m) and thinner toward the tips (0.018 m).
2. Tips: cream horn caps #efe3c4 that curl back toward the string side, like a small hook, about 0.07 m long. Not straight.
3. Grip: a red-brown leather wrap #8a4a3a with two thin cream rings at its ends, and the two cream bulb knobs on the left and right of the grip (keep them; they are in the mock).
4. String: thin, 0.005 m radius, tan #b08a5a, straight and taut from tip to tip.

Keep the size (0.905 m tall, 0.3 m deep) and the plane of the bow. Keep the `equip` block exactly (origin [0, 0.45, 0.205], rotate, twoHanded) and the grip position. `./forge check shortbow` must still end `fit ok`.

Rules: put fine surface detail (grain, grooves, stitching, pits) in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick. Keep the file path, the `name`, the export, and the catalog role. Keep the `equip` block, and run `./forge check shortbow` after the last edit.

Checks: `FORGE_WORKERS=2 ./forge render shortbow --fast`, then look at out/shortbow/render.png and compare with the reference. At most 4 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all shortbow` once (it can wait for a build slot; give it a long timeout), and look at out/shortbow/sprites/preview.png once. No `warning:` lines. Run `node scripts/typecheck-asset.mjs shortbow` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/shortbow.ts.
