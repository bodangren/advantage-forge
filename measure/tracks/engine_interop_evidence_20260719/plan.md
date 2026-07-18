# Implementation Plan: Engine Interop Evidence

Prerequisite: `llm_authoring_workflow_hardening_20260717` (complete). Reuse its evidence-dossier and owner-verification conventions. Every phase writes failing tests before implementation.

## Phase S1: Define Interop Target Matrix

_Story ref: spec.md#story-s1_

- [ ] Task: Draft the interop target matrix contract
  - [ ] Enumerate candidate importers (glTF validator, Godot headless, Unity batch importer, sprite consumers) and probe host availability without installing anything globally.
  - [ ] Define pass criteria per target: load success, meter scale, material slot survival, texture fidelity, animation presence where applicable.
  - [ ] Define the manual-only placeholder format for non-automatable targets, including the owner verification procedure.
- [ ] Task: Write failing matrix schema and coverage tests
  - [ ] Reject targets missing importer, version, availability class, or pass criteria.
  - [ ] Assert every committed reference artifact maps to at least one automated target.
  - [ ] Assert manual-only targets can never be reported as automated passes.
- [ ] Task: Commit the matrix and update product docs
  - [ ] Serialize the matrix as a versioned, digested document consumed by the harness.
  - [ ] Update `measure/product.md` and `measure/tech-stack.md` to declare the matrix before harness work begins.

## Phase S2: Automated Import Evidence Harness

_Story ref: spec.md#story-s2_

- [ ] Task: Write failing harness contract tests
  - [ ] Cover GLB validation evidence layout, input digest binding, and non-zero exit on import failure.
  - [ ] Cover sprite atlas checks: frame count, dimensions, alpha presence, pivot/ground-contact metadata vs render profile.
  - [ ] Cover clean-clone determinism: no network, no host-specific absolute paths.
- [ ] Task: Implement the GLB import evidence path
  - [ ] Run a headless glTF validator over committed exports and persist reports with input digests.
  - [ ] Add one engine-grade import log (Godot `--headless` if available; otherwise the honest manual-only placeholder from S1).
- [ ] Task: Implement the sprite atlas evidence path
  - [ ] Decode committed atlases and verify frame geometry and alpha against the render profile.
  - [ ] Record per-artifact verdicts naming artifact, importer, and contract clause on failure.
- [ ] Task: Prove clean-clone determinism
  - [ ] Run the harness twice in a fresh clone and diff evidence byte-for-byte, excluding timestamps declared in the matrix.

## Phase S3: Gate Exports on Interop Evidence

_Story ref: spec.md#story-s3_

- [ ] Task: Write failing gate tests
  - [ ] Doctor/quality gate fails when evidence is missing, stale, or digest-mismatched, with an actionable message.
  - [ ] Regression test reproduces any contract-level defect uncovered in S2 against the fixed export.
- [ ] Task: Wire the gate into the existing check suite
  - [ ] Add the interop evidence freshness check to doctor and the run-full-checks path.
  - [ ] Keep the gate skippable only through the matrix's explicit manual-only mechanism.
- [ ] Task: Produce the final evidence dossier and owner verification
  - [ ] Assemble per-target automated evidence or manual-only placeholders for every matrix row.
  - [ ] Record the six-step-style owner verification procedure in the track's verification document.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Gate Exports on Interop Evidence' (Protocol in workflow.md)
