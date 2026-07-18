# Implementation Plan: Character Accessory Library

Prerequisite: complete `llm_authoring_workflow_hardening_20260717`. Use the workflow skill and rich inspection surface as acceptance infrastructure; do not start animation work in this track.

## Phase S1: Define Accessory Grammar

_Story ref: spec.md#story-s1_

- [~] Task: Define accessory role, slot, compatibility, and fidelity contracts
  - [ ] Add schemas for accessory metadata, equipment slots, compatibility tags, handedness, and required-feature evidence.
  - [ ] Define layer, visibility, bounds, and pose-compatibility behavior for rigid accessories.
  - [ ] Document compatibility and migration behavior for existing sword and shield templates.
- [ ] Task: Write failing accessory contract and compatibility tests
  - [ ] Cover valid definitions plus unknown fields, invalid slots, missing ports, conflicting handedness, occupied slots, and incompatible anatomy.
  - [ ] Cover canonical serialization and unchanged-node preservation during equip and unequip.
  - [ ] Cover bounded discovery filters and response budgets.
- [ ] Task: Implement accessory validation in shared contracts and assembly
  - [ ] Resolve slot ownership and compatibility through named ports.
  - [ ] Keep accessory metadata engine-neutral and data-driven.
  - [ ] Return actionable conflict paths and guidance.
- [ ] Task: Generate grammar documentation and run quality gates
  - [ ] Update product and tech-stack decisions before expanding kit contracts.
  - [ ] Run contract, assembly, coverage, type, lint, generate, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Define Accessory Grammar' (Protocol in workflow.md)

## Phase S2: Build Initial Accessory Library

_Story ref: spec.md#story-s2_

- [ ] Task: Specify the initial accessory catalog and reference uses
  - [ ] Commit the required head, hand, body, back, and waist identities with parameter bounds and materials.
  - [ ] Map every template to at least one reference character and attachment slot.
  - [ ] Justify any new generator with at least two committed uses before implementation.
- [ ] Task: Write failing template and geometry tests
  - [ ] Cover bounds, triangle counts, normals, material groups, ports, and deterministic output for each accessory.
  - [ ] Reject invalid generator parameters, slots, materials, and compatibility metadata.
  - [ ] Assert the library remains data and composition over the shared grammar.
- [ ] Task: Implement the curated accessory templates
  - [ ] Add helmets/hoods, weapons, shields/torch, armor shells, back items, and waist items.
  - [ ] Reuse palette materials and existing generators wherever possible.
  - [ ] Keep names, roles, ports, and required visual features stable and documented.
- [ ] Task: Generate the accessory catalog and run quality gates
  - [ ] Regenerate kit, capability, architecture, and output facts.
  - [ ] Run geometry, kit, assembly, coverage, type, lint, generate, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Build Initial Accessory Library' (Protocol in workflow.md)

## Phase S3: Equip Through Public Tools

_Story ref: spec.md#story-s3_

- [ ] Task: Define accessory discovery and equipment operation contracts
  - [ ] Add bounded filtering and inspection for compatible accessories.
  - [ ] Define task-level dry-run/apply operations for equip, replace, swap hand, recolor, and unequip.
  - [ ] Preserve revision preconditions, semantic diff, and exact affected-ID reporting.
- [ ] Task: Write failing tool and MCP tests
  - [ ] Cover successful equipment workflows without manually constructed transforms.
  - [ ] Cover occupied slots, invalid ports, incompatible anatomy, handedness, stale revisions, no-ops, and unknown fields.
  - [ ] Prove failures do not mutate current state and unrelated nodes remain byte-equivalent.
- [ ] Task: Implement accessory workflows through domain handlers
  - [ ] Resolve compatible templates and ports inside bounded domain services.
  - [ ] Keep the MCP adapter thin and response budgeted.
  - [ ] Enrich inspection and comparison with accessory state.
- [ ] Task: Update the workflow skill and run quality gates
  - [ ] Add accessory discovery, loadout planning, dry-run, visual review, and limitation branches.
  - [ ] Regenerate public tool and capability catalogs and run handler, MCP, coverage, type, lint, doctor, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Equip Through Public Tools' (Protocol in workflow.md)

## Phase S4: Verify Character Readability

_Story ref: spec.md#story-s4_

- [ ] Task: Define reference loadouts and accessory-specific pixel contracts
  - [ ] Specify guard, traveler, ranger, and caster identities using only committed library parts.
  - [ ] Declare required accessory feature IDs and per-direction minimum evidence.
  - [ ] Define idle/action, equipped/unequipped, and before/after browser review evidence.
- [ ] Task: Write failing browser, pixel, and GLB acceptance tests
  - [ ] Cover eight directions, transparent pixels, ground anchor, clipping, accessory evidence, stable framing, and material separation.
  - [ ] Cover equipment attachment and visibility across poses and variants.
  - [ ] Reload GLBs and compare accessory nodes, materials, transforms, bounds, and meter scale.
- [ ] Task: Build and refine the four reference loadouts
  - [ ] Create all revisions through public tools and preserve workflow transcripts.
  - [ ] Iterate only through bounded parameters, materials, and attachments when actual-resolution review fails.
  - [ ] Keep every accepted accessory within declared budgets and style constraints.
- [ ] Task: Assemble final evidence and run all gates
  - [ ] Run the workflow skill with a fresh MCP-capable LLM for every reference loadout.
  - [ ] Preserve 3D views, contact sheets, actual-resolution captures, metrics, manifests, GLBs, transcripts, and clean-status proof.
  - [ ] Run install, check, coverage, build, browser, reference build, generate, doctor, and artifact verification.
- [ ] Task: Measure - User Manual Verification 'Phase S4: Verify Character Readability' (Protocol in workflow.md)
