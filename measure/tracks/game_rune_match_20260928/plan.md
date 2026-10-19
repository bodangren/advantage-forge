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

- [x] Task: Port the game through the battle family pattern. Ported into `game-cartridges-3d` on the local branch `apk3d-games-port` (commit `e9d4e8f1b`, 2026-10-03). Phone check 2026-10-04: the tiles fit their words (the board measures each word), the portrait card takes up to 76 % of the screen, and the manifest says `portrait`, so a phone on its side shows the turn cover. Emulated phone check on 2026-10-04: `qc/run.mjs --phone` and `--phone-landscape` (390 × 844 and 844 × 390, touch events, two device pixels per CSS pixel) in 3D and 2D: after the fixes, 112 of 112 runs passed with no page errors, no diagnostics, and no legacy model requests. The layout defects that the first run found are fixed in Forge `bc930b5` and the monorepo `11a203aad` (labels move apart, stay under the top panels and inside the screen, Thai labels keep whole words; `docs/apk3d-cartridge.md` section 9.1). Learning evidence and strings: the package rules, replay, bot, and i18n scan tests. Open: a real touch-device check (platform port spec, open decision 6).
- [x] Task: Run both renderer checks and record review evidence. (2026-10-02: headless Chromium, 3D and Phaser 2D, read screen, briefing, battle and board render, no console errors; Thai tile wrap fixed in 9ca8829. A full play-through and the monorepo port are open.)
- [x] Task: Fix the cut rune labels from the owner's test (2026-10-19, monorepo integration `b2957ac52`, 1279 × 846, Thai locale): "community" and "เสื้อแจ็คเก็ต" lost both ends. Cause: the board read the tile font before the tile was in the page, so every word measured about ten times too short and no word shrank. Fix in `src/apk3d/hud/board.ts` and `hud.css` (`docs/apk3d-cartridge.md` section 9.1). Check: headless Chromium with 24 long English and Thai words on boards of 460, 370, and 300 px, every label inside its tile; the Rune Match QC in portrait and landscape with no errors or diagnostics; 590 kit and game tests pass.
- [ ] Task: Check the game on a real touch device. Waits for the owner (platform port spec, open decision 6).
- [ ] Task: Record the release pull request. Waits for the owner (platform port spec, open decision 1).
