# desert-ground, snow-ground, stone-ground -> 0.3 m ground slabs

Files: assets/desert-ground.ts, assets/snow-ground.ts, assets/stone-ground.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (all P1; mockups docs/item-mockups/desert-ground-mock.jpg, snow-ground-mock.jpg, stone-ground-mock.jpg).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- desert-ground: the whole slab reads as sand and sandstone, like the mockup: a sand lip, then layered sandstone #c89a5a with strata #a8784a and #d8b070.
- snow-ground: a thick snow lip 0.06 to 0.08 m deep with a soft wavy edge, over frozen dark soil #4a3a30 with pale ice specks #cfe0ea.
- stone-ground: the mockup shows square stone blocks whose sides are the stone itself. Paint the side as cut stone #7a7874 with darker joints #4e4c4a that continue the joints of the top slabs down the side, and a darker foundation band in the lowest 0.1 m.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
