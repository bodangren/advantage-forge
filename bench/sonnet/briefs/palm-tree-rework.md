# palm-tree rework (nature/trees/palm-tree) -> assets/palm-tree.ts

Fresh rework of an existing file. assets/palm-tree.ts (medium tier, two passes, 6.8/10) has a good trunk and coconuts; the fronds fail. Keep the trunk (5 stacked rounded segments, 2.5 m, curving to +Z), the two orange coconuts, and the straw heart. Rebuild only the crown. Bar 7/10 (tree). Mockup: bench/overnight/refs/p1-village/palm-tree-mock.jpg (keep `reference` on that path).

Problem: the current fronds are short flat paddles built from two joined halves, so each shows a hard kink at the middle and a blunt tip, and the crown is sparse. The mockup fronds are long, fat, and curl in one smooth arc: they rise from the heart, level off, and droop at the tip like a wave.

Crown recipe:
1. One frond = a smooth arc of 6 overlapping flattened ellipsoids (each 0.42 long, 0.36 wide at the base tapering to 0.2 at the tip, 0.12 thick tapering to 0.06), placed along a circular arc that starts at the heart pointing up 40 degrees and ends 1.55 m out pointing down 45 degrees, each ellipsoid rotated to the arc tangent, smoothUnion 0.06 so the kinks vanish. The tip ellipsoid is rounded, never pointed. Add 4 soft scallops per side with a low-frequency sine displacement (amplitude 0.05) along the frond length only; no noise.
2. 9 fronds at 40 degree steps around the heart at y 2.6; 3 of them start 15 degrees higher (lifted), 6 lower (drooping); alternate them. Give the fronds a slight roll (10 to 20 degrees) so they do not all lie flat.
3. One foliage body: sunlit #8fd45c on top, #5cb85c mid, #3a8a3a below (paintFn by the surface normal y or by height), roughness 0.7; a center rib groove in bump is optional.
4. Keep the heart sphere r 0.28 visible between the fronds and tuck the coconuts just under it on the +Z side (top of the coconuts at the heart's center height). Add a small green cap disc on each coconut.
5. Total height about 3.9 m; crown spread about 3.2 m; the crown must look full from the front and the three-quarter view.

Limits: whole asset under 8,000 triangles; `detail` 0.014 on the trunk, 0.012 on the fronds. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only edit assets/palm-tree.ts. Iterate with `./forge render palm-tree --fast`; finish with one `./forge all palm-tree` (600 s timeout; keep waiting for a build slot).
