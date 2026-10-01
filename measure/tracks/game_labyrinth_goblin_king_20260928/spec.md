# Rewrite Labyrinth Goblin King as a dual renderer game

## Purpose

Complete the arena prototype. The local core and tests exist; two rules tests fail. Both views and the monorepo port remain.

## Acceptance criteria

- The maze rules and goblin behavior pass deterministic replay and edge-case tests.
- The 3D and Phaser views use the same core and movement rules.
- The player reaches the gate using the documented sentence-order input.
- The cartridge passes input, accessibility, localization, browser, and monorepo checks.
- Fog, door, and water behavior follows the recorded game-layer constraints.

## Evidence

- [game-labyrinth-3d.md](../../../docs/game-labyrinth-3d.md)
- [fit-check.md](../../../docs/dungeon-mockups/fit-check.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
