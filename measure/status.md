# Project status

The asset and game programs remain active. No dated release schedule exists.
Generated status and asset counts appear in `measure/generated/`.

| Workstream | Delivered evidence | Current work | Next acceptance step |
| --- | --- | --- | --- |
| Assets | Forge pipeline, 735 asset sources, 586 of 856 catalog rows with a source; P0 54/54 and P1 450/450 rows complete with current outputs, and the five P0 maps accepted (2026-10-02) | New 3D asset production is deferred (owner, 2026-10-06) until the pack release system works | The first pack release: 2D files for all 90 pack models. |
| Games | 28 student games with 2D and 3D views, ported to the monorepo branch `apk3d-games-port` | Pack release system: per-pack versions, a 1:1 2D pack, release and sync commands | The owner pushes the port branch to monorepo `master` (2026-10-06 decision). |
| Management | Measure migration committed (6b70d6f); indexed tracks, catalog ownership, history, debt, and lessons | Status upkeep | Run the generator and the doctor after each status change. |

## Quality baseline

The audit found 140 compiler errors: 139 asset errors and one test error.
On 2026-10-02 the compiler found 347 errors. Reworks after the baseline added them; since 9217cfa each
rework agent runs the per-asset type check. The [classification](./tracks/asset_quality_20260928/classification-20261002.md) names 9 files whose correction changes the render; they are corrected (451ce00).
After the P0, P1, and map corrections of 2026-10-02, 32 errors remain: 30 in P2 and P3 sources and 2 in tests.
The baseline suite passed 645 tests and failed two Labyrinth tests.
These failures remain explicit debt. Measure structural checks do not replace application verification.
See the [baseline evidence](./evidence/baseline-20260928.md).

## Owner decisions of 2026-10-06

- Merge the port branch into monorepo `master`. The session's permission classifier blocked the push, so the owner runs it (track `apk_pack_release_20261006`, Phase 0).
- Sync the assets with the monorepo, and make the 2D packs match the 3D packs one to one.
- Defer the student avatar in the games.
- Defer new 3D assets until the release system is set up; then automate the release of new pack and game versions to the monorepo.

## Next work

1. [Pack release](./tracks/apk_pack_release_20261006/): per-pack versions, the 1:1 2D pack, `scripts/apk-release.ts`, and `scripts/monorepo-sync.ts`. The avatar in the games and new 3D assets wait for it (owner, 2026-10-06).
2. [Restore asset quality gates](./tracks/asset_quality_20260928/): class A is done (451ce00); class B is done for P0, P1, and map sources; 32 type errors remain (30 in P2 and P3 sources).
3. [Platform port](./tracks/game_platform_port_20260928/): the owner pushes `apk3d-games-port` to monorepo `master`; then the graph refresh (TD-15) and a real touch-device check.
4. [2D parity](./tracks/game_2d_parity_20260928/): the 2D views offer the six heroes and their presets that the 2D pack now holds.
5. P2 production, deferred (owner, 2026-10-06): see the P2 status in the [asset roadmap](./asset-roadmap.md). The wildlife and NPC tracks resume after the release system works.
6. Avatar in the games, deferred (owner, 2026-10-06): section 11 of `docs/avatar-system.md`.

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
