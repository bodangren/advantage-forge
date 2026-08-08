# Implementation Plan: Reusable Rig, Pose, and Clip Libraries

This successor is `[~]` because S1 contract implementation, the non-public S2 domain/persistence layer, and the isolated S3 evaluator core are mechanically green after independent audit and repair confirmation. It does not close or supersede the pending S14 visual gate in `rigid_animation_sprite_pipeline_20260717`. S1/S2 remain in progress pending current full coverage, manual verification, and user-authorized checkpoint handling. S2 public authoring and S3 public rendering are not wired; S4 delivery and S5 visual/downstream admission remain pending or blocked. Existing v1/exact-five behavior and the 16-tool public MCP surface remain compatible and unchanged.

## Phase S1: Define Reusable Rig and Pose Contracts

_Story ref: spec.md#story-s1-define-reusable-rig-and-pose-contracts_

- [~] Task: Define `forge-rigid-rig-profile/v2`
  - [x] Add strict bounded schemas for real assembly hierarchy, normalized pivot frames, deterministic rotation order, one-to-three DOFs, limits, and reciprocal mirrors.
  - [x] Derive canonical identities that normalize unordered inputs and quaternion double-cover while preserving authored evaluation order.
  - [x] Preserve v1 and exact-five compatibility without handler, browser, or MCP wiring.
- [~] Task: Define `forge-pose-library/v1`
  - [x] Bind immutable libraries to exact asset, morphology, v2 rig, equipment, and reference provenance.
  - [x] Define reusable sparse channels, mirror pairs, contacts, root policies, equipment states, and budgets.
  - [x] Validate bindings, channels, limits, contact/equipment parts, generated-reference approval, and immutable identity.
- [~] Task: Prove contract rejection and determinism behavior
  - [x] Cover q/-q, unordered input, significant DOF order, invalid pivots/orders/axes, hierarchy/root/ancestry drift, and non-reciprocal mirrors.
  - [x] Cover unknown joint/DOF/contact/equipment references, generated-reference approval, provenance mutation, exact/+1 budgets, identity-first compilation, and unit contact normals.
  - [x] Cover explicit center/paired/asymmetric assembly mirror policy, reciprocal and parent-chain consistency, unjointed bilateral parts, and unresolved asymmetric contact/equipment rejection.
  - [x] Focused result: `2` files and `23` unique tests pass; strict TypeScript passes.
- [~] Task: Refresh generated facts and complete S1 quality gates
  - [x] Refresh architecture/output-contract facts without overwriting unrelated dirty work; path-plus-NUL-plus-bytes aggregate digest is `6ded75a895908d43a70826a25f23f53c65866396116dcb7709ba43bfd4e3d1cf`.
  - [x] Run focused coverage, lint, generate, doctor, and the compatible v1/exact-five regression set. Current focused coverage is `95.65/93.10/97.36/96.46` for rig v2 and `94.78/90.90/97.72/95.96` for pose libraries (statements/branches/functions/lines).
  - [x] Refresh and verify the immutable delivery claim: `a3f6a13bafc25b4c879dfdb59e09fa4914662fb6e192f6007484e5650982e40b`, `82` implementation files, exact claim gate `12/12` green.
  - [ ] Record the checkpoint only after user-authorized commit handling; this run must not create commits.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Define Reusable Rig and Pose Contracts' (Protocol in workflow.md)

## Phase S2: Persist and Author Reusable Libraries

_Story ref: spec.md#story-s2-persist-and-author-reusable-libraries_

- [x] Task: Define persistence, lineage, concurrency, pagination, and migration contracts
  - [x] Bind strict stream/content identities, immutable parent lineage, optimistic current identity, snapshot-bound opaque cursors, and bounded pagination.
  - [x] Add explicit CAS current selection for existing rig and pose revisions in memory and file repositories.
  - [x] Reject containment escapes, symlinks at storage/kind/stream/record/current levels, non-canonical/truncated/digest-invalid records, stale/tampered/padded/oversized/cross-kind cursors, unreleased locks, and two-instance CAS conflicts.
- [~] Task: Write failing storage, handler, restart, and compatibility tests
  - [x] Capture red-first storage/authoring tests and harden restart, corruption, pagination, race, mirror, contact, equipment, and non-mutation behavior.
  - [ ] Add handler/public-MCP tests only with the deferred public wiring after S3 evaluator/core gates are green.
- [x] Task: Implement immutable rig and pose-library services
  - [x] Implement memory and file repositories, restart-safe atomic current pointers, cross-process stream locks, content deduplication, and deterministic sparse-pose compilation/mirroring.
  - [x] Require an identity-valid same-stream referenced rig and compatibility validation before pose publication.
  - [x] Publish immutable records through same-directory file sync, atomic no-replace link, directory sync, exact-byte EEXIST comparison, bounded stale-temp cleanup, and record digests.
  - [x] Fix malformed content-ID validation so memory getters validate before optional stream lookup.
- [ ] Task: Wire bounded public authoring while preserving the 16-tool surface
  - [ ] Do not begin shared handler/catalog/MCP integration until S3 evaluator and arbitrary-clip core tests are green.
