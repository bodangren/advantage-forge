# Rewrite Enchanted Library as a dual renderer game

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

- [x] Task: Port the cartridge through its family integration pattern. Ported on 2026-10-03 into the monorepo package `game-cartridges-3d` on the local branch `apk3d-games-port` (commit `8f98acb0e`), with its rules, replay, bot, and manifest tests. The Primary Advantage game route plays it with the saved flashcards in FSRS order (`71512a3eb`, 2026-10-04).
- [b] Task: Verify touch input, learning evidence, accessibility, strings, and screenshots. Emulated phone check on 2026-10-04: `qc/run.mjs --phone` and `--phone-landscape` (390 × 844 and 844 × 390, touch events, two device pixels per CSS pixel) in 3D and 2D: after the fixes, 112 of 112 runs passed with no page errors, no diagnostics, and no legacy model requests. The layout defects that the first run found are fixed in Forge `bc930b5` and the monorepo `11a203aad` (labels move apart, stay under the top panels and inside the screen, Thai labels keep whole words; `docs/apk3d-cartridge.md` section 9.1). Learning evidence and strings: the package rules, replay, bot, and i18n scan tests. Open: a real touch-device check (platform port spec, open decision 6). Wait 2026-11-27 (deferred:pm): the real touch-device check needs the owner's device.
- [ ] Task: Record the release pull request and update the family design notes. Waits for the owner: the push and the pull request (platform port spec, open decision 1).

## Owner test fixes (2026-10-14)

- [x] Task: Fix the four defects of the owner's manual test in Primary (reported by the monorepo session). The word tags stand on their own books and are smaller (17 px), so they do not cover the books behind them. The prompt card and the last tags go away before the end banner. Helper mode marks the right book only after a wrong book in the round (`hintBookOf`, rules test). An exit control during play belongs to the host page: the monorepo host draws it. The standalone briefing shows two columns at 900 px and wider, so all 29 briefings fit at 1279 x 560 without a scroll bar. QC: `scripts/apk3d-shot.ts` has a player for this game; 3D and 2D shots in portrait and landscape, no errors or diagnostics.

## Owner fix: ghost spirits (2026-10-19)

- [x] Task: Replace the spirit model. The owner found that the spirits did not look like ghosts: they were the skeleton warrior (helmet, sword, shield), tinted blue and 62% opaque. They are now the `ghost` asset (rating 8.5) at 80% opacity. Each new spirit takes the next look (default, wisp, phantom, shade) in 3D and 2D. Forge `74f60a22`: the ghost joins the `dungeon-monsters` pack (budget 8000 triangles), and `PRESET_MODELS` (the heroes and the ghost) puts its presets into both packs.
- [x] Task: Release the packs from `74f60a22`: dungeon-monsters 1.1.0 (the ghost: 7998 triangles, 234 KB, presets phantom, shade, wisp), mounts 1.0.2 (the griffin GLB is byte-identical; only its source commit changed), primary-chibi-2d 1.2.0 (+24 ghost sheets). The 3D view also draws the ghost 1.2 times larger and brighter (color factor 1.45), because the warm, dim hall made it grey and small. QC: `scripts/apk3d-shot.ts landscape --game enchanted-library` in 3D and 2D, no errors and no diagnostics; 492 APK and game tests pass. The owner approved the griffin pack change with the ghost fix (2026-10-20). Load check of the three griffin games (Griffin Sky Joust, Griffin Riders Escape, Gryphon Patrol) with `apk3d-shot.ts landscape --first`, in 3D and 2D: the griffin loads from `packs/mounts/1.0.2`, no errors and no diagnostics. The monorepo re-check on port 3005 covers the same games as check G2.
- [x] Task: The monorepo session syncs the game and the packs (`scripts/monorepo-sync.ts`) and records its commit here. It decides if the change is a freeze fix. Done 2026-10-19: the monorepo session accepted it under the freeze as a visual fix. Monorepo commit `7d343fb95` ("chore(game-cartridges-3d): sync from Forge d3624720") on `apk3d-games-port`, fast-forwarded into `primary-parity-integration`. All 7 sync checks passed (port-kit, port-game, kit tests, types, and build, 2008 of 2008 game tests, game types). It goes live on port 3005 with the rebuild of 2026-10-19; a monorepo re-check agent captures the ghosts after that.

## Result (2026-10-03)

Built locally on 2026-10-03: rules core, QC bot, 3D view, Phaser view, passing tests, and a headless browser check in 3D and 2D (software GL, no errors, no legacy model requests). Ported into the monorepo package `game-cartridges-3d` on branch `apk3d-games-port` (local, not pushed). Open: a real touch-device check and layout tuning.
