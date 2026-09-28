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