- [~] Task: Run public-MCP, compatibility, coverage, type, lint, generate, and doctor gates
  - [x] Focused fourth-repair result: `4` files and `54/54` tests pass. Focused coverage is `97.50/94.28/100/97.40` for reusable authoring and `89.28/82.54/96.82/90.37` for the repository.
  - [ ] Obtain a current full-suite coverage pass. The one-worker fourth-repair attempt was terminated as environment-red after broad unrelated timeouts under load `16.41/16.71/12.51` and `5.7 GiB` swap use; five affected files passed independently and the remaining two were timeout-only with no assertion mismatch.
  - [x] Lint (`90` modules, `227` dependencies, no violations), strict TypeScript, generated facts, architecture doctor, scoped formatting, and diff hygiene pass. Repository-wide formatting remains independently red/noisy on pre-existing archived evidence outside this track and was not rewritten.
  - [x] Correct the fifth-checkpoint TS4111 failure in the post-edit custom-budget mapper. The prior fourth-checkpoint final typecheck claim was invalidated by that mapper edit until the strict `tsc -b --pretty false` rerun passed.
  - [x] Sixth independent compiler/runtime checkpoint passed after the bounded fifth-checkpoint repair: `4/4` files and `54/54` focused tests, strict TypeScript, focused ESLint, and diff hygiene passed with no findings.
  - [ ] Run handler/public-MCP and downstream-compatible authoring gates after deferred wiring.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Persist and Author Reusable Libraries' (Protocol in workflow.md)

## Phase S3: Evaluate Arbitrary Clip Libraries

_Story ref: spec.md#story-s3-evaluate-arbitrary-clip-libraries_

- [~] Task: Define arbitrary clip-library and partial-retry contracts
  - [x] Add a strict bounded clip-library contract over one exact asset, morphology, rig, pose-library, and equipment binding.
  - [x] Normalize unordered clip and continuity-hook arrays while preserving authored keyframe order and identity significance.
  - [x] Return deterministic successful sibling identities with structured per-request failures and numeric request paths.
- [~] Task: Define exact step boundary, inclusive terminal, half-open loop, seam, and root-motion semantics
  - [x] Make step sampling right-continuous at exact keyframe times and require explicit terminal samples.
  - [x] Validate declared half-open loop boundaries, continuous or intentional seam policy, root-anchor policy, and mirror/contact/equipment continuity hooks.
  - [x] Bound generated sample plans, clip batches, keyframes, duration, hooks, and per-clip requests with budget errors taking precedence over compatibility errors.
- [~] Task: Write failing evaluator, sampling, contact, identity, and compatibility tests
  - [x] Capture missing-module red evidence before the S3 source modules existed.
  - [x] Cover arbitrary shared-library clips, sparse/rest fill, linear interpolation, right-continuous step sampling, terminal inclusion, seam/root/continuity failures, exact limits and +1 budgets, malformed partial requests, and order-sensitive identities.
- [~] Task: Implement deterministic pose composition and arbitrary bounded batch evaluation
  - [x] Compose ordered multi-DOF rotations around kit-authored pivots and bind every assembly part through its exact controlling-joint ancestry.
  - [x] Reuse immutable pose lookup, enforce exact source identities, and preserve deterministic partial-retry results.
  - [x] Add explicit V2-named contract and evaluator barrel aliases without shadowing legacy v1 symbols.
- [~] Task: Run v1/exact-five, evaluator, coverage, type, lint, generate, and doctor gates
  - [x] S3 focused tests pass `7/7`; independent audit found three medium gaps and confirmed all three repairs.
  - [x] Legacy rigid-animation/exact-five compatibility passes `19/19`; strict TypeScript, full lint, dependency boundaries, generated facts, architecture doctor, scoped formatting, and diff hygiene pass.
  - [x] Refresh and verify the immutable delivery claim: `dd6a48f74ebc37bea5036a2b1592a2a8ea35f10d027109d65a4b94e586c303f3`, `84` implementation files, exact claim gate `12/12` green.
  - [ ] Obtain a current full-suite coverage pass. The prior environment-red host-load caveat remains; this S3 checkpoint did not rerun full coverage under the same constrained load.
  - [ ] Wire and verify public authoring/render delivery only after the read-only 16-tool design and exclusive shared-file ownership transfer.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Evaluate Arbitrary Clip Libraries' (Protocol in workflow.md)

## Phase S4: Unify and Accelerate Temporal Delivery

_Story ref: spec.md#story-s4-unify-and-accelerate-temporal-delivery_

- [ ] Task: Reconcile generic and exact-five metadata into one provenance-complete temporal delivery
- [ ] Task: Write failing multi-clip delivery, error, retrieval, and fresh-root determinism tests
- [ ] Task: Implement arbitrary batch rendering in one warm browser lifecycle
- [ ] Task: Measure cold/warm startup, per-frame, composition, retrieval, and total throughput against declared budgets
- [ ] Task: Run renderer, browser, public-MCP, coverage, type, lint, generate, doctor, and full gates
- [ ] Task: Measure - User Manual Verification 'Phase S4: Unify and Accelerate Temporal Delivery' (Protocol in workflow.md)

## Phase S5: Prove Visual and Downstream Fitness

_Story ref: spec.md#story-s5-prove-visual-and-downstream-fitness_

- [b] Task: Clear predecessor S14 Kimi WebBridge visual acceptance and freeze approved source identities
- [b] Task: Render an arbitrary production clip library and account for every frame
- [b] Task: Execute exhaustive Kimi actual-size, enlarged, frame, playback, seam, terminal, root/contact, equipment, and reference review
- [b] Task: Deliver through public MCP and validate consumption/package artifacts in Pixel Art Generator
- [b] Task: Validate both theme packs against the read-only Reading Advantage downstream requirements and browser-visible playback
- [b] Task: Assemble fresh-root hashes, timings, manifests, consumer results, Kimi records, and honest Measure closeout
- [b] Task: Measure - User Manual Verification 'Phase S5: Prove Visual and Downstream Fitness' (Protocol in workflow.md)
