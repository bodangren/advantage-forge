# Complete P1 nature

Status: in_progress. This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and scope

- [ ] Task: Select a bounded batch from the scope map.
- [ ] Task: Record scale, palette, rig, clips, and game uses before generation.

## Phase 2: Acceptance checks

- [ ] Task: Define silhouette, material, sprite, and clearance checks for the batch.
- [ ] Task: Confirm shared dimensions against the kit reference before launching trials.

## Phase 3: Production

- [~] Task: Build missing sources and review existing sources in the batch.
- [ ] Task: Run forge all for each accepted source after visual correction.

## Phase 4: Documentation and verification

- [ ] Task: Record review evidence and export paths for every accepted asset.
- [ ] Task: Update this plan and the scope records.
- [ ] Task: Run measure/generate.sh and measure/doctor.sh.

## Batch 1 (Sonnet 5.5 probe, 2026-09-29): ivy

Catalog ID `nature/plants/ivy`, P1, kind model, bar 7/10.

- Contract: a 1.2 m by 1.5 m wall patch, flat back at z = 0, one smooth vine with tendrils,
  lobed clover leaves, ground spill; reference `bench/overnight/refs/p1-forest/ivy-mock.jpg`.
- Agents: `forge-sonnet-low` failed at 5.0 (straight stems, blob leaves); a fresh
  `forge-sonnet-medium` with a construction recipe plus one feedback pass reached 7.5.
  80,592 tokens in total, 41,053 for the accepted build.
- Evidence: `assets/ivy.ts`; `out/ivy/` textured GLB and render; 5,372 triangles; no warnings.
- Lesson: organic scatter assets need the medium tier and an explicit recipe.

## Batch 1 round 2 (Sonnet 5.5, 2026-09-29): cave-mouth

- cave-mouth (`nature/terrain/cave-mouth`), P1, bar 7/10: `forge-sonnet-medium`, one build plus
  one feedback pass, 43,525 tokens. `assets/cave-mouth.ts`, 5,738 triangles, no warnings.
  Review 7.0. Limits: the top-left boulders overlap jaggedly; a faint blue cast on the stone.

## Batch 1 round 3 (Sonnet 5.5, 2026-09-29): ancient-tree

- ancient-tree (`nature/trees/ancient-tree`), P1, bar 7/10: `forge-sonnet-medium`, one build plus
  one feedback pass, 51,069 tokens. `assets/ancient-tree.ts`, 8,700 triangles, no warnings.
  Review 7.0. Limits: smooth blob canopy, plain trunk. Note: a trunk `displace` blocked
  reduction (873k triangles); bark grooves moved into `bump` with `maxTriangles` caps.

## Batch 1 round 3 (Sonnet 5.5, 2026-09-29): cliff-face SKIPPED

- cliff-face (`nature/terrain/cliff-face`), P1, bar 7/10: three `forge-sonnet-medium` passes
  (5.0, 6.5, 6.5) and one `forge-sonnet-high` grass rework (6.5), 126,344 tokens in all.
  `assets/cliff-face.ts` is left uncommitted. The rock body is usable; the turf cap never read
  as a lobed mat. Lesson: the textured build reduced the rock to 302 triangles while `--fast`
  reported 5,350, because `maxError` 0.04 was needed to stay under the cap; the facets vanish.
  Debt: rework the grass with an extruded lobed profile, or raise the cap for this tile.

## Batch 2 (Sonnet 5.5 run 4, 2026-09-30): palm-tree, giant-crystal

The last two open P1 nature rows, one `forge-sonnet-medium` agent each from
`bench/sonnet/briefs/<name>.md`. palm-tree starts from the 2026-09-28 external trial file
(reviewed: short trunk, torn fronds; the brief asks for new fronds and a 3.3 m trunk).
giant-crystal is a fresh build from the overnight mockup.

- Briefs ready: palm-tree, giant-crystal (queued behind silo and wall-gate).
- palm-tree (`nature/trees/palm-tree`), P1, bar 7/10: `forge-sonnet-medium` from the trial file
  (6.0, 6.8) then one `forge-sonnet-high` crown rework, 106,801 tokens in all. `assets/palm-tree.ts`,
  7,488 triangles, no warnings. Review 7.0. Limits: fronds thinner than the mockup, faint scallops.
  Lesson: a frond built from two joined halves shows a kink; six blended ellipsoids on an arc read
  as one smooth curl. The first brief's tall thin trunk contradicted the chunky mockup.
- In flight: giant-crystal.
- giant-crystal (`nature/terrain/giant-crystal`), P1, bar 7/10: `forge-sonnet-medium`, one build
  plus one feedback pass, 55,862 tokens. `assets/giant-crystal.ts`, 4,400 triangles, no warnings.
  Review 7.2. Limits: a boxy slab, pale tips. This closes the open P1 nature rows; cliff-face
  (skipped 2026-09-29) stays uncommitted debt.

## Rework note (Sonnet 5.5 run 4, 2026-09-30)

- Accepted (2026-09-30): stalactite 7.2, willow-tree 7.2, lava-rock 7.0 (one feedback pass), all
  medium agents; sand-dune 7.0 (two agent passes tore the surface, the orchestrator moved the
  ripples into the normal map) and puddle 7.0 (sky-blue recolor) by the orchestrator. Lichen and moss
  read at 7 and stay. Lesson: a sine displacement above about 0.02 m tears a smooth SDF; put
  ripples in `bump` instead.

## World catch-up (2026-10-01, track `asset_world_catchup_20261001`)

The world catch-up reviewed or reworked 47 assets of this family. 47 are accepted at their bar (P0 7.5, P1 7.0). Scores and notes are in [the catch-up evidence](../asset_world_catchup_20261001/evidence.md) and in `bench/sonnet/log.tsv`.

bramble 7.0, cobble-floor 7.0, cobble-road-corner 7.0, cobble-road-crossing 7.0, cobble-road-straight 7.0, cobble-road-t-junction 7.0, crystal-cluster 7.5, dead-tree 7.0, desert-ground 7.0, dirt-floor 7.0, dirt-ground 7.0, dirt-road-corner 7.0, dirt-road-crossing 7.0, dirt-road-straight 7.0, dirt-road-t-junction 7.0, fallen-tree 7.0, fern 7.2, footpath-corner 7.0, footpath-straight 7.0, forest-ground 7.0, grass-floor 7.0, grass-ground 7.3, hill-slope 7.0, lake-shore 7.0, lichen 7.0, marsh-ground 7.2, meadow-ground 7.0, moss 7.0, mushroom 7.3, pine-tree 7.3, puddle 7.1, reeds 7.2, river-bank 7.0, river-bend 7.0, river-junction 7.0, river-straight 7.0, rock-cluster 7.3, snow-ground 7.0, stepping-stone 7.0, stone-floor 7.5, stone-ground 7.0, tall-grass 7.3, tile-floor 7.0, tilled-field 7.0, valley-slope 7.0, wildflowers 7.3, wood-floor 7.2.

## Closeout (2026-10-02, track `asset_p0p1_closeout_20261002`)

The closeout rebuilt cliff-face (orchestrator, 914d719): one faceted main mass with a wide crown, a ledge, angular foot rocks, and grass pads extruded from the sampled rock outline. Score 7.2. Scores and notes are in `bench/sonnet/log.tsv` (batch `closeout`) and in `docs/character-reviews.json`. Bars: P0 7.5, P1 7.0, characters 7.5 (owner decision of 2026-10-02).
