# Harden production coordination

Status: new. This plan owns execution status. Source documents retain design details.

## Phase 1: Contract

- [ ] Task: Document trial directories, ownership rules, concurrency limits, and retry states.

## Phase 2: Checks

- [ ] Task: Define checks for path escape, duplicate source names, and invalid output.

## Phase 3: Implementation

- [ ] Task: Apply bounded scheduler and import safeguards where current scripts lack them.

## Phase 4: Verification

- [ ] Task: Exercise a failed trial and a successful import without unrelated changes.
- [ ] Task: Record results and run the Measure generator and doctor.
