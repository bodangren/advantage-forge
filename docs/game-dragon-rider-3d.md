# Dragon Rider 3D: game design

Status: built, 2026-10-03. Source game: `../advantage-games/src/lib/games/dragonRider.ts` and
`src/components/games/vocabulary/dragon-rider/`. Track notes: `measure/tracks/game_dragon_rider_20260928/`.

## 1. The game

The student rides a dragon (the chosen hero sits on its back) over a highland. A word from the
story shows at the top. Two stone gates, left and right, wait in front of the rider; each carries
a meaning. The student picks the left or right gate. A right gate adds a dragon to the flock. A
wrong gate sends one dragon home (never below 1), and the word returns once. After the last gate,
the dark dragon appears. Its power is `max(3, ceil(choices / 2))` (the legacy formula). The flock
duels it.

## 2. What stays from the 2D game

| 2D rule | 3D |
| --- | --- |
| a term and exactly two gates (the right meaning and one decoy) | the same; the decoy is the meaning of another story word |
| the right side is random | seeded |
| right: +1 dragon; wrong: -1, minimum 1 | the same |
| boss power `max(3, ceil(attempts / 2))` | the same, from the number of gate choices |
| the boss fight drains boss strength and flock one by one | the same exchanges, but the flock never loses (section 3) |

## 3. What changes (owner decisions)

| 2D | 3D | Why |
| --- | --- | --- |
| 150 s timer sets the number of rounds | every story word once (up to 8), plus each missed word once | no timer decides a result |
| the gates must be chosen before they pass | the gates hold 7 m in front of the rider until the choice | slow readers do not fail |
| victory only if the flock is at least the power | the duel always ends in a win: each exchange the boss loses 1 strength and one dragon rests; at the last dragon the resting dragons rally | no game over; a small flock only fights longer |
| XP by accuracy and speed | evidence only: one item per word; the score is coins | no speed XP |

Coins: 5 per word right on the first try, 10 per dragon standing at the end.

## 4. Rules core (`src/games/dragon-rider/core`)

Command: `{ type: 'choose', gate: 0 | 1 }`.
Events: `roundStarted`, `waiting`, `gateChosen`, `flockGrew`, `flockShrank`, `wordReturns`,
`bossAppeared` (flock, power), `exchange` (bossHp, active), `rally` (active), `rideComplete`.
Tuning is in `TUNING` (`sim.ts`): gates appear 40 m ahead and approach at 8 m/s, hold at 7 m,
pass at 16 m/s after a choice; the duel beat is 1.1 s.

## 5. Views and models

- 3D (`view/`): `dragon-fire` (rider and flock in a V formation, the dark one tinted and 3x the
  size), the hero on the rider's back (`knight`, `wizard`, `cleric` by `ctx.options.hero`),
  highland chunks of `pine-tree`, `oak-tree`, `rock-cluster`, `boulder`, `bush`, clouds from
  spheres, and gates built from boxes (two pillars and a lintel) with a glowing ring. Gate meanings
  are HTML tags (Thai works). Swipe or arrow keys pick left or right.
- 2D (`view2d/`): Phaser, the shared 45 degree camera; `dragon-fire`, the hero sheet, `prop.arch`
  for the gates, and highland props from `primary-chibi-2d`.
- Packs: `heroes`, `dungeon-monsters`, `outdoor-props`. No `sunken-vault`.

## 6. Known gaps

The hero scale and seat offset (`HERO_SCALE`, `SEAT` in `view/game.ts`; `HERO_PX` in
`view2d/game.ts`) are untuned: no browser QC yet.
