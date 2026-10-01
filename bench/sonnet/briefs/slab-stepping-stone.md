# stepping-stone -> 0.3 m ground slabs

Files: assets/stepping-stone.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (P1).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- A grass lip over warm soil #7a4a2a with strata #57331d and pebble specks #9a8a78, as in grass-ground. The stones stay 0.035 to 0.05 m proud of the grass top at y = 0.
- Keep the slab and the grass top in the body named `grass`, and keep the stones and tufts in other bodies: the scene viewer (`src/scene/main.ts`) hides the `grass` mesh so scenes show only the stones.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
