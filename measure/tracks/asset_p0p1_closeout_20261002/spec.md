# Close the remaining P0 and P1 rows

## Purpose

The status report of 2026-10-02 found 18 P0 and P1 rows below their bars and two deferred P2 rows.
This track brings each row to its bar or records the owner decision for it, so that P2 work can start.

## Owner decisions (2026-10-02)

- Characters: 7.5 is acceptable. Record the rating; games use a weaker character less often.
  Characters at 7.5 or more are accepted: farmer 7.6, quest-giver 7.5, horse 7.5, bone-golem 7.5,
  bandit-archer 7.5.
- The three deferred assets (wood-golem, cliff-face, key-skeleton) get one more pass.
  Cliff-face must reach its bar; the orchestrator builds it if an agent fails.
- The orchestrator owns the helmet edits of the crashed session (done in 0b14487).
- Rework agents run a type check of their file before they report.

## Scope

| Row | Priority | Last score | Bar | Work |
| --- | --- | ---: | ---: | --- |
| long-sword | P0 | 7.0 | 7.5 | Rework (agent) |
| shortbow | P0 | 7.0 | 7.5 | Rework (agent) |
| staff | P0 | 7.2 | 7.5 | Rework (agent) |
| leather-armor | P0 | 7.0 | 7.5 | Rework (agent); keep the avatar fit |
| iron-helmet | P0 | 7.0 | 7.5 | Done: 7.5 (0b14487) |
| halberd | P1 | 6.5 | 7.0 | Rework (agent) |
| gauntlets | P1 | 6.3 | 7.0 | Rework (agent): closed fists that fit the avatar hands |
| belt-pouch | P1 | 6.3 | 7.0 | Rework (agent) |
| cloth-hood | P1 | 6.5 | 7.0 | New review of the current render |
| cliff-face | P1 | 6.5 | 7.0 | Rebuild (orchestrator) |
| stone-golem | P1 | 7.0 | 7.5 | Rework (agent) |
| wraith | P1 | 7.0 | 7.5 | Rework (agent) |
| wood-golem | P1 | 7.5 | 7.5 | One more pass (agent) |
| key-skeleton | P2 | 6.8 | 7.0 | One more pass (agent) |

Briefs: `bench/sonnet/briefs/<name>-closeout.md`. Reviews: `bench/sonnet/log.tsv`, batch `closeout`.

## Exclusions

- The other avatar fit reworks (belt, chainmail, plate-armor, and the rest): track `avatar_system_20261001`.
- Type errors in files outside this scope: track `asset_quality_20260928`.

## Acceptance criteria

- Every row in scope has a recorded score at its bar from its current render, or an owner decision.
- Each reworked asset passes `./forge all` with no `warning:` lines and `node scripts/typecheck-asset.mjs`.
- Equipment with an `equip` block still passes `./forge check`; characters end `result ok`.
- Paths and catalog IDs do not change. Commits use explicit paths.
