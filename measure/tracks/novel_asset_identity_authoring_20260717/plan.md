# Implementation Plan: Novel Asset Identity Authoring

Prerequisites: technically accepted static interchange from `engine_interop_evidence_20260719`, plus complete `llm_authoring_workflow_hardening_20260717` and `character_accessory_library_20260717`. Formal interchange closeout remains commit-gated, but delegated FINAL authority permits this source track to proceed only with stale-claim Red evidence and a real public-MCP replay/claim rebind before each Green handoff. Novel authoring remains a bounded composition workflow over registered grammar, not a back door to source editing or general modeling.

## Phase S1: Create New Asset Identities

_Story ref: spec.md#story-s1_

- [x] Task: Define identity initialization and archetype contracts
  - [x] Add schemas for new asset ID, kit/style selection, family, archetype, seed, units, budgets, render profile, completeness state, and public interchange profile/version evidence.
  - [x] Define humanoid and standalone-prop archetype requirements and reserved identity rules.
  - [x] Define origin and revision-lineage metadata without coupling documents to source paths, and require originality/provenance review for `heroic_stylized_v1` without legal guarantees.
- [x] Task: Write failing identity and initialization tests
  - [x] Cover valid unused IDs plus malformed, existing, reserved, traversal-like, and conflicting identities.
  - [x] Cover deterministic minimal revisions, `cute_chibi_v1` defaulting, originality/provenance review, and explicit incomplete-state inspection.
  - [x] Reject unknown families, archetypes, kits, styles, render profiles, and fields.
- [x] Task: Implement bounded identity initialization
  - [x] Create minimal revisions through domain services and the repository interface.
  - [x] Expose origin, completeness, requirements, and lineage through inspection.
  - [x] Keep committed reference creation backward compatible while separating it from novel identity initialization.
- [~] Task: Generate identity documentation and run quality gates
  - [x] Update product and tech-stack scope before implementation changes land.
  - [~] Regenerate tool, capability, architecture, and output facts and run contract, coverage, type, lint, generate, doctor, and full checks. Full tests, coverage, typecheck, lint, build, generate, doctor, claim freshness, and scoped formatting pass. Repository `pnpm check` remains unavailable as a Green closeout signal because its full-format baseline includes historical evidence debt and its generated-diff check requires a committed clean snapshot.
- [b] Task: Measure - User Manual Verification 'Phase S1: Create New Asset Identities' (Protocol in workflow.md) (blocked:commit-closeout)

## Phase S2: Compose From Public Grammar

_Story ref: spec.md#story-s2_

- [x] Task: Define grammar discovery and task-level composition contracts
  - [x] Represent required/optional roles, compatible templates, safe defaults, ports, materials, presets, and suggested operations.
  - [x] Define add-part and connect workflows that do not require complete manual transforms or full part payloads.
  - [x] Define completeness, unattached-part, budget, and unsupported-brief results.
- [x] Task: Write failing composition and planning tests
  - [x] Cover guard and barrel construction from empty identities.
  - [x] Cover invalid roles, incompatible ports, occupied ports, cycles, missing requirements, unsupported templates, and budget failures.
  - [x] Prove task-level workflows compile to existing closed semantic operations and preserve deterministic documents.
- [x] Task: Implement bounded composition services and public tools
  - [x] Resolve template defaults, IDs, bindings, and attachment transforms inside domain services.
  - [x] Keep MCP transport thin and reject source imports, internal-handler fallbacks, absolute paths, and shared mutable filesystem dependencies.
  - [x] Integrate completeness guidance with capability preflight and rich inspection.
- [~] Task: Update the workflow skill and run quality gates
  - [x] Add novel identity planning, completeness loops, bounded composition, and unsupported-brief branches.
  - [~] Regenerate catalogs and run contract, assembly, handler, MCP, coverage, type, lint, doctor, and full checks. Full tests, coverage, typecheck, lint, build, generate, doctor, claim freshness, and scoped formatting pass. Repository `pnpm check` remains unavailable as a Green closeout signal because its full-format baseline includes historical evidence debt and its generated-diff check requires a committed clean snapshot.
- [b] Task: Measure - User Manual Verification 'Phase S2: Compose From Public Grammar' (Protocol in workflow.md) (blocked:commit-closeout)

