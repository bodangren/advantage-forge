# Complete 2D look and lobby parity

## Purpose

Resolve the documented 2D fallback limits for unlocked looks and the WebGL2-only 3D lobby.

2026-10-06: the 2D pack holds the six heroes and every 3D color preset of each (`<hero>@<preset>.<clip>`, track `apk_pack_release_20261006`). This track makes the 2D views offer them; today the 2D manifests list three heroes (`HEROES_2D`) and the default look.

## Acceptance criteria

- The 2D fallback follows the agreed behavior for unlocked hero looks.
- A device without WebGL2 receives a deliberate selector presentation.
- The fallback has visual review evidence on small and narrow screens.
- The renderer setting remains stable across both presentations.

## Open decisions

Waiting for the owner (2026-10-04). Each item has a proposal.

1. The Primary Advantage app has its own game list, so the Forge lobby (the selector) is a demo
   only, and the hero looks will give way to the student's avatar (`avatar_system_20261001`).
   Proposal: limit this track to the Forge demo. The 2D look of the student in the app comes
   from the avatar portrait layers (`src/apk3d/avatar/portrait.ts`) in the monorepo avatar track,
   not from hero sprite presets.


## Evidence

- [apk-2d3d-program.md](../../../docs/apk-2d3d-program.md)
- [color-variants.md](../../../docs/color-variants.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
