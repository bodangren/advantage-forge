# Implementation Plan: Forge–Pixel Public MCP Interchange Evidence

Prerequisite: `llm_authoring_workflow_hardening_20260717` (complete). This is the first active track. Reuse its evidence-dossier and owner-verification conventions. S1 contract foundations and the bounded S2 public-retrieval/immutable-registry foundation are implemented but uncommitted by owner direction. Two independent source-overlay clones now prove the real 16-tool/17-call stdio MCP render, export, manifest, bounded retrieval, reconstruction, and Pixel validation path deterministically. Automated S3 delivery-claim gates are proven, and the owner has accepted the static interchange boundary only. The definitive successor rebind is inventory-complete static claim `dacab165e0ad370136a3ac67abca4f086c21dabb8b45dcd225372b615b416ab4` over 68 producer files after two byte-identical post-alias public-MCP replays; inclusion of animation source is a freshness fact, not temporal acceptance. The checkpoint commit, Git note, clean-commit reachability, and Measure closeout remain pending because commits are unauthorized. Under delegated FINAL authority, successor source development may proceed without formal closeout only if every producer change fails the stale claim gate first, then reruns the real public-MCP replay and rebinds the claim before Green is accepted. The superseded e91779f game-engine-first strategy is not a Red baseline.

## Phase S1: Define Forge–Pixel Interchange Manifest

_Story ref: spec.md#story-s1_

- [x] Task: Define the closed interchange manifest contract
  - [x] Specify exact ID `forge-asset-interchange-manifest/v1`, canonical serialization, SHA-256 pinning, and portable evidence references.
  - [x] Require artifact digests, source revisions, profile ID/version, dimensions/media type, and roles; classify individual 128x128 PNG frames and GLBs as independently required source artifacts and Forge-produced atlases/contact sheets/clip metadata as derived.
  - [x] Define `cute_chibi_v1` as default and `heroic_stylized_v1` originality/provenance review requirements without legal guarantees.
- [x] Task: Write failing manifest schema and boundary tests
  - [x] Reject unknown fields, missing required records, noncanonical payloads, digest mismatches, and nonportable paths.
  - [x] Reject a source import, internal handler, absolute path, or shared mutable filesystem dependency in the Pixel consumer fixture.
  - [x] Assert source/derived artifact classification and profile/version evidence.
- [x] Task: Publish the planned contract documentation
  - [x] Update human docs and generated architecture facts without overstating acceptance.
  - [x] Record a fresh strategy/baseline requirement before Red.

## Phase S2: Prove Public MCP Interchange Evidence

_Story ref: spec.md#story-s2_

- [x] Task: Write failing public-MCP evidence tests
  - [x] Cover manifest retrieval, artifact/evidence digest binding, bounded transport, and fail-closed validation.
  - [x] Cover static PNG/GLB registry delivery plus fixture-only derived atlas/contact-sheet/clip-metadata classification and atlas-only source-contract rejection; live Pixel public-MCP evidence is recorded under `s2-live-evidence/`.
  - [x] Cover clone-root determinism without network, host-specific paths, or shared mutable storage; two independent source-overlay clones replayed the exact uncommitted snapshot because a clean commit remains unauthorized. See `clone-replay-verification.md`.
- [x] Task: Implement the Forge public-MCP evidence path
  - [x] Expose public MCP manifest/chunk operations and a production immutable registry for portable static PNG/GLB/evidence records; Pixel live consumption retrieved 9 artifacts and 1 evidence record through 17 public calls.
  - [x] Persist deterministic workflow evidence and an immutable canonical manifest bound to actual byte digests.
  - [x] Map internal `sprite.default` to external `fantasy.sprite.orthographic.v1` only under exact render-parameter equality; reject drift and unknown IDs.
- [x] Task: Validate downstream completeness-profile handoff
  - [x] Define and exercise the `education-app-pack-profile/v1` handoff inputs without asserting a finished pack.
  - [x] Record per-artifact failures with the manifest contract clause.
- [x] Task: Prove clone-root determinism under the no-commit constraint
  - [x] Two independent local no-hardlink clones reproduced claim `ac456aa8...0b9e89e`, 56 producer files, the focused 5-file/24-test suite, typecheck, the claim-bound gate, and byte-identical 16-tool/17-call stdio MCP outputs from separate empty runtime roots. This is source-overlay portability evidence, not proof that the snapshot is reachable from a clean Git commit. See `clone-replay-verification.md`.

## Phase S3: Gate Delivery Claims on Interchange Evidence

_Story ref: spec.md#story-s3_

- [x] Task: Write failing delivery-claim gate tests
  - [x] Fail when evidence is missing, stale, digest-mismatched, or violates the public-MCP boundary.
  - [x] Reproduce every contract-level defect found in S2, including profile-digest, raw-boundary, arbitrary-chunk-digest, missing-chunk-digest, stale-file, record-attribution, and provenance-reference regressions.
- [x] Task: Wire the gate into the existing check suite
  - [x] Add immutable claim freshness and public-boundary checks through `pnpm check:interchange-evidence` and `pnpm check` without editing generated documentation by hand.
  - [x] Keep unimplemented downstream pack, animation, atlas, and game-engine claims explicitly planned.
- [b] Task: Produce the final evidence dossier and owner verification (blocked:commit-authorization)
  - [x] Assemble manifest, public-MCP, portability, downstream-profile, and originality/provenance evidence under `s2-live-evidence/` with an immutable delivery claim.
  - [x] Record that game-engine compatibility remains Not Assessed.
  - [x] Complete independent clone-root proof and owner/manual verification for the static interchange boundary. See `clone-replay-verification.md` and `owner-verification.md`.
  - [b] Create the required phase checkpoint commit and Git note; owner authorization has not been granted, so this task, phase closeout, and track closeout remain pending. (blocked:commit-authorization)
- [x] Task: Measure - User Manual Verification 'Phase S3: Gate Delivery Claims on Interchange Evidence' (Protocol in workflow.md) [approved: 2026-07-22] [scope: static interchange only] [evidence: owner-verification.md]
