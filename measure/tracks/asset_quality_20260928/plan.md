# Restore asset quality gates

Status: in_progress. This plan owns execution status. Source documents retain design details.

## Phase 1: Baseline and contract

- [x] Task: Record the September 28 baseline: 139 asset type errors.
- [x] Task: Classify type-only corrections and changes that affect rendering. (2026-10-02: [classification](./classification-20261002.md): 357 errors; class A, 9 files change the render.)

## Phase 2: Checks

- [ ] Task: Define regression checks for invalid imports and empty mesh output.
- [x] Task: Record geometry counts before corrections where behavior must remain stable. (2026-10-02: `scripts/mesh-same.mjs` builds the committed and the working source under temporary names and compares bounds, triangles per body, and the GLB data.)

## Phase 3: Repair

- [~] Task: Correct source types without suppressing compiler checks. (2026-10-02: type-only corrections in fallen-tree, stalagmite, urn, and clockwork-sentry, 573664b; the closeout reworks passed the per-asset gate; the full count is 347. Later on 2026-10-02, after the class A corrections (451ce00) and the avatar fit reworks: 297, led by ivy 33, market-cart 29, campfire 20, vines 19, fishing-rod 15. Track `asset_p0p1_completion_20261002` then corrected 46 files with Sonnet agents, each SAME by mesh-same: all 40 P0 and P1 sources and the 6 map pieces (torch-sconce, hanging-cage, quench-tub, three ores). 32 errors remain: 30 in P2 and P3 items and vehicles (rowboat 8, airship 7, plank 6, waterskin 3, mushroom-cap 3, wool, merchant-cart, longship) and 2 in tests.)
- [x] Task: Review paintFn body options and mixRgb inputs for behavioral defects. (2026-10-02: the 9 class A files are corrected with render reviews; see the classification.)
- [ ] Task: Add a type gate to the import workflow after the baseline passes. (2026-10-02: the per-asset gate `scripts/typecheck-asset.mjs` is in the rework agent rules, 9217cfa; the full gate waits for 0 errors.)

## Phase 4: Verification

- [ ] Task: Run the compiler and the relevant tests.
- [ ] Task: Compare changed renders and record unresolved quality issues.
- [ ] Task: Refresh Measure facts and run the doctor.
