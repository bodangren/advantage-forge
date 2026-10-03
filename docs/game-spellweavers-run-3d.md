# Spellweaver's Run 3D and 2D

Spellweaver's Run is the rewrite of the legacy sentence runner of the same name. The legacy game
(`game-cartridges/src/spellweavers-run.ts`) has three lanes with falling word orbs. The student
picks the lane with the next English word of a sentence (the prompt is the translation), and the
wrong orb costs nothing but a repeat. This version keeps the identity: three lanes, one orb per
lane, the words in sentence order, and decoys that come from the other words of the story.

## Owner rules applied

- No timer decides a result and there is no game over. The legacy orb falls on a clock and the
  lane at the moment of landing counts. Here the wizard waits before the orbs until the student
  chooses. A missed orb costs courage and the wizard rests and returns (as in Monster Encounters).
- Speed never gives XP. One evidence item per story sentence.
- All text comes from the catalog `spellweaversRun` (`strings.en.ts`).

## Loop

1. The prompt shows the meaning of a sentence (or "Build the sentence in order." when the story
   has no translation) and the sentence as blanks.
2. The wizard runs the road to a row of arches, 3 orbs in 3 lanes (2 in Helper mode). Each orb
   carries a word. One carries the next word of the sentence; the others carry words of the story.
3. The student taps an orb tag (or swipes, or keys A S D / arrows / 1 2 3). The wizard runs
   through that lane. A right orb fills the blank and boosts the run.
4. A wrong orb fizzles. It costs one courage (3 at the start), the wizard rests 1.6 s, and the same
   word comes back with new decoys. At 0 courage the rest is 2.6 s and all courage returns.
5. The last word casts the spell (banner, sparks) and the next sentence starts. Up to 5 sentences
   of 3 to 8 words, in a seeded order. After the last one a portal opens at the end of the road.

## Files

- `core/`: types, content (sentences, word pool, orbs), sim (`createSpellweaversRun`), evidence.
- `qc/bot.ts`: the QC bot. `view/`: three.js road and HUD. `view2d/`: Phaser view and prompt panel.
- Tests: `tests/games/spellweavers-run/`.

## Evidence and score

One `sentence` item per sentence the student chose an orb for. `attempts` = missed orbs + 1,
`correctFirstTry` = cast with no missed orb, `solved` = cast. Score = 10 per word (5 for the word
right after a miss) plus 50 per cast spell: the game's own number, not an XP rule.

## Models

3D: hero (`wizard` by default, any hero of the session), `arch`, `gate` (the portal), and the
road side props `oak-tree`, `pine-tree`, `ancient-oak`, `bush`, `fern`, `wildflowers`, `boulder`,
`rock-cluster`. Orbs, the road, and the portal disc are drawn in code. 2D: the three heroes
(`idle`, `run`, `hit`, `victory`) and the props `arch`, trees, bushes, ferns, flowers, rocks.
