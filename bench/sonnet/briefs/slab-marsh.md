# marsh-ground -> 0.3 m ground slabs

Files: assets/marsh-ground.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (P1; mockup docs/item-mockups/marsh-ground-mock.jpg).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- The pools sit below y = 0 (their water surface about -0.02 m). A moss lip over dark wet mud #3a2e22 with one blue-gray clay stratum #5a6068 and root threads #5a4630.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
