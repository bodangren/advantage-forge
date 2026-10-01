# river-bank, lake-shore -> 0.3 m ground slabs

Files: assets/river-bank.ts, assets/lake-shore.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (both P1; mockup docs/item-mockups/lake-shore-mock.jpg).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- Grass at y = 0. The water surface stays the same distance below the grass as now; deepen the bed to about y = -0.18.
- Where the water meets a tile edge, the side shows a blue water face from the surface down to the bed, over sand #d8c08a and soil below. Elsewhere: a grass or sand lip (lip rule) over warm soil #7a4a2a with strata #57331d.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
