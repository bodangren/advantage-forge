# Village Guardian 3D and 2D

Village Guardian is the rewrite of the legacy sentence game of the same name. The legacy game
has a knight who collects word-villagers in sentence order while bandits, goblins, or dragons
chase, with a countdown and three lives. This version keeps the identity: a guardian calls the
villagers in order, the line follows, threats scare the line, and the barn is the sanctuary.

## Owner rules applied

- No timer decides a result and there is no game over. A setback sends the line home to rest.
- Speed never gives XP. One evidence item per village (one story sentence).
- All text comes from the catalog `villageGuardian` (`strings.en.ts`).

## Loop

1. The village shows one sentence. Each word stands on a villager on the green.
2. The guardian walks (joystick or WASD) to the villager of the next word. The villager joins the line.
3. A villager called out of order hides for 1.5 s. This counts one reading attempt.
4. Bandits patrol and bounce off the fences. From the third village one goblin also creeps toward
   a near guardian (it turns 3% per step, at the same speed). A threat on the line scares it from
   that villager on. A threat on the guardian pushes it back for 0.8 s, scares the whole line,
   and sends that threat to rest for 2.5 s. A scare is never a reading error.
5. When the whole sentence follows, the barn door glows and threats keep off. The village is saved
   at the door. Up to 5 villages per watch; the last one ends the game.

## Files

- `core/`: types, content (sentences of 3 to 7 words), sim (`createVillageGuardian`), evidence.
- `qc/bot.ts`: the QC bot. `view/`: three.js village and HUD. `view2d/`: Phaser view and drawn ground.
- Tests: `tests/games/village-guardian/`.

## Evidence and score

One `sentence` item per village the student started. `attempts` = hide-calls + 1,
`correctFirstTry` = saved with no hide-call, `solved` = saved. Score = 10 per villager called
plus 50 per saved village (the game's own number, not an XP rule).

## Models

3D: packs `heroes`, `folk`, `outdoor-props`, `flight-land` (barn, cottage, well, fence,
farm-field, hay-bale, trees, grass-ground, bush, wildflowers, rock-cluster; villager, farmer,
innkeeper, druid, guard; bandit, goblin-warrior). 2D: `primary-chibi-2d` sprites. The ground is
drawn at start with a canvas texture (`view2d/ground.ts`), so no bake is needed.
