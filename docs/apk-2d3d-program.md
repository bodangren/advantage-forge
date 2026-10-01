# The APK 2D and 3D program

> Measure owns execution status. See the [track crosswalk](../measure/plan-crosswalk.md).
> This document retains its original design and historical notes.

Status: plan, 2026-09-28. Owner goal (verbatim): "1. to create 2D fallbacks (old hardware) for all
games using the sprites we have created from the 3D assets. 2. I want us to start porting the 3D
games into the monorepo with the new 3D APK platform. 3. I want to completely rewrite all current
2D game cartridges as both 2D and 3D (improve gameplay and logic while you're at it)."

Owner decisions (2026-09-28):
- Every game is APK-compliant. The 2D view is Phaser (the APK's 2D engine, 4.2.1).
- The monorepo is alpha except the www site. Find the blast radius of each change (tests and
  `repo-graph`) and fix it. No other agent works in the monorepo.
- One design language for 2D and 3D: forge sprites first; legacy PNGs (advantage-games) or
  EvlGames assets only when necessary; legacy map backgrounds are inspiration for maps.
- The order of the games is ours to choose.
- Roles: Fable does the hardest backend work (platform, contracts, rules cores, the monorepo
  port); Claude does the views (2D and 3D), sprites, game design, and QC.

## The shape

One game = one rules core (a `Simulation`) + a 3D view (three.js, `createGame`) + a 2D view
(Phaser, the APK `createGameConfig`). The device check picks 3D when the device can run it and
2D otherwise; a player setting can force 2D. Both views read the same core and the same catalog.

## Phases

| Phase | Work | Owner |
| --- | --- | --- |
| A | Platform: the dual-renderer cartridge (2D Phaser path beside 3D), the standalone Phaser factory, 2D sprite packs in the APK asset format, the renderer choice; task 11 (Monster Encounters core as a `Simulation`), task 13 (model packs, without new hash fields: monorepo hashing policy), task 20 (`docs/apk-port.md` with the repo-graph blast radius) | Fable |
| A' | The forge sprite pipeline for 2D: characters (exists), props and floor tiles at the same camera, packed as Phaser sprite sheets | Claude |
| B | 2D views for the six 3D games (Potion Rush first) | Claude |
| C | Port the platform and Potion Rush (2D + 3D) into the monorepo as the pattern | Fable (platform), Claude (views, QC) |
| D | The other games: each rewritten as core + 3D view + 2D view, then ported; tested, committed, pushed one game at a time | Fable (cores), Claude (design, views) |

Phase A progress (2026-09-28, Fable): the dual-renderer contract, the renderer choice, the
standalone Phaser factory and mounter, the 2D asset contract (APK copies), task 11, task 13
(model packs without a hash field), and `docs/apk-port.md` are done; see the "Dual renderer"
section of `docs/apk3d-cartridge.md`. The host UI wiring (renderer setting, 2D editions) is
Claude's, with the first 2D view.

Phase A' and the host wiring are done (2026-09-28). The 2D art is one APK sprite pack,
`primary-chibi-2d` (98 files, 4.5 MB): 16 characters and 7 props rendered by the forge at one
camera (elevation 45 degrees, 64 px/m; `scripts/apk2d-sprites.ts`), and 4 game backgrounds baked
from the 3D set code (`scripts/apk2d-bake.ts`), packed by `scripts/apk2d-pack.ts`. The kit has
2D helpers in `src/apk3d/view2d/` (projection, sheets, `Actor2D`, HUD pieces). The host mounts
either renderer through `createCartridgeMounter`: a "2D mode (older phones)" setting or
`?renderer=phaser` forces 2D, and a device without WebGL2 gets no 3D stage and plays in 2D. QC:
`scripts/apk3d-shot.ts --2d`.

Phase B is done (2026-09-28): all six games have a 2D view. Each QC run in 2D uses real input on
the canvas: a touch drag (Potion Rush, the arena games), a tap on a gate tag (Dragon Flight), and
taps on the challenge card for every answer (Monster Encounters). Known limits: the 2D sprites
show each hero's default look only (the unlocked color presets are 3D textures); the 3D lobby
behind the selector needs WebGL2 (a device without it gets the selector on a plain background).

## Tracker

| Game | Core | 3D view | 2D view | In the monorepo |
| --- | --- | --- | --- | --- |
| Monster Encounters | done (task 11, 2026-09-28) | done | done (2026-09-28): the vault hall baked with the battle's cutaway; `Card2D` for choices, sentence order, and feedback | |
| Potion Rush | done | done | done (2026-09-28): 480-wide canvas at the screen aspect, real touch drag in QC | |
| Dragon Flight | done | done | done (2026-09-28): a vertical scroller at the shared camera, land props in the 3D view's chunks | |
| Dungeon Liberator | done | done | done (2026-09-28): shared `Arena2D` camera, `Joystick2D`, word panel | |
| Devourer Slime | done | done | done (2026-09-28): the view zooms out as the slime grows | |
| Hero vs. Zombie (wizard-vs-zombie) | done | done | done (2026-09-28): night tint on sprites, dawn light, Blast ring | |
| abyssal-well, alchemists-synthesis, archers-revenge, astral-mage, castle-defense, dragon-rider, enchanted-library, griffin-riders-escape, griffin-sky-joust, gryphon-patrol, haunted-library, labyrinth-goblin-king, magic-defense, paladins-twin-soul, realm-carver, rpg-battle, rune-forge-chamber, rune-match, shadow-gate-dungeon, sorcerer-ziggurat, spellweavers-run, storm-castle-tower, village-guardian | | | | legacy 2D |

## Phase D order (by mechanic family)

The legacy games fall into five families. Each family shares one 3D stage and one 2D kit piece,
so the order builds a family's first game, then its neighbors, which reuse the view code. The
rules change the same way in every rewrite: no timer that decides a result, no game over (a
setback is courage or a rest), speed never gives XP, and one evidence item per story item.

| Order | Family | Games (legacy id) | Shared pieces |
| --- | --- | --- | --- |
| 1 | Battle and board: a word decides a hero's action | rune-match (design done, core in progress), rpg-battle, paladins-twin-soul | the Monster Encounters stage, `Card2D` |
| 2 | Arena: steer a hero, reach words in sentence order | labyrinth-goblin-king, astral-mage, village-guardian, haunted-library, realm-carver, shadow-gate-dungeon | the arena helpers of `src/apk3d/sim`, `Arena2D`, `Joystick2D` |
| 3 | Flight and run: choose a lane or a gate while the world scrolls | spellweavers-run, griffin-sky-joust, gryphon-patrol, dragon-rider, griffin-riders-escape, magic-defense | the Dragon Flight scroller and land plan |
| 4 | Aim and shoot: point at the right word | archers-revenge, abyssal-well, castle-defense | a new aim control (drag to aim, release to shoot) |
| 5 | Build and climb: place or climb words in order | alchemists-synthesis, enchanted-library, rune-forge-chamber, sorcerer-ziggurat, storm-castle-tower | the Potion Rush sorting pattern |

A family's first game needs a design (Claude), a core (Fable), and both views (Claude); the next
games of the family need a design and a core, and their views reuse the family's pieces.
