# Plan and accept civic scenes

## Purpose

This track owns every civic row in the 100-scene blueprint list. Existing examples require evidence reconciliation before acceptance.

## Acceptance criteria

- Each scene has a labeled mockup, scale, entrances, and a component list.
- Each component resolves to a catalog ID or an explicit addition.
- The scene records transforms and quantities for reusable assets.
- The assembled scene has comparison renders and documented limits.
- The track distinguishes mockup readiness, assembly, and acceptance.
- The mockup, the scene source, and the comparison renders exist at the pinned paths below.
- An independent judge rates the comparison renders against the mockup at or above the bar.
- The TSV status column shows the gate state, and each move cites its commit.

## Scene order

The next scene is `locations/civic/bathhouse` (P2).
The three bathhouse props (`assets/towel-stack.ts`, `assets/wash-basin.ts`, `assets/towel-rack.ts`) and `docs/bathhouse-mockups/` already exist. This scene costs the least.

The order after bathhouse is market-square, general-store, inn, then the remaining rows in TSV order.
These defaults come from Daniel's primary directive of 2026-11-18. The PM may reverse each one.

## Mockup route

Scene mockups come from `mmx image generate` on the MiniMax Token Plan at 0 USD metered.
This is the route that made `docs/bathhouse-mockups/`. Record each mockup spend as "0 USD metered".
Any metered or paid generation needs PM approval first.

## Paths

| Artifact | Path |
| --- | --- |
| Scene source | `scenes/<scene>.ts` (bathhouse: `scenes/bathhouse.ts`) |
| Mockup | `docs/<scene>-mockups/<scene>-mock.jpg` |
| Comparison renders | `docs/<scene>-mockups/render-3q.png`, `render-top.png` |
| Component list | `measure/tracks/asset_scenes_civic_20260928/scenes/<scene>.md` |
| Acceptance record | A row in the plan acceptance table plus the TSV status column |

These paths mirror the two accepted rows. Existing IDs and paths stay stable.
The component list gives a catalog ID or an explicit addition, a quantity, and transform notes.

## Review bar and judge

The bar is 7.0 for a P2 row and 7.5 for a P0 row, out of 10.
The rubric is `.claude/skills/forge-assets/references/review.md`.
An independent judge on the route from "ra-quota pick vision-review" rates the renders against the mockup.
The judge family differs from the maker family. The builder does not score its own scene.

## Status gate

A row moves through this gate: `mockup-needed` to `mockup-ready` to `assembled` to `accepted`.

- `mockup-ready`: the mockup file exists.
- `assembled`: the scene source, the component list, and the renders exist. The build has no `warning:` lines.
- `accepted`: the judge rating is at or above the bar, and no critical error remains.

Each move updates the TSV status column and cites its commit.

## Reuse and fit

`scenes/blacksmith-shop.ts` and `scenes/tavern-interior.ts` are the pattern.
Catalog IDs come from `docs/fantasy-world-asset-catalog.md`.
A missing component becomes an explicit addition, built in `assets/` through the normal asset loop.

Fit values come from `docs/dungeon-mockups/fit-check.md`:

- A 1.0 m median character.
- An opening at least the character plus 0.09 m.
- 1.2 m walls.
- A camera at 45 to 50 degrees.

Every prop also follows the main-body rule in `review.md`. The main body stays within 20 percent of the brief on every axis. An appendage may extend the bounding box.

## Sources

- [docs/fantasy-world-scene-blueprints.tsv](../../../docs/fantasy-world-scene-blueprints.tsv)
- [docs/fantasy-world-asset-catalog.md](../../../docs/fantasy-world-asset-catalog.md)
- [docs/dungeon-mockups/fit-check.md](../../../docs/dungeon-mockups/fit-check.md)
- [.claude/skills/forge-assets/references/review.md](../../../.claude/skills/forge-assets/references/review.md)
- [docs/bathhouse-mockups/README.md](../../../docs/bathhouse-mockups/README.md)

## Scope control

Existing paths remain stable. Catalog IDs define scope; filename matches indicate source coverage only.
