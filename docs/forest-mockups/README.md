# Forest mockup: the Old Oak Clearing

[forest-quest_001.jpg](./forest-quest_001.jpg) is the style anchor and layout
reference for the forest environment (wilderness P0). The
[component list](./components.tsv) defines the source assets to build; six are
new, the rest are reused from the hamlet set.

## Shared layout

The view is an orthographic, three-quarter map. North is at the top. A dirt
trail enters at the west edge, passes the ancient oak, and exits at the south
edge. A stream runs down the west edge and bends south; the trail crosses it on
stepping stones. Dense trees and brambles frame the site.

Use a 12-column by 8-row planning grid, column 1 at the west, row 1 at the
north. These coordinates describe zones, not exact engine positions.

| Zone | Grid area | Content |
|---|---|---|
| North border | row 1 | Oak and pine rows, brambles in the gaps |
| West + east + south borders | column 1, column 12, row 8 | Dense trees, brambles, boulders |
| Clearing center | columns 4–9, rows 2–6 | One ancient oak (c6–7, r2–3), one campfire (c6, r6), grass, wildflowers |
| Trail | c1 r4 → c5 r4 → c7 r6 → c7 r8 | Dirt road parts; crosses the stream at c2, r5 |
| Stream | columns 1–2, rows 5–8, bending south | River parts, banks, stepping stones at the crossing |
| Stump knoll | columns 9–10, rows 3–4 | One hollow stump, ferns, boulders |
| Log rest | column 11, rows 5–6 | One fallen log |

The layout contains **one ancient oak, one campfire, one hollow stump, one
fallen log**, plus repeated trees, brambles, ferns, boulders, wildflowers,
trail, and stream parts.

## Art direction (forest treatment of Chibi Quest)

Rounded chunky forms, soft bevels, silhouettes that read at 128 px. The forest
is the bright outdoor counterpart of the dungeon: a sunny green world with one
warm fire accent. Palette contract:

- Grass: sunny leaf green `#7ec850`, shaded green `#4a8a3f`.
- Canopy: leaf green `#5cb85c`, deep green `#3f9248`.
- Bark and wood: warm brown `#8a5a35`, dark bark `#5f3d22`, pale cut wood `#c9a06a`.
- Dirt trail: warm tan `#c8a86b`.
- Stones: cool gray `#8a94a0`.
- Water: stream teal-blue `#3fa8c8`.
- Ferns and brambles: deep greens `#2f7a3f` and `#4a9a4f`.
- Fire: flame and ember emissive `#ff9a3c` — the same warm accent contract as
  the dungeon kit. The campfire is the brightest, warmest point of the map.

## Production use

1. Build the six new component IDs from `components.tsv`.
2. Reuse the hamlet assets for all other instances.
3. Assemble the sample scene from the generated GLBs.
4. Compare the assembled scene with the mockup.
