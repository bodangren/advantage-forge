# Rename the repository to advantage-forge

## Purpose

The repository began as an asset tool. It now holds the Forge tool, the games, and player progression.
It will hold more than one asset pack. The name `fantasy-asset-forge` describes only the first stage.
The owner chose `advantage-forge` on 2026-10-02. The name follows the `advantage-*` pattern of the
other repositories and does not belong to one pack or one product.

## Owner decisions (2026-10-02)

- The new name is `advantage-forge`.
- Chibi Quest is one asset pack (a skin) for the games. It targets primary students.
- Riven Lands is the second asset pack. It targets secondary students (Reading Advantage, grades 7 to 12).
- Naming rules: code repositories use hyphenated lowercase names
  (`../advantage-pr/02-brand/naming-conventions.md`).
- The repository `../advantage-games` already exists (a Next.js vocabulary games app). The new name avoids it.

## Scope

1. **Rename.** The GitHub repository, the local directory, `package.json` name, and the references below.
2. **Pack layout.** A written design for `packs/chibi-quest` and `packs/riven-lands` around the shared Forge
   tool and catalog. The design stays a document until the owner approves the path moves.
3. **Riven Lands brief.** A list of what differs from Chibi Quest: the base character, the equipment fit
   (AGENTS.md says all equipment fits the chibi base, which becomes a per-pack rule), and the art direction.

## Known references (inventory of 2026-10-02)

| Place | Count or note |
| --- | --- |
| Files in this repository that contain `fantasy-asset-forge` | 14 (package.json, scripts, tests, docs, measure evidence, one bench trial) |
| GitHub remote | `https://github.com/bodangren/fantasy-asset-forge.git`. GitHub redirects the old name, but a new repository of the old name breaks the redirect. |
| CI | `.github/workflows/measure.yml` |
| Pages | The demo uses a relative base (`./`), so a path change needs no code change. The site URL changes with the repository name. |
| Sibling repositories | `../reading-advantage-monorepo` (archived Measure tracks only), `../advantage-pr/08-strategy/product-strategy-2026-2027.md` |
| Claude Code memory | Stored under a directory keyed by the project path. The directory name changes with the path. |
| Running processes | Other agents share the working tree and the git index. |

## Constraints

- AGENTS.md: preserve source, output, script, and design paths, and get owner approval before a path change that callers, tools, or users depend on.
- The `./forge` command stays unchanged. Callers and the documents use it.
- Do not move the directory while another agent works in it. Stop all agents first.
- Do not change history. Old Measure tracks keep the old name as a record.

## Acceptance criteria

- `grep` finds `fantasy-asset-forge` only in history records (old tracks, evidence, commit text).
- `pnpm typecheck`, `pnpm test`, and `./forge render` pass in the renamed directory.
- The demo builds and the Pages site loads from the new URL.
- The sibling repositories that name this repository now name the new one.
- The pack layout design exists and the owner approved it.

## Out of scope

- Moving assets into `packs/`. A separate track does that after the owner approves the design.
- Building any Riven Lands asset.
- Renaming the monorepo or the Advantage Play Kit.
