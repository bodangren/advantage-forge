# Sorcerer's Ziggurat 3D and 2D

Sorcerer's Ziggurat is the rewrite of the legacy sentence game of the same name
(`packages/game-cartridges/src/sorcerer-ziggurat.ts`). In the legacy game the student climbs
adjacent rune cubes (left, forward, right) and picks the cube that holds the next word of a
sentence. This version keeps that rule set and adds the shared dual-renderer shape. It is turn
based: the core decides each answer at once, and the views play the events.

## Owner rules applied

- No timer decides a result and there is no game over. A crumbled cube costs one courage; at 0 the
  team rests (full courage, the crumbled cubes of the tier return) and keeps its place.
- Speed never gives XP. One evidence item per sentence (the story item of a sentence game).
- All text comes from the catalog `sorcererZiggurat` (`strings.en.ts`). The Thai translation of the
  sentence is HTML text (3D) or a Phaser text (2D).

## Loop

1. A ritual is one sentence (3 to 8 words preferred, up to 5 rituals per climb, in a seeded order).
   The blanks at the top show the sentence; the translation sits under them.
2. Each tier offers the right word and up to 2 decoys on seeded lanes (left, forward, right). Decoys
   are words of the same sentence or of other sentences; never the right word, never a repeat.
3. The right cube lifts the hero one tier and offers the next word. A wrong cube crumbles, counts one
   reading attempt, and costs one courage.
4. After the last word the hero hops onto the summit, the crystal lights, and the next ritual starts at the foot.
5. Input: tap a cube tag, or press the arrows or A, W, D (left, forward, right).

## Files

- `core/`: types, content (rituals, cubes, decoys), sim (`createSorcererZiggurat`, `openingEvents`), evidence.
- `qc/bot.ts`: the QC bot (`nextStep`). `view/`: three.js ziggurat (`ziggurat.ts`), HUD, game. `view2d/`: Phaser view and drawn ground.
- Tests: `tests/games/sorcerer-ziggurat/`.

## Evidence and score

One `sentence` item per ritual the student touched. `attempts` = crumbled cubes + 1, `correctFirstTry` =
cleared with none, `solved` = cleared. Score = 100 per tier climbed (the legacy number).

## Models

3D (`ZIGGURAT_MODELS` in `view/ziggurat.ts` plus the heroes): floor, floor-cracked, pillar, brazier,
altar (sunken-vault pieces), candle-cluster, crystal-cluster (potion-shop). Packs `heroes`, `potion-shop`,
`sunken-vault`. The cubes are code-built stone columns topped with a floor tile. 2D: `primary-chibi-2d`
hero sprites (idle, run, hit, victory); the ziggurat is drawn, so no bake is needed.
