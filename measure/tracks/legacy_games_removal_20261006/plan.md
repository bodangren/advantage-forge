# Remove the legacy games from the monorepo

Status: in progress. The plan records execution state. The specification retains design detail.

## Phase 1: Agreement

- [x] Task: Send the owner direction, the use list (a read-only git grep of integration b8550a502), and five coverage questions to the monorepo session (2026-10-06).
- [ ] Task: Record the monorepo inventory and plan; agree the split and the order.

## Phase 2: Forge gaps

- [ ] Task: Build each feature, manifest field, or id map that the monorepo plan gives to Forge; release it through `apk-release.ts` and the read-only sync check.

## Phase 3: Removal (monorepo)

- [ ] Task: Record the monorepo commits that move every route to the new games and remove `game-cartridges`, with their tests and the browser check.
- [ ] Task: Update `measure/game-roadmap.md`, `docs/apk-2d3d-program.md`, and `docs/apk-port.md`; run the generator and the doctor; close the track.
