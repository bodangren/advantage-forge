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

Decisions of the core (BACKEND, 2026-09-28), where the table above leaves a choice:

- The shift is up to 5 sentences of 3 to 7 words in a seeded order (as Dungeon Liberator); the
  maze is a seeded pick of the three, and `options.maze` forces one for tests and QC.
- `orbsMoved` carries the same orb ids at new cells (after a wrong orb); a new event `orbsPlaced`
  (`{ id, word, cell }[]`) brings the orbs of the next word. Orb ids are `o<wave>-<n>`.
- Orbs never sit on the hero's cell or its neighbors, on a den or a den's neighbor, or on a
  shortest path from the hero to the right orb, so the direct way never forces a wrong orb.
- The reverse direction applies at once, between cells (the hero walks back); other turns wait
  for a cell that allows them. A bump clears the queued turn.
- A bumped goblin walks home at 3 cells per second and rests 2 s in its den (`restMs`); a caught
  goblin is sent to its den at once with the same rest. A resting or returning goblin neither
  bumps nor is caught. The aura lasts 5 s; the next sentence starts at once, under the aura.
- The "last sentences" are the last two of a shift of 4 or more and the last of 3: three goblins
  at 2.4 cells per second. Helper mode changes the orbs only.
- While the gate is open, goblins flee and never bump; the shift completes when the hero walks
  onto the gate cell. `positionOf(mover)` gives cell units; one cell is `CELL_M` = 2 m.
- Coins: 10 per right word, 30 per caught goblin. `score` = coins.


## 7. Views (FRONTEND, 2026-10-02)

The views read the core's state and events and decide no rule. Files: `src/games/labyrinth/`
`manifest.ts`, `strings.en.ts`, `briefing.ts`, `index.ts` (the cartridge), `view/` (3D), `view2d/` (Phaser).

- **Maze set.** `view/maze.ts` builds one floor tile per cell, one `wall` per wall edge, a
  `pillar` (scale 0.84, so it is as tall as a wall) at every wall end, three torches on the north
  wall, one on each side wall, and the `arch` and `gate` models at the gate slot. Floors are tinted
  warm against the cool wall stone. Walls and pillars are instanced (a few draw calls). Both views
  and the 2D bake use `view/geometry.ts`, which puts the maze on the origin (cell `col` to +X,
  `row` to +Z, 2 m per cell).
- **Whole maze in view (owner feedback, 2026-10-02).** The game is a Pac-Man game: the student must
  see every corridor to find a way to the words. Both views fix the camera on the whole maze (no
  follow). 3D: `fitCamera` in `view/geometry.ts` computes the distance from the aspect, the field
  of view, and the wall height; the maze sits under the top HUD. 2D: the baked background is
  zoomed to the free area (`fit()`). A portrait phone shows a small maze (the maze is wider than
  tall); a portrait layout that turns the maze by 90 degrees remains open.
- **Turning.** (a) A held stick or key keeps its turn: if a bump clears the queue, the view sends
  the turn again (`heldTurn`). (b) Late-turn grace (core, `TUNING.turnGrace` = 0.5): a side turn
  pressed within half a cell after a crossing steps the hero back into that crossing, when the
  turn is open there and closed at the cell ahead. Past the grace, the turn queues for the next
  crossing, as before. Pressing early always worked (the queue waits for a crossing).
- **3D.** `FollowRig` with a fixed target (elevation 66 degrees, 70 in portrait). A
  character that the core teleports (a bump to the last crossing, a catch) snaps to the new
  point; every other move glides. Orbs are emissive spheres with a word tag pinned at the screen
  edge; in Helper mode the right orb has a gold ring. The aura is a gold disc and a gold light on
  the hero. The gate model rises when the gate opens.
- **2D.** `Arena2D` over one baked background per maze (`background.labyrinth-1` to `-3`,
  `scripts/apk2d-bake.ts`). The 2D camera is fixed at 45 degrees, so the bake builds walls 0.55 m
  high (`wallHeight` option); at 1.2 m a wall would hide most of the corridor behind it. Fleeing
  goblins turn blue. `view2d/projections.gen.ts` holds the three cameras (generated by
  `scripts/apk2d-pack.ts`, which now writes one map for a game with numbered backgrounds).
- **Controls.** The joystick (or WASD and the arrow keys) gives a stick vector; `dirOfStick`
  turns the stronger axis into a `turn` command, with a dead zone of 0.35. Releasing the stick
  sends nothing: the hero keeps walking until a wall, as the core defines.
- **Sentence panel.** 3D: blanks that fill with the found words (`sentenceBar`). 2D: the same
  idea in the word panel (found words, then underscores).
- No new models: the hero, `goblin-warrior`, and the dungeon kit all exist.
