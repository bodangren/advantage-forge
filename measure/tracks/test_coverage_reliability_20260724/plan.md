# Implementation Plan: Stabilize Full-Suite Test Coverage and Enforce the >80% Coverage Gate

This track is `[ ]` (new). The full-suite coverage run is repeatedly environment-red under host load and swap pressure while per-module coverage is green; this track owns the suite stabilization, per-file fallback, and coverage gate rather than any active track's incidental coverage pass. It does not depend on any visual acceptance gate and does not modify `measure/automation-supervisor.py`.

## Phase S1: Diagnose and isolate full-suite flakiness

_Story ref: spec.md#story-s1-diagnose-and-isolate-full-suite-flakiness_

- [ ] Task: Write failing tests for the per-file isolation runner
  - [ ] Assert the isolation runner executes each test file independently.
  - [ ] Assert the runner reproduces known-green results when the monolithic run is interrupted or terminated.
  - [ ] Assert timeout-only failures are distinguished from genuine assertion failures.
- [ ] Task: Implement the per-file/per-suite isolation runner with graceful timeout handling
  - [ ] Execute each test file in isolation and aggregate per-file results.
  - [ ] Preserve assertion semantics; do not relax timeouts to hide mismatches.
- [ ] Task: Write failing tests for the flakiness diagnosis report
  - [ ] Assert the report names every timeout, flake, and false-red test from real run artifacts.
  - [ ] Assert the report is generated deterministically from captured artifacts.
- [ ] Task: Implement flakiness diagnosis report generation
  - [ ] Consume captured run artifacts and emit a structured per-test diagnosis.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Diagnose and isolate full-suite flakiness' (Protocol in workflow.md)

## Phase S2: Stabilize the full suite under nominal and constrained load

_Story ref: spec.md#story-s2-stabilize-the-full-suite-under-nominal-and-constrained-load_

- [ ] Task: Write failing tests for a stable full-suite single-worker pass
  - [ ] Assert the full suite passes in one worker on a clean clone without unrelated timeouts.
- [ ] Task: Stabilize timeouts, isolation, and retry policy so the suite passes reliably
  - [ ] Tune per-file timeouts and retry policy without skipping or weakening assertions.
- [ ] Task: Write failing tests for constrained-load graceful degradation
  - [ ] Assert constrained load produces per-file results via fallback, not a single false red.
  - [ ] Assert no test is skipped or marked `.skip` to achieve the pass.
- [ ] Task: Implement the constrained-load fallback path
  - [ ] Route through the isolation runner under memory pressure and report per-file outcomes.
- [ ] Task: Record the two previously timeout-only files as passing or with exact remaining failures
  - [ ] Capture structured follow-up for any file that still cannot pass under isolation.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Stabilize the full suite under nominal and constrained load' (Protocol in workflow.md)

## Phase S3: Add the >80% coverage gate

_Story ref: spec.md#story-s3-add-the-80-coverage-gate_

- [ ] Task: Write failing tests for the coverage gate
  - [ ] Assert the gate fails when any tracked module drops below 80% statements/branches/functions/lines.
  - [ ] Assert the gate reports the exact module and metric that failed.
- [ ] Task: Implement the `coverage:gate` script with per-module thresholds
  - [ ] Default to the committed module set; require a declared threshold for any new module.
- [ ] Task: Write failing tests for per-module threshold enforcement
  - [ ] Assert adding a new module without a declared threshold fails the gate.
- [ ] Task: Implement per-module threshold configuration
  - [ ] Read thresholds from a versioned config and exit non-zero below threshold.
- [ ] Task: Wire the gate to run alongside lint, typecheck, and doctor in CI
  - [ ] Add the gate to the CI quality sequence.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Add the >80% coverage gate' (Protocol in workflow.md)

## Phase S4: Wire the gate into the quality workflow and refresh facts

_Story ref: spec.md#story-s4-wire-the-gate-into-the-quality-workflow-and-refresh-facts_

- [ ] Task: Write failing tests asserting workflow and doctor reference the coverage gate
  - [ ] Assert the workflow lists the coverage gate as a required quality check.
- [ ] Task: Wire the gate into the workflow and doctor and refresh generated facts
  - [ ] Report current committed coverage numbers and the gate threshold in generated facts.
  - [ ] Add the host-load flakiness gotcha and per-file fallback pattern to lessons learned.
- [ ] Task: Verify no human documentation claims a coverage number the gate cannot reproduce
  - [ ] Audit human docs against generated facts.
- [ ] Task: Measure - User Manual Verification 'Phase S4: Wire the gate into the quality workflow and refresh facts' (Protocol in workflow.md)
