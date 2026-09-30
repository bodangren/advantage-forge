# bellows rework (props/craft-and-trade/bellows) -> assets/bellows.ts

Rework the existing file in place. It builds clean, but the render reads as a small flat box: the two boards are thin slabs, the leather bags barely puff out of the gap, and the nozzle and handles are lost. Keep the design note idea (a chunky teardrop wedge with puffy leather between two walnut paddles) and make the parts big enough to read at 128 px.

Reference: docs/blacksmith-mockups/blacksmith-quest_001.jpg (scene style only). Lies on y = 0, nozzle toward +Z, handles toward -Z.

Target size: 0.40 m long from nozzle tip to handle ends, 0.20 m wide at the back, 0.16 m tall at the back hinge, 0.05 m tall at the nozzle.

Construction recipe:
1. Paddles: two teardrop boards, each an extruded 2D profile in XZ (`profile.polygon` with `smooth: true`: a point at the nozzle end z 0.14, widening to 0.20 m across at z -0.06, rounded back at z -0.14), thickness 0.02 m, edge radius 0.006. The bottom board lies flat at y 0.01. The top board hinges at the back: rotateX so the front edge sits at y 0.05 and the back edge at y 0.15 (about 14 degrees). Walnut #6b4226 with grain in bump, roughness 0.8.
2. Leather: one puffy body that fills the gap between the boards: a stack of two ellipsoids [0.09, 0.03, 0.10] and [0.08, 0.025, 0.09] blended with smoothUnion 0.02, centered at the back half (z -0.05), tilted to follow the top board, and bulging 0.02 m past both board edges on each side. Cut it with the two boards (subtract them) so it never pokes through the wood. Add a waist seam: a torus around the middle, 0.004 m thick, in the darker leather #6e4527. Leather #8a5a35, roughness 0.62.
3. Nozzle: a brass cone from r 0.018 at the boards' point to r 0.010 at the tip, 0.07 m long, pointing +Z, with a ring torus r 0.018/0.004 at its base. Brass #caa24a, metalness 1, roughness 0.3. Add a soot patch: `paintWhere` a sphere r 0.03 at the tip in #2a2a2a on the nozzle only.
4. Handles: two chunky grips at the back (-Z end), one on each board: rounded boxes [0.05, 0.03, 0.09] with radius 0.01, sticking out 0.07 m beyond the board edge, in the darker walnut #54331d.
5. Hinge straps: two iron bands [0.03, 0.006, 0.08] across the back on both boards, iron #4a4f55 metalness 0.7 roughness 0.55, with four dome-head rivets r 0.006.

Checks: `FORGE_WORKERS=2 ./forge render bellows --fast`, look at out/bellows/render.png. In the side view the wedge must open from 0.05 m at the nozzle to 0.16 m at the back, and the leather must bulge out past the boards in the front view. At most three looks. Then `FORGE_WORKERS=2 ./forge all bellows` once. Under 5,000 triangles, no `warning:` lines. Update the design note at the top of the file (size and detail lines). Never commit. Only edit assets/bellows.ts.
