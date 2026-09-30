# Chibi Quest progression: XP, GP, avatars, and Guild Mode

> Measure owns execution status. Track: [avatar_system_20261001](../measure/tracks/avatar_system_20261001/).
> This document is the program plan. The avatar system spec is [avatar-system.md](avatar-system.md).

Status: plan, 2026-10-01. Owner goal (paraphrased): students in the education apps earn XP for
educational activities. XP awards and quests give GP. Students spend GP on equipment from the
forge assets for their own character. They play as that character in the games. When the teacher
turns on Guild Mode, students save power-ups during a week of classwork. At the end of the week the
class fights one cooperative boss for 5 to 10 minutes of the final period. The battle rewards the
students who did more educational work and needs every student to do their part.

## Owner decisions (2026-10-01)

- The docs live in this repo. The database and API work lands in `../reading-advantage-monorepo`.
- The first target is **Primary Advantage** only.
- **Rigid equipment slots first.** Cloth that bends with the body (robes, skirts) comes later.
- **Cooperative boss first.** No guild war (class against class) in the first version.
- **No real-time multiplayer.** Phones and the teacher screen talk to the server over plain HTTP.
  The teacher screen polls. Phones post completions and short heartbeats.
- During the battle each phone shows one avatar or none. The teacher screen shows the composite.

## The loop

```text
educational activity -> XP log (exists) -> GP grant (same transaction)
GP -> shop -> inventory -> loadout (the avatar)
avatar -> every game shows the student's own character
Guild Mode on -> weekly goals earn power-ups -> Friday boss battle -> rewards
```

## What already exists in the monorepo

| Piece | Where | Use |
| --- | --- | --- |
| XP log with a race-safe unique key per activity | `packages/db/src/schema/analytics.ts` (`xpLogs`) | GP is granted beside each XP row |
| `users.xp`, `users.level` | `packages/db/src/schema/users.ts` | Level gates for equipment tiers |
| Game completions | `gameCompletions` | Battle contributions are completions |
| Class challenges: definition, runs, contributions | `packages/db/src/schema/game-challenges.ts`, `packages/game-contracts/src/challenges.ts` | A Guild Mode week is one challenge definition per class |
| Cosmetic quests (3 quests, 3 emblems, fixed enums) | `packages/db/src/schema/rpg.ts`, `packages/game-contracts/src/rpg.ts` | Stays as is; the avatar tables sit beside it |
| Simulated class boss | forge `src/host/classBoss.ts` | The battle rules start from it (damage = correct answers x 2) |

## GP (Guild Points)

- **Two currencies.** XP is progress and never spends. GP spends.
- **GP is granted per XP event.** The grant runs in the same database transaction as the XP log
  row. GP is never computed from the XP total, and there is no retroactive backfill. Every
  student gets one welcome grant when the shop opens.
- **Weights per activity type.** Reading and questions weigh more than ratings. The first table
  is 1 GP per XP for reading and questions, 0 for ratings. The weights live in one domain
  function, not in the games.
- **Daily cap.** GP stops after a daily amount per student. Speed never gives GP. A wrong answer
  never takes GP.
- **Ledger, not a column.** `gp_ledger` rows carry a delta, a reason, and a unique source key
  (the XP log id, the purchase id, or the battle reward id). The balance is the sum. A purchase is
  one negative row in the same transaction as the inventory insert.
- **Pricing.** A median active student buys about one item per week. Measure the median weekly XP
  per active Primary student from the classroom XP APIs before the price table is set.
- **Tiers by level.** Tier 1 opens at level 1, tier 2 at level 5, tier 3 at level 10. Effort is the
  path. GP picks the item inside a tier.

## Guild Mode

- The teacher turns Guild Mode on for a class. Each week is one **guild season**: a class
  challenge definition with `startsAt` Monday and `expiresAt` the battle time.
- **Power-ups** come from weekly goals, accuracy, and streaks, with a cap per student per week.
  They never come from raw volume. Examples: "3 days of reading" gives a shield, "an accuracy of
  80% on 20 questions" gives a sharp blade, "a 5-day streak" gives a rally horn.
- **The boss target is fixed at the season start.** Target = roster size x expected damage per
  student x an expected participation rate. It never scales to the class's actual power during the
  week. Extra work moves the meter; it does not grow the boss.
- **The meter is visible all week** on the student home page and the teacher dashboard.
- **The battle** takes 8 minutes of the final period. See "The battle" below.
- **Rewards.** Every participant gets GP. The class gets a cosmetic banner when the boss falls.
  No ranking is shown. The teacher sees who played and who did not.

## The battle

Each student plays on their own phone. The teacher projects one page from a laptop, or shows the
dashboard mode from any device.

| Role | Device | Shows | Loads |
| --- | --- | --- | --- |
| Student | phone | the challenge card, a damage counter, the student's avatar portrait, an HP bar | the game pack and one portrait (a few PNG layers) |
| Teacher, composite | laptop with WebGL2 | the boss, every avatar of the class in 3D with HP bars, hits as they land | the reduced avatar pack for the class |
| Teacher, dashboard | any device | the boss meter, avatar portraits with HP bars, a feed of hits | portraits only |

**Flow (8 minutes).**

1. **Rally, 1 minute.** A student opens the battle page. The phone posts "present". The teacher
   screen shows that avatar walking onto the field.
2. **Play, 5 minutes.** Each student plays their challenge run. Correct answers are damage. Wrong
   answers cost the student HP. Saved power-ups apply as multipliers. When HP reaches zero the
   student rests for 10 seconds and returns with half HP: a setback is a rest, never a game over.
3. **Result, 2 minutes.** The boss falls or holds. The teacher screen shows the class total and
   every helper. Rewards post to the ledger.

**HP bars over the avatars without real-time multiplayer.** The phone posts a **heartbeat** every
10 seconds and after each answer: `{ runId, answered, correct, hp, powerUpsUsed }`. A heartbeat
is idempotent: the server keeps the latest per run. The teacher screen polls the class state
every 3 to 5 seconds. So every HP bar is real data from that student's phone, with a delay of up
to about 15 seconds. A bar dims after 60 seconds without a heartbeat. The boss HP on screen is the
target minus the committed contributions (from completions) minus a lighter "pending" segment
from the heartbeats. The committed value is the truth; the pending segment is a preview. No
websocket, no shared simulation, and a refresh of the teacher screen loses nothing.

## Safety rules for primary students

- No real money, no loot boxes, no random rewards, no trading between students.
- No free-text names for avatars. The avatar shows the student's display name.
- A teacher can see and reset any loadout in the class.
- No ranking of students on any shared screen. The teacher's own view may show participation.

## Phases and tracks

| Phase | Work | Repo | Track |
| --- | --- | --- | --- |
| 1 | The avatar base, the equipment fit rework, the equipment manifest, portrait layers, the reduced avatar pack | this repo | avatar_system_20261001 |
| 2 | GP ledger, shop, inventory, loadout, and the avatar page in Primary Advantage | monorepo | a monorepo track |
| 3 | The avatar in one game (Monster Encounters), then the other five | this repo, then the port | game tracks |
| 4 | Guild Mode: seasons, power-ups, the battle pages (phone, composite, dashboard) | monorepo and this repo | a new track |
| later | Phone 3D avatars with LOD, layered 2D sprites for the arena games, cloth slots, the guild war | | |

## Open questions

- Expected damage per student and participation rate for the boss target: set from the first two
  seasons' data.
- Whether a student without Guild Mode still sees a weekly personal boss (a solo version).
- The exact power-up list and caps.
