# Port Devourer Slime to the monorepo

Status: in progress. The plan records execution state. Linked documents retain design detail.

## Phase 1: Contract and baseline

- [x] Task: Record current local rules, evidence, strings, and 2D and 3D entrypoints. Audit 2026-10-03: rules core, three.js view, Phaser view, and registry entry exist and the tests pass (Devourer Slime: 40 tests). Strings are English only. The game loads models by path, not from a model pack.

## Phase 2: Tests

- [ ] Task: Add application catalog, core replay, renderer input, and evidence tests.

## Phase 3: Port

- [ ] Task: Connect the cartridge to application packages, host, and content.
- [ ] Task: Remove duplicate local adapters that the application packages replace.

## Phase 4: Verification

- [ ] Task: Run package and host tests, type checks, localization checks, and browser input checks.
- [ ] Task: Record pull request and integration evidence.
