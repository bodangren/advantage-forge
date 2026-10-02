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

- [ ] Task: Shoot the overview renders of the five P0 maps and compare them with the mockups.
- [ ] Task: Build or rename the missing map components (`wall-alcove` in the dungeon list, `merchant` in the village list).
- [ ] Task: Fix each map below 7.5 (one Sonnet agent per map).
- [ ] Task: Record each map score and set the five blueprint rows to `accepted`.

## Phase 4: Close

- [ ] Task: Update the family plans, the scene plans, the asset roadmap, and the project status.
- [ ] Task: Write the P2 status report.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
