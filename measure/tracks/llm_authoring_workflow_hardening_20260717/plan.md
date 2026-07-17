# Implementation Plan: LLM Authoring Workflow Hardening

This track is the prerequisite for all later authoring, accessory, novel-identity, and animation tracks. Follow `measure/workflow.md` contract-first and preserve a real MCP-capable LLM transcript as an acceptance artifact.

## Phase S1: Expose Complete Current State

_Story ref: spec.md#story-s1_

- [~] Task: Define bounded inspection and semantic comparison contracts
  - [ ] Extend inspection response schemas for current part, connection, pose, variant, render-profile, and active-state values.
  - [ ] Define pagination, truncation, response-budget, and continuation semantics.
  - [ ] Define a field-level revision comparison that reports changed and preserved semantic IDs.
- [ ] Task: Write failing inspection and comparison tests
  - [ ] Cover exact current state after multiple prior revisions rather than reference defaults.
  - [ ] Cover materials, visibility, transforms, connections, poses, variants, pagination, and unknown fields.
  - [ ] Prove read operations do not mutate revisions or expose raw geometry.
- [ ] Task: Implement complete bounded inspection and comparison
  - [ ] Update transport-independent handlers before changing the MCP adapter.
  - [ ] Preserve deterministic ordering and response budgets.
  - [ ] Return actionable issues when requested pages or revision IDs are invalid.
- [ ] Task: Generate inspection documentation and run quality gates
  - [ ] Regenerate tool and architecture facts.
  - [ ] Run focused tests, full tests, coverage, typecheck, lint, generate, doctor, and `pnpm check`.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Expose Complete Current State' (Protocol in workflow.md)

## Phase S2: Publish Honest Capabilities

_Story ref: spec.md#story-s2_

- [ ] Task: Define machine-readable capability and limitation contracts
  - [ ] Represent asset families, templates, operations, outputs, render profiles, and explicit exclusions.
  - [ ] Define supported, partial, unsupported, and not-assessed results with remediation guidance.
  - [ ] Decide whether to extend discovery or add a dedicated bounded read tool and update the public catalog deliberately.
- [ ] Task: Write failing capability consistency tests
  - [ ] Cover current static references, sword/shield, GLB, directional sprites, and revisions as supported.
  - [ ] Cover new identities, unavailable accessories, animation, atlases, unsupported anatomy, and raw mesh as unsupported.
  - [ ] Fail when generated documentation and runtime capability facts drift.
- [ ] Task: Implement capability discovery through domain tools and MCP
  - [ ] Derive facts from registered contracts and kit/output manifests rather than duplicated prose.
  - [ ] Keep responses concise and source-layout independent.
  - [ ] Return actionable limitation guidance without suggesting hidden internal routes.
- [ ] Task: Update product documentation and run quality gates
  - [ ] Update README, product, tech-stack, generated catalogs, and benchmark guidance.
  - [ ] Run contract, MCP, generation, doctor, coverage, type, lint, and full checks.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Publish Honest Capabilities' (Protocol in workflow.md)

## Phase S3: Guide Visual Authoring

_Story ref: spec.md#story-s3_

- [ ] Task: Define the repository-local workflow skill and evidence contract
  - [ ] Create `.agents/skills/fantasy-asset-workflow/SKILL.md` with capability preflight and supported workflow routing.
  - [ ] Define reference files for current capabilities, visual review, evidence reporting, and future animation handoff.
  - [ ] Define a stable final report template with revision, mutation, validation, visual, artifact, and limitation evidence.
- [ ] Task: Create skill eval prompts and objective assertions
  - [ ] Cover localized adventurer revision, static prop creation, unsupported accessory/new identity, and unsupported animation.
  - [ ] Assert inspect-before-mutate, dry run, affected IDs, no source reads, actual-resolution review, and honest blocking.
  - [ ] Save eval inputs and expected outcomes in the skill package.
- [ ] Task: Implement and exercise the skill workflow
  - [ ] Keep creation and mutation inside public MCP tools.
  - [ ] Use browser/image inspection for 3D, contact-sheet, and actual-resolution evidence.
  - [ ] Add audit-only artifact verification scripts without manufacturing or altering product output.
- [ ] Task: Compare skill-guided and baseline runs
  - [ ] Run realistic with-skill and without-skill evals using a capable client.
  - [ ] Generate the standard skill eval viewer and collect qualitative review.
  - [ ] Revise the skill until safety, fidelity review, and limitation reporting are consistently better.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Guide Visual Authoring' (Protocol in workflow.md)

## Phase S4: Prove Reproducible LLM Workflow

_Story ref: spec.md#story-s4_

- [ ] Task: Define clean-clone and external-import acceptance evidence
  - [ ] Require portable committed manifest paths while preserving usable returned artifact paths.
  - [ ] Define chronological LLM transcript, timing, correction, visual, and revision-lineage evidence.
  - [ ] Select and document a representative target importer or record Not Assessed.
- [ ] Task: Write failing portability and workflow acceptance tests
  - [ ] Reproduce tracked manifest churn from a differently rooted clone.
  - [ ] Reproduce stale archived-track output and README/index references.
  - [ ] Assert clean status after reference build and byte-stable semantic artifacts where promised.
- [ ] Task: Repair paths and execute the fresh-LLM workflow
  - [ ] Store portable paths in committed manifests and update archive destinations consistently.
  - [ ] Run the exact seeded authoring request with a fresh MCP-capable LLM and no source access.
  - [ ] Import the final GLB into the selected target and capture scale, orientation, nodes, materials, and errors.
- [ ] Task: Assemble final verification and run all gates
  - [ ] Preserve logs, transcript, screenshots, manifests, GLBs, sprites, semantic comparisons, and clean-status proof.
  - [ ] Run install, check, coverage, build, browser, reference build, generate, doctor, and artifact verification from a clean clone.
  - [ ] Update metadata, lessons learned, and tech debt to match observed reality.
- [ ] Task: Measure - User Manual Verification 'Phase S4: Prove Reproducible LLM Workflow' (Protocol in workflow.md)
