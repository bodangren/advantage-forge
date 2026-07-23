# Implementation Plan: Harden Native-Resolution Sprite Silhouette and Framing Validation

This track is `[ ]` (new). It extends project-owned PNG pixel-analysis utilities beyond the torso metric so thin edge-on equipment is detected at native 128x128 resolution and the ground-anchor and framing contract is enforced across all eight directions. It is mechanical validation, not visual acceptance, and does not depend on the animation or novel-identity visual gates. It does not modify `measure/automation-supervisor.py`.

## Phase S1: Detect thin edge-on equipment at native resolution

_Story ref: spec.md#story-s1-detect-thin-edge-on-equipment-at-native-resolution_

- [ ] Task: Write failing tests for full-region minimum-feature-width measurement
  - [ ] Assert a thin edge-on sword at 128x128 is detected as below the three-pixel threshold.
  - [ ] Assert the measurement covers the full sprite bounding region, not only the torso.
- [ ] Task: Implement full-region minimum-feature-width measurement
  - [ ] Scan the full sprite region and report the minimum contiguous feature width.
- [ ] Task: Write failing tests for per-direction minimum-width reporting
  - [ ] Assert all eight directions report their minimum feature width.
  - [ ] Assert previously green directions are not regressed by the new measurement.
- [ ] Task: Implement per-direction width reporting
  - [ ] Emit a structured per-direction width record for each frame.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Detect thin edge-on equipment at native resolution' (Protocol in workflow.md)

## Phase S2: Enforce the stable ground-anchor and framing contract

_Story ref: spec.md#story-s2-enforce-the-stable-ground-anchor-and-framing-contract_

- [ ] Task: Write failing tests for ground-anchor enforcement
  - [ ] Assert all eight directions share the render profile's declared ground-anchor row and bottom-padding contract.
  - [ ] Assert a violating direction fails with a structured, path-specific error.
- [ ] Task: Implement ground-anchor and framing-contract validation
  - [ ] Compare each direction's anchor and framing against the declared profile and reject violations non-mutatingly.
- [ ] Task: Write failing tests for contact-sheet layout consistency
  - [ ] Assert row/column consistency, direction ordering, and transparent padding.
- [ ] Task: Implement contact-sheet layout verification
  - [ ] Validate the contact sheet against the expected layout contract.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Enforce the stable ground-anchor and framing contract' (Protocol in workflow.md)

## Phase S3: Wire strengthened checks into the validation pipeline

_Story ref: spec.md#story-s3-wire-strengthened-checks-into-the-validation-pipeline_

- [ ] Task: Write failing tests asserting the strengthened checks run in sprite and contact-sheet validation
  - [ ] Assert width, ground-anchor, and framing checks execute during render/export validation.
- [ ] Task: Wire the strengthened checks into the render/export validation pipeline
  - [ ] Run the checks as part of the standard sprite/contact-sheet validation sequence.
- [ ] Task: Run the reference loadouts and sword-and-shield regression and record per-direction evidence
  - [ ] Capture explicit pass/fail evidence for guard, traveler, ranger, caster, and the sword-shield regression.
  - [ ] Refresh generated facts and update or resolve the Open tech-debt item.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Wire strengthened checks into the validation pipeline' (Protocol in workflow.md)
