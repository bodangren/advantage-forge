# Implementation Plan: Rigid Animation Sprite Pipeline

Prerequisites originally required complete `engine_interop_evidence_20260719` and all three upstream authoring tracks. Delegated final orchestration authority explicitly unblocked bounded S1-S3 implementation while predecessor closeout remains commit-gated. S1-S3 are therefore `[~]`, not legacy-blocked. S4-S5 remain `[b]` on accepted character quality, five readable clips, Pixel playback/pack admission, downstream acceptance, and reconciliation with the broader temporal-delivery metadata contract. Do not introduce skeletal infrastructure unless a separate approved track follows a demonstrated rigid-animation failure.

Current evidence: the public 16-tool MCP surface now accepts semantic animation input through optional `render_preview.animation`, derives all freshness identities internally, and renders timed source frames, per-clip sheets, a derived atlas, the exact source GLB, and a phase-bearing animation bundle in one warm browser session. Paused-source full-body V2 roots `/tmp/faf-public-reference-full-body-v2-20260723-m` and `/tmp/faf-public-reference-full-body-v2-20260723-n` have byte-identical MCP responses, complete 38-chunk retrieval records, and verification summaries. Kimi WebBridge loaded all 26 frames and ran all five declared-timing playback loops. Motion is a usable deterministic scaffold, but pack admission remains blocked because the placeholder character fails the approved reference target; see `temporal-public-mcp-verification.md` and `visual-review-20260722.md`. S12-D and S13 remain immutable visually rejected authoring iterations. S14 repairs the public morphology/reference-geometry contract with an exact atomic 85/100-operation public patch, passes reusable world-geometry regressions, and has a deterministic 46-operation, 47-part, 46-connection, 2,192/2,500-triangle replay across four fresh roots. Mechanical evidence is green, but Kimi WebBridge visual acceptance is pending because the shared execution quota was unavailable; no temporal run is permitted. See `s14-public-path-authoring-evidence.md`.

## Phase S1: Define Rigid Clip Contracts

_Story ref: spec.md#story-s1_

- [~] Task: Approve scope and define clip/revision contracts
  - [~] Update product and tech-stack decisions for rigid clips, `forge-asset-interchange-manifest/v1`, independently required individual source frames/GLBs, and Forge-produced derived atlas/contact-sheet/clip-metadata outputs before code changes.
  - [~] Add versioned schemas for clips, keyframes, transforms/joints, timing, interpolation, loops, anchors, source bindings, and budgets.
  - [~] Define clip revision identity, canonical serialization, compatibility, and migration behavior.
- [~] Task: Write failing clip contract and determinism tests
  - [~] Cover valid looped/one-shot clips and all minimum frame/timing rules.
  - [~] Reject unknown fields, invalid timing, unsupported interpolation/deformation, stale sources, and non-finite transforms.
  - [~] Assert canonical ordering and repeatable semantic frame plans.
- [~] Task: Implement clip parsing, storage, and evaluation
  - [~] Keep contracts engine-neutral and reuse immutable revision storage patterns.
  - [~] Evaluate bounded rigid transforms/joints against an exact asset revision.
  - [~] Return actionable semantic paths for incompatibility and budget errors.
- [~] Task: Generate clip documentation and run quality gates
  - [~] Generate architecture, route, clip-contract, and capability facts.
  - [~] Run contract, document, assembly, coverage, type, lint, generate, doctor, and full checks.
- [~] Task: Measure - User Manual Verification 'Phase S1: Define Rigid Clip Contracts' (Protocol in workflow.md)

## Phase S2: Author Clips Through Tools

_Story ref: spec.md#story-s2_

- [~] Task: Define animation discovery and authoring tool contracts
  - [~] Add bounded operations for listing capabilities, creating, inspecting, patching, comparing, validating, and selecting current clip revisions.
  - [~] Define dry-run, source/clip revision preconditions, affected IDs, and response budgets.
  - [~] Keep operations semantic and task-level rather than exposing a generic timeline or raw matrices without context.
- [~] Task: Write failing handler and MCP tests
  - [~] Cover successful clip creation and localized keyframe/timing edits.
  - [~] Cover invalid targets, stale sources, duplicate/no-op frames, equipment drift, unsupported deformation, and unknown fields.
  - [~] Prove failures do not mutate asset or clip revisions and unrelated state is preserved.
- [~] Task: Implement transport-independent animation handlers
  - [~] Orchestrate clip storage/evaluation through domain services.
  - [~] Keep MCP as a thin schema-validating adapter.
  - [~] Integrate clip state with rich inspection, semantic comparison, and capability reporting.
- [~] Task: Update workflow skill and run quality gates
  - [~] Add animation planning, dry-run/apply, actual-resolution playback review, and honest limitation branches.
  - [~] Regenerate tool/capability catalogs and run handler, MCP, coverage, type, lint, doctor, and full checks.
- [~] Task: Measure - User Manual Verification 'Phase S2: Author Clips Through Tools' (Protocol in workflow.md)

## Phase S3: Render Deterministic Atlases

_Story ref: spec.md#story-s3_

