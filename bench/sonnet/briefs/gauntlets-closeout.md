# gauntlets rework (equipment/armor/gauntlets) -> assets/gauntlets.ts

Rework the existing file. Priority P1: the target score is 7.0 of 10. Also an avatar piece: the result must fit the avatar base hands. The reference image docs/item-mockups/gauntlets-mock.jpg shows the wrong subject (a golem); do not copy it. Keep the current design language: dark iron, steel finger lames, a flared bell cuff, brass knuckle studs, and a leather strap.

Problem: the current gauntlets are open hands with spread fingers. The avatar base has closed fists, so an open hand cannot be worn (`docs/equipment-fit.md`: "They need a closed-fist shape"). The file has no `equip` block.

Goal: a pair of closed-fist iron gauntlets. Read these first:
- assets/avatar-base.ts: the constants WRIST [0.205, 0.238, 0.03] and ELBOW [0.18, 0.332, 0.012], and the left `fist` (an ellipsoid [0.038, 0.043, 0.044] at (0.212, 0.2, 0.034), a finger roll capsule, and a thumb cone). The forearm radius at the wrist is 0.032.
- assets/bracers.ts: a `hands` pair with an `equip` block (`fitScale: 2`, `origin` at the +X piece).
- docs/equipment-parts.md, the `hands` socket: bone `forearm.L`, the socket point is the left wrist, character axes; the worn piece keeps the x >= 0 half of the asset and mirrors it onto the right arm.

Recipe:
1. Build the left gauntlet in the avatar's own frame first: copy the three fist primitives and the forearm cone from avatar-base, translate them so the WRIST is at the origin, and scale by 2 (the fit scale). Grow them by 0.016 m (8 mm worn) to make the iron shell around the fist.
2. Shape the shell as armor: two or three steel lames across the back of the fingers (grooves or steps), a domed knuckle plate with four brass studs, a separate thumb plate, and a flared bell cuff that covers the wrist and reaches 0.1 m (asset) up the forearm. A leather strap band across the cuff.
3. Place: `equip: { slot: 'hands', fitScale: 2, origin: [CX, OY, 0] }` with no rotate, where the asset point [CX, OY, 0] is the wrist. Choose OY so the lowest point of the fist stands on y = 0, and CX so the whole left gauntlet stays at x > 0. Mirror the gauntlet across x = 0 for the standalone pair.
4. Size: the pair is about 0.45 to 0.55 m wide in the asset.

Fit checks after the shape is right: `./forge check gauntlets` must end `fit ok` (no skin or sleeve shows through), and `FORGE_WORKERS=2 ./forge render avatar-base --wear gauntlets --fast --views front,three-quarter,side`; look at out/avatar-base+gauntlets/render.png once. Both fists must look armored. These two looks count in the budget. Also run `./forge check gauntlets` for the clip check on the worn base.

Rules: put fine surface detail (grain, grooves, stitching, pits) in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick. Keep the file path, the `name`, the export, and the catalog role. Add the `equip` block as the recipe says.

Checks: `FORGE_WORKERS=2 ./forge render gauntlets --fast`, then look at out/gauntlets/render.png and compare with the reference. At most 7 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all gauntlets` once (it can wait for a build slot; give it a long timeout), and look at out/gauntlets/sprites/preview.png once. No `warning:` lines. Run `node scripts/typecheck-asset.mjs gauntlets` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/gauntlets.ts.
