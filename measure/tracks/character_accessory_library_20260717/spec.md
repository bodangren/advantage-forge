# Specification: Character Accessory Library

## Overview

Let an LLM discover, equip, validate, and visually approve a useful bounded library of rustic character accessories without source knowledge or bespoke engine logic. This track builds on the completed LLM workflow-hardening track and expands the rustic-human kit from sword and shield into a coherent, data-driven equipment vocabulary.

Accessories remain rigid parametric parts attached through named ports. The first release emphasizes readable character identities at 128x128 rather than exhaustive equipment variety. New geometry generators are permitted only when the existing twelve-shape grammar is demonstrably insufficient and the generator has at least two committed library uses.

## Prerequisite

- `llm_authoring_workflow_hardening_20260717` is complete, including rich current-state inspection, capability preflight, the repository-local workflow skill, and real MCP-capable LLM acceptance.

## Stories

### Story S1: Define Accessory Grammar

**As a** kit maintainer
**I want** typed accessory roles, slots, compatibility tags, and readability contracts
**So that** equipment can be composed safely without character-specific conditionals.

**Acceptance Criteria:**

- Given an accessory definition, When it is parsed, Then it declares stable ID, semantic role, equipment slot, attachment ports, handedness, compatible anatomy/archetypes, shape parameters, material slots, bounds, triangle budget, and required-feature evidence.
- Given head, main-hand, off-hand, body, back, and waist slots, When compatibility is evaluated, Then invalid anatomy, occupied slots, handedness conflicts, and incompatible ports are rejected before mutation.
- Given layered body or back equipment, When bounds and visibility are validated, Then hidden anatomy, excessive intersection, and camera-facing readability constraints are reported without requiring general collision or cloth simulation.
- Given variants or poses, When an equipped character is evaluated, Then accessory stable IDs, attachment ownership, materials, and intended visibility remain reconstructible.

**Estimate:** L
**Priority:** Must

### Story S2: Build Initial Accessory Library

**As a** fantasy character creator
**I want** a curated set of rustic equipment options
**So that** guards, warriors, travelers, and simple caster silhouettes can be distinguished without new engine code.

**Acceptance Criteria:**

- Given the initial library, When its generated catalog is inspected, Then it includes at least: iron helmet and cloth hood; axe, mace, spear, and staff; round shield, kite shield, and torch; leather armor and mail shell; cape, quiver, and backpack; belt pouch and scabbard.
- Given every new accessory, When it builds, Then it uses the shared shape, part, material, port, assembly, validation, render, and export systems.
- Given the rustic palette, When accessories are rendered, Then material bindings use documented iron, bronze, wood, leather, cloth, bone, or crystal families and preserve the established art direction.
- Given a template manifest, When an unsupported generator, material, slot, port, or parameter is referenced, Then validation fails before scene compilation.
- Given the complete library, When reference assets build, Then triangle budgets and output framing remain within the declared character contract.

**Estimate:** XL
**Priority:** Must

### Story S3: Equip Through Public Tools

**As an** asset-authoring LLM
**I want** to search accessories and equip them with task-level operations
**So that** I do not have to reconstruct complete part payloads or attachment transforms manually.

**Acceptance Criteria:**

- Given a character and intent such as “helmeted guard with spear and kite shield,” When the LLM queries the public surface, Then it can filter compatible accessories by role, slot, tags, handedness, and material family.
- Given an accessory candidate, When inspected, Then its current defaults, parameter bounds, ports, compatibility, expected silhouette role, and example equipment operation are returned.
- Given a compatible equip, replace, swap-hand, recolor, or unequip request, When dry-run and apply are used, Then the result reports exact affected IDs, connection changes, validation, and revision lineage.
- Given an incompatible or occupied slot, When the operation is attempted, Then it fails without mutation and explains the conflicting slot, port, anatomy, handedness, or pose constraint.
- Given a changed equipment state, When `inspect_asset` and semantic comparison run, Then the equipped parts and preservation of unrelated character state are directly observable.

**Estimate:** L
**Priority:** Must

### Story S4: Verify Character Readability

**As a** game team reviewing generated characters
**I want** accessory-aware visual evidence at delivery resolution
**So that** equipment choices produce distinct, usable sprites rather than technically valid but unreadable geometry.

**Acceptance Criteria:**

- Given committed guard, traveler, ranger, and caster reference loadouts, When rendered in eight directions, Then required accessories remain present, grounded, unclipped, and materially distinguishable at 128x128.
- Given narrow side and reverse views, When accessory pixel evidence is measured, Then each profile-named identity feature meets its declared minimum or the reference fails validation.
- Given equipped characters in idle and action poses, When browser inspection runs, Then equipment remains attached, does not jump between revisions, and does not become unintentionally hidden.
- Given the repository-local workflow skill, When an LLM creates each reference loadout, Then it discovers accessories, uses dry runs, performs actual-resolution visual review, and reports limitations without source reads.

**Estimate:** L
**Priority:** Must

## Non-Functional Requirements

- Accessory definitions are data and composition inside `fantasy-kit`; they do not create an alternate equipment engine.
- Existing sword and shield IDs remain compatible or migrate through explicit version behavior.
- Library discovery is bounded and filterable; normal LLM use does not require dumping every shape payload.
- Accessories participate in canonical serialization, immutable revisions, deterministic builds, and portable artifacts.
- New code maintains more than 80% coverage and all reference visuals receive explicit actual-resolution approval.

## Track-Level Acceptance Criteria

- At least fifteen named accessory templates across all six slots build through the shared engine.
- Four distinct committed character loadouts are reproducible through public tools and the workflow skill.
- Compatibility, slot conflict, handedness, replacement, material, pose, and visibility failures are covered by contract and integration tests.
- Every reference loadout passes semantic validation, GLB reload, eight-direction rendering, and accessory-specific pixel evidence.
- Generated kit and capability catalogs accurately expose the library and its limitations.

## Out of Scope

- Temporal animation clips, sprite atlases, skeletal deformation, cloth simulation, or inverse kinematics.
- Arbitrary user-uploaded meshes, textures, or accessory scripts.
- Multiple cultural art-direction packs or photorealistic materials.
- Procedural garment draping, hair simulation, or body-shape fitting beyond bounded rigid variants.
- General inventory, combat statistics, or gameplay systems.
