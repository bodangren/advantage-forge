# Riven Lands vehicles

Status: new. Start gate: the Primary Advantage cutover is complete (cutover 2026-10-14 to 16, last date 2026-10-20; `docs/pack-layout.md`). Owner decisions of 2026-10-09 are in `measure/riven-lands-roadmap.md`. Depends on `riven_pack_layout_20261009`. This plan owns execution status.

## Phase 1: Contract and scope

- [ ] Task: Confirm the dependency is accepted (`riven_pack_layout_20261009`) and read `packs/riven-lands/PORTING.md`.
- [ ] Task: Write the family brief in `packs/riven-lands/briefs/vehicles.md`: proportions, palette, material reference, triangle budget, and the port recipe for this family.
- [ ] Task: List the rows of each batch with their Chibi Quest source path and kind in the brief.

## Phase 2: Batch 1, the catalog (15 rows, 15 P3)

- [ ] Task: Split the remaining rows into batches of 5 to 12 by kind or group; record the batch list in this plan.
- [ ] Task: Make the mmx mockups per batch.
- [ ] Task: Build each batch in P0, P1, P2, P3 order; one agent per asset.
- [ ] Task: Independent review per batch (bar 7.0); rework rows below the bar; stop after three reviews.
- [ ] Task: Run `./forge all` for each accepted row; record the evidence and the follow-up list in this plan.

## Phase 3: Close

- [ ] Task: Update this plan, `packs/riven-lands/reviews.json`, the scope map (pack `riven-lands`), and the Riven Lands roadmap.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
