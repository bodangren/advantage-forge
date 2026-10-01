# Close the remaining P0 and P1 rows

Status: in_progress. This plan owns execution status.

## Phase 1: Contract

- [x] Task: Record the owner decisions and the scope in the specification.
- [x] Task: Add the per-asset type check (`scripts/typecheck-asset.mjs`) to the rework agent rules.
- [x] Task: Finish the helmet edits of the crashed session. (0b14487: iron-helmet 7.5, horned-helmet 7.2, steel-helmet 7.2)

## Phase 2: Equipment

- [~] Task: Rework long-sword, shortbow, staff, and leather-armor to 7.5 (P0). (19f193e: long-sword, shortbow, staff at 7.5. 99ae12c: leather-armor 7.0 to 7.3 after three passes, fit ok, still below the bar.)
- [x] Task: Rework halberd, gauntlets, and belt-pouch to 7.0 (P1). (19f193e: halberd 7.0, gauntlets 7.0, belt-pouch 7.2)
- [x] Task: Review cloth-hood from its current render. (7.0, log row 2026-10-02)

## Phase 3: Characters and the deferred assets

- [x] Task: Rework stone-golem and wraith to 7.5. (315a1c5: stone-golem 7.5; f59aa45: wraith 7.5)
- [x] Task: Give wood-golem and key-skeleton one more pass. (a92ff98: wood-golem 7.5; 19f193e: key-skeleton 7.2)
- [x] Task: Rebuild cliff-face to 7.0. (914d719: orchestrator rebuild, 7.2)

## Phase 4: Close

- [x] Task: Run `./forge all` on each accepted asset and confirm no warnings.
- [x] Task: Record every score in `bench/sonnet/log.tsv` and the character reviews.
- [x] Task: Commit each accepted asset with explicit paths.
- [x] Task: Update the family plans, the asset roadmap, and the project status.
- [x] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`. (2026-10-02)
