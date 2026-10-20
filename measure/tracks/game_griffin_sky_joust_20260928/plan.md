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

- [x] Task: The monorepo re-check G2 on port 3005 passed (the griffin loads from `packs/mounts/1.0.2`, no page errors). It reported two look notes, not failures. (1) The player's griffin is very small at the bottom centre of the screen, in 3D and 2D. (2) In 2D, some word labels overlap ("wants"/"Ben", "friend."/"a"). Screenshots: `~/Desktop/primary-parity-progress/captures/run2-20261019/recheck2/G2-griffin-sky-joust-{3d,2d}.png`.
- [x] Task: Fix both notes (owner request, 2026-10-20). Cause: both views drew the griffin and the bats at about half their hit circles (2D bat 28 by 44 px for a 56 px circle; 3D griffin 0.95 m for a 1.2 m circle), and the 2D sprites stood on the sheets' ground-point origin, about 26 px above their circles; the 7.5 m trees made the griffin look smaller. The small bats hid under their words, and the 2D tag spread kept stacked tags 3 px apart but did not count the 4 px drop shadow, so stacked tags touched. Fix (views and kit only; every rule stays): 3D griffin scale 0.5 -> 1.0, bats 0.8 -> 1.2, hero 0.34 -> 0.68, trees 0.7 of their model; 2D griffin and bats about 1.6 times larger and centred on their circles, words just above their bats; kit `src/apk3d/view2d/hud2d.ts`: the spread box includes the drop shadow (all 2D games). A rules change was tried and dropped: a larger griffin circle (30 or 36 px) or spaced rider heights made the QC bot up to twice as slow over 40 seeds and left 1 to 3 games unfinished (old rules: 69 s on average, all finish). QC: `scripts/apk3d-shot.ts landscape --game griffin-sky-joust [--2d]` has a player now (the game's bot; shots near two strikes; tag check every 250 ms). Word tags touching or overlapping: 2D 69 of 150 samples before, 6 of 174 after; 3D 1 of 124 before, 2 of 166 after. No errors or diagnostics. Dragon Flight 2D (a tapped word tag) still passes with the kit change. 2365 APK, game, and host tests pass.
- [x] Task: Check the kit tag change in other 2D games (side note, 2026-10-20). The spread moves the top-level `tag()` tags of 24 2D games. A scratch Playwright run played each game with its own bot (`auto` on the 2D test hook) for up to 120 s, with one fixed session seed, once with the old `hud2d.ts` (served by a Vite plugin) and once with the new one, and counted the samples where two tags touch (gap under 2 px, shadow included). Portrait 390 by 844: Gryphon Patrol 0 of 94 before, 0 of 90 after; Dragon Flight 0 of 226 and 0 of 227; Potion Rush 22 of 188 and 6 of 191. Landscape 1280 by 720: Gryphon Patrol 0 of 90 and 0 of 92. All games ended, with no page errors. The screenshots show the same layout before and after. Storm Castle Tower puts its tags in its world container, so the spread does not move them and the game does not change. Rune Match does not use the kit `tag()`.
- [x] Task: Sync the fix after the Primary cutover (owner decision, 2026-10-20). Monorepo `0c220e663` "sync from Forge afc8b890" on `apk3d-games-port`, fast-forwarded into `primary-parity-integration`; the sync gate passed (7 of 7). Ledger row in `measure/monorepo-syncs.md`.
- [x] Task: Record the monorepo browser checks after the next app rebuild: Sky-Joust in 3D and 2D, Potion Rush 2D (the kit tag spread), and one 3D game. Passed (monorepo session, 2026-10-20, port 3005 on integration `888d99935` with sync `0c220e663`): Sky-Joust 3D (headed, real GPU) shows the griffin with its rider and the bats, each word just above its bat; Sky-Joust 2D runs and its tags do not touch; Potion Rush 2D stacked tags sit apart; Gryphon Patrol 3D and 2D start. 0 HTTP 404, 0 page errors, no device or load-error screen. Screens: `~/Desktop/primary-parity-progress/captures/run2-20261019/post-cutover/G-*.png`; the 3D screen shows the shorter trees and the larger griffin of `431faf51`.

## Result (2026-10-03)

Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning.
