# vines (nature/plants/vines) -> assets/vines.ts

Hanging vines 1.5 m tall and about 1.0 m wide: a short mossy horizontal branch at the top (y 1.5) from which five to six leafy green vines hang down in gentle curves, each with big rounded leaves along it, three vines ending in small curls, and a few small purple flowers. The vines reach the ground at y = 0. Centered on Y, front toward +Z, flat-ish (0.35 m deep) so it hangs against a wall.

Mockup: bench/overnight/refs/p1-forest/vines-mock.jpg (set `reference` to that path). The mockup shows a vine plant climbing a small tree; take its leaf shapes, the smooth tendrils, and the curls, but build a hanging arrangement as described.
Pattern file: assets/ivy.ts (a vine with lobed leaves; built today by the same pipeline). Read it first and copy its leaf recipe (flat lobed leaves from smoothUnion of 3 to 5 flattened spheres, `detail` 0.008).

Palette: leaves #8ad45a with #5cb85c and #4a9c3f in shade; vines #6a9a3a with the moss branch #6b4a2e and moss #4a9a4f; flowers #9a6ac8 with a #e0bb60 center. Leaves roughness 0.75, stems 0.9.
Art direction (Chibi Quest): rounded chunky forms, oversized readable leaves (about 0.15 m). One body per material.

Construction recipe:
1. Branch: a `sdf.chain` from (-0.55, 1.5, 0) to (0.55, 1.48, 0) r 0.05 to 0.04 with a slight wave, in bark brown, with 3 moss blob ellipsoids on top.
2. Vines: six `sdf.chain` strands (r 0.02 to 0.012) from points along the branch, each hanging in a gentle S curve (x drift +-0.15, z drift +-0.1) down to y 0.05 to 0.4 (different lengths); three end with a curl (three extra chain points in a small spiral).
3. Leaves: 40 to 50 leaves, 5 to 8 per vine, alternating sides, each a flat lobed leaf (three flattened spheres r 0.06 to 0.08 smoothUnion 0.02, scaled y 0.3) tilted outward 20 to 40 degrees; leaves face +Z mostly; one foliage body with `paintFn` lighter on the top leaves.
4. Flowers: 6 to 8 small purple 5-petal flowers (five spheres r 0.02 around a yellow center sphere r 0.015) on the lower parts of three vines.
5. The lowest leaf tips touch y 0 so the asset stands on the ground plane; nothing floats.

Limits: whole asset under 4,000 triangles; `detail` 0.008. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/vines.ts.
