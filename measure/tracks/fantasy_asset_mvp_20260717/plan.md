# Implementation Plan: LLM-First Fantasy RPG Asset Foundry MVP

The plan is the execution source of truth. Tasks run sequentially unless a phase explicitly identifies independent test fixtures. Every task follows `measure/workflow.md`: contract first, failing tests, minimum implementation, verification, atomic commit, Git note, and recorded plan SHA.

## Phase S1: Establish Asset Contracts

_Story ref: spec.md#story-s1_

- [x] Task: Define the canonical document and result contracts [commit: d056429]
  - [x] Specify coordinate system, meters, stable ID grammar, schema version, deterministic seed, and canonical key ordering.
  - [x] Define closed Zod schemas for asset, part instance, transform, material binding, pose, render profile, revision, validation issue, and tool result envelopes.
  - [x] Define stable error codes and semantic document-path conventions.
  - [x] Document v1 compatibility and migration behavior before a second schema version exists.
- [x] Task: Write failing contract and revision tests [commit: d056429]
  - [x] Cover valid minimal and representative documents.
  - [x] Reject unknown fields, duplicate IDs, invalid units, non-finite values, unsupported node kinds, and invalid versions.
  - [x] Test canonical serialization stability and unaffected-node byte equivalence after localized patches.
  - [x] Confirm structured errors contain code, path, expected value, actual value, and guidance where applicable.
- [x] Task: Establish the strict TypeScript project scaffold [commit: d056429]
  - [x] Create the pnpm, TypeScript, Vite, Vitest, Playwright, ESLint, Prettier, and dependency-cruiser configuration required by `tech-stack.md`.
  - [x] Create public module roots for contracts, document, geometry, assembly, fantasy-kit, scene, render, export, validation, tools, mcp, and inspector.
  - [x] Configure strict compiler options and non-interactive scripts documented in `workflow.md`.
  - [x] Record exact runtime and dependency versions in `tech-stack.md`.
- [x] Task: Implement canonical document loading and revisions [commit: d056429]
  - [x] Parse and validate JSON before creating domain values.
  - [x] Implement canonical serialization, stable content comparison, revision identifiers, and immutable revision writes inside the active workspace.
  - [x] Implement discriminated semantic patch operations required by later stories without exposing generic arbitrary JSON mutation.
  - [x] Keep filesystem behavior behind a narrow repository interface.
- [x] Task: Implement generated architecture and doctor enforcement [commit: d056429]
  - [x] Create `measure/generate.sh` and the source-aware generator for architecture and tool-route facts.
  - [x] Create `measure/doctor.sh` and package scripts that enforce dependency direction and generated-fact freshness.
  - [x] Regenerate `measure/generated/architecture.json` and `measure/generated/routes.md` from real source.
  - [x] Run formatting, type, lint, unit, coverage, generate, and doctor checks.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Establish Asset Contracts' (Protocol in workflow.md)

## Phase S2: Compile Parts and Assemblies

_Story ref: spec.md#story-s2_

- [x] Task: Define geometry, part, port, assembly, variant, and pose contracts [commit: d056429]
  - [x] Specify the bounded parameter schema for box, beveled box, wedge, prism, cylinder, cone, ellipsoid, capsule, extruded profile, lathed profile, tube path, and flat card.
  - [x] Define indexed geometry output, bounds, normals, material groups, and semantic scene-summary contracts without leaking Three.js types into `contracts`.
  - [x] Define port frames, compatibility tags, cardinality, joints, mirroring, parent-child ownership, variants, and pose overrides.
  - [x] Document parameter bounds and unsupported degenerate geometry.
- [x] Task: Write failing procedural geometry tests [commit: d056429]
  - [x] Test every generator at minimum, representative, and maximum supported parameters.
  - [x] Assert finite positions and normals, valid indices, winding, bounds, triangle counts, and deterministic output.
  - [x] Add property-oriented cases for invalid dimensions, segment counts, profiles, and paths.
  - [x] Prove no generator requires Boolean operations or ambient randomness.
