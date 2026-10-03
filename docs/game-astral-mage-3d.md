# Astral Mage 3D and 2D

Astral Mage is the rewrite of the legacy sentence game of the same name. The legacy game
(`packages/game-cartridges/src/astral-mage.ts`) shows word crystals and one decoy crystal. The student
shoots the crystals in sentence order; a wrong shot only counts an attempt. This version keeps that
rule set and adds a seeded drift, a homing bolt, and the shared dual-renderer shape.

## Owner rules applied

- No timer decides a result and there is no game over. A wrong bolt dims one crystal for 1.5 s.
- Speed never gives XP. One evidence item per story sentence (ritual).
- All text comes from the catalog `astralMage` (`strings.en.ts`).

## Loop

1. A ritual shows one sentence as blanks. A crystal floats for each word, and one echo crystal holds a word that is not in the sentence.
2. The student taps the crystal of the next word (or aims with the arrow keys and casts with Space or Enter).
3. A bolt flies from the mage and homes on the crystal. One bolt at a time.
4. The right crystal shatters and fills the sentence. Another crystal (or the echo) dims for 1.5 s and counts one reading attempt. A repeated word is the same word: either crystal of it is right.
5. A full sentence clears the ritual. Up to 5 rituals per casting; the last one ends the game.

## Files

- `core/`: types, content (sentences of 3 to 8 words, echo word), sim (`createAstralMage`), evidence.
- `qc/bot.ts`: the QC bot (`nextCast`). `view/`: three.js circle and HUD. `view2d/`: Phaser view and drawn ground.
- Tests: `tests/games/astral-mage/`.

## Evidence and score

One `sentence` item per ritual the student started. `attempts` = fizzled bolts + 1,
`correctFirstTry` = cleared with no fizzle, `solved` = cleared. Score = 10 per struck word plus 50 per
cleared ritual (the game's own number, not an XP rule).

## Models

3D: packs `heroes`, `potion-shop`, `outdoor-props`, `flight-land` (crystal-cluster, candle-cluster,
lantern, dirt-ground, boulder, rock-cluster, dead-tree, pine-tree, mushroom-cluster; the chosen hero is
the mage). 2D: `primary-chibi-2d` hero sprites; the crystals, the bolt, and the circle are drawn
(`view2d/ground.ts`), so no bake is needed.
