---
name: monorepo-sync
description: Send a committed Forge change (APK kit, games, 3D or 2D packs) to the monorepo session and record what the monorepo received. Use this skill for ANY request to sync, port, release, or hand off Forge games, kit code, or packs to the monorepo ("sync this to the monorepo", "let the Monorepo session know", "release the packs"), and when the monorepo session answers with a sync commit. Forge never writes to the monorepo; the monorepo session runs every write.
---

# Sync a Forge change to the monorepo

Track `apk_monorepo_sync_workflow_20261020`; the workflow is in `docs/apk-port.md` ("Release flow").
Owner rules: the Forge session works only in Forge, and the monorepo session runs every write mode
of `scripts/monorepo-sync.ts` and makes every monorepo commit. The monorepo session decides what can
go in during a feature freeze. The owner decides the target branch.

## Steps

1. **Commit the change in Forge** by explicit paths (other sessions share the git index). The
   synced paths must be clean: `src/apk3d`, `src/games`, `tests/games`, the packs, and the parity test.
2. **Release the packs when a model or a pack changed.** Run
   `node --import tsx scripts/apk-release.ts --check`. When it lists stale models, run
   `node --import tsx scripts/apk-release.ts --commit` in the background. It takes the shared heavy
   lock itself. A rebuild to the same bytes changes no pack version. Add `--skin` when a skin source
   changed (an icon, an item view, a hero piece, a scene map); an identical skin rebuild also keeps
   the skin and avatar pack versions.
3. **Check the changed games in Forge.** Run `scripts/apk3d-shot.ts` in 3D and with `--2d` under
   `flock ~/Desktop/primary-parity-progress/heavy.lock`. Look at the screenshots.
4. **Make the handoff.** Run
   `node --import tsx scripts/monorepo-handoff.ts --target <branch>`. Ask the owner or the monorepo
   session for the target branch if you do not know it. The command writes
   `out/monorepo-sync/handoff-<sha>.md`. Read it:
   - A feature commit in the range during a freeze needs the owner, or a fix-only sync (below).
   - "Same bytes" models changed no file: their games need no check.
   - "Not synced" games are Forge games that the monorepo package does not have.
   - An "RPG skin" or "Avatar pack" line with files to write adds the skin sync step. A line "The
     kit asks for avatar pack <version>" means that the port sync alone breaks the avatars (404):
     the skin sync must go in the same delivery.
5. **Send the handoff.** Find the monorepo session with `ListAgents`, and send the full handoff
   text with `SendMessage`. Make the first line "Forge sync request: <sha> ...". Do not poll: its
   answer arrives as a message.
6. **Record the answer.** When the monorepo session sends its sync commit, run
   `node --import tsx scripts/monorepo-handoff.ts --record <monorepo sha>`. It checks that the
   subject names the Forge commit and adds a row to `measure/monorepo-syncs.md`. Add the monorepo
   commit to each owning track plan that it prints. Commit the ledger and the plans by explicit paths.
7. **Record the checks.** After the app rebuild, the monorepo session checks the pack URLs and the
   games of the handoff. Record its result in the owning track plans.

`node --import tsx scripts/monorepo-handoff.ts --status` lists the Forge commits that the monorepo
does not have.

## A fix-only sync during a freeze

When the range has a feature commit that must wait:

1. Make a worktree at the last synced Forge commit (the handoff header names it):
   `git worktree add --detach ../advantage-forge-fix <last synced sha>`.
2. In that worktree, `git cherry-pick` the fix commits (and the pack release commit when the fix
   needs new packs). Do not change master.
3. Run `scripts/monorepo-handoff.ts --target <branch> --forge-commit <sha>` with the new commit. The
   steps tell the monorepo session to sync with `--forge-commit <sha>`.
4. Remove the worktree after the monorepo session answers. The next normal sync carries master.
