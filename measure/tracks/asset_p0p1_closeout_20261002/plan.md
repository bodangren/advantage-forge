# Close the remaining P0 and P1 rows

Status: in_progress. This plan owns execution status.

## Phase 1: Contract

- [x] Task: Record the owner decisions and the scope in the specification.
- [x] Task: Add the per-asset type check (`scripts/typecheck-asset.mjs`) to the rework agent rules.
- [x] Task: Finish the helmet edits of the crashed session. (0b14487: iron-helmet 7.5, horned-helmet 7.2, steel-helmet 7.2)

## Phase 2: Equipment

- [ ] Task: Rework long-sword, shortbow, staff, and leather-armor to 7.5 (P0).
- [ ] Task: Rework halberd, gauntlets, and belt-pouch to 7.0 (P1).
- [ ] Task: Review cloth-hood from its current render.

## Phase 3: Characters and the deferred assets

- [ ] Task: Rework stone-golem and wraith to 7.5.
- [ ] Task: Give wood-golem and key-skeleton one more pass.
- [ ] Task: Rebuild cliff-face to 7.0.

## Phase 4: Close

- [ ] Task: Run `./forge all` on each accepted asset and confirm no warnings.
- [ ] Task: Record every score in `bench/sonnet/log.tsv` and the character reviews.
- [ ] Task: Commit each accepted asset with explicit paths.
- [ ] Task: Update the family plans, the asset roadmap, and the project status.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
