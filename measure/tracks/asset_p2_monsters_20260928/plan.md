# Produce P2 monsters

Status: in progress (batch 1 done 2026-10-04). This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [x] Task: Select a bounded batch from the scope map (batch 1 by game demand, below).
- [x] Task: Record scale, palette, rig, clips, and game uses before generation (the design note at the top of each source).

## Phase 2: Acceptance checks

- [x] Task: Define silhouette, material, sprite, and clearance checks for the batch.
- [x] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [ ] Task: Build missing sources and review existing sources in the batch (batch 1 done; 70 rows open).
- [ ] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [ ] Task: Record review evidence and export paths for every accepted asset.
- [ ] Task: Update this plan and the scope records.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.

## Acceptance checks (all batches)

Bar 7.5/10 (characters). Each asset needs: a mockup in `docs/monster-mockups/` (mmx, clay-toy
chibi style), a design note at the top of the source, a turnaround that matches the mockup in
silhouette and color, readable 8-direction sprites at 128 px, `./forge check <name>` with
`ground ok`, a `forge all` build with no `warning:` lines, a clip strip for each clip, and a
review entry in `docs/character-reviews.json` (scores, issues, next steps).

## Batch 1 (2026-10-04): game demand, built by the orchestrator

| Asset | Catalog ID | Base | Clips | Rating | Commit |
| --- | --- | --- | --- | ---: | --- |
| griffin | monsters/beast/griffin | new quadruped with wings (dire-wolf gait) | idle, walk, run, fly, attack, hit, roar, death | 7.7 | d0c3d6b |
| green-slime | monsters/small/green-slime | slime kind factory, leaf sprout | idle, walk, attack, hit, death, spit | 7.6 | 4a171cd |
| fire-slime | monsters/small/fire-slime | slime kind factory, flames | same six | 7.7 | 4a171cd |
| ice-slime | monsters/small/ice-slime | slime kind factory, crystals | same six | 7.6 | 4a171cd |
| poison-slime | monsters/small/poison-slime | slime kind factory, goo | same six | 7.8 | 4a171cd |
| dragon-wyrmling | monsters/dragon/dragon-wyrmling | fire-dragon rig and clips, new head and shell | idle, walk, run, fly, attack, hit, death, roar | 7.6 | f18f5c2 |

- Game use: the griffin replaces the fire dragon as the mount of Gryphon Patrol, Griffin Sky-Joust,
  and Griffin Riders Escape (integration is the next task, below). Its attack, hit, and roar happen
  in the air, so they blend with the fly loop. The slimes give Devourer Slime and the slime games
  four element kinds. The wyrmling is a weak early dragon or a companion.
- Slime kinds: `assets/slime.ts` (P0) now calls `slimeAsset` in `assets/parts/slime-kind.ts`;
  `node scripts/mesh-same.mjs slime` gave SAME (identical GLB data). A kind sets the slots and may
  add a crown on its own bone, posed in every clip and shrunk in the death.
- Evidence: `out/<name>/` (GLB, render, views, sprites with presets, `anim/` strips), the check
  output (ground ok for all six), and the review entries.

## Next

- [x] Task: Put the griffin into the three griffin games. Done in the track `game_griffin_mount_20261004`.
- [ ] Task: Batch 2: the next monsters by scene and game demand (wyvern, drake, giant-spider-queen, mushroom-creature, will-o-wisp, and the elementals).
