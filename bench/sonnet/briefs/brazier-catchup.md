# brazier rework (props/lighting/brazier) -> assets/brazier.ts

Rework the existing file in place. The current build has three thick black legs like rubber tubes that dominate the asset, and pale flames. The bowl reads.

Keep the bounds within 5 percent of the current size (0.58 x 0.72 x 0.45 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Legs: three slim wrought-iron legs (radius 0.022 m) that splay outward and end in small curled scroll feet (a short torus arc); a thin ring brace at mid height.
2. Bowl: a shallow iron bowl with a rolled rim and two ring handles. Iron #3b3a3f, metalness 0.7, roughness 0.5, a faint rust tint on the rim (paintFn).
3. Coals: dark lumps #2a1a14 with glowing red-orange cracks #ff5a1a (emissive 0.5).
4. Flames: 3 to 5 tongue shapes (tapered cones or short chains, slightly twisted, different heights), a yellow core #ffd23a inside orange #ff7a1a tongues, full-brightness base colors with emissive in the same hue at emissiveIntensity 0.5 to 0.7. A dark base with a high intensity renders pale salmon, which is the current fault.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render brazier --fast`, then look at out/brazier/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all brazier` once, and look at out/brazier/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/brazier.ts.
