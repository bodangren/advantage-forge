# Griffin Riders Escape 3D and 2D

Griffin Riders Escape is the rewrite of the legacy sentence runner of the same name
(`advantage-games/src/lib/games/griffinRidersEscape.ts`). In the legacy game a griffin flies
forward in three lanes. Waves bring word gates (one gate has the next word of the sentence, two
are decoys) or obstacles. The student switches lane; a wrong gate or an obstacle costs a life, and
0 lives is defeat. This version keeps the identity: a flight forward, three lanes, gates with
words in sentence order, obstacles, and lane steering in real time.

It is not Spellweaver's Run (a runner that waits for one pick) and not Gryphon Patrol (a shooter
in a fixed sky): the griffin flies on at a steady speed, and the student must be in the right lane
when the wave arrives.

## Owner rules applied

- No timer decides a result and there is no game over. A wrong gate or a storm costs one courage;
  the riders rest (the world stops), and the same word comes back with new gates. At 0 courage the
  rest is longer and all courage returns. The legacy lives and defeat are gone.
- Speed never gives XP. One evidence item per story sentence; `attempts` = wrong gates + 1. Storms
  and courage never count in the evidence.
- All text comes from the catalog `griffinRidersEscape` (`strings.en.ts`).

## Differences from the legacy game

| Legacy | Here | Why |
| --- | --- | --- |
| one sentence, then victory | up to 4 sentences of 3 to 8 words, in a seeded order | one evidence item per story sentence |
| decoys repeat words of the same sentence | decoys are other words of the story | the right gate is a reading choice |
| obstacles take a life | a storm (bats in 1 or 2 lanes, never all 3) costs courage; a free lane always exists | no game over, a dodge is always possible |
| a wrong gate costs a life and the word is lost in the stream | a wrong gate repeats the same word with new gates | no elimination guessing |
| speed bonus under 30 s | none | speed never gives XP |
| `Math.random` and ticks in milliseconds of the clock | seeded rng, fixed 30 Hz step | replay |

## Loop

1. The prompt shows the meaning of a sentence (or "Build the sentence in order.") and the
   sentence as blanks.
2. The griffin flies on over the land. A row of three gates comes, each with a word. One has the
   next word of the sentence; the other two carry words of the story. Sometimes a storm of bats
   comes first and fills one or two lanes.
3. The student taps a lane or a gate tag, swipes, or uses the keys (A D, arrows, 1 2 3). The griffin
   changes lane in about half a second.
4. The lane the griffin is in when the row passes counts. The right gate fills the blank. A wrong
   gate or a storm costs one courage (3 at the start): the world stops for 1.5 s, and the same word
   comes back with new gates. At 0 courage the rest is 2.6 s and all courage returns.
5. The last word ends the sentence (banner, sparks) and the next one starts. After the last
   sentence the griffin takes a victory flight and the escape completes.

Helper mode flies slower (4.5 m/s instead of 6), makes fewer storms with one lane each, and marks
the next blank.

## Files

- `src/games/griffin-riders-escape/core/`: types, content (lanes, gates, storms), sim, evidence.
- `qc/bot.ts`: steers to the lane of the next word and around storms.
- `view/`: three.js view (`game.ts`, `land.ts`, shared `land-plan.ts`, css). Scene models:
  `ESCAPE_MODELS` in `view/land.ts` (the mount is `griffin`, from the `mounts` pack; the seat is
  `GRIFFIN_SEAT` in `src/games/shared/griffin.ts`). Rider models: the session hero.
- `view2d/`: Phaser view from above and behind (`game.ts`, `prompt.ts`).
- Tests: `tests/games/griffin-riders-escape/` (rules, replay, bot over 30 seeds, manifest).

## Known gaps

The views were not run in a browser. The gates are procedural rings (no gate model is in the packs
of this game). The 2D view uses the north-facing sprite rows for the griffin and the south-facing
rows for the bats.
