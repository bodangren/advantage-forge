# Phase S4 Owner Closure Decision

Date: 2026-07-20

## Owner signature

- Name: Daniel Bo
- Role: product owner
- Date: 2026-07-20
- Commit: `dfc6204` (initial closure), reaffirmed in subsequent closeout commits
- Attestation: "As product owner, I attest that this closure decision accurately records the substitute-evidence path that passed and the fresh third-party K3 path that remains Not Assessed, and that no claim in this track registry overstates a capability that failed or was never assessed."

## Decision

As product owner, I approve a bounded deviation for the fresh external-client
authoring criterion. The criterion is closed by the committed deterministic
public-MCP reproduction and independent LLM/browser review, while the attempted
fresh external-provider run remains explicitly **Not Assessed**.

This decision does not reclassify the timed-out K3 run as a pass. That run
produced no session, events, or Forge calls and therefore exercised neither the
product nor its public workflow.

## Substitute Evidence

- Five deterministic public-MCP workflows made 197 Forge calls and covered the
  four required loadouts plus the sword-and-shield regression.
- Every required loadout preserved baseline, equipped-idle, equipped-action,
  and unequipped revision evidence through the public tool surface.
- Exact-revision interactive 3D review, native 128x128 pixel evidence, browser
  tests, artifact hashes, and independent GLB reload audits passed.
- A separate LLM visual reviewer inspected the accepted revisions and reached
  the same supported-scope verdict.
- The rejected sandbox-runner experiment was removed after independent security
  and API review found that its evidence contract was not fail-closed. Any future
  external-client reassessment requires a separate approved track and fresh TDD
  cycle; no unaccepted reassessment harness ships with this closure.

## Residual Limitation

Fresh third-party LLM authoring remains unassessed on this host because the
provider/client failed before session establishment. Product documentation must
not claim that this specific external-provider path passed. A future successful
run may add evidence, but it is not required to reopen this accepted phase.

## Rationale

The failed condition is external infrastructure availability rather than a
Forge behavior failure. Requiring an unavailable provider indefinitely would
make release status depend on a non-product service despite complete public-API,
visual, deterministic, browser, and importer evidence. The substitute evidence
tests the product contract directly and preserves the unassessed limitation.
