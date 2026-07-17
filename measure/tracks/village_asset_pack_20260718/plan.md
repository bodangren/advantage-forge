# Implementation Plan: Village Asset Pack

Prerequisites: complete `rigid_animation_sprite_pipeline_20260717` and approve pack-level assembly in `product.md` and `tech-stack.md`. Begin with contract evidence; every phase lands tests before implementation.

## Phase S1: Define Pack Contracts

_Story ref: spec.md#story-s1_

- [ ] Task: Approve scope and define pack/manifest contracts
  - [ ] Update product and tech-stack decisions for pack assembly and export before code changes.
  - [ ] Add versioned schemas for pack definitions, membership entries (identity + pinned revision + role), export profiles, and budgets.
  - [ ] Define pack revision identity, canonical serialization, compatibility, and migration behavior.
- [ ] Task: Write failing pack contract and determinism tests
  - [ ] Cover valid packs and all membership/budget rules.
  - [ ] Reject unknown identities, unpinned revisions, duplicate roles, unknown fields, and over-budget requests.
  - [ ] Assert canonical ordering and repeatable manifest/digest generation.
- [ ] Task: Implement pack parsing, storage, and manifest generation
  - [ ] Reuse immutable revision storage patterns; keep contracts engine-neutral.
  - [ ] Emit per-member source revisions, artifact paths, and content digests.
- [ ] Task: Generate pack documentation and run quality gates
  - [ ] Generate architecture, pack-contract, and capability facts.
  - [ ] Run contract, document, assembly, coverage, type, lint, generate, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Define Pack Contracts' (Protocol in workflow.md)

## Phase S2: Author Pack Membership Through Tools

_Story ref: spec.md#story-s2_

- [ ] Task: Define pack discovery and membership tool contracts
  - [ ] Add bounded operations for listing pack-eligible members, creating/inspecting/patching membership, and dry-run builds.
  - [ ] Define revision pinning, drift reporting, affected IDs, and response budgets.
- [ ] Task: Write failing handler and MCP tests
  - [ ] Cover successful membership authoring and revision pinning.
  - [ ] Cover stale member drift, invalid targets, duplicate roles, and unknown fields.
  - [ ] Prove failures do not mutate pack revisions and unrelated state is preserved.
- [ ] Task: Implement transport-independent pack handlers
  - [ ] Orchestrate pack storage/manifest through domain services; keep MCP a thin schema-validating adapter.
  - [ ] Integrate pack state with capability reporting and honest readiness per member.
- [ ] Task: Update workflow skill and run quality gates
  - [ ] Add pack planning, dry-run/apply, contact-sheet review, and honest limitation branches.
  - [ ] Regenerate tool/capability catalogs and run handler, MCP, coverage, type, lint, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Author Pack Membership Through Tools' (Protocol in workflow.md)

## Phase S3: Produce Deterministic Pack Outputs

_Story ref: spec.md#story-s3_

- [ ] Task: Write failing build orchestration tests
  - [ ] Cover full-member builds, artifact layout under `pack/<id>/<version>/<member>/`, and manifest digests.
  - [ ] Cover fail-closed behavior on schema, bounds, ground-contact, budget, and frame-occupancy violations, naming the failing member and rule.
  - [ ] Assert byte-identical rebuilds of the same pack revision.
- [ ] Task: Implement the pack build orchestrator
  - [ ] Drive sprite sheets, clip atlases, GLB export, and contact sheets per member through the existing pipelines without modifying their internals.
  - [ ] Emit the root manifest and a browser-inspectable contact sheet at committed sprite resolution.
- [ ] Task: Run quality gates
  - [ ] Run build, contract, coverage, type, lint, doctor, and full checks with pack fixtures.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Produce Deterministic Pack Outputs' (Protocol in workflow.md)

## Phase S4: Deliver the Reference Village Pack

_Story ref: spec.md#story-s4_

- [ ] Task: Author the committed reference membership definition
  - [ ] Two equipped characters (adventurer + one authored novel identity), crate, tree, cottage module set.
- [ ] Task: Build and commit the reference pack artifacts and manifest
  - [ ] Verify contact sheet coverage and sprite readability at committed resolution in a browser.
- [ ] Task: Record owner acceptance evidence
  - [ ] Owner reviews 3D previews and actual-resolution sprites; record the decision in the track.
- [ ] Task: Measure - User Manual Verification 'Phase S4: Deliver the Reference Village Pack' (Protocol in workflow.md)

## Phase S5: Prove Pack Product Fitness

_Story ref: spec.md#story-s5_

- [ ] Task: Write failing clean-clone and documentation-agreement checks
  - [ ] Pack build from a clean clone follows documented contracts only.
  - [ ] Product, tech-stack, README, generated catalogs, and Measure documents agree with the public capability surface.
- [ ] Task: Fix all surfaced gaps and rerun the full gate suite
- [ ] Task: Measure - User Manual Verification 'Phase S5: Prove Pack Product Fitness' (Protocol in workflow.md)
