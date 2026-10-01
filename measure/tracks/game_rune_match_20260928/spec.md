# Rewrite Rune Match as a dual renderer game

## Purpose

Complete the battle and board prototype. The local core exists; the 3D and Phaser views and monorepo port remain.

## Acceptance criteria

- The core resolves target words, cascades, shields, healing, and evidence deterministically.
- The 3D and Phaser views use the same core and feedback rules.
- The view exposes the documented guaranteed target move.
- The cartridge passes replay, input, accessibility, localization, browser, and monorepo checks.

## Evidence

- [game-rune-match-3d.md](../../../docs/game-rune-match-3d.md)

## Path policy

Existing design, code, script, source, and output paths remain stable. This track adds Measure records.
