# specter rework (enemies/undead/specter) -> assets/specter.ts

Rework the existing assets/specter.ts (a fresh agent; the file builds, 44,424 triangles, `./forge check` ok, ground ok). Bar 8/10 (character). The last review gave 7.7; the design is close. Mockup: docs/enemy-mockups/specter_001.jpg (already the `reference`). Keep the rig, the clips, the variants, the eyes, the arms, and the chains.

Fix these three differences, largest first:
1. Cloth surface: the robe, hood, and cowl bump reads as pebbled stone in the textured build. Cut the cloth bump amplitude to a quarter and change it from noise to a few long vertical fold grooves (a low-frequency function of atan2(x, z) with 8 to 10 folds, amplitude 0.003). The cloth must read as smooth matte clay like the mockup. Keep the roughness 0.85.
2. Mist: the wisps are stubby blocky spikes. Make them soft curling smoke: use 10 chains that are longer (0.4 to 0.5 m), thinner (r 0.05 at the base to 0.01 at the tip), smooth (Catmull-Rom points with two gentle curls each), blended with smoothUnion k 0.06 into the base blobs, displaced with fbm amplitude 0.01 at a low frequency (scale 4), opacity 0.5. Keep the base glow stronger than the tips. The mist must not hide the chains: keep the wisps at the sides and back, lower in front.
3. Cowl: replace the lumpy ring with layered scarf folds: three flat wrapped bands (each a torus scaled [1, 0.45, 1], R 0.14 to 0.17, r 0.045) stacked with a 0.02 offset and slightly different tilts, with smooth surfaces and one crisp edge each (no noise displace), plus the two front tab flaps with pointed torn ends. The mockup's cowl reads as crisp cloth layers, not lumps.

Check every fix in out/specter/render.png and out/specter/sprites/preview.png. Report the three largest remaining differences.

Limits: under 55,000 triangles. No `warning:` lines. `./forge check specter` must end with `result ok` and the ground check must be ok. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/specter.ts. Finish with one `./forge all specter`.
