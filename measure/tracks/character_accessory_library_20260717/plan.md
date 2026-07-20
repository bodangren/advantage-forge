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
- [x] Task: Implement accessory workflows through domain handlers [commit: ade20de]
  - [x] Resolve compatible templates and ports inside bounded domain services.
  - [x] Keep the MCP adapter thin and response budgeted.
  - [x] Enrich inspection and comparison with accessory state.
- [x] Task: Update the workflow skill and run quality gates [commit: 0bcaf64]
  - [x] Add accessory discovery, loadout planning, dry-run, visual review, and limitation branches.
  - [x] Regenerate public tool and capability catalogs and run handler, MCP, coverage, type, lint, doctor, and full checks.
- [x] Task: Measure - User Manual Verification 'Phase S3: Equip Through Public Tools' (Protocol in workflow.md) [approved: 2026-07-19]

## Phase S4: Verify Character Readability

_Story ref: spec.md#story-s4_

- [x] Task: Define reference loadouts and accessory-specific pixel contracts [commit: 3f801bb]
  - [x] Specify guard, traveler, ranger, and caster identities using only committed library parts.
  - [x] Declare required accessory feature IDs and per-direction minimum evidence.
  - [x] Define idle/action, equipped/unequipped, and before/after browser review evidence.
- [x] Task: Write failing browser, pixel, and GLB acceptance tests [commit: ff68003]
  - [x] Cover eight directions, transparent pixels, ground anchor, clipping, accessory evidence, stable framing, and material separation.
  - [x] Cover equipment attachment and visibility across poses and variants.
  - [x] Reload GLBs and compare accessory nodes, materials, transforms, bounds, and meter scale.
- [x] Task: Build and refine the four reference loadouts [commit: c2d8e6c]
  - [x] Create all revisions through public tools and preserve workflow transcripts.
  - [x] Iterate only through bounded parameters, materials, and attachments when actual-resolution review fails.
  - [x] Keep every accepted accessory within declared budgets and style constraints.
- [x] Task: Assemble final evidence and run all gates [commits: c26dde4, 076199f, a77e87c]
  - [x] Close the fresh-client criterion through the owner-approved deterministic public-MCP and independent LLM/browser substitute evidence; retain the K3 path as Not Assessed. [decision: s4-evidence/owner-closure-decision.md]
  - [x] Preserve exact-revision 3D views, contact sheets, actual-resolution captures, metrics, manifests, GLBs, transcripts, and repository-status proof. [commit: 076199f]
  - [x] Run check components, coverage, build, browser, reference build, generate, doctor, and artifact verification. [commit: 076199f] [note: monolithic pnpm check stops only because format:check scans unrelated untracked and historical evidence]
- [x] Task: Remediate owner-rejected S4 delivery-resolution fidelity [commit: 076199f]
  - Make the Guard shield materially legible, keep long weapons readable edge-on, and add a direct sword-plus-shield regression review.
  - Replace the Traveler, Ranger, and Caster box-like silhouettes with bounded rigid forms that read as backpack, armor/quiver/pouch, and cape/pouch.
  - Complete exact-revision interactive 3D, contact-sheet, and native-frame review for every final idle/action revision.
  - Complete fresh sandboxed MCP-capable LLM workflows for all four loadouts without source or non-Forge tool access.
  - Record the owner decision that attachment/validation remains eight-directional while pixel identity evidence is limited to documented physically observable directions, including the single far-side view of handed items and self-occluding back or single-hip features.
- [x] Task: Measure - Owner Verification 'Phase S4: Verify Character Readability' (Protocol in workflow.md) [commit: dfc6204] [approved with bounded provider-infrastructure deviation: 2026-07-20; evidence: s4-evidence/owner-closure-decision.md]
- [x] Task: Write failing Red-phase contract tests for the sandboxed-LLM runner and evidence aggregator [commit: 5eeb70c]
  - [x] Cover the four exact loadouts, omitted/missing loadout failure, and Not Assessed classification (A4/A6).
  - [x] Cover deny-all permission config with only `forge_*` allowlisted and no source/file/shell/internal-handler fallback.
  - [x] Cover completed session, ≥1 Forge call, zero non-Forge calls, and non-empty final response.
  - [x] Cover revision-bound artifact and GLB audit evidence and explicit labeled counts (A3).
  - [x] Cover hand-edited/incomplete summary rejection (A5) and infrastructure zero-event handling.
  - [x] Run focused Red test command and record command evidence.
    - RED command: `pnpm exec vitest run tests/scripts/run-sandboxed-llm.contract.test.ts tests/scripts/aggregate-sandboxed-evidence.contract.test.ts`
    - Result: 2 test files failed because `scripts/run-sandboxed-llm.mjs` and `scripts/aggregate-sandboxed-evidence.mjs` do not exist; no production code was implemented. Evidence saved to `/tmp/opencode/s4-red-test-output.txt`.
- [x] Task: Implement the bounded sandbox runner and fail-closed evidence aggregator [commit: a77e87c]
  - [x] Restrict the client to the workflow instructions and public `forge_*` MCP surface.
  - [x] Bound first-event and total runtime, isolate client configuration, and classify zero-event failures as infrastructure Not Assessed.
  - [x] Require all four loadouts, completed sessions, Forge-only calls, non-empty responses, revision-bound manifests, and labeled aggregate counts.
  - [x] Pass 13 focused contract tests, typecheck, targeted lint, and diff hygiene.
- [x] Task: Remove the rejected sandbox reassessment harness after independent review [commit: 8f71c1d]
  - [x] Preserve Review B and C findings that the producer/consumer and evidence-trust contracts were not fail-closed.
  - [x] Remove the runner, aggregator, declarations, and tests instead of weakening review requirements.
  - [x] Require any future external-client reassessment to use a separate approved track and fresh TDD cycle.
