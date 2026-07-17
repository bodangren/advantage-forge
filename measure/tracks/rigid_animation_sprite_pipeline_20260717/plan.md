# Implementation Plan: Rigid Animation Sprite Pipeline

Prerequisites: complete all three upstream authoring tracks and approve rigid animation in `product.md` and `tech-stack.md`. Begin with contract evidence; do not introduce skeletal infrastructure unless a separate approved track follows a demonstrated rigid-animation failure.

## Phase S1: Define Rigid Clip Contracts

_Story ref: spec.md#story-s1_

- [ ] Task: Approve scope and define clip/revision contracts
  - [ ] Update product and tech-stack decisions for rigid clips and atlas outputs before code changes.
  - [ ] Add versioned schemas for clips, keyframes, transforms/joints, timing, interpolation, loops, anchors, source bindings, and budgets.
  - [ ] Define clip revision identity, canonical serialization, compatibility, and migration behavior.
- [ ] Task: Write failing clip contract and determinism tests
  - [ ] Cover valid looped/one-shot clips and all minimum frame/timing rules.
  - [ ] Reject unknown fields, invalid timing, unsupported interpolation/deformation, stale sources, and non-finite transforms.
  - [ ] Assert canonical ordering and repeatable semantic frame plans.
- [ ] Task: Implement clip parsing, storage, and evaluation
  - [ ] Keep contracts engine-neutral and reuse immutable revision storage patterns.
  - [ ] Evaluate bounded rigid transforms/joints against an exact asset revision.
  - [ ] Return actionable semantic paths for incompatibility and budget errors.
- [ ] Task: Generate clip documentation and run quality gates
  - [ ] Generate architecture, route, clip-contract, and capability facts.
  - [ ] Run contract, document, assembly, coverage, type, lint, generate, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Define Rigid Clip Contracts' (Protocol in workflow.md)

## Phase S2: Author Clips Through Tools

_Story ref: spec.md#story-s2_

- [ ] Task: Define animation discovery and authoring tool contracts
  - [ ] Add bounded operations for listing capabilities, creating, inspecting, patching, comparing, validating, and selecting current clip revisions.
  - [ ] Define dry-run, source/clip revision preconditions, affected IDs, and response budgets.
  - [ ] Keep operations semantic and task-level rather than exposing a generic timeline or raw matrices without context.
- [ ] Task: Write failing handler and MCP tests
  - [ ] Cover successful clip creation and localized keyframe/timing edits.
  - [ ] Cover invalid targets, stale sources, duplicate/no-op frames, equipment drift, unsupported deformation, and unknown fields.
  - [ ] Prove failures do not mutate asset or clip revisions and unrelated state is preserved.
- [ ] Task: Implement transport-independent animation handlers
  - [ ] Orchestrate clip storage/evaluation through domain services.
  - [ ] Keep MCP as a thin schema-validating adapter.
  - [ ] Integrate clip state with rich inspection, semantic comparison, and capability reporting.
- [ ] Task: Update workflow skill and run quality gates
  - [ ] Add animation planning, dry-run/apply, actual-resolution playback review, and honest limitation branches.
  - [ ] Regenerate tool/capability catalogs and run handler, MCP, coverage, type, lint, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Author Clips Through Tools' (Protocol in workflow.md)

## Phase S3: Render Deterministic Atlases

_Story ref: spec.md#story-s3_

- [ ] Task: Define frame, atlas, metadata, and validation contracts
  - [ ] Fix cell size, layout ordering, clip ranges, per-frame rectangles, timing, loop flags, labels, anchors, and paths.
  - [ ] Define duplicate-frame, loop-seam, identity/equipment consistency, scale/camera drift, clipping, and ground validation.
  - [ ] Define pinned versus cross-GPU determinism expectations and portable artifact paths.
- [ ] Task: Write failing renderer and artifact tests
  - [ ] Cover temporal sampling, interpolation, camera/framing stability, transparency, atlas composition, and metadata consistency.
  - [ ] Reject empty/clipped cells, duplicated filler motion, invalid seams, and static contact-sheet substitution.
  - [ ] Assert repeated metadata/layout equality and supported byte-level determinism.
