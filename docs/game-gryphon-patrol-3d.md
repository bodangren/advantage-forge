# Gryphon Patrol 3D and 2D

Gryphon Patrol is the rewrite of the legacy sky shooter of the same name
(`game-cartridges/src/gryphon-patrol.ts`). In the legacy game a gryphon flies a wrapped world,
shoots enemies that carry words, collects an orb for each right hit, and loses hit points when an
enemy touches it. This version keeps the identity: a flying gryphon, bats with words, the words in
sentence order, a shot, and a word orb to collect.

## Owner rules applied

- No timer decides a result and there is no game over. The bats circle in place for as long as
  the student reads. A wrong shot costs courage; the gryphon rests and returns (as in Monster
  Encounters). The legacy hit points and defeat are gone.
- Speed never gives XP. One evidence item per story sentence.
- All text comes from the catalog `gryphonPatrol` (`strings.en.ts`).

## Differences from the legacy game

| Legacy | Here | Why |
| --- | --- | --- |
| 10 enemies at once, all sentence words flattened | 4 bats per round (3 in Helper mode), one round per word | a readable choice, evidence per sentence |
| enemy contact costs hit points, 0 hit points is defeat | enemies never touch the gryphon; only a wrong shot costs courage | no game over, reading decides every setback |
| world wraps horizontally, the gryphon steers by hand | a fixed sky, 16 m wide; each bat circles inside its own slot; the gryphon flies to the shot or the orb by itself, and tap or keys may move it | steering is not a reading skill; slots keep banners apart |
| a shot flies straight and can miss | the shot homes in on the tapped bat | a tap on a word is the answer |
| a wrong enemy is removed, play goes on | a wrong shot scatters the bats, the gryphon rests 1.6 s, the same word returns with new bats | no elimination guessing |

## Loop

1. The prompt shows the meaning of a sentence (or "Build the sentence in order.") and the
   sentence as blanks.
2. Four bats (three in Helper mode) circle in the sky, each with a word banner. One carries the
   next word of the sentence; the others carry words of the story.
3. The student taps a banner (or presses 1 to 4). The gryphon turns, a shot flies to that bat.
4. The right bat drops a glowing orb. The gryphon flies to the orb and the word fills its blank.
5. A wrong bat costs one courage (3 at the start). The bats scatter, the gryphon rests 1.6 s,
   and the same word comes back with new bats. At 0 courage the rest is 2.6 s and all courage
   returns.
6. The last word ends the sentence (banner, sparks) and the next one starts. Up to 4 sentences of
   3 to 8 words, in a seeded order. After the last one the gryphon takes a victory flight.

## Core (`core/`)

A real-time `Simulation` on the fixed step (30 Hz).

| Command | Meaning |
| --- | --- |
| `{ type: 'shoot', enemy }` | shoot the bat with this id (`e1`..`e4`, left to right) |
| `{ type: 'moveTo', x, y }` | fly the gryphon to a point of the sky (ignored during a shot, an orb, or a rest) |

| Event | Payload |
| --- | --- |
| `roundStarted` | roundId, sentence, wordIndex, enemies `{ id, text }[]`, retry |
| `shotFired` | roundId, enemy |
| `enemyHit` | roundId, enemy, correct, rightEnemy, x, y |
| `orbDropped` | text, x, y |
| `wordCollected` | sentence, wordIndex, text |
| `courageLost` / `rested` | courage |
| `sentenceCast` | sentence, id |
| `patrolComplete` | score |

Bat motion is a pure function of time since the round opened (`enemyAt`), so a replay is exact.
Tuning is in `TUNING` (`core/sim.ts`); the sky is `SKY` (`core/content.ts`).

## Evidence and score

One `sentence` item per sentence the student shot at. `attempts` = wrong shots + 1,
`correctFirstTry` = collected with no wrong shot, `solved` = collected. Score = 10 per word
(5 for the word right after a wrong shot) plus 50 per finished sentence: the game's own number,
not an XP rule.

## Files

- `core/`: types, content (sentences, word pool, bats), sim (`createGryphonPatrol`), evidence.
- `qc/bot.ts`: the QC bot (`nextChoice`). `view/`: three.js sky and HUD. `view2d/`: Phaser side view.
- Tests: `tests/games/gryphon-patrol/`.

## Models

3D: the rider hero (session option, `knight` by default), `griffin` (the gryphon, from the
`mounts` pack; the rider seat is `GRIFFIN_SEAT` in `src/games/shared/griffin.ts`), `giant-bat` (the word bats), and the ground props `oak-tree`,
`pine-tree`, `ancient-oak`, `bush`, `fern`, `wildflowers`, `boulder`, `rock-cluster`, `cottage`,
`barn`, `well`, `hay-bale`. Orbs, shots, clouds, and the ground are drawn in code. On a tall screen
the view spreads the sky out vertically (positions only). 2D: the three heroes (`idle`, `hit`,
`victory`), `griffin` (`fly`, `hit`, `roar`), `giant-bat` (`fly`, `hit`, `death`), and ten
`prop.*` sprites. The 2D view looks from the side with the east and west sprite rows.

## Known gaps

- The model sizes (`SIZES` in `view/sky-plan.ts`) and the 2D prop scale had a browser check in
  the monorepo QC only (2026-10-04, track `game_griffin_mount_20261004`).