- [x] Task: Implement the bounded procedural shape generators [commit: d056429]
  - [x] Build generators as pure functions from validated contracts to engine-neutral indexed geometry.
  - [x] Add deterministic normal and bounds calculation.
  - [x] Preserve material groups and semantic generator metadata.
  - [x] Keep Three.js conversion in the scene adapter rather than geometry code.
- [x] Task: Write failing assembly and port-resolution tests [commit: d056429]
  - [x] Cover valid connection transforms, incompatible ports, occupied ports, cycles, missing targets, and duplicate IDs.
  - [x] Cover mirrored subassemblies and explicit handedness behavior.
  - [x] Cover rigid-joint limits, pose composition, variant overrides, and preservation of unrelated parts.
  - [x] Assert stable scene summaries for repeated evaluation.
- [x] Task: Implement part, port, and assembly evaluation [commit: d056429]
  - [x] Instantiate templates into stable part instances.
  - [x] Resolve port connections and parent-child transforms with cycle detection.
  - [x] Implement mirroring, parameter variants, rigid joints, and named pose overlays.
  - [x] Produce a canonical semantic scene summary containing parts, transforms, bounds, materials, and triangle counts.
- [x] Task: Generate architecture facts and run phase quality gates [commit: d056429]
  - [x] Regenerate module and route documentation.
  - [x] Run focused geometry and assembly tests, full unit tests, coverage, type checking, linting, and doctor.
  - [x] Confirm domain modules remain free of browser, MCP, and filesystem dependencies.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Compile Parts and Assemblies' (Protocol in workflow.md)

## Phase S3: Author Rustic Fantasy Kit

_Story ref: spec.md#story-s3_

- [x] Task: Define fantasy-kit manifests and style contracts [commit: d056429]
  - [x] Define template manifest, semantic-role taxonomy, port compatibility vocabulary, parameter preset, palette, and material-family schemas.
  - [x] Commit the single rustic-human style profile and fixed MVP material families.
  - [x] Define manifest requirements for intended references and supported variants.
- [x] Task: Write failing kit contract and reference tests [commit: d056429]
  - [x] Reject unknown generators, material families, ports, parameter names, and out-of-bound presets.
  - [x] Assert every template declares role, material slots, ports, parameter bounds, and reference uses.
  - [x] Test that kit documents contain data and composition only, with no alternate geometry execution path.
- [x] Task: Implement humanoid and equipment templates [commit: d056429]
  - [x] Define rigid head, torso, pelvis, upper/lower limbs, hands, feet, hair mass, clothing shell, and equipment attachment templates.
  - [x] Define sword and shield component assemblies using the shared shape grammar.
  - [x] Define short, tall, broad, and slender presets plus two initial poses.
  - [x] Build equipped and unequipped adventurer documents without engine-code conditionals.
- [x] Task: Implement prop, vegetation, structure, and palette templates [commit: d056429]
  - [x] Define the crate assembly.
  - [x] Define trunk, branch, root, and foliage-cluster templates plus one tree assembly.
  - [x] Define wall, timber, door, window, roof, and chimney modules plus one cottage assembly.
  - [x] Bind all references to the rustic palette and MVP material families.
- [x] Task: Generate kit documentation and run phase quality gates [commit: d056429]
  - [x] Generate a human-readable template, port, preset, and palette catalog from kit manifests.
  - [x] Build and validate all reference variants through the semantic scene-summary stage.
  - [x] Run contract, kit, assembly, coverage, type, lint, generate, and doctor checks.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Author Rustic Fantasy Kit' (Protocol in workflow.md)

## Phase S4: Expose LLM Domain Tools

_Story ref: spec.md#story-s4_

- [x] Task: Define the public domain tool catalog [commit: d056429]
  - [x] Specify schemas for list kits, inspect template, inspect asset, create asset, apply operations, connect parts, set pose, validate asset, render preview, and export asset.
  - [x] Define bounded response budgets and semantic summaries that exclude anonymous mesh payloads.
  - [x] Define mutation preconditions, current-revision checks, dry-run behavior, and structured patch summaries.
