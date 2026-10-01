# Project status

The asset and game programs remain active. No dated release schedule exists.
Generated status and asset counts appear in `measure/generated/`.

| Workstream | Delivered evidence | Current work | Next acceptance step |
| --- | --- | --- | --- |
| Assets | Forge pipeline, 735 asset sources, 586 of 856 catalog rows with a source; P0 53/54 and P1 450/450 rows at their bars (2026-10-02) | P0/P1 closeout: leather-armor; asset quality gates | Bring leather-armor to 7.5, then correct the 9 class A type errors with a render review each. |
| Games | Six local games with 2D and 3D views | Monorepo port, Rune Match, and Labyrinth | Complete the platform and Potion Rush port. |
| Management | Measure migration committed (6b70d6f); indexed tracks, catalog ownership, history, debt, and lessons | Status upkeep | Run the generator and the doctor after each status change. |

## Quality baseline

The audit found 140 compiler errors: 139 asset errors and one test error.
On 2026-10-02 the compiler found 347 errors. Reworks after the baseline added them; since 9217cfa each
rework agent runs the per-asset type check. The [classification](./tracks/asset_quality_20260928/classification-20261002.md) names 9 files whose correction changes the render.
The baseline suite passed 645 tests and failed two Labyrinth tests.
These failures remain explicit debt. Measure structural checks do not replace application verification.
See the [baseline evidence](./evidence/baseline-20260928.md).

## Next work

1. [Close P0 and P1](./tracks/asset_p0p1_closeout_20261002/): leather-armor is at 7.3, below the P0 bar of 7.5.
2. [Restore asset quality gates](./tracks/asset_quality_20260928/): class A corrections first, then class B by file.
3. [Avatar system](./tracks/avatar_system_20261001/): the reduced output, the pack, the composer, and the review page.
4. [Complete model packs](./tracks/game_model_packs_20260928/).
5. [Complete the platform port](./tracks/game_platform_port_20260928/).
6. Complete Potion Rush integration and the two active game rewrites.
7. Start P2 batches after P0 and P1 close (owner decision of 2026-10-01).

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
