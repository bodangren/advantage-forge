# Complete P1 structures

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

## Batch 1 (Sonnet 5.5 probe, 2026-09-29): farmhouse

Catalog ID `architecture/structure/farmhouse`, P1, kind model, bar 7/10.

- Contract: 6 m by 4 m by 4.5 m, whitewash walls, fat scalloped thatch, stone chimney, porch,
  flower boxes; reference `bench/overnight/refs/p1-village/farmhouse-mock.jpg`; cabin as pattern.
- Agent: `forge-sonnet-medium`, one build plus two feedback passes, 55,739 tokens, 16 tool uses.
- Evidence: `assets/farmhouse.ts`; `out/farmhouse/` textured GLB and render; 8,918 triangles;
  no warnings. Review 7.5. Footprint 7.1 m with the eaves.

## Batch 1 round 1 (Sonnet 5.5, 2026-09-29): greenhouse, yurt

Both P1, kind model, bar 7/10. Briefs in `bench/sonnet/briefs/`, passes in `bench/sonnet/log.tsv`.

- greenhouse (`architecture/structure/greenhouse`): `forge-sonnet-medium`, one build plus one
  feedback pass, 68,372 tokens. `assets/greenhouse.ts`, 6,194 triangles, no warnings. Review 7.2.
  Limits: the frame is thinner than the mockup's clay look; plants are plain blobs.
- yurt (`architecture/structure/yurt`): `forge-sonnet-medium`, one build plus one feedback pass,
  52,936 tokens. `assets/yurt.ts`, 5,800 triangles, no warnings. Review 7.5. Limits: the
  scallops are round notches; 3.48 m tall with the finial.

## Batch 1 round 2 (Sonnet 5.5, 2026-09-29): pier

- pier (`architecture/structure/pier`), P1, bar 7/10: `forge-sonnet-medium`, one build,
  46,021 tokens. `assets/pier.ts`, 4,590 triangles, no warnings. Review 7.0. Limits: thin rope
  rail and coil; plain cylinder posts.

## Batch 1 rounds 2 and 3 (Sonnet 5.5, 2026-09-29): city-wall, rampart, greenhouse-dome

All P1, bar 7/10, `forge-sonnet-medium`.

- city-wall (`architecture/structure/city-wall`): one build plus one feedback pass, 67,065
  tokens. `assets/city-wall.ts`, 5,458 triangles, no warnings. Review 7.0. Limits: tidy blocks,
  plain parapet face. Note: two-way block jitter made courses touch and blocked reduction.
- rampart (`architecture/structure/rampart`): one build plus one feedback pass, 59,945 tokens.
  `assets/rampart.ts`, 3,604 triangles, no warnings. Review 7.0. Limits: small merlon tips,
  thin arrow slits. Note: `detail` 0.02 and maxError 0.03 were needed to meet the cap.
- greenhouse-dome (`architecture/structure/greenhouse-dome`): one build, 38,863 tokens.
  `assets/greenhouse-dome.ts`, 6,718 triangles, no warnings. Review 7.3. Limits: faint noise
  rings in the glass; taller than the mockup.

## Batch 1 round 4 (Sonnet 5.5, 2026-09-29): watermill

- watermill (`architecture/structure/watermill`), P1, bar 7/10: `forge-sonnet-medium`, one build
  plus one feedback pass, 63,626 tokens. `assets/watermill.ts`, 8,398 triangles, no warnings.
  Review 7.3. Limits: regular blocks and tiles; the chute is a thin trough.

## Batch 1 round 4 (Sonnet 5.5, 2026-09-29): townhouse, crypt-chapel

Both P1, bar 7/10, `forge-sonnet-medium`, one build each.

- townhouse (`architecture/structure/townhouse`): 49,637 tokens. `assets/townhouse.ts`, 8,498
  triangles, no warnings. Review 7.3. Limits: flat tiles; a slightly jagged door arch.
- crypt-chapel (`architecture/structure/crypt-chapel`): 48,362 tokens. `assets/crypt-chapel.ts`,
  8,810 triangles, no warnings. Review 7.3. Limits: regular roof rows; small gargoyles.

## Batch 2 (Sonnet 5.5 run 4, 2026-09-30): silo, wall-gate

The last two open P1 architecture rows. Both start from the 2026-09-28 external trial files in
`/home/daniebo/forge-trials/ov-p1f-r2/` (reviewed 2026-09-30: both near the 7 bar), reworked by
one `forge-sonnet-medium` agent each from `bench/sonnet/briefs/<name>.md`.

- In flight: silo. Brief ready: wall-gate.
- silo (`architecture/structure/silo`), P1, bar 7/10: `forge-sonnet-medium` from the trial file,
  one build plus one feedback pass, 58,346 tokens. `assets/silo.ts`, 5,824 triangles, no
  warnings. Review 7.2. Limits: the tower stays tall and thin against the squat mockup; small
  shingle tabs. Note: a polar-repeat SDF replaced a union of 84 tab boxes (190 s in --fast).
- In flight: wall-gate.
- wall-gate (`architecture/structure/wall-gate`), P1, bar 7/10: `forge-sonnet-medium` from the
  trial file, one build plus one feedback pass, 83,621 tokens. `assets/wall-gate.ts`, 7,190
  triangles, no warnings. Review 7.3. Limits: uniform box blocks, pale cream, thin door leaves.
  This closes the open P1 architecture rows.

## Rework note (Sonnet 5.5 run 4, 2026-09-30)

- Accepted: ruin-column 7.3, stairs-stone 7.5, roof-slate 7.3, roof-thatch 7.0 (medium agents,
  briefs in `bench/sonnet/briefs/<name>-rework.md`). Spot-checked and kept: balcony, ladder,
  chimney, broken-wall, wood-wall, hill-slope, valley-slope.
- Ground tiles (meadow, snow, river-junction, grass-floor, desert, dirt, lake-shore, marsh,
  stone-ground): every mockup is a chunky slab about 0.3 m thick with rounded edges; every build is
  a sheet 0.05 to 0.1 m thick. One shared fix: thicken the slab and round its edges. The slab
  height is the ground surface that scenes and standing characters depend on, so the fix waits
  for owner approval (deferred 2026-09-30 22:20). Question for the owner: may ground tiles grow to
  a 0.3 m slab with the top surface at y 0.3, or must the top stay at y 0.05 to 0.06?

## World catch-up (2026-10-01, track `asset_world_catchup_20261001`)

The world catch-up reviewed or reworked 14 assets of this family. 14 are accepted at their bar (P0 7.5, P1 7.0). Scores and notes are in [the catch-up evidence](../asset_world_catchup_20261001/evidence.md) and in `bench/sonnet/log.tsv`.

altar 7.2, arch 7.0, barn 7.6, dirt-ground 7.0, door 7.3, farm-field 7.5, fence 7.2, gate 7.2, pillar 7.0, plaster-wall 7.0, stairs 7.0, wall-corner 7.0, well 7.5, wood-floor 7.2.
