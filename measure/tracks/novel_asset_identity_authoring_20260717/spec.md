# Specification: Novel Asset Identity Authoring

## Overview

Allow a fresh LLM to create distinct, versioned character and standalone prop identities from the public template grammar without source edits or complete hand-authored documents. This track closes the benchmark's four-reference boundary while preserving the product's constrained semantic model.

Novel means a new canonical asset identity and composition assembled from registered templates, materials, ports, render profiles, and bounded parameters. It does not mean arbitrary topology, unregistered generators, user-supplied code, or silently adding new kit content. The public workflow must make the valid construction grammar discoverable and keep every intermediate revision inspectable and recoverable.

## Prerequisites

- `llm_authoring_workflow_hardening_20260717` is complete.
- `character_accessory_library_20260717` is complete so novel characters can express useful identity through supported equipment rather than cloned references.

## Stories

### Story S1: Create New Asset Identities

**As an** asset-authoring LLM
**I want** to initialize a new bounded asset identity from a declared kit and archetype
**So that** I can create an asset without renaming or overwriting a committed reference.

**Acceptance Criteria:**

- Given a valid unused semantic asset ID, kit ID, style profile, asset family, and base archetype, When initialization runs, Then a minimal valid immutable revision is created with seed, units, budgets, render profile, and no hidden reference identity.
- Given an existing, reserved, traversal-like, malformed, or conflicting ID, When initialization is requested, Then the operation fails without mutation and explains the identity rule.
- Given supported humanoid and standalone-prop archetypes, When capabilities are inspected, Then their required roles, allowed templates, default materials, required ports, and completion rules are discoverable.
- Given an initialized asset, When inspected, Then its origin, archetype, current completeness state, missing requirements, and revision lineage are visible through public tools.

**Estimate:** L
**Priority:** Must

### Story S2: Compose From Public Grammar

**As an** LLM creating a new fantasy asset
**I want** task-level operations for adding and connecting compatible registered parts
**So that** I can build a valid assembly without constructing full transforms or canonical documents manually.

**Acceptance Criteria:**

- Given a brief such as “rustic guard with iron helmet, spear, and kite shield” or “iron-banded barrel,” When the grammar is queried, Then the LLM can find compatible templates, materials, ports, parameter presets, and suggested next operations.
- Given a selected template and target semantic role, When a part is added, Then safe defaults, bounded parameters, material bindings, stable IDs, and compatible attachment transforms are resolved by the domain workflow.
- Given a compatible connection, When it is dry-run or applied, Then port occupancy, cycles, handedness, bounds, completeness, and triangle budget are validated before revision write.
- Given a missing required role or unattached part, When validation runs, Then the result identifies the incomplete semantic path and a bounded correction rather than generating hidden content.
- Given an unsupported brief requiring new anatomy, a new generator, raw mesh, or out-of-kit content, When planning runs, Then capability preflight blocks it honestly.

**Estimate:** XL
**Priority:** Must

### Story S3: Revise Novel Assemblies Safely

**As a** creator iterating on a novel asset
**I want** revision-safe composition and rollback evidence
**So that** I can improve an assembly without losing unrelated work or corrupting identity.

**Acceptance Criteria:**

- Given a novel asset with multiple revisions, When parts, connections, materials, parameters, equipment, pose, or render profile are changed, Then exact affected and preserved semantic IDs are observable.
- Given a broad or destructive request, When the operation is interpreted, Then the workflow presents a proposed semantic plan and dry-run validation before applying it.
- Given stale, invalid, incomplete, no-op, or budget-breaking operations, When submitted, Then no revision is written and the current identity remains recoverable.
- Given any current revision, When a prior revision is compared or restored through the supported workflow, Then lineage and resulting current state remain deterministic and auditable.

**Estimate:** L
**Priority:** Must

### Story S4: Prove Novel Asset Workflows

**As a** project owner
**I want** independent LLM evidence for novel character and prop creation
**So that** broader product claims are based on real public authoring rather than additional committed references.

**Acceptance Criteria:**

- Given a fresh MCP-capable LLM with no source access, When asked for a helmeted rustic guard, Then it creates a new identity, composes supported anatomy and accessories, validates, visually iterates, renders eight directions, and exports a GLB.
- Given the same environment, When asked for a rustic iron-banded barrel, Then it creates a distinct standalone-prop identity from existing grammar without renaming the crate or adding source templates.
- Given both workflows, When evidence is reviewed, Then chronological transcripts, revisions, semantic comparisons, validation, 3D captures, actual-resolution sprites, manifests, and GLBs prove the result.
- Given repeated builds from the same canonical revisions and seed, When render and export repeat, Then semantic structure, framing, direction order, and supported deterministic artifact properties remain stable.

**Estimate:** L
**Priority:** Must

## Non-Functional Requirements

- Initialization and composition are schema validated and restricted to the active project workspace.
- Public authoring never exposes arbitrary filesystem operations, source modification, raw mesh mutation, anonymous vertices, or code execution.
- New assets use registered kit templates and the shared geometry, assembly, material, validation, render, and export paths.
- Intermediate incomplete assets are explicitly marked and may not be exported as complete deliverables until required roles validate.
- Response budgets, pagination, deterministic ordering, and immutable content-addressed revisions apply to novel assets.

## Track-Level Acceptance Criteria

- A new humanoid identity and a new standalone barrel identity are created end to end by a fresh LLM through public tools only.
- Neither result is a renamed/overwritten committed reference or a source-code/template addition performed during authoring.
- All invalid identity, incomplete composition, compatibility, stale revision, cycle, port, budget, and traversal cases fail without corruption.
- The workflow skill plans, dry-runs, visually reviews, and reports both novel asset workflows honestly.
- Product, generated capability/tool catalogs, README, and benchmark protocol are updated to state the bounded novel-identity contract.

## Out of Scope

- Creating new procedural generator implementations during an authoring session.
- Arbitrary vertices, mesh imports, texture painting, free-form sculpting, booleans, or general DCC behavior.
- New creatures, quadrupeds, deforming anatomy, multiple art directions, or unregistered culture packs.
- Temporal animation or sprite atlas production.
- General scenes, terrain, levels, interiors, or gameplay logic.
