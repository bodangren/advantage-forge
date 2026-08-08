# Temporal animation handoff

Fantasy Asset Forge now exposes a bounded mechanical rigid-animation subset
through the existing public `render_preview.animation` operation. It derives
freshness-bound rig, pose, clip, frame-plan, frame, atlas, source-GLB, and
delivery identities; renders timed transparent 128x128 samples with locked
camera framing; and exposes the complete render-artifact manifest and bytes
through public bounded retrieval. This is not blanket production-animation
acceptance.

## Required preflight

- Inspect `animation.rigid_pose`, `animation.temporal`,
  `output.sprite.directional`, `output.sprite_atlas`, and `output.glb` together
  with `inspect_capabilities`.
- A `partial` temporal result permits only the exact implemented rigid-part
  render/retrieval subset. Stop if the requested result needs skeletal
  deformation, IK, animated GLB, cloth/hair physics, temporally simulated gear,
  an unregistered creature topology, or a multi-clip batch operation not yet
  advertised by the runtime.
- Bind all work to one inspected immutable asset revision and one stable
  equipment signature. Do not animate a visually rejected base character.

## Public mechanical workflow

1. Declare bounded rigid joints against inspected part IDs and their actual
   axes/limits.
2. Declare named poses, a timed clip with keyframes/interpolation/loop policy,
   directions, FPS, and seed in `render_preview.animation`.
3. Accept only Forge-derived identities; callers never supply hashes.
4. Retrieve the exact `forge-temporal-render-artifacts/v1` manifest with the
   returned `deliveryId`.
5. Retrieve every individual frame, the Forge-derived atlas, and the exact
   source GLB through `get_interchange_artifact_chunk`; large GLBs require
   multiple bounded chunks.
6. Verify hashes, ordering, timing, camera scale, ground anchor, clipping, and
   distinct frame bytes before visual review.
7. Inspect every native frame, timed playback, and manual stepping in Kimi
   WebBridge. Reject motion without readable action mechanics even when all
   hashes and schemas pass.

## What it must not imply

- Eight camera directions are not eight time frames.
- A static contact sheet is not a runtime atlas.
- Distinct PNG hashes are not proof of a walk, attack, idle, or damage reaction.
- The source GLB is rigid source geometry; it is not an animated GLB.
- One mechanically valid clip does not satisfy the five-clip reference set or a
  complete theme pack.
- Atlas-only delivery is invalid; individual source frames and source GLB remain
  required.

## Handoff report

Record the exact immutable revision, morphology/rig/equipment signatures, clip
and frame-plan IDs, sample timing, direction set, delivery ID, every artifact
digest, bounded retrieval proof, and every Kimi frame/playback observation.
Separate the mechanical verdict from visual/motion acceptance and name all
missing clips, consumer playback, pack admission, or unsupported animation
features explicitly.
