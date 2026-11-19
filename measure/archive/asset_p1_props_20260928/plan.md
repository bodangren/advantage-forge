# Complete P1 props

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

## Rework batch A (Sonnet 5.5 run 4, 2026-09-30): sub-7 grafted props by scene

The overnight log lists 98 grafted assets under 7. The orchestrator spot-checks the current
render before any rework: quench-tub, rope-coil, coal, grinding-wheel, forge and treasure-pile
read at 7 now and stay. Reworks go to `forge-sonnet-medium` with a written brief in
`bench/sonnet/briefs/<name>-rework.md` (construction recipe, size, palette, checks), one to
two props per agent. Bar 7. Log `bench/sonnet/log.tsv` (batch `run4`), state `bench/sonnet/state.tsv`.
- Blacksmith set: bellows (boxy, small), saw (thin blade, no teeth), tongs (two sausages, no jaws).
- Dungeon set: gibbet (cage the size of a lantern), spike-trap (bed of nails; the mockup is four
  blocks with one spike each and a center plate), stalactite (lumpy slab, ribbed drips; tracked
  under nature).
- Accepted (2026-09-30 21:18 to 22:15): bellows 7.3, saw 7.0, tongs 7.2, gibbet 7.2, spike-trap 7.3,
  stalactite 7.2, pit-trap 7.2, magic-rune 7.2 (medium agents); torch 7.0, distillation-flask 7.2,
  kiln 7.0 (orchestrator material fixes: bright emissive base, solid hue-matched glass, recessed fire).
- Spot-checked and kept without rework: quench-tub, rope-coil, coal, grinding-wheel, forge,
  treasure-pile, trapdoor, tent, obelisk, fishing-net, ritual-circle, mortar-pestle, switch, rug.
- Lesson: the overnight scores are stale for about half of the list. A spot-check of the current
  render before each brief avoided about 20 needless reworks.

## World catch-up (2026-10-01, track `asset_world_catchup_20261001`)

The world catch-up reviewed or reworked 36 assets of this family. 36 are accepted at their bar (P0 7.5, P1 7.0). Scores and notes are in [the catch-up evidence](../asset_world_catchup_20261001/evidence.md) and in `bench/sonnet/log.tsv`.

apple 7.5, bench 7.2, bottle 7.0, bowl 7.0, brazier 7.6, bread 7.5, cabbage 7.0, candelabra 7.4, candle 7.1, cauldron 7.2, chains 7.0, chandelier 7.2, cheese 7.2, counter 7.0, distillation-flask 7.1, fireplace 7.0, haunch 7.2, hay-bale 7.0, kiln 7.0, mortar-pestle 7.0, mug 7.2, pickaxe 7.0, plate 7.0, pumpkin 7.5, ritual-circle 7.0, round-table 7.0, rug 7.1, sack 7.1, sarcophagus 7.2, shelf 7.0, stool 7.2, switch 7.0, tankard 7.1, treasure-chest 7.5, vial 7.2, workbench 7.1.

## Completion (2026-10-02, track `asset_p0p1_completion_20261002`)

The completion track closed this family. All 112 P1 rows are at their bar. Each source has a current textured output,
sprites, and one strip for each clip, its last `./forge all` has no warnings, and the compiler finds no error in it.
The world catch-up, closeout, and completion tracks did the tasks above. Evidence: [the completion
evidence](../asset_p0p1_completion_20261002/evidence.md) and [the rebuild table](../asset_p0p1_completion_20261002/rebuilds.tsv).
