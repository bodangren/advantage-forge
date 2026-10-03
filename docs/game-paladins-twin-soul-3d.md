# Paladin's Twin Soul (2D and 3D): game design

Status: rewrite, 2026-10-03. Sources: the legacy files `paladinsTwinSoul*.ts` and the monorepo
cartridge `paladins-twin-soul.ts`. Family: battle (shared stage in `src/games/shared/battle`).

## 1. The legacy game

A space shooter. A formation of shades hangs above the paladin. A boss shade dives, captures the
paladin, and shows the target word. The paladin shoots the shade that holds the matching term and
frees the twin soul, which then fires beside the paladin. Hits by diving shades cost health;
zero health is a defeat. XP had a speed bonus.

## 2. What stays

- The twin soul: a shade holds the soul of one word, and the student frees it.
- A formation of shades that carry English terms. The meaning (translation) is the clue.
- One wave per target word; every word once; all souls free is the win.
- 100 points per freed soul.

## 3. What changes (owner rules)

| Before | Now |
| --- | --- |
| real-time shooting, diving shades | turn based: tap one shade to strike it |
| health, defeat at 0 | courage; at 0 the team rests and returns to 3 |
| speed bonus XP | none; speed never counts |
| wrong shot kills any shade | a wrong shade falls (fewer shades to try) and the monster strikes |
| twin shots | each freed soul adds a twin soul (shown as the count); a hero strikes the monster |

## 4. Loop

1. A wave shows the meaning and 6 shades (4 in Helper mode). The captor holds the right term.
2. The student taps a shade.
3. Wrong: the shade falls, the monster strikes (courage -1), the student picks again.
4. Right: the soul is free, the heroes strike, the other shades scatter, the next wave comes.
5. A monster falls after 4 souls (skeleton, mimic, then the fire dragon).

## 5. Evidence

One `word` item per story word: `attempts` = shades struck for that word, `correctFirstTry` = the
first shade struck was the captor. `score` = points. The core is `src/games/paladins-twin-soul/core`.

## 6. Screens

3D: shared battle stage on top, the card (meaning + shades, HTML so Thai works) below. 2D: the same
layout in Phaser with `Card2D`. Models and sprites: the same as Monster Encounters.
