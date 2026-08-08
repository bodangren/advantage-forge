# Specification: Reusable Rig, Pose, and Clip Libraries

## Overview

The rigid-animation predecessor proves a bounded exact-five delivery path, but its v1 rig exposes one scalar axis per joint, its generic path is one clip per request, and its general clip-library, evaluation, delivery, throughput, and visual-admission behavior is not sufficient for a reusable animation program. This successor introduces a multi-DOF rigid rig profile, immutable reusable pose libraries, arbitrary bounded clip-library batches, precise temporal semantics, and one provenance-complete delivery contract.

This is a successor because `rigid_animation_sprite_pipeline_20260717` explicitly excludes more than its five required reference clips. It does not reinterpret the predecessor as complete. Existing v1 contracts, exact-five behavior, and the 16-tool public MCP surface remain compatible until explicit migration and public-wiring phases are complete.

## Prerequisites and Sequencing

- Contract-only S1 may proceed without changing the public surface.
- Public authoring, rendering, and admission depend on the applicable predecessor mechanical gates and an accepted S14 Kimi WebBridge visual review.
- Forge owns rig, pose, clip evaluation, rendering, temporal artifact identity, and source delivery.
- Pixel Art Generator owns consumer validation and theme-pack packaging; it must not recompute Forge atlases or infer missing semantics.
- `reading-advantage-monorepo` remains the read-only downstream acceptance target unless separately authorized.

## Contract Graph

`asset revision + morphology revision + equipment signature + assembly signature`
→ `forge-rigid-rig-profile/v2`
→ `forge-pose-library/v1`
→ arbitrary bounded clip-library revisions
→ inclusive frame plans and deterministic evaluation
→ unified temporal delivery
→ Pixel validation and theme-pack packaging
→ downstream browser-visible acceptance.

Each arrow is identity-bound. Stale, incomplete, over-budget, or provenance-incompatible input fails before rendering and does not silently retarget.

## Stories

### Story S1: Define Reusable Rig and Pose Contracts

**As an** animation author
**I want** deterministic multi-axis rigs and immutable reusable pose libraries
**So that** motion can be composed without copying ad hoc transforms between clips.

**Acceptance Criteria:**

- `forge-rigid-rig-profile/v2` declares an exact asset, morphology, equipment, and assembly binding; one rooted assembly hierarchy; normalized local pivot frames; deterministic Euler rotation order; one to three bounded DOFs per joint; and reciprocal mirror relationships.
- Validation rejects duplicate IDs, duplicate axes, order gaps, non-normalized pivots, unknown/cyclic assembly parents, mismatched roots, joint ancestry that contradicts the assembly, mirror drift, and declared-budget overflow.
- Rig identity is derived from canonical content. Semantically unordered input arrays and quaternion double-cover (`q` versus `-q`) produce one identity, while authored DOF evaluation-order changes remain identity-significant.
- `forge-pose-library/v1` binds to the exact rig and source identities and records immutable reference, equipment, root, contact, and mirror semantics.
- Pose validation rejects unknown or out-of-range DOFs, unknown contact/equipment parts, incomplete generated-reference approval, one-way mirrors, invalid root policy payloads, duplicate addresses, and budget overflow.

### Story S2: Persist and Author Reusable Libraries

**As an** MCP-capable author
**I want** immutable rig and pose revisions with semantic inspection and comparison
**So that** clips can reuse approved poses without hidden shared mutable state.

**Acceptance Criteria:**

- Rig and pose-library revisions persist with canonical identity, lineage, optimistic concurrency, pagination, and restart-safe retrieval.
- Public operations support bounded create, inspect, validate, compare, revise, and select-current workflows without exposing raw file writes.
- Handler validation derives and compares the real canonical asset assembly rather than trusting a caller-authored hierarchy or digest.
- Failures are structured, path-specific, non-mutating, and distinguish schema, binding, compatibility, provenance, budget, and stale-revision errors.
- v1 and exact-five inputs remain accepted through a documented compatibility boundary until migration evidence permits deprecation.

