# Port the dual renderer into the monorepo

## Purpose

Move the dual-renderer kit into the monorepo and connect it to application contracts, host flow, localization, content, and quality checks.

## Acceptance criteria

- The kit and game packages use the documented package boundaries.
- Existing APK contracts replace copied local contract definitions.
- Both Phaser and three.js cartridges pass runtime validation.
- The host selects a renderer using device capability and player settings.
- Story evidence reaches the application result flow.
- Every step passes its documented tests and a fresh repository graph check.
- The change is reviewed in an isolated pull request before merge.

## Evidence

- [apk-port.md](../../../docs/apk-port.md)
- [apk-2d3d-program.md](../../../docs/apk-2d3d-program.md)


## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.

## Open decisions

Waiting for the owner (2026-10-04). Each item has a proposal.

1. Push `apk3d-games-port` and open the pull request with [pull-request.md](./pull-request.md).
   Proposal: push and open it; the branch is rebased and every check in the text passes.
2. Deployment of Primary Advantage with the word adventures. Proposal: deploy after review,
   with one manual play-through on a real phone (the test plan in the pull request text).
3. The two local QC scripts `apps/primary-advantage/scripts/seed-demo-queue.ts` and
   `make-demo-session.ts` (untracked in the worktree). Proposal: do not commit them; the second
   one prints a session token. Keep the steps in `docs/apk-port.md`.
4. The architecture manifest on master is stale (TD-15). Proposal: the monorepo owner refreshes
   it on master in a separate change, not in this pull request.
5. The repository graph (`graph.db`) after the merge. Proposal: refresh it on the main checkout
   in a `chore(graph)` commit.
