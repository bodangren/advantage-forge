# Restore asset quality gates

Status: in_progress. This plan owns execution status. Source documents retain design details.

## Phase 1: Baseline and contract

- [x] Task: Record the September 28 baseline: 139 asset type errors.
- [x] Task: Classify type-only corrections and changes that affect rendering. (2026-10-02: [classification](./classification-20261002.md): 357 errors; class A, 9 files change the render.)

## Phase 2: Checks

- [ ] Task: Define regression checks for invalid imports and empty mesh output.
- [ ] Task: Record geometry counts before corrections where behavior must remain stable.

## Phase 3: Repair

- [~] Task: Correct source types without suppressing compiler checks. (2026-10-02: type-only corrections in fallen-tree, stalagmite, urn, and clockwork-sentry, 573664b; the closeout reworks passed the per-asset gate; the full count is 347.)
- [x] Task: Review paintFn body options and mixRgb inputs for behavioral defects. (2026-10-02: the 9 class A files are corrected with render reviews; see the classification.)
- [ ] Task: Add a type gate to the import workflow after the baseline passes. (2026-10-02: the per-asset gate `scripts/typecheck-asset.mjs` is in the rework agent rules, 9217cfa; the full gate waits for 0 errors.)

## Phase 4: Verification

- [ ] Task: Run the compiler and the relevant tests.
- [ ] Task: Compare changed renders and record unresolved quality issues.
- [ ] Task: Refresh Measure facts and run the doctor.
