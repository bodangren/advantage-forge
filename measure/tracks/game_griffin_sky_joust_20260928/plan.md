# Rewrite Griffin Sky Joust as a dual renderer game

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

- [x] Task: Port the cartridge through its family integration pattern. Ported on 2026-10-03 into the monorepo package `game-cartridges-3d` on the local branch `apk3d-games-port` (commit `b639220cb`), with its rules, replay, bot, and manifest tests. The Primary Advantage game route plays it with the saved flashcards in FSRS order (`71512a3eb`, 2026-10-04).
- [~] Task: Verify touch input, learning evidence, accessibility, strings, and screenshots. Emulated phone check on 2026-10-04: `qc/run.mjs --phone` and `--phone-landscape` (390 × 844 and 844 × 390, touch events, two device pixels per CSS pixel) in 3D and 2D: after the fixes, 112 of 112 runs passed with no page errors, no diagnostics, and no legacy model requests. The layout defects that the first run found are fixed in Forge `bc930b5` and the monorepo `11a203aad` (labels move apart, stay under the top panels and inside the screen, Thai labels keep whole words; `docs/apk3d-cartridge.md` section 9.1). Learning evidence and strings: the package rules, replay, bot, and i18n scan tests. Open: a real touch-device check (platform port spec, open decision 6).
- [ ] Task: Record the release pull request and update the family design notes. Waits for the owner: the push and the pull request (platform port spec, open decision 1).

## Look notes from the monorepo re-check (2026-10-20)

- [ ] Task: The monorepo re-check G2 on port 3005 passed (the griffin loads from `packs/mounts/1.0.2`, no page errors). It reported two look notes, not failures. (1) The player's griffin is very small at the bottom centre of the screen, in 3D and 2D. (2) In 2D, some word labels overlap ("wants"/"Ben", "friend."/"a"). Screenshots: `~/Desktop/primary-parity-progress/captures/run2-20261019/recheck2/G2-griffin-sky-joust-{3d,2d}.png`. Both views existed before the ghost release. A fix is a game change: it waits for the owner's priority and, before the Primary cutover, for the feature freeze rules.

## Result (2026-10-03)

Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning.
