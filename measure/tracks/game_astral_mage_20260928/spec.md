# Rewrite Astral Mage as a dual renderer game

## Purpose

Design from the arena family and reuse Arena2D and Joystick2D. The rules core, 3D view, and Phaser view will be ported to the monorepo.

## Acceptance criteria

- The game has a deterministic rules core and reproducible replay.
- The game has a 3D view and a Phaser view that use the same core.
- Learning evidence records attempts without speed-based XP.
- Setbacks support recovery and never produce a game over.
- One evidence item maps to each included story item.
- The cartridge passes input, accessibility, localization, browser, and monorepo checks.

## Evidence

- [game-labyrinth-3d.md](../../../docs/game-labyrinth-3d.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
