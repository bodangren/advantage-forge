# Storm Castle Tower 3D and 2D

Storm Castle Tower is the rewrite of the legacy sentence game of the same name
(`packages/game-cartridges/src/storm-castle-tower.ts`). In the legacy game the student climbs a
four-column tower, collects word windows in the order of a sentence, and dodges falling oil and rocks
while three lives last. This version keeps the climb, the ordered windows, and the oil and rocks, and
adds the shared dual-renderer shape. It is a different game from Shadow Gate Dungeon (a flat room, a
chasing shadow): here the world is a vertical wall and the danger falls from above.

## Owner rules applied

- No timer decides a result and there is no game over. The three lives and the defeat are gone.
  A wrong window or a hazard costs one courage; at 0 the team rests, returns to the last open window,
  and keeps its place.
- Speed never gives XP. One evidence item per sentence (the story item).
- All text comes from the catalog `stormCastleTower` (`strings.en.ts`). The Thai gloss of the sentence is HTML text (3D)
  or a Phaser text (2D).

## Loop

1. A tower is one sentence of 3 to 7 words. The climb is up to 4 towers (fewer when the story has fewer such sentences).
2. The next ledge shows 3 windows (2 in Helper mode): the next word and other words of the story. The student climbs
   (joystick, arrows, WASD) one cell at a time into the window with the next word.
3. The right window lights and joins the sentence; the next ledge appears two rows higher. A wrong window shuts and
   counts one reading attempt and one lost courage. The climber cannot pass an unopened ledge.
4. Oil and rocks fall down one column every 1.8 s (2.6 s in Helper mode, 20% slower); a red strip warns of the column.
   A hit knocks the climber one row down (never below the last open window) and costs courage. It is not a reading error.
5. When the sentence is built, the hazards stop and the top gate opens. Reaching the top clears the tower.

## Files

- `core/`: types, content (towers, decoys), sim (`createStormCastleTower`), evidence.
- `qc/bot.ts`: the QC bot (`nextCommand`, a breadth-first search around the wrong windows that sidesteps hazards).
- `view/`: three.js tower (`tower.ts`) and game. `view2d/`: Phaser view and the drawn tower.
- Tests: `tests/games/storm-castle-tower/`.

## Evidence and score

One `sentence` item per tower the student touched. `attempts` = wrong windows + 1, `correctFirstTry` = cleared with no
wrong window, `solved` = cleared. Hazard hits never count. Score = 100 per right window (the legacy number).

## Models

3D (`TOWER_MODELS` in `view/tower.ts` plus the heroes): wall, arch (windows and the top), gate, pillar, torch-sconce,
chains, barrel (oil), boulder (rock). Packs `heroes`, `potion-shop`, `outdoor-props`, `sunken-vault`. 2D:
`primary-chibi-2d` hero sprites plus `prop.cauldron` (oil), `prop.boulder`, `prop.arch`; the tower is drawn
(`view2d/tower.ts`), so no bake is needed.
