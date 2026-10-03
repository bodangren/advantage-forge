# Generate and validate model packs

Status: in progress. The plan records execution state. Linked documents retain design detail.

Audit 2026-10-03: before this work no pack generator existed. Games loaded 87 GLBs from `demo/public/models/` by path.

## Phase 1: Contract

- [~] Task: Reconcile the local model pack contract with the monorepo package contract. The local contract is done (`src/apk3d/contracts/model-asset.ts`, no hash field). The monorepo has no 3D kit yet, so the reconcile step waits for the platform port.

## Phase 2: Tests

- [x] Task: Test manifest output, invalid assets, and budget failures. `tests/apk3d/model-pack.test.ts` (assembly, determinism, file and game budgets) and `tests/apk3d/budget.test.ts` (the generated packs: schema, files on disk, one pack per model, budgets). 2026-10-03.

## Phase 3: Implementation

- [x] Task: Implement the pack manifest generator and game pack declarations. `scripts/apk3d-models.ts` and `src/apk3d/contracts/model-pack.ts` (`MODEL_PACKS`, `GAME_LOADS`). Output is `demo/public/packs/<pack>/<version>/`. The output is deterministic. 2026-10-03.
- [ ] Task: Move the dungeon set into a generated pack and remove the transitional import. The `sunken-vault` pack exists. `src/games/shared/battle/stage3d.ts` still imports `scenes/sunken-vault.ts` and loads `models/<name>.glb`.
- [ ] Task: Add a pack loader to the 3D kit and move the games from `models/` paths to pack bindings (`RuntimeEdition3D`). Both renderer paths must load pack files.

## Phase 4: Verification

- [x] Task: Build representative hero, prop, and scene packs. Seven packs: heroes, dungeon-monsters, folk, potion-shop, outdoor-props, flight-land, sunken-vault (17 MB). 2026-10-03.
- [x] Task: Verify checksums or integrity using the agreed existing contract fields. The contract has no hash. The tests check `byteSize`, file presence, and `provenance.forgeCommit` format.
- [~] Task: Record budgets and run local and monorepo pack tests. Local: every file and every game is inside the section 7.3 limits (Potion Rush 5.63 MB is the largest; customers and the far field use 384 px textures). The first-load limit of 4 MB is not modeled. Monorepo pack tests wait for the 3D kit there.
