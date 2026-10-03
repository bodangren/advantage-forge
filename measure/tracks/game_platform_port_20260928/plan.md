# Port the dual renderer into the monorepo

Status: in progress. The plan records execution state. Linked documents retain design detail.

## Phase 1: Contract and package boundary

- [x] Task: Review the existing monorepo contract changes on apk3d-port. Audit 2026-10-03: the uncommitted edits add a Primary story input mode, not 3D or renderer selection. The monorepo has no three.js code and no model-pack package.
- [ ] Task: Finalize package boundaries and resolve current uncommitted owners.

## Phase 2: Tests

- [ ] Task: Add contract, runtime, renderer selection, host, and package tests.
- [ ] Task: Record graph impact and affected callers for each API change.

## Phase 3: Implementation

- [ ] Task: Create the 3D kit and cartridge packages from the local source.
- [ ] Task: Connect application contracts, host flow, content, and localization.
- [ ] Task: Port Potion Rush as the first dual-view cartridge.

## Phase 4: Integration and verification

- [ ] Task: Run package, host, application type, lint, and catalog checks.
- [ ] Task: Refresh repo-graph after every public contract change.
- [ ] Task: Open a pull request with the verified port and review evidence.
