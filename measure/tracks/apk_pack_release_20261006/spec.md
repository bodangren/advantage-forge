# Release APK packs and games to the monorepo

## Purpose

Make the 2D sprite pack match the 3D model packs one to one, give each pack its own version,
and automate the release of the packs, the kit, and the games from Forge to the monorepo.

## Owner decisions (2026-10-06, verbatim)

"Just go ahead and merge to main. The assets need to be synced with the monorepo. The 2D asset
packs need to come in line with the 3D assets 1:1. Defer putting the avatar into the games for
now. Defer more 3D assets until the system is set up, and then we need a way to automate pushing
new versions of the APK asset packs and / or games to the monorepo."

## Scope

1. One model list drives every output. `MODEL_PACKS` and the vault scene name the models; the 3D
   runtime models, the 3D packs, the 2D sprites, and the 2D pack all read that list.
2. Every model of a 3D pack has 2D files in `primary-chibi-2d`. A skinned model has one sheet for
   each clip of its runtime GLB. A hero has one sheet for each clip of each 3D color preset. A
   model without a skeleton has one still.
3. Each pack has its own version in `src/apk3d/contracts/pack-versions.ts`. A generator bumps the
   patch number when the content of a pack changes, and the minor number when a pack adds or
   removes a model. An unchanged pack keeps its version.
4. A release build runs in a clean Forge worktree at a committed revision. It rebuilds only the
   models whose source revision changed, so uncommitted work of other sessions never enters a
   pack.
5. A sync command copies the kit, the games, the packs, and the pack tests into a monorepo
   branch, runs the drift checks, the tests, and the type checks, and commits. It never pushes to
   `master`. The owner merges.

## Exclusions

- The student avatar in the games: deferred by the owner on 2026-10-06.
- New 3D asset production: deferred by the owner until this release system works.
- The use of the new 2D heroes and presets in the 2D views: track `game_2d_parity_20260928`.
- Baked 2D backgrounds for the 21 rewritten games.
- The 2D pack keeps one pack and its root `v1`: the APK `RuntimeEdition` holds one sprite pack, and
  both hosts load `/assets/apk/primary-chibi-2d/v1/pack.json`.

## Acceptance criteria

- A test fails when a model of a 3D pack has no 2D file, when a skinned model has no 2D sheet for
  a clip of its GLB, or when a hero preset has no 2D sheet for a clip.
- A test fails when a pack folder or a pack root does not match the version table.
- The release command reports the stale models, rebuilds only them, and leaves an unchanged pack
  at its version.
- After a sync, `port-kit.mjs --check` and `port-game.mjs all --check` report no difference, and the
  kit and game package tests and type checks pass.

## Evidence

- [apk-2d3d-program.md](../../../docs/apk-2d3d-program.md)
- [apk-port.md](../../../docs/apk-port.md)
- [apk3d-cartridge.md](../../../docs/apk3d-cartridge.md)

## Path policy

The 3D pack URLs keep the form `packs/<id>/<version>/`. The 2D pack keeps its root. The scripts
`demo-models.ts`, `apk3d-models.ts`, `apk2d-sprites.ts`, and `apk2d-pack.ts` keep their paths.
