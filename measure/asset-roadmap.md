# Asset roadmap

The production catalog remains at its existing path. Measure owns execution status and acceptance.

## Current position

The migration baseline contains 426 source files.
Filename matching covers 407 of 856 catalog rows: P0 54/54, P1 345/450, P2 8/304, and P3 0/48.
These counts describe source coverage only.
The generated inventory provides current counts after regeneration.

## World catch-up (2026-10-01)

The [world catch-up](./tracks/asset_world_catchup_20261001/) brought every P0 and P1 world asset in scope to its bar (P0 7.5, P1 7.0): 117 accepted, including 33 ground tiles rebuilt as 0.3 m slabs with the top at y = 0.
Six equipment items (long-sword, shortbow, staff, belt-pouch, gauntlets, halberd) moved to the [equipment parts](./tracks/asset_equipment_parts_20260930/) track.
Three characters stay deferred: wood-golem, cliff-face, and key-skeleton.
The owner decision of 2026-10-01: finish all P0 and P1 assets, including the equipment parts, before P2, because the platform starts with mini-games.

## Priorities

| Order | Work | Owning track |
| --- | --- | --- |
| 1 | Repair type errors and import gates | [Asset quality](./tracks/asset_quality_20260928/) |
| 2 | Accept the existing P0 set | [P0 acceptance](./tracks/asset_p0_acceptance_20260928/) |
| 3 | Finish P1 by family | The six P1 tracks in the registry |
| 4 | Reconcile exports and game packs | [Asset delivery](./tracks/asset_delivery_20260928/) |
| 5 | Produce P2 batches by demand | Items, monsters, NPCs, and wildlife tracks |
| 6 | Produce P3 batches by demand | Vehicles and effects tracks |

Every catalog row has an owner in the [scope map](./scope-map.tsv).
The P1 family tracks own existing acceptance and missing sources.
The remaining queues select batches; they do not replace track plans.

## Immediate production handoff

The overnight wrap-up records three regular queue rows and 19 held rows.
It also records four external trials: giant-crystal, palm-tree, silo, and wall-gate.
Their results need review before any source enters this repository.
Samurai has a reference, but no source at the migration baseline.
Provider quota messages are historical observations, not current availability checks.

## Scenes

Four tracks own the 100 blueprint rows: settlements, civic places, adventure sites, and wilderness scenes.
Existing sources cover examples and review scenes, not seven accepted catalog blueprints.
Hamlet, dungeon, forest, tavern, blacksmith, and village references need status reconciliation.
The original blueprint statuses lag behind these artifacts.

## Acceptance and expansion

Use the Forge review loop for every batch.
Record scale, materials, clips, source revision, output paths, and review results.
Keep game-layer behavior separate from asset geometry.
The companion-media and engine-backlog tracks own documented future planning outside the model catalog.
