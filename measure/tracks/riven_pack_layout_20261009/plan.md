# Riven Lands pack layout (stage 1)

Status: new. Start gate: the Primary Advantage cutover is complete (cutover 2026-10-14 to 16, last date 2026-10-20; `docs/pack-layout.md`). Owner decisions of 2026-10-09 are in `measure/riven-lands-roadmap.md`. This plan owns execution status.

## Phase 1: Contract

- [ ] Task: Record the pack contract: `pack.json` schema, the pack resolution order (`--pack`, `FORGE_PACK`, default), and the output path rule in `docs/pack-layout.md`.
- [ ] Task: Write a test for pack resolution and output paths (`tests/pack.test.ts`): default pack unchanged, `--pack riven-lands` resolves to `packs/riven-lands/`, output to `out/riven-lands/`.

## Phase 2: Implement

- [ ] Task: Add `--pack` to the CLI and the asset loader. Keep every existing command unchanged with no option.
- [ ] Task: Create `packs/riven-lands/` with `pack.json`, empty `assets/`, `parts/`, `scenes/`, `mockups/`, `reference-designs/README.md`, `fit.md` (a stub that points to `riven_base_character_20261009`), `reviews.json` (`{}`), and `avatar-catalog.tsv` (header only).
- [ ] Task: Add the `pack` column to `measure/scope-map.tsv` with `chibi-quest` on every existing row, and teach `measure/generate.sh` the pack key in the asset inventory.
- [ ] Task: Give the review tools, `part-check.mjs`, `mesh-same.mjs`, and `forge check` a `--pack` option that reads the pack's `reviews.json` and sources.
- [ ] Task: Add one smoke source (`packs/riven-lands/assets/pack-smoke.ts`, a box) and run `./forge render pack-smoke --pack riven-lands --fast`.

## Phase 3: Verify and close

- [ ] Task: Run `pnpm test`, `pnpm typecheck`, and `./forge render rogue --fast`; compare the rogue output with the output before the change.
- [ ] Task: Mark Phase 5, task 1 of `repo_rename_advantage_forge_20261002` as done by this track, and remove the `../fantasy-asset-forge` compatibility link if no session still uses it.
- [ ] Task: Update `docs/pack-layout.md` (status: stage 1 done), the Riven Lands roadmap, and AGENTS.md (the `--pack` option in the loop section).
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
