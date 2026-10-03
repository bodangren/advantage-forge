# Castle Defense (2D and 3D): game design

Status: rewrite, 2026-10-03. Source: the monorepo cartridge
`../reading-advantage-monorepo/packages/game-cartridges/src/castle-defense.ts` (and its test)
and the matching advantage-games originals.

## 1. The game in one paragraph

Attackers gather at the gate of the castle in the Sunken Vault. Each wave is one sentence of the
story. The card shows the meaning of the sentence and the words built so far. The student taps the
next word, one word at a time. When the sentence is built, the student places its tower on a post of
the wall. The towers fire, the wave falls, and the next sentence starts.

## 2. What stays from the legacy game

| Legacy | Now |
| --- | --- |
| a wave per sentence, words collected in order | a wave per sentence, words chosen in order from a card |
| a built sentence becomes a tower in a slot | the built sentence becomes a tower on a post (3 posts, one per hero) |
| waves of 2 soldiers, 3 tanks, 4 bosses | the same cycle with the stage limits: 2 skeletons, 3 mimics, 1 fire dragon |
| hit points 100, 140, 220 and tower damage 60 | 2, 3, and 4 hits; a level-1 tower hits once per round |
| a wrong word resets the chain | a wrong word shuts and costs a castle heart (see section 3) |
| score 100 per word | coins: 10 per word, +5 per word in a row up to +25, +20 per tower |
| the tower slots recycle | building on a built post raises its level (more hits per round) |

## 3. What changes (owner rules)

- No game over and no timer. The legacy walk, the spawn timer, the march along a route, and the
  base-destroyed defeat are gone. At 0 hearts the heroes rest and the hearts return.
- A wrong word no longer resets the sentence. It shuts for this step and an attacker strikes the
  castle (-1 heart). The chain stays, so a setback never erases progress.
- The placement is a choice of post. It does not change whether the wave falls; it changes which
  hero fires and how fast the towers stack.
- Speed never gives XP. The score is coins.
- The 3D stage shows at most 3 attackers and one dragon, so the legacy 4-boss wave is one dragon.

## 4. Rules (core)

- Commands: `start`, `pick(choice)`, `build(post)`.
- Events: `waveAppeared`, `stepShown`, `picked`, `scored`, `attackerStrike`, `rest`,
  `sentenceBuilt`, `towerBuilt`, `volley`, `waveCleared`, `rejected`, `victory`.
- A run holds up to 6 sentences of 3 to 8 words, in a seeded order. The card holds 3 words (2 in
  Helper mode): the next word, other words of the same sentence first, then words of other sentences.
- A volley is one round of fire: each built tower hits the front attacker `level` times. Rounds
  repeat until the wave has fallen.
- Evidence: one `sentence` item per sentence. `attempts` = wrong words + 1; `correctFirstTry` = no
  wrong word. A sentence that was never touched makes no item.
- Bot: `qc/bot.ts` picks the right word, then builds on the post with the lowest level.

## 5. Screens

- 3D: the shared battle stage (`src/games/shared/battle`). The attackers stand in front of the
  party; a pip row over each attacker shows the hits left. The card holds the meaning, the sentence
  line (blanks for the words to find), and the word buttons; then it holds the three posts.
  A tower is shown as a burst over its keeper hero and as that hero's attack on every volley.
- 2D: Phaser `BattleStage2D`; the pips are the stage's hit pips, the words and posts are on `Card2D`.
- One event driver (`view/driver.ts`) plays the core events for both views.
