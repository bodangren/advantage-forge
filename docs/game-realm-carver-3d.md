# Realm Carver 3D and 2D

Realm Carver is the rewrite of the legacy sentence game of the same name. The legacy game is a
territory game: the player draws loops on a 12 x 12 board to capture word beacons in order, while
monsters cross the board and three hit points run out. This version keeps the identity (draw a
loop, claim land, capture the right word, avoid monsters) and applies the owner rules.

## Owner rules applied

- No timer decides a result and there is no game over. A setback costs courage; at zero courage
  the team rests, courage is full again, and the carver starts over.
- Speed never gives XP. One evidence item per realm (one story sentence).
- All text comes from the catalog `realmCarver` (`strings.en.ts`).

## Loop

1. A realm shows one sentence (3 to 7 words). The board is 12 x 12 cells: the outer ring is safe
   claimed land, the inside is wild. The next word and up to three words after it stand on glowing
   beacons in the wild, each in its own row and column.
2. The carver walks one cell per 150 ms (joystick or WASD). Leaving claimed land draws a trail;
   the carver cannot cross its own trail. Walking back onto claimed land closes the loop.
3. A closed loop claims the trail and every part of the wild that no monster can reach.
   Carving the beacon of the next word wins it. A beacon with the same word also counts.
   Other beacons that the loop claims in the same turn return to the wild with no cost.
   Carving only other words is a miss: one reading attempt, one courage, the words return.
4. Monsters (slime, goblin, bandit) bounce on the diagonal over the wild. A monster on the trail
   (or the carver stepping into a monster) fades the trail, sends the carver back to the border
   cell where it left, and costs one courage. A setback is never a reading error.
5. When little wild is left (under 30 cells) it grows back. After the last word the realm is
   carved. Up to 4 realms per campaign; the last one ends the game.

## Tuning (`TUNING` in `core/sim.ts`)

Courage 3. Monsters: 1, 2, 2, 3 by realm (Helper mode 1, 1, 2, 2). Monster step 280 ms, 15 ms
faster per realm (at least 190 ms), 90 ms slower in Helper mode. Setback pause 500 ms. Helper mode
also rings the next beacon and marks the next word in the sentence bar.

## Files

- `core/`: types, content (sentences of 3 to 7 words), sim (`createRealmCarver`), evidence.
- `qc/bot.ts`: the QC bot (a cut through the beacon, forecast of the monsters). Call it at least
  every 150 ms. `view/`: three.js realm and HUD. `view2d/`: Phaser view and drawn ground.
- Tests: `tests/games/realm-carver/`.

## Evidence and score

One `sentence` item per realm the student started. `attempts` = misses + 1, `correctFirstTry` =
cleared with no miss, `solved` = cleared. Score = 10 per carved word plus 50 per cleared realm.

## Models

3D: `forest-ground`, `grass-ground`, `fence`, trees, bush, boulder, rock cluster, wildflowers,
mushroom cluster; monsters `slime`, `goblin-warrior`, `bandit`; the student's hero. Claimed land
and the trail are one colored plane per cell. 2D: `primary-chibi-2d` sprites over a drawn board
(`view2d/ground.ts`), so no bake is needed.
