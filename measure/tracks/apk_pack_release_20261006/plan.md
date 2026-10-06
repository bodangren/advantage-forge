# Release APK packs and games to the monorepo

Status: in progress. The plan records execution state. Linked documents retain design detail.

## Phase 0: Merge the port

- [~] Task: Merge `apk3d-games-port` into monorepo `master` (owner decision of 2026-10-06). 2026-10-06: `origin/master` has not moved since fe6aedc2b (2026-09-25), so the merge is a fast-forward of 54 commits. Checks on the branch head 7088a6c3c: kit 155 tests and type check, games 1,886 tests and type check, `game-contracts` 276 tests and type check, `domain` practice and challenge tests (15) and type check, Primary Advantage game tests (25). The 2D kit `advantage-play-kit` has one failure that also exists on master: the fixture challenge of `student-challenge-catalog-panel.test.tsx` expired on 2026-10-01 (TD-23). The push to `master` and the pull request were blocked by the session's permission classifier ("Merge Without Review"); the owner runs the push.

## Phase 1: Contract

- [x] Task: One model list for every output (`MODEL_PACKS` and the vault scene). `packModels()` in `scripts/apk-pack-models.ts`; `demo-models.ts` and `apk2d-sprites.ts` no longer keep their own lists.
- [x] Task: A version for each pack (`src/apk3d/contracts/pack-versions.ts`), used by the pack roots, the loader, and the tests. `packVersion(id)` in `model-pack.ts`; `MODEL_PACK_VERSION` stays as the first version.
- [x] Task: 2D file ids for hero presets. `spriteSheetId(model, clip, preset)` gives `<model>@<preset>.<clip>`; `spriteStillId(model)` gives `prop.<model>`; `SPRITE_PACK_ID` is `primary-chibi-2d`.

## Phase 2: Tests

- [x] Task: A 2D parity test against the 3D packs (models, clips, presets). `tests/apk3d/sprite-parity.test.ts`; before the release it failed for 67 of 90 models.
- [x] Task: A version test (pack folders, roots, and the version table agree). Two cases in `tests/apk3d/budget.test.ts`.

## Phase 3: Implementation

- [x] Task: The 3D model script and the 2D sprite script read the model list. The 2D script renders `--clip all` for a skinned model and `--preset all` for a hero.
- [x] Task: The pack generators bump a changed pack's version and keep an unchanged one. `apk2d-pack.ts --check` reproduces the current 2D pack unchanged from the old renders; `apk3d-models.ts --report` bumps only the four packs with stale models. `provenance.forgeCommit` now covers the local files an asset imports (`sourceRevision`).
- [~] Task: The release command: a clean worktree, stale models only, outputs copied back. `scripts/apk-release.ts` (`--check`, `--commit`, `--models`, `--all`, `--bake`). The first check lists 7 models for 3D and 2D and 60 models for 2D only.
- [~] Task: The sync command: kit, games, packs, and pack tests into a monorepo branch, with checks. `scripts/monorepo-sync.ts` (`--check`, `--commit`, `--push`; it refuses `master` and `main`). It also rewrites the three monorepo pack tests once to read each pack's own version.
- [x] Task: One shared "2D mode (older phones)" setting for the games and the RPG pages (owner, 2026-10-06, after a note on the `lane-f` RPG skin work). `src/apk3d/factory/renderer-setting.ts`: `readRendererSetting`, `saveRendererSetting`, and `RENDERER_SETTING_KEY` keep the format that the Forge host and `lane-f` `lib/rpg/renderer.ts` already use (`chibi-quest`, `flat: true`); `?renderer=phaser` forces 2D. The Forge host takes its key from the kit. Tests: `tests/apk3d/renderer-setting.test.ts` (5).
- [ ] Task: The monorepo game host reads the shared setting when the app passes none (`host/story-game.ts`, monorepo-owned).

## Phase 4: Build and verify

- [ ] Task: Run the release: rebuild the stale 3D models and complete the 2D pack.
- [ ] Task: Run the Forge tests and type check, and a 2D browser check of sample games.
- [ ] Task: Sync the monorepo branch and run its checks.
- [ ] Task: Update the program documents, the debt registry, and Measure; run the generator and the doctor.
