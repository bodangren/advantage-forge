# long-sword rework (equipment/melee-weapons/long-sword) -> assets/long-sword.ts

Rework the existing file in place. Priority P0: the target score is 7.5 of 10. Reference: docs/item-mockups/long-sword-mock.jpg.

The current build reads as a sword, but the blade is a thin needle: about 0.035 m wide and a hairline from the side. The mock has a broad, chunky chibi blade.

Changes:
1. Blade: about 0.07 m wide at the guard, a straight taper to a clear diamond point (the last 0.1 m). Cross-section a flat diamond: a central ridge 0.02 m thick, two bevels to edges 0.004 m thick, so the blade reads from the side. Build it as an extruded profile intersected with two tilted half-spaces per face, or as a scaled diamond; `flat: true` is allowed on the blade for crisp bevels.
2. Blade color steel #b9c0c8, a brighter bevel band #dfe4ea along both edges (paintFn by distance from the ridge), metalness 0.9, roughness 0.3.
3. Guard: a short bar about 0.2 m wide with ball ends, plus a ring collar around the blade root, dark steel #6e747c.
4. Grip: leather #a8582a wrapped in 5 to 6 raised bands, darker gaps #6b3a1e. Pommel: a ball 0.05 m, dark steel.

Keep the total height 0.99 m, standing on the pommel at y = 0, flat toward +Z. Keep the `equip` block exactly (the grip center at y 0.115) and the grip position. `./forge check long-sword` must still end `fit ok` and the clip check must pass.

Rules: put fine surface detail (grain, grooves, stitching, pits) in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick. Keep the file path, the `name`, the export, and the catalog role. Keep the `equip` block, and run `./forge check long-sword` after the last edit.

Checks: `FORGE_WORKERS=2 ./forge render long-sword --fast`, then look at out/long-sword/render.png and compare with the reference. At most 4 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all long-sword` once (it can wait for a build slot; give it a long timeout), and look at out/long-sword/sprites/preview.png once. No `warning:` lines. Run `node scripts/typecheck-asset.mjs long-sword` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/long-sword.ts.
