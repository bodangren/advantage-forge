# Rewrite Labyrinth Goblin King as a dual renderer game

Status: in progress. The plan records execution state. Linked documents retain design detail.

## Phase 1: Design and contract

- [x] Task: Record maze, movement, collision, goblin, and learning decisions in the existing design document.

## Phase 2: Tests

- [x] Task: Fix the malformed-maze and collision-recovery failures. Both were stale test data (commit 4f812a3); all 70 Labyrinth tests pass (2026-10-02).
- [x] Task: Add replay, rules, maze, helper, and bot tests.

## Phase 3: Implementation

- [x] Task: Implement the local deterministic rules core and QC bot.
- [x] Task: Implement the 3D and Phaser views. Cartridge (`manifest.ts`, `strings.en.ts`, `briefing.ts`, `index.ts`), 3D view (`view/`), Phaser view (`view2d/`), three baked maze backgrounds, and the host registry entry (2026-10-02). The whole maze stays in view and a late-turn grace helps steering after owner feedback (design section 7).

## Phase 4: Port and verification

- [ ] Task: Port the game through the arena family pattern.
- [ ] Task: Pass all rules tests and run both renderer checks. Done on 2026-10-02: the full suite passes and the bot played a whole shift to the results screen in the 2D view (landscape and portrait) and in the 3D view (portrait), in software GL; 3D landscape was played to the third sentence. Open: a real touch-device check, the portrait layout (the maze is small), and the monorepo port.
