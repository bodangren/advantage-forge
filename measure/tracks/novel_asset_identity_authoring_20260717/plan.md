# Implementation Plan: Novel Asset Identity Authoring

Prerequisites: complete `llm_authoring_workflow_hardening_20260717` and `character_accessory_library_20260717`. Novel authoring must remain a bounded composition workflow over registered grammar, not a back door to source editing or general modeling.

## Phase S1: Create New Asset Identities

_Story ref: spec.md#story-s1_

- [ ] Task: Define identity initialization and archetype contracts
  - [ ] Add schemas for new asset ID, kit/style selection, family, archetype, seed, units, budgets, render profile, and completeness state.
  - [ ] Define humanoid and standalone-prop archetype requirements and reserved identity rules.
  - [ ] Define origin and revision-lineage metadata without coupling documents to source paths.
- [ ] Task: Write failing identity and initialization tests
  - [ ] Cover valid unused IDs plus malformed, existing, reserved, traversal-like, and conflicting identities.
  - [ ] Cover deterministic minimal revisions and explicit incomplete-state inspection.
  - [ ] Reject unknown families, archetypes, kits, styles, render profiles, and fields.
- [ ] Task: Implement bounded identity initialization
  - [ ] Create minimal revisions through domain services and the repository interface.
  - [ ] Expose origin, completeness, requirements, and lineage through inspection.
  - [ ] Keep committed reference creation backward compatible while separating it from novel identity initialization.
- [ ] Task: Generate identity documentation and run quality gates
  - [ ] Update product and tech-stack scope before implementation changes land.
  - [ ] Regenerate tool, capability, architecture, and output facts and run contract, coverage, type, lint, generate, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Create New Asset Identities' (Protocol in workflow.md)

## Phase S2: Compose From Public Grammar

_Story ref: spec.md#story-s2_

- [ ] Task: Define grammar discovery and task-level composition contracts
  - [ ] Represent required/optional roles, compatible templates, safe defaults, ports, materials, presets, and suggested operations.
  - [ ] Define add-part and connect workflows that do not require complete manual transforms or full part payloads.
  - [ ] Define completeness, unattached-part, budget, and unsupported-brief results.
- [ ] Task: Write failing composition and planning tests
  - [ ] Cover guard and barrel construction from empty identities.
  - [ ] Cover invalid roles, incompatible ports, occupied ports, cycles, missing requirements, unsupported templates, and budget failures.
  - [ ] Prove task-level workflows compile to existing closed semantic operations and preserve deterministic documents.
- [ ] Task: Implement bounded composition services and public tools
  - [ ] Resolve template defaults, IDs, bindings, and attachment transforms inside domain services.
  - [ ] Keep MCP transport thin and reject hidden source/internal-handler fallbacks.
  - [ ] Integrate completeness guidance with capability preflight and rich inspection.
- [ ] Task: Update the workflow skill and run quality gates
  - [ ] Add novel identity planning, completeness loops, bounded composition, and unsupported-brief branches.
  - [ ] Regenerate catalogs and run contract, assembly, handler, MCP, coverage, type, lint, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Compose From Public Grammar' (Protocol in workflow.md)

## Phase S3: Revise Novel Assemblies Safely

_Story ref: spec.md#story-s3_

- [ ] Task: Define novel revision, restoration, and completeness semantics
  - [ ] Extend comparison to composition, completeness, origin, and required-role changes.
  - [ ] Define supported restoration/current-pointer behavior without deleting immutable revisions.
  - [ ] Require dry-run planning for broad or destructive composition changes.
- [ ] Task: Write failing revision safety tests
  - [ ] Cover stale, invalid, no-op, incomplete, disconnected, cyclic, and budget-breaking mutations.
  - [ ] Assert no mutation on failure and byte-equivalence for unrelated nodes.
  - [ ] Cover compare and restore lineage across multiple novel-asset revisions.
- [ ] Task: Implement revision-safe novel iteration
  - [ ] Reuse the canonical patch and repository systems rather than creating a second revision engine.
  - [ ] Return exact affected/preserved IDs and actionable completeness guidance.
  - [ ] Expose restoration and comparison through bounded task-level operations.
- [ ] Task: Generate revision documentation and run quality gates
  - [ ] Update generated tool, route, architecture, and capability facts.
  - [ ] Run revision, handler, MCP, coverage, type, lint, generate, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Revise Novel Assemblies Safely' (Protocol in workflow.md)

## Phase S4: Prove Novel Asset Workflows

_Story ref: spec.md#story-s4_

- [ ] Task: Define guard and barrel acceptance briefs and evidence
  - [ ] Freeze user-level requests without IDs, schemas, transforms, or source hints.
  - [ ] Define semantic, visual, pixel, GLB, determinism, and unsupported-assistance evidence.
  - [ ] Require distinct identity proof and prohibit reference renaming or source additions during the run.
- [ ] Task: Write failing end-to-end browser and MCP acceptance tests
  - [ ] Exercise initialization, composition, revision, validation, render, and export for both families.
  - [ ] Cover actual-resolution required features, ground anchor, clipping, framing, transparency, and material separation.
  - [ ] Reload GLBs and verify semantic nodes, materials, transforms, bounds, units, and absence of unsupported content.
- [ ] Task: Execute fresh-LLM guard and barrel workflows
  - [ ] Run through the repository skill and public MCP surface without source reads.
  - [ ] Iterate visually only through supported semantic operations.
  - [ ] Repeat render/export and restart the server to prove determinism and persistence.
- [ ] Task: Assemble final evidence and run all gates
  - [ ] Preserve transcripts, revisions, diffs, screenshots, actual sprites, manifests, GLBs, hashes, timing, retries, and clean-state proof.
  - [ ] Run install, check, coverage, build, browser, references, generate, doctor, and artifact verification from a clean clone.
  - [ ] Update product, README, benchmark protocol, metadata, lessons, and tech debt to match observed capability.
- [ ] Task: Measure - User Manual Verification 'Phase S4: Prove Novel Asset Workflows' (Protocol in workflow.md)
