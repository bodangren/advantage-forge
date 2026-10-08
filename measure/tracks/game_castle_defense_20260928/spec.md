# Rewrite Castle Defense as a dual renderer game

## Purpose

Design a tower defense game. Define placement input and defensive outcomes before implementation. The rules core, 3D view, and Phaser view will be ported to the monorepo.

Owner decision (2026-10-08): Castle Defense is a tower defense game, in family 6 of `docs/apk-2d3d-program.md`, not in the aim and shoot family. The game built on 2026-10-03 already follows this rule: each built sentence becomes a tower on a wall post (`docs/game-castle-defense-3d.md`).

## Acceptance criteria

- The game has a deterministic rules core and reproducible replay.
- The game has a 3D view and a Phaser view that use the same core.
- Learning evidence records attempts without speed-based XP.
- Setbacks support recovery and never produce a game over.
- One evidence item maps to each included story item.
- The cartridge passes input, accessibility, localization, browser, and monorepo checks.

## Evidence

- [apk-2d3d-program.md](../../../docs/apk-2d3d-program.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
