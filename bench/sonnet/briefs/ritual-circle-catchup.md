# ritual-circle rework (props/world/ritual-circle) -> assets/ritual-circle.ts

Rework the existing file in place. Reference: docs/item-mockups/ritual-circle-mock.jpg (a ring of stones with lit candles and a violet glow). The current build is a dark slab with a ring of dark stones and a violet pentagram. The pentagram reads well from above; keep it. The 8 candles are tiny black posts, and their flames do not show.

Keep the bounds within 5 percent of the current size (2.00 x 0.30 x 1.97 m), lying on y = 0: scenes place this asset. Priority P1: the target score is 7.0 of 10. Triangle budget: 5,000 in total.

Construction recipe:
1. Keep the slab and the pentagram. Make the pentagram lines and the circle line glow: emissive violet #a060ff at a low intensity (0.3), so they stay violet, not white.
2. Stones: lighten them to purple-gray #6a5a7e with lighter tops #8a7aa0, so they separate from the dark slab from above.
3. Candles: 5 candles, one at each point of the pentagram, 0.07 to 0.08 m thick and 0.16 to 0.2 m tall, deep purple wax #3a2350 with melted drips and a small wax puddle at the foot.
4. Flames: violet teardrop flames about 0.07 m tall, base #f4e2ff, then #c070ff, tip #7a2cd0, emissive #8a3cff at 0.25. Flame rule (proven on the torch, brazier, and fireplace): one teardrop flame body per candle with one `paintFn` gradient from the base to the tip, roughness 0.95, and a low emissive (intensity 0.25). A glossy or high-intensity emissive flame renders salmon or white. A separate core body shows as a band. The flame tops stay at or below y = 0.30.

Rules: put fine surface detail (grain, grooves, weave, pits, hammer marks) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick, or scaled up to read on small items. Stay inside the triangle budget: raise `maxTriangles` only when the build warns. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render ritual-circle --fast`, then look at out/ritual-circle/render.png; compare with the reference. At most four looks. Then `FORGE_WORKERS=2 ./forge all ritual-circle` once, and look at out/ritual-circle/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/ritual-circle.ts.
