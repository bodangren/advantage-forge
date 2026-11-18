# Plan and accept civic scenes

Status: in_progress. This plan owns execution status. Source documents retain design details.

Decisions taken 2026-11-19 under Daniel's primary directive of 2026-11-18. The PM may reverse each one.

- The 30 civic P2 maps exist in `scenes/maps/`. The track reconciles them and reviews them.
- Judge bar: 7.0 for a P2 row. The judge family differs from the maker family.
- Rework: one rework by a maker on "ra-quota pick coder", then one rerate.
- Final TSV value: `accepted` or `follow-up`. IDs do not change.

## Phase 1: Inventory

- [~] Task: Write `measure/tracks/asset_scenes_civic_20260928/scenes/inventory.md`.
  Give one row to each of the 30 civic P2 rows.
  Record the map source in `scenes/maps/`, the design note in `docs/map-mockups/`, and the shots `<slug>-3q.png` and `<slug>-top.png`.
  Record the MAPS rating and note from `docs/map-review.html`, and whether an independent judge rated the map.
  Record the maker family where it is known. The default for the 2026-10 map batch is Anthropic Sonnet.
- [ ] Task: Mark a row `missing` when it has no source in `scenes/maps/`.
  Leave the TSV unchanged in this phase.

Gate:

```bash
grep -c 'scenes/maps/' measure/tracks/asset_scenes_civic_20260928/scenes/inventory.md
ls scenes/maps/bathhouse.ts docs/map-mockups/bathhouse.md docs/map-mockups/bathhouse-3q.png docs/map-mockups/bathhouse-top.png
```

The inventory has 30 source paths.

Red evidence: `bash measure/runs/asset_scenes_civic_20260928/check-inventory.sh` exits 1; `scenes/inventory.md` is absent.

## Phase 2: Independent review

- [ ] Task: Send the shots of each existing civic map to an independent judge.
  Use the route from "ra-quota pick vision-review". Work in batches of about 8 maps.
  The judge rates each map out of 10 against its design note. The bar is 7.0.
  Use a judge family that differs from the maker family. The default maker for this batch is Anthropic Sonnet.
  Write one JSON and one log per batch in `measure/runs/asset_scenes_civic_20260928/` as `vision-review-<batch>.json` and `.log`.
- [ ] Task: Copy each rating and note into the inventory row, and mark the row `rated`.

Gate:

```bash
ls measure/runs/asset_scenes_civic_20260928/vision-review-*.json
```

Four batches cover the 30 maps, and each JSON gives one rating per map.

## Phase 3: Rework

- [ ] Task: Rework each map below 7.0 or with a critical error, once.
  Give the job to a maker on "ra-quota pick coder".
  Regenerate the map with `scripts/design-<slug>.mjs` or edit `scenes/maps/<slug>.ts`.
  Then shoot the two views into `docs/map-mockups/`:

```bash
node_modules/.bin/vite --port 5199
FORGE_SHOT_BASE=http://127.0.0.1:5199/hamlet.html node scripts/shoot-map.mjs docs/map-mockups \
  'bathhouse-3q=scene=bathhouse&clean&az=35&el=47&dist=16&tx=0&tz=0' \
  'bathhouse-top=scene=bathhouse&clean&az=0&el=86&dist=14&tx=0&tz=0'
```

  Set `dist` from the room size of each map. Keep the three-quarter camera at 45 to 50 degrees.
- [ ] Task: Rerate each reworked map once with an independent judge.
- [ ] Task: Apply the stop rule.
  After the third rating below the bar, put the map on the follow-up list.
  Do not start a fourth rating.

Gate:

```bash
ls -l docs/map-mockups/bathhouse-3q.png docs/map-mockups/bathhouse-top.png
```

Each reworked map has a fresh pair of shots and a newer rating.

## Phase 4: Records

- [ ] Task: Update the TSV status column for each reviewed map.
  Use `accepted` or `follow-up`. Do not change any ID. Cite the commit in this plan.
- [ ] Task: Decide the `docs/map-review.html` note.
  `scripts/map-review-page.mjs` generates that page from `bench/sonnet/log.tsv`. No tool reads the page.
  Leave the page alone unless the PM names it as the record.
- [ ] Task: Run the doctor.

```bash
./measure/doctor.sh
```

## Civic review record

Add one row per map when its final rating is known. The TSV is the acceptance record.

| Map | Source | Final rating | Judge family | Result |
| --- | --- | ---: | --- | --- |

## P0 map acceptance (2026-10-02, track `asset_p0p1_completion_20261002`)

One `forge-sonnet-medium` agent per map worked from a brief (`bench/sonnet/briefs/map-<map>.md`); the orchestrator reviewed each result against the mockup and made the last fixes. The blueprint row is `accepted`. Scores are in `bench/sonnet/log.tsv`.

| Row | Map | Source | Shots | Score | Result |
| --- | --- | --- | --- | ---: | --- |
| blacksmith-shop | blacksmith shop | `scenes/blacksmith-shop.ts` | `docs/blacksmith-mockups/render-3q.png`, `render-top.png` | 7.5 | A 6 x 6 m shop; the forge (scale 1.35) is the focal mass; work triangle with anvil, quench tub, coal, and bellows; stock and tools on both walls. 64 pieces. |
| tavern | tavern | `scenes/tavern-interior.ts` | `docs/tavern-mockups/render-3q.png`, `render-top.png` | 7.5 | The common room is full: patrons and food in every quarter, a hearth group with the bard, a dressed bar. 148 pieces. Interiors take a warm key light from the camera side. |

The P2 rows of this group remain `mockup-needed`.
