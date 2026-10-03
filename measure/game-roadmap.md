# Game roadmap

The 2D and 3D program owns local game design and the monorepo integration sequence.
The current platform uses one rules core with a three.js view and a Phaser view.
The [platform port](./tracks/game_platform_port_20260928/) and [model-pack generator](./tracks/game_model_packs_20260928/) unblock application integration.

**Audit of 3 October 2026.** A code, test, and git audit replaced the earlier track counts. All eight demo games (the six initial games, Labyrinth, and Rune Match) have a rules core, a three.js view, a Phaser view, a QC bot, and a registry entry in `src/host/registry.ts`. Their tests pass (Potion Rush, Monster Encounters, Dragon Flight, and Dungeon Liberator: 188; Devourer Slime 40, Hero vs. Zombie 43, Labyrinth 89, Rune Match 140). No agent ran a browser for the audit. No game has a Thai strings file; Thai read-aloud lives in `src/host/reader.ts`.

The sibling `reading-advantage-monorepo` is on `apk3d-port`. It holds all 29 games as 2D Phaser cartridges in `packages/game-cartridges`. It has no three.js code, no model-pack package, and no renderer selection. The uncommitted edits there add a Primary story input mode (`GameInput`, `story-input.ts`). They are not 3D port work. The 12 commits of the branch are www work. The port must keep those edits isolated and coordinate with their owners.

The 3D model pack generator was missing at the audit. Games loaded 87 simplified GLBs from `demo/public/models/` by path. The [model pack track](./tracks/game_model_packs_20260928/) records the generator work.

## Phase position

| Phase | Status | Measure owner |
| --- | --- | --- |
| A: dual-renderer platform | Local implementation delivered. | [Historical platform](./tracks/history_dual_renderer_20260928/) |
| A′: shared 2D art | Delivered for the initial pack. | [Asset delivery](./tracks/asset_delivery_20260928/) |
| B: six local 2D views | Complete. The audit confirmed 2D and 3D views and passing tests. | [Six-game history](./tracks/history_six_games_20260928/) |
| C: monorepo port | Built on a local branch (`apk3d-games-port`, worktree `reading-advantage-monorepo-3d`, not pushed): kit package `advantage-play-kit-3d`, games package `game-cartridges-3d` with 29 games (the eight initial games and 21 legacy rewrites), the Primary Advantage story route, and the completion mapping. Open: pull request, deployment, device checks. | [Platform port](./tracks/game_platform_port_20260928/) and the monorepo track `apk3d_games_port_20261003` |
| D: legacy rewrites | All 21 games are built locally and ported into the monorepo package on 3 October 2026. Open: real-device checks and layout tuning. `babel-architect` has no cartridge. | Individual tracks below. |

## Initial six games

| Game | Track | Local views | Monorepo port |
| --- | --- | --- | --- |
| Potion Rush | [storm_castle_tower](./tracks/game_potion_rush_port_20260928/) | Built locally and tested (audit 2026-10-03) | Not started |
| Monster Encounters | [storm_castle_tower](./tracks/game_monster_encounters_port_20260928/) | Built locally and tested (audit 2026-10-03) | Pending |
| Dragon Flight | [storm_castle_tower](./tracks/game_dragon_flight_port_20260928/) | Built locally and tested (audit 2026-10-03) | Pending |
| Dungeon Liberator | [storm_castle_tower](./tracks/game_dungeon_liberator_port_20260928/) | Built locally and tested (audit 2026-10-03) | Pending |
| Devourer Slime | [storm_castle_tower](./tracks/game_devourer_slime_port_20260928/) | Built locally and tested (audit 2026-10-03) | Pending |
| Hero vs. Zombie | [storm_castle_tower](./tracks/game_hero_vs_zombie_port_20260928/) | Built locally and tested (audit 2026-10-03) | Pending |

[2D look and lobby parity](./tracks/game_2d_parity_20260928/) records fallback limits. [Thai content review](./tracks/game_thai_localization_20260928/) tracks generated gloss approval.

## Legacy rewrites

