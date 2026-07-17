# Specification: LLM Authoring Workflow Hardening

## Overview

Make the supported static asset workflow independently discoverable, safely editable, visually reviewable, and reproducible by a fresh MCP-capable LLM without source knowledge. This track closes the benchmark gaps around shallow asset inspection, capability ambiguity, non-portable evidence, and the absence of an executable LLM workflow. It does not add new asset families or animation; instead, it makes the current bounded product honest and dependable.

The repository-local `fantasy-asset-workflow` skill is part of the product handoff. It must orchestrate only public tools, perform capability preflight, require inspection before mutation, use dry runs, inspect actual-resolution results, and report unsupported goals rather than compensating with source reads or hand-authored canonical JSON.

## Stories

### Story S1: Expose Complete Current State

**As an** asset-authoring LLM
**I want** a bounded but complete view of the current semantic asset state
**So that** I can calculate localized edits without guessing defaults or overwriting prior revisions.

**Acceptance Criteria:**

- Given a current asset revision, When `inspect_asset` is called, Then each returned part includes its template ID, current shape parameters, transform, material bindings, visibility, handedness, and joint value where applicable.
- Given a current connection, When the asset is inspected, Then the response identifies the parent and child parts, ports, compatibility-relevant state, and joint definition without exposing raw mesh data.
- Given variants, poses, render profiles, and active state, When the asset is inspected, Then the response exposes enough current values to preserve or intentionally change them.
- Given a large asset, When inspection exceeds the response budget, Then explicit pagination or bounded sections report totals, truncation, and continuation controls rather than silently omitting authoring state.
- Given two revisions, When a bounded semantic comparison is requested, Then affected and preserved IDs plus field-level semantic changes are observable through the public read surface.

**Estimate:** L
**Priority:** Must

### Story S2: Publish Honest Capabilities

**As an** LLM planning an asset request
**I want** a machine-readable capability and limitation report
**So that** I can choose a supported workflow or explain why a request is blocked before attempting mutations.

**Acceptance Criteria:**

- Given no prior project context, When the LLM performs capability preflight, Then the public MCP surface reports supported asset families, templates, operations, output types, render profiles, and explicit exclusions.
- Given a request for a new identity, unavailable accessory, temporal animation, atlas, unsupported anatomy, or raw mesh operation, When capability preflight evaluates it, Then the result distinguishes supported, partially supported, and unsupported behavior with actionable next steps.
- Given the generated tool, kit, and output catalogs, When capability facts are regenerated, Then the human documentation and public machine-readable response agree.
- Given a public capability response, When it is validated, Then it contains no unrestricted filesystem path, source-layout dependency, arbitrary code guidance, or claim unsupported by an executable public tool.

**Estimate:** M
**Priority:** Must

### Story S3: Guide Visual Authoring

**As a** fantasy asset creator using an LLM
**I want** a repeatable inspect-plan-dry-run-apply-validate-render-review loop
**So that** asset changes are evaluated for both semantic correctness and delivery-resolution fidelity.

**Acceptance Criteria:**

- Given a supported asset brief, When the repository-local skill runs, Then it records the interpreted goal, capability decision, baseline revision, proposed operations, dry-run result, final revision, and exact affected IDs.
- Given a mutation, When the skill reviews it, Then it inspects the 3D view, contact sheet, actual 128x128 sprites, validation metrics, and before/after evidence before recommending approval.
- Given narrow or ambiguous silhouettes, clipping, lost accessories, unstable framing, or insufficient material separation, When visual review detects the problem, Then the workflow proposes another bounded semantic revision or returns a partial/fail verdict with evidence.
- Given a goal outside current capabilities, When the skill runs, Then it stops before unsupported mutation and reports the missing product capability without source editing, canonical JSON construction, or post-processing images.
- Given a completed workflow, When results are handed off, Then a consistent evidence report lists revision lineage, affected IDs, validation, visual observations, artifact paths, and remaining limitations.

**Estimate:** L
**Priority:** Must

### Story S4: Prove Reproducible LLM Workflow

**As a** project owner
**I want** the documented workflow to pass from a clean clone with a real MCP-capable LLM
**So that** LLM-first approval rests on direct evidence rather than manual JSON-RPC construction.

**Acceptance Criteria:**

- Given a clean clone, When `pnpm check`, browser tests, and `pnpm reference:build` complete, Then generated output uses portable manifest paths, writes the archived evidence location, and leaves tracked files unchanged.
- Given a fresh MCP-capable LLM with no source access, When asked to create and locally broaden the adventurer, Then it discovers current state, dry-runs the edit, preserves unrelated state, changes pose and equipment state, validates, renders, and exports through public tools.
- Given the workflow run, When evidence is captured, Then the chronological natural-language/tool transcript, retries, elapsed time, revision lineage, semantic diff, screenshots, manifests, and artifacts are preserved.
- Given at least one representative target game-engine or importer, When the final GLB is imported, Then scale, orientation, nodes, materials, and errors are recorded; absence of an available importer remains explicitly Not Assessed rather than inferred.

**Estimate:** L
**Priority:** Must

## Non-Functional Requirements

- Public inspection remains bounded, schema validated, and free of anonymous vertex or raw mesh payloads.
- Read operations are side-effect free and cheap enough for normal LLM planning.
- Portable manifests may return absolute paths to the immediate caller, but committed artifact metadata must not embed checkout-specific roots.
- The skill must remain under 500 lines and route detailed rubrics to focused reference files.
- New and changed domain/adapter code maintains more than 80% coverage.
- Capability statements are generated or mechanically checked against the registered public surface.

## Track-Level Acceptance Criteria

- The benchmark's `inspect_asset`, archived path, manifest churn, and real-LLM approval conditions are closed with direct evidence.
- A repository-local `fantasy-asset-workflow` skill exists with capability, visual-review, and evidence references plus objective eval prompts.
- Skill-guided evals outperform or materially improve upon no-skill baselines for safe inspection, dry-run usage, visual evidence, and honest unsupported-capability handling.
- The current static workflow completes in a clean clone without product source reads or canonical reference JSON assistance.
- Product, tech-stack, README, generated catalogs, Measure documents, and public MCP behavior agree on current capabilities and exclusions.

## Out of Scope

- New accessory templates beyond the existing sword and shield.
- New asset identities or arbitrary template assembly.
- Temporal clips, sprite atlases, skeletal deformation, inverse kinematics, or animation export.
- New geometry generators, art directions, render cameras, or 3D export formats.
- Automatically claiming visual quality without browser or image inspection.
