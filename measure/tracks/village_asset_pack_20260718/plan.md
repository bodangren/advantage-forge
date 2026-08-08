# Implementation Plan: Educational-App Village Pack

Prerequisites: complete `rigid_animation_sprite_pipeline_20260717` and approve downstream educational-app pack assembly in `product.md` and `tech-stack.md`. Pixel Art Generator assembles through Forge public MCP only. Begin with contract evidence; every phase lands tests before implementation. Every task is currently dependency-blocked and uses `[b]`; move only the newly unblocked phase to `[~]` when its prerequisites and downstream acceptance inputs are satisfied.

## Phase S1: Define Educational-App Pack Contracts

_Story ref: spec.md#story-s1_

- [b] Task: Approve scope and define pack/manifest contracts
  - [b] Update product and tech-stack decisions for downstream educational pack assembly before code changes.
  - [b] Add versioned schemas for exact `education-app-pack-profile/v1`, membership entries (identity + pinned Forge revision + role), derived export profiles, and budgets.
  - [b] Define pack revision identity, canonical serialization, compatibility, and migration behavior.
- [b] Task: Write failing pack contract and determinism tests
  - [b] Cover valid packs and all membership/budget rules.
  - [b] Reject unknown identities, unpinned revisions, duplicate roles, unknown fields, and over-budget requests.
  - [b] Assert canonical ordering and repeatable manifest/digest generation.
- [b] Task: Implement pack parsing, storage, and manifest generation
  - [b] Reuse immutable revision storage patterns; keep contracts engine-neutral.
  - [b] Emit per-member Forge source revisions, portable artifact paths, content digests, and `forge-asset-interchange-manifest/v1` references.
- [b] Task: Generate pack documentation and run quality gates
  - [b] Generate architecture, pack-contract, and capability facts.
  - [b] Run contract, document, assembly, coverage, type, lint, generate, doctor, and full checks.
- [b] Task: Measure - User Manual Verification 'Phase S1: Define Educational-App Pack Contracts' (Protocol in workflow.md)

## Phase S2: Assemble Membership Through Public MCP

_Story ref: spec.md#story-s2_

- [b] Task: Define pack discovery and membership tool contracts
  - [b] Add bounded downstream operations for listing public-MCP pack-eligible members, creating/inspecting/patching membership, and dry-run builds.
  - [b] Define revision pinning, drift reporting, affected IDs, and response budgets.
- [b] Task: Write failing handler and MCP tests
  - [b] Cover successful membership authoring and revision pinning.
  - [b] Cover stale member drift, invalid targets, duplicate roles, and unknown fields.
  - [b] Prove failures do not mutate pack revisions and unrelated state is preserved.
- [b] Task: Implement transport-independent pack handlers
  - [b] Orchestrate downstream pack storage/manifest through Pixel domain services; consume Forge only through public MCP and portable manifests.
  - [b] Integrate pack state with capability reporting and honest readiness per member.
- [b] Task: Update workflow skill and run quality gates
  - [b] Add pack planning, dry-run/apply, contact-sheet review, and honest limitation branches.
  - [b] Regenerate tool/capability catalogs and run handler, MCP, coverage, type, lint, doctor, and full checks.
- [b] Task: Measure - User Manual Verification 'Phase S2: Assemble Membership Through Public MCP' (Protocol in workflow.md)

## Phase S3: Package Forge Derived Educational-App Outputs

_Story ref: spec.md#story-s3_

- [b] Task: Write failing build orchestration tests
  - [b] Cover full-member builds, artifact layout under `pack/<id>/<version>/<member>/`, and manifest digests.
  - [b] Cover fail-closed behavior on schema, bounds, ground-contact, budget, and frame-occupancy violations, naming the failing member and rule.
  - [b] Assert byte-identical rebuilds of the same pack revision.
- [b] Task: Implement the pack build orchestrator
  - [b] Retrieve Forge source PNG frames and GLBs plus Forge-derived sprite sheets, clip atlases, contact sheets, and clip metadata through public MCP; consume, validate, and package them without recomputing Forge animation atlases or modifying Forge internals.
  - [b] Emit the root educational-app manifest and portable references to browser-inspectable Forge-produced contact sheets at committed sprite resolution.
- [b] Task: Run quality gates
  - [b] Run build, contract, coverage, type, lint, doctor, and full checks with pack fixtures.
- [b] Task: Measure - User Manual Verification 'Phase S3: Package Forge Derived Educational-App Outputs' (Protocol in workflow.md)

## Phase S4: Deliver the Reference Educational-App Pack

_Story ref: spec.md#story-s4_

- [b] Task: Author the committed reference membership definition
  - [b] Two equipped characters (adventurer + one authored novel identity), crate, tree, cottage module set, each with pinned public-MCP interchange evidence.
- [b] Task: Build and commit the reference pack artifacts and manifest
  - [b] Verify contact sheet coverage and sprite readability at committed resolution in a browser.
- [b] Task: Record owner acceptance evidence
  - [b] Owner reviews 3D previews and actual-resolution sprites; record the decision in the track.
- [b] Task: Measure - User Manual Verification 'Phase S4: Deliver the Reference Educational-App Pack' (Protocol in workflow.md)

## Phase S5: Prove Educational-App Pack Fitness

_Story ref: spec.md#story-s5_

- [b] Task: Write failing clean-clone and documentation-agreement checks
  - [b] Downstream pack build from a clean clone follows public-MCP and portable-contract documentation only; reject source imports, internal handlers, absolute paths, and shared mutable filesystems.
  - [b] Product, tech-stack, README, generated catalogs, and Measure documents agree with the public capability surface.
- [b] Task: Fix all surfaced gaps and rerun the full gate suite
- [b] Task: Measure - User Manual Verification 'Phase S5: Prove Educational-App Pack Fitness' (Protocol in workflow.md)
