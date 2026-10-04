# Port Potion Rush to the monorepo

Status: in progress. The plan records execution state. Linked documents retain design detail.

## Phase 1: Contract and baseline

- [x] Task: Record current local rules, evidence, strings, and 2D and 3D entrypoints. Audit 2026-10-03: rules core, three.js view, Phaser view, and registry entry exist and the tests pass (Potion Rush: 2,550 lines). Strings are English only. The game loads models by path, not from a model pack.

## Phase 2: Tests

- [x] Task: Add application catalog, core replay, renderer input, and evidence tests. On the monorepo branch `apk3d-games-port` (commit `e9d4e8f1b`, 2026-10-03): the rules, replay, and bot tests of the game, the package i18n scan, and the pack tests. The Primary Advantage route tests (`StoryGamesClient.test.tsx` and `completion.test.ts`, `d0deeee49`) cover the game list and the completion mapping; the kit host test `story-game.test.ts` (`59916f492`) covers the mount.

## Phase 3: Port

- [x] Task: Connect the cartridge to application packages, host, and content. The package registry, the kit host `story-game.ts` (`59916f492`), the Primary Advantage game route (`d0deeee49`), and the saved flashcards in FSRS order as content (`71512a3eb`).
- [x] Task: Remove duplicate local adapters that the application packages replace. `port-game.mjs` rewrites the Forge imports to the kit package subpaths; the package holds no host adapter. The Forge demo host stays for local play.

## Phase 4: Verification

- [~] Task: Run package and host tests, type checks, localization checks, and browser input checks. 2026-10-04: games package 1,885 tests and kit 155 tests pass, type checks and lint have no errors, browser QC 28 of 28 at 1280 × 720. Emulated phone check on 2026-10-04: `qc/run.mjs --phone` and `--phone-landscape` (390 × 844 and 844 × 390, touch events, two device pixels per CSS pixel) in 3D and 2D: after the fixes, 112 of 112 runs passed with no page errors, no diagnostics, and no legacy model requests. The layout defects that the first run found are fixed in Forge `bc930b5` and the monorepo `11a203aad` (labels move apart, stay under the top panels and inside the screen, Thai labels keep whole words; `docs/apk3d-cartridge.md` section 9.1). Learning evidence and strings: the package rules, replay, bot, and i18n scan tests. Open: a real touch-device check (platform port spec, open decision 6).
- [ ] Task: Record pull request and integration evidence. Waits for the owner: the push and the pull request (platform port spec, open decision 1).
