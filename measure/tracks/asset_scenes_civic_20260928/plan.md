# Plan and accept civic scenes

Status: in_progress. This plan owns execution status. Source documents retain design details.

Decisions taken 2026-11-19 under Daniel's primary directive of 2026-11-18. The PM may reverse each one.

- The 30 civic P2 maps exist in `scenes/maps/`. The track reconciles them and reviews them.
- Judge bar: 7.0 for a P2 row. The judge family differs from the maker family.
- Rework: one rework by a maker on "ra-quota pick coder", then one rerate.
- Final TSV value: `accepted` or `follow-up`. IDs do not change.

## Phase 1: Inventory

- [x] Task: Write `measure/tracks/asset_scenes_civic_20260928/scenes/inventory.md`. (`db233e01`: 30 rows; 150 paths checked with `ls`; MAPS rating 7.0 and the source note on every row; `judge: no`; `maker: Anthropic Sonnet`)
  Give one row to each of the 30 civic P2 rows.
  Record the map source in `scenes/maps/`, the design note in `docs/map-mockups/`, and the shots `<slug>-3q.png` and `<slug>-top.png`.
  Record the MAPS rating and note from `docs/map-review.html`, and whether an independent judge rated the map.
  Record the maker family where it is known. The default for the 2026-10 map batch is Anthropic Sonnet.
- [x] Task: Mark a row `missing` when it has no source in `scenes/maps/`. (`db233e01`: no row is `missing`; all 30 sources exist, and every row holds state `inventoried`)
  Leave the TSV unchanged in this phase.

Gate:

```bash
grep -c 'scenes/maps/' measure/tracks/asset_scenes_civic_20260928/scenes/inventory.md
ls scenes/maps/bathhouse.ts docs/map-mockups/bathhouse.md docs/map-mockups/bathhouse-3q.png docs/map-mockups/bathhouse-top.png
```

The inventory has 30 source paths.

Red evidence: `bash measure/runs/asset_scenes_civic_20260928/check-inventory.sh` exited 1 before `scenes/inventory.md` existed (commit `8e20f73d`).
Red fixed two checker defects in `e964238a`: A9 tests the track directory values, and P1-d reads the state cell only.
Green evidence: the checker exits 0 with `=== Total: 9 checks (PASS=9, FAIL=0) ===`; the plan gate prints `30`. Commit `db233e01` holds the inventory.

## Phase 2: Independent review

- [x] Task: Send the shots of each existing civic map to an independent judge. (`7dc26d74`: four Kimi batches `vision-review-b1..b4` hold 30 ratings on route `kimi-code-plan-cn/kimi-for-coding`; each log cites the route and the model id)
  Use the route from "ra-quota pick vision-review". Work in batches of about 8 maps.
  The judge rates each map out of 10 against its design note. The bar is 7.0.
  Use a judge family that differs from the maker family. The default maker for this batch is Anthropic Sonnet.
  Write one JSON and one log per batch in `measure/runs/asset_scenes_civic_20260928/` as `vision-review-<batch>.json` and `.log`.
- [x] Task: Copy each rating and note into the inventory row, and mark the row `rated`. (`7dc26d74`: 30 rows hold `rated`, the judge route, and the copied rating and note; `d164f980`: adds the `Judge critical` cell, true for mill only; the MAPS cells did not change)

Gate:

```bash
ls measure/runs/asset_scenes_civic_20260928/vision-review-*.json
```

Four batches cover the 30 maps, and each JSON gives one rating per map.

