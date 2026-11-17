# Specification: an identical rebuild of the avatar pack and the RPG skin keeps its version

## Finding (2026-10-21)

The owner asked for a rebuild and release of the RPG skin. `apk-release.ts --skin` (Forge
`01fa8cce`) rebuilt 18 stale skin files and the avatar pack, and gave new versions: avatar pack
1.1.0 -> 1.1.1, skin 1.2.0 -> 1.2.1. The content did not change:

- Avatar pack: 601 of 604 files had the same bytes. `pack.json` differed only in the base
  `forgeCommit` (f4de18b3 -> 318565f6); `catalog.json` and `portraits.json` only in the version.
- Hero portraits (16): the figures did not move, and the pieces had the same bytes. The heat maps
  show thin lines on every edge: render noise of a new browser shot. The stale cause was
  `e82418d7` (`assets/parts/humanoid-kind.ts`), a source commit that did not change the built pieces.
- Clearing backdrops (2): the same bytes; only the `forgeCommit` in `skin.json` changed.

The rebuild also changed the kit file `src/apk3d/avatar/pack-version.ts`. A port sync without the
skin sync then makes the app ask for `packs/avatar/1.1.1` (404). The handoff did not show the avatar
pack or the skin, so it could not warn.

## Decision

Owner decision (2026-10-21): revert `01fa8cce` (Forge `5091f982`) and keep the version for an
identical rebuild, as the model packs do since `apk_monorepo_sync_workflow_20261020`.

## Rules

1. Avatar pack: a rebuilt pack that differs from the published pack only in `forgeCommit` values of
   its JSON files is the same pack. The published folder stays as it is, the version stays, and the
   new source revision is recorded as checked.
2. Hero portrait: when the rebuilt avatar pack is the same and the avatar code (the composer and
   the review page) has no commit after the portrait's entry, the inputs of the shot are the same.
   The portrait keeps its file and entry, and is not shot again. `--all` still shoots it.
3. Every other skin file (and a hero that is shot): a new file with the same bytes and the same
   table row keeps its manifest entry.
4. A kept entry records its new source revision as checked in `out/rpg-skin/checked.json` (the
   release worktree keeps `out/`), so the next check does not list it as stale. The shape is the
   `CheckedRevision` of the model packs.
5. The handoff shows the avatar pack and the skin: the Forge version against the app of the target
   branch, the files to write, and a warning when the kit asks for an avatar pack version that the
   app does not have. Then the skin sync must run in the same delivery.

## Acceptance

- Tests for the avatar pack compare (provenance only, a changed file, a changed item list) and for
  the handoff lines.
- A release run with `--skin` on the reverted tree changes no file in `demo/public` or `src/apk3d`,
  and the next `rpg-skin.ts --check` lists 0 stale files.
