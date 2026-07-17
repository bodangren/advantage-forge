# Specification: LLM-First Fantasy RPG Asset Foundry MVP

## Overview

Deliver a complete local vertical slice in which an MCP-capable LLM creates, inspects, locally revises, validates, renders, and exports stylized fantasy RPG assets through a small semantic domain API. The canonical artifact is a versioned JSON asset document compiled by a purpose-built TypeScript engine; Blender and general-purpose modeling operations are absent.

The reference slice comprises a rigid-part rustic adventurer with sword and shield, plus a crate, tree, and cottage assembly. It must produce inspectable Three.js scenes, GLB assets, and consistent transparent 128x128 orthographic sprites.

## Stories

### Story S1: Establish Asset Contracts

**As a** project maintainer
**I want** versioned asset contracts, module boundaries, and reproducible project commands
**So that** every later geometry, tool, and output feature is built on one enforceable source of truth.

**Acceptance Criteria:**

- Given a valid MVP asset document, when it is parsed and canonically serialized, then all nodes retain stable semantic IDs, declared units, schema version, seed, and deterministic ordering.
- Given a document or tool payload with an unknown field, invalid unit, duplicate ID, or unsupported node kind, when it is parsed, then it is rejected with a stable error code and semantic path.
- Given the source scaffold, when the architecture doctor runs, then forbidden outward or cross-module imports fail and generated architecture facts are checked for freshness.
- Given a clean checkout with dependencies installed, when the documented `pnpm check` command runs, then formatting, type, lint, unit, architecture, and generated-fact checks execute non-interactively.

**Estimate:** L
**Priority:** Must

### Story S2: Compile Parts and Assemblies

**As an** asset authoring agent
**I want** bounded procedural shapes, semantic parts, connection ports, variants, and rigid poses
**So that** I can construct and locally modify useful assets without raw mesh editing.

**Acceptance Criteria:**

- Given parameters within contract bounds, when any MVP shape generator runs, then it returns finite indexed geometry with valid normals, documented bounds, and deterministic output.
- Given compatible named ports, when two parts are connected, then the child transform resolves predictably; incompatible ports, cycles, and duplicate connections are rejected.
- Given a mirrored limb subassembly, a proportion variant, or a rigid pose, when it is evaluated, then stable IDs persist and unrelated parts remain unchanged.
- Given the same asset document, seed, and engine version, when it is compiled twice, then its canonical scene summary, part transforms, bounds, and triangle counts are equivalent.
- Given an MVP assembly, when it uses intersecting closed parts, then it compiles without requiring a Boolean or general mesh-editing system.

**Estimate:** XL
**Priority:** Must

### Story S3: Author Rustic Fantasy Kit

**As a** fantasy RPG creator
**I want** a coherent initial library of humanoid, equipment, prop, vegetation, and structure templates
**So that** the engine can create recognizable assets in one controlled visual language.

**Acceptance Criteria:**

- Given the rustic-human kit, when an adventurer is assembled, then its head, torso, pelvis, limbs, hands, feet, clothing shells, and equipment use named ports and palette material slots.
- Given the same adventurer assembly, when short, tall, broad, and slender parameter presets are applied, then each valid variant builds without template code changes.
- Given sword, shield, crate, tree, and cottage definitions, when they build, then they use the shared shape, part, port, material, validation, and render contracts rather than domain-specific engines.
- Given a kit template or palette document, when an unknown generator, material family, port type, or parameter is referenced, then validation fails before scene compilation.
- Given the committed kit, when its manifest is inspected, then every template states semantic role, parameter bounds, material slots, ports, and intended reference uses.

**Estimate:** L
**Priority:** Must

### Story S4: Expose LLM Domain Tools

**As an** MCP-capable LLM
**I want** small inspect, create, patch, connect, pose, render, validate, and export tools
**So that** I can author assets through semantic operations and verify each revision.

**Acceptance Criteria:**

- Given no prior project context, when the LLM lists kits and inspects a template, then the response provides its semantic role, allowed parameters, ports, material slots, and concise examples without exposing anonymous mesh data.
- Given valid domain operations, when the LLM creates or revises an asset, then the system writes a new revision and returns affected IDs, a structured diff summary, validation state, and revision identifier.
- Given an invalid or overly broad operation, when it is submitted, then the tool rejects it without mutating the current revision and explains the violated contract.
- Given the local MCP adapter, when its tools are enumerated, then every public tool delegates to transport-agnostic handlers and no arbitrary code, raw filesystem, UI automation, or raw mesh tool is available.
- Given a localized parameter edit, when a new revision is produced, then unaffected semantic nodes remain byte-equivalent in canonical serialization.

**Estimate:** L
**Priority:** Must

### Story S5: Render and Export Assets

