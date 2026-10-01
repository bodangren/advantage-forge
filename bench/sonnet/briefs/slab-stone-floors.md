# cobble-floor, stone-floor, tile-floor -> 0.3 m ground slabs

Files: assets/cobble-floor.ts, assets/stone-floor.ts, assets/tile-floor.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (stone-floor is P0 with a target of 7.5; the others P1; mockups docs/item-mockups/cobble-floor-mock.jpg and tile-floor-mock.jpg; stone-floor is the blacksmith-shop floor).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- Indoor floors: the lip is the floor material itself (the cobbles, slabs, or clay tiles, 0.05 to 0.07 m deep, with their joints continued down the side), then a foundation of large stone blocks #6e6a66 with darker mortar #4a4644 to y = -0.3.
- tile-floor: the clay tiles have the terracotta color of the mockup on the lip.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
