# Plan and accept adventure scenes

Status: in_progress. This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and inventory

- [ ] Task: Reconcile existing mockups and scene sources with the blueprint rows.
- [ ] Task: Select the next scene from game demand and catalog priorities.

## Phase 2: Fit checks

- [ ] Task: Define shared scale, palette, passage clearance, and tile connections.
- [ ] Task: Record camera and game-layer requirements before production.

## Phase 3: Assembly

- [ ] Task: Review existing examples and complete missing components.
- [ ] Task: Assemble the selected scene without duplicating reusable sources.

## Phase 4: Verification

- [ ] Task: Compare assembled views with the mockup.
- [ ] Task: Record acceptance and refresh the blueprint status without changing IDs.
- [ ] Task: Refresh Measure facts and run the doctor.

## P0 map acceptance (2026-10-02, track `asset_p0p1_completion_20261002`)

One `forge-sonnet-medium` agent per map worked from a brief (`bench/sonnet/briefs/map-<map>.md`); the orchestrator reviewed each result against the mockup and made the last fixes. The blueprint row is `accepted`. Scores are in `bench/sonnet/log.tsv`.

| Row | Map | Source | Shots | Score | Result |
| --- | --- | --- | --- | ---: | --- |
| dungeon | Sunken Vault | `scripts/design-sunken-vault.mjs` -> `scenes/sunken-vault.ts` | `docs/dungeon-mockups/vault-3q.png`, `vault-top.png` | 7.5 | Floor tops one step darker toward the slate canon; a floor run outside the gate; one story per room; wall-alcove grafted; warm point lights at the torches, braziers, and candles of dark maps. 221 pieces. |

The P2 rows of this group remain `mockup-needed`.
