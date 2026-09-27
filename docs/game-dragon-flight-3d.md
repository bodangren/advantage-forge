# Dragon Flight 3D: game design

Status: design, 2026-09-28 (Claude, FRONTEND). The rules core follows section 6 (BACKEND). Source
game: `../advantage-games/src/lib/games/dragonFlight.ts` and
`src/components/games/vocabulary/dragon-flight/`.

## 1. The game in one paragraph

The student rides the fire dragon low over the forest and the village. A banner shows an English
word from the story. Ahead, two or three stone gates carry meanings in the student's language.
The student taps the gate with the right meaning (or swipes toward it), and the dragon flies
through it: a young dragon joins the flock. A wrong gate sends one dragon of the flock home, and
the word comes back later. After the last gate, a dark dragon waits on a hill; the whole flock
breathes fire at it together, and the more dragons, the bigger the finale.

## 2. What stays from the 2D game

| 2D rule | 3D |
| --- | --- |
| an English term; gates with the correct meaning and decoys | the same; decoys are meanings of other story words |
| a correct gate adds a dragon; a wrong gate removes one (never below 1) | the same |
| a boss at the end; the flock size decides the fight | the same, but the fight always ends in a win (section 3) |
| XP from correct answers and accuracy | the apps' rule (`calculateXP`), as in every game |

## 3. What changes (owner decisions and the reading guardrails)

| 2D | 3D | Why |
| --- | --- | --- |
| a 30 s timer; the round count depends on speed | a fixed flight: every story word once (4 to 10 gates), plus each missed word once more | no speed as a success condition |
| a gate must be chosen before the dragon reaches it | when the dragon reaches the gates with no choice, it hovers in front of them and waits | slow readers never fail by time |
| victory only when the flock is big enough | the flock always wins; its size sets the number of fireballs, the coins, and a bigger finale | no game over, no loss |
| always 2 gates | 2 gates in Helper mode, 3 gates otherwise | a choice between the two for grades 3 to 6 |

Excitement: a speed boost and a "whoosh" through each right gate, the flock visibly growing behind
the dragon, clouds and treetops rushing past, and the boss roar.

## 4. Screen and camera

- The camera follows behind and above the dragon (`FollowRig`); portrait and landscape use the
  same rig with a wider field of view in landscape.
- The English word shows in a banner at the top (HTML, 30 px or more). Each gate carries its
  meaning on an HTML tag anchored above the gate (Thai uses the larger Thai size).
- The flock counter (a dragon icon and the number) and the gate progress ("Gate 3/8") are in the
  status bar.
- Controls: tap a gate tag or the gate itself, or swipe left or right (with 3 gates, a swipe picks
  the left or right one; a tap picks any). A key press 1, 2, 3 or the arrow keys on a computer.

## 5. Scene and models

| Part | Model | Notes |
| --- | --- | --- |
| the player's dragon | `dragon-fire` | `fly` loop; `attack` for fire; `roar` at the start |
| the flock | `dragon-fire` at 0.45 scale | follows in a V behind the player |
| the gates | `arch` (the vault arch) at 1.4 scale | a glowing ring in the brew colors when chosen |
| the land below | `grass-ground`, `forest-ground`, `oak-tree`, `pine-tree`, `ancient-oak`, `bush`, `boulder`, `rock-cluster`, `river-straight`, `cottage`, `barn`, `well`, `fence`, `farm-field`, `hay-bale` | tiles recycled along the path, forest first, then the village |
| the boss | `dragon-fire` at 2.6 scale, dark tint | on a hill (`boulder`, `rock-cluster`) at the end |

## 6. Rules core (BACKEND)

A `Simulation` in `src/games/dragon-flight/core` (real-time, fixed step). Distance along the path
is in meters; the view maps it onto its 3D path.

| Command | Meaning |
| --- | --- |
| `{ type: 'choose', gate: number }` | the student picks a gate of the current round (0 = left) |

| Event | Payload |
| --- | --- |
| `roundStarted` | roundId, itemId, term, options: `{ id, text }[]` (gate order), gatesAt (distance) |
| `waiting` | roundId (the dragon reached the gates with no choice; it hovers) |
| `gateChosen` | roundId, gate, correct, correctGate |
| `flockGrew` / `flockShrank` | count |
| `wordReturns` | itemId (a missed word is queued once more) |
| `bossAppeared` | flock |
| `fireball` | index (one per dragon in the flock) |
| `flightComplete` | flock, coins |

Tuning: cruise speed 9 m/s, boost to 14 m/s for 1.2 s after a right gate, gates every 60 m (about
6 s of reading at cruise speed), hover when the dragon is 8 m before the gates, 2 or 3 gates,
coins = 10 per dragon at the boss + 5 per first-try word.

Evidence: one item per story word (`itemKind: 'word'`), attempts = choices for that word,
`correctFirstTry`, `solved`. Input: the whole `StoryInput` (manifest `inputMode: 'story'`), and the
core also accepts the APK `VocabularyInput` (`{ term, translation }[]`), so the port can switch to
`'vocabulary'`.

Core notes (BACKEND, 2026-09-28), additions to the table above:

- The first round starts on the first tick, with its gates `gateSpacing` ahead; each next round's
  gates are `gateSpacing` past the previous gates (a regular grid). A missed word returns at most
  once; `total` grows by one per return. Option ids are the ids of the words whose meanings the
  gates carry (the bot reads the right gate from them; `round.correctGate` stays null until chosen).
- Coins accrue during play: +5 at a first-try right gate, +10 per fireball at the boss (the sum is
  the formula above). `flightComplete` carries the total.
- Extra tuning in `TUNING`: `bossDistance` 40 m past the last gates (the dragon flies there at
  cruise speed, then stops), `fireballFirstMs` 1500, `fireballEveryMs` 700, `bossFallMs` 2000
  (the boss falls, then `flightComplete`). With fewer distinct meanings than gates, a round has
  fewer gates.
