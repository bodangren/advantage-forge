# Implementation Plan: Character Accessory Library

Prerequisite: complete `llm_authoring_workflow_hardening_20260717`. Use the workflow skill and rich inspection surface as acceptance infrastructure; do not start animation work in this track.

## Phase S1: Define Accessory Grammar [checkpoint: 5a6d589]

_Story ref: spec.md#story-s1_

- [x] Task: Define accessory role, slot, compatibility, and fidelity contracts [commit: 1822db1]
  - [x] Add schemas for accessory metadata, equipment slots, compatibility tags, handedness, and required-feature evidence.
  - [x] Define layer, visibility, bounds, and pose-compatibility behavior for rigid accessories.
  - [x] Document compatibility and migration behavior for existing sword and shield templates.
- [x] Task: Write failing accessory contract and compatibility tests [commit: a091db3]
  - [x] Cover valid definitions plus unknown fields, invalid slots, missing ports, conflicting handedness, occupied slots, and incompatible anatomy.
  - [x] Cover canonical serialization and unchanged-node preservation during equip and unequip.
  - [x] Cover bounded discovery filters and response budgets.
- [x] Task: Implement accessory validation in shared contracts and assembly [commit: 16fd9e2]
  - [x] Resolve slot ownership and compatibility through named ports.
  - [x] Keep accessory metadata engine-neutral and data-driven.
  - [x] Return actionable conflict paths and guidance.
- [x] Task: Generate grammar documentation and run quality gates [commit: c899ab7]
  - [x] Update product and tech-stack decisions before expanding kit contracts.
  - [x] Run contract, assembly, coverage, type, lint, generate, doctor, and full checks.
- [x] Task: Measure - User Manual Verification 'Phase S1: Define Accessory Grammar' (Protocol in workflow.md) [approved: 2026-07-19]

## Phase S2: Build Initial Accessory Library [checkpoint: 075a038]

_Story ref: spec.md#story-s2_

- [x] Task: Specify the initial accessory catalog and reference uses [commit: afe7f92]
  - [x] Commit the required head, hand, body, back, and waist identities with parameter bounds and materials.
  - [x] Map every template to at least one reference character and attachment slot.
  - [x] Justify any new generator with at least two committed uses before implementation.
- [x] Task: Write failing template and geometry tests [commit: 8b395d6]
  - [x] Cover bounds, triangle counts, normals, material groups, ports, and deterministic output for each accessory.
  - [x] Reject invalid generator parameters, slots, materials, and compatibility metadata.
  - [x] Assert the library remains data and composition over the shared grammar.
- [x] Task: Implement the curated accessory templates [commit: 8221a05]
  - [x] Add helmets/hoods, weapons, shields/torch, armor shells, back items, and waist items.
  - [x] Reuse palette materials and existing generators wherever possible.
  - [x] Keep names, roles, ports, and required visual features stable and documented.
- [x] Task: Generate the accessory catalog and run quality gates [commit: 134d9d6]
  - [x] Regenerate kit, capability, architecture, and output facts.
  - [x] Run geometry, kit, assembly, coverage, type, lint, generate, doctor, and full checks.
- [x] Task: Measure - User Manual Verification 'Phase S2: Build Initial Accessory Library' (Protocol in workflow.md) [approved: 2026-07-19]

## Phase S3: Equip Through Public Tools

_Story ref: spec.md#story-s3_

- [x] Task: Define accessory discovery and equipment operation contracts [commit: d2ab740]
  - [x] Add bounded filtering and inspection for compatible accessories.
  - [x] Expose kit-owned placement, orientation, usage, and visual-check guidance so callers never invent transforms.
  - [x] Define task-level dry-run/apply operations for equip, replace, swap hand, recolor, and unequip.
  - [x] Preserve revision preconditions, semantic diff, and exact affected-ID reporting.
- [x] Task: Write failing tool and MCP tests [commit: 648ad58]
  - [x] Cover successful equipment workflows without manually constructed transforms.
  - [x] Cover occupied slots, invalid ports, incompatible anatomy, handedness, stale revisions, no-ops, and unknown fields.
  - [x] Prove failures do not mutate current state and unrelated nodes remain byte-equivalent.
- [~] Task: Implement accessory workflows through domain handlers
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
