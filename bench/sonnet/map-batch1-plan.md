# P2 map batch 1 (plan, 2026-10-02)

Goal: 12 accepted P2 maps in one overnight run. Floor: 8. Bar: 7.0 (P2).
Source: `docs/fantasy-world-scene-blueprints.tsv` (94 rows at `mockup-needed`).

## Selection rule

Pick maps that a Phase D game needs as a stage or a 2D background. Mix easy and hard maps.
Prefer maps that reuse the pieces of the six accepted maps.

| # | Row | Game demand | Reuse from accepted maps |
| ---: | --- | --- | --- |
| 1 | civic/library | enchanted-library, haunted-library | bookshelf, tavern-interior walls |
| 2 | adventure/alchemy-lab | alchemists-synthesis | blacksmith-shop tables, vials |
| 3 | adventure/wizard-tower | sorcerer-ziggurat, storm-castle-tower | stone-wall, stairs |
| 4 | adventure/arcane-sanctum | rune-forge-chamber, rune-match backdrop | sunken-vault floor |
| 5 | adventure/crypt | shadow-gate-dungeon | sunken-vault |
| 6 | adventure/crystal-cave | abyssal-well | giant-crystal, cave tiles |
| 7 | adventure/labyrinth | labyrinth-goblin-king (3D and 2D stage) | hedge or stone wall tiles |
| 8 | adventure/boss-arena | rpg-battle, paladins-twin-soul | sunken-vault |
| 9 | adventure/goblin-camp | archers-revenge, castle-defense | old-oak-clearing |
| 10 | adventure/gatehouse | castle-defense | city-wall, village |
| 11 | wilderness/grassland | realm-carver, flight family ground | village ground tiles |
| 12 | wilderness/mountain-pass | gryphon-patrol, griffin-riders-escape | cliff-face |

Reserve (use when a row stalls): civic/market-square, civic/inn, wilderness/coast, adventure/cave.

## Pipeline per map (orchestrator owns steps 1-3, 5-7)

1. Mockup: one `mmx` image to `docs/<group>-mockups/`. The orchestrator checks it by eye.
2. Brief: `bench/sonnet/briefs/map-<row>.md` with mockup path, reuse list, scale, palette, lights, piece cap.
3. Piece audit: list the missing props. Queue each as a `forge-sonnet-low` job (one prop each).
4. Build: one `forge-sonnet-medium` agent per map. Output: `scripts/design-<row>.mjs` and `scenes/<row>.ts`.
5. Shots: `node scripts/shoot-map.mjs <outdir> name=query ...`. Score against the mockup.
6. Feedback: one pass. A second pass only if the score is below 7.0.
7. Accept: set the blueprint row to `accepted`, add the row to `bench/sonnet/log.tsv`.

## Run rules

- Subagents never run git. The orchestrator commits with explicit paths after each accepted map.
- Run 3 agents at the same time. The build-slot lock allows 2 builds, so extra agents wait.
- Run long queues detached (`setsid nohup`), because background tasks stop at 2 hours.
- Do not edit a script that a run uses. Write `.next` and `mv`.
- A map that stays below 7.0 after the feedback passes goes to the reserve list. Do not block the queue.
- Missing props: an agent records them and does not build them in the map task.

## Order

Start with the five maps with the most reuse (1, 2, 5, 8, 11). They prove the pipeline and give a cost per map.
Then run 3, 4, 6, 7, 9, 10, 12.

## Check at the end

- Count of accepted rows against the goal of 12.
- Token cost per map from `bench/sonnet/log.tsv`. Use it to plan batch 2.
- One 2D bake test for the map of a game that uses it (castle-defense or labyrinth).

## Castle Defense levels (tower defense; added 2026-10-02)

Castle Defense is a tower defense: the player collects words, forms a sentence in order, and places a new tower against a horde.
The tracker lists it in the "aim and shoot" family. That label is wrong and the docs need a fix when the game starts.

A level map is a layout plus a theme, not a full scene.

- Layout file per level: the enemy path, the build slots, the spawn point, the goal, and the word pick-up spots.
  The rules core and the map art both read this file.
- Camera: one top-down view of the whole path. The 2D background is baked from the same view.
- Art: reuse ground tiles and props from accepted maps. New pieces: path tiles and slot markers.
- Setbacks: a breach costs courage, not the game. The map needs a rest point near the goal.

Assumption (not confirmed): 6 levels, one per theme, in this order of difficulty.

| Level | Theme | Row to reuse |
| ---: | --- | --- |
| 1 | grassland, one bend | wilderness/grassland (batch 1, #11) |
| 2 | gatehouse and outer wall | adventure/gatehouse (batch 1, #10) |
| 3 | mountain pass | wilderness/mountain-pass (batch 1, #12) |
| 4 | goblin camp | adventure/goblin-camp (batch 1, #9) |
| 5 | marsh | wilderness/swamp or marsh (new) |
| 6 | castle keep under siege | civic/castle (new) |

Run TD levels in batch 2, after batch 1 gives a cost per map.
Build level 1 first to prove the layout file and the camera.
