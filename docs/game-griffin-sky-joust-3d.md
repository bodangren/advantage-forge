# Griffin Sky-Joust 3D: game design

Status: built 2026-10-03. Legacy source: `packages/game-cartridges/src/griffin-sky-joust.ts` in the
monorepo (and `advantage-games/src/lib/games/griffinSkyJoust.ts`). Code: `src/games/griffin-sky-joust`.

## 1. The game in one paragraph

A sentence shows its meaning at the top, with blanks. Each word of the sentence rides a flying
rider (a giant bat) that patrols the sky at its own height. The student flaps and slides a griffin
(the fire dragon model, with the chosen hero on its back) and strikes from above the rider that
carries the next word. A right strike fills the blank; the last word makes the sentence whole and
a new sentence starts. A hit from the side or from below, or a strike on a wrong word, costs one
courage.

## 2. What stays from the legacy game

| Legacy rule | Here |
| --- | --- |
| words of a sentence become riders, struck in order | the same, at most 8 riders in the air |
| a strike from above (griffin higher than the rider by half its radius) counts; side or below hurts | the same (`strike = griffin.y < rider.y - radius / 2`) |
| gravity 800, flap -350, slide 180, damping 0.98 per 16.67 ms, knock back, 1.5 s safe time | the same numbers (`TUNING`) |
| the arena is 960 by 540 and wraps left to right | the same |
| 100 points per word | the same, plus 50 for a sentence with no wrong strike |

## 3. What changes (owner rules)

| Legacy | Here | Why |
| --- | --- | --- |
| 3 hearts, defeat at 0 | courage 3; at 0 the griffin rests 2 s and returns with all of it | no game over |
| every word of every sentence of the input | up to 4 sentences of 3 to 8 words, seeded order | a short, even game |
| XP from survival and accuracy bonuses in the game | `toGameResults(evidence, score)`; one evidence item per sentence | one rule for all games |
| strict word identity | a repeated word counts for any rider that carries it | "the ... the" is not a trap |
| a rider may appear anywhere | a new rider never appears on the griffin or in lockstep with another | fairness |
| a 900 ms pause between sentences | kept; it only paces the next sentence, no timer decides a result | no speed pressure |

Speed never gives XP or points. Waiting for ever changes nothing.

## 4. Rules core (`core/`)

A real-time `Simulation` on the fixed step (30 steps per second). Commands: `flap { dir }` and
`drift { dir }`. Events: `sentenceStarted`, `flapped`, `wordStruck`, `bumped`, `rested`,
`sentenceDone`, `joustComplete`. Evidence: one `sentence` item per sentence the student struck a
rider of; `attempts` = wrong strikes + 1. A bump from the side is no miss.

## 5. Views

- 3D (`view/`): a side-on stage (the arena at z = 0, 40 px per meter), sky, clouds, hills with
  trees and rocks. Words are HTML tags over the riders (Thai prompt in HTML). A tap flaps, the
  left or right third also slides; Space or Up flaps, the arrows and A D slide.
- 2D (`view2d/`): the same arena in Phaser with the dragon-fire and giant-bat sheets (east and
  west rows) and the hero sprite on the griffin.
- Helper mode: slower riders (60 instead of 90 px/s) and the rider with the next word pulses.

## 6. Models

`dragon-fire` (the griffin), `giant-bat` (riders), the chosen hero (rides the griffin), and the
ground props `oak-tree`, `pine-tree`, `rock-cluster`, `bush`. No new art.

## 7. QC bot

`qc/bot.ts` plays through the public commands. It hovers above the riders, climbs back through a
gap after a strike, and plans each dive by looking a few steps ahead on a copy of the core
(`resumeGriffinSkyJoust`). Call it every 1 to 3 steps (10 to 30 times a second).
