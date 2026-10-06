# Release APK packs and games to the monorepo

Status: in progress. The plan records execution state. Linked documents retain design detail.

## Phase 0: Merge the port

- [~] Task: Merge `apk3d-games-port` into monorepo `master` (owner decision of 2026-10-06). 2026-10-06: `origin/master` has not moved since fe6aedc2b (2026-09-25), so the merge is a fast-forward of 54 commits. Checks on the branch head 7088a6c3c: kit 155 tests and type check, games 1,886 tests and type check, `game-contracts` 276 tests and type check, `domain` practice and challenge tests (15) and type check, Primary Advantage game tests (25). The 2D kit `advantage-play-kit` has one failure that also exists on master: the fixture challenge of `student-challenge-catalog-panel.test.tsx` expired on 2026-10-01 (TD-23). The push to `master` and the pull request were blocked by the session's permission classifier ("Merge Without Review"); the owner runs the push.

- [~] Task: Merge route agreed with the monorepo session (owner, 2026-10-06: "merge into the current branch it's working on"; see docs/apk-port.md "Branch plan with the Primary lanes"). The direct push to `master` is dropped. The port merges once into lane-f through `primary/lane-f-apk3d-merge` (11 app-file conflicts, resolutions recorded with rerere), then later releases reach lane-f by `git merge apk3d-games-port`. Two port fixes found during the trial merge: `sync-assets.mjs` deleted the app's committed avatar pack at every predev and prebuild (d4262f1d5, with a test), and the 3D kit now exports the four pure avatar modules so the app's `avatar-kit` can drop its hand copies (11c37a4e7).

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
- [x] Task: The release command: a clean worktree, stale models only, outputs copied back. `scripts/apk-release.ts` (`--check`, `--commit`, `--models`, `--all`, `--bake`, `--skin`). The first check listed 7 models for 3D and 2D and 60 models for 2D only; the first release committed them (a81ccca). The commit now skips an output path that does not exist (`git add` fails on one).
- [~] Task: The sync command: kit, games, packs, and pack tests into a monorepo branch, with checks. `scripts/monorepo-sync.ts` (`--check`, `--commit`, `--push`; it refuses `master` and `main`). It also rewrites the monorepo pack tests once to read each pack's own version. The first `--commit` run failed its checks and committed nothing: the games import the kit through `dist/`, which the sync did not rebuild (`packVersion is not a function`), and the kit's own `src/__tests__/model-pack.test.ts` read the heroes pack at 1.0.0. The fix (3413535) builds the kit before the game tests and migrates that test. The second run passed the kit tests (155) and the kit type check; the system stopped it for low memory during the kit build, before the game tests. The monorepo packages were restored to 7088a6c3c.
- [x] Task: One shared "2D mode (older phones)" setting for the games and the RPG pages (owner, 2026-10-06, after a note on the `lane-f` RPG skin work). The monorepo owner of the setting is `@reading-advantage/advantage-play-kit/responsive` (`renderer.ts`, written in track `primary_rpg_skin_20261006`): key `chibi-quest`, `flat: true`, `?renderer=phaser`. Forge `src/apk3d/factory/renderer-setting.ts` is a byte copy of it, as Forge copies the APK contracts; `savedRendererSetting()` in `select.ts` turns it into the game setting. The Forge host takes its key from it. Tests: `tests/apk3d/renderer-setting.test.ts` (8, five of them the owner module's own cases).
- [~] Task: The monorepo game host reads the shared setting when the app passes none (`host/story-game.ts`, monorepo-owned): done on the port branch (3d8341293, with a kit copy of the setting test; kit 163 tests). Open: the monorepo 3D kit re-exports `advantage-play-kit/responsive` instead of the Forge copy (`port-kit.mjs` `MONOREPO_OWNED`) once lane-f is on the same line as the port.

## Phase 3b: The RPG skin (owner goal of 2026-10-06: complete the RPG rework with the monorepo agent)

The monorepo track `primary_rpg_skin_20261006` (branch `primary/lane-f-reedy-preview`, worktree `rama-worktrees/lane-f`, peer session `reading-advantage-monorepo-e5`) owns the app pages. Forge owns the skin files, the kit, and the setting copy. Messages to the peer: the division of work, the setting owner, the icon sources, the font question, and the avatar pack.

- [x] Task: `forge render --bg none` gives transparent views with a soft shadow (8f67b5d); no keyed-out grey.
- [x] Task: `scripts/rpg-skin.ts` rebuilds the 48 Forge files of the app's `public/rpg/` (icons, relics, NPC and boss views and strips, fonts) with a versioned `skin.json`. The sources were matched to the Phase 0 files by pixels; the strips equal row 0 of the `forge all` sheets. `apk-release.ts --skin` builds them in the clean worktree; `monorepo-sync.ts --skin <checkout>` mirrors them without a commit (a341251).
- [x] Task: The peer's Phase 2 and 3 file list joins the build (f5d87a5). `rpg-skin.ts` now has 241 files: 26 backdrops (`hamlet.html` with the peer's cameras: desktop 1920x1080 `dist=13`, phone 1080x1920 `dist=11`; WebP q78 RGB; every map asset is built first), 140 item views (`items/<catalogId>.webp`, 256 px), 15 hero portraits (`kit/heroes/<id>.webp`, 512 px, `avatar.html?hero=<id>&turn=-25` on the composed avatar pack), NPC idle and talk strips for five NPCs in their presets (blacksmith armorer, quest-giver scribe, shopkeeper grocer, innkeeper hostess, villager weaver), and boss strips (idle, hit, attack, death) at one 160 px cell. The Phase 0 strips were matched by pixels to presets: goblin-king cave, iron-golem aged, lich blood-lich, blacksmith armorer; the fire dragon's old preset `blaze` is gone and its default look is the nearest.
- [x] Task: `forge sprites --cell`: one cell for every listed clip (same scale and ground line), framed for the S view with `--dirs 1`. A goblin king test fills about half of the 160 px frame instead of a third.
- [ ] Task: One Thai face for the pages (Mitr) and the game HUD (Mali): the owner decides. The peer has no preference; Mitr stays until then.
- [~] Task: The full avatar pack through the release and the sync. `rpg-skin.ts` builds it (`avatar-pack.ts --build`, stale reduced inputs removed first) and copies it to `demo/public/avatar-pack/<version>/`; `monorepo-sync.ts --skin` mirrors each version folder to `apps/primary-advantage/public/packs/avatar/<version>/`.
- [ ] Task: The first skin build in the worktree and a delivery to lane-f. The peer's Phase 1 commit 546d45376 is in, so the delivery may run. The first `apk-release.ts --skin --commit` run rendered about 11 views and was stopped by the system for low memory (7.3 GB machine, with a monorepo test run at the same time); nothing was committed. Run the skin build alone.

