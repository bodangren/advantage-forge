# giant-crystal (nature/terrain/giant-crystal) -> assets/giant-crystal.ts

A cluster of giant purple crystals 2.0 m tall growing from a rock base: five hexagonal pointed crystals of different sizes, glowing from inside, on a rough grey stone mound. Stand on y = 0, centered on Y, the largest crystal leans toward +Z. Bar 7/10 (terrain prop).

Mockup: bench/overnight/refs/p1-dungeon/giant-crystal-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Pattern file: assets/crystal-golem.ts (accepted 2026-09-30) has a working glowing crystal recipe (a dark base color with an emissive); read its crystal body and copy the material values. assets/cave-mouth.ts has the dungeon rock paint.

Palette (dungeon scene): crystals emissive #b060ff with intensity 1.5 on a dark base #2a1040, opacity 0.92, roughness 0.2, `flat: true` for faceted shading; a paler #d8a0ff tip band in paint; rock cool grey #6f7680 with dark #4b525c cracks (roughness 0.95); small crystal shards #8040c0 around the base.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. Glowing parts are emissive bodies, never bright plain paint; a bright base color washes the glow out.

Construction recipe:
1. Rock mound: a displaced ellipsoid (rx 0.9, ry 0.35, rz 0.8) at y 0.15 with `.displace(0.06, fbm)` and cracks in paint, cut flat at y = 0.
2. Crystals: hexagonal prisms from `sdf.extrude(profile.polygon(6 points), length)` with a pointed cap (`sdf.cone` from the top face to a point), 5 of them: heights 2.0, 1.5, 1.2, 0.9, 0.7 m, widths 0.34 to 0.16 m; the tallest leans 12 degrees toward +Z, the others lean outward 15 to 30 degrees in different directions; all rooted into the mound with `smoothUnion 0.03` on the rock only (the crystals stay sharp).
3. Six small shards (0.2 to 0.35 m) scattered on the mound.
4. The crystals must read purple and lit from inside in the render, with visible flat facets; the tips paler than the bases.

Limits: whole asset under 5,000 triangles; `detail` 0.012 on the crystals, 0.016 on the rock. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/giant-crystal.ts. Finish with one `./forge all giant-crystal`.
