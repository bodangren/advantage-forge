# dirt-road-straight, dirt-road-corner, dirt-road-t-junction, dirt-road-crossing -> 0.3 m ground slabs

Files: assets/dirt-road-straight.ts, assets/dirt-road-corner.ts, assets/dirt-road-t-junction.ts, assets/dirt-road-crossing.ts. Convert each file in place.

Read `bench/sonnet/briefs/ground-slab-recipe.md` and `assets/grass-ground.ts` (the worked example) first. The recipe is your contract. Priority: target score 7.0 of 10 (all P1; the village and chibi-quest scenes use them).

Lip rule for all tiles: the lip color at a side point is the top paint at the same (x, z) (call your top color function with y = 0), so roads, water, and patches continue down the side edge. Below the lip, use the family material:

- The four files share one structure: make the same change in each.
- Below the lip: warm soil #7a4a2a with strata #57331d and pebble specks #9a8a78. The road band's lip is packed dirt (from the lip rule), the verge's lip is grass.
- The road surface may sit up to 0.02 m below y = 0 (ruts), but the grass verge and all tile edges outside the road are exactly at y = 0, and the road surface is at the same height on every road tile, so the pieces join.
- dirt-road-straight uses `tileSurface`: remove it (recipe rule 4).

Image budget: one look at the fast render of each tile, plus one more look for one tile if a fix needs it. Report in ASD-STE100 Simplified Technical English: for each file the triangle count, the bounds, the min y, and any `warning:` lines; the changes in a numbered list; a self-score out of 10 for each tile; the largest remaining problem; and the number of images you viewed.
