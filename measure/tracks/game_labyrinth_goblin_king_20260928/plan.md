# Rewrite Labyrinth Goblin King as a dual renderer game

Status: in progress. The plan records execution state. Linked documents retain design detail.

## Phase 1: Design and contract

- [x] Task: Record maze, movement, collision, goblin, and learning decisions in the existing design document.

## Phase 2: Tests

- [~] Task: Fix the malformed-maze and collision-recovery failures.
- [x] Task: Add replay, rules, maze, helper, and bot tests.

## Phase 3: Implementation

- [x] Task: Implement the local deterministic rules core and QC bot.
- [ ] Task: Implement the 3D and Phaser views.

## Phase 4: Port and verification

- [ ] Task: Port the game through the arena family pattern.
- [ ] Task: Pass all rules tests and run both renderer checks.