**As a** fantasy RPG creator
**I want** consistent 3D inspection, transparent directional sprites, contact sheets, and GLB output
**So that** one semantic asset can serve both 3D and 2D game workflows.

**Acceptance Criteria:**

- Given a valid compiled asset, when it is opened in the inspector, then the same scene compiler used for output displays its parts, materials, bounds, ports, and current revision.
- Given the MVP render profile, when one-, four-, or eight-direction rendering runs, then frames use the documented orthographic camera, direction order, lighting, transparent background, 128x128 size, ground anchor, and padding.
- Given a rendered sprite set, when pixel validation runs, then it reports clipping, occupied bounds, ground-anchor deviation, transparency, and required-feature silhouette width.
- Given the reference adventurer, when two poses and equipped/unequipped variants render, then their contact sheets preserve direction labels, stable framing, and actual-resolution inspection.
- Given a valid asset, when GLB export runs, then the output reloads with expected named nodes, materials, transforms, scale, and no unsupported animation, texture, or shader content.

**Estimate:** XL
**Priority:** Must

### Story S6: Verify Reference Vertical Slice

**As a** project owner
**I want** an auditable end-to-end reference workflow and explicit scope evidence
**So that** the MVP is accepted on real asset results rather than isolated technical demonstrations.

**Acceptance Criteria:**

- Given an MCP-capable LLM and a clean local project, when the reference workflow is followed, then it creates the rustic adventurer, applies a localized proportion edit, equips sword and shield, changes pose, validates, renders, and exports without manual scene editing.
- Given the crate, tree, and cottage references, when they run through the same workflow, then no additional engine or general editing capability is required.
- Given every committed reference document, when the full check and reference build run, then all contracts, tests, coverage, boundaries, builds, pixel metrics, and GLB reload checks pass.
- Given the final contact sheets and 3D previews, when reviewed at actual delivery resolution, then the project owner explicitly confirms recognizable silhouettes, coherent style, stable framing, and acceptable material separation.
- Given a request outside MVP scope, when it is evaluated, then it is rejected or recorded as deferred rather than silently expanding the engine.

**Estimate:** L
**Priority:** Must

## Non-Functional Requirements

### Determinism

- Canonical documents, semantic scene summaries, transforms, bounds, triangle counts, camera definitions, and frame layout must be reproducible for the same document, seed, and engine version.
- Pixel-exact comparison is limited to a pinned reference environment; other environments use mechanical metrics and visual verification.

### Performance

- A reference static asset should compile and validate interactively on a typical development machine.
- Inspection operations must return semantic summaries rather than unbounded geometry payloads.
- The MVP should render an eight-direction 128x128 static contact sheet without requiring a server farm, native DCC process, or cloud service.

### Safety

- All external tool inputs are schema validated.
- The MCP surface exposes no arbitrary code execution, unrestricted filesystem operations, shell commands, or network retrieval.
- Output paths are restricted to the active project workspace.

### Maintainability

- Domain modules remain independent of MCP and browser adapters.
- New templates are data-driven unless an approved generator gap exists.
- Public contracts include version and migration behavior from their first committed revision.

### Accessibility and Usability

- The inspector supports keyboard navigation, visible focus, semantic status text, and sufficient contrast.
- Color is never the sole validation indicator.
- Actual-resolution sprite inspection is a first-class view.

## Track-Level Acceptance Criteria

- All six stories meet their Gherkin acceptance criteria and complete the Measure phase verification protocol.
- The reference adventurer, crate, tree, and cottage build from committed canonical documents.
- The reference adventurer supports at least four proportion presets, two rigid poses, equipped and unequipped variants, eight directions, transparent sprites, and GLB output without engine code changes.
- The final tool catalog contains only semantic domain operations and has no Blender, raw mesh, arbitrary code, or general-purpose DCC capability.
- New-code coverage exceeds 80%, architecture facts are current, and all documented checks pass.
- The project owner explicitly approves the browser-visible 3D and actual-resolution sprite results.

## Out of Scope

- Free-form modeling, sculpting, topology editing, mesh booleans, UV painting, texture painting, photorealism, shader graphs, physics, simulation, particles, and weather.
- Skeletal skinning, deforming animation, inverse kinematics, authored animation clips, and complete sprite animation atlases.
- Creatures beyond the rigid humanoid reference morphology.
- Additional culture motifs, multiple art directions, perspective camera systems, arbitrary resolutions, and multiple lighting rigs.
- Complete world or level generation, terrain, interiors, cloud collaboration, user accounts, databases, hosted inference, or embedded LLM provider integration.
- FBX, OBJ, USD, engine-specific packages, or arbitrary import/export support.
- A general graphical modeling editor or mobile authoring experience.
