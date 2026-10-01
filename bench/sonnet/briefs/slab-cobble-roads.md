# cobble-road-straight, cobble-road-corner, cobble-road-t-junction, cobble-road-crossing -> 0.3 m ground slabs

Files: assets/cobble-road-straight.ts, assets/cobble-road-corner.ts, assets/cobble-road-t-junction.ts, assets/cobble-road-crossing.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (all P1; mockup docs/item-mockups/cobble-road-straight-mock.jpg).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- The four files share one structure: make the same change in each.
- Below the lip: under the road band, a bedding of gray gravel #7a7670 with darker specks; under the verge, warm soil #7a4a2a with strata #57331d. Cobbles may stand up to 0.03 m above y = 0; the verge and all tile edges outside the road are at y = 0.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
