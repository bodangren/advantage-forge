# Accept the P0 asset set

Status: completed. This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [x] Task: Select a bounded batch from the scope map.
- [x] Task: Record scale, palette, rig, clips, and game uses before generation.

## Phase 2: Acceptance checks

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch.
- [x] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [x] Task: Build missing sources and review existing sources in the batch.
- [x] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [x] Task: Record review evidence and export paths for every accepted asset.
- [x] Task: Update this plan and the scope records.
- [x] Task: Run measure/generate.sh and measure/doctor.sh.

## World catch-up (2026-10-01, track `asset_world_catchup_20261001`)

The world catch-up reviewed or reworked 19 assets of this family. 16 are accepted at their bar (P0 7.5, P1 7.0). Scores and notes are in [the catch-up evidence](../asset_world_catchup_20261001/evidence.md) and in `bench/sonnet/log.tsv`.

barrel 7.6, boulder 7.5, bridge 7.5, bush 7.5, campfire 7.5, chair 7.6, cottage 7.5, crate 7.6, key-iron 7.5, long-sword 7.0 (to the equipment-parts track), oak-tree 7.5, shop-stall 7.5, shortbow 7.0 (to the equipment-parts track), signpost 7.5, staff 7.2 (to the equipment-parts track), stone-floor 7.5, stone-wall 7.5, table 7.5, torch 7.5.

## Closeout (2026-10-02, track `asset_p0p1_closeout_20261002`)

The closeout reworked or reviewed the 8 rows of this family below their bar. 7 are at the bar: long-sword 7.5, shortbow 7.5, staff 7.5, iron-helmet 7.5; farmer 7.6, quest-giver 7.5, and horse 7.5 by the character rule. leather-armor reached 7.5 after three agent passes and an orchestrator pass (0109749, fit ok). All 54 P0 rows are at the bar. Scores and notes are in `bench/sonnet/log.tsv` (batch `closeout`) and in `docs/character-reviews.json`. Bars: P0 7.5, P1 7.0, characters 7.5 (owner decision of 2026-10-02).

## Completion (2026-10-02, track `asset_p0p1_completion_20261002`)

The completion track closed this family. All 54 P0 rows are at their bar. Each source has a current textured output,
sprites, and one strip for each clip, its last `./forge all` has no warnings, and the compiler finds no error in it. The five P0 maps are accepted at 7.5: blacksmith shop, forest (Old Oak Clearing), tavern, village, and dungeon (Sunken Vault).
The world catch-up, closeout, and completion tracks did the tasks above. Evidence: [the completion
evidence](../asset_p0p1_completion_20261002/evidence.md) and [the rebuild table](../asset_p0p1_completion_20261002/rebuilds.tsv).
