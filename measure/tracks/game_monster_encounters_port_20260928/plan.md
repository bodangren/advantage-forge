# Port Monster Encounters to the monorepo

Status: in progress. The plan records execution state. Linked documents retain design detail.

## Phase 1: Contract and baseline

- [x] Task: Record current local rules, evidence, strings, and 2D and 3D entrypoints. Audit 2026-10-03: rules core, three.js view, Phaser view, and registry entry exist and the tests pass (Monster Encounters: 1,560 lines, no QC bot). Strings are English only. The game loads models by path, not from a model pack.

## Phase 2: Tests

- [ ] Task: Add application catalog, core replay, renderer input, and evidence tests.

## Phase 3: Port

- [ ] Task: Connect the cartridge to application packages, host, and content.
- [ ] Task: Remove duplicate local adapters that the application packages replace.

## Phase 4: Verification

- [ ] Task: Run package and host tests, type checks, localization checks, and browser input checks.
- [ ] Task: Record pull request and integration evidence.

## Deferred direction (owner, 2026-10-04)

Monster Encounters leaves the student games in Primary Advantage. It needs questions and
fill-in items, and the saved flashcards have neither. Later, it becomes a teacher-led game in the
reading lesson, with student avatars and names. The Forge source stays unchanged until then. The
open tasks above wait for that design.
