# dirt-ground, dirt-floor, tilled-field -> 0.3 m ground slabs

Files: assets/dirt-ground.ts, assets/dirt-floor.ts, assets/tilled-field.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (all P1; dirt-ground is used by the hero-vs-zombie churchyard; mockup docs/item-mockups/dirt-floor-mock.jpg).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- A lip of the top dirt color, then darker packed soil #6a4428 with strata #4a2e1a and pebble specks #9a8a78, darker toward the bottom.
- dirt-ground uses `tileSurface`: remove it (recipe rule 4).
- tilled-field: the furrows stay in the top design; the side shows the furrow ridges as a wavy top line only if they rise above y = 0.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
