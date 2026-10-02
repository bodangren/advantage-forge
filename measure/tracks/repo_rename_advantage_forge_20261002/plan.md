# Rename the repository to advantage-forge

Status: new. This plan owns execution status.

## Phase 1: Contract

- [ ] Task: Record the owner decision and the inventory in the specification. (done in the spec; confirm after review)
- [ ] Task: List every file, script, and workflow that names the old repository, with the replacement text.
- [ ] Task: Check that the name `advantage-forge` is free on GitHub and in the local `../` directory.

## Phase 2: Pack layout design

- [ ] Task: Write `docs/pack-layout.md`: the shared Forge tool and catalog, and one directory for each pack.
- [ ] Task: List what a pack owns: assets, catalog rows, maps, base character, equipment fit, sprites, models, and review ratings.
- [ ] Task: Write the Riven Lands brief: art direction for secondary students, base character, and the per-pack equipment fit rule.
- [ ] Task: Ask the owner to approve the design before any path moves.

## Phase 3: Rename

- [ ] Task: Stop all agents. Commit or park every uncommitted edit with explicit paths.
- [ ] Task: Rename the GitHub repository and update the `origin` remote.
- [ ] Task: Rename the local directory. Update `package.json`, scripts, tests, docs, and `.github/workflows/measure.yml`.
- [ ] Task: Move the Claude Code project memory to the directory of the new path.
- [ ] Task: Update the sibling repositories that name this repository.

## Phase 4: Close

- [ ] Task: Run `pnpm typecheck`, `pnpm test`, `./forge render`, and the demo build in the new directory.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`. Update AGENTS.md, README.md, and the roadmaps.
