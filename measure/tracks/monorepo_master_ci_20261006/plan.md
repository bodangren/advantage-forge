# Monorepo master CI is red

Status: new. The plan records execution state. Linked documents retain design detail.
The monorepo session owns the fix commits. This Forge track records the plan and the evidence.

## Phase 1: Find the cause of each failing step

- [ ] Task: Find the 5 `console.error` calls above the baseline (626 against 621) in run 37427931431, commit d535ae7fd.
- [ ] Task: Compare the hit list with the commit that set the baseline. The CI log lists all 626 hits, not only the new hits.
- [ ] Task: Find the cause of the "Config drift check" failure in run 36051599468, commit fe6aedc2b. Run `pnpm config-drift` on that commit, because the job log is not available.
- [ ] Task: Run the checks of steps 10 to 19 on current master. Record each failure. Compare with TD-15, TD-16, and TD-23.
- [ ] Task: Record each cause in this plan with the step name, the commit, and the first clear error line.

## Phase 2: Fix or record each failure in the monorepo (monorepo session)

- [ ] Task: Move each new `console.error` call to the structured logger, or get owner approval for a higher baseline.
- [ ] Task: Fix the expired fixture date in `student-challenge-catalog-panel.test.tsx` (TD-23).
- [ ] Task: Refresh the architecture reconciliation manifest on master (TD-15).
- [ ] Task: Add a debt row with an owner and an exit condition for each failure that has no fix before the cutover.
- [ ] Task: Link each monorepo commit and pull request in this plan.

## Phase 3: Confirm a green master run

- [ ] Task: Record one master run of "CI" with the conclusion `success`. Record its run ID and its commit.
- [ ] Task: If a known failure remains, record the run, the failing step, and the debt row that owns it.
- [ ] Task: Complete Phase 3 before the cutover starts (planned for 2026-10-14).

## Phase 4: The CD question and close

- [ ] Task: Ask the owner question Q1 in the specification. Record the answer and the date.
- [ ] Task: Close TD-25 in `measure/tech-debt.md`, or link it to the remaining debt rows.
- [ ] Task: Run `./measure/generate.sh` and `./measure/doctor.sh`.
