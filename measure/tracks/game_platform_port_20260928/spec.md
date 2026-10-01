# Port the dual renderer into the monorepo

## Purpose

Move the dual-renderer kit into the monorepo and connect it to application contracts, host flow, localization, content, and quality checks.

## Acceptance criteria

- The kit and game packages use the documented package boundaries.
- Existing APK contracts replace copied local contract definitions.
- Both Phaser and three.js cartridges pass runtime validation.
- The host selects a renderer using device capability and player settings.
- Story evidence reaches the application result flow.
- Every step passes its documented tests and a fresh repository graph check.
- The change is reviewed in an isolated pull request before merge.

## Evidence

- [apk-port.md](../../../docs/apk-port.md)
- [apk-2d3d-program.md](../../../docs/apk-2d3d-program.md)


## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
