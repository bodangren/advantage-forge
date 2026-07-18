# Specification: Engine Interop Evidence

## Overview

Today the only external import evidence is a Three.js GLTFLoader audit. That proves the GLB contract against exactly one consumer, yet the product promises game-ready output. This track replaces the assumption with direct, reproducible evidence: exported GLBs and sprite atlases are imported by real external toolchains (at minimum a headless glTF validator plus one engine-grade importer such as Godot headless), and the results are committed as auditable artifacts. Any target that cannot be automated on this host is documented as an honest manual-evidence placeholder rather than claimed as passing.

The track deliberately avoids expanding export features. It measures what the current exports already do in foreign runtimes and fixes only contract-level defects the evidence uncovers.

## Prerequisites

- `llm_authoring_workflow_hardening_20260717` is complete (evidence dossier and owner-verification conventions are reused).
- `measure/product.md` and `measure/tech-stack.md` are updated to declare the interop target matrix before implementation begins.

## Stories

### Story S1: Define Interop Target Matrix

**As a** kit maintainer
**I want** an explicit, versioned matrix of external import targets and what "passing" means for each
**So that** compatibility claims are bounded, testable, and never silently overstated.

**Acceptance Criteria:**

- Given the target matrix document, When it is parsed, Then every target declares importer, version, host availability (automatable / manual-only), covered artifact types (GLB, sprite atlas, contact sheet), and pass criteria (load success, scale in meters, material slot survival, texture fidelity, animation presence where applicable).
- Given a target that is not automatable on this host, When evidence is generated, Then the matrix marks it manual-only with an explicit owner-verification procedure instead of an automated claim.
- Given the committed reference assets, When the matrix is applied, Then each reference artifact maps to at least one automated target.

### Story S2: Automated Import Evidence Harness

**As a** game-team integrator
**I want** a deterministic harness that imports committed exports with external toolchains and records the result
**So that** compatibility evidence regenerates byte-for-byte and failures are caught before release.

**Acceptance Criteria:**

- Given a committed GLB export, When the harness runs, Then a headless glTF validator report and at least one engine-grade import log (e.g. Godot `--headless` import) are written to a versioned evidence directory with input digests.
- Given a committed sprite atlas, When the harness runs, Then frame count, dimensions, alpha-channel presence, and pivot/ground-contact metadata are verified against the render profile and recorded.
- Given an import failure or scale/material drift, When the harness completes, Then the run exits non-zero and the evidence names the failing artifact, importer, and contract clause.
- Given a clean clone, When the harness runs, Then it passes without network access or host-specific paths.

### Story S3: Gate Exports on Interop Evidence

**As a** release owner
**I want** export completion criteria to require fresh interop evidence
**So that** "game-ready" always means proven against the declared matrix.

**Acceptance Criteria:**

- Given the doctor/quality-gate suite, When interop evidence is stale or missing, Then the gate fails with an actionable message naming the missing target.
- Given a contract-level defect uncovered by the harness, When it is fixed, Then a regression test reproduces the original failure mode against the fixed export.
- Given the final evidence dossier, When the owner reviews it, Then every matrix target shows either automated pass evidence or an explicit manual-only placeholder.

## Out of Scope

- New export formats, engine plugins, or runtime SDKs.
- Performance benchmarking inside external engines.
- Animated GLB or skeletal content (owned by the animation pipeline track).
