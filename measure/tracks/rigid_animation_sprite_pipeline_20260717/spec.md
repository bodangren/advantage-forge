# Specification: Rigid Animation Sprite Pipeline

## Overview

Let an LLM author, inspect, validate, render, and export five readable rigid-part character clips as a deterministic transparent sprite atlas with trustworthy metadata. The initial clips are `idle`, `walk_forward`, `walk_right`, `attack`, and `receive_damage` for one supported humanoid identity and equipment loadout.

This track deliberately implements rigid-part animation over the existing semantic assembly, joint, pose, material, camera, and renderer contracts. It does not introduce skeletal deformation, skinning, inverse kinematics, physics, cloth simulation, or a timeline editor. If rigid motion cannot meet the approved visual contract, the track must record that evidence before proposing a different animation architecture.

## Prerequisites

- `llm_authoring_workflow_hardening_20260717` is complete.
- `character_accessory_library_20260717` is complete so equipment identity and compatibility persist through clips.
- `novel_asset_identity_authoring_20260717` is complete so the animation workflow operates on a genuinely authored character identity rather than only the committed adventurer reference.
- `measure/product.md` and `measure/tech-stack.md` are updated to approve rigid animation and atlas outputs before implementation begins.

## Stories

### Story S1: Define Rigid Clip Contracts

**As a** character-animation author
**I want** versioned semantic clip, frame, timing, and anchor contracts
**So that** motion is reproducible, inspectable, and associated with an exact asset revision.

**Acceptance Criteria:**

- Given a clip definition, When parsed, Then it declares stable clip ID, source asset/revision, direction or action intent, ordered keyframes, duration or frame timing, loop behavior, interpolation mode, pivot/ground anchor, and affected semantic parts.
- Given a keyframe, When parsed, Then it uses bounded rigid part transforms or joint values and cannot contain raw mesh, arbitrary code, filesystem, network, skinning, or deformation payloads.
- Given looped and one-shot clips, When validation runs, Then minimum frame counts, positive timing, keyframe ordering, allowed interpolation, loop seam rules, and identity/equipment invariants are enforced.
- Given an asset or equipment revision incompatible with a clip, When the clip is inspected or rendered, Then the stale source relationship is reported rather than silently retargeted.
- Given canonical clip serialization, When the same document and seed are processed twice, Then timing, transforms, frame plan, and semantic summaries are equivalent.

**Estimate:** XL
**Priority:** Must

### Story S2: Author Clips Through Tools

**As an** MCP-capable LLM
**I want** bounded clip discovery, creation, inspection, editing, and validation tools
**So that** I can produce motion without editing canonical files or invoking internal handlers.

**Acceptance Criteria:**

- Given a supported character, When animation capabilities are inspected, Then available clip operations, joint/part targets, bounds, presets, timing limits, and explicit exclusions are discoverable.
- Given a clip intent, When a clip is created or revised, Then dry-run and apply return source revision, clip revision, exact affected part IDs, frame/timing summary, validation, and lineage.
- Given invalid targets, transforms, timing, stale revisions, duplicate frames, no-ops, equipment drift, or unsupported deformation, When operations run, Then they fail without corrupting the current asset or clip.
- Given a current clip, When inspected, Then all keyframes, transforms/joints, timing, loop state, anchor, equipment/source binding, and truncation state are observable through the public surface.
- Given the workflow skill, When it plans motion, Then it uses public tools and visual evidence and never writes pose JSON or image frames manually.

**Estimate:** XL
**Priority:** Must

### Story S3: Render Deterministic Atlases

**As a** game team consuming sprite animation
**I want** deterministic transparent frames, atlases, and machine-readable metadata
**So that** clips can be imported and played without reverse-engineering contact sheets.

**Acceptance Criteria:**

- Given validated clips, When rendered, Then every cell is a transparent 128x128 PNG using the declared camera, palette, lighting, scale, ground/pivot anchor, and equipment state.
- Given a combined atlas, When exported, Then deterministic layout metadata includes asset and source revision, clip revisions, sheet path/dimensions, cell dimensions, clip ranges, per-frame rectangles, timing, loop flags, direction/action labels, and pivot/ground coordinates.
- Given repeated renders in the pinned environment, When compared, Then frame plan, metadata, atlas layout, and supported artifact bytes are deterministic; cross-GPU runs preserve semantic and pixel-contract equivalence.
- Given an output set, When validated, Then empty cells, clipping, anchor deviation, camera/scale drift, inconsistent identity/material/equipment, duplicate filler frames, and invalid loop seams are reported.
- Given static directional contact sheets, When animation validation runs, Then they cannot be substituted for temporal clips.

