# Riven Lands game set

Status: new. Start gate: the Primary Advantage cutover is complete (cutover 2026-10-14 to 16, last date 2026-10-20; `docs/pack-layout.md`). Owner decisions of 2026-10-09 are in `measure/riven-lands-roadmap.md`. Depends on `riven_base_character_20261009`. This plan owns execution status.

## Phase 1: Contract and scope

- [ ] Task: Confirm that `riven_base_character_20261009` is accepted; read `packs/riven-lands/PORTING.md` and `packs/riven-lands/fit.md`.
- [ ] Task: Recount the game rows, the 2D actors and presets, and the ready avatar pieces from their sources; record any change in the scope table.
- [ ] Task: Write `packs/riven-lands/briefs/game-set.md`: each row with its Chibi Quest source path, its kind, its palette, and its triangle budget; the kinds to port and their order.

## Phase 2: Characters (21 rows)

- [ ] Task: Make the mmx mockups for the character rows.
- [ ] Task: Port the kind factories of the five game monsters to `packs/riven-lands/parts/`; prove each with one monster.
- [ ] Task: Build the heroes, enemies, NPCs, and monsters (the knight and the goblin warrior come from the base track), with their clips and presets.
- [ ] Task: Independent review of the characters (bar 7.5); rework rows below the bar; stop after three reviews.
- [ ] Task: Run `./forge all <name> --pack riven-lands` and `./forge check <name> --pack riven-lands` for each accepted row; record the evidence.

## Phase 3: World assets (68 rows)

- [ ] Task: Make the mmx mockups for the world rows.
- [ ] Task: Build the props, architecture, nature pieces, and the lantern in batches of 5 to 12.
- [ ] Task: Independent review per batch (bar 7.0); rework rows below the bar; stop after three reviews.
- [ ] Task: Run `./forge all <name> --pack riven-lands` for each accepted row; record the evidence.

## Phase 4: Avatar pieces (142 pieces)

- [ ] Task: Port the pieces by slot in the order of the avatar catalog (head 25, mainhand 72, offhand 26, chest 5, hair 4, hands 3, back 3, feet 2, waist 1, shoulders 1); each fits the Riven Lands base.
- [ ] Task: Run `./forge check <piece> --pack riven-lands` on every piece; fix show-through, gaps, floor, and clip clearance.
- [ ] Task: Independent review per slot batch (bar 7.0); rework pieces below the bar.
- [ ] Task: Fill `packs/riven-lands/avatar-catalog.tsv` for the ported pieces.

## Phase 5: The sunken vault

- [ ] Task: Make an mmx mockup of the sunken vault in the Riven Lands language.
- [ ] Task: Assemble `packs/riven-lands/scenes/sunken-vault.ts` with `vault-places.ts` unchanged; render overhead and three-quarter views.
- [ ] Task: Independent review of the scene (bar 7.5); rework until it reaches the bar or three reviews are done.

## Phase 6: Close

- [ ] Task: Update this plan, `packs/riven-lands/reviews.json`, the scope map (pack `riven-lands`), and the Riven Lands roadmap.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