- [ ] Task: Implement temporal rendering and atlas export
  - [ ] Evaluate frames through the shared scene compiler and browser renderer.
  - [ ] Compose transparent atlases deterministically without manual post-processing.
  - [ ] Emit portable metadata and audit-friendly individual frames/contact sheets.
- [ ] Task: Add browser playback and run quality gates
  - [ ] Inspect clips at actual size, enlarged nearest-neighbor scale, frame-by-frame, and declared timing.
  - [ ] Display source/clip revisions, timing, loop state, frame metrics, anchors, and validation evidence.
  - [ ] Run renderer, pixel, browser, coverage, build, type, lint, generate, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Render Deterministic Atlases' (Protocol in workflow.md)

## Phase S4: Deliver Reference Animation Set

_Story ref: spec.md#story-s4_

- [ ] Task: Define five reference clip briefs and motion evidence
  - [ ] Freeze minimum frames, timing ranges, loop behavior, affected joints/parts, and action phases.
  - [ ] Select one supported character identity and accessory loadout that must remain stable.
  - [ ] Define actual-resolution, playback, uniqueness, seam, anchor, and identity approval procedures.
- [ ] Task: Write failing clip-specific acceptance tests
  - [ ] Cover idle weight shift, two distinct walks, attack anticipation/contact/recovery, and damage impact/recovery.
  - [ ] Assert minimum unique frames, stable equipment, camera, scale, materials, and ground anchor.
  - [ ] Reject duplicated filler frames and semantically indistinguishable walk directions.
- [ ] Task: Author and refine the five clips through public tools
  - [ ] Use the workflow skill, dry runs, and immutable clip revisions.
  - [ ] Iterate based on actual-resolution playback and frame-by-frame evidence.
  - [ ] Preserve every accepted source and clip revision plus exact affected IDs.
- [ ] Task: Export the combined atlas and run reference gates
  - [ ] Produce individual frames, per-clip sheets/previews, combined transparent atlas, and complete metadata.
  - [ ] Run uniqueness, loop, timing, pixel, identity, equipment, determinism, and playback checks.
  - [ ] Run coverage, build, browser, reference build, type, lint, generate, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S4: Deliver Reference Animation Set' (Protocol in workflow.md)

## Phase S5: Prove Animation Product Fitness

_Story ref: spec.md#story-s5_

- [ ] Task: Freeze the independent benchmark and target-consumer contract
  - [ ] Use the exact five-clip user request without IDs, transforms, schemas, or source hints.
  - [ ] Select a target playback/import harness and define expected atlas/metadata behavior.
  - [ ] Require complete chronological, visual, mechanical, timing, and manual-assistance evidence.
- [ ] Task: Write failing end-to-end MCP and consumer tests
  - [ ] Exercise authoring, revision, validation, render, export, restart, and persistence through public tools.
  - [ ] Parse metadata, extract every clip, play declared timing, and verify pivots, ranges, loops, and transparency.
  - [ ] Cover artifact identity, portable paths, clean clone, and unsupported fallback rejection.
- [ ] Task: Execute the fresh-LLM animation benchmark
  - [ ] Run through the repository skill without source reads, canonical JSON edits, internal handlers, or manual image changes.
  - [ ] Capture all retries, correction prompts, timing, revisions, affected IDs, and artifact paths.
  - [ ] Inspect actual-resolution playback and frame-by-frame evidence before approval.
- [ ] Task: Assemble final verification and run all gates
  - [ ] Preserve transcripts, clip/source revisions, frames, atlases, metadata, previews, hashes, manifests, consumer results, and clean-state proof.
  - [ ] Run install, check, coverage, build, browser, references, generate, doctor, and artifact verification from a clean clone.
  - [ ] Update product, tech stack, README, benchmark protocol, metadata, lessons, and tech debt to observed reality.
- [ ] Task: Measure - User Manual Verification 'Phase S5: Prove Animation Product Fitness' (Protocol in workflow.md)