| Game | Family | Measure track | Status |
| --- | --- | --- | --- |
| Rune Match | Battle and board | [game_rune_match_20260928](./tracks/game_rune_match_20260928/) | Built locally: core, 3D view, Phaser view, 140 passing tests, and a headless browser check (2026-10-02). The thin Phaser view and the 12-line QC bot remain. The monorepo already has a 2D cartridge; the dual-view port is open. |
| RPG Battle | Battle and board | [game_rpg_battle_20260928](./tracks/game_rpg_battle_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Paladins Twin Soul | Battle and board | [game_paladins_twin_soul_20260928](./tracks/game_paladins_twin_soul_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Labyrinth Goblin King | Arena | [game_labyrinth_goblin_king_20260928](./tracks/game_labyrinth_goblin_king_20260928/) | Built locally: 89 passing tests, 3D and Phaser views checked in software GL (2026-10-02). A touch-device check and the monorepo port remain. |
| Astral Mage | arena | [game_astral_mage_20260928](./tracks/game_astral_mage_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Village Guardian | arena | [game_village_guardian_20260928](./tracks/game_village_guardian_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Haunted Library | arena | [game_haunted_library_20260928](./tracks/game_haunted_library_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Realm Carver | arena | [game_realm_carver_20260928](./tracks/game_realm_carver_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Shadow Gate Dungeon | arena | [game_shadow_gate_dungeon_20260928](./tracks/game_shadow_gate_dungeon_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Spellweavers Run | flight | [game_spellweavers_run_20260928](./tracks/game_spellweavers_run_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Griffin Sky Joust | flight | [game_griffin_sky_joust_20260928](./tracks/game_griffin_sky_joust_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Gryphon Patrol | flight | [game_gryphon_patrol_20260928](./tracks/game_gryphon_patrol_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Dragon Rider | flight | [game_dragon_rider_20260928](./tracks/game_dragon_rider_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Griffin Riders Escape | flight | [game_griffin_riders_escape_20260928](./tracks/game_griffin_riders_escape_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Magic Defense | flight | [game_magic_defense_20260928](./tracks/game_magic_defense_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Abyssal Well | aim | [game_abyssal_well_20260928](./tracks/game_abyssal_well_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Archers Revenge | aim | [game_archers_revenge_20260928](./tracks/game_archers_revenge_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Castle Defense | defense | [game_castle_defense_20260928](./tracks/game_castle_defense_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Alchemists Synthesis | build | [game_alchemists_synthesis_20260928](./tracks/game_alchemists_synthesis_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Enchanted Library | build | [game_enchanted_library_20260928](./tracks/game_enchanted_library_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Rune Forge Chamber | build | [game_rune_forge_chamber_20260928](./tracks/game_rune_forge_chamber_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Sorcerer Ziggurat | build | [game_sorcerer_ziggurat_20260928](./tracks/game_sorcerer_ziggurat_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |
| Storm Castle Tower | build | [game_storm_castle_tower_20260928](./tracks/game_storm_castle_tower_20260928/) | Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning. |

## Family order

1. Battle and board uses the Monster Encounters stage and Card2D.
2. Arena uses shared movement, Arena2D, and Joystick2D.
3. Flight and run uses the Dragon Flight scroller and land plan.
4. Aim and shoot needs a target control and clear feedback.
5. Build and climb reuses Potion Rush sorting where the rules fit.

## Acceptance limits

Local presence does not establish port completion. The monorepo holds 2D cartridges for all 29 games, so a port replaces or extends an existing cartridge. Each port needs application contracts, catalog registration, input checks, content, evidence, screenshots, and a pull request.
The initial 2D pack contains the default hero look. The 3D lobby requires WebGL2.
The story plan flags generated Thai glosses for human review before the application port.
The neighboring checkout also contains unrelated temporary files. Review its exact diff before integration.
Labyrinth wall clearance is defined. Door and water interaction behavior remains with the game layer.

Keep each game's design document at its current path. Use the [plan crosswalk](./plan-crosswalk.md) to resolve the original specifications.
