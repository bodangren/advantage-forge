# Specification: Harden Native-Resolution Sprite Silhouette and Framing Validation

## Overview

The product success criterion requires that at 128x128 output, required silhouette features remain at least three pixels wide and that all sprites share a stable ground anchor and framing contract. The current torso metric does not detect thin edge-on equipment: an equipped sword viewed edge-on can fall below the torso-based width check at native resolution, and the Open tech-debt registry records that the unequipped S4 run did not close this limitation. This track extends the project-owned PNG pixel-analysis utilities so thin edge-on equipment is detected, the minimum feature width is measured across the full sprite region per direction, and the ground-anchor and framing contract is enforced across all eight directions.

This is mechanical validation, not visual acceptance. It does not depend on the Kimi review that blocks animation and novel-identity acceptance, and it does not change art or accept any sprite as final art. It strengthens the evidence layer that contact sheets and sprite frames must satisfy before they can even be submitted for visual review.

## Prerequisites and Sequencing

- Builds on the committed sword-and-shield regression and the four reference loadouts (guard, traveler, ranger, caster) from the completed `character_accessory_library_20260717` track.
- No dependency on the rigid animation, reusable rig, novel identity, or village pack visual gates.
- Forge owns the pixel-analysis utilities and the render/export validation pipeline; Pixel Art Generator is not involved.
- This track must not modify `measure/automation-supervisor.py`.

## Contract Graph

`transparent 128x128 sprite frame`
-> `full-region minimum-feature-width measurement`
-> `per-direction width report including edge-on equipment`
-> `ground-anchor and framing-contract enforcement across eight directions`
-> `contact-sheet layout consistency`
-> `wired into render/export validation with explicit pass/fail evidence`.

Each arrow is deterministic: the same frame and the same render profile produce the same width, anchor, and framing verdict.

## Stories

### Story S1: Detect thin edge-on equipment at native resolution

**As a** Forge validator
**I want** the silhouette-width check to measure the full sprite region, not just the torso
**So that** a thin edge-on sword is detected at 128x128 instead of passing silently.

**Acceptance Criteria:**

- The pixel-analysis utility measures the minimum feature width across the full sprite bounding region, not only the torso metric.
- A thin edge-on sword at 128x128 is detected and reported as below the three-pixel threshold when applicable.
- The utility reports the minimum feature width per direction (N, NE, E, SE, S, SW, W, NW).
- Existing sprites that currently pass the torso metric are re-evaluated without regressing previously green directions.

### Story S2: Enforce the stable ground-anchor and framing contract

**As a** Forge validator
**I want** every direction to share the declared ground-anchor row and framing contract
**So that** sprites compose into a stable contact sheet and downstream atlas layout.

**Acceptance Criteria:**

- Validation asserts that all eight directions share the render profile's declared ground-anchor row and bottom-padding contract.
- A direction that violates the ground-anchor or framing contract fails validation with a structured, path-specific error.
- The contact-sheet layout is verified for row/column consistency, direction ordering, and transparent padding.
- Violations are non-mutating and report the offending direction and metric.

### Story S3: Wire strengthened checks into the validation pipeline

**As a** product owner
**I want** the strengthened checks to run as part of sprite and contact-sheet validation
**So that** no sprite frame is submitted for visual review without passing the native-resolution contract.

**Acceptance Criteria:**

- The strengthened width, ground-anchor, and framing checks run as part of the render/export validation pipeline.
- The four reference loadouts and the sword-and-shield regression pass or fail with explicit per-direction evidence.
- Generated facts reflect the strengthened checks and current reference results.
- The Open tech-debt item for weak native-resolution sword detection is updated or resolved.

## Non-Functional Requirements

- Pixel-analysis utilities remain project-owned, deterministic, and free of browser, MCP, or filesystem mutation.
- New validation code maintains more than 80% coverage.
- Checks must not modify the source asset document, the rendered PNG, or the exported GLB.
- This track must not modify `measure/automation-supervisor.py`.

## Out of Scope

- Visual acceptance of any sprite as final art (Kimi review remains separate).
- Animation, atlases, temporal delivery, and pack admission.
- Changing the render profile, palette, or art direction.
- Modifying `measure/automation-supervisor.py`.
