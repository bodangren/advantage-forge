# Alchemist's Synthesis 3D and 2D

Alchemist's Synthesis is the rewrite of the legacy vocabulary game of the same name. The legacy game
(`packages/game-cartridges/src/alchemists-synthesis.ts`) shows the meaning of one word and four English
terms. The student picks the term that matches; a wrong pick only counts an attempt, and a 60 s timer ends
the session in defeat. This version keeps the choice rule and the score of 100 per right answer. It removes
the timer and the defeat, and adds the lab, the pour, and the shared dual-renderer shape.

## Owner rules applied

- No timer decides a result and there is no game over. A wrong jar dims for 1.5 s.
- Speed never gives XP. One evidence item per story word (formula).
- All text comes from the catalog `alchemistsSynthesis` (`strings.en.ts`). The meaning is HTML text in 3D, so Thai works.

## Loop

1. A recipe card shows the meaning of one story word. Four jars stand on pedestals, each with an English term and an ingredient model.
2. The student taps the jar with the matching term (or moves with the arrow keys and presses Space or Enter).
3. The right jar flies into the cauldron and pours for 0.9 s. The cauldron color and glow grow with every brewed formula. Input waits during the pour.
4. A wrong jar dims for 1.5 s and counts one reading attempt. The formula stays, and the student tries another jar.
5. Up to 10 formulas per synthesis. The last pour completes the game.

## Rules (section 4)

- Words: `StoryInput.vocabulary` (or an APK `VocabularyInput`, ids `w-1`, ...). Words with an empty term or meaning are skipped. The order is seeded.
- Jars: the right term plus up to three decoy terms from other words, distinct from the right term and from each other (case-insensitive). With fewer distinct terms the bench has fewer jars. The place of the right jar and the ingredient kinds are seeded.
- Helper mode lights the right jar.

## Evidence and score (section 5)

One `word` item per formula the student chose a jar for. `attempts` = jars chosen, `correctFirstTry` = the first jar was right,
`solved` = the right jar was poured. Score = 100 per right jar (the legacy number, the game's own score and not an XP rule).

## Files

- `core/`: types, content (formulas and jars), sim (`createAlchemistsSynthesis`), evidence.
- `qc/bot.ts`: the QC bot (`nextChoice`). `view/`: three.js lab (`lab.ts`, scene models in `LAB_MODELS`) and HTML HUD. `view2d/`: Phaser view and drawn lab floor.
- Tests: `tests/games/alchemists-synthesis/`.

## Models

3D: packs `heroes`, `potion-shop` (the lab, the cauldron, and the six ingredient models; the chosen hero is the alchemist). 2D: `primary-chibi-2d`
hero sprites plus `prop.cauldron` and the six `prop.*` ingredients; the floor, walls, and pedestals are drawn (`view2d/ground.ts`), so no bake is needed.
