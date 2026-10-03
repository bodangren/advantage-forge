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
- [x] Task: Add a pack loader to the 3D kit. `ModelLoader.loadPacks`, `modelPath`, and `presetPath` (`src/apk3d/stage/loader.ts`) and `buildModelIndex` (`contracts/model-pack.ts`) resolve names from the manifests and fall back to `models/<name>.glb` for a name no loaded pack holds. Tests: `tests/apk3d/pack-loader.test.ts`. 2026-10-03.
- [x] Task: Move the games from `models/` paths to pack loads. All seven 3D games, the lobby, the shared battle stage, and `demo/bake.ts` load through `loader.loadPacks` and `modelPath`. A headless Chromium run (software GL, 2026-10-03) of Monster Encounters, Potion Rush, Dragon Flight, Dungeon Liberator, Devourer Slime, Hero vs. Zombie, and Labyrinth fetched pack files only (18 to 43 each), no `models/` request, no console error. `tests/apk3d/pack-bindings.test.ts` checks that every model a game names resolves in the packs the game loads. The test found one gap (Hero vs. Zombie needs `flight-land`). `RuntimeEdition3D` bindings are connected (2026-10-03): each manifest lists its models (`MODELS_3D`) and packs, the host builds the edition with `modelEditionOf`, the three factory binds it to the loader, and the views no longer name packs. Headless Chromium: no `models/` request, no diagnostic. The `lite` edition has no packs yet (the generator builds `standard` only). `demo/public/models/` stays as the intermediate output of `scripts/demo-models.ts`; moving it out of `public` changes a path and needs owner approval.

## Phase 4: Verification

- [x] Task: Build representative hero, prop, and scene packs. Seven packs: heroes, dungeon-monsters, folk, potion-shop, outdoor-props, flight-land, sunken-vault (17 MB). 2026-10-03.
- [x] Task: Verify checksums or integrity using the agreed existing contract fields. The contract has no hash. The tests check `byteSize`, file presence, and `provenance.forgeCommit` format.
- [~] Task: Record budgets and run local and monorepo pack tests. Local: every file and every game is inside the section 7.3 limits (Potion Rush 5.63 MB is the largest; customers and the far field use 384 px textures). The first-load limit of 4 MB is not modeled. Monorepo pack tests wait for the 3D kit there.
