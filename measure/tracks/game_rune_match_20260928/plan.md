# Rewrite Rune Match as a dual renderer game

Status: in progress. The plan records execution state. Linked documents retain design detail.

## Phase 1: Design and contract

- [x] Task: Record core events and board rules in the existing design document.

## Phase 2: Tests

- [x] Task: Add local replay, rules, and QC bot tests.
- [x] Task: Fix or explain every failure in the current baseline. All 6 test files pass (2026-10-02).

## Phase 3: Implementation

- [x] Task: Implement the deterministic local rules core and QC bot.
- [x] Task: Implement the 3D and Phaser views. Shared event driver `view/driver.ts`, HTML board view, Phaser board view, cartridge, and host registry entry (2026-10-02). Unit tests pass and the demo build bundles the game. No browser run yet.

## Phase 4: Port and verification

- [ ] Task: Port the game through the battle family pattern.
- [ ] Task: Run both renderer checks and record review evidence.
