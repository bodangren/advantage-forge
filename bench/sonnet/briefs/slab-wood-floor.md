# wood-floor -> 0.3 m ground slabs

Files: assets/wood-floor.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (P1; mockup docs/tavern-mockups/tavern-quest_001.jpg (the tavern floor edge); the potion-rush shop and the tavern-interior scene use it).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- Side from the top down: the plank ends 0.05 m deep (plank color, a dark line between planks where each plank ends), a dark joist beam band #4a2e1a 0.12 m deep with beam ends every 0.5 m, then stone foundation blocks #6a625a with mortar #45403a to y = -0.3.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
