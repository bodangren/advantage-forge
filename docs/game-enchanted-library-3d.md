# Enchanted Library 3D and 2D

Enchanted Library is the rewrite of the legacy vocabulary game of the same name
(`packages/game-cartridges/src/enchanted-library.ts`). In the legacy game the student walks a hall,
collects the book whose English word matches the Thai prompt, and dodges spirits with a shield. This
version keeps that rule set and adds the shared dual-renderer shape. It is a different game from
Haunted Library (sentence doors on four floors): here the hall is one flat room and the items are words.

## Owner rules applied

- No timer decides a result and there is no game over. The legacy 180 s countdown and the mana defeat are gone.
  A wrong book or a spirit costs one courage; at 0 the team rests, returns to the middle, and keeps its place.
- Speed never gives XP (the legacy speed bonus is gone). One evidence item per vocabulary word.
- All text comes from the catalog `enchantedLibrary` (`strings.en.ts`). The Thai prompt is HTML text (3D) or a Phaser text (2D).

## Loop

1. A round shows a Thai word and 4 books (the right one and 3 decoys) with English words on their tags.
2. The student walks (joystick, arrows, WASD, or a tap on a book) into the book with the matching word.
3. The right book clears the round, gives one shield charge back (max 3), and starts the next round at once.
4. A wrong book is spent and counts one reading attempt and one lost courage.
5. Spirits come every 6 s (first after 4 s), up to 3 (2 with the helper). A spirit that touches the hero costs
   courage and knocks it back; the shield (Space or the button, 1.8 s) turns spirits away. Up to 8 rounds per visit.

## Files

- `core/`: types, content (words, decoys), sim (`createEnchantedLibrary`), evidence.
- `qc/bot.ts`: the QC bot (`nextCommand`). `view/`: three.js hall and HUD. `view2d/`: Phaser view and drawn ground.
- Tests: `tests/games/enchanted-library/`.

## Evidence and score

One `word` item per round the student touched. `attempts` = wrong books + 1, `correctFirstTry` = cleared with no
wrong book, `solved` = cleared. Spirits never count. Score = 100 per right book (the legacy number).

## Models

3D (`HALL_MODELS` in `view/hall.ts` plus the heroes): wood-floor, plaster-wall, plaster-wall-window, shelf,
candle-cluster, chandelier, lantern, skeleton (the spirits, drawn see-through). Packs `heroes`, `dungeon-monsters`,
`potion-shop`. The books are built in code. 2D: `primary-chibi-2d` hero and skeleton sprites; the hall and the
books are drawn (`view2d/ground.ts`), so no bake is needed.
