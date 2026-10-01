# Rewrite Rune Forge Chamber as a dual renderer game

## Purpose

Design from the build and climb family. Reuse the Potion Rush sorting pattern where it fits. The rules core, 3D view, and Phaser view will be ported to the monorepo.

## Acceptance criteria

- The game has a deterministic rules core and reproducible replay.
- The game has a 3D view and a Phaser view that use the same core.
- Learning evidence records attempts without speed-based XP.
- Setbacks support recovery and never produce a game over.
- One evidence item maps to each included story item.
- The cartridge passes input, accessibility, localization, browser, and monorepo checks.

## Evidence

- [game-potion-rush-3d.md](../../../docs/game-potion-rush-3d.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
