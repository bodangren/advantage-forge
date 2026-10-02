# Rune Match (2D and 3D): game design

Status: design, 2026-09-28 (Claude, FRONTEND). Phase D of `docs/apk-2d3d-program.md`. The rules
core follows section 6 (BACKEND). Source: the monorepo cartridge
`../reading-advantage-monorepo/packages/game-cartridges/src/rune-match.ts` (and the advantage-games
original).

## 1. The game in one paragraph

The three heroes face a monster in a vault chamber. Between them lies a board of glowing runes,
and each rune shows a meaning in the student's language. The word to find shows above the board.
The student swaps two neighboring runes to make a line of three (or more) runes with that word's
meaning: the line bursts, the heroes strike, and the next word comes up. A heal rune line gives
courage back; a shield rune line stops the monster's next strike.

## 2. What stays

| Rule | 2D and 3D |
| --- | --- |
| an 8 x 6 board of runes (meanings of the story words) plus heal and shield runes | the same (6 x 6 in Helper mode) |
| swap two neighboring runes; a line of 3 or more of one kind bursts; runes fall and refill; cascades | the same, seeded |
| the target word's line hits the monster; other word lines only clear | the same |
| the board always has a move that makes the target line | the same (the core places one) |
| all target words matched: victory | the same |

## 3. What changes

| Before | Now | Why |
| --- | --- | --- |
| the monster attacks every 5 s | the monster strikes only after a swap that makes no line (a wrong swap) | no speed as a condition |
| a wrong swap costs health; 0 health is a defeat | a wrong swap costs 1 courage; at 0 the team rests and comes back to 3 (as in Monster Encounters) | no game over |
| score | coins for lines and cascades; XP by the apps' rule | the same results as every game |
| a goblin | the monster changes every 4 words: skeleton, mimic, then the fire dragon for the last words | variety, reuse of the battle stage |

## 4. Screen

- 3D: the Monster Encounters battle stage (heroes, monster, attacks) in the top part; the board as
  the card in the bottom part (portrait) or the right part (landscape), drawn in HTML so the
  meanings stay crisp (Thai included). Swap by drag from one rune to its neighbor, or tap one
  rune and then a neighbor.
- 2D: the same layout in Phaser: the vault background, hero and monster sprites, the board in the
  same place.
- In Helper mode, the runes of the target meaning have a soft glow.

## 5. Models and sprites

Heroes, skeleton, mimic, dragon-fire, and the vault set: all exist (3D models and the 2D library).
Runes: kit geometry in 3D and simple shapes in 2D, in six colors, one per meaning slot.

## 6. Rules core (BACKEND)

A turn `Simulation` in `src/games/rune-match/core` (like Monster Encounters: `tick` returns []).

| Command | Meaning |
| --- | --- |
| `{ type: 'swap', a: { row, col }, b: { row, col } }` | swap two neighboring runes |

| Event | Payload |
| --- | --- |
| `targetShown` | itemId, term |
| `swapped` | a, b |
| `linesBurst` | cascade, cells, kinds (word id, 'heal', 'shield'), target: boolean |
| `runesFell` | moves `{ from, to }[]`, new runes `{ cell, rune }[]` |
| `heroStrike` | hero, damage |
| `monsterStrike` | blocked: boolean, courage |
| `rest` | courage |
| `monsterDefeated` / `monsterAppeared` | kind |
| `swapRejected` | a, b (not neighbors: nothing happens) |
| `victory` | |

State: `board` (rows x cols of `{ id, kind: 'word' | 'heal' | 'shield', wordId?, text? }`),
`target` (itemId, term), `targetIndex`, `targetCount`, `monster` (kind, hp, maxHp), `courage`,
`shield`, `coins`, `phase`.

Evidence: one item per target word (`itemKind: 'word'`); attempts = swaps while that word was the
target (a swap that makes any line counts as a try; the target line is the correct one);
`correctFirstTry` = the first line made was the target's line.

### 6.1 Decisions of the core (BACKEND, 2026-09-28)

The core is `src/games/rune-match/core/` (`createRuneMatch(story, { seed, helper })`); the QC bot
is `src/games/rune-match/qc/bot.ts` (`nextSwap(state)`). It also accepts the APK `VocabularyInput`.
Points the design left open, as built:

- Board: 8 rows of 6 runes (6 rows of 6 in Helper mode); row 0 is the top, new runes enter there.
- Palette: the target plus 5 decoy meanings (3 in Helper mode) in `state.palette`, the target
  first. A new target that is not in the palette takes the slot of the old target. Runes of a
  word no longer in the palette stay until they burst (old runes). 12% of new runes are heal or
  shield runes.
- Monsters: the skeleton guards the first 4 target words, the mimic the next 4, the fire dragon
  every word after that. A monster's HP is the number of words it guards; every target line is one
  `heroStrike` of damage 1 by the next hero in the order knight, wizard, cleric.
- Coins: 10 per rune of a line, times the cascade number plus one (30 for a first line of 3, 60 for
  a line of 3 in the first cascade). `linesBurst` carries the `coins` of the step.
- Courage: 5 at the start; a wrong swap costs 1; at 0 the team rests back to 3. A heal line gives
  1 courage back (`heal` event); a shield line raises one shield (`shield` event) that blocks the
  next strike. Two events added for the view: `heal { courage }` and `shield`.
- Command added: `{ type: 'start' }` once, when the stage is ready: it replays `monsterAppeared`
  and `targetShown` for the first monster and word (a second `start` returns []).
- A wrong swap emits `swapped` twice (there and back), then `monsterStrike` and maybe `rest`.
- The guaranteed target move: when no swap makes the target's line, the core writes three target
  runes (two in a row and one beside the gap) and emits `runesFell` with `moves: []` and the
  placed runes. In a 13-word story this happens after about 70% of the swaps: the view needs a
  glow-in for placed runes. A line made by a cascade for the current target counts as a correct
  first try when the word had no attempt yet.
- Evidence items: only target words with at least one line-making swap (a word never tried is not
  an item). `resultsOf` returns `victory` when every word was matched, else `complete`.

### 6.2 Views (2026-10-02)

Both views share one event player, `src/games/rune-match/view/driver.ts`. It reads the events of
each swap in order and calls a `Presentation` (board, stage, HUD). The 3D view
(`view/game.ts`, `view/hud.ts`) uses the Monster Encounters battle stage and the HTML `Board` in the
kit card. The 2D view (`view2d/game.ts`) uses `BattleStage2D` and `Board2D`, with the baked hall
of Monster Encounters. Rune colors come from the word id and stay stable when the palette changes;
heal and shield runes use ❤ and 🛡. A guaranteed move (`runesFell` with no moves) redraws the
settled board. The cartridge is in the host registry. Tests: `tests/games/rune-match/driver.test.ts`.
