# footpath-straight, footpath-corner -> 0.3 m ground slabs

Files: assets/footpath-straight.ts, assets/footpath-corner.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (both P1; the old-oak-clearing scene uses them).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- Both files share one structure: make the same change in each.
- Below the lip: warm soil #7a4a2a with strata #57331d and pebble specks #9a8a78. The path surface is at the same height on both pieces so they join.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
