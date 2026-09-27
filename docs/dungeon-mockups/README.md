# Dungeon mockups: "The Sunken Vault"

These images show one shared dungeon level in [chibi quest style](./dungeon-quest_002.jpg)
(the batch style anchor) and [top-down tile reference](./dungeon-quest_001.jpg). They are
concept views, not final game levels. The [component list](./components.tsv) defines the
source assets to build.

## Style anchors

- **`dungeon-quest_002.jpg` is the batch anchor.** Every trial prompt references it, the way
  the hamlet anchored on the barn, pine-tree, and fence.
- Anchor assets to build first and review hardest: `wall` (stone language), `torch-sconce`
  (light language), `door` (wood + iron language). All other assets must sit beside these
  three without a style clash.

## Shared layout

The view is a scrolling three-quarter camera (a viewport, not the whole map) with **fog of
war** hiding unvisited areas: unvisited tiles unrendered, explored tiles dimmed, visible tiles
lit. Line of sight is computed on the 2 m tile grid — a wall tile blocks sight to the tile
behind it — so hiding is an information layer in the game engine, not asset geometry.
The dungeon sits on the same 2 m modular tile grid as the hamlet tiles: floors are 2 × 2 m
pieces flush at y = 0.08, walls occupy tile edges and rise about 1.2 m (two block courses) —
low enough that the camera never loses the player behind a wall, with fog of war doing the
hiding. Portals (door, arch, gate) rise taller on purpose: they mark passages.

| Zone | Grid area (cols × rows) | Shared content |
|---|---|---|
| South gatehouse | Columns 5–8, row 8 | Iron gate, two braziers, entry corridor |
| Central hall | Columns 5–8, rows 4–7 | Six pillars zone, hanging cage, arches to all chambers, torch sconces |
| West cell block | Columns 1–4, rows 4–7 | Cell bars frontage, chains, bone piles, one door |
| East treasury | Columns 9–12, rows 4–7 | Gold piles, sarcophagus, cauldron, four pillars |
| North sanctum | Columns 4–9, rows 1–3 | Altar with candles, crystal clusters, exit stairs northeast |
| Flooded south strip | Columns 1–4 and 9–12, row 8 | Wooden walkway over water, mushrooms, moss |

## Palette contract (from the anchor image)

- Stone: deep slate shadows `#2a3547`, mid blue-gray blocks `#4a5d75`, pale worn tops `#7a8ba0`
- Floor: cool gray tiles with a wet sheen, darker grout lines
- Light: warm orange torch flame `#ff9a3c` (emissive) — the only warm accent besides gold
- Secondaries: moss and crystal teal-green `#3fae9a`, gold `#f4c542`, wood brown `#8a5a35`
- Mood: cool dark base, small warm pools of light. Squint test: torches must be the brightest
  and warmest points on the map.

## Rules carried over from the hamlet

- Units are meters, +Y up, assets face +Z, ground at y = 0, tiles flush at y = 0.08.
- One body per material (stone, wood, iron, moss, crystal, flame).
- Emissive bodies for flame, crystals, and magic runes; metalness on iron, roughness on stone.
- Reuse existing assets where they fit: `barrel`, `treasure-chest`. Do not rebuild them.
