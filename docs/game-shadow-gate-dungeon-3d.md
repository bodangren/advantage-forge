# Shadow Gate Dungeon 3D: game design

Status: built, 2026-10-03. Source game: `reading-advantage-monorepo/packages/game-cartridges/src/shadow-gate-dungeon.ts`
(a 960 x 540 dungeon; the player walks to word crystals in sentence order; a creature follows; a gate opens at the end).
Family: arena games with Dungeon Liberator and Village Guardian (same room, same controls, same helpers).

## 1. The game in one paragraph

The hero (in the student's colors) walks into a room of the Sunken Vault. A sentence from the story is
the task of the room. Three identical crystals stand on the floor, each with one word: the next word of
the sentence and two other words. The student walks to the crystal with the next word. The right crystal
joins the sentence at the top; the next wave of crystals appears. A wrong crystal shows "Not yet!" and the
crystals shuffle. A shadow follows the hero; its touch pushes the hero back and shuffles the crystals. When
the sentence is built, the gate glows, and the hero walks through. Each room is one sentence.

## 2. What stays from the legacy game

| Legacy rule | 3D |
| --- | --- |
| crystals with words, three at a time, all the same color | the same (one crystal model; no look gives a hint) |
| touch the word crystals in sentence order | the same |
| the right word is among two other supplied words | the same; the other words come from the same sentence first, then other sentences |
| a creature follows the player | a skeleton shadow follows at 1.1 m/s |
| a wrong crystal counts an attempt and re-deals the wave | the same |
| all words, then the gate | the same, one gate per sentence |

## 3. What changes (owner decisions)

| Legacy | 3D | Why |
| --- | --- | --- |
| the sentence is a flat list of words of all items | one room per sentence (3 to 7 words, up to 5 rooms) | one evidence item per story item |
| the player returns to the start after each touch | the player stays; new crystals keep 2.2 m from the player | less walking, no teleport |
| a creature touch has a 0.9 s cooldown and only marks a counter | a touch pushes the hero back 0.8 s, shuffles the crystals, and every shadow rests 2.5 s | a setback costs time and never a reading attempt |
| no end condition besides the gate | the delve ends when every room is cleared; no lives, no timer, no game over | owner rule |
| punctuation on crystals | crystals show the bare word | punctuation would show the position |
| XP from accuracy | `toGameResults(evidence, score)`; time never counts | speed gives no XP |

## 4. Screen and camera

Same steep follow camera as Dungeon Liberator. The sentence bar at the top shows built words and blanks
(in Helper mode the next blank glows, and the crystal with the next word has a highlighted tag). Word tags are HTML
(Thai works) and pin to the screen edge when a crystal is off screen. Hold and drag anywhere to walk
(floating joystick); WASD or arrows on a computer. The 2D view (Phaser) draws the same room from the baked
`background.dungeon-liberator` and the `prop.crystal-cluster` sprite.

## 5. Scene and models

| Part | Model |
| --- | --- |
| the hero | `knight`, `wizard`, or `cleric` (the student's preset) |
| the crystals | `crystal-cluster` (scaled to 0.95 m; slow turn and bob) |
| the shadows | `skeleton` (`rise`, `walk`, `attack`) |
| the room | `floor`, `floor-cracked`, `wall`, `wall-corner`, `arch`, `gate`, `pillar`, `cell-bars`, `hanging-cage`, `torch-sconce`, `bone-pile`, `chains` |

`GAME_LOADS`: `models` only (14 files, about 1.9 MB), plus `hero: true`. No whole pack.

## 6. Rules core

A `Simulation` in `src/games/shadow-gate-dungeon/core` (real-time, fixed step) on the arena helpers of
`src/apk3d/sim`. The room is `[-5.5, 5.5] x [-4.5, 4.5]` (x right, z toward the camera), the gate at `(0, -4.5)`,
the hero start at `(0, 3.5)`.

| Command | Meaning |
| --- | --- |
| `{ type: 'steer', x, z }` | the walk direction, length 0 to 1 (0 = stop); it holds until the next steer |

| Event | Payload |
| --- | --- |
| `roomStarted` | roomId, sentenceId, words, shadows `{ id, x, z }[]` |
| `wavePlaced` | cause (`start`, `taken`, `refused`, `bumped`), crystals `{ id, word, x, z }[]` |
| `crystalTaken` | id, index (the word joins the sentence) |
| `crystalRefused` | id (wrong word; a reading attempt) |
| `heroBumped` | shadowId (pushed back 0.8 s; not a reading error) |
| `gateOpened` | roomId |
| `roomCleared` | roomId, sentenceId |
| `delveComplete` | rooms |

Tuning: hero 3.2 m/s; shadow 1.1 m/s (Helper 0.8), +10% per room up to +30%; shadows 1, +1 every second room, at most 3
(Helper: +1 every third room, at most 2); radii hero 0.4, crystal 0.45, shadow 0.45; crystals at least 2.8 m apart,
2.2 m from the hero, 1.6 m from the gate; gate radius 0.9; bump 0.8 s at 2 m/s; shadow rest 2.5 s (all shadows).

### Evidence and results

One `sentence` item per room the student touched: `attempts` = wrong crystals + 1, `correctFirstTry` = cleared
with no wrong crystal, `solved` = cleared. Score = 10 per right crystal + 50 per cleared room. `results` and
`outcome` come from `toGameResults` and `toOutcome`, as in the other story games. Shadow bumps never count.

### Checks

`tests/games/shadow-gate-dungeon`: rules, replay (same seed, same commands, same events), a bot that finishes
two stories over 40 seeds (Helper and normal), and the manifest.
