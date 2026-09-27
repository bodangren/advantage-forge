# Dungeon vertical fit check (pre-flight sheet)

Written after round 1, not before it — that was the planning failure. This sheet is now the
gate for any batch launch: no trial starts until every dimension here is checked against the
character reference.

## Character reference (measured from built assets)

- Median humanoid: **1.00 m** tall (rogue 1.02, orc-warrior 1.03, cleric 0.90).
- Tallest: guard 1.21 m, knight 1.18 m, skeleton-mage 1.11 m.
- Shortest dungeon-relevant: imp 0.81 m, goblin-warrior 0.93 m.
- Passage rule: any opening a character walks through needs **opening ≥ character + 0.09 m**.

## Verticals

| Element | Height | Derived from | Fit note |
| --- | --- | --- | --- |
| Wall | 1.20 m (2 courses × 0.60) | canon wall | head height of the median character; tops stay readable from the top-down camera |
| Portal opening (door, arch, gate) | 1.0 m wide × 1.60 m tall | guard 1.21 + 0.09 → min 1.30; round arch needs room → 1.60 | jamb rises about 0.4 m above wall runs — portals read as passages from above |
| Flat-lintel alternative | opening 1.30 m tall | guard clearance | lintel top about 1.45 m — still 0.25 m above walls, but square-headed |
| Alcove niche | 0.5 m wide × 0.7 m tall × 0.25 m deep | props must read at 128 px | cuts through both courses (0.7 > 0.6); interior slate |
| Sconce stub | 1.20 m = wall height | canon wall | merges into wall runs; flame 1.3–1.4 m, above every head |
| Stairs | top step 0.90 m | half wall height | cheeks carry the canon courses |
| Pillar | 1.40 m | freestanding | taller than walls is correct for a room divider |

## Camera and fog of war (decided)

- View: scrolling three-quarter camera showing a viewport, not the whole map.
- Unvisited areas hide behind **fog of war**: unvisited tiles unrendered, explored tiles
  dimmed, visible tiles lit. Walls block line of sight on the 2 m tile grid.
- This is game-engine work, not asset geometry — it belongs on the game implementation list.
- Because fog of war does the hiding, walls stay at **1.20 m**: the camera never loses the
  player behind geometry, and every asset built to the 1.2 m wall height stays valid.
- Portals at 1.6 m openings rise above the wall line by design: they read as passages.

## Wall plan evaluation (mockup-verified)

Assembled southwest quadrant of the Sunken Vault from the real GLBs
(`scenes/dungeon-check.ts`, shots in this folder as `dungeon-check-*.png`). Rules below are
verified against those renders, not assumed.

**Works:**

- Walls are full 2 m edge segments (2.004 m actual). Portals made in round 2 (arch, door)
  are also full segments and replace a wall slot one-for-one.
- Walls stand at y = 0 and sink 9 cm under the 0.09 m floor — no gaps at any base.
- Masonry reads as one build across wall, corner, door, and arch (courses, bevels, joints,
  base moss all match the canon plate).
- A 1.0 m character stays visible over 1.2 m walls from game-camera elevations (45–50°).
  The 2.4 m arch and 2.28 m door read as passage markers without swallowing the map.

**Assembly rules (these cost a re-placement if ignored):**

1. A corner piece's arms are full 2 m walls. Each arm **replaces** the straight segment on
   that edge — placing both doubles the corner mass (checked and re-shot).
2. T-junctions (a run ending against a perpendicular wall, e.g. where an inner wall meets a
   perimeter wall) leave a visible cut-stone end face and a ~2 m recessed pocket. It reads
   acceptable; there is no end-cap piece in the kit. Accepted for this kit.
3. Segment seams every 2 m show as joint lines; block courses align across seams.

**Open problem — RESOLVED by the generated map (2026-09-27):**

The hand count above assumed the undocumented zone union. The final map is
derived from cell edges by `scripts/design-sunken-vault.mjs`, so slots, corners,
and pieces reconcile by construction: **76 wall slots**, of which **15 corners**
each cover 2 slots, leaving 46 straight slots (31 wall, 4 alcove, 4 arch,
3 door, 1 gate, 2 bars, 1 stair gap) — **60 wall-system pieces** plus 77 floor
tiles (58 floor + 19 floor-cracked) and 1 stairs. See
[map.md](./map.md) for the ASCII plan and allocation table; `components.tsv`
now carries these exact counts. The internal subdivision walls (cell-block
cross, crypt row) are documented there.

**Noted during the mockup, not blocking:**

- The gate slot is an empty 2 m gap until the gate asset lands.
- The flooded strip needs a water plane (game layer or an `water` asset) under the walkway.
- Door leaves are static-closed; opening doors is an engine-side swap/hide.
- The sconce in the mockup is the r1 build; the r2 canon sconce was still building.

## Rules for the next kit (castle interior, P2)

1. Build the canon plate asset first; derive every shared-material number from it.
2. Write this fit sheet with real character bounds before generating prompts.
3. Cross-check every per-asset number against the sheet; no prompt ships with a number the
   sheet does not contain.
4. No trial launches before the canon plate and the sheet exist.
