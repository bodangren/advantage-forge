# Specification: Produce Direct Unity and Godot GLB Import Evidence for Accepted Forge Exports

## Overview

The capability contract states that the pinned Three.js `GLTFLoader` passes as a representative format importer, and that Unity, Godot, and gameplay-runtime integration remain Not Assessed. The Open tech-debt registry records this as a Medium item: Three.js GLTFLoader passes, but Unity, Godot, and gameplay-runtime scale/material behavior still need direct evidence. This track produces that direct evidence for Unity and Godot against the reload-verified reference GLB set, using a versioned per-engine evidence contract, and refreshes the capability catalog so the facts are no longer Not Assessed.

This is assessment, not backend adoption. Unity and Godot remain explicitly out of scope as Forge backends; they are assessed only as import targets. Because the reference GLBs are already mechanically accepted (reload-verified semantic IDs, materials, transforms, scale, bounds, and absence of out-of-scope animations, textures, shaders, skins, cameras, and lights), this assessment is not blocked by the visual acceptance gates that block animation and novel-identity acceptance.

## Prerequisites and Sequencing

- Builds on the reload-verified reference GLB set established by `engine_interop_evidence_20260719` and the four reference loadouts plus sword-and-shield regression, crate, tree, and cottage from the completed MVP and accessory-library tracks.
- No dependency on the rigid animation, reusable rig, novel identity, or village pack visual gates.
- Forge owns the evidence contract and harness; the assessed engines are read-only import targets.
- If a Unity or Godot importer is unavailable on the pinned host, that engine's result is explicitly Not-Assessed (fail-closed) rather than inferred from the Three.js audit.
- This track must not modify `measure/automation-supervisor.py`.

## Contract Graph

`reload-verified reference GLB`
-> `engine-neutral evidence harness`
-> `glTF-validator report per GLB`
-> `Unity importer report (version, nodes, materials, scale, bounds, out-of-scope features)`
-> `Godot importer report (same dimensions)`
-> `per-engine Pass/Fail/Not-Assessed evidence record`
-> `capability catalog reflects assessed facts`.

Each arrow is honest: a missing importer yields Not-Assessed, never an inferred Pass.

## Stories

### Story S1: Define the engine-import evidence contract and harness

**As a** Forge engineer
**I want** a versioned evidence contract and an engine-neutral harness
**So that** Unity and Godot import results are recorded consistently and fail-closed when an importer is missing.

**Acceptance Criteria:**

- A versioned evidence record captures, per engine and per GLB: importer name and version, glTF-validator report, node count, material count, scale, bounds, and an explicit Pass/Fail/Not-Assessed status.
- The harness is engine-neutral and reads the reload-verified reference GLBs without mutating them.
- A missing importer on the host produces an explicit Not-Assessed result, never an inferred Pass from the Three.js audit.
- The contract rejects malformed, partial, or unsigned evidence records.

### Story S2: Produce Unity import evidence for the reference GLB set

**As a** Forge engineer
**I want** a Unity importer report for every accepted reference GLB
**So that** Unity compatibility is assessed rather than Not Assessed.

**Acceptance Criteria:**

- Each reference GLB (four loadouts, sword-and-shield regression, crate, tree, cottage) has a Unity importer report or an explicit Not-Assessed result if the importer is unavailable.
- Reports confirm semantic node names, materials, transforms, scale, and bounds, or record specific discrepancies.
- Reports confirm the absence of out-of-scope animations, textures, shaders, skins, cameras, and lights, or flag their presence.
- Results are stored in the versioned evidence contract with importer version metadata.

### Story S3: Produce Godot import evidence for the reference GLB set

**As a** Forge engineer
**I want** a Godot importer report for every accepted reference GLB
**So that** Godot compatibility is assessed rather than Not Assessed.

**Acceptance Criteria:**

- Each reference GLB has a Godot importer report or an explicit Not-Assessed result if the importer is unavailable.
- Reports confirm the same dimensions as S2 (nodes, materials, transforms, scale, bounds, out-of-scope features).
- Results are stored in the versioned evidence contract with importer version metadata.

### Story S4: Refresh capability catalog and tech-debt with assessed results

**As a** product owner
**I want** the public capability catalog to reflect assessed Unity and Godot facts
**So that** the Not Assessed status is replaced by honest, evidence-backed facts.

**Acceptance Criteria:**

- `inspect_capabilities` and `measure/generated/capability-catalog.md` reflect assessed Unity and Godot facts (Pass, Fail, or Not-Assessed per engine).
- Human documentation does not claim more than the generated catalog.
- The Open tech-debt item for unassessed game-engine compatibility is updated or resolved with the assessed evidence.
- Lessons learned records the importer-availability fail-closed pattern.

## Non-Functional Requirements

- The evidence harness is project-owned and deterministic given the same GLBs and importer versions.
- Unity and Godot are import targets only; no engine is added as a backend or runtime dependency of Forge.
- New evidence/harness code maintains more than 80% coverage.
- This track must not modify `measure/automation-supervisor.py`.

## Out of Scope

- Adopting Unity, Godot, or any game engine as a Forge backend.
- Gameplay-runtime integration and in-engine rendering quality.
- Visual acceptance of any asset as final art.
- Animation, atlases, temporal delivery, and pack admission.
- Modifying `measure/automation-supervisor.py`.
