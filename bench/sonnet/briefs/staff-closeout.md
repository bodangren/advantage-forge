# staff rework (equipment/magic-weapons/staff) -> assets/staff.ts

Rework the existing file in place. Priority P0: the target score is 7.5 of 10. Reference: docs/item-mockups/staff-mock.jpg.

The current staff reads, but three things differ from the mock:
1. The crystal is a smooth egg. Make it a faceted teardrop with a sharp point at the top: an ellipsoid about [0.075, 0.12, 0.075] intersected with 8 half-spaces around Y that tilt so the facets meet at the tip; body option `flat: true`. Bright cyan #38c8ff, emissive #38c8ff at intensity 0.6, roughness 0.15.
2. The gold cup is a thin ring with small prongs. Make it a crown of 6 pointed, slightly flared petals around the crystal base, gold #d4a93a, metalness 1, roughness 0.35, about 0.05 m tall.
3. The shaft has no vines. Add 5 to 6 orange vine tendrils #d9822b (roughness 0.5) that wrap the dark wood shaft in short spirals and end in small curls, spread from the cup down to the foot (use `sdf.chain` with tapering radii 0.012 to 0.006 m). Darken the shaft wood to #6b4228 with lighter grain #8a5a35. Replace the iron ferrule with a small wooden root flare at the foot.

Keep the height 1.24 m, standing on y = 0, and keep the `equip` block exactly (the grip at y 0.47). `./forge check staff` must still end `fit ok`. Keep the total under 7,000 triangles.

Rules: put fine surface detail (grain, grooves, stitching, pits) in the body option `bump` as a function `(x, y, z) => number` in meters; keep `displace` at 0.01 m or less. Parts that must read at 128 px are at least 0.02 m thick. Keep the file path, the `name`, the export, and the catalog role. Keep the `equip` block, and run `./forge check staff` after the last edit.

Checks: `FORGE_WORKERS=2 ./forge render staff --fast`, then look at out/staff/render.png and compare with the reference. At most 4 looks. Note: `--fast` uses vertex colors, so noisy paint can show jagged spots that the textured build does not have. Then `FORGE_WORKERS=2 ./forge all staff` once (it can wait for a build slot; give it a long timeout), and look at out/staff/sprites/preview.png once. No `warning:` lines. Run `node scripts/typecheck-asset.mjs staff` and fix every error in your file with real types (a guard, a default, a typed tuple); never `any`, `@ts-ignore`, or `@ts-expect-error`. Update the design note at the top of the file. Never commit. Only edit assets/staff.ts.
