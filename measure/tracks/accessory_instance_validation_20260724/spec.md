# Specification: Harden Accessory Instance Slot and Handedness Validation

## Overview

The completed `character_accessory_library_20260717` track left two Open tech-debt items in accessory instance validation. First, omitted compatible slots allow an instance override: the default-to-template-slot behavior must be enforced in assembly validation before S3 equipment operations are exercised. Second, omitted handedness conflicts with two-handed metadata: no two-handed template exists yet, and omitted instance handedness must be normalized before one is added. This track closes both gaps deterministically and wires the hardened validation into the public equipment operations.

This is mechanical validation, not visual acceptance. It does not depend on the Kimi review that blocks animation and novel-identity acceptance. It preserves the seventeen registered templates, the four reference loadouts (guard, traveler, ranger, caster), and the sword-and-shield regression without changing their canonical identity or revision behavior.

## Prerequisites and Sequencing

- Builds on the completed `character_accessory_library_20260717` track (seventeen templates, six equipment slots, public accessory operations).
- No dependency on the rigid animation, reusable rig, novel identity, or village pack visual gates.
- Forge owns accessory slot resolution, handedness normalization, and assembly validation; equipment remains data in `fantasy-kit`.
- This track must not modify `measure/automation-supervisor.py`.

## Contract Graph

`accessory template (declared slot + handedness)`
-> `instance omits slot -> defaults to template slot`
-> `instance overrides slot -> validated against template compatibility`
-> `instance omits handedness -> resolves to template handedness`
-> `two-handed template -> guarded path validates before registration`
-> `equip/replace/swap-hand/recolor/unequip enforce hardened validation`.

Each arrow is deterministic and non-mutating on failure.

## Stories

### Story S1: Default omitted compatible slots to the template slot

**As a** Forge validator
**I want** an omitted instance equipment slot to default to the template's declared slot
**So that** equipment placement is deterministic rather than dependent on caller omission.

**Acceptance Criteria:**

- When an accessory instance omits its equipment slot, assembly validation defaults to the template's declared slot.
- An instance slot override that conflicts with the template's declared slot or compatible set is rejected with a structured, path-specific error.
- The seventeen registered templates and the four reference loadouts remain compatible; their canonical identity and revision behavior are unchanged.
- Failures are non-mutating and distinguish schema, compatibility, and stale-revision errors.

### Story S2: Normalize omitted instance handedness against template metadata

**As a** Forge validator
**I want** omitted instance handedness to resolve to the template's declared handedness
**So that** a future two-handed template cannot conflict with silently omitted handedness.

**Acceptance Criteria:**

- Omitted instance handedness resolves to the template's declared handedness.
- A handedness conflict with two-handed metadata is rejected with a structured error.
- A guarded two-handed-template path validates handedness requirements before any two-handed template can be registered.
- Existing one-handed templates and the sword-and-shield regression remain compatible.

### Story S3: Wire hardened validation into equipment operations

**As a** an MCP-capable author
**I want** equip, replace, swap-hand, recolor, and unequip to enforce the hardened validation
**So that** no public operation can produce an invalid accessory instance.

**Acceptance Criteria:**

- The public `accessory_equip`, `accessory_replace`, `accessory_swap_hand`, `accessory_recolor`, and `accessory_unequip` operations enforce the hardened slot and handedness validation.
- Dry-run and apply envelopes report the resolved slot and handedness.
- The sword-and-shield regression and the four reference loadouts pass the hardened validation.
- The two Open tech-debt items are updated or resolved.

## Non-Functional Requirements

- Validation remains shared assembly behavior in the domain layer, not character-specific or MCP-specific logic.
- New validation code maintains more than 80% coverage.
- The public 16-tool MCP surface is preserved; no new tool is added.
- This track must not modify `measure/automation-supervisor.py`.

## Out of Scope

- Adding new accessory templates beyond the existing seventeen.
- Visual acceptance of any equipped character.
- Animation, atlases, temporal delivery, and pack admission.
- Modifying `measure/automation-supervisor.py`.
