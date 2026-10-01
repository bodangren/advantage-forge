# Bring P0 and P1 world assets to their bars

## Purpose

Finish every P0 and P1 world asset (architecture, nature, props, equipment, items) before any P2 work.
The mini-games use P0 and P1 assets. P2 serves the open-world goal and waits.
Assets that the ported games reference come first, so each game port can start when its models pass.

## Owner decisions (2026-10-01)

- Bars: P0 7.5 or more, P1 7.0 or more. Characters keep their bar of 8.
- Ground tiles use one standing height: the 0.3 m slab of the mockups, for every tile.
- Accepted below the character bar: summoner 7.8, ogre-brute 7.8, living-statue 7.8.
- Deferred, not committed: wood-golem 7.5, cliff-face 6.5, key-skeleton 6.8.
- P2 characters and P3 effects wait until this track and the equipment-parts track close.

## Ground slab design (2026-10-01)

- Every ground tile is a 2 m square slab, 0.3 m deep. The walkable top is at y = 0, and the body goes down to y = -0.3.
- The forge-assets terrain rules already put the tile top at y = 0. The old builds sat on y = 0 with their top at 0.06 to 0.19 m.
- Games stand characters and props on y = 0, so they need no change. The scenes that lift props to the old top (old-oak-clearing at 0.08) or sink the floor (tavern-interior and blacksmith-shop at -0.08) get one height fix each.
- The sides show the slab like the tile mockups: a lip of the top material over the family material (soil, sandstone, stone foundation, joists).
- The `tileSurface` plane is removed from the tiles. In a textured build it baked dark blocks onto the top (grass-ground, dirt-ground, and dirt-road-straight had this defect in the games).
- farm-field is a 4 x 3 m overlay that stands on grass tiles. It gets a normal rework, not a slab.
- The recipe is `bench/sonnet/briefs/ground-slab-recipe.md`. The worked example is `assets/grass-ground.ts`.

## Baseline (2026-10-01)

Scores come from `bench/overnight/log.tsv` and `bench/sonnet/log.tsv` (the last score per asset,
spot-check notes included). "No score" means no recorded review, not a bad asset.

| Group | Rows | No score | Below 7 | 7.0 to 7.4 | 7.5 or more | Fit check only |
|---|---|---|---|---|---|---|
| P0 world | 28 | 13 | 1 | 6 | 6 | 2 |
| P1 world | 343 | 63 | 31 | 167 | 74 | 8 |

The ported games reference about 43 world assets. None of them had a recorded score: they are the
first kit assets, older than the review logs.

## Scope

- Batch 1 ([batch1.tsv](./batch1.tsv)): 55 assets. P0 rows below 7.5 or without a score, plus the
  P1 rows that a game in `src/games/` names and that have no score.
- Batch 2: the other P1 rows without a score or below 7.
- Ground tiles: every ground tile to the 0.3 m slab, then the scenes that stand on them.

## Exclusions

- Characters (P0 and P1 are complete).
- Equipment parts (track `asset_equipment_parts_20260930`).
- Type errors and exports (tracks `asset_quality_20260928` and `asset_delivery_20260928`).

## Acceptance criteria

- Every asset in scope has a recorded score at its bar, from its current render.
- Reworked assets pass `./forge all` with no `warning:` lines and have a sprite preview.
- Ground tiles share one slab height, and the scenes that use them still stand on y = 0.
- `bench/sonnet/log.tsv` records every review and rework pass.
- Paths and catalog IDs do not change.
