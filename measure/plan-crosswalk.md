# Plan crosswalk

Measure owns execution status. Existing documents retain their design details and paths.
The scope map assigns every asset target and scene blueprint to one current track.

## Asset plans

| Existing source | Measure owner | Treatment |
| --- | --- | --- |
| [Production catalog](../docs/fantasy-world-asset-catalog.md) | [Asset roadmap](./asset-roadmap.md) | P0 acceptance, family production, companion media, and engine planning |
| [Asset targets](../docs/fantasy-world-asset-catalog.tsv) | [Scope map](./scope-map.tsv) | All 856 IDs have an owner. |
| [Scene blueprints](../docs/fantasy-world-scene-blueprints.tsv) | [Scope map](./scope-map.tsv) | All 100 IDs have an owner. |
| [Overnight work](../bench/overnight/PLAN.md) | [Production controls](./tracks/asset_production_controls_20260928/) and family tracks | Queues remain execution inputs. |
| [Overnight results](../bench/overnight/log.tsv) | [Rework history](./history.md) and acceptance tracks | Scores remain evidence, not automatic acceptance. |
| [Dungeon review plan](../bench/trials/dungeon-env/REVIEW-PLAN.md) | [Adventure scenes](./tracks/asset_scenes_adventure_20260928/) | Review and fit requirements remain active. |
| [Dungeon fit check](../docs/dungeon-mockups/fit-check.md) | [Adventure scenes](./tracks/asset_scenes_adventure_20260928/) and game roadmap | Geometry and game-layer requirements remain separate. |
| [Hamlet mockups](../docs/hamlet-mockups/README.md) and [assembly notes](../docs/hamlet-assembly-notes.md) | [Settlement scenes](./tracks/asset_scenes_settlements_20260928/) | Reconcile source, assembly, and acceptance. |
| [Village construction](../docs/village-mockups/construction.md) | [Settlement scenes](./tracks/asset_scenes_settlements_20260928/) | Preserve reusable hamlet components. |
| [Forest mockups](../docs/forest-mockups/README.md) | [Wilderness scenes](./tracks/asset_scenes_wilderness_20260928/) | Reconcile reference and assembled scene. |
| [Tavern construction](../docs/tavern-mockups/construction.md) | [Civic scenes](./tracks/asset_scenes_civic_20260928/) | Preserve kit dimensions and review criteria. |
| [Blacksmith construction](../docs/blacksmith-mockups/construction.md) | [Civic scenes](./tracks/asset_scenes_civic_20260928/) | Review the final assembly and components. |
| [Color variants](../docs/color-variants.md) | [Asset delivery](./tracks/asset_delivery_20260928/) | Preserve the source and consumer contracts. |
| [Forge Bench](../bench/README.md) | [Production controls](./tracks/asset_production_controls_20260928/) and rework history | Preserve trial provenance and comparisons. |
| [README scope](../README.md) | [Engine backlog](./tracks/asset_engine_backlog_20260928/) | Reconcile deferred capability claims before implementation. |

Each mockup directory retains its component TSV files.
These lists define scene instances. The production catalog defines reusable targets.
The scene tracks own unresolved differences between those lists and current artifacts.

## Game plans

The [game roadmap](./game-roadmap.md) maps every initial game and all 23 legacy IDs to individual tracks.

| Existing source | Measure owner | Treatment |
| --- | --- | --- |
| [2D and 3D program](../docs/apk-2d3d-program.md) | [Game roadmap](./game-roadmap.md) | Preserve phases A, A′, B, C, and D. |
| [Progression program](../docs/chibi-quest-progression.md) | [Avatar system track](./tracks/avatar_system_20261001/) | Program plan: XP, GP, avatars, Guild Mode, the battle. |
| [Avatar system spec](../docs/avatar-system.md) | [Avatar system track](./tracks/avatar_system_20261001/) | Phase 1 scope; monorepo and Guild Mode phases get their own tracks. |
| [APK platform design](../docs/apk3d-cartridge.md) | [Platform port](./tracks/game_platform_port_20260928/) and [model packs](./tracks/game_model_packs_20260928/) | Separate delivered contracts from remaining integration. |
| [Monorepo port](../docs/apk-port.md) | [Platform port](./tracks/game_platform_port_20260928/) | Preserve package paths, dependency order, and verification scope. |
| [Monster Encounters](../docs/demo-monster-encounters.md) | [Monster Encounters port](./tracks/game_monster_encounters_port_20260928/) and historical tracks | Preserve learning rules and demo evidence. |
| [Potion Rush design](../docs/game-potion-rush-3d.md) | [Potion Rush port](./tracks/game_potion_rush_port_20260928/) | Preserve sorting rules and score distinctions. |
| [Dragon Flight design](../docs/game-dragon-flight-3d.md) | [Dragon Flight port](./tracks/game_dragon_flight_port_20260928/) | Preserve lane and gate behavior. |
| [Dungeon Liberator design](../docs/game-dungeon-liberator-3d.md) | [Dungeon Liberator port](./tracks/game_dungeon_liberator_port_20260928/) | Preserve sentence-order rules. |
| [Devourer Slime design](../docs/game-devourer-slime-3d.md) | [Devourer Slime port](./tracks/game_devourer_slime_port_20260928/) | Preserve growth and camera behavior. |
| [Hero vs. Zombie design](../docs/game-hero-vs-zombie-3d.md) | [Hero vs. Zombie port](./tracks/game_hero_vs_zombie_port_20260928/) | Preserve arena and learning behavior. |
| [Rune Match design](../docs/game-rune-match-3d.md) | [Rune Match](./tracks/game_rune_match_20260928/) | Core work exists; views and integration remain. |
| [Labyrinth design](../docs/game-labyrinth-3d.md) | [Labyrinth](./tracks/game_labyrinth_goblin_king_20260928/) | Repair core checks before view acceptance. |

## Future plans

Create a Measure track before implementing new scope.
Preserve existing reference paths when adding the track.
Add new catalog or blueprint IDs to the scope map.
Update this crosswalk when a new design document becomes an execution input.
Historical status paragraphs remain historical evidence after migration.
