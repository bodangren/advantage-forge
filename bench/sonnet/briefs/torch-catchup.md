# torch rework (props/furniture/torch) -> assets/torch.ts

Rework the existing file in place. The current build is a thin shaft, a pale peach flame, and a small rock base. Match docs/item-mockups/torch-mock.jpg (already the file's reference).

Keep the bounds within 5 percent of the current size (0.44 x 1.57 x 0.41 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P0: the target score is 7.5 of 10.

Construction recipe:
1. Base: a pile of 8 to 10 chunky grey stones (0.08 to 0.14 m) around the foot, slightly faceted, lighter tops.
2. Shaft: a thicker gnarled wood shaft (radius 0.035 m tapering to 0.03 m) with bark grain in `bump`.
3. Cup: an iron cup at the top (radius 0.07 m) with 2 or 3 ring bands, dark iron #3a3a3e, with wrapped cloth under it.
4. Flames: 3 to 5 tongue shapes (tapered cones or short chains, slightly twisted, different heights), a yellow core #ffd23a inside orange #ff7a1a tongues, full-brightness base colors with emissive in the same hue at emissiveIntensity 0.5 to 0.7. A dark base with a high intensity renders pale salmon, which is the current fault. The flame is about 0.3 m tall; the total height may grow to 1.7 m. Keep the body names.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render torch --fast`, then look at out/torch/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all torch` once, and look at out/torch/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/torch.ts.
