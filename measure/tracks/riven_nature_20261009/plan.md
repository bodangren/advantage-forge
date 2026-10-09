# Riven Lands nature

Status: new. Start gate: the Primary Advantage cutover is complete (cutover 2026-10-14 to 16, last date 2026-10-20; `docs/pack-layout.md`). Owner decisions of 2026-10-09 are in `measure/riven-lands-roadmap.md`. Depends on `riven_game_set_20261009`. This plan owns execution status.

## Phase 1: Contract and scope

- [ ] Task: Confirm that `riven_game_set_20261009` is accepted, and read `packs/riven-lands/PORTING.md`.
- [ ] Task: Write the family brief in `packs/riven-lands/briefs/nature.md`: proportions, palette, material reference, triangle budget, and the port recipe for this family.
- [ ] Task: List the 36 rows with their Chibi Quest source path and kind in the brief, and split them into batches of 5 to 12 by kind or group.

## Phase 2: The catalog rows outside the game set (36 rows, 36 P1)

- [ ] Task: Make the mmx mockups per batch.
- [ ] Task: Build each batch in P0, P1, P2, P3 order; one agent per asset.
- [ ] Task: Independent review per batch (bar 7.0); rework rows below the bar; stop after three reviews.
- [ ] Task: Run `./forge all` for each accepted row; record the evidence and the follow-up list in this plan.

## Phase 3: Close

- [ ] Task: Update this plan, `packs/riven-lands/reviews.json`, the scope map (pack `riven-lands`), and the Riven Lands roadmap.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
