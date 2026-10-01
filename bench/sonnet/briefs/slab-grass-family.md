# forest-ground, meadow-ground, grass-floor -> 0.3 m ground slabs

Files: assets/forest-ground.ts, assets/meadow-ground.ts, assets/grass-floor.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (all P1).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- forest-ground: a leaf-litter and moss lip over dark humus soil #4a3020 with root threads #6a4a30 and dark strata #33221a.
- meadow-ground and grass-floor: a grass lip over warm soil #7a4a2a with strata #57331d and pebble specks #9a8a78, as in grass-ground. grass-floor has a mockup: docs/item-mockups/grass-floor-mock.jpg.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
