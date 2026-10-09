# Riven Lands enemies

Status: new. Start gate: the Primary Advantage cutover is complete (cutover 2026-10-14 to 16, last date 2026-10-20; `docs/pack-layout.md`). Owner decisions of 2026-10-09 are in `measure/riven-lands-roadmap.md`. Depends on `riven_base_character_20261009`. This plan owns execution status.

## Phase 1: Contract and scope

- [ ] Task: Confirm the dependency is accepted (`riven_base_character_20261009`) and read `packs/riven-lands/PORTING.md` and `packs/riven-lands/fit.md`.
- [ ] Task: Write the family brief in `packs/riven-lands/briefs/enemies.md`: proportions, palette, material reference, triangle budget, and the port recipe for this family.
- [ ] Task: List the rows of each batch with their Chibi Quest source path and kind in the brief.

## Phase 2: Batch 1, the game set (5 rows)

- [ ] Task: Make the mmx mockups for the batch 1 rows.
- [ ] Task: Build the batch 1 rows: bandit, goblin-warrior, orc-warrior, skeleton, zombie.
- [ ] Task: Independent review of batch 1 (bar 7.5); rework rows below the bar; stop after three reviews.
- [ ] Task: Run `./forge all <name> --pack riven-lands` for each accepted row; record the evidence in this plan.

## Phase 3: Batch 2, the rest of the catalog (69 rows, 6 P0, 63 P1)

- [ ] Task: Split the remaining rows into batches of 5 to 12 by kind or group; record the batch list in this plan.
- [ ] Task: Make the mmx mockups per batch.
- [ ] Task: Build each batch in P0, P1, P2, P3 order; one agent per asset.
- [ ] Task: Independent review per batch (bar 7.5); rework rows below the bar; stop after three reviews.
- [ ] Task: Run `./forge all` for each accepted row; record the evidence and the follow-up list in this plan.

## Phase 4: Close

- [ ] Task: Update this plan, `packs/riven-lands/reviews.json`, the scope map (pack `riven-lands`), and the Riven Lands roadmap.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
