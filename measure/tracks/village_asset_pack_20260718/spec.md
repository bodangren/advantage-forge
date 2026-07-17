# Specification: Village Asset Pack

## Overview

Assemble a bounded, game-ready village starter pack end-to-end: a small curated membership of characters with equipment, props, vegetation, and structure modules, exported as deterministic sprite sheets, animation atlases, and GLBs under one versioned, digested pack manifest. The pack is the product's capstone proof that an LLM can go from a fantasy RPG brief to a coherent, inspectable asset set using only domain tools.

The reference pack is exactly: two character identities (the committed adventurer plus one novel identity authored through the public kit grammar), one equipment loadout per character, the crate, the tree, and a cottage assembled from the cottage module set. Membership is deliberately bounded so the pack stays auditable and every artifact regenerates deterministically.

## Prerequisites

- `rigid_animation_sprite_pipeline_20260717` is complete (and transitively `llm_authoring_workflow_hardening_20260717`, `character_accessory_library_20260717`, and `novel_asset_identity_authoring_20260717`), so every pack member can be authored, equipped, animated, and rendered through public tools.
- `measure/product.md` and `measure/tech-stack.md` are updated to approve pack-level assembly and export before implementation begins.

## Stories

### Story S1: Define Pack Contracts

**As a** game-team integrator
**I want** versioned pack manifest and membership contracts
**So that** pack contents, per-member revisions, and output digests are reproducible and auditable.

**Acceptance Criteria:**

- Given a pack definition, when parsed, then it declares a stable pack ID, version, ordered membership (asset identity + pinned revision + role), export profiles, and budgets.
- Given pack membership, when validated, then unknown identities, unpinned revisions, duplicate roles, and out-of-budget requests are rejected with actionable semantic paths.
- Given a built pack, when the manifest is inspected, then every member carries its source revision, output artifact paths, and content digests.
- Given the same pack definition and inputs, when built twice, then the manifest and all digests are byte-equivalent.

**Estimate:** L
**Priority:** Must

### Story S2: Author Pack Membership Through Tools

**As an** MCP-capable LLM
**I want** bounded pack discovery, membership, and inspection tools
**So that** I can assemble a pack without editing canonical files or invoking internal handlers.

**Acceptance Criteria:**

- Given registered asset identities and revisions, when listed through the tool API, then pack-eligible members and their equipment/animation readiness are reported honestly.
- Given a membership edit, when applied, then it is validated against the pack contract and recorded as a new pack revision with affected IDs.
- Given a stale member revision (asset revised after pinning), when the pack is inspected, then the drift is reported rather than silently repinned.
- Given a dry-run build request, when evaluated, then the tool reports planned artifacts and budget usage without mutating pack state.

**Estimate:** L
**Priority:** Must

### Story S3: Produce Deterministic Pack Outputs

**As a** game-team integrator
**I want** one command that builds every pack artifact
**So that** sprites, atlases, GLBs, and contact sheets ship together with trustworthy metadata.

**Acceptance Criteria:**

- Given a valid pack revision, when built, then each character yields eight-direction sprite sheets and the approved clip atlases, each prop/vegetation/structure member yields static sprite sheets, and every member yields a GLB.
- Given a build, when outputs land, then the layout is `pack/<id>/<version>/<member>/...` with the manifest at the root and a visual contact sheet covering every member at committed sprite resolution.
- Given validation during build, when a member fails schema, bounds, ground-contact, budget, or frame-occupancy checks, then the build fails closed and names the failing member and rule.
- Given a repeated build of the same revision, when compared, then all artifacts and digests are byte-identical.

**Estimate:** XL
**Priority:** Must

### Story S4: Deliver the Reference Village Pack

**As a** product owner
**I want** the committed reference pack built and evidenced
**So that** the product demonstrates a complete, coherent village starter set.

**Acceptance Criteria:**

- Given the reference membership (two equipped characters, crate, tree, cottage modules), when built, then all artifacts exist, the contact sheet is browser-inspectable, and sprites read correctly at committed resolution.
- Given the pack manifest, when reviewed, then every member's revision, digests, and export profiles match the committed definition.
- Given owner review of the 3D previews and actual-resolution sprites, when approved, then acceptance evidence is recorded in the track.

**Estimate:** L
**Priority:** Must

### Story S5: Prove Pack Product Fitness

**As a** maintainer
**I want** the pack workflow to complete from a clean clone with docs that agree with behavior
**So that** the capstone is reproducible and honestly documented.

**Acceptance Criteria:**

- Given a clean clone, when the documented pack build runs, then it completes without product source reads beyond documented contracts.
- Given product, tech-stack, README, generated catalogs, and Measure documents, when compared against the public capability surface, then they agree on pack capabilities and exclusions.

**Estimate:** M
**Priority:** Must

## Out of Scope

- New asset identities, accessories, clips, or geometry generators beyond the stated reference membership.
- Scene/level composition, terrain, placement of pack members into a world, or game-engine runtime integration.
- Skeletal deformation, cloth simulation, or any animation architecture beyond the delivered rigid-part pipeline.
- Hosted distribution, marketplaces, or collaboration features.
