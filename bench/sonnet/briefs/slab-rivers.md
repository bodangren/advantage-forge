# river-straight, river-bend, river-junction -> 0.3 m ground slabs

Files: assets/river-straight.ts, assets/river-bend.ts, assets/river-junction.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (all P1; mockup docs/item-mockups/river-junction-mock.jpg; the old-oak-clearing and chibi-quest scenes use them).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- The three files share one structure: make the same change in each.
- Grass banks at y = 0. Keep the water surface the same distance below the banks as now (so the chibi-quest bridge still fits), and deepen the channel bed to about y = -0.18 so the water has depth.
- The water body reaches the tile edge exactly where the river leaves the tile, so river tiles join. At those edges the side shows a blue water face from the water surface down to the bed, as in the mockup, over a sand-and-gravel bed band #a89a78 and soil below.
- Elsewhere: a grass lip over warm soil #7a4a2a with strata #57331d.

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
