# palm-tree (nature/trees/palm-tree) -> assets/palm-tree.ts

A palm tree 4 m tall: a curved ringed trunk, a crown of long arching green fronds, and three coconuts. Stand on y = 0, centered on Y, the trunk curves toward +Z. Bar 7/10 (tree).

Mockup: bench/overnight/refs/p1-village/palm-tree-mock.jpg (set `reference` to that path). Match its idea and colors, not every detail.
Start file: /home/daniebo/forge-trials/ov-p1f/palm-tree/deepseek-flash/ws/assets/palm-tree.ts is an external trial of this asset. Its render shows a short trunk (about 2.2 m), ragged torn frond edges, and coconuts that sit in the crown rather than under it. Copy it to assets/palm-tree.ts, run `./forge render palm-tree --fast`, fix what the current tools reject, then rework the fronds and the trunk as listed. Rewrite from scratch if that is faster.
Pattern file: assets/oak-tree.ts for the trunk paint recipe.

Palette: trunk warm brown #8a5a35 with #6b4226 ring grooves and #b5814a ring ridges; fronds leaf green #5cb85c with a sunlit #8fd45c top and a #3a8a3a underside; coconuts #6b4226 with a #8a5a35 husk; the crown heart straw #e0bb60. Trunk roughness 0.9, fronds 0.7.
Art direction (Chibi Quest): rounded chunky forms, soft bevels, oversized readable features. One body per material.

Construction recipe:
1. Trunk: a `sdf.chain` of 8 segments from (0, 0, -0.1, r 0.22) curving to (0, 3.3, 0.45, r 0.15), with 14 ring grooves (a cosine of y in bump and a darker paint band) and a flared foot r 0.3 at y 0 to 0.2.
2. Crown: 9 fronds around the top (y 3.3), each one a flat tapered ellipsoid 1.6 m long, 0.35 m wide, 0.05 m thick, arched down 35 degrees at the tip with `.bend`, with a center rib (a thin box) and 6 scallops each side from `.displace(0.02, ...)` at a low frequency. Fronds at 40 degree steps, 3 lifted 20 degrees, 6 drooping 10 to 30 degrees. Smooth clean edges: no high-frequency noise.
3. A crown heart: a sphere r 0.22 in straw color at the frond base, and 3 coconuts (spheres r 0.13) hanging just under the heart, in a cluster on the +Z side, visible from the front.
4. The top of the tallest frond reaches about y 4.0; the crown spreads about 3.2 m.

Limits: whole asset under 7,000 triangles; `detail` 0.014 on the trunk, 0.012 on the fronds, 0.01 on the coconuts. No `warning:` lines. Set `FORGE_WORKERS=2` on every forge command. Never commit. Only create or edit assets/palm-tree.ts. Finish with one `./forge all palm-tree`.
