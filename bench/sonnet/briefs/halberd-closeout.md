# halberd rework (equipment/melee-weapons/halberd) -> assets/halberd.ts

Rework the existing file in place. Priority P1: the target score is 7.0 of 10. Reference: docs/item-mockups/halberd-mock.jpg. The mock uses flat placeholder pastel colors: copy its shapes, not its colors.

The current halberd is a thin realistic polearm: a spear tip on top, a flat grey axe plate, a small back hook, and a thin pole. The mock is a chunky chibi weapon with a big head.

Changes:
1. Head, about 0.6 m wide and 0.4 m tall at the top of the haft:
   - A big crescent axe blade on the front side (+X): the cutting edge is a convex arc, the top corner sweeps up into a short spike, and the bottom corner curls down into a hook. Thick (0.03 m at the socket, 0.008 m at the edge, with a bevel). Steel #b9c0c8, bright edge band #dfe4ea, metalness 0.9, roughness 0.3.
   - A short angular socket block where the head meets the haft, dark steel #5a6068.
   - On the back side (-X): a flared fluke (a hammer-like back spike that widens into a fan with two lobes), dark steel.
   - No spear point on top. The top of the head is the blade's upward spike.
2. Haft: thicker (0.03 m radius), wood #8a5a35 with grain in `bump`, divided into segments by 4 to 5 raised rings (brass #c9a04a), and a round knob pommel at the bottom.

Keep the total height (2.04 m), standing on y = 0, with the blade plane facing +Z. Keep the `equip` block exactly (the grip at y 0.8, twoHanded). `./forge check halberd` must still end `fit ok`, and the clip check must pass. Keep the total under 9,000 triangles.

Rules: put fine surface detail (grain, grooves, stitching, pits) in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick. Keep the file path, the `name`, the export, and the catalog role. Keep the `equip` block, and run `./forge check halberd` after the last edit.

Checks: `FORGE_WORKERS=2 ./forge render halberd --fast`, then look at out/halberd/render.png and compare with the reference. At most 4 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all halberd` once (it can wait for a build slot; give it a long timeout), and look at out/halberd/sprites/preview.png once. No `warning:` lines. Run `node scripts/typecheck-asset.mjs halberd` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/halberd.ts.
