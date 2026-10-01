# Complete asset exports and game delivery

## Purpose

Reconcile source assets, exports, sprites, and game packs. Existing exports alone do not prove current source parity.

## Acceptance criteria

- Each delivery names its source revision and consumer.
- Required clips and presets have reviewed sprite output.
- Each game pack validates against the APK contract.
- Missing exports and scale mismatches have explicit dispositions.

## Sources

- [docs/color-variants.md](../../../docs/color-variants.md)
- [docs/apk-2d3d-program.md](../../../docs/apk-2d3d-program.md)
- [scripts/apk2d-pack.ts](../../../scripts/apk2d-pack.ts)

## Scope control

Existing paths remain stable. Catalog IDs define scope; filename matches indicate source coverage only.