### Story S3: Evaluate Arbitrary Clip Libraries

**As a** game-content author
**I want** arbitrary bounded batches of clips composed from reusable poses
**So that** a character is not limited to one generic clip or one hard-coded five-clip set.

**Acceptance Criteria:**

- A clip-library request contains a bounded non-empty set of uniquely identified clips and supports partial retry without identity drift in successful siblings.
- Step interpolation has an explicit boundary rule; exact keyframe timestamps select the new keyframe rather than the preceding interval.
- Once clips include their authored terminal sample. Loop clips declare a valid half-open loop interval, validate the seam deliberately, and do not conflate the terminal sample with the next loop iteration.
- Root semantics distinguish locked, in-place rotation, authored translation, and authored translation plus yaw; evaluation and validation enforce the selected policy.
- Contacts, equipment, asset, morphology, rig, pose-library, timing, pivot, camera, seed, and frame-plan provenance remain invariant or intentionally versioned across a batch.

### Story S4: Unify and Accelerate Temporal Delivery

**As a** public-MCP consumer
**I want** one complete temporal delivery and one warm rendering session
**So that** I can validate and package arbitrary clip libraries without contract joins or per-clip browser startup.

**Acceptance Criteria:**

- One versioned temporal-delivery record binds the source document, all rig/pose/clip/frame-plan identities, seed, render profile, timing, root/contact/pivot data, individual source frames, GLB, per-clip derived sheets, combined atlas, and retrieval manifest.
- Generic and compatibility paths emit the same required provenance and error taxonomy; no path silently omits bundle, seed, timing, pivots, ground anchors, or frame plans.
- One request renders its arbitrary bounded clip library in one warm browser lifecycle and reports startup, per-frame, composition, and total timings.
- Two fresh roots produce identical semantic identities, manifests, retrieval bytes, portable paths, and supported pinned-environment artifact hashes.
- Budget, timeout, browser, artifact, and retrieval failures identify the affected clip and resumable boundary without presenting a partial delivery as complete.

### Story S5: Prove Visual and Downstream Fitness

**As a** product owner
**I want** exhaustive visual review and real consumer acceptance
**So that** mechanically valid reusable animation is not mistaken for shippable theme-pack art.

**Acceptance Criteria:**

- Kimi WebBridge reviews every rendered frame, each contact sheet, actual-size and enlarged playback, loop seams, terminal states, root/contact behavior, equipment attachment, identity, and reference fidelity.
- No sampled-only or representative-only visual pass can admit a clip library; every delivered frame is accounted for in an audit record.
- Pixel Art Generator consumes the public delivery, validates it, and packages both target theme packs without recomputing Forge-owned atlases or relying on shared absolute paths.
- Theme-pack artifacts satisfy current read-only `reading-advantage-monorepo` identities, locations, manifest fields, dimensions, transparency, timing, and browser-visible playback requirements.
- Measure closeout records fresh-root MCP replay, consumer validation, browser evidence, Kimi decisions, hashes, performance, remaining limitations, and explicit user verification.

## Non-Functional Requirements

- Contracts remain strict, bounded, finite, engine-neutral, and free of filesystem, browser, MCP, or arbitrary-code dependencies.
- Canonical identities normalize only semantically unordered collections and equivalent representations; authored evaluation order and provenance remain identity-significant.
- New contract/domain code maintains more than 80% coverage.
- Public responses preserve the existing 16-tool count until a separately reviewed surface change is necessary; prefer extending bounded request unions over adding tools.
- Browser-visible quality, warm-session throughput, public-MCP replay, Pixel consumption, downstream artifact validation, and Measure closeout are mandatory completion gates.

## Out of Scope

- Skeletal skinning, mesh deformation, inverse kinematics, physics, motion capture, arbitrary scripting, unrestricted animation imports, or a general nonlinear editor.
- Editing `reading-advantage-monorepo` without explicit authorization.
- Claiming predecessor visual approval, downstream pack admission, or successor completion from contract/unit tests alone.
