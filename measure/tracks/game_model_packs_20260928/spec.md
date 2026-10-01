# Generate and validate model packs

## Purpose

Create application-ready model pack manifests and budgets for Forge outputs. Respect the owner decision that forbids adding new hash fields to the game contract.

## Acceptance criteria

- The generator emits deterministic pack manifests.
- The manifest schema matches the documented model pack contract.
- Triangle, texture, clip, and transfer budgets fail clearly when exceeded.
- The dungeon set no longer needs a source-tree import.
- Pack files load in both renderer paths.

## Evidence

- [apk3d-cartridge.md](../../../docs/apk3d-cartridge.md)
- [apk-port.md](../../../docs/apk-port.md)
- [fit-check.md](../../../docs/dungeon-mockups/fit-check.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