**Estimate:** XL
**Priority:** Must

### Story S4: Deliver Reference Animation Set

**As a** fantasy RPG creator
**I want** a readable five-clip reference character
**So that** the pipeline proves useful temporal motion rather than only schema support.

**Acceptance Criteria:**

- Given the reference character, When `idle` renders, Then it contains at least four distinct frames forming a stable loop with readable breathing or weight shift.
- Given `walk_forward` and `walk_right`, When rendered, Then each contains at least six distinct frames, alternates steps, loops cleanly, and communicates a directionally distinct locomotion intent.
- Given `attack`, When rendered, Then it contains at least six distinct frames with anticipation, contact, and recovery while equipment remains attached.
- Given `receive_damage`, When rendered, Then it contains at least four distinct frames with impact/recoil and recovery or a settled hurt state.
- Given all five clips, When reviewed at actual resolution and in motion, Then character identity, proportions, materials, equipment, camera, scale, and ground position remain consistent except for intended rigid movement.

**Estimate:** XL
**Priority:** Must

### Story S5: Prove Animation Product Fitness

**As a** project owner
**I want** a fresh LLM to deliver the complete atlas through public tools
**So that** broader product approval rests on the real authoring workflow.

**Acceptance Criteria:**

- Given the benchmark's exact five-clip request and a fresh MCP-capable LLM, When the workflow skill runs, Then it creates or selects a supported character, authors all clips, validates, visually iterates, exports the atlas/metadata, and reports every source and clip revision.
- Given the final atlas and metadata, When clips are extracted and played at declared timing, Then frame counts, uniqueness, loop seams, action phases, direction distinction, anchors, and identity consistency pass.
- Given the complete workflow, When evidence is captured, Then natural-language/tool transcript, retries, timing, revisions, actual-resolution frames, animated previews or frame-by-frame sheets, hashes, metadata, and paths are preserved.
- Given a target game importer or reference playback harness, When the atlas and metadata are consumed, Then clip ranges, timing, loops, pivots, and transparent rendering work without manual image edits.

**Estimate:** L
**Priority:** Must

## Non-Functional Requirements

- Animation remains semantic rigid-part motion evaluated by the shared scene compiler.
- Clip documents and revisions are canonical, deterministic, versioned, and independently inspectable.
- Rendering remains bounded, local, and free of arbitrary code, unrestricted filesystems, network retrieval, or DCC dependencies.
- Atlas generation cannot alter frame content through post-processing beyond deterministic layout/composition owned by the product renderer.
- New domain and adapter code maintains more than 80% coverage; browser-visible motion is a mandatory acceptance gate.
- Performance targets and maximum clip/frame/atlas budgets are declared before implementation and validated mechanically.

## Track-Level Acceptance Criteria

- The exact benchmark request produces all five required clips, a transparent atlas, and valid machine-readable metadata through a fresh LLM and public tools only.
- Every clip meets its minimum distinct-frame count and semantic motion requirements.
- Frame uniqueness, loop seams, identity/equipment consistency, clipping, anchor, timing, and direction/action distinctions are mechanically and visually verified.
- The workflow skill contains an animation branch that performs capability preflight, authoring, visual iteration, and evidence reporting without source or manual image edits.
- Product, tech-stack, README, generated catalogs/output contracts, benchmark protocol, and public tools agree on the delivered rigid-animation capability and remaining exclusions.

## Out of Scope

- Skeletal skinning, mesh deformation, inverse kinematics, motion capture, physics, cloth, hair simulation, facial animation, and blend shapes.
- General nonlinear animation editors, arbitrary curves, scripting, or importing third-party animation files.
- More than the five required reference clips or multiple character anatomies unless added through a later track.
- Perspective cameras, arbitrary cell sizes, texture atlases unrelated to rendered sprites, or engine-specific proprietary formats.
- Hiding rigid-animation limitations or claiming approval when delivery-resolution motion remains unreadable.
