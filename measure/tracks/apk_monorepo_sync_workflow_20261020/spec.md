# Specification: the monorepo sync workflow

## Purpose

Make one repeatable workflow that moves a committed Forge change (kit, games, packs) into the
monorepo. The workflow writes the handoff, delivers it to the monorepo session, and records what
the monorepo received. The tools that build and copy exist (`scripts/apk-release.ts`,
`scripts/monorepo-sync.ts`, track `apk_pack_release_20261006`). The steps between them are manual
today.

## Owner request (2026-10-19, verbatim)

"yes, use ghost with its presets, but you need to let the Monorepo session know to update its copy
of the game, too, unless you are going to do that. (We definitely need some "sync changes to
monorepo" workflow"

On 2026-10-20 the owner asked for this track.

## Rules that stay

- The Forge session works only in Forge. It runs `apk-release.ts` and the read-only
  `monorepo-sync.ts --check`. The monorepo session runs every write mode of `monorepo-sync.ts` and
  makes every monorepo commit, merge, and push (owner rule, 2026-10-06).
- The monorepo session decides if a change can go in during a feature freeze.
- Each heavy job takes `~/Desktop/primary-parity-progress/heavy.lock` (agreed with the monorepo
  session, 2026-10-19).
- A sync carries only committed Forge files and names the Forge commit.
- No new hash fields in the pack format (monorepo `AGENTS.md`).

## Gaps found in the ghost release (2026-10-19)

1. **Manual handoff.** The Forge session wrote the message by hand. It included the Forge commits,
   the `--check` result, the pack versions, the change class, and the QC request.
2. **No record in Forge.** The monorepo commit subject names the Forge commit ("sync from Forge
   d3624720"). Forge has no command that reads it, and no list of the syncs. The owning track plan
   got the monorepo commit by hand.
3. **A byte-identical rebuild changes a pack version.** The release rebuilt the griffin because its
   source revision changed. The new GLB was byte-identical (git blob `2530c137`), but `mounts` went
   from 1.0.1 to 1.0.2. This is against the release spec ("An unchanged pack keeps its version").
   A side agent then reported three changed griffin games, and the owner had to decide on a change
   that was not real.
4. **No list of the games to check.** The games that a change affects follow from the changed
   game folders, the changed models (`GAME_LOADS`), and kit changes (all games). The Forge session
   picked the QC games by hand.
5. **A sync carries every Forge commit.** `monorepo-sync.ts` copies the Forge HEAD of the synced
   paths. During a freeze, a feature commit in Forge goes in with the next fix.

## Scope

1. **Handoff generator** (read-only): `scripts/monorepo-handoff.ts`. It finds the last synced Forge
   commit from the monorepo branch log. It lists the Forge commits since then in the synced paths,
   with their class (`fix`, `feat`, `chore`, `docs` from the subject). It summarizes the
   `monorepo-sync.ts --check` result and the pack versions (old and new). It lists the models with
   changed bytes and the models that are only rebuilt. It names the affected games and the QC
   request, and the exact commands for the monorepo session. It writes
   `out/monorepo-sync/handoff-<forge-sha>.md` and prints the text.
2. **Delivery**: a Forge skill (`.claude/skills/monorepo-sync/`) for the Forge session: commit, run
   the release under the heavy lock, make the handoff, send it with `SendMessage` to the monorepo
   session, wait for the answer, and record it. A script cannot send a session message, so the
   skill does that step.
3. **Record**: `monorepo-handoff.ts --record <monorepo-sha>` checks that the monorepo commit names
   the Forge commit, and adds a row to the ledger `measure/monorepo-syncs.md`. Each row has the date,
   the Forge commit, the monorepo commit and branch, the integration merge, the checks, and the
   owning tracks. `--status` lists the Forge commits that the monorepo has not received.
4. **Unchanged packs keep their version**: a rebuild with byte-identical outputs changes no pack
   file. The release remembers the checked source revision, so the model is not stale again.
5. **Sync from a named Forge commit**: `monorepo-sync.ts --forge-commit <sha>` copies from a clean
   worktree at that commit, so a fix sync can leave out later feature commits.
6. **The monorepo side**: the monorepo session's receiving steps (sync, checks, commit, merge into
   integration, answer with the commit). The monorepo session owns and writes that procedure.

## Out of scope

- Forge writes to the monorepo, and automatic merges or pushes.
- The RPG skin sync (`--skin`). Its handoff can use the same format later.
- Changes to the monorepo's own scripts (`port-kit.mjs`, `port-game.mjs`).

## Open decisions (proposals)

1. Delivery: the message carries the full handoff, and the file stays in Forge `out/`. Proposal:
   yes. A copy in a shared folder is not necessary.
2. Byte-identical rebuild: no version bump, no pack file change (scope 4). Proposal: yes.
3. Ledger location: `measure/monorepo-syncs.md` in Forge. The monorepo keeps its own record.

## Acceptance

- One command makes the handoff for a release, and its facts match `--check` and the git logs.
- The next real release (the first sync after the Primary cutover) uses the skill from start to
  end, and the ledger has its row.
- A byte-identical rebuild leaves every pack version unchanged (test).
- `--status` shows no pending Forge commit after that sync.
