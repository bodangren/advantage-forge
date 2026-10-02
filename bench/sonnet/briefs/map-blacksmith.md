# Blacksmith-shop map rework -> scenes/blacksmith-shop.ts

Read `bench/sonnet/briefs/map-rules.md` first. Priority P0: target 7.5 of 10.

Mockup: `docs/blacksmith-mockups/blacksmith-quest_001.jpg`. Kit rules: `docs/blacksmith-mockups/construction.md`.
Map source (hand-written, edit it directly): `scenes/blacksmith-shop.ts`. Scene name: `blacksmith`.
Current shots (2026-10-02, warm interior light): `docs/blacksmith-mockups/render-3q.png`, `docs/blacksmith-mockups/render-top.png`.
Orchestrator score now: 6.0.

Faults, largest first:
1. The shop reads empty: 30 props on an 8 m x 6 m floor, and the south half (z > 0.5) holds only a crate,
   a sack, two rope coils, and the customer. The mockup is a dense workshop: every wall has something
   against it, and fuel, ore, and tools crowd the floor around the work area.
2. The forge is the focal object but reads small in the far corner. Build a work triangle in the
   north-west: forge, anvil within about 1.5 m of it, quench tub beside the anvil, coal heaped at the
   forge mouth, bellows against the forge.
3. Wall dressing is thin. Lean shields and swords against the walls as finished stock, hang or lean
   tools, and put ore and coal heaps in the corners.

Dressing assets that exist and are not used yet: water-trough, wheelbarrow, bucket, chains,
copper-ore, silver-ore, gold-ore, kite-shield, round-shield, tower-shield, long-sword, short-sword,
greatsword, warhammer, handcart, stool, crate, barrel, sack. Use several of each where it fits.
You may shrink the room to 6 m x 6 m (3 x 3 tiles) if that reads denser; keep two walls standing.

Final shots (overwrite):
```
FORGE_SHOT_BASE=http://127.0.0.1:5232/hamlet.html node scripts/shoot-map.mjs docs/blacksmith-mockups \
  'render-3q=scene=blacksmith&clean&az=35&el=42&dist=15&tx=0&tz=-0.3' 'render-top=scene=blacksmith&clean&az=0&el=86&dist=14&tx=0&tz=0'
```
Also update `docs/blacksmith-mockups/components.tsv` counts.
