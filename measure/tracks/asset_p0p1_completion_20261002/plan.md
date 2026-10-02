# Complete P0 and P1 assets and maps

Status: in_progress. This plan owns execution status.

## Phase 1: Contract

- [x] Task: Record the owner goal, the scope, and the acceptance in the specification.
- [x] Task: Check the final outputs of the 504 P0 and P1 rows. (144 sources to rebuild)
- [x] Task: Fix TD-14 for the 11 `ready` avatar displays. (dad093a)

## Phase 2: Final outputs

- [ ] Task: Run `./forge all` on the 144 sources and record exit codes and warnings.
- [ ] Task: Fix each source that fails or warns (one Sonnet agent per source).
- [ ] Task: Check the outputs again; every row passes.

## Phase 3: Maps

- [x] Task: Shoot the overview renders of the five P0 maps and compare them with the mockups. (Before: vault 6.5, village 6.5, tavern 6.5, forest 6.0, blacksmith 5.5. Interiors took a warm key light (c0bc297) and dark maps a weaker key (9f4a136).)
- [x] Task: Build or rename the missing map components (`wall-alcove` in the dungeon list, `merchant` in the village list). (wall-alcove grafted from the dungeon trial; the village stall uses the shopkeeper.)
- [x] Task: Fix each map below 7.5 (one Sonnet agent per map). (Five forge-sonnet-medium agents, two feedback passes, about 308K tokens; orchestrator fixes: cart overlap, forest and village ground tiles, floating patrons, flame lights.)
- [x] Task: Record each map score and set the five blueprint rows to `accepted`. (All five at 7.5; `bench/sonnet/log.tsv` rows `map-*`; scene plans updated; TD-05 narrowed.)

## Phase 4: Close

- [ ] Task: Update the family plans, the scene plans, the asset roadmap, and the project status.
- [ ] Task: Write the P2 status report.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
