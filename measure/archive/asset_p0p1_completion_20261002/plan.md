# Complete P0 and P1 assets and maps

Status: completed. This plan owns execution status.

## Phase 1: Contract

- [x] Task: Record the owner goal, the scope, and the acceptance in the specification.
- [x] Task: Check the final outputs of the 504 P0 and P1 rows. (144 sources to rebuild)
- [x] Task: Fix TD-14 for the 11 `ready` avatar displays. (dad093a)

## Phase 2: Final outputs

- [x] Task: Run `./forge all` on the 144 sources and record exit codes and warnings. (143 in list `outputs`; warrior went to `typefix`. 21 map pieces with old outputs added. `rebuilds.tsv`.)
- [x] Task: Fix each source that fails or warns (one Sonnet agent per source). (No source failed or warned; no agent needed.)
- [x] Task: Check the outputs again; every row passes. (526 names: 495 catalog sources and 31 map-only assets; all pass. `evidence.md`.)

## Phase 2b: Type-only corrections (TD-01 class B, P0 and P1 sources)

The compiler finds 244 of the 297 errors in 40 P0 and P1 asset sources (3 P0: campfire, torch,
stone-wall). A source that does not compile is not complete. One Sonnet agent per file or small
group corrects the types; `scripts/mesh-same.mjs` must print SAME (identical bounds, triangles
per body, and GLB data) for each file. Brief: `bench/sonnet/briefs/typefix-rules.md`.

- [x] Task: Correct the 40 files (15 agents, waves of three). (All SAME by mesh-same; 15 forge-sonnet-low and medium agents, about 449K tokens; then 2 agents for the 6 map pieces with 18 errors. Full compiler: 297 -> 32 errors, none in P0, P1, or map sources.)
- [x] Task: Run `./forge all` on each corrected file and confirm no warnings. (47 builds in lists `typefix` and `typefix-maps`: 0 failed, 0 warnings.)

## Phase 3: Maps

- [x] Task: Shoot the overview renders of the five P0 maps and compare them with the mockups. (Before: vault 6.5, village 6.5, tavern 6.5, forest 6.0, blacksmith 5.5. Interiors took a warm key light (c0bc297) and dark maps a weaker key (9f4a136).)
- [x] Task: Build or rename the missing map components (`wall-alcove` in the dungeon list, `merchant` in the village list). (wall-alcove grafted from the dungeon trial; the village stall uses the shopkeeper.)
- [x] Task: Fix each map below 7.5 (one Sonnet agent per map). (Five forge-sonnet-medium agents, two feedback passes, about 308K tokens; orchestrator fixes: cart overlap, forest and village ground tiles, floating patrons, flame lights.)
- [x] Task: Record each map score and set the five blueprint rows to `accepted`. (All five at 7.5; `bench/sonnet/log.tsv` rows `map-*`; scene plans updated; TD-05 narrowed.)

## Phase 4: Close

- [x] Task: Update the family plans, the scene plans, the asset roadmap, and the project status. (Six family tracks closed with a completion section.)
- [x] Task: Write the P2 status report. (`measure/asset-roadmap.md`, section "P2 status (2026-10-02)".)
- [x] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