Red evidence: `bash measure/runs/asset_scenes_civic_20260928/check-review.sh` exits 1 on HEAD
`3e8d29e8`: no `vision-review-b<N>.json` file exists (8 FAILs on P2-a). The run log is
`measure/runs/asset_scenes_civic_20260928/red-p2.log`. Smoke fixtures (since removed) showed
P2-a to P2-c pass on well-formed batches, P2-d fail while rows read `inventoried`, P2-c reject
an Anthropic Sonnet judge, and P2-b reject a date string as a rating.
Green evidence: `bash measure/runs/asset_scenes_civic_20260928/check-review.sh` exits 0 with
`=== Total: 34 checks (PASS=34, FAIL=0) ===`, and the plan gate lists four JSON files. Thirty
inventory rows hold `rated`, the judge route, and the copied rating, critical flag and note. Rows
below 7.0 or critical: mill, 5.5, `critical: true` (the judge saw no waterwheel). Mill stays
`rated` in Phase 2, and Phase 3 reworks it. Commit `7dc26d74` holds the inventory and the eight
vision-review files. Commit `d164f980` adds the `Judge critical` cell.
The Phase 1 checker `check-inventory.sh` now exits 1 with
`=== Total: 96 checks (PASS=6, FAIL=90) ===` (P1-c `judge: no` and P1-d `inventoried`). That
failure is by design for a `rated` row.
Spot-check dispositions (2026-11-19, `ux-browser-review-p2-0aed743.json`): the judge files and the
inventory judge cells stay unchanged as evidence. The spot check sampled 8 ratings, and all 8 stay
within 1.0 of the judge.
Bank: the judge note is wrong. `scenes/maps/bank.ts` line 4 places the three chandeliers at y=2
(`[-2,2,2.2]`, `[3.5,2,0.5]`, `[-3.5,2,-2]`). The floor rings in the shots are their shadows. The
7.5 rating stands, so no rework and no rerate follow.
Mill: the waterwheel exists. `assets/watermill.ts` line 20 puts the wheel at x=1.15, and line 116
builds a radius-1.2 rim. The az=35 and el=86 cameras read it edge-on, so the 5.5 note names
readability, not a missing part. Phase 3 fixes the mill yaw or the shot angle. Phase 3 builds no new
wheel.

## Phase 3: Rework

- [x] Task: Rework each map below 7.0 or with a critical error, once. (7619c491: mill only, the one below-bar and critical map; yaw -65 on the watermill makes the wheel face the three-quarter camera; fresh mill-3q.png and mill-top.png committed in 7619c491)
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
- [x] Task: Rerate each reworked map once with an independent judge. (7619c491: the rework audited at 304a75d6; one Kimi rerate of 7.5, critical false, in rerate-mill.json and rerate-mill.log committed with this evidence)
- [x] Task: Apply the stop rule. (7619c491: mill holds three ratings, MAPS 7.0, Judge 5.5, Rerate 7.5; no fourth rating; state accepted, no follow-up)
  After the third rating below the bar, put the map on the follow-up list.
  Do not start a fourth rating.

Gate:

```bash
ls -l docs/map-mockups/mill-3q.png docs/map-mockups/mill-top.png
ls -l docs/map-mockups/bathhouse-3q.png docs/map-mockups/bathhouse-top.png
```

Each reworked map has a fresh pair of shots and a newer rating. The reworked slug is `mill`; the
`bathhouse` line stays as the shot-command example.

Red evidence: `bash measure/runs/asset_scenes_civic_20260928/check-rework.sh` exits 1 on
`b78fdde1`: Below-bar map count 1 (mill, 5.5 and critical true), Rework record count 0
(P3-a FAIL), no rerate exists (P3-c FAIL). Run log
`measure/runs/asset_scenes_civic_20260928/red-p3.log`.

Green evidence: with the mill cells and the two rerate files in place,
`bash measure/runs/asset_scenes_civic_20260928/check-rework.sh` exits 0 with
`=== Total: 41 checks (PASS=41, FAIL=0) ===` at the accepted HEAD `024cfdf9`. Commit
`fa85bb2a` added the ADV-5 and ADV-6 checks after the first Green log, so the log quote of 39 was
stale, and the quote above is the live count. The plan gate
`ls -l docs/map-mockups/mill-3q.png docs/map-mockups/mill-top.png` lists both fresh shots.
The mill row held `Rework: 7619c491`, `Rerate: 7.5`, and state `accepted` at this gate; the other
29 rows read `rated` then, and Phase 4 commit `2881a7a3` moves them to `accepted`.

Phase checkers after the Phase 4 record moves (live at this tree): `check-inventory.sh` exits 1
with `=== Total: 96 checks (PASS=6, FAIL=90) ===`, `check-review.sh` exits 1 with
`=== Total: 63 checks (PASS=33, FAIL=30) ===`, and `check-rework.sh` exits 1 with
`=== Total: 69 checks (PASS=40, FAIL=29) ===` (P3-e wants `rated` on rows that needed no
rework). Each earlier-phase checker fails by design once a later phase moves the state.
`check-records.sh` is the final gate. No fourth rating exists and no map goes on the
follow-up list.

