# Specification: Forge–Pixel Public MCP Interchange Evidence

## Overview

This planned track establishes Forge as the specialized semantic 3D/raster producer and Pixel Art Generator as the named downstream educational-app pack assembler. It replaces the superseded game-engine-first direction with direct, reproducible evidence that Pixel consumes Forge only through public MCP and portable delivery artifacts. Current external game-engine compatibility remains Not Assessed; this track does not claim a new implemented capability.

The shared base contract is exactly `forge-asset-interchange-manifest/v1`: closed-schema, canonically serialized, SHA-256 digest-pinned, and portable. It records artifact digests, source revisions, profile ID/version, dimensions/media type, roles, and evidence references. Individual transparent 128x128 PNG frames and GLBs remain independently required Forge source-delivery artifacts; Forge produces deterministic derived contact sheets, atlases, and clip metadata. Atlas-only delivery cannot satisfy the source contract. Pixel consumes, validates, and packages these public-MCP outputs without recomputing Forge animation atlases. The downstream completeness contract is exactly `education-app-pack-profile/v1` and is defined for downstream consumption, not asserted as delivered here.

## Prerequisites

- `llm_authoring_workflow_hardening_20260717` is complete (evidence dossier and owner-verification conventions are reused).
- `measure/product.md` and `measure/tech-stack.md` declare `forge-asset-interchange-manifest/v1` and the Forge–Pixel public-MCP boundary before implementation begins.

## Stories

### Story S1: Define Forge–Pixel Interchange Manifest

**As a** Forge maintainer
**I want** a closed, portable interchange manifest and public-MCP boundary
**So that** Pixel can consume source delivery without source coupling or overstated capability claims.

**Acceptance Criteria:**

- Given a manifest, When parsed, Then unknown fields are rejected and the exact contract ID, canonical serialization, SHA-256 pin, portable evidence references, artifact digests, source revisions, profile ID/version, dimensions/media type, and roles are required.
- Given a Forge delivery, When represented, Then individual transparent 128x128 PNG frames and GLBs are identified as independently required source artifacts while Forge-produced contact sheets, atlases, and clip metadata are identified as derived.
- Given a profile declaration, When reviewed, Then `cute_chibi_v1` is default and `heroic_stylized_v1` has originality/provenance review requirements rather than legal guarantees.

### Story S2: Prove Public MCP Interchange Evidence

**As a** Pixel Art Generator integrator
**I want** deterministic public-MCP interchange evidence
**So that** downstream assembly is isolated from Forge internals and delivery evidence is reproducible.

**Acceptance Criteria:**

- Given a public MCP request, When Pixel obtains a manifest and the currently available static PNG/GLB delivery artifacts, Then it consumes, validates, and packages them without requiring Forge source imports, internal handlers, absolute paths, or shared mutable filesystem access.
- Given the manifest schema reserves derived animation records, When this foundational track runs, Then it validates their classification contract with fixtures but does not require live animation atlases or clip metadata before the animation track produces them.
- Given a manifest and delivery artifacts, When evidence runs, Then digests, revisions, profiles, roles, dimensions, media types, and evidence references verify against canonical portable records.
- Given an invalid, stale, unknown-field, or digest-mismatched interchange response, When validation completes, Then it fails closed and names the artifact and contract clause.
- Given a clean clone, When the evidence harness runs, Then it uses no network or host-specific paths.

### Story S3: Gate Delivery Claims on Interchange Evidence

**As a** release owner
**I want** delivery claims gated on fresh interchange evidence
**So that** Forge, Pixel, and documentation never overstate planned or derived outputs.

**Acceptance Criteria:**

- Given the quality gate, When interchange evidence is stale, missing, or digest-mismatched, Then it fails with an actionable message.
- Given a boundary violation, When it is fixed, Then regression tests reject source imports, internal handlers, absolute paths, and shared mutable filesystem use.
- Given the final evidence dossier, When the owner reviews it, Then it distinguishes planned contracts from demonstrated behavior and records originality/provenance review without legal guarantees.

## Out of Scope

- New export formats, engine plugins, game-engine runtime SDKs, or game-engine compatibility claims.
- Downstream pack assembly (owned by the village-pack track) or temporal animation (owned by the animation track).
- Source imports, internal handler calls, absolute paths, or shared mutable filesystem integration.
