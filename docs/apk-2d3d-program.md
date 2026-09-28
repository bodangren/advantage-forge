# The APK 2D and 3D program

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

## Tracker

| Game | Core | 3D view | 2D view | In the monorepo |
| --- | --- | --- | --- | --- |
| Monster Encounters | done (task 11, 2026-09-28) | done | | |
| Potion Rush | done | done | | |
| Dragon Flight | done | done | | |
| Dungeon Liberator | done | done | | |
| Devourer Slime | done | done | | |
| Hero vs. Zombie (wizard-vs-zombie) | done | done | | |
| abyssal-well, alchemists-synthesis, archers-revenge, astral-mage, castle-defense, dragon-rider, enchanted-library, griffin-riders-escape, griffin-sky-joust, gryphon-patrol, haunted-library, labyrinth-goblin-king, magic-defense, paladins-twin-soul, realm-carver, rpg-battle, rune-forge-chamber, rune-match, shadow-gate-dungeon, sorcerer-ziggurat, spellweavers-run, storm-castle-tower, village-guardian | | | | legacy 2D |
