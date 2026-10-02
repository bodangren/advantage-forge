# Plan and accept civic scenes

Status: in_progress. This plan owns execution status. Source documents retain design details.

## Phase 1: Contract and inventory

- [ ] Task: Reconcile existing mockups and scene sources with the blueprint rows.
- [ ] Task: Select the next scene from game demand and catalog priorities.

## Phase 2: Fit checks

- [ ] Task: Define shared scale, palette, passage clearance, and tile connections.
- [ ] Task: Record camera and game-layer requirements before production.

## Phase 3: Assembly

- [~] Task: Review existing examples and complete missing components.
- [ ] Task: Assemble the selected scene without duplicating reusable sources.

## Phase 4: Verification

- [ ] Task: Compare assembled views with the mockup.
- [ ] Task: Record acceptance and refresh the blueprint status without changing IDs.
- [ ] Task: Refresh Measure facts and run the doctor.

## P0 map acceptance (2026-10-02, track `asset_p0p1_completion_20261002`)

One `forge-sonnet-medium` agent per map worked from a brief (`bench/sonnet/briefs/map-<map>.md`); the orchestrator reviewed each result against the mockup and made the last fixes. The blueprint row is `accepted`. Scores are in `bench/sonnet/log.tsv`.

| Row | Map | Source | Shots | Score | Result |
| --- | --- | --- | --- | ---: | --- |
| blacksmith-shop | blacksmith shop | `scenes/blacksmith-shop.ts` | `docs/blacksmith-mockups/render-3q.png`, `render-top.png` | 7.5 | A 6 x 6 m shop; the forge (scale 1.35) is the focal mass; work triangle with anvil, quench tub, coal, and bellows; stock and tools on both walls. 64 pieces. |
| tavern | tavern | `scenes/tavern-interior.ts` | `docs/tavern-mockups/render-3q.png`, `render-top.png` | 7.5 | The common room is full: patrons and food in every quarter, a hearth group with the bard, a dressed bar. 148 pieces. Interiors take a warm key light from the camera side. |

The P2 rows of this group remain `mockup-needed`.
