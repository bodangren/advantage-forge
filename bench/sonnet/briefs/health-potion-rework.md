# health-potion rework (items/consumables/health-potion) -> assets/health-potion.ts

Rework the existing file in place. It is the base for nine more potions, so the flask must be right. The current build fails: the bottle reads as a teardrop with a pinched shoulder, a cone artifact shows inside the neck, and the liquid is a flat matte pink block with no glow.

Target (match docs/item-mockups/health-potion-mock.jpg): a round ball flask. Total height 0.18 m, flat foot on y = 0, front toward +Z.

Construction recipe:
1. Glass: `sdf.sphere(0.058).at(0, 0.064, 0)` smoothUnion 0.008 with a short straight neck `sdf.cylinder(0.014, 0.05).at(0, 0.125, 0)`, plus a lip `sdf.torus(0.015, 0.004).at(0, 0.152, 0)`. Cut the foot flat with `intersect(sdf.halfSpace([0, -1, 0], 0))` after moving the sphere so the foot is a small flat disc (sphere center y 0.064 gives a 0.006 m flat). Make it a true shell: `.shell(0.004)`, then cut the shell open at the top of the neck with `subtract(sdf.cylinder(0.011, 0.03).at(0, 0.155, 0))` so the cork sits in a real opening. Body options: color #c8dee2, roughness 0.08, metalness 0, opacity 0.35, detail 0.004. Remove the old paintFn streaks; a plain tint is enough.
2. Liquid: `sdf.sphere(0.052).at(0, 0.064, 0).intersect(sdf.halfSpace([0, 1, 0], 0.078))` (fill two thirds, flat top). Color #660812 (dark base), emissive #ff3a52, emissiveIntensity 1.6, roughness 0.3, detail 0.004. No inner paintFn shading; a single flat glowing body reads better at 128 px.
3. Cork: a rounded cylinder r 0.013, height 0.03, at y 0.16 (its bottom 0.012 m inside the neck), with a slightly wider crown sphere r 0.015 at y 0.182. Cork #b08a5a with the existing noise paint. Roughness 0.85.
4. Twine: keep the existing torus wraps around the neck below the lip (y 0.14 to 0.148) and the small bow on the +X side. Twine #c9a878, roughness 0.9.

Checks: run `FORGE_WORKERS=2 ./forge render health-potion --fast` and look at out/health-potion/render.png; the silhouette must be a ball with a short neck in every view, the liquid must glow red through the glass, and nothing must show inside the neck. Then `FORGE_WORKERS=2 ./forge all health-potion` once.

Limits: under 4,000 triangles, no `warning:` lines. Keep the design note at the top of the file current (one idea, size, palette, materials). Never commit. Only edit assets/health-potion.ts.
