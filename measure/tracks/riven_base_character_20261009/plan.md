# Riven Lands base character and fit contract

Status: new. Start gate: the Primary Advantage cutover is complete (cutover 2026-10-14 to 16, last date 2026-10-20; `docs/pack-layout.md`). Owner decisions of 2026-10-09 are in `measure/riven-lands-roadmap.md`. Depends on `riven_pack_layout_20261009`. This plan owns execution status.

## Phase 1: Contract

- [ ] Task: Make three base mockups with mmx (front, three-quarter, side, back) at 1.6 m and 5 heads in the Riven Lands language; the owner picks one or asks for a round two.
- [ ] Task: Write the proportion table (head, torso, limb lengths, joint positions) from the chosen mockup into `packs/riven-lands/fit.md` before any build.
- [ ] Task: Write the test for the skeleton contract: the Riven Lands base exports the same bone, clip, and socket names as the chibi base (`tests/riven-skeleton.test.ts`).

## Phase 2: Build the base

- [ ] Task: Build `packs/riven-lands/parts/humanoid-kind.ts` and `packs/riven-lands/assets/avatar-base.ts`; iterate with `./forge render avatar-base --pack riven-lands --fast` until the silhouette matches the mockup in front, side, and back.
- [ ] Task: Retarget every shared clip; review each strip and GIF; fix sinking feet and self-intersection.
- [ ] Task: Add the color slots and muted presets; build textured once with `./forge all`; check the tint mask and the presets in the GLB.
- [ ] Task: Render the 128 px sprites in 8 directions and check `sprites/preview.png`.

## Phase 3: Fit contract and porting recipe

- [ ] Task: Complete `packs/riven-lands/fit.md`: the display scale and anchor table for chest, robes, head, boots, gloves, belts, weapons, and shields on the new measures.
- [ ] Task: Port one chest piece and one helmet from the Chibi Quest equipment as the fit proof; `./forge check <piece> --pack riven-lands` ends with `result ok`.
- [ ] Task: Write `packs/riven-lands/PORTING.md` with the recipe and the transfer table; prove it on the knight (`scripts/part-check.mjs --pack riven-lands`).

## Phase 4: Style proofs and review

- [ ] Task: Build the knight on the base and the goblin warrior from its turnaround (`reference-designs/riven-goblin-warrior-20260925/`), with their clips and presets.
- [ ] Task: Independent review of the base, the knight, and the goblin warrior (bar 7.5); rework until each reaches the bar or three reviews are done.
- [ ] Task: Dress the base in the avatar composer from a local Riven Lands avatar pack; record any composer change needed for `riven_game_skin_20261009`.

## Phase 5: Close

- [ ] Task: Record the measures, the ratings, and the evidence paths in this plan and in `packs/riven-lands/reviews.json`; update the Riven Lands roadmap.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