- [x] Task: Write failing tool-handler tests [commit: d056429]
  - [x] Cover discovery with no prior context and concise template examples.
  - [x] Cover valid create, parameter edit, connect, material, equipment, and pose operations.
  - [x] Reject stale revisions, invalid operations, overly broad payloads, and unsupported capabilities without mutation.
  - [x] Assert byte-equivalent canonical serialization for unaffected nodes after local changes.
- [x] Task: Implement inspection and mutation handlers [commit: d056429]
  - [x] Implement transport-agnostic handlers over contracts, document revisions, assemblies, and kit catalogs.
  - [x] Return affected IDs, revision identifiers, structured summaries, validation status, and actionable failures.
  - [x] Add dry-run evaluation for proposed mutations.
  - [x] Enforce output-size limits and omit raw indexed geometry.
- [x] Task: Define and test render, validation, and export service ports [commit: d056429]
  - [x] Define domain-facing interfaces that tool handlers can call before the concrete renderer and exporter exist.
  - [x] Use deterministic fakes to test orchestration, error propagation, and revision association.
  - [x] Prevent adapters from bypassing domain validation.
- [x] Task: Implement the thin local MCP adapter [commit: d056429]
  - [x] Register the approved tool catalog using the MCP TypeScript SDK.
  - [x] Translate MCP payloads and responses without duplicating domain logic.
  - [x] Restrict project and output paths to the active workspace.
  - [x] Verify the advertised catalog contains no arbitrary code, shell, unrestricted filesystem, UI automation, raw mesh, or network-retrieval tool.
- [x] Task: Generate tool facts and run phase quality gates [commit: d056429]
  - [x] Regenerate the public tool catalog and architecture facts.
  - [x] Run handler, MCP adapter, security-boundary, coverage, type, lint, generate, and doctor checks.
  - [x] Exercise the server with an MCP inspector or protocol-level integration fixture.
- [ ] Task: Measure - User Manual Verification 'Phase S4: Expose LLM Domain Tools' (Protocol in workflow.md)

## Phase S5: Render and Export Assets

_Story ref: spec.md#story-s5_

- [x] Task: Define scene, render, pixel-metric, and GLB contracts [commit: d056429]
  - [x] Define engine-neutral scene input and Three.js adapter boundaries.
  - [x] Fix the MVP orthographic camera elevation, direction order, lighting, transparent background, 128x128 frame, padding, and ground-anchor rules.
  - [x] Define contact-sheet metadata, pixel validation issues, and GLB export manifest.
  - [x] Document pinned-reference versus cross-hardware render acceptance.
- [x] Task: Write failing scene and camera-rig tests [commit: d056429]
  - [x] Assert semantic parts become named scene nodes with correct transforms, materials, bounds, and visibility.
  - [x] Assert one-, four-, and eight-direction camera order and framing.
  - [x] Test stable ground-anchor and padding calculations across reference variants and poses.
- [x] Task: Implement the Three.js scene compiler and inspector [commit: d056429]
  - [x] Convert engine-neutral indexed geometry into Three.js buffer geometry only at the adapter boundary.
  - [x] Build palette materials, named node hierarchy, lights, cameras, bounds, and optional port overlays.
  - [x] Build the minimal vanilla-TypeScript inspector with 3D, contact-sheet, actual-size, and comparison modes.
  - [x] Display revision, validation, triangle, bounds, and selected-part evidence beside the canvas.
- [x] Task: Write failing browser sprite and pixel-analysis tests [commit: d056429]
  - [x] Test transparent frame dimensions, direction labels, contact-sheet layout, and deterministic metadata.
  - [x] Test occupied bounds, clipping, ground-anchor deviation, transparency, and minimum silhouette width.
  - [x] Add pinned reference-environment fixtures without treating cross-GPU pixel differences as semantic failures.
- [x] Task: Implement sprite rendering and contact sheets [commit: d056429]
  - [x] Render through fixed Three.js render targets at delivery resolution.
  - [x] Generate one-, four-, and eight-direction PNG frames and labeled contact sheets.
  - [x] Preserve actual-resolution nearest-neighbor inspection and transparent backgrounds.
  - [x] Associate outputs with asset and revision manifests.
