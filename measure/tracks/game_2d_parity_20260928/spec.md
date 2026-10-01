# Complete 2D look and lobby parity

## Purpose

Resolve the documented 2D fallback limits for unlocked looks and the WebGL2-only 3D lobby.

## Acceptance criteria

- The 2D fallback follows the agreed behavior for unlocked hero looks.
- A device without WebGL2 receives a deliberate selector presentation.
- The fallback has visual review evidence on small and narrow screens.
- The renderer setting remains stable across both presentations.

## Evidence

- [apk-2d3d-program.md](../../../docs/apk-2d3d-program.md)
- [color-variants.md](../../../docs/color-variants.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
