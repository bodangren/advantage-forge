# Rewrite Sorcerer Ziggurat as a dual renderer game

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

- [ ] Task: Port the cartridge through its family integration pattern.
- [ ] Task: Verify touch input, learning evidence, accessibility, strings, and screenshots.
- [ ] Task: Record the release pull request and update the family design notes.

## Result (2026-10-03)

Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning.