## Phase 4: Records

- [x] Task: Update the TSV status column for each reviewed map. (e2c7bb9c: all 30 civic P2 rows read `accepted`; the diff changes only the status column and no ID moves. 2881a7a3: the 29 inventory state cells that read `rated` now read `accepted`; the mill row already did)
  Use `accepted` or `follow-up`. Do not change any ID. Cite the commit in this plan.
- [x] Task: Decide the `docs/map-review.html` note. (no commit: the page is unchanged against `024cfdf9`, so P4-e passes. No tool reads the page, and the PM did not name it as the record, so it stays a view)
  `scripts/map-review-page.mjs` generates that page from `bench/sonnet/log.tsv`. No tool reads the page.
  Leave the page alone unless the PM names it as the record.
- [x] Task: Run the doctor. (e2c7bb9c tree: `./measure/doctor.sh` exits 1 with 51 error lines from other tracks; no error line names `asset_scenes_civic_20260928`, so the scoped P4-f check passes)

```bash
./measure/doctor.sh
```

Red evidence: `bash measure/runs/asset_scenes_civic_20260928/check-records.sh` exits 1 at
`024cfdf9` with `=== Total: 14 checks (PASS=10, FAIL=4) ===`: the 30 TSV rows still read
`mockup-needed` (P4-a), the TSV holds 0 accepted rows against 30 inventory-supported (P4-c),
and the generator output differs from the committed `mill.ts` (P4-g drift, no `yaw: -65`).
Run log `measure/runs/asset_scenes_civic_20260928/red-p4.log`.

Green evidence: `bash measure/runs/asset_scenes_civic_20260928/check-records.sh` exits 0 at this
tree with `=== Total: 44 checks (PASS=44, FAIL=0) ===`. The total grew from 14 at Red because P4-d
adds one check for each of the 30 changed TSV rows. Run log
`measure/runs/asset_scenes_civic_20260928/green-p4.log`.

- P4-a and P4-c: the TSV holds 30 `accepted` rows and the inventory supports 30. Twenty-nine rows
  hold a Judge rating of 7.0 or higher with critical false, and the mill row holds the rerate 7.5
  in `rerate-mill.json`.
- P4-b: the TSV diff against `024cfdf9` changes 60 data lines, all of them civic P2 rows, and the
  `scene_id`, `group`, and `priority` columns are identical.
- P4-d: this plan cites `e2c7bb9c`, which is an ancestor of HEAD and touches the TSV, so every
  one of the 30 status changes cites its commit.
- P4-e: `docs/map-review.html` is unchanged against `024cfdf9`.
- P4-g (N3): `scripts/design-mill.mjs` now writes `put('watermill', 2.2, -3.4, { yaw: -65 })` in
  commit `93c536c8`. A generator run with its cwd in a temp dir writes `scenes/maps/mill.ts` byte
  for byte equal to the committed file; both hold sha256
  `0d2873d1a0f1c8f26095a01bab32d7ebb336be900cee1d6e437ca809fff5a8c1`, and the committed
  `scenes/maps/mill.ts` was never overwritten.
- P4-f (scoped): `./measure/doctor.sh` exits 1 with 51 error lines, all from other tracks. No error
  line names `asset_scenes_civic_20260928` or its files.

Carried phase-acceptance items N1 to N5 (`phase-acceptance-p3-024cfdf.json`):

- N1 is closed above: the Phase 3 Green quote now reads 41 checks, and it cites `fa85bb2a` for the
  ADV-5 and ADV-6 growth.
- N2 is closed above: the Phase 3 Gate block lists `docs/map-mockups/mill-3q.png` and
  `docs/map-mockups/mill-top.png` next to the bathhouse example.
- N3 is closed by commit `93c536c8` and check P4-g.
- N4 is closed by the by-design note above: `check-inventory.sh`, `check-review.sh`, and
  `check-rework.sh` fail after the Phases 2, 3, and 4 record moves, and `check-records.sh` is the
  final gate.
- N5 is a `test-strategy.md` wording item for the orchestrator. This role leaves that file
  unchanged.

## Closeout

- [ ] Task: Close the track: archive the folder and set the metadata status to completed.
  Owner is the closeout steward. This role records the Phase 4 evidence and writes no closeout
  metadata.

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
