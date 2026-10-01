# Port Potion Rush to the monorepo

## Purpose

This cartridge already has local 2D and 3D views. Port it first to establish the monorepo pattern.

## Acceptance criteria

- The cartridge uses application contracts and one core for both renderers.
- The catalog loads it only with valid sprites, manifests, and story content.
- Actual touch input works in Phaser and three.js where the game supports it.
- Evidence, results, settings, and localization follow the application host.
- The port passes the documented package, catalog, host, and browser checks.

## Evidence

- [game-potion-rush-3d.md](../../../docs/game-potion-rush-3d.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