- [~] Task: Define frame, atlas, metadata, and validation contracts
  - [~] Fix cell size, layout ordering, clip ranges, per-frame rectangles, timing, loop flags, labels, anchors, and paths.
  - [~] Define duplicate-frame, loop-seam, identity/equipment consistency, scale/camera drift, clipping, and ground validation.
  - [~] Define pinned versus cross-GPU determinism expectations, portable artifact paths, source-frame/GLB versus Forge-derived-atlas/contact-sheet/clip-metadata classification, and atlas-only source-contract rejection.
- [~] Task: Write failing renderer and artifact tests
  - [~] Cover temporal sampling, interpolation, camera/framing stability, transparency, atlas composition, and metadata consistency.
  - [~] Reject empty/clipped cells, duplicated filler motion, invalid seams, and static contact-sheet substitution.
  - [~] Assert repeated metadata/layout equality and supported byte-level determinism.
- [~] Task: Implement temporal rendering and atlas export
  - [~] Evaluate frames through the shared scene compiler and browser renderer.
  - [~] Preserve transparent 128x128 frames and GLBs as independently required Forge source delivery; Forge composes atlases and contact sheets only as deterministic derived outputs without manual post-processing.
  - [~] Emit portable clip metadata and audit-friendly individual frames, derived atlases, and contact sheets.
- [~] Task: Add browser playback and run quality gates
  - [~] Inspect clips at actual size, enlarged nearest-neighbor scale, frame-by-frame, and declared timing.
  - [~] Display source/clip revisions, timing, loop state, frame metrics, anchors, and validation evidence.
  - [~] Run renderer, pixel, browser, coverage, build, type, lint, generate, doctor, and full checks.
- [~] Task: Measure - User Manual Verification 'Phase S3: Render Deterministic Atlases' (Protocol in workflow.md)

## Phase S4: Deliver Reference Animation Set

_Story ref: spec.md#story-s4_

- [b] Task: Define five reference clip briefs and motion evidence
  - [b] Freeze minimum frames, timing ranges, loop behavior, affected joints/parts, and action phases.
  - [b] Select one supported character identity and accessory loadout that must remain stable.
  - [b] Define actual-resolution, playback, uniqueness, seam, anchor, and identity approval procedures.
- [b] Task: Write failing clip-specific acceptance tests
  - [b] Cover idle weight shift, two distinct walks, attack anticipation/contact/recovery, and damage impact/recovery.
  - [b] Assert minimum unique frames, stable equipment, camera, scale, materials, and ground anchor.
  - [b] Reject duplicated filler frames and semantically indistinguishable walk directions.
- [b] Task: Author and refine the five clips through public tools
  - [b] Use the workflow skill, dry runs, and immutable clip revisions.
  - [b] Iterate based on actual-resolution playback and frame-by-frame evidence.
  - [b] Preserve every accepted source and clip revision plus exact affected IDs.
- [b] Task: Export the combined atlas and run reference gates
  - [b] Produce individual frames, per-clip sheets/previews, combined transparent atlas, and complete metadata.
  - [b] Run uniqueness, loop, timing, pixel, identity, equipment, determinism, and playback checks.
  - [b] Run coverage, build, browser, reference build, type, lint, generate, doctor, and full checks.
- [b] Task: Measure - User Manual Verification 'Phase S4: Deliver Reference Animation Set' (Protocol in workflow.md)

## Phase S5: Prove Animation Product Fitness

_Story ref: spec.md#story-s5_

- [b] Task: Freeze the independent benchmark and target-consumer contract
  - [b] Use the exact five-clip user request without IDs, transforms, schemas, or source hints.
  - [b] Select the Pixel Art Generator playback harness and define public-MCP consumption, validation, and packaging of Forge source frames/GLBs and Forge-derived atlas/contact-sheet/clip metadata without atlas recomputation.
  - [b] Require complete chronological, visual, mechanical, timing, and manual-assistance evidence.
- [b] Task: Write failing end-to-end MCP and consumer tests
  - [b] Exercise authoring, revision, validation, render, export, restart, and persistence through public tools.
  - [b] Parse metadata, extract every clip, play declared timing, and verify pivots, ranges, loops, and transparency.
  - [b] Cover artifact identity, portable paths, clean clone, and unsupported fallback rejection.
- [b] Task: Execute the fresh-LLM animation benchmark
  - [b] Run through the repository skill and public MCP without source reads, canonical JSON edits, internal handlers, absolute paths, shared mutable filesystems, or manual image changes.
  - [b] Capture all retries, correction prompts, timing, revisions, affected IDs, and artifact paths.
  - [b] Inspect actual-resolution playback and frame-by-frame evidence before approval.
- [b] Task: Assemble final verification and run all gates
  - [b] Preserve transcripts, clip/source revisions, frames, atlases, metadata, previews, hashes, manifests, consumer results, and clean-state proof.
  - [b] Run install, check, coverage, build, browser, references, generate, doctor, and artifact verification from a clean clone.
  - [b] Update product, tech stack, README, benchmark protocol, metadata, lessons, and tech debt to observed reality.
- [b] Task: Measure - User Manual Verification 'Phase S5: Prove Animation Product Fitness' (Protocol in workflow.md)
