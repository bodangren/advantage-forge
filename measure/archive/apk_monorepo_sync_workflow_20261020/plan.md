# Monorepo sync workflow: handoff, delivery, and record of Forge changes

Status: completed (2026-10-20). The plan records execution state. The [specification](./spec.md) records the
gaps, the scope, and the owner decisions. `docs/apk-port.md` ("Sync workflow") retains the workflow.

## Phase 1: Design and agreement

- [x] Task: Write the workflow in `docs/apk-port.md` ("Release flow", new section "Sync workflow"):
  the steps, who runs each step, the handoff format, the ledger, the freeze rule, and the heavy lock.
- [x] Task: Agree the handoff format and the receiving steps with the monorepo session. Its answer
  (2026-10-20): it agrees to the format and the receiving steps 1-5. (a) The merge target is
  `primary-parity-integration` until the owner merges it into master after the cutover; after that
  the owner decides, so the target is the handoff parameter `--target` and is not fixed in the
  script. (b) The app keeps the asset base "/": it serves `/packs/<id>/<version>/` and
  `/assets/apk/primary-chibi-2d/v1/`, and its Docker build runs `pnpm build` (prebuild
  `sync:3d-assets`). Its rebuild script now runs `sync:3d-assets` before `next build`. The owner
  decisions are in the specification.

## Phase 2: Tests

- [x] Task: Test the handoff rules (`tests/apk3d/monorepo-handoff.test.ts`): the last sync from a
  monorepo log, the commit classes, the track ids, the git tree reader, the 3D pack comparison (same
  bytes under a new version, new, removed, changed models and preset textures), the 2D comparison
  (sheets, props, backgrounds), the affected games (game files, a model through a game's models,
  packs, and heroes, a 2D background), the pack line of a sync commit body, and the handoff text
  (the feature warning, `--forge-commit`, the target branch, the pack URLs). Replay on real history:
  `--branch ce5a63131 --forge-commit d3624720` (the ghost release) reports the griffin as "same
  bytes" and asks for no griffin game check.
- [x] Task: Test the identical-rebuild rule with the real griffin entry of `mounts`: a rebuild that
  changes only `forgeCommit` keeps the entry, so the manifest text and the version stay; a changed
  file, triangle count, or clip list is not identical; a checked source revision makes the old entry
  fresh for that revision only. The heavy lock parser reads holders from `/proc/locks` and skips a
  waiting lock. 14 tests pass.

## Phase 3: Implementation

- [x] Task: Write `scripts/monorepo-handoff.ts` (read-only in the monorepo): the handoff text and
  `out/monorepo-sync/handoff-<forge-sha>.md`. It needs `--target`. It lists only the games of the
  monorepo package; a changed Forge game outside it (Monster Encounters) shows as "not synced".
  Shared paths and patterns are in `scripts/monorepo-paths.ts`.
- [x] Task: Add `--status` and `--record [<monorepo-sha>]`. Without a sha, `--record` adds every sync
  commit of the port branch that the ledger lacks: `measure/monorepo-syncs.md` starts with the 10
  syncs from 2026-10-06 to 2026-10-19 (`e31a4e349` to `7d343fb95`).
- [x] Task: Change the release. `apk-release.ts` takes the heavy lock itself (`scripts/heavy-lock.ts`:
  it runs again under `flock` unless an ancestor process holds the lock, so a call that a caller
  wrapped in flock does not wait for itself; tested wrapped, not wrapped, and blocked).
  `apk3d-models.ts` keeps the pack entry of a model that rebuilds to the same bytes. In a release
  (`APK_RELEASE=1`), it records the new source revision in `out/apk-release-checked.json`, and the
  stale check of `apk-release.ts` reads it. A manual run writes no checked revision, because it did
  not rebuild the changed models. The 2D pack already compared file bytes.
- [x] Task: Add `monorepo-sync.ts --forge-commit <sha>`. It extracts the synced paths of that commit
  from git into a temporary folder (about 50 MB; a worktree takes about 600 MB, and the disk had
  7.9 GB free), with `package.json`, the stories, and a link to `node_modules` for the port checks.
  `--check --forge-commit d3624720` reports "in sync". The sync prints a note when the Forge commit
  does not contain the last synced one. `FORGE_PATHS` now includes `tests/games`, which
  `port-game.mjs` copies: before, an uncommitted Forge game test could enter a sync.
- [x] Task: Write the Forge skill `.claude/skills/monorepo-sync/SKILL.md`: commit, release, Forge
  checks, handoff, `SendMessage` to the monorepo session, record, and the fix-only sync.

## Phase 4: Monorepo side (monorepo session)

- [x] Task: The monorepo session writes its receiving steps (sync, checks, commit, merge into the
  target branch, answer with the monorepo commit, checks after the app rebuild). Done 2026-10-20:
  monorepo `924fe0767` on `primary-parity-integration`, `docs/runbooks/forge-sync-receiving.md`.
  Its steps: read the handoff (during a freeze, fix and release commits only; a feature needs the
  owner's go); bring the port branch up to the target with `--ff-only`; run
  `monorepo-sync.ts --commit [--forge-commit <sha>]` from the Forge root under the heavy lock; merge
  into the target with `--ff-only` and build the kit and games `dist`; answer Forge with the commit
  and the gate results; after the app rebuild, check each new pack URL (200), the 2D pack version,
  and the handoff games in 3D (headed Chrome) and 2D (`?renderer=phaser`). It records that a plain
  `next build` skips `sync:3d-assets`.

## Phase 5: Verification

- [x] Task: Use the workflow for the first sync after the Primary cutover (it carries the XP guard
  `a70e1ebf`). Record the handoff, the monorepo commit, and the ledger row here.
  The cutover runs on 2026-10-20 from 18:00 Bangkok. The Monorepo session asked Forge to take no
  heavy.lock from 17:30 Bangkok until its message "cutover done", and to start this sync after that
  message. The owner decided that the Sky-Joust look fix `431faf51` waits for this sync too. The
  Monorepo session names the target branch in its "cutover done" message.
  2026-10-20 (Bangkok 18:00): the Monorepo session reported "cutover done" (Primary production on
  revision 00132-qeq since 16:21 Bangkok) and named the target `primary-parity-integration`.
  `apk-release.ts --check` at 1296b76e: no stale model, no pack release. Handoff
  `out/monorepo-sync/handoff-1296b76e.md` (2 fix commits, kit `contracts/results.ts` and
  `view2d/hud2d.ts`, 3 Sky-Joust files, the XP guard test; no pack change) sent, with notes on the
  2D tag check in other games. The monorepo session answered: monorepo `0c220e663` "sync from
  Forge afc8b890" on `apk3d-games-port` (afc8b890 = 1296b76e plus this plan); gate 7 of 7 passed
  (port-kit, port-game, kit tests, kit types, kit build, games tests 128 files and 2011 tests,
  games types); 6 files, no new pack version; fast-forwarded into `primary-parity-integration`, both
  package `dist` builds pass. `monorepo-handoff.ts --record 0c220e663` added the ledger row
  (2026-10-20, 2 commits, no pack, `game_griffin_sky_joust_20260928`,
  `game_xp_end_card_20261020`). The browser checks after the next app rebuild belong to those two
  tracks (skill step 7).
- [x] Task: Run `./measure/doctor.sh` and close the track. Closed 2026-10-20.
