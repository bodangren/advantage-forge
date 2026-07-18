# Visual fidelity review

Mechanical validation proves contracts and budgets, not whether a fantasy asset
reads clearly in play. Review the final revision on all required surfaces.

## Evidence surfaces

### Interactive 3D

Open the repository inspector for the final artifact/revision. Orbit and inspect
the silhouette, proportions, part attachment, intersections, material separation,
ground contact, and whether the requested feature is actually present. Record the
revision or manifest identity shown by the inspector and the observed viewpoints.

### Contact sheet

Open the labeled eight-direction sheet and inspect N, NE, E, SE, S, SW, W, and NW.
Check stable framing, consistent scale, ground anchor, recognizable silhouette,
missing or occluded parts, camera-facing artifacts, and directional discontinuity.
The contact sheet is an overview, not delivery-resolution approval.

### Actual 128x128 frames

Open every directional PNG at native 128x128 resolution with smoothing disabled
when the viewer permits. Do not zoom and then treat the enlarged view as proof.
Check:

- no occupied pixels touch a clipped edge;
- feet/base meet the declared ground row consistently;
- the requested accessory or shape remains visible in the directions where it
  should read;
- narrow features do not disappear below the minimum useful width;
- adjacent materials have enough value/color separation at native size;
- transparent areas and occupied bounds look intentional;
- no one direction has a surprising scale, offset, or silhouette jump.

Record the inspected paths and direction-specific observations. Use pixel metrics
as supporting evidence, never as a substitute for looking at the frames.

## Failure routing

When visual review finds a problem, classify it before editing:

- `bounded semantic correction`: an inspected transform, shape parameter,
  material binding, visibility, connection, variant, pose, or render profile can
  address it. Start another dry-run/apply/compare cycle.
- `capability gap`: the fix needs a new template, novel identity, raw mesh,
  temporal animation, atlas, or unsupported anatomy. Stop and report it.
- `artifact or viewer failure`: identity mismatch, missing files, unreadable
  image, wrong dimensions, or stale revision. Fail the artifact gate; do not
  fabricate a substitute.

The final verdict must name any direction with clipping, lost accessories,
unstable framing, weak material separation, or ambiguous silhouette.
