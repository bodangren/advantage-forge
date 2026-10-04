# Port the dual renderer into the monorepo

Status: in progress. The plan records execution state. Linked documents retain design detail.
The monorepo track `apk3d_games_port_20261003` (branch `apk3d-games-port`, worktree
`../reading-advantage-monorepo-3d`) records the implementation commits.

## Phase 1: Contract and package boundary

- [x] Task: Review the existing monorepo contract changes on apk3d-port. Audit 2026-10-03: the uncommitted edits add a Primary story input mode, not 3D or renderer selection. The monorepo has no three.js code and no model-pack package.
- [x] Task: Finalize package boundaries and resolve current uncommitted owners. The kit is `packages/advantage-play-kit-3d` and the games are `packages/game-cartridges-3d` (`docs/apk-port.md`, status section). 2026-10-04: the old uncommitted edits of 28 September in the main checkout were removed; commit 28904bf14 on the port branch replaces them. A backup patch exists only in that session's scratchpad.

## Phase 2: Tests

- [x] Task: Add contract, runtime, renderer selection, host, and package tests. 2026-10-04: kit 144 tests, games 1946 tests (123 files), type checks and lint pass (warnings only) in both packages.
- [x] Task: Record graph impact and affected callers for each API change. 2026-10-04, by a source search (the committed `graph.db` holds main-checkout paths, see Phase 4). `game-contracts`: the practice input (`practiceInputSchema`, `parsePracticeInput`, `toPracticeInput`) is new; callers are the 3D kit, the 3D games, `domain` (`listGamePracticeInput`), and the Primary game page. `storyGameEvidenceSchema` (`storyId` renamed `inputId`) is new on the branch, so no stored row has the old field; callers are the 3D kit, the 3D games, and the Primary completion code. `learningEvidenceSchema` accepts story-game evidence; its callers, the 2D kit and `domain` (`contributions.ts` now checks `effectiveModality` first), type check clean. `domain`: `listGamePracticeInput` and `gamePracticeInputRequestSchema` are new; one caller, the Primary route `/api/v1/apk/practice`.

## Phase 3: Implementation

- [x] Task: Create the 3D kit and cartridge packages from the local source. All 29 games (8 initial ports, 21 legacy rewrites).
- [x] Task: Connect application contracts, host flow, content, and localization. Host flow, completion, and the messages of five locales are done. The content is the student's saved vocabulary and sentences in FSRS due order (track `game_flashcard_input_20261004`, completed 2026-10-04).
- [x] Task: Port Potion Rush as the first dual-view cartridge.
- [x] Task: Keep Forge as the source of the games. 2026-10-04: play-test edits made only in the monorepo copies on 3 October moved to Forge (89a4769), and `port-game.mjs` reproduces the monorepo files (monorepo 50c589e68, fc429a01d, 79ca5ce75).

## Phase 4: Integration and verification

- [x] Task: Copy the kit from Forge with a script (owner decision of 2026-10-04: Forge owns the kit). `fetchModelPack` and `installCss` moved into Forge; `port-kit.mjs --check` reports no difference (kit files and contract fixtures). A planted kit change and two planted contract changes were found.
- [x] Task: Run package, host, application type, lint, and catalog checks. 2026-10-04: package tests and type checks pass; ESLint passes on the changed Primary files; the browser and app QC pass (flashcard track, Phase 5). The Primary type check has 14 older errors in two unchanged files (TD-16).
- [ ] Task: Refresh repo-graph after every public contract change, and run `architecture-enforcement`. 2026-10-04: `architecture-enforcement` fails on `origin/master` with the same stale manifest hash (TD-15); the branch does not change the manifest. The committed `graph.db` (last refresh 2026-09-14) stores absolute paths of the main checkout, so an update from the worktree adds a second path root; an update of the 704 branch files also ran past 25 minutes and rolled back. Refresh the graph on the main checkout after the merge (waiting for the owner, with the pull request).
- [x] Task: Rebase the port branch. 2026-10-04: rebased on `origin/master` fe6aedc2b without the 18 `www` commits (45 commits). The lockfile was regenerated with pnpm 11.8.0 and `--lockfile-only` gives no change. 25 old subjects were rewritten to pass commitlint; the trees did not change. Backup branch `apk3d-games-port-prerebase-20261004`. Drift checks, kit tests (145), and Primary tests (18) pass after the rebase. Later kit syncs on the branch: the free hair slot in avatar prices (5b996c101) and the avatar composer and portraits from Forge f4de18b (846774aae; 13 kit test files, 150 tests; type check and lint clean). The branch has 47 commits.
- [ ] Task: Open a pull request with the verified port and review evidence. The owner approves the pull request and the deployment. 2026-10-04: the text is ready in [pull-request.md](./pull-request.md). Waiting for the owner (spec, "Open decisions").
