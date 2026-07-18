# Temporal animation handoff

Fantasy Asset Forge currently supports static rigid-pose snapshots, not temporal
animation. A request for walking, attacking, idling, interpolated motion, a frame
sequence, playback, animated GLB, or a runtime sprite atlas therefore crosses the
current public capability boundary.

## What the current workflow may do

- Inspect `animation.rigid_pose`, `animation.temporal`, and
  `output.sprite_atlas` with `inspect_capabilities`.
- Select or upsert one declared static rigid pose when that standalone result is
  useful and explicitly accepted.
- Render the selected pose as eight directional stills and a review contact sheet.
- Preserve a static reference revision and evidence report for a future animation
  track.

## What it must not imply

- Eight camera directions are not eight time frames.
- A contact sheet is not a runtime atlas.
- Several manually selected static poses are not a clip with timing,
  interpolation, playback, or transition semantics.
- Repeated still renders do not constitute animation export evidence.

## Handoff report

Stop before unsupported mutation and record:

1. the requested clip name and gameplay purpose;
2. desired poses/keyframes, direction set, frame count or cadence, looping, and
   transition expectations as user requirements only;
3. the runtime unsupported capability facts and guidance;
4. any accepted static-pose subset and its independent evidence;
5. the prerequisite rigid-animation and sprite-pipeline capability needed before
   implementation can resume.
