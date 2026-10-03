# Rune Forge Chamber 3D and 2D

Rune Forge Chamber is the rewrite of the legacy sentence game of the same name. The legacy game
(`packages/game-cartridges/src/rune-forge-chamber.ts`) shows the translation of a sentence. Runes with
the words of the sentence orbit a forge, and the student picks them in order. A wrong rune costs 15 of 100
forge health, a 12 s timer runs per sentence, and zero health or zero time ends the session in defeat. This
version keeps the order rule, the orbit, the four-rune waves, and the score of 100 per word. It removes
health, the timer, and the defeat.

## Owner rules applied

- No timer decides a result and there is no game over. A wrong rune dims for 1.5 s.
- Speed never gives XP. One evidence item per story sentence (blade).
- All text comes from the catalog `runeForgeChamber` (`strings.en.ts`). The sentence bar is HTML, so Thai works.

## Loop

1. A blade lies on the anvil. The sentence shows as blanks at the top; up to four word runes orbit the anvil (0.5 rad/s, the legacy speed).
2. The student taps the rune with the next word (or moves with the arrow keys and presses Space or Enter).
3. The right rune flies into the blade. The blade grows and heats. Input waits 0.8 s, then the next wave of runes comes.
4. A wrong rune dims for 1.5 s and counts one reading attempt. The wave stays.
5. Up to 5 blades per forge. The last word of the last sentence completes the game.

## Rules (section 4)

- Sentences: `StoryInput.sentences` (or an APK `SentenceInput`, ids `s-1`, ...). Sentences of 3 to 8 words are preferred; the order is seeded.
- Wave: the next word plus up to three other distinct words of the same sentence (the legacy rule), in seeded orbit places. A repeated word is one rune, and any rune of an equal word (case and edge punctuation ignored) is right.
- Helper mode lights the right rune.

## Evidence and score (section 5)

One `sentence` item per blade the student chose a rune for. `attempts` = wrong runes + 1, `correctFirstTry` = no wrong rune,
`solved` = the sentence is forged. Score = 100 per forged word (the legacy number, the game's own score and not an XP rule).

## Files

- `core/`: types, content (blades and waves), sim (`createRuneForgeChamber`), evidence.
- `qc/bot.ts`: the QC bot (`nextChoice`). `view/`: three.js forge (`forge.ts`, scene models in `FORGE_MODELS`) and HTML HUD. `view2d/`: Phaser view and drawn forge.
- Tests: `tests/games/rune-forge-chamber/`.

## Models

3D: packs `heroes`, `potion-shop` (the forge room, the anvil, the crystal rune; the chosen hero is the smith). 2D: `primary-chibi-2d`
hero sprites plus `prop.crystal-cluster`; the floor, walls, furnace, and anvil are drawn (`view2d/ground.ts`), so no bake is needed.
