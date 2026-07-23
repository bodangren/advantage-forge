# Implementation Plan: Produce Direct Unity and Godot GLB Import Evidence for Accepted Forge Exports

This track is `[ ]` (new). It produces direct Unity and Godot GLB import evidence for the reload-verified reference GLB set, beyond the pinned Three.js GLTFLoader audit, and refreshes the capability catalog so those engines are no longer Not Assessed. Unity and Godot remain out of scope as backends; they are assessed only as import targets. Because the reference GLBs are mechanically accepted, this assessment is not blocked by the visual acceptance gates. It does not modify `measure/automation-supervisor.py`.

## Phase S1: Define the engine-import evidence contract and harness

_Story ref: spec.md#story-s1-define-the-engine-import-evidence-contract-and-harness_

- [ ] Task: Write failing tests for the per-engine evidence-record schema
  - [ ] Assert the schema validates Pass/Fail/Not-Assessed records with importer version, glTF-validator report, nodes, materials, scale, and bounds.
  - [ ] Assert malformed, partial, or unsigned records are rejected.
- [ ] Task: Implement the versioned evidence contract and engine-neutral harness
  - [ ] Read the reload-verified reference GLBs without mutating them.
  - [ ] Yield an explicit Not-Assessed result when an importer is missing, never an inferred Pass.
- [ ] Task: Write failing tests for glTF-validator report capture
  - [ ] Assert a glTF-validator report is captured per GLB.
- [ ] Task: Implement glTF-validator integration
  - [ ] Run the validator per GLB and store the structured report.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Define the engine-import evidence contract and harness' (Protocol in workflow.md)

## Phase S2: Produce Unity import evidence for the reference GLB set

_Story ref: spec.md#story-s2-produce-unity-import-evidence-for-the-reference-glb-set_

- [ ] Task: Write failing tests asserting Unity evidence records are produced for the reference GLB set
  - [ ] Assert each reference GLB has a Unity report or an explicit Not-Assessed result.
- [ ] Task: Produce Unity importer reports and record findings
  - [ ] Capture importer version, node names, materials, transforms, scale, and bounds per GLB.
- [ ] Task: Write failing tests asserting Unity evidence detects out-of-scope features if present
  - [ ] Assert animations, textures, shaders, skins, cameras, and lights are confirmed absent or flagged.
- [ ] Task: Implement Unity out-of-scope-feature detection
  - [ ] Inspect the imported scene for out-of-scope features and record results.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Produce Unity import evidence for the reference GLB set' (Protocol in workflow.md)

## Phase S3: Produce Godot import evidence for the reference GLB set

_Story ref: spec.md#story-s3-produce-godot-import-evidence-for-the-reference-glb-set_

- [ ] Task: Write failing tests asserting Godot evidence records are produced for the reference GLB set
  - [ ] Assert each reference GLB has a Godot report or an explicit Not-Assessed result.
- [ ] Task: Produce Godot importer reports and record findings
  - [ ] Capture the same dimensions as Unity (nodes, materials, transforms, scale, bounds, out-of-scope features) with importer version metadata.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Produce Godot import evidence for the reference GLB set' (Protocol in workflow.md)

## Phase S4: Refresh capability catalog and tech-debt with assessed results

_Story ref: spec.md#story-s4-refresh-capability-catalog-and-tech-debt-with-assessed-results_

- [ ] Task: Write failing tests asserting the capability catalog reflects assessed Unity and Godot facts
  - [ ] Assert `inspect_capabilities` and the generated catalog report Pass/Fail/Not-Assessed per engine.
- [ ] Task: Update inspect_capabilities, generated catalog, and the tech-debt registry
  - [ ] Replace Not Assessed with assessed facts; update or resolve the Open tech-debt item.
  - [ ] Audit human docs against the generated catalog so they claim no more.
  - [ ] Record the importer-availability fail-closed pattern in lessons learned.
- [ ] Task: Measure - User Manual Verification 'Phase S4: Refresh capability catalog and tech-debt with assessed results' (Protocol in workflow.md)
