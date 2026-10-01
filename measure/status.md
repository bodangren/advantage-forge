# Project status

The asset and game programs remain active. No dated release schedule exists.
Generated status and asset counts appear in `measure/generated/`.

| Workstream | Delivered evidence | Current work | Next acceptance step |
| --- | --- | --- | --- |
| Assets | Forge pipeline, 426 sources, scene kits, and P0/P1 world assets at their bars (2026-10-01) | Equipment parts, export reconciliation | Run the equipment parts pilot, then repair type errors. |
| Games | Six local games with 2D and 3D views | Monorepo port, Rune Match, and Labyrinth | Complete the platform and Potion Rush port. |
| Management | Indexed tracks, catalog ownership, history, debt, and lessons | Migration verification | Run the doctor and commit the migration. |

## Quality baseline

The audit found 140 compiler errors: 139 asset errors and one test error.
The baseline suite passed 645 tests and failed two Labyrinth tests.
These failures remain explicit debt. Measure structural checks do not replace application verification.
See the [baseline evidence](./evidence/baseline-20260928.md).

## Next work

1. [Reusable equipment parts](./tracks/asset_equipment_parts_20260930/): the pilot, then one character per agent.
2. [Restore asset quality gates](./tracks/asset_quality_20260928/).
3. [Complete model packs](./tracks/game_model_packs_20260928/).
4. [Complete the platform port](./tracks/game_platform_port_20260928/).
5. Complete Potion Rush integration and the two active game rewrites.
6. Resume bounded asset batches after checking trial isolation and provider availability.
7. Keep current concurrent asset edits outside the Measure migration commit.

## Navigation

- [Generated status](./generated/status.md) lists current task and track counts.
- [Asset roadmap](./asset-roadmap.md) explains production and acceptance priorities.
- [Game roadmap](./game-roadmap.md) maps every game to its track.
- [Tracks registry](./tracks.md) resolves all specifications and plans.
- [Tech debt](./tech-debt.md) records known deficiencies and exit conditions.
- [Lessons learned](./lessons-learned.md) records reusable decisions and failure prevention.
- [Rework history](./history.md) records delivery evidence from the rebuild boundary.

Refresh this summary when priorities or acceptance states change.
Regenerate facts after changing source inventories or track plans.
