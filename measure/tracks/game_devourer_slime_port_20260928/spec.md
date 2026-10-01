# Port Devourer Slime to the monorepo

## Purpose

Port the growing slime game with camera behavior shared by both renderers.

## Acceptance criteria

- The cartridge uses application contracts and one core for both renderers.
- The catalog loads it only with valid sprites, manifests, and story content.
- Actual touch input works in Phaser and three.js where the game supports it.
- Evidence, results, settings, and localization follow the application host.
- The port passes the documented package, catalog, host, and browser checks.

## Evidence

- [game-devourer-slime-3d.md](../../../docs/game-devourer-slime-3d.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
