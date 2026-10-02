# Village map rework -> scenes/village.ts

Read `bench/sonnet/briefs/map-rules.md` first. Priority P0: target 7.5 of 10.

Mockup: `docs/village-mockups/village-quest_001.jpg`. Kit rules: `docs/village-mockups/construction.md`.
Map source (hand-written): `scenes/village.ts`. Scene name: `village`.
Current shots (2026-10-02): `docs/village-mockups/render-3q.png`, `docs/village-mockups/render-top.png`.
Orchestrator score now: 6.5.

Faults, largest first:
1. Ground: the mockup is a warm sandy village where wide, winding dirt lanes and an open plaza cover
   about half of the ground and grass shows in patches. The map is about 85% bright grass with two
   thin straight roads. Widen the lanes (two tiles wide), make the main lane bend (dirt-road-corner
   tiles; the list names them but the map does not place any), and pave a plaza around the well and
   the stalls with dirt-ground or dirt-road tiles.
2. Fences dominate: almost every cottage sits in a fenced box, so the map reads as a grid of pens.
   Keep fences for the farm field and one or two yards; open the rest so the cottages face the lanes.
3. The component list names `merchant` (a P2 character with no source). Use an existing character
   at the stall instead (shopkeeper or villager) and change the row in `components.tsv` to that asset.

Final shots (overwrite):
```
FORGE_SHOT_BASE=http://127.0.0.1:5232/hamlet.html node scripts/shoot-map.mjs docs/village-mockups \
  'render-3q=scene=village&clean&az=28&el=46&dist=48&tx=0&tz=1' 'render-top=scene=village&clean&az=0&el=86&dist=34&tx=0&tz=0'
```
Also update `docs/village-mockups/components.tsv` counts.
