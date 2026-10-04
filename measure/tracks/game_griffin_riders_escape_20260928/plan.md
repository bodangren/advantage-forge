# Rewrite Griffin Riders Escape as a dual renderer game

Status: in progress. The plan records execution state. Linked documents retain design detail.

## Phase 1: Design and contract

- [x] Task: Define rules, controls, story input, outcomes, evidence, and asset needs.
- [x] Task: Record family behavior and any game-specific differences.

## Phase 2: Tests

- [x] Task: Test rules boundaries, deterministic replay, evidence, and helper behavior.

## Phase 3: Implementation

- [x] Task: Implement the core and content.
- [x] Task: Implement the 3D view and then the Phaser view using the shared core.

## Phase 4: Port and verification

- [x] Task: Port the cartridge through its family integration pattern. Ported on 2026-10-03 into the monorepo package `game-cartridges-3d` on the local branch `apk3d-games-port` (commit `9fc60df60`), with its rules, replay, bot, and manifest tests. The Primary Advantage game route plays it with the saved flashcards in FSRS order (`71512a3eb`, 2026-10-04).
- [~] Task: Verify touch input, learning evidence, accessibility, strings, and screenshots. Emulated phone check on 2026-10-04: `qc/run.mjs --phone` and `--phone-landscape` (390 × 844 and 844 × 390, touch events, two device pixels per CSS pixel) in 3D and 2D: after the fixes, 112 of 112 runs passed with no page errors, no diagnostics, and no legacy model requests. The layout defects that the first run found are fixed in Forge `bc930b5` and the monorepo `11a203aad` (labels move apart, stay under the top panels and inside the screen, Thai labels keep whole words; `docs/apk3d-cartridge.md` section 9.1). Learning evidence and strings: the package rules, replay, bot, and i18n scan tests. Open: a real touch-device check (platform port spec, open decision 6).
- [ ] Task: Record the release pull request and update the family design notes. Waits for the owner: the push and the pull request (platform port spec, open decision 1).

## Result (2026-10-03)

Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning.
