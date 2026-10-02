# Tavern map rework -> scenes/tavern-interior.ts

Read `bench/sonnet/briefs/map-rules.md` first. Priority P0: target 7.5 of 10.

Mockup: `docs/tavern-mockups/tavern-quest_v2.jpg` (layout anchor) and `docs/tavern-mockups/tavern-quest_001.jpg`.
Kit rules: `docs/tavern-mockups/construction.md`. Map source (hand-written): `scenes/tavern-interior.ts`. Scene name: `tavern`.
Current shots (2026-10-02, warm interior light): `docs/tavern-mockups/render-3q.png`, `docs/tavern-mockups/render-top.png`.
Orchestrator score now: 7.0.

Faults, largest first:
1. The south half of the 12 m x 8 m room is a bare plank field: two round tables and two patrons
   for about 40 m2. The mockup room is full: tables with stools in every quarter, patrons seated
   and standing, food and drink on every table. Either fill the south half (more round tables with
   stools and chairs, patrons, mugs and plates on the tables, a barrel stack, sacks) or shrink the
   room to 10 m x 8 m and fill what remains. Keep the fireplace, bar, and feast table zones.
2. The fireplace corner needs its own cosy group (as in the mockup): a small table and two stools
   in front of it, the rug between.
3. The bar wall reads as two plain shelves: put bottles, mugs, and a keg or barrels on and behind the bar.

Characters that exist: innkeeper, bard, villager, farmer, adventurer, rogue, cleric, ranger, and
more in `assets/` (check a GLB exists). Props: round-table, table, chair, stool, bench, mug,
tankard, plate, bread, cheese, bottle, candle, candle-cluster, barrel, crate, sack, lute, banner.

Final shots (overwrite):
```
FORGE_SHOT_BASE=http://127.0.0.1:5232/hamlet.html node scripts/shoot-map.mjs docs/tavern-mockups \
  'render-3q=scene=tavern&clean&az=35&el=44&dist=19&tx=0&tz=0' 'render-top=scene=tavern&clean&az=0&el=86&dist=17&tx=0&tz=0'
```
Also update `docs/tavern-mockups/components.tsv` counts.