## Phase 4: Build and verify

- [x] Task: Run the release: rebuild the stale 3D models and complete the 2D pack. a81ccca: 7 models rebuilt in 3D and 2D, 63 more rendered in 2D; heroes, dungeon-monsters, folk, and mounts 1.0.1; `primary-chibi-2d` 1.1.0 with 373 files (+255). The pack tests passed in the worktree (26 files, 314 tests) and the parity and version tests pass in the main checkout (142).
- [ ] Task: Run the Forge tests and type check, and a 2D browser check of sample games.
- [x] Task: Sync the monorepo branch and run its checks. e31a4e349 on `apk3d-games-port`: kit tests, types, and build; games 1,980 tests and types. Two fixes on the way: a Forge game test built a pack path the copy could not rewrite (c04b1100), and the commit body broke the monorepo commitlint (5296621b).
- [x] Task: The one-time merge into lane-f. `primary/lane-f-apk3d-merge` = 753248e49 on lane-f e6c69496e (Phase 3). Checks: app type check 0 errors; app tests 1,254 passed with 6 files failing to load; game-contracts 286; advantage-play-kit 736 of 737 (TD-23); domain games 172 of 175. All failures were reproduced with lane-f's own domain build or sources, so they already exist on lane-f; the fixes were sent to the lane-f session. The lane-f session fast-forwarded lane-f to 753248e49 (no conflicts); it fixes the cheap pre-existing test failures in its Phase 4 commit and records the host-proof failure as debt.
- [ ] Task: Update the program documents, the debt registry, and Measure; run the generator and the doctor.
