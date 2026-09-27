# Dungeon Liberator 3D: game design

Status: design, 2026-09-28 (Claude, FRONTEND). The rules core follows section 6 (BACKEND). Source
game: `../advantage-games/src/lib/games/dungeonLiberator.ts` and
`src/components/games/sentence/dungeon-liberator/`.

## 1. The game in one paragraph

The Knight (in the student's colors) walks into a room of the Sunken Vault. Villagers are
trapped there, and each one holds a word of a sentence from the story. The Knight frees them in
the order of the sentence: the right villager cheers and follows in a line behind the Knight; a
villager out of order shakes their head and steps back. Skeletons patrol the room. When the whole
sentence follows the Knight, the gate glows, and the Knight leads the line out. Each room is one
sentence.

## 2. What stays from the 2D game

| 2D rule | 3D |
| --- | --- |
| prisoners with the words of a sentence, spread over the room | the same; villager models with word tags |
| touch them in order; the right one joins a trail behind the player | the same (the line follows the Knight's path) |
| a prisoner out of order flees for a moment | the same (1.5 s, then back to their spot) |
| monsters bounce around the room | skeletons patrol and bounce off the walls |
| a monster that touches the trail scatters the trail from that point | the same: those villagers run back to their spots |
| all words, then the portal | all words, then the gate |

## 3. What changes (owner decisions and the reading guardrails)

| 2D | 3D | Why |
| --- | --- | --- |
| 3 lives; a monster hit costs a life; 0 lives is a defeat | a skeleton that touches the Knight pushes the Knight back and scatters the line; no lives, no defeat | no game over |
| monster speed grows by 20% per level | skeletons: 1 in Helper mode, 2 otherwise, +1 from the third room (at most 3); speed grows 10% per room (at most +30%) | movement skill must not decide the reading result |
| endless levels | a shift of up to 5 rooms (the story's sentences of 3 to 7 words) | a clear goal, about 4 to 6 minutes |

## 4. Screen and camera

- A steep follow camera above and behind the Knight (a room is 11 m x 9 m; portrait sees about
  9 m across at the Knight's depth).
- Word tags over the villagers (HTML). The sentence shows at the top as blanks that fill in as
  villagers join ("Pip is ___ ___"); in Helper mode, the next word's villager has a glow ring.
- Controls: hold and drag anywhere to walk toward the finger (a floating joystick); on a
  computer, WASD or the arrow keys.

## 5. Scene and models

| Part | Model |
| --- | --- |
| the Knight | `knight` (the student's preset), `walk`/`run`/`idle`, `victory` |
| villagers | `villager`, `farmer`, `innkeeper`, `druid`, `guard` (`wave` or `salute` when freed, `talk` when out of order) |
| skeletons | `skeleton` (`walk`), `attack` when they bump the Knight |
| the room | vault kit: `floor`, `floor-cracked`, `wall`, `wall-corner`, `pillar`, `cell-bars`, `hanging-cage`, `torch-sconce`, `bone-pile`, `chains`, `gate` (the exit) |

## 6. Rules core (BACKEND)

A `Simulation` in `src/games/dungeon-liberator/core` (real-time, fixed step), built on the shared
arena helpers (`src/apk3d/sim/arena.ts`, see the note below). Positions are meters on the room
floor (x to the right, z toward the camera); the room is `[-5.5, 5.5] x [-4.5, 4.5]`, the gate at
`(0, -4.5)`.

| Command | Meaning |
| --- | --- |
| `{ type: 'steer', x, z }` | the walk direction, length 0 to 1 (0 = stop); it holds until the next steer |

| Event | Payload |
| --- | --- |
| `roomStarted` | roomId, sentenceId, words, villagers `{ id, word, index, kind, x, z }[]`, skeletons `{ id, x, z }[]` |
| `villagerFreed` | id, index (joins the line) |
| `villagerRefused` | id (out of order; steps back for 1.5 s) |
| `lineScattered` | ids (back to their spots), by: 'skeleton-line' or 'skeleton-knight' |
| `knightBumped` | skeletonId (pushed back, 0.8 s without control) |
| `gateOpened` | roomId |
| `roomCleared` | roomId, sentenceId |
| `shiftComplete` | rooms |

State the view reads: `knight { x, z, facing, bumpedMs }`, `villagers[]` (id, word, index, kind,
x, z, home x/z, following, refusedMs), `line` (ids in order), `next` (index), `skeletons[]`
(id, x, z, vx, vz), `gateOpen`, `room`, `rooms`, `phase` ('playing' | 'complete').

Tuning: Knight 3.2 m/s; skeletons 1.4 m/s (+10% per room, at most +30%); radii Knight 0.4,
villager 0.35, skeleton 0.45; line spacing 0.8 m; villagers at least 1.6 m apart and 2 m from the
Knight's start.

Evidence: one item per sentence (`itemKind: 'sentence'`), attempts = refusals + 1,
`correctFirstTry` = no refusal. Scatters by skeletons are not reading errors and do not count.

Shared arena note (Claude's suggestion; the core engineer decides): pure helpers for 2D movement
on a floor (step a mover with clamping to bounds, bounce off bounds, circle contact, seeded spread
of points with minimum distances, a follow-the-leader line) serve this game, Devourer Slime, and
later games (Wizard vs Zombie, Labyrinth). They fit `src/apk3d/sim` (pure, no DOM).

Core notes (BACKEND, 2026-09-28): the shift list is `shift` (`RoomSentence[]`: id, roomId,
text, words, paragraph, refusals, started, cleared); `room` is the zero-based index and `rooms`
the count. Extra state: `steer` (the held command), `path` (the Knight's recent path the line
follows), `graceMs`, `freed`, `roomsCleared`; a villager also has `returning` (running home
after a scatter or a refusal; not touchable) and `contact` (the Knight overlaps it). Rules the
tests fixed: a touch counts only when the Knight *enters* contact while in control, so a pushed
Knight or one parked on a spot a villager returns to never causes a refusal; for 1 s after a
scatter (`graceMs`) a touch out of order is ignored, because the next word just changed under
the Knight's feet; with the gate open the skeletons bump and scatter nothing (the light keeps
them off), so the walk to the gate is safe. `scoreOf` = 10 per freed villager + 50 per cleared
room. Shared arena helpers live in `src/apk3d/sim/arena.ts` (`stepMover`, `clampToRect`,
`clampToCircle`, `bouncePatroller`, `circlesTouch`, `spreadPoints`, `recordPath`,
`followLeader`, `steerAround`).
