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

- [x] Task: Port the game through the arena family pattern. Ported into `game-cartridges-3d` on the local branch `apk3d-games-port` (commit `e9d4e8f1b`, 2026-10-03).
- [~] Task: Pass all rules tests and run both renderer checks. Done on 2026-10-02: the full suite passes and the bot played a whole shift to the results screen in the 2D view (landscape and portrait) and in the 3D view (portrait), in software GL; 3D landscape was played to the third sentence. The monorepo port is done (`e9d4e8f1b`). Emulated phone check on 2026-10-04: `qc/run.mjs --phone` and `--phone-landscape` (390 × 844 and 844 × 390, touch events, two device pixels per CSS pixel) in 3D and 2D: after the fixes, 112 of 112 runs passed with no page errors, no diagnostics, and no legacy model requests. The layout defects that the first run found are fixed in Forge `bc930b5` and the monorepo `11a203aad` (labels move apart, stay under the top panels and inside the screen, Thai labels keep whole words; `docs/apk3d-cartridge.md` section 9.1). Learning evidence and strings: the package rules, replay, bot, and i18n scan tests. Open: a real touch-device check (platform port spec, open decision 6).
