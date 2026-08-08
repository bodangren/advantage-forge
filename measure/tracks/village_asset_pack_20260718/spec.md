# Specification: Educational-App Village Pack

## Overview

This planned capstone has Pixel Art Generator, the named downstream educational-app pack assembler, assemble a bounded complete educational-app village pack from Forge delivery through public MCP only. Forge remains the specialized semantic 3D/raster producer: it delivers independently required individual transparent 128x128 PNG frames and GLBs and produces deterministic derived atlases, contact sheets, and clip metadata with `forge-asset-interchange-manifest/v1`. Pixel consumes, validates, and packages those outputs under the exact `education-app-pack-profile/v1` contract; it does not recompute Forge animation atlases. Atlas-only delivery cannot satisfy the source contract. This specification does not claim that the downstream pack capability exists today.

The reference pack is exactly: two character identities (the committed adventurer plus one novel identity authored through the public kit grammar), one equipment loadout per character, the crate, the tree, and a cottage assembled from the cottage module set. Membership is deliberately bounded so the pack stays auditable and every artifact regenerates deterministically. `cute_chibi_v1` is the default profile; secondary `heroic_stylized_v1` requires originality/provenance review using broad readability ideas only and prohibits copied franchise characters, symbols, costumes, names, and distinctive combinations. This is not a legal guarantee.

## Prerequisites

- `rigid_animation_sprite_pipeline_20260717` is complete (and transitively `engine_interop_evidence_20260719`, `llm_authoring_workflow_hardening_20260717`, `character_accessory_library_20260717`, and `novel_asset_identity_authoring_20260717`), so every pack member can be authored, equipped, animated, and rendered through public tools.
- `measure/product.md` and `measure/tech-stack.md` are updated to approve pack-level assembly and export before implementation begins.

## Stories

### Story S1: Define Educational-App Pack Contracts

**As a** Pixel Art Generator integrator
**I want** a versioned educational completeness contract and downstream membership manifest
**So that** pack contents, per-member Forge source and derived-output revisions, and digests are reproducible and auditable.

**Acceptance Criteria:**

- Given a pack definition, when parsed, then it declares exact contract ID `education-app-pack-profile/v1`, a stable pack ID, version, ordered membership (asset identity + pinned Forge revision + role), completeness requirements, derived export profiles, and budgets.
- Given pack membership, when validated, then unknown identities, unpinned revisions, duplicate roles, and out-of-budget requests are rejected with actionable semantic paths.
- Given a built pack, when the manifest is inspected, then every member carries its `forge-asset-interchange-manifest/v1` source and Forge-derived output revisions, portable artifact references, and content digests.
- Given the same pack definition and inputs, when built twice, then the manifest and all digests are byte-equivalent.

**Estimate:** L
**Priority:** Must

### Story S2: Assemble Membership Through Public MCP

**As** Pixel Art Generator
**I want** bounded public-MCP discovery, membership, and inspection operations
**So that** I can assemble a pack without Forge source imports, canonical-file edits, internal handlers, absolute paths, or shared mutable filesystems.

**Acceptance Criteria:**

- Given registered Forge identities and revisions, when listed through public MCP, then pack-eligible members and their equipment/animation readiness are reported honestly.
- Given a membership edit, when applied, then it is validated against the pack contract and recorded as a new pack revision with affected IDs.
- Given a stale member revision (asset revised after pinning), when the pack is inspected, then the drift is reported rather than silently repinned.
- Given a dry-run build request, when evaluated, then the tool reports planned artifacts and budget usage without mutating pack state.

**Estimate:** L
**Priority:** Must

### Story S3: Package Forge Derived Educational-App Outputs

**As** Pixel Art Generator
**I want** one downstream build that consumes, validates, and packages complete Forge delivery
**So that** independently required source frames and GLBs remain traceable while Forge-derived atlases, contact sheets, clip metadata, and pack metadata ship with trustworthy provenance.

**Acceptance Criteria:**

- Given a valid pack revision, when built, then Forge source frames and GLBs plus Forge-derived character sheets, approved clip atlases, contact sheets, and clip metadata are retrieved by public MCP; Pixel validates and packages them without recomputing Forge animation atlases.
- Given a build, when outputs land, then the portable layout is `pack/<id>/<version>/<member>/...` with the manifest at the root and Forge-produced visual contact-sheet references covering every member at committed sprite resolution.
- Given validation during build, when a member fails schema, bounds, ground-contact, budget, or frame-occupancy checks, then the build fails closed and names the failing member and rule.
- Given a repeated build of the same revision, when compared, then all artifacts and digests are byte-identical.

**Estimate:** XL
**Priority:** Must

### Story S4: Deliver the Reference Educational-App Pack

**As a** product owner
**I want** the committed reference pack built and evidenced
**So that** the product demonstrates a complete, coherent village starter set.

**Acceptance Criteria:**

- Given the reference membership (two equipped characters, crate, tree, cottage modules), when packaged by Pixel from public MCP delivery, then all required Forge source and derived artifacts exist, the contact sheet is browser-inspectable, and sprites read correctly at committed resolution.
- Given the pack manifest, when reviewed, then every member's revision, digests, and export profiles match the committed definition.
- Given owner review of the 3D previews and actual-resolution sprites, when approved, then acceptance evidence is recorded in the track.

**Estimate:** L
**Priority:** Must

### Story S5: Prove Educational-App Pack Fitness

**As a** maintainer
**I want** the pack workflow to complete from a clean clone with docs that agree with behavior
**So that** the capstone is reproducible and honestly documented.

**Acceptance Criteria:**

- Given a clean clone, when the documented downstream pack build runs, then it completes without Forge source reads beyond public MCP and documented portable contracts.
- Given product, tech-stack, README, generated catalogs, and Measure documents, when compared against the public capability surface, then they agree on pack capabilities and exclusions.

**Estimate:** M
**Priority:** Must

## Out of Scope

- New asset identities, accessories, clips, or geometry generators beyond the stated reference membership.
- Forge source imports, internal handler calls, absolute paths, shared mutable filesystems, scene/level composition, terrain, placement of pack members into a world, or game-engine runtime integration.
- Skeletal deformation, cloth simulation, or any animation architecture beyond the delivered rigid-part pipeline.
- Hosted distribution, marketplaces, or collaboration features.
