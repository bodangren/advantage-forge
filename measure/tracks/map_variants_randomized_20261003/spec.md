# Map variants and randomized maps

## Purpose

All 100 maps are built, and each one is a fixed layout. Two gaps remain. A map placement has no
variant field, so a piece cannot take a color preset. Each map type has one layout, so a player who
replays a dungeon or a village sees the same map. This track closes both gaps.

## Findings that shape the work

- A map file lists placements only: `asset`, `at`, `yaw`, `scale`. No map holds shape code.
  A check of all 96 generators in `scripts/design-*.mjs` found no `k.body`, `sdf.`, or `defineAsset`.
- A generator already holds the layout rules. Some use a seed, for example `rnd()` in
  `scripts/design-cliff-village.mjs`.
- The owner rejected four maps because a path, a stair, or a river ended with no destination.
  A random layout must keep the path, the entry, and the exit connected.
- The rules cap a map at 320 pieces.

## Acceptance criteria

- `Place` has an optional `variant` field. The viewer applies a color preset to the piece.
  A piece without the field renders as before.
- A variant that a piece does not define falls back to the default color without an error.
- The dark rock walls use a variant in at least two maps.
- A seeded generator exists for dungeon, village, forest, cave, and tavern.
  The same seed gives the same map. Different seeds give different layouts.
- Every seeded layout keeps one connected path from the entry to the exit and to each focal object.
- A check script tests 50 seeds for each map type. It reports floating pieces, pieces outside the
  map, pieces in a wall, a dead-end path, and a piece count over 320.
- The hand-built maps stay as the authored layout of each type. Their files do not change.
- A seed shows in the map review page, and the owner can reject a single seed.

## Out of scope

- New assets. A missing piece goes to the asset tracks.
- Randomized maps for the other map types. This track picks five types and records the rest as a follow-up.
- Real-time multiplayer and server-side map storage.

## Path policy

Existing design, code, script, source, and output paths remain stable. New generators use the
name `scripts/design-<slug>-seeded.mjs`. Seeded output goes to `scenes/maps-seeded/`.
