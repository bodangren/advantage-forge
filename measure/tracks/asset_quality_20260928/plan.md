# Restore asset quality gates

Status: in_progress. This plan owns execution status. Source documents retain design details.

## Phase 1: Baseline and contract

- [x] Task: Record the September 28 baseline: 139 asset type errors.
- [ ] Task: Classify type-only corrections and changes that affect rendering.

## Phase 2: Checks

- [ ] Task: Define regression checks for invalid imports and empty mesh output.
- [ ] Task: Record geometry counts before corrections where behavior must remain stable.

## Phase 3: Repair

- [ ] Task: Correct source types without suppressing compiler checks.
- [ ] Task: Review paintFn body options and mixRgb inputs for behavioral defects.
- [ ] Task: Add a type gate to the import workflow after the baseline passes.

## Phase 4: Verification

- [ ] Task: Run the compiler and the relevant tests.
- [ ] Task: Compare changed renders and record unresolved quality issues.
- [ ] Task: Refresh Measure facts and run the doctor.
