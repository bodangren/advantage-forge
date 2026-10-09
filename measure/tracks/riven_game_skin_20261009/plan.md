# Riven Lands game skin delivery

Status: new. Start gate: the Primary Advantage cutover is complete (cutover 2026-10-14 to 16, last date 2026-10-20; `docs/pack-layout.md`). Owner decisions of 2026-10-09 are in `measure/riven-lands-roadmap.md`. Depends on `riven_base_character_20261009` and the batch 1 of the family tracks. This plan owns execution status.

## Phase 1: Contract

- [ ] Task: Add `pack` to the launch context contract and to the model-pack manifest (`src/apk3d/contracts/`); write the contract tests (default `chibi-quest`; no hash field).
- [ ] Task: Decide and record the model path rule per pack (`demo/public/models/<pack>/` or a pack id in each runtime pack) in `docs/pack-layout.md` and `docs/apk3d-cartridge.md`.
- [ ] Task: Owner confirms the first game (proposal: Labyrinth). Record it in this plan and in the Riven Lands roadmap.

## Phase 2: Generators and packs

- [ ] Task: Teach the model pack generator the pack: build the eight runtime packs from `packs/riven-lands/` sources; the budget test runs per pack.
- [ ] Task: Teach `scripts/apk2d-pack.ts` the pack: build `secondary-riven-2d` and a test that proves one-to-one coverage against `primary-chibi-2d`.
- [ ] Task: Build the Riven Lands avatar pack with `scripts/rpg-skin.ts --pack riven-lands`; `pack-version.ts` versions it per pack; check the tint mask in the packed GLB.

## Phase 3: Host and games

- [ ] Task: Resolve every `loader.get(model(...))` call and every 2D file id through the pack of the launch context; no game names a pack.
- [ ] Task: Run the first game in the Riven Lands skin on the demo page (3D and 2D, desktop and phone QC); fix layout and readability issues at 128 px.
- [ ] Task: Run all 28 games in the Riven Lands skin with `qc/run.mjs`, `--phone`, and `--phone-landscape`; record the QC evidence.
- [ ] Task: Run the avatar bench with the Riven Lands base on the test machine; record fps.

## Phase 4: Release

- [ ] Task: Teach `scripts/apk-release.ts` and `scripts/monorepo-sync.ts` the pack; `--check` reports drift per pack.
- [ ] Task: Hand the release to the monorepo session for `apps/reading-advantage`; record the monorepo commit and the deployment check in `docs/apk-port.md`.

## Phase 5: Close

- [ ] Task: Update this plan, the Riven Lands roadmap, the game roadmap, and `docs/apk-port.md`.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
