# Phase S3 Workflow Exercise

Date: 2026-07-18

This exercise checks the workflow's read-only artifact and visual-review gates.
It does not claim to be the fresh MCP-capable LLM acceptance run reserved for
Phase S4, and it does not mutate any canonical asset or product output.

## Audit-only artifact verification

The skill verifier was run against the committed crate artifact pair for
`crate.rustic` revision
`revision.e6b20ae75d9fd1b178818358520ab2c1c2ce07853f5f245fdce5d89ab99b41d6`.

Result: pass.

- The render and GLB manifests named the expected asset and revision.
- All eight N, NE, E, SE, S, SW, W, and NW frames were present, PNG-identified,
  and physically 128x128.
- Every frame reported no clipped edge and zero ground-anchor deviation.
- The 512x292 contact sheet and reload-checked 11,400-byte GLB were present.
- The GLB header, byte length, meter unit, material/bounds reload checks, and
  zero unsupported-content counts passed.
- The verifier emitted SHA-256 evidence for eight frames, the contact sheet, and
  the GLB while writing no file.

## Browser exercise

The preferred `browser-harness` route could not start because its installed
entrypoint failed with `ModuleNotFoundError: No module named 'run'`. The exercise
therefore used the repository-pinned Playwright Chromium dependency against the
local Vite inspector. This fallback and its screenshots are explicit evidence,
not a claim that the harness worked.

The inspector loaded `adventurer.rustic` revision
`revision.8044813bcf514c8bea35331db437de0e5c1a2c7961e7b87ddc9a635b493b355b`
with 19 semantic parts and 1,440 triangles. No browser console error occurred.

### Interactive 3D

Evidence: [faf-s3-3d.png](faf-s3-3d.png)

- The complete static adventurer loaded with ground contact, separated limbs,
  equipped sword/shield, semantic evidence, and pixel metrics visible.
- The broad orange shield dominates the equipment silhouette. The sword is a
  thin vertical element and is visually subordinate even in the 3D view.

### Contact sheet

Evidence: [faf-s3-contact.png](faf-s3-contact.png)

- Eight labeled directions rendered in a stable four-column by two-row layout.
- All frames remained inside their cells with consistent ground and framing.
- The character body remains recognizable, but the sword becomes narrow or
  overlaps the body in several directions; edge-on E/W equipment readability is
  particularly weak.

### Actual 128x128

Evidence: [faf-s3-actual.png](faf-s3-actual.png)

- All eight canvases had both logical and CSS dimensions of exactly 128x128.
- Mechanical metrics reported no clipping, zero ground-anchor deviation, and
  passing torso feature widths (9-18 pixels against a 3-pixel minimum).
- Native-size inspection still found inconsistent sword readability. This is a
  real visual limitation that the torso-focused pixel metric does not capture.

## Verdict

- Workflow mechanics: pass. The skill now requires capability preflight,
  inspect-before-mutate, dry run, revision comparison, validation, artifact
  hashing, and three-surface visual review.
- Artifact verifier: pass for the committed crate evidence set.
- Baseline adventurer visual fidelity: partial for equipment readability. The
  character is unclipped and consistently framed, but the sword is not reliably
  legible at native size in every direction.
- No corrective adventurer revision was made in this exercise because Phase S3
  is testing workflow guidance and evidence gates; a real MCP-led correction and
  its complete revision lineage belong to the Phase S4 acceptance run.
