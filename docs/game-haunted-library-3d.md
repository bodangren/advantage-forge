# Haunted Library 3D

Rewrite of the legacy `haunted-library` (monorepo `packages/game-cartridges/src/haunted-library.ts`) as a dual-renderer cartridge. Same structure as Village Guardian and Labyrinth: a pure core, a three.js view, and a Phaser view.

## What the game is

The student climbs a four-floor library. Each room is one sentence from the story. Each word is on a door, on a random floor. The student opens the doors in sentence order. Ghosts patrol the floors, and a wrong door lets a bat out. A pad at both ends of a floor bounces the hero up one floor. The Down button drops one floor.

## Rules (core, `src/games/haunted-library/core`)

- Input: a `StoryInput` (or an APK `SentenceInput`). A room takes a sentence of 3 to 7 words. A visit is up to 5 rooms in a seeded order.
- World: floor `x` in [-5.5, 5.5] m, four floors (0 to 3). Pads cover `|x| >= 4.7`. Doors stand in `|x| <= 4.2`, 2.2 m apart on a floor.
- Commands: `move` (held direction), `drop` (down one floor), `open` (nearest door on this floor within 1 m).
- Right door: opens, +100 score, stuns ghosts on its floor within 2.5 m for 2 s.
- Wrong door: one reading attempt, -1 courage, a bat comes out (at most 3 bats; the oldest leaves).
- A ghost or bat touch: -1 courage, a knock-back, 1.2 s of protection. It is not a reading error.
- No courage left: the team rests, returns to the entrance with full courage, and the bats leave. There is no game over and no timer.
- Evidence: one `sentence` item per room the student touched; `attempts` = wrong doors + 1; `solved` = the room is cleared. Speed never gives XP.

Differences from the legacy game: three lives and defeat become courage and a rest (owner rule); the jump physics of the D-pad become a held walk plus automatic pad bounces and a drop command (a touch joystick and two buttons work on a phone); bats are limited to 3.

## Views

- 3D (`view/`): the library from the potion shop and dungeon kits (`wood-floor`, `plaster-wall`, `shelf`, `torch-sconce`, `candle-cluster`, `chandelier`, `lantern`, `door`). Ghosts are see-through `skeleton` models, bats are `giant-bat`. Word tags are HTML (Thai works) and pin to the screen edge when off screen.
- 2D (`view2d/`): the floors are drawn as four bands seen from the 2D camera (the nearest floor at the bottom); sprites come from `primary-chibi-2d` (`knight/wizard/cleric`, `skeleton`, `giant-bat`).
- The QC bot (`qc/bot.ts`) uses only the public commands. It goes to the floor of the next door, walks to it, and opens it.
