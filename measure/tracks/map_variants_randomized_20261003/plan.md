# Map variants and randomized maps

Status: new. The plan records execution state. Linked documents retain design detail.

## Phase 1: Variants

- [ ] Task: Add the optional `variant` field to `Place` in `scenes/chibi-quest.ts`.
- [ ] Task: Apply the color preset in the scene viewer. Fall back to the default color for an unknown preset.
- [ ] Task: Test the field with a piece that has a preset and a piece that has none.
- [ ] Task: Use a variant for the rock walls in two maps. Record the shots.

## Phase 2: Seeded generator core

- [ ] Task: Write a shared helper `scripts/lib/map-seed.mjs` with a seeded random source and a path-connection check.
- [ ] Task: Write `scripts/check-map-seeds.mjs`. It tests 50 seeds and reports each rule in the spec.
- [ ] Task: Choose which parts of each map move: dressing, props, zone positions. The path ends and the focal object stay fixed.

## Phase 3: Map types

- [ ] Task: Dungeon, seeded.
- [ ] Task: Village, seeded.
- [ ] Task: Forest, seeded.
- [ ] Task: Cave, seeded.
- [ ] Task: Tavern, seeded.

## Phase 4: Review and close

- [ ] Task: Add the seed to `docs/map-review.html` and let the owner reject one seed.
- [ ] Task: Record the follow-up list of other map types.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
