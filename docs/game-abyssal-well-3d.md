# Abyssal Well 3D and 2D

Abyssal Well is the rewrite of the legacy radial sentence shooter of the same name
(`packages/game-cartridges/src/abyssal-well.ts` in the monorepo). In the legacy game, word enemies climb
eight lanes of a well on a timer, the student rotates around the rim and shoots them in sentence order,
and three rim breaches end the game. This version keeps the eight lanes, the rim, the climbing enemies,
the sentence order, and the decoy. It removes the timer and the game over.

## Owner rules applied

- No timer decides a result and there is no game over. A wrong arrow costs courage; at 0 the team rests back to 3.
- Speed never gives XP. One evidence item per story sentence (descent).
- All text comes from the catalog `abyssalWell` (`strings.en.ts`). Words are HTML tags in 3D (Thai works).

## Loop

1. A descent shows one sentence as blanks (and its translation). Eight lanes run from the bottom of the well to the rim.
2. The next three words climb the lanes as creatures (goblin, skeleton, slime), and one echo creature holds a word that is not in the sentence.
3. The student taps a creature (or turns with the arrow keys and shoots with Space). The archer turns to that lane and shoots.
4. The creature of the next word falls into the sentence. A repeated word is the same word: either creature of it is right.
5. A wrong creature is thrown back to the bottom, courage drops by 1, and the sentence counts a reading attempt.
6. After each shot every creature that is left climbs one step (at most to the rim). Nothing happens at the rim.
7. A full sentence clears the descent. Up to 4 descents per run; the last one ends the game.

## Files

- `core/`: types, content (sentences of 3 to 8 words, echo word), geometry (lane points), sim (`createAbyssalWell`), evidence.
- `qc/bot.ts`: the QC bot (`nextCommand`). `view/`: three.js well (`well.ts`, `WELL_MODELS`) and HUD. `view2d/`: Phaser view and drawn ground.
- Tests: `tests/games/abyssal-well/`.

## Evidence and score

One `sentence` item per descent the student started. `attempts` = bounced arrows + 1, `correctFirstTry` =
cleared with no bounce, `solved` = cleared. Score = 10 per word hit plus 50 per cleared descent.

## Models

3D: heroes (the chosen hero is the archer), creatures `goblin-warrior`, `skeleton`, `slime`, and the scene
`well`, `dirt-ground`, `boulder`, `rock-cluster`, `crystal-cluster`, `candle-cluster`, `lantern`, `dead-tree`,
`mushroom-cluster`. 2D: `primary-chibi-2d` hero and creature sprites; the well is drawn (`view2d/ground.ts`).
