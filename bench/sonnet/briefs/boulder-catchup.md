# boulder rework (nature/terrain/boulder) -> assets/boulder.ts

Rework the existing file in place. The current build is one smooth grey lobed blob with a moss patch. Match reference/boulder/boulder_001.jpg (already the file's reference): a cluster of three stones.

Keep the bounds within 5 percent of the current size (1.25 x 0.78 x 0.96 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Stones: one big stone (about 0.6 m tall, flattened top), one medium stone leaning on its +X side, one small stone at the front -X. Build each stone from a rounded box or ellipsoid intersected with 3 to 5 tilted `halfSpace` cuts (smoothIntersect 0.03) so it has chunky planar facets, not a smooth blob.
2. Color: grey #9aa3a6 with a lighter top #b8c0c2 and a darker base #7a8286 (paintFn by height), fine speckle and pits in `bump`.
3. Moss: a thin cap on the top of the big stone and a smaller one on the medium stone: a shell of the top surface intersected with a height band, #6f9a2e with a fuzzy `bump`. Separate body.
4. No floating or buried stones; all three touch y = 0.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render boulder --fast`, then look at out/boulder/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all boulder` once, and look at out/boulder/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/boulder.ts.
