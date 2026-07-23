# Specification: Stabilize Full-Suite Test Coverage and Enforce the >80% Coverage Gate

## Overview

The product success criterion requires automated contract and geometry tests to exceed 80% coverage, and reference renders to pass explicit human visual verification. Today the focused per-module coverage is green and high, but the full-suite run is repeatedly reported as environment-red under host load and swap pressure: five affected files pass independently and two remain timeout-only without assertion mismatches. This means the >80% success criterion is not reliably measurable today, and every active track that wants a "current full-suite coverage pass" is blocked on an unstable harness rather than on product work.

This track owns the suite-stabilization and coverage-gate capability. It is independent of the visual acceptance gates that block the animation and novel-identity tracks. It does not weaken or skip tests to make the suite green; it isolates genuine flakiness, adds a per-file fallback that prevents false-red reports under memory pressure, and introduces a coverage gate that fails under 80% across the committed modules.

## Prerequisites and Sequencing

- No dependency on any visual acceptance gate, Kimi review, or pack admission.
- No dependency on the rigid animation, reusable rig, novel identity, or village pack tracks beyond the fact that they benefit from a reliable coverage gate.
- Forge owns the test harness, coverage configuration, and gate script; this track does not touch the Pixel Art Generator or any downstream consumer.
- This track must not modify `measure/automation-supervisor.py`.

## Contract Graph

`committed test inventory`
-> `flakiness diagnosis report`
-> `per-file/per-suite isolation runner with graceful timeout handling`
-> `stable full-suite pass on a clean clone`
-> `constrained-load graceful degradation (no false red)`
-> `coverage gate enforcing >80% per module`
-> `wired into workflow/doctor and refreshed generated facts`.

Each arrow is observable: the diagnosis report is generated from real run artifacts, the isolation runner reproduces known-green results when the monolithic run is interrupted, and the gate fails below threshold.

## Stories

### Story S1: Diagnose and isolate full-suite flakiness

**As a** Forge engineer
**I want** a documented inventory of which tests time out under host load and a per-file isolation runner
**So that** a flaky monolithic run no longer masks genuinely green tests or hides real failures.

**Acceptance Criteria:**

- A flakiness diagnosis report is generated from actual run artifacts and names every test that times out, flakes, or produces a false red under constrained load.
- A per-file/per-suite isolation runner executes each test file independently and reproduces known-green results when the monolithic run is interrupted or terminated.
- The isolation runner preserves the same assertion semantics as the monolithic run; it does not relax timeouts to the point of hiding assertion mismatches.
- Timeout-only failures with no assertion mismatch are distinguished from genuine assertion failures in the report.

### Story S2: Stabilize the full suite under nominal and constrained load

**As a** Forge engineer
**I want** the full Vitest + Playwright suite to pass reliably on a clean clone and degrade gracefully under memory pressure
**So that** the >80% coverage claim is reproducible rather than load-dependent.

**Acceptance Criteria:**

- The full suite passes in a single worker on a clean clone without unrelated timeouts on a nominally loaded host.
- Under constrained host load, the suite degrades gracefully through the per-file fallback and reports per-file results rather than a single false-red monolithic outcome.
- No test is skipped, marked `.skip`, or weakened to achieve the pass; only isolation, timeout handling, and retry policy change.
- The two previously timeout-only files either pass under isolation or are recorded with their exact remaining failure and a structured follow-up.

### Story S3: Add the >80% coverage gate

**As a** Forge engineer
**I want** a coverage gate that fails below 80% across contracts, geometry, assembly, validation, render, and export
**So that** the success criterion is enforced mechanically rather than asserted manually.

**Acceptance Criteria:**

- A `coverage:gate` script fails when any tracked module drops below 80% statements, branches, functions, or lines.
- Per-module thresholds are configurable and default to the committed module set; adding a new module requires declaring its threshold.
- The gate runs alongside lint, typecheck, and the doctor in CI and exits non-zero below threshold.
- The gate reports the exact module and metric that failed, not a single aggregate pass/fail.

### Story S4: Wire the gate into the quality workflow and refresh facts

**As a** product owner
**I want** the coverage gate referenced by the workflow and doctor and reflected in generated facts
**So that** the success criterion is visible and enforced across tracks rather than tribal knowledge.

**Acceptance Criteria:**

- The workflow and doctor reference the coverage gate as a required quality check.
- Generated facts report the current committed coverage numbers and the gate threshold.
- Lessons learned captures the host-load flakiness gotcha and the per-file fallback pattern.
- No human documentation claims a coverage number that the gate cannot reproduce.

## Non-Functional Requirements

- The harness and gate are project-owned; no new hosted service, database, or cloud dependency.
- The gate is deterministic given the same committed tests; it does not depend on wall-clock timing.
- New harness/gate code maintains more than 80% coverage.
- The suite-stabilization must not modify `measure/automation-supervisor.py` or weaken any existing assertion.

## Out of Scope

- Reaching visual acceptance for animation, novel identity, or pack admission.
- Adding new product features or asset templates.
- Rewriting the test framework (Vitest/Playwright remain).
- Modifying `measure/automation-supervisor.py`.
