# Measure Anti-Patterns

> Project registry used by Measure orchestration roles. Extend this catalog when a
> new class of orchestration, test, evidence, or closeout failure is discovered.

## A1 - Substring Used as Structured Supervisor State

- Detection: inspect supervisor logic for prose substring checks such as `"deferred" in task.lower()`.
- Symptoms: incomplete work disappears from status because ordinary prose contains a control word.
- Fix: recognize only `[b]` and a trailing `(deferred:<owner>)` field.
- Guard: orchestrator audit plus supervisor contract tests.

## A2 - Consent-Blind Publication Gate

- Detection: inspect every publication gate for an anonymization or consent-artifact requirement.
- Symptoms: identifiable evidence can be published without verified permission.
- Fix: require explicit anonymization or a dated, signed consent artifact.
- Guard: publication and closeout contract tests.

## A3 - Unlabeled Numeric Evidence

- Detection: reject assertions that use a bare digit match as proof of a named count or baseline.
- Symptoms: dates and unrelated numbers satisfy evidence checks.
- Fix: parse an explicitly labeled integer and validate its meaning and range.
- Guard: test-strategy and Red-test review.

## A4 - Vacuous Pass When Nothing Is Complete

- Detection: run marker checks against an all-in-progress or all-blocked fixture.
- Symptoms: a phase with zero completed tasks is reported as passing.
- Fix: require at least one `[x]` task and reject unresolved non-deferred work.
- Guard: marker consistency tests and phase acceptance.

## A5 - Plan Claims Exceed Executed Test Reality

- Detection: rerun every command cited by claims such as "all checks pass."
- Symptoms: plan text reports success while the referenced command fails or was not run.
- Fix: bind claims to command output and immutable revision evidence.
- Guard: phase acceptance and final acceptance audits.

## A6 - Registry Overstates Resolved Capability

- Detection: compare resolved or completed registry language with adversarial and acceptance results.
- Symptoms: project status advertises a capability that remains failed, blocked, or unassessed.
- Fix: report the observed state and retain limitations until the required evidence passes.
- Guard: final acceptance and closeout checks.

## A7 - Over-Broad Refutation Filter

- Detection: inspect evidence filters for bare English exclusions such as `never` or `do not`.
- Symptoms: real policy or banned-term findings are silently discarded.
- Fix: exclude only explicit path contexts and structured disclaimer markers.
- Guard: adversarial test fixtures.

## A8 - Ambiguous Legacy `[ ]` Marker

- Detection: search active plans for `[ ]` task markers.
- Symptoms: pending work is interpreted inconsistently by status and orchestration tools.
- Fix: use `[~]` for active work, `[x]` for complete work, or `[b]` with `(deferred:<owner>)`.
- Guard: orchestrator status and closeout checks.

## A9 - Tests Retain Active Paths After Archival

- Detection: compare hard-coded `measure/tracks/<id>` test paths with archived track locations.
- Symptoms: tests fail permanently after a valid closeout move.
- Fix: resolve the archive path first and the active path second through a shared helper.
- Guard: orchestrator audit static checks.

## A10 - Generated Facts Drift After Structural Changes

- Detection: run `bash measure/generate.sh` and verify a clean generated-facts diff.
- Symptoms: doctor fails because architecture or route facts lag implementation.
- Fix: regenerate and commit facts with the structural change.
- Guard: doctor, project checks, and final acceptance.

## Project Extensions

Add project-specific entries from A11 onward with detection, symptoms, fix, and guard evidence.
