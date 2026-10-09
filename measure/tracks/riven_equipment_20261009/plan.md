# Riven Lands equipment

Status: new. Start gate: the Primary Advantage cutover is complete (cutover 2026-10-14 to 16, last date 2026-10-20; `docs/pack-layout.md`). Owner decisions of 2026-10-09 are in `measure/riven-lands-roadmap.md`. Depends on `riven_base_character_20261009`. This plan owns execution status.

## Phase 1: Contract and scope

- [ ] Task: Confirm the dependency is accepted (`riven_base_character_20261009`) and read `packs/riven-lands/PORTING.md` and `packs/riven-lands/fit.md`.
- [ ] Task: Write the family brief in `packs/riven-lands/briefs/equipment.md`: proportions, palette, material reference, triangle budget, and the port recipe for this family.
- [ ] Task: List the rows of each batch with their Chibi Quest source path and kind in the brief.

## Phase 2: Batch 1, the game set (1 rows)

- [ ] Task: Make the mmx mockups for the batch 1 rows.
- [ ] Task: Build the batch 1 rows: lantern.
- [ ] Task: Independent review of batch 1 (bar 7.0); rework rows below the bar; stop after three reviews.
- [ ] Task: Run `./forge all <name> --pack riven-lands` for each accepted row; record the evidence in this plan.

## Phase 3: Batch 2, the avatar pieces (142 ready rows)

- [ ] Task: Port the pieces by slot in the order of the avatar catalog: head (25), mainhand (72), offhand (26), chest (5), hair (4), back (3), hands (3), feet (2), shoulders (1), waist (1); each fits the Riven Lands base.
- [ ] Task: Run `./forge check <piece> --pack riven-lands` on every piece; fix show-through, gaps, floor, and clip clearance.
- [ ] Task: Independent review per slot batch (bar 7.0); rework pieces below the bar.
- [ ] Task: Fill `packs/riven-lands/avatar-catalog.tsv` (id, slot, tier, status, triangles, rating, price) for the ported pieces.

## Phase 4: Batch 3, the rest of the catalog (100 rows, 7 P0, 93 P1)

- [ ] Task: Split the remaining rows into batches of 5 to 12 by kind or group; record the batch list in this plan.
- [ ] Task: Make the mmx mockups per batch.
- [ ] Task: Build each batch in P0, P1, P2, P3 order; one agent per asset.
- [ ] Task: Independent review per batch (bar 7.0); rework rows below the bar; stop after three reviews.
- [ ] Task: Run `./forge all` for each accepted row; record the evidence and the follow-up list in this plan.

## Phase 5: Close

- [ ] Task: Update this plan, `packs/riven-lands/reviews.json`, the scope map (pack `riven-lands`), and the Riven Lands roadmap.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
