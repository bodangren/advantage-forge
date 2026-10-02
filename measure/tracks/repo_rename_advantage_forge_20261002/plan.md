# Rename the repository to advantage-forge

Status: completed for the rename (2026-10-02). Phase 5 waits for the Primary Advantage cutover. This plan owns execution status.

## Phase 1: Contract

- [x] Task: Record the owner decision and the inventory in the specification.
- [x] Task: List every file, script, and workflow that names the old repository, with the replacement text. (inventory below)
- [x] Task: Check that the name `advantage-forge` is free on GitHub and in the local `../` directory. (2026-10-02: `gh repo view bodangren/advantage-forge` finds nothing; `../advantage-forge` is absent)

## Phase 2: Pack layout design

- [x] Task: Write `docs/pack-layout.md`: the shared Forge tool and catalog, and one directory for each pack. (docs/pack-layout.md)
- [x] Task: List what a pack owns: assets, catalog rows, maps, base character, equipment fit, sprites, models, and review ratings. (docs/pack-layout.md)
- [x] Task: Write the Riven Lands brief: art direction for secondary students, base character, and the per-pack equipment fit rule. (docs/pack-layout.md)
- [x] Task: Ask the owner to approve the design before any path moves. (2026-10-02: stage 1 approved; Riven Lands deferred until the Primary cutover is complete; stage 2 not decided)

## Phase 3: Rename

- [x] Task: Stop all agents. Commit or park every uncommitted edit with explicit paths. (No agent of this session ran. Other sessions kept three Vite servers and a bench script in the directory; a compatibility link keeps their absolute paths working.)
- [x] Task: Rename the GitHub repository and update the `origin` remote. (bodangren/advantage-forge; Pages now at https://bodangren.github.io/advantage-forge/)
- [x] Task: Rename the local directory. Update `package.json`, scripts, tests, docs, and `.github/workflows/measure.yml`. (`../advantage-forge`; symlink `../fantasy-asset-forge` left for other sessions; remove it when they finish)
- [x] Task: Move the Claude Code project memory to the directory of the new path. (Copied to `~/.claude/projects/-home-daniebo-Desktop-advantage-forge/memory`; the old copy remains until the old session ends)
- [x] Task: Update the sibling repositories that name this repository. (`../advantage-pr` product strategy line 41, uncommitted in that repository)

## Phase 4: Close

- [x] Task: Run `pnpm typecheck`, `pnpm test`, `./forge render`, and the demo build in the new directory. (669 tests pass; render and demo build pass; 31 known compiler errors in P2 and P3 sources)
- [x] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`. Update AGENTS.md, README.md, and the roadmaps.

## Phase 5: Stage 1 of the pack layout (deferred)

Start after the Primary Advantage cutover is complete (cutover Oct 14 to 16, last date Oct 20).

- [ ] Task: Add `packs/riven-lands/` (assets, scenes, `fit.md`, `pack.json`) and a `--pack` option to the CLI. Keep `assets/` in place.
- [ ] Task: Get the owner's answers to the open questions in `docs/pack-layout.md` (base character, skeleton names, first batch, first game).
- [ ] Task: Remove the `../fantasy-asset-forge` compatibility link.

## Rename inventory (2026-10-02)

| File | Old text | Replacement |
| --- | --- | --- |
| `package.json` | name `fantasy-asset-forge` | `advantage-forge` |
| `README.md` line 13, `docs/demo-monster-encounters.md` line 134 | `bodangren.github.io/fantasy-asset-forge/` | the new Pages URL |
| `scripts/demo-publish.ts` line 8 | comment `bodangren/fantasy-asset-forge` | `bodangren/advantage-forge` |
| `bench/orchestrator.mjs` line 17, `bench/trials/tavern-env/graft.mjs` line 8 | absolute path `/home/daniebo/Desktop/fantasy-asset-forge` | the new path (or derive from `import.meta`) |
| `scripts/apk2d-pack.ts` lines 68 and 100 | provenance prefix `fantasy-asset-forge/` | `advantage-forge/` |
| `demo/public/assets/apk/primary-chibi-2d/v1/pack.json` (about 150 lines) | provenance prefix | regenerate with `scripts/apk2d-pack.ts` |
| `src/apk3d/contracts/model-asset.ts` line 20, `docs/apk3d-cartridge.md` lines 461 and 848 | example source string | `advantage-forge/assets/knight.ts` |
| `tests/apk3d/sprite-asset.test.ts` line 45, `tests/apk3d/contracts.test.ts` line 436 | example source string | follow the contracts change |
| `measure/evidence/*` | absolute paths in recorded output | keep (history) |
| `.github/workflows/measure.yml` | no name in the file | none |
| `../advantage-pr/08-strategy/product-strategy-2026-2027.md` line 41 | `fantasy-asset-forge` | `advantage-forge` (owner repository) |
| `../reading-advantage-monorepo/measure/archive/*` | archived tracks | keep (history) |
