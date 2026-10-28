# Storytime and Chibi Sprouts settings list

## Purpose

This list names the settings that the Storytime picture books and the Chibi Sprouts song videos
share as backgrounds. The background mockups come later, from this list.

- Date: 2026-10-28
- Owner: Daniel
- Due: 2026-10-30
- Rating: Rated G
- PM item: A-25

## Rules for every mockup

1. The mockup shows no character, no face, and no toy figure.
2. The mockup matches the Forge 3D cast renders: chibi scale, soft and bright colors, rounded
   shapes, and clean light.
3. The mockup shows no workbook page and no app screen.
4. The mockup shows no royal image. A school notice board holds student drawings instead.

## Settings

| Rank | Setting | Look | Light | Existing Forge 3D map | Level 2 Unit 1 use (weeks) |
| --- | --- | --- | --- | --- | --- |
| 1 | Park with a pond and a tree | Round grass mounds, one wide tree with a soft green crown, a small oval pond with pale blue water, a low wooden bench | Mid-morning, sun from the front left, warm white light, soft short shadows | `scenes/maps/meadow.ts` (closest) | 2 and 5 |
| 2 | Home living room | Rounded sofa in soft green, low wood table, small rug, framed pictures, a window, a plant in a pot | Late morning, sun through the window from the left, warm light, one soft patch on the floor | none | 4, 5, and 7 |
| 3 | Bright Thai primary classroom | White or pastel walls, wood desks in rows, full bookshelves, a whiteboard, louvre windows, ceiling fans, a Thai flag, a notice board with student drawings | Morning, sun through the louvre windows from the left, bright white light, soft shadows | `scenes/maps/classroom.ts` | 1, 3, 6, and 7 |
| 4 | Garden | Low garden beds with rows of green seedlings, a water jar, a small shed, a low fence, a fruit tree | Early morning, sun from the right, soft warm light, long soft shadows | none | 1 (week 4 also shows a garden) |
| 5 | Playground | A slide in yellow and red, two swings, a sandbox, a ladder, a soft blue rubber floor | Midday, sun high from the front, clear light, short shadows | none | 2 |
| 6 | Small shop (Thai corner shop) | Wood shelves with jars and packets, a counter with a scale, crates of fruit, a hanging bulb, a blue curtain | Morning, sun from the open door, warm light, one bright band on the floor | `scenes/maps/general-store.ts` (closest) | none in Unit 1 |
| 7 | Farm | Green rice paddy rows, a raised wooden farmhouse on stilts, a hay stack, a low wooden fence, a water buffalo | Late afternoon, sun from the left, warm golden light, long soft shadows | `scenes/maps/mill.ts` (closest) | none in Unit 1 |
| 8 | Meadow with a pond | Tall soft grass, a low wooden fence, one small tree, an oval pond with pale blue water, yellow wildflowers | Mid-morning, sun from the front left, warm white light, soft short shadows | `scenes/maps/grassland.ts` (closest) | 6 |
| 9 | Kitchen | Wood counter, a stove, a round window, a rice cooker, a fruit basket, hanging pots, checked floor tiles | Midday, sun through the round window, warm light, one soft round patch on the counter | `scenes/maps/bakery.ts` (closest) | 3 and 6 (prompts only) |
| 10 | Bedroom | A low bed with a soft blue blanket, a small shelf with books, a toy box, a window with light curtains, a rug | Early evening, sun through the window, warm dim light, long soft shadows | `scenes/maps/inn.ts` (closest) | none in Unit 1 |
| 11 | School yard | A basketball court with painted lines, a flagpole with the Thai flag, a running track, a bench, trees | Mid-morning, sun high from the front, bright light, short shadows | none | none in Unit 1 |
| 12 | Market | Cloth stalls in red, blue, and yellow, fruit crates, a hanging scale, wicker baskets, paper lanterns, a well | Early morning, sun from the left, warm light, soft shadows | `scenes/maps/market-square.ts` (closest) | none in Unit 1 |

The map rules: `none` means no Forge map fits the setting. A map marked (closest) gives the nearest Forge scene. The mockup need not copy that map.

The street with houses waits for a second batch. Its closest map is `scenes/maps/town.ts`.

## Classroom count

The scene picture count for Workbooks, Level 2 Unit 1:

| Group | Count | Weeks |
| --- | --- | --- |
| Classroom | 5 | Week 1 once, week 3 twice, week 6 once, week 7 once |
| Home living room | 4 | Week 4 twice, week 5 once, week 7 once |
| Outdoors | 5 | Garden in week 1, park in weeks 2 and 5, playground in week 2, meadow with a pond in week 6 |

The Forge facts:

- Nine of the 16 Storytime week 1 sample pages show the 3D classroom. They are the "Hello!" pages
  1 to 8 and the "Nan Can Nod" page 6.
- Twelve song videos use the 3D classroom map.
- Commit `e4e5c593` gave the classroom map a full bookcase.
- The render `out/chibi-sprouts/r1/week1/scenes/classroom-v2.png` waits for Daniel's look.

## Mockup batch

This section holds the plan for the first batch. The batch covers 6 places:

- Ranks 1 to 3: park with a pond and a tree, home living room, bright Thai primary classroom.
- Three more: garden, playground, and small shop. The farm waits for the next batch.

Each place gets 2 to 3 candidates. The MiniMax image tool makes them under the quota rules:

- The batch uses the MiniMax `general` pool that `mmx quota show` reports.
- Read `mmx quota show` and `ra-quota` before each batch.
- Start a batch only when more than 30 % of the 5-hour window is left.
- Stop when the 5-hour use passes 70 %.
- Run a large batch only after 22:00 ICT, with a cap per batch.
- One paid call runs at a time. The batch makes no video call.

The PNG files stay out of git until Daniel accepts them.
