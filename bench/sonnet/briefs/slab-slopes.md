# hill-slope, valley-slope -> 0.3 m ground slabs

Files: assets/hill-slope.ts, assets/valley-slope.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (P1; mockups docs/item-mockups/hill-slope-mock.jpg and valley-slope-mock.jpg).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- hill-slope: the low front edge top is at y = 0 and the back rises 1.0 m above it (to y = 1.0). The body goes down to y = -0.3 under the whole tile, so the ±X side faces show the slope profile over soil.
- valley-slope: the channel floor is at y = 0 and the ±X edges rise 0.54 m above it. The body goes down to y = -0.3 under the whole tile.
- Sides: a grass lip over warm soil #7a4a2a with strata #57331d and pebble specks #9a8a78. The strata follow the slope surface (measure depth from the surface, not from y = 0).
- The flat edges that meet flat tiles are exactly at y = 0.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
