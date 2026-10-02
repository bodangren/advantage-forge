# Small town -> scenes/maps/town.ts

Read `bench/sonnet/briefs/map-p2-rules.md` first. Slug: `town`. P2 bar: 7.0 of 10.

Mockup: `docs/map-mockups/town.jpg` (the layout and style anchor; one view, so infer the rest).
Generator: `scripts/design-town.mjs`. Output: `scenes/maps/town.ts` and `docs/map-mockups/town.md`.
Lighting group (set by the orchestrator): day.
Size: 26 m x 22 m street layout.
Shot distances: 3q `dist=42`, top `dist=40`.

What the map holds: A cobble main street with a market corner, two rows of houses (townhouse, cottage, farmhouse), a church-like building (crypt-chapel or tower with roof-tile) with a bell tower, a well, hanging signs, a town gate at the south, window boxes (garden-bed, wildflowers), villagers.

Pieces likely to fit (check each exists in `out/`): cobble-road-straight, cobble-road-corner, cobble-road-t-junction, cobble-road-crossing, cobble-floor, townhouse, cottage, farmhouse, shop-stall, well, tower, roof-tile, wall-gate, signpost, garden-bed, wildflowers, villager, barrel, crate, oak-tree.

Final shots: `docs/map-mockups/town-3q.png` and `docs/map-mockups/town-top.png`.