- [x] Task: Implement pixel validation and GLB export [commit: d056429]
  - [x] Calculate the committed pixel metrics and return structured validation issues.
  - [x] Export binary glTF using named nodes, MVP materials, transforms, and meters.
  - [x] Reload exported GLBs in tests and reject unsupported content.
  - [x] Keep output paths inside the active workspace and use collision-safe revision directories.
- [x] Task: Wire concrete services into domain tools [commit: d056429]
  - [x] Connect render preview, validate asset, and export asset handlers to the implemented services.
  - [x] Add protocol-level success and failure integration tests.
  - [x] Confirm the inspector and tool outputs evaluate the same canonical revision.
- [x] Task: Generate output documentation and run phase quality gates [commit: d056429]
  - [x] Generate camera, sprite-layout, validation-rule, tool, and export documentation.
  - [x] Run unit, coverage, browser, GLB reload, type, lint, generate, and doctor checks.
  - [x] Produce reference previews for manual verification without approving them automatically.
- [ ] Task: Measure - User Manual Verification 'Phase S5: Render and Export Assets' (Protocol in workflow.md)

## Phase S6: Verify Reference Vertical Slice

_Story ref: spec.md#story-s6_

- [x] Task: Define the reference workflow and evidence manifest [commit: d056429]
  - [x] Specify the exact clean-checkout commands, MCP requests, expected revisions, reference documents, outputs, metrics, and manual review points.
  - [x] Define pass/fail evidence for the adventurer, crate, tree, and cottage.
  - [x] Define the final scope audit against product exclusions and tool catalog.
- [x] Task: Write failing end-to-end acceptance tests [commit: d056429]
  - [x] Cover create, inspect, localized proportion patch, equipment, pose, validate, render, and export for the adventurer.
  - [x] Cover shared-engine builds for crate, tree, and cottage.
  - [x] Prove invalid and out-of-scope requests do not mutate the active revision or expose hidden capabilities.
- [x] Task: Create committed reference documents and runner [commit: d056429]
  - [x] Commit the canonical rustic adventurer, crate, tree, and cottage documents with fixed seeds.
  - [x] Implement a non-interactive reference-build runner using only public domain handlers.
  - [x] Produce revision manifests, semantic scene summaries, contact sheets, PNG frames, GLBs, and validation reports.
- [x] Task: Execute the complete automated acceptance suite [commit: d056429]
  - [x] Run a clean install followed by `pnpm check`, browser tests, reference builds, and GLB reload verification.
  - [x] Confirm coverage exceeds 80% and generated facts are clean.
  - [x] Resolve failures without adding capabilities outside the specification.
- [x] Task: Audit product scope and architectural center mass [commit: d056429]
  - [x] Compare dependencies, public tools, generators, templates, and adapters to `product.md`, `tech-stack.md`, and the specification exclusions.
  - [x] Remove unused or speculative capabilities discovered during the audit.
  - [x] Record justified deferrals in `tech-debt.md` or a subsequent proposed track rather than expanding this track.
- [x] Task: Assemble the final verification dossier [commit: d056429]
  - [x] Link commands, test results, coverage, architecture facts, tool catalog, validation reports, GLB manifests, and visual outputs.
  - [x] Prepare actual-resolution and enlarged contact sheets for explicit user review.
  - [x] Update metadata with actual task count and deviation notes before closeout.
- [x] Task: Generate final facts and run doctor [commit: d056429]
  - [x] Regenerate architecture, routes, tool catalog, template catalog, and output-contract documentation.
  - [x] Run the final non-interactive doctor and prove no generated files are stale.
- [ ] Task: Measure - User Manual Verification 'Phase S6: Verify Reference Vertical Slice' (Protocol in workflow.md)

## Phase: Review Fixes

- [x] Task: Apply review suggestions 8772846

## Phase: Owner Evidence Review Fixes

- [x] Task: Regenerate clean owner-review evidence c317ad8
