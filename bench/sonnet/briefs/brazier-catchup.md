# brazier rework (props/lighting/brazier) -> assets/brazier.ts

Rework the existing file in place. The current build has three thick black legs like rubber tubes that dominate the asset, and pale flames. The bowl reads.

Keep the bounds within 5 percent of the current size (0.58 x 0.72 x 0.45 m, x by y by z), standing on y = 0 and facing +Z: scenes and games place this asset. Priority P1: the target score is 7.0 of 10.

Construction recipe:
1. Legs: three slim wrought-iron legs (radius 0.022 m) that splay outward and end in small curled scroll feet (a short torus arc); a thin ring brace at mid height.
2. Bowl: a shallow iron bowl with a rolled rim and two ring handles. Iron #3b3a3f, metalness 0.7, roughness 0.5, a faint rust tint on the rim (paintFn).
3. Coals: dark lumps #2a1a14 with glowing red-orange cracks #ff5a1a (emissive 0.5).
4. Flames: one wide wavy flame mass with 3 to 5 lobes that curl up from it (smoothUnion 0.03), not thin separate cones. One body, painted as one gradient with `paintFn`: yellow #ffd23a at the base and along the axis, orange #ffa010 to #ff6a00 in the belly, red-orange #e8400a at the tips. Matte: roughness 0.95, emissive #ff5a00 at emissiveIntensity 0.25. A glossy surface or a higher intensity renders the flame salmon or pale; a separate core body shows as a yellow band.

Rules: put fine surface detail (grain, grooves, straw, stone pits, weave) in the body option `bump` as a function `(x, y, z) => number` in meters (a plain number breaks the textured build); keep `displace` at 0.01 m or less (a strong displace reduces to crumpled facets). Parts that must read at 128 px are at least 0.03 m thick. Keep the file path, the `name`, and the export.

Checks: `FORGE_WORKERS=2 ./forge render brazier --fast`, then look at out/brazier/render.png; compare with the reference if one is set. At most four looks. Then `FORGE_WORKERS=2 ./forge all brazier` once, and look at out/brazier/sprites/preview.png once. No `warning:` lines. Update the design note at the top of the file. Never commit. Only edit assets/brazier.ts.
