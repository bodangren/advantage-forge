# Avatar pack and RPG skin: an identical rebuild keeps its version

Status: in progress. The plan records execution state. The [specification](./spec.md) records the
finding, the decision, and the rules.

## Phase 1: Revert

- [x] Task: Revert the no-op release `01fa8cce` (owner decision, 2026-10-21). Forge `5091f982`:
  `demo/public` and `src/apk3d` are the same as `a231f6ea` (avatar pack 1.1.0, skin 1.2.0). The
  monorepo session was told that its hold on syncs past `a231f6ea` ends.

## Phase 2: Rules and tests

- [x] Task: The avatar pack compare ignores `forgeCommit` in JSON files; a same pack stays published
  as it is. `scripts/avatar-version.ts` `compareAvatarPack`: new, same, provenance, patch, or minor.
- [x] Task: `rpg-skin.ts`: checked revisions (`out/rpg-skin/checked.json`, the `CheckedRevision`
  of the model packs; `readChecked` and `writeChecked` take a file), the hero rule, and the byte
  rule for every other file. The hero rule on the real history: the last avatar code commit is
  `cb7c2d10`, the commit of the 16 portrait entries, so the next release keeps them without a shot.
  Why a pixel rule is wrong: the 01fa8cce shots had the same bounding boxes and no shift, and the
  difference heat maps show thin lines on every edge; after a resize to 128 px the noise still
  reached 64 of 255 on some pixels (druid, explorer, knight, shaman), so no tolerance separates it
  from a small real change.
- [x] Task: The handoff shows the avatar pack and the skin against the app of the target branch,
  adds the skin sync step when they differ, and warns when the kit asks for an avatar pack version
  that the app does not have. A JSON file with the same content in another format does not count:
  the app keeps `packs/avatar/1.1.0/portraits.json` without spaces (monorepo `b1c32c3b2`). Replay:
  `--forge-commit 01fa8cce` shows skin 1.2.0 -> 1.2.1 (17 files), avatar pack 1.1.0 -> 1.1.1 (604
  files), and the 404 warning; HEAD `5091f982` shows "no change".
- [x] Task: Tests (`tests/apk3d/avatar-version.test.ts`: the 01fa8cce case is "provenance", a
  changed price or piece is "patch", a removed item is "minor"; `tests/apk3d/monorepo-handoff.test.ts`:
  no change, the 01fa8cce case with the step and the warning, a JSON file in another format, no
  target branch). `tests/apk3d`: 469 tests pass (the first run had 2 failures under machine load,
  which two later runs did not repeat). Docs: `docs/apk-port.md` (skin paragraph and handoff
  contents), the `monorepo-sync` skill (steps 2 and 4).

## Phase 3: Verification

- [ ] Task: A release run with `--skin` changes no output file, and the skin check lists 0 stale files.
- [ ] Task: Run `./measure/doctor.sh` and close the track.
