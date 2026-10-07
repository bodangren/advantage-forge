# Project status

The asset and game programs remain active. No dated release schedule exists.
Generated status and asset counts appear in `measure/generated/`.

| Workstream | Delivered evidence | Current work | Next acceptance step |
| --- | --- | --- | --- |
| Assets | Forge pipeline, 735 asset sources, 586 of 856 catalog rows with a source; P0 54/54 and P1 450/450 rows complete with current outputs, and the five P0 maps accepted (2026-10-02) | New 3D asset production was deferred (owner, 2026-10-06) until the pack release system works; the system works (releases a81ccca, c26e4406, 88686328) | The owner sets the next asset work; the avatar in the games comes first. |
| Games | 28 student games with 2D and 3D views, ported to the monorepo; the port and the RPG skin are in `primary-parity-integration` (0dac27db2) | The avatar in the games (owner, 2026-10-06) | The port reaches monorepo `master` in the Primary cutover; master CI must be green first ([track](./tracks/monorepo_master_ci_20261006/)). |
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
- Defer the student avatar in the games. Lifted later the same day: the avatar in the games is the next Forge work.
- Defer new 3D assets until the release system is set up; then automate the release of new pack and game versions to the monorepo.
- Later the same day: the port reaches `master` through `primary-parity-integration`, not by a direct push.
- The Forge session works only in this repository. The monorepo session makes every change, commit, and push in the monorepo.

## Monorepo feature freeze (2026-10-07)

The owner set a feature freeze in the monorepo from 2026-10-07 until the Primary deployment.
The merge into monorepo `master` is on 2026-10-11. The monorepo session reported the rules:

- Allowed: bug fixes, tests, browser checks, and the cutover steps of the migration spec.
- Not allowed: new features, new game modes, new levels, and new assets for new features.
- The monorepo session syncs only fixes. Split a Forge release that mixes a fix with a feature, or send the fix commits only.
- The replacement of the ElvGames reward icons is a fix, because of the owner's asset rule. The monorepo does it alone:
  Primary gives the reward panels the Forge skin icons in `public/rpg/items/` in place of the ElvGames PNGs. Forge sends no files.
  Since monorepo 15f96ff52 the panels use `/rpg/items/apprentice-wand.webp`, `graveyard-staff.webp`, and `echo-staff.webp`.
  Keep these names in every skin sync; `scripts/rpg-skin.ts` stops if one is missing. Tell the monorepo session before a rename.
- The phone check of "Listen to English" (F2) still occurs. The monorepo session tells Forge before it starts.

Forge work on features continues in this repository, but its release to the monorepo waits until after the deployment.

## Next work

1. [Avatar in the games](./tracks/avatar_in_games_20261006/) (owner, 2026-10-06): section 11 of `docs/avatar-system.md`. The [pack release](./tracks/apk_pack_release_20261006/) it waited for is complete.
2. [Restore asset quality gates](./tracks/asset_quality_20260928/): class A is done (451ce00); class B is done for P0, P1, and map sources; 32 type errors remain (30 in P2 and P3 sources).
3. [Platform port](./tracks/game_platform_port_20260928/): the port reaches monorepo `master` with `primary-parity-integration` in the Primary cutover; then the graph refresh (TD-15), the 2D setting re-export (TD-26), and a real touch-device check. [Master CI](./tracks/monorepo_master_ci_20261006/) must be green first.
4. [2D parity](./tracks/game_2d_parity_20260928/): the 2D views offer the six heroes and their presets that the 2D pack now holds.
5. P2 production, deferred (owner, 2026-10-06) until the release system works, which it now does: see the P2 status in the [asset roadmap](./asset-roadmap.md). The owner sets the order after the avatar in the games.

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
