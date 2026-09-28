# Labyrinth of the Goblin King (2D and 3D): game design

Status: design, 2026-09-28 (Claude, FRONTEND). Phase D, family 2 (arena) of
`docs/apk-2d3d-program.md`; the first arena rewrite. The rules core follows section 6 (BACKEND).
Source: the monorepo cartridge `packages/game-cartridges/src/labyrinth-goblin-king.ts`.

## 1. The game in one paragraph

The student's hero is lost in the Goblin King's stone labyrinth. The sentence to build shows at
the top. Glowing word orbs lie in the corridors, and the hero walks to the orb with the next word
of the sentence. Goblins patrol the corridors; a goblin that catches the hero pushes the hero back
to the last crossing. When the sentence is complete, the hero glows gold for a short time: the
goblins run, and a caught goblin drops coins. A new sentence brings new orbs, and after the last
sentence the gate of the labyrinth opens.

## 2. What stays

| Rule | 2D and 3D |
| --- | --- |
| a grid maze; the hero moves from cell to cell and turns at crossings (a queued turn) | the same |
| word orbs of the sentence in the corridors; the next word in order is the right orb | the same |
| two goblins that chase the hero | the same (three for the last sentences) |
| a complete sentence gives an aura: the goblins flee and a touched goblin is caught | the same |
| every sentence built: victory | the same |

## 3. What changes

| Before | Now | Why |
| --- | --- | --- |
| a wrong orb costs a life; 0 lives is a defeat | a wrong orb fizzles, counts an attempt, and the orbs move to new cells | no game over |
| a goblin costs a life | a goblin pushes the hero back to the last crossing and returns to its den; no loss | no game over, and the chase stays exciting |
| a fixed maze | three authored mazes (seeded choice), 9 x 7 cells of 2 m; each has loops, so a goblin can be avoided | readable on a phone, and a 2D background per maze |
| 3 orbs, always | 3 orbs, 2 in Helper mode; in Helper mode the right orb has a soft glow | the Helper rule of the other games |
| score = right answers x 100 | coins for words and caught goblins; XP by the apps' rule | the same results as every game |

## 4. Screen and controls

- 3D: the labyrinth from above and behind (the arena camera, steeper), following the hero; the
  sentence panel at the top (words built so far, the next word hidden); the word tags on the orbs
  stay on screen (pinned at the edge when off screen). Walls are the dungeon `wall` model (1.2 m
  tall, so a wall never hides the hero at this camera).
- 2D: the same, with the `Arena2D` camera over a baked background per maze (floor and walls, the
  bake set of section 5) and the hero, goblin, and orb sprites.
- Controls: a swipe or the joystick picks the next turn (the direction is queued until a crossing
  allows it); the arrow keys and WASD do the same. A tap on a corridor ahead does nothing (no
  path-finding: the student steers).

## 5. Models, sprites, and bakes

Walls (`wall`, `wall-corner`, `pillar`), floors (`floor`, `floor-cracked`), torches
(`wall-sconce`), the hero, and `goblin-warrior` all exist as models and (the characters) as 2D
sprites. The view builds a maze from the core's map with these models; `demo/bake.ts` gets one
bake set per maze (`labyrinth-1`, `labyrinth-2`, `labyrinth-3`), built by the same code.

## 6. Rules core (BACKEND)

A realtime `Simulation` in `src/games/labyrinth/core` (fixed steps, as Dungeon Liberator).

| Command | Meaning |
| --- | --- |
| `{ type: 'turn', dir: 'up' \| 'down' \| 'left' \| 'right' }` | queue the next direction (the hero turns at the first cell that allows it, and keeps going until a wall) |
| `{ type: 'stop' }` | stop at the next cell |

| Event | Payload |
| --- | --- |
| `sentenceStarted` | sentenceId, words, orbs `{ id, word, cell }[]` |
| `orbTaken` | id, index (a right orb) |
| `orbWrong` | id (the orb fizzles; an attempt) |
| `orbsMoved` | orbs `{ id, cell }[]` |
| `heroBumped` | goblinId, back to cell |
| `goblinReturned` | goblinId, cell (to its den) |
| `sentenceComplete` | sentenceId (the aura starts) |
| `goblinCaught` | goblinId, coins |
| `auraEnded` | |
| `gateOpened`, `shiftComplete` | |

State: `maze` (id, rows, cols, walls per cell edge, the start cell, the dens, the gate), `hero`
(cell, next cell, progress 0 to 1 between them, direction, queued direction), `goblins` (id,
cell, next cell, progress, den, `returning`), `orbs`, `shift` (sentences with their records),
`sentence`, `next`, `auraMs`, `coins`, `phase`. The view draws positions between cells from
`progress`, so movement is smooth at any frame rate.

Speeds: the hero 3 cells per second; goblins 2 (2.4 in the last sentences); fleeing goblins 1.5.
Goblins choose at each crossing the direction that brings them nearer the hero (seeded ties),
never straight back unless a dead end. After a bump, the hero cannot be bumped again for 1.5 s.

Evidence: one `sentence` item per sentence (as Dungeon Liberator): attempts = wrong orbs + 1,
`correctFirstTry` = no wrong orb in that sentence, `solved` = built.
