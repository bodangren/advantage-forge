# candelabra rework (props/furniture/candelabra) -> assets/candelabra.ts

Rework the existing file in place. Reference: docs/tavern-mockups/tavern-quest_001.jpg (the brass-and-iron candle holders in the tavern). The current build has a thick bulbous column with raised arms that reads as a person.

Keep the bounds within 5 percent of the current size (0.30 x 0.46 x 0.27 m), standing on y = 0 and facing +Z. Priority P1: the target score is 7.0 of 10. Triangle budget: 5,000 in total.

Construction recipe:
1. Base: a wide domed foot (revolve profile), 0.2 m across, with a foot ring and one bead molding. Dark iron #2e2a28, metalness 0.7, roughness 0.5.
2. Stem: a slim turned stem, 0.025 to 0.035 m thick, with 2 or 3 small knops (bead swellings). No wide body or shoulders anywhere on the stem.
3. Arms: 2 thin S-scroll arms (0.018 m thick) that curl out from the upper stem to each side, with a small curl at the tip of each scroll, plus a center socket on top of the stem. Each of the 3 sockets has a drip pan 0.06 m across in warm brass #b08a3a.
4. Candles: 3 cream candles #efe2c0, 0.028 m thick, with wax drips on the rim and a black wick.
5. Flames: yellow #ffd23a at the base, #ffa010, #ff6a00, and red-orange #e8400a at the tip, emissive #ff5a00 at 0.25. Flame rule (proven on the torch, brazier, and fireplace): one teardrop flame body per candle with one `paintFn` gradient from the base to the tip, roughness 0.95, and a low emissive (intensity 0.25). A glossy or high-intensity emissive flame renders salmon or white. A separate core body shows as a band.

Rules: put fine surface detail (grain, grooves, weave, pits, hammer marks) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick, or scaled up to read on small items. Stay inside the triangle budget: raise `maxTriangles` only when the build warns. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render candelabra --fast`, then look at out/candelabra/render.png; compare with the reference. At most four looks. Then `FORGE_WORKERS=2 ./forge all candelabra` once, and look at out/candelabra/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/candelabra.ts.
