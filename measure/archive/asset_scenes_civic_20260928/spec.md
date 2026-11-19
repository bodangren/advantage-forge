# Plan and accept civic scenes

## Purpose

This track owns every civic row in the 100-scene blueprint list.
The 30 civic P2 maps already exist in `scenes/maps/`. The track reconciles their evidence, rates them with an independent judge, and reworks the maps below the bar.

The TSV still says `mockup-needed` for these rows. That status is stale.

## Acceptance criteria

- Each of the 30 civic P2 rows has an inventory row with its source, design note, shots, rating, and judge state.
- An independent judge rates each map against its design note at or above 7.0 out of 10.
- The judge family differs from the family that built the map.
- A map below the bar gets one rework and one rerate.
- The TSV status column reads `accepted` or `follow-up`. IDs do not change.
- A row with no source is marked `missing`.
- The track distinguishes inventoried, rated, reworked, and accepted rows.

## Paths

| Artifact | Path |
| --- | --- |
| Map source | `scenes/maps/<slug>.ts` |
| Design note | `docs/map-mockups/<slug>.md` |
| Mockup image | `docs/map-mockups/<slug>.jpg` |
| Comparison shots | `docs/map-mockups/<slug>-3q.png`, `<slug>-top.png` |
| Inventory | `measure/tracks/asset_scenes_civic_20260928/scenes/inventory.md` |
| Judge record | A JSON and a log in `measure/runs/asset_scenes_civic_20260928/` |
| Acceptance record | The TSV status column in `docs/fantasy-world-scene-blueprints.tsv` |

The design note and the shots already exist for every one of the 30 rows. Keep the existing IDs and paths.

## Review bar and judge

The bar is 7.0 for a P2 row, out of 10. The rubric is `.claude/skills/forge-assets/references/review.md`.
An independent judge on the route from "ra-quota pick vision-review" rates the shots against the design note.
The judge family differs from the maker family. Record the maker family per map in the inventory.
The default maker family for the 2026-10 map batch is Anthropic Sonnet.

The builder does not score its own map. The owner rule of 2026-10-05 says a self-rating is not acceptable.

## Rework rule

A map below the bar, or with a critical error, gets one rework by a maker on "ra-quota pick coder".
The maker regenerates the map with `scripts/design-<slug>.mjs` or edits `scenes/maps/<slug>.ts`.
Then the map gets one rerate by an independent judge.
After the third rating below the bar, the map goes on the follow-up list.

## Fit values for the judge

The judge uses the values from `docs/dungeon-mockups/fit-check.md` as a check list:

- A 1.0 m median character.
- An opening at least the character plus 0.09 m.
- 1.2 m walls.
- A camera at 45 to 50 degrees.

Every prop follows the main-body rule in `review.md`. The main body stays within 20 percent of the brief on every axis. An appendage may extend the bounding box.

## Mockup route

A mockup image is needed only if a map has no `docs/map-mockups/<slug>.jpg`.
Every one of the 30 rows has that file, so the review needs no new mockup.
If a mockup becomes necessary, use `mmx image generate` on the MiniMax Token Plan at 0 USD metered.
Record the spend as "0 USD metered". Any metered or paid call needs PM approval first.

## Status gate

The TSV value `mockup-needed` is stale for these rows. The final TSV value is `accepted` or `follow-up`.
The inventory holds the working state: `rated`, `reworked`, or `missing`.
A row with no source is `missing` in the inventory and `follow-up` in the TSV.
Each TSV update cites its commit.
The docs note `docs/map-review.html` is generated from `bench/sonnet/log.tsv` by `scripts/map-review-page.mjs`. No tool reads it. Treat it as a view, not a record.

## Reuse

The map pattern is the `scenes/maps/<slug>.ts` module that the `scenes/maps/*.ts` glob loads.
`src/scene/main.ts` already lists bathhouse in `NEW_INTERIOR`.
The generators `scripts/design-<slug>.mjs` write the map source and the design note together.
Use the existing map source and generator for a rework. Do not duplicate a map source.

## Sources

- [docs/fantasy-world-scene-blueprints.tsv](../../../docs/fantasy-world-scene-blueprints.tsv)
- [docs/map-mockups/](../../../docs/map-mockups/)
- [docs/map-review.html](../../../docs/map-review.html)
- [scripts/map-review-page.mjs](../../../scripts/map-review-page.mjs)
- [docs/dungeon-mockups/fit-check.md](../../../docs/dungeon-mockups/fit-check.md)
- [.claude/skills/forge-assets/references/review.md](../../../.claude/skills/forge-assets/references/review.md)

## Scope control

Existing paths remain stable. Catalog IDs define scope; filename matches indicate source coverage only.
