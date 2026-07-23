# Implementation Plan: Harden Accessory Instance Slot and Handedness Validation

This track is `[ ]` (new). It defaults omitted instance equipment slots to the template slot, normalizes omitted instance handedness against template metadata, adds a guarded two-handed-template path, and wires the hardened validation into the public equipment operations. It is mechanical validation and is not blocked by the visual acceptance gates. It does not modify `measure/automation-supervisor.py`.

## Phase S1: Default omitted compatible slots to the template slot

_Story ref: spec.md#story-s1-default-omitted-compatible-slots-to-the-template-slot_

- [ ] Task: Write failing tests for slot defaulting
  - [ ] Assert an omitted instance slot defaults to the template's declared slot.
  - [ ] Assert the seventeen templates and four loadouts remain compatible with unchanged identity.
- [ ] Task: Implement slot defaulting in assembly validation
  - [ ] Resolve an omitted instance slot to the template slot before equipment operations.
- [ ] Task: Write failing tests for conflicting slot override rejection
  - [ ] Assert an instance slot override conflicting with the template's declared slot or compatible set is rejected with a structured error.
- [ ] Task: Implement conflict rejection with structured errors
  - [ ] Reject non-mutatingly and distinguish schema, compatibility, and stale-revision errors.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Default omitted compatible slots to the template slot' (Protocol in workflow.md)

## Phase S2: Normalize omitted instance handedness against template metadata

_Story ref: spec.md#story-s2-normalize-omitted-instance-handedness-against-template-metadata_

- [ ] Task: Write failing tests for handedness normalization
  - [ ] Assert omitted instance handedness resolves to the template's declared handedness.
  - [ ] Assert existing one-handed templates and the sword-and-shield regression remain compatible.
- [ ] Task: Implement handedness normalization
  - [ ] Resolve omitted instance handedness to the template handedness in assembly validation.
- [ ] Task: Write failing tests for two-handed conflict rejection and the guarded path
  - [ ] Assert a handedness conflict with two-handed metadata is rejected.
  - [ ] Assert the guarded two-handed-template path validates handedness requirements before registration.
- [ ] Task: Implement the two-handed-template guard
  - [ ] Require explicit two-handed validation before any two-handed template can be registered.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Normalize omitted instance handedness against template metadata' (Protocol in workflow.md)

## Phase S3: Wire hardened validation into equipment operations

_Story ref: spec.md#story-s3-wire-hardened-validation-into-equipment-operations_

- [ ] Task: Write failing tests asserting public equipment operations enforce hardened validation
  - [ ] Assert equip, replace, swap-hand, recolor, and unequip enforce slot and handedness validation.
  - [ ] Assert dry-run and apply envelopes report the resolved slot and handedness.
- [ ] Task: Wire hardened validation into the public equipment operations
  - [ ] Route equip/replace/swap-hand/recolor/unequip through the hardened validation.
- [ ] Task: Run the sword-and-shield regression and four-loadout regression and refresh tech-debt
  - [ ] Confirm the regression set passes the hardened validation.
  - [ ] Update or resolve the two Open tech-debt items.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Wire hardened validation into equipment operations' (Protocol in workflow.md)