## Phase S3: Revise Novel Assemblies Safely

_Story ref: spec.md#story-s3_

- [x] Task: Define novel revision, restoration, and completeness semantics
  - [x] Extend comparison to composition, completeness, origin, and required-role changes.
  - [x] Define supported restoration/current-pointer behavior without deleting immutable revisions.
  - [x] Require dry-run planning for broad or destructive composition changes.
- [x] Task: Write failing revision safety tests
  - [x] Cover stale, invalid, no-op, incomplete, disconnected, cyclic, and budget-breaking mutations.
  - [x] Assert no mutation on failure and byte-equivalence for unrelated nodes.
  - [x] Cover compare and restore lineage across multiple novel-asset revisions.
- [x] Task: Implement revision-safe novel iteration
  - [x] Reuse the canonical patch and repository systems rather than creating a second revision engine.
  - [x] Return exact affected/preserved IDs and actionable completeness guidance.
  - [x] Expose restoration and comparison through bounded task-level operations.
- [~] Task: Generate revision documentation and run quality gates
  - [x] Update generated tool, route, architecture, and capability facts.
  - [x] Run revision, handler, MCP, coverage, type, scoped lint, generate, doctor, and build checks.
  - [b] Complete the clean-clone/checkpoint and repo-wide closeout checks once commits are authorized; the implementation remains intentionally uncommitted. (blocked:commit-authorization)
- [b] Task: Measure - User Manual Verification 'Phase S3: Revise Novel Assemblies Safely' (Protocol in workflow.md) (blocked:commit-closeout)

## Phase S4: Prove Novel Asset Workflows

_Story ref: spec.md#story-s4_

- [~] Task: Define guard and barrel acceptance briefs and evidence
  - [x] Freeze the original user-level guard and barrel requests without IDs, schemas, transforms, or source hints.
  - [x] Generate, provenance-bind, and structurally approve a character turnaround/reference target covering front, side, and back views under delegated final authority; retain it as non-shipping design evidence.
  - [x] Define semantic, pixel, GLB, `forge-asset-interchange-manifest/v1`, determinism, originality/provenance, and unsupported-assistance evidence.
  - [x] Define and execute side-by-side Kimi convergence evidence against the approved structural target; both candidate iterations are rejected and transform-only compacting remains insufficient.
  - [x] Require distinct identity proof and prohibit reference renaming or source additions during the run.
- [~] Task: Complete end-to-end browser and MCP acceptance tests
  - [x] Exercise initialization, composition, revision, validation, render, export, bounded public retrieval, restart, and persistence for both families.
  - [x] Cover actual-resolution occupied bounds, ground anchor, clipping, framing, transparency, and deterministic artifact bytes.
  - [x] Reload GLBs and verify semantic nodes, materials, transforms, bounds, units, budgets, and absence of unsupported content.
  - [~] Add objective reference-target checks and pass the visual convergence gate with an actual accepted candidate.
- [~] Task: Execute reference-led guard and barrel workflows
  - [x] Run the bounded guard and barrel construction through the repository skill and public MCP surface without source edits.
  - [x] Repeat render/export and restart the server to prove deterministic semantic and artifact output.
  - [x] Preserve the first compacted guard as a mechanically valid but visually rejected iteration in `s4-rejected-iteration.md`.
  - [~] Iterate the 3D character against the approved structural target through supported public semantic operations and side-by-side Kimi review; the S4 novel candidate remains rejected.
- [~] Task: Assemble final evidence and run all gates
  - [x] Preserve the rejected iteration's public revisions, manifest identities, deterministic hashes, Pixel staging result, and visual disposition.
  - [~] Preserve the structurally approved reference target and side-by-side rejection lineage; accepted actual sprites and final convergence lineage remain missing.
  - [b] Run clean-commit/clean-clone, checkpoint, and complete acceptance gates after commits are authorized. (blocked:commit-authorization)
  - [x] Update product, README, workflow guidance, metadata, and track evidence to state the implemented mechanical boundary and visual rejection honestly.
- [b] Task: Measure - User Manual Verification 'Phase S4: Prove Novel Asset Workflows' (Protocol in workflow.md) (blocked:visual-convergence-and-commit-closeout)
