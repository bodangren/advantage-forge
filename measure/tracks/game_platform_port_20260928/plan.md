# Port the dual renderer into the monorepo

Status: in progress. The plan records execution state. Linked documents retain design detail.
The monorepo track `apk3d_games_port_20261003` (branch `apk3d-games-port`, worktree
`../reading-advantage-monorepo-3d`) records the implementation commits.

## Phase 1: Contract and package boundary

- [x] Task: Review the existing monorepo contract changes on apk3d-port. Audit 2026-10-03: the uncommitted edits add a Primary story input mode, not 3D or renderer selection. The monorepo has no three.js code and no model-pack package.
- [x] Task: Finalize package boundaries and resolve current uncommitted owners. The kit is `packages/advantage-play-kit-3d` and the games are `packages/game-cartridges-3d` (`docs/apk-port.md`, status section). 2026-10-04: the old uncommitted edits of 28 September in the main checkout were removed; commit 28904bf14 on the port branch replaces them. A backup patch exists only in that session's scratchpad.

## Phase 2: Tests

- [x] Task: Add contract, runtime, renderer selection, host, and package tests. 2026-10-04: kit 144 tests, games 1946 tests (123 files), type checks and lint pass (warnings only) in both packages.
- [ ] Task: Record graph impact and affected callers for each API change.

## Phase 3: Implementation

- [x] Task: Create the 3D kit and cartridge packages from the local source. All 29 games (8 initial ports, 21 legacy rewrites).
- [ ] Task: Connect application contracts, host flow, content, and localization. Host flow, completion, and en and th messages are done. The content is wrong: Primary Advantage offers three fixed stories. The games must read the student's saved vocabulary and sentences. Track `game_flashcard_input_20261004` owns this change.
- [x] Task: Port Potion Rush as the first dual-view cartridge.
- [x] Task: Keep Forge as the source of the games. 2026-10-04: play-test edits made only in the monorepo copies on 3 October moved to Forge (89a4769), and `port-game.mjs` reproduces the monorepo files (monorepo 50c589e68, fc429a01d, 79ca5ce75).

## Phase 4: Integration and verification

- [x] Task: Copy the kit from Forge with a script (owner decision of 2026-10-04: Forge owns the kit). `fetchModelPack` and `installCss` moved into Forge; `port-kit.mjs --check` reports no difference (kit files and contract fixtures). A planted kit change and two planted contract changes were found.
- [ ] Task: Run package, host, application type, lint, and catalog checks. Package checks pass; the Primary Advantage type check and lint are not run yet.
- [ ] Task: Refresh repo-graph after every public contract change, and run `architecture-enforcement`.
- [ ] Task: Rebase the port branch. Its base `apk3d-port` is `origin/master` plus 18 unrelated `www` commits. Rebase when the content change is done.
- [ ] Task: Open a pull request with the verified port and review evidence. The owner approves the pull request and the deployment.
