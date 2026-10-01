# Game roadmap

The 2D and 3D program owns local game design and the monorepo integration sequence.
The current platform uses one rules core with a three.js view and a Phaser view.
The [platform port](./tracks/game_platform_port_20260928/) and [model-pack generator](./tracks/game_model_packs_20260928/) unblock application integration.

At the September 29 audit, the sibling `reading-advantage-monorepo` checkout was on `apk3d-port` with uncommitted contract and runtime edits. The planned 3D packages were absent. The game port must keep those changes isolated and coordinate with their owners.

## Phase position

| Phase | Status | Measure owner |
| --- | --- | --- |
| A: dual-renderer platform | Local implementation delivered. | [Historical platform](./tracks/history_dual_renderer_20260928/) |
| A′: shared 2D art | Delivered for the initial pack. | [Asset delivery](./tracks/asset_delivery_20260928/) |
| B: six local 2D views | Complete according to the source plan. | [Six-game history](./tracks/history_six_games_20260928/) |
| C: monorepo port | In progress. Potion Rush starts the port. | [Platform port](./tracks/game_platform_port_20260928/) |
| D: legacy rewrites | Two cores are in progress. | Individual tracks below. |

## Initial six games

| Game | Track | Local views | Monorepo port |
| --- | --- | --- | --- |
| Potion Rush | [storm_castle_tower](./tracks/game_potion_rush_port_20260928/) | 2D and 3D recorded locally | In progress |
| Monster Encounters | [storm_castle_tower](./tracks/game_monster_encounters_port_20260928/) | 2D and 3D recorded locally | Pending |
| Dragon Flight | [storm_castle_tower](./tracks/game_dragon_flight_port_20260928/) | 2D and 3D recorded locally | Pending |
| Dungeon Liberator | [storm_castle_tower](./tracks/game_dungeon_liberator_port_20260928/) | 2D and 3D recorded locally | Pending |
| Devourer Slime | [storm_castle_tower](./tracks/game_devourer_slime_port_20260928/) | 2D and 3D recorded locally | Pending |
| Hero vs. Zombie | [storm_castle_tower](./tracks/game_hero_vs_zombie_port_20260928/) | 2D and 3D recorded locally | Pending |

[2D look and lobby parity](./tracks/game_2d_parity_20260928/) records fallback limits. [Thai content review](./tracks/game_thai_localization_20260928/) tracks generated gloss approval.

## Legacy rewrites

| Game | Family | Measure track | Status |
| --- | --- | --- | --- |
| Rune Match | Battle and board | [game_rune_match_20260928](./tracks/game_rune_match_20260928/) | In progress: core tests exist; 3D and Phaser views remain. |
| RPG Battle | Battle and board | [game_rpg_battle_20260928](./tracks/game_rpg_battle_20260928/) | New. |
| Paladins Twin Soul | Battle and board | [game_paladins_twin_soul_20260928](./tracks/game_paladins_twin_soul_20260928/) | New. |
| Labyrinth Goblin King | Arena | [game_labyrinth_goblin_king_20260928](./tracks/game_labyrinth_goblin_king_20260928/) | In progress: two local rules tests fail; views remain. |
| Astral Mage | arena | [game_astral_mage_20260928](./tracks/game_astral_mage_20260928/) | New. |
| Village Guardian | arena | [game_village_guardian_20260928](./tracks/game_village_guardian_20260928/) | New. |
| Haunted Library | arena | [game_haunted_library_20260928](./tracks/game_haunted_library_20260928/) | New. |
| Realm Carver | arena | [game_realm_carver_20260928](./tracks/game_realm_carver_20260928/) | New. |
| Shadow Gate Dungeon | arena | [game_shadow_gate_dungeon_20260928](./tracks/game_shadow_gate_dungeon_20260928/) | New. |
| Spellweavers Run | flight | [game_spellweavers_run_20260928](./tracks/game_spellweavers_run_20260928/) | New. |
| Griffin Sky Joust | flight | [game_griffin_sky_joust_20260928](./tracks/game_griffin_sky_joust_20260928/) | New. |
| Gryphon Patrol | flight | [game_gryphon_patrol_20260928](./tracks/game_gryphon_patrol_20260928/) | New. |
| Dragon Rider | flight | [game_dragon_rider_20260928](./tracks/game_dragon_rider_20260928/) | New. |
| Griffin Riders Escape | flight | [game_griffin_riders_escape_20260928](./tracks/game_griffin_riders_escape_20260928/) | New. |
| Magic Defense | flight | [game_magic_defense_20260928](./tracks/game_magic_defense_20260928/) | New. |
| Abyssal Well | aim | [game_abyssal_well_20260928](./tracks/game_abyssal_well_20260928/) | New. |
| Archers Revenge | aim | [game_archers_revenge_20260928](./tracks/game_archers_revenge_20260928/) | New. |
| Castle Defense | aim | [game_castle_defense_20260928](./tracks/game_castle_defense_20260928/) | New. |
| Alchemists Synthesis | build | [game_alchemists_synthesis_20260928](./tracks/game_alchemists_synthesis_20260928/) | New. |
| Enchanted Library | build | [game_enchanted_library_20260928](./tracks/game_enchanted_library_20260928/) | New. |
| Rune Forge Chamber | build | [game_rune_forge_chamber_20260928](./tracks/game_rune_forge_chamber_20260928/) | New. |
| Sorcerer Ziggurat | build | [game_sorcerer_ziggurat_20260928](./tracks/game_sorcerer_ziggurat_20260928/) | New. |
| Storm Castle Tower | build | [game_storm_castle_tower_20260928](./tracks/game_storm_castle_tower_20260928/) | New. |

## Family order

1. Battle and board uses the Monster Encounters stage and Card2D.
2. Arena uses shared movement, Arena2D, and Joystick2D.
3. Flight and run uses the Dragon Flight scroller and land plan.
4. Aim and shoot needs a target control and clear feedback.
5. Build and climb reuses Potion Rush sorting where the rules fit.

## Acceptance limits

Local presence does not establish port completion. Each port needs application contracts, catalog registration, input checks, content, evidence, screenshots, and a pull request.
The initial 2D pack contains the default hero look. The 3D lobby requires WebGL2.
The story plan flags generated Thai glosses for human review before the application port.
The neighboring checkout also contains unrelated temporary files. Review its exact diff before integration.
Labyrinth wall clearance is defined. Door and water interaction behavior remains with the game layer.

Keep each game's design document at its current path. Use the [plan crosswalk](./plan-crosswalk.md) to resolve the original specifications.
