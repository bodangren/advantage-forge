# Devourer Slime 3D: game design

Status: design, 2026-09-28 (Claude, FRONTEND). The rules core follows section 6 (BACKEND). Source
game: `../advantage-games/src/lib/games/devourerSlime.ts` and
`src/components/games/sentence/devourer-slime/`.

## 1. The game in one paragraph

A small green slime lives in a forest clearing. Glowing word bubbles float over the grass: the
words of a sentence from the story. The slime eats them in the order of the sentence and grows
with every right word. Guards patrol the clearing. A guard bigger than the slime pushes it away;
a slime bigger than a guard swallows the guard whole. After the last sentence, the slime is huge
and happy.

## 2. What stays from the 2D game

| 2D rule | 3D |
| --- | --- |
| word orbs of a sentence, spread over the arena | the same; glowing bubbles with word tags |
| eat them in order: the right word grows the slime | the same (+8% size per word) |
| a wrong word: points down and the slime shrinks a little | the bubble bounces away, the slime shrinks 3% (never below its start size) |
| knights bounce around the arena | guards patrol and bounce off the edge of the clearing |
| a slime bigger than an enemy eats it | the same (coins and a big gulp) |
| all sentences: victory | the same |

## 3. What changes (owner decisions and the reading guardrails)

| 2D | 3D | Why |
| --- | --- | --- |
| 3 lives; a hit costs a life and 20% size; 0 lives is a defeat | a guard bigger than the slime pushes it back (0.8 s) and costs 5% size; no lives, no defeat | no game over |
| enemy count by difficulty (2 to 6) | 2 guards in Helper mode, 3 otherwise | calm enough to read |
| a bigger slime eats enemies for good | Power-up, as in Pac-Man without the maze: a slime that grows past a guard (size > 1.35, after five right words) is powered for 8 s (a countdown in the HUD, a gold glow that blinks in the last 2 s). A powered slime swallows guards for coins. At zero the slime is back to its start size and must earn the power again. An eaten guard is back at once at a spawn point far from the slime (one of the 3 farthest of 8 points on a ring of radius 5.6 m, clear of other guards) | the power is a short reward, not a permanent state |
| score only | coins for eaten guards; XP by the apps' rule from the words | the same results as every game |

## 4. Screen and camera

- A steep camera that follows the slime and pulls back as the slime grows.
- Word tags over the bubbles (HTML). The sentence shows at the top as blanks that fill in; in Helper
  mode, the next bubble pulses.
- Controls: the same floating joystick as Dungeon Liberator (drag anywhere; WASD or arrows).

## 5. Scene and models

| Part | Model |
| --- | --- |
| the slime | `slime` (`walk`, `idle`, `attack` to gulp, `hit`, `spit` for a wrong word), scaled by its size |
| guards | `guard`, `bandit` (`walk`; `hit` and `death` when swallowed) |
| word bubbles | kit geometry: a glowing sphere in the brew colors |
| the clearing | forest kit: `grass-ground`, a ring of `oak-tree`, `pine-tree`, `bush`, `boulder`, `rock-cluster`, `fern`, `wildflowers`, `mushroom-cluster`, `tree-stump` |

## 6. Rules core (BACKEND)

A `Simulation` in `src/games/devourer-slime/core` (real-time, fixed step), on the shared arena
helpers. The clearing is a circle of radius 7 m around `(0, 0)`.

| Command | Meaning |
| --- | --- |
| `{ type: 'steer', x, z }` | the move direction, length 0 to 1; it holds until the next steer |

| Event | Payload |
| --- | --- |
| `sentenceStarted` | sentenceId, words, bubbles `{ id, word, index, x, z }[]` |
| `wordEaten` | id, index, size |
| `wordSpat` | id (wrong word; the bubble bounces 1.5 m away), size |
| `slimeBumped` | guardId, size |
| `powerStarted` | durationMs, size |
| `powerEnded` | size (back to 1) |
| `guardEaten` | guardId, size, coins |
| `guardReturned` | guardId, kind, x, z (the respawn, in the same step as `guardEaten`) |
| `sentenceComplete` | sentenceId |
| `shiftComplete` | sentences, size |

State the view reads: `slime { x, z, size, facing, bumpedMs }` (size 1 = start; radius =
0.45 m x size), `bubbles[]` (id, word, index, x, z, eaten), `next`, `guards[]` (id, kind, x, z, vx,
vz, size, eaten), `sentence`, `sentences`, `coins`, `phase`.

Tuning: slime 3.0 m/s (a bigger slime is not slower); guards 1.3 m/s, size 1.35 (the slime can
eat a guard after about 5 right words); up to 5 sentences of 3 to 7 words.

Evidence: one item per sentence (`itemKind: 'sentence'`), attempts = wrong words + 1,
`correctFirstTry` = no wrong word. Bumps by guards are not reading errors and do not count.

Core notes (BACKEND, 2026-09-28): the shift list is `shift` (`ShiftSentence[]`: id, text,
words, paragraph, wrong, started, complete); `sentence` is the zero-based index and `sentences`
the count. Extra state: `steer` (the held command), `eaten` (right words), `guardsEaten`; a
bubble has `spatMs` (0.8 s after a spit it cannot be eaten again, so one wrong touch counts
one attempt); the slime has `poweredMs` (the power countdown, 0 = normal); a guard has no return rule: it respawns at
once (section 3). Size is additive: +0.08 per right word, -0.03 per wrong word, -0.05 per bump,
never below 1; a slime eats a guard only while it is powered (`poweredMs > 0`), and the power ends with a reset to size 1. A spat bubble lands
`max(1.5, slime radius + 0.3 + 0.6)` m from the slime, toward the center when the away
direction leaves the clearing, so the slime is never left touching it. The bubbles of a new
sentence keep `max(1.5, 2 x slime radius + 0.8)` m apart and at least `radius + 1.5` m from the
slime, so a big slime can always pass between them. A guard swallowed pays 20 coins; `scoreOf`
= coins. Shared arena helpers live in `src/apk3d/sim/arena.ts`.
