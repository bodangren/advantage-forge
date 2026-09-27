# Hero vs. Zombie 3D: game design

Status: design, 2026-09-28 (Claude, FRONTEND). The rules core follows section 6 (BACKEND). Source
game: advantage-games "Wizard vs Zombie" (`src/lib/games/wizardZombie.ts`,
`src/components/games/vocabulary/wizard-vs-zombie/`). The 3D port lets the student play their own
hero (Knight, Wizard, or Cleric), so it is "Hero vs. Zombie".

## 1. The game in one paragraph

Night falls on the old churchyard at the edge of the village, and zombies climb out of the
graves. A word from the story glows at the top of the screen. Light orbs float around the
churchyard, each with a meaning in the student's language. The hero runs to the orb with the
right meaning: it bursts into light and charges the hero's Blast. A Blast knocks every nearby
zombie flat. When the last word is found, the sun rises and the zombies crumble to dust.

## 2. What stays from the 2D game

| 2D rule | 3D |
| --- | --- |
| a target word; orbs with its meaning and decoys spread over the arena | the same; decoys are other story words' meanings |
| the right orb gives a Shockwave charge (at most 3) | the same (the Blast button) |
| a wrong orb reshuffles the orbs and costs points | the same reshuffle; it counts an attempt (no points lost) |
| zombies chase the player | the same, slowly |
| Shockwave pushes zombies back | Blast knocks down every zombie within 4.5 m; they rise again after 3 s |

## 3. What changes (owner decisions and the reading guardrails)

| 2D | 3D | Why |
| --- | --- | --- |
| 100 HP; zombies cost HP; 0 HP is game over | a zombie that reaches the hero pushes the hero back (0.8 s without control); no HP, no game over | no game over |
| an endless horde; survive as long as possible | a fixed night: every story word once (4 to 10 rounds), each missed word once more; then dawn | no speed or survival time as the result |
| spawn rate grows with time | zombies: 2 in Helper mode, 3 otherwise, +1 every 3 rounds (at most 5); speed 1.1 m/s (Helper 0.9) against the hero's 3.4 m/s | a calm chase; reading decides the result |
| 2D orb count by difficulty | 3 orbs in Helper mode, 4 otherwise | a real choice for grades 3 to 6 |

## 4. Screen and camera

- The same steep follow camera as Dungeon Liberator; night light with lanterns and a moon.
- The target word in a banner at the top ("Find: brave"). Orb tags (the meanings) are pinned to
  the screen edge when their orb is off screen, so every choice stays readable.
- Controls: the floating joystick (or WASD and arrows) and a round Blast button with the charge
  count at the bottom right (or the Space key).

## 5. Scene and models

| Part | Model |
| --- | --- |
| the hero | the chosen hero (`knight`, `wizard`, `cleric`) with its look; `attack` for the Blast |
| zombies | `zombie` (`rise` from a grave, `walk`, `attack` when they bump, `death` when blasted) |
| light orbs | kit geometry: a glowing sphere |
| the churchyard | `dirt-ground` or a dark ground, `sarcophagus` as graves, `dead-tree`, `fence`, `lantern`, `boulder`, `rock-cluster`, `bush`, `tall-grass`, `bone-pile`, `candle-cluster`, `campfire-out` |

## 6. Rules core (BACKEND)

A `Simulation` in `src/games/hero-vs-zombie/core` (real-time, fixed step) on the shared arena
helpers. The churchyard is a rectangle `[-6, 6] x [-5, 5]`; graves (zombie spawn points) along
its edges.

| Command | Meaning |
| --- | --- |
| `{ type: 'steer', x, z }` | the move direction, length 0 to 1; it holds until the next steer |
| `{ type: 'blast' }` | use one charge (ignored with no charge) |

| Event | Payload |
| --- | --- |
| `roundStarted` | roundId, itemId, term, orbs `{ id, text, x, z }[]` |
| `orbTaken` | id, correct: true, charges, coins |
| `orbWrong` | id (the orbs reshuffle: `orbsMoved` follows) |
| `orbsMoved` | orbs `{ id, x, z }[]` |
| `wordReturns` | itemId |
| `zombieRose` | zombieId, x, z (from a grave, or again after a Blast) |
| `heroBumped` | zombieId |
| `blast` | charges, knocked (zombie ids) |
| `dawn` | (the last word is found; zombies crumble) |
| `nightComplete` | rounds, coins |

State the view reads: `hero { x, z, facing, bumpedMs }`, `orbs[]` (id, text, correct, x, z),
`round` (id, itemId, term) or null, `roundIndex`, `total`, `zombies[]` (id, x, z, downMs,
rising), `charges`, `coins`, `phase` ('night' | 'dawn' | 'complete').

Tuning: hero 3.4 m/s; zombies 1.1 m/s (Helper 0.9); radii hero 0.4, zombie 0.4, orb 0.45; orbs at
least 2.2 m apart and 2.5 m from the hero at a round start; Blast radius 4.5 m, knocked down
3 s; charges at most 3 (the first round starts with 1 so the student can try it); coins 10 per
first-try word, 5 per later right word, 3 per zombie knocked down; dawn lasts 2.5 s.

Evidence: one item per story word (`itemKind: 'word'`), attempts = orb touches for that word,
`correctFirstTry`, `solved`. Bumps are not reading errors and do not count. Input: the whole
`StoryInput` (manifest `inputMode: 'story'`); the core also accepts the APK `VocabularyInput`.

Notes from the core as built (BACKEND, 2026-09-28):

- Extra event fields: `orbTaken` and `orbWrong` also carry `roundId` and `itemId`; `orbTaken`
  carries `firstTry`; `blast` carries `coins`. Orb ids are unique in the night (`r1-o1`).
- Extra state: `hero.pushX/pushZ`, `zombies[].riseMs/attackMs/graveId`, `orbs[].wordId/contact`,
  `words`, `queue`, `rounds` (won), `orbCount`, `knocked`, `bumps`, `steer`, `dawnMs`, `timeMs`,
  `helper`. `GRAVES` (10 spawn points just inside the far edge and both sides) is exported.
- A zombie climbs out of its grave for 1.2 s (`rising`) before it walks or bumps. A zombie that
  bumped the hero stands still for 1 s (`attackMs`), so the hero can get away. Walking zombies
  keep apart (`separateCircles`).
- A hero pushed onto an orb touches nothing; the touch counts when the hero steps off and back
  in control (as the Knight in Dungeon Liberator).
- A missed word returns once at the end even when the student finds the right orb later in the
  same round; the return pays 5 coins like any later right orb.
- A Blast with no zombie in range still uses the charge. Orbs also keep 1 m from the graves.
- The hero can still walk during the dawn; zombies stop, and nothing bumps.
