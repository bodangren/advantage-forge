# Plan and accept civic scenes

Status: in_progress. This plan owns execution status. Source documents retain design details.

Decisions taken 2026-11-19 under Daniel's primary directive of 2026-11-18. The PM may reverse each one. Details are in `spec.md` and `spec-review.md`.

- Next scene: `locations/civic/bathhouse` (P2). Order after it: market-square, general-store, inn, then TSV order.
- Mockup route: `mmx image generate` on the MiniMax Token Plan at 0 USD metered. PM approval comes before any metered or paid call.
- Bar: 7.0 for a P2 row, 7.5 for a P0 row.
- Gate: `mockup-needed` to `mockup-ready` to `assembled` to `accepted`.

## Phase 1: Mockup and inventory

- [ ] Task: Reconcile the `locations/civic/bathhouse` row with its sources.
  Read the TSV row, `assets/towel-stack.ts`, `assets/wash-basin.ts`, `assets/towel-rack.ts`, and `docs/bathhouse-mockups/README.md`.
  Record the P2 priority, the `mockup-needed` status, and the three existing props.
- [ ] Task: Make the bathhouse scene mockup with `mmx image generate` at 0 USD metered.
  Write `docs/bathhouse-mockups/bathhouse-mock.jpg` in the `docs/item-mockups/` style: one room, a three-quarter view from slightly above, a warm palette.
  Record the spend in the file README as "0 USD metered".
- [ ] Task: Advance the row to `mockup-ready`.
  Update `docs/fantasy-world-scene-blueprints.tsv` status for `locations/civic/bathhouse`. Cite the commit in `plan.md`.

Gate:

```bash
ls -l docs/bathhouse-mockups/bathhouse-mock.jpg
grep 'locations/civic/bathhouse' docs/fantasy-world-scene-blueprints.tsv
```

## Phase 2: Fit checks

- [ ] Task: Write the component list `measure/tracks/asset_scenes_civic_20260928/scenes/bathhouse.md`.
  Give each component a catalog ID or an explicit addition, a quantity, and transform notes.
  Take the fit values from `docs/dungeon-mockups/fit-check.md`: a 1.0 m median character, an opening at least the character plus 0.09 m, 1.2 m walls.
  Apply the main-body rule in `.claude/skills/forge-assets/references/review.md` to every prop: the main body stays within 20 percent of the brief on every axis.
- [ ] Task: Pin the camera and game-layer values before production.
  Set the camera at 45 to 50 degrees for the three-quarter view and at about 86 degrees for the top view.
  Give the room its floor, wall, and door dimensions in meters.

Gate:

```bash
grep -n 'Bathhouse' measure/tracks/asset_scenes_civic_20260928/scenes/bathhouse.md
```

## Phase 3: Assembly

- [~] Task: Review existing examples and complete missing components.
  Use `scenes/blacksmith-shop.ts` and `scenes/tavern-interior.ts` as the pattern: one `places()` export, a grid of floors and walls, then props by zone.
  Cite catalog IDs from `docs/fantasy-world-asset-catalog.md`.
  A missing component becomes an explicit addition. Build it in `assets/` through the normal asset loop, then add it to the component list.
- [ ] Task: Assemble the bathhouse in `scenes/bathhouse.ts`.
  Export `bathhousePlaces(): Place[]`. Place the floor and wall tiles first, then the washing, drying, and rest zones.
  Reuse the three existing props. Do not duplicate a source that exists.
- [ ] Task: Register the scene for the render path like the tavern.
  Add a `sceneName === 'bathhouse'` branch in `src/scene/main.ts` that calls `bathhousePlaces()`.
  Keep the branch before the fallback. A file at `scenes/maps/bathhouse.ts` would win, so do not create one.

Gate:

```bash
npx tsc --noEmit
./forge build towel-stack   # and each new component, once per asset
```

The build output has no `warning:` lines.

## Phase 4: Verification

- [ ] Task: Render the two comparison views into `docs/bathhouse-mockups/`.
  Start the dev server, then run the scene shot command:

```bash
node_modules/.bin/vite --port 5199
FORGE_SHOT_BASE=http://127.0.0.1:5199/hamlet.html node scripts/shoot-map.mjs docs/bathhouse-mockups \
  'render-3q=scene=bathhouse&clean&az=35&el=47&dist=16&tx=0&tz=0' \
  'render-top=scene=bathhouse&clean&az=0&el=86&dist=14&tx=0&tz=0'
```

  Set `dist` from the final room size. Keep the three-quarter camera at 45 to 50 degrees.
- [ ] Task: Compare the assembled views with the mockup.
  List the three largest differences, then fix the largest one first.
  Repeat until the silhouette, proportions, and palette match.
- [ ] Task: Score the scene with an independent judge.
  Use the route from "ra-quota pick vision-review" with a family different from the maker family.
  The judge rates out of 10 against `review.md`. The bar is 7.0 for this P2 row.
- [ ] Task: Record acceptance and refresh the blueprint status without changing IDs.
  Add the row to the civic acceptance table below. Set the TSV status to `accepted`. Cite the commit.
- [ ] Task: Refresh Measure facts and run the doctor.

```bash
./measure/doctor.sh
```

## Civic P2 acceptance

| Row | Scene | Source | Shots | Score | Result |
| --- | --- | --- | --- | ---: | --- |
| bathhouse | bathhouse | `scenes/bathhouse.ts` | `docs/bathhouse-mockups/render-3q.png`, `render-top.png` |  | `mockup-needed` |

## P0 map acceptance (2026-10-02, track `asset_p0p1_completion_20261002`)

One `forge-sonnet-medium` agent per map worked from a brief (`bench/sonnet/briefs/map-<map>.md`); the orchestrator reviewed each result against the mockup and made the last fixes. The blueprint row is `accepted`. Scores are in `bench/sonnet/log.tsv`.

| Row | Map | Source | Shots | Score | Result |
| --- | --- | --- | --- | ---: | --- |
| blacksmith-shop | blacksmith shop | `scenes/blacksmith-shop.ts` | `docs/blacksmith-mockups/render-3q.png`, `render-top.png` | 7.5 | A 6 x 6 m shop; the forge (scale 1.35) is the focal mass; work triangle with anvil, quench tub, coal, and bellows; stock and tools on both walls. 64 pieces. |
| tavern | tavern | `scenes/tavern-interior.ts` | `docs/tavern-mockups/render-3q.png`, `render-top.png` | 7.5 | The common room is full: patrons and food in every quarter, a hearth group with the bard, a dressed bar. 148 pieces. Interiors take a warm key light from the camera side. |

The P2 rows of this group remain `mockup-needed`.
