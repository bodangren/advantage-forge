# Implementation Plan: LLM-First Fantasy RPG Asset Foundry MVP

The plan is the execution source of truth. Tasks run sequentially unless a phase explicitly identifies independent test fixtures. Every task follows `measure/workflow.md`: contract first, failing tests, minimum implementation, verification, atomic commit, Git note, and recorded plan SHA.

## Phase S1: Establish Asset Contracts
_Story ref: spec.md#story-s1_

- [ ] Task: Define the canonical document and result contracts
  - [ ] Specify coordinate system, meters, stable ID grammar, schema version, deterministic seed, and canonical key ordering.
  - [ ] Define closed Zod schemas for asset, part instance, transform, material binding, pose, render profile, revision, validation issue, and tool result envelopes.
  - [ ] Define stable error codes and semantic document-path conventions.
  - [ ] Document v1 compatibility and migration behavior before a second schema version exists.
- [ ] Task: Write failing contract and revision tests
  - [ ] Cover valid minimal and representative documents.
  - [ ] Reject unknown fields, duplicate IDs, invalid units, non-finite values, unsupported node kinds, and invalid versions.
  - [ ] Test canonical serialization stability and unaffected-node byte equivalence after localized patches.
  - [ ] Confirm structured errors contain code, path, expected value, actual value, and guidance where applicable.
- [ ] Task: Establish the strict TypeScript project scaffold
  - [ ] Create the pnpm, TypeScript, Vite, Vitest, Playwright, ESLint, Prettier, and dependency-cruiser configuration required by `tech-stack.md`.
  - [ ] Create public module roots for contracts, document, geometry, assembly, fantasy-kit, scene, render, export, validation, tools, mcp, and inspector.
  - [ ] Configure strict compiler options and non-interactive scripts documented in `workflow.md`.
  - [ ] Record exact runtime and dependency versions in `tech-stack.md`.
- [ ] Task: Implement canonical document loading and revisions
  - [ ] Parse and validate JSON before creating domain values.
  - [ ] Implement canonical serialization, stable content comparison, revision identifiers, and immutable revision writes inside the active workspace.
  - [ ] Implement discriminated semantic patch operations required by later stories without exposing generic arbitrary JSON mutation.
  - [ ] Keep filesystem behavior behind a narrow repository interface.
- [ ] Task: Implement generated architecture and doctor enforcement
  - [ ] Create `measure/generate.sh` and the source-aware generator for architecture and tool-route facts.
  - [ ] Create `measure/doctor.sh` and package scripts that enforce dependency direction and generated-fact freshness.
  - [ ] Regenerate `measure/generated/architecture.json` and `measure/generated/routes.md` from real source.
  - [ ] Run formatting, type, lint, unit, coverage, generate, and doctor checks.
- [ ] Task: Measure - User Manual Verification 'Phase S1: Establish Asset Contracts' (Protocol in workflow.md)

## Phase S2: Compile Parts and Assemblies
_Story ref: spec.md#story-s2_

- [ ] Task: Define geometry, part, port, assembly, variant, and pose contracts
  - [ ] Specify the bounded parameter schema for box, beveled box, wedge, prism, cylinder, cone, ellipsoid, capsule, extruded profile, lathed profile, tube path, and flat card.
  - [ ] Define indexed geometry output, bounds, normals, material groups, and semantic scene-summary contracts without leaking Three.js types into `contracts`.
  - [ ] Define port frames, compatibility tags, cardinality, joints, mirroring, parent-child ownership, variants, and pose overrides.
  - [ ] Document parameter bounds and unsupported degenerate geometry.
- [ ] Task: Write failing procedural geometry tests
  - [ ] Test every generator at minimum, representative, and maximum supported parameters.
  - [ ] Assert finite positions and normals, valid indices, winding, bounds, triangle counts, and deterministic output.
  - [ ] Add property-oriented cases for invalid dimensions, segment counts, profiles, and paths.
  - [ ] Prove no generator requires Boolean operations or ambient randomness.
- [ ] Task: Implement the bounded procedural shape generators
  - [ ] Build generators as pure functions from validated contracts to engine-neutral indexed geometry.
  - [ ] Add deterministic normal and bounds calculation.
  - [ ] Preserve material groups and semantic generator metadata.
  - [ ] Keep Three.js conversion in the scene adapter rather than geometry code.
- [ ] Task: Write failing assembly and port-resolution tests
  - [ ] Cover valid connection transforms, incompatible ports, occupied ports, cycles, missing targets, and duplicate IDs.
  - [ ] Cover mirrored subassemblies and explicit handedness behavior.
  - [ ] Cover rigid-joint limits, pose composition, variant overrides, and preservation of unrelated parts.
  - [ ] Assert stable scene summaries for repeated evaluation.
- [ ] Task: Implement part, port, and assembly evaluation
  - [ ] Instantiate templates into stable part instances.
  - [ ] Resolve port connections and parent-child transforms with cycle detection.
  - [ ] Implement mirroring, parameter variants, rigid joints, and named pose overlays.
  - [ ] Produce a canonical semantic scene summary containing parts, transforms, bounds, materials, and triangle counts.
- [ ] Task: Generate architecture facts and run phase quality gates
  - [ ] Regenerate module and route documentation.
  - [ ] Run focused geometry and assembly tests, full unit tests, coverage, type checking, linting, and doctor.
  - [ ] Confirm domain modules remain free of browser, MCP, and filesystem dependencies.
- [ ] Task: Measure - User Manual Verification 'Phase S2: Compile Parts and Assemblies' (Protocol in workflow.md)

## Phase S3: Author Rustic Fantasy Kit
_Story ref: spec.md#story-s3_

- [ ] Task: Define fantasy-kit manifests and style contracts
  - [ ] Define template manifest, semantic-role taxonomy, port compatibility vocabulary, parameter preset, palette, and material-family schemas.
  - [ ] Commit the single rustic-human style profile and fixed MVP material families.
  - [ ] Define manifest requirements for intended references and supported variants.
- [ ] Task: Write failing kit contract and reference tests
  - [ ] Reject unknown generators, material families, ports, parameter names, and out-of-bound presets.
  - [ ] Assert every template declares role, material slots, ports, parameter bounds, and reference uses.
  - [ ] Test that kit documents contain data and composition only, with no alternate geometry execution path.
- [ ] Task: Implement humanoid and equipment templates
  - [ ] Define rigid head, torso, pelvis, upper/lower limbs, hands, feet, hair mass, clothing shell, and equipment attachment templates.
  - [ ] Define sword and shield component assemblies using the shared shape grammar.
  - [ ] Define short, tall, broad, and slender presets plus two initial poses.
  - [ ] Build equipped and unequipped adventurer documents without engine-code conditionals.
- [ ] Task: Implement prop, vegetation, structure, and palette templates
  - [ ] Define the crate assembly.
  - [ ] Define trunk, branch, root, and foliage-cluster templates plus one tree assembly.
  - [ ] Define wall, timber, door, window, roof, and chimney modules plus one cottage assembly.
  - [ ] Bind all references to the rustic palette and MVP material families.
- [ ] Task: Generate kit documentation and run phase quality gates
  - [ ] Generate a human-readable template, port, preset, and palette catalog from kit manifests.
  - [ ] Build and validate all reference variants through the semantic scene-summary stage.
  - [ ] Run contract, kit, assembly, coverage, type, lint, generate, and doctor checks.
- [ ] Task: Measure - User Manual Verification 'Phase S3: Author Rustic Fantasy Kit' (Protocol in workflow.md)

## Phase S4: Expose LLM Domain Tools
_Story ref: spec.md#story-s4_

- [ ] Task: Define the public domain tool catalog
  - [ ] Specify schemas for list kits, inspect template, inspect asset, create asset, apply operations, connect parts, set pose, validate asset, render preview, and export asset.
  - [ ] Define bounded response budgets and semantic summaries that exclude anonymous mesh payloads.
  - [ ] Define mutation preconditions, current-revision checks, dry-run behavior, and structured patch summaries.
- [ ] Task: Write failing tool-handler tests
  - [ ] Cover discovery with no prior context and concise template examples.
  - [ ] Cover valid create, parameter edit, connect, material, equipment, and pose operations.
  - [ ] Reject stale revisions, invalid operations, overly broad payloads, and unsupported capabilities without mutation.
  - [ ] Assert byte-equivalent canonical serialization for unaffected nodes after local changes.
- [ ] Task: Implement inspection and mutation handlers
  - [ ] Implement transport-agnostic handlers over contracts, document revisions, assemblies, and kit catalogs.
  - [ ] Return affected IDs, revision identifiers, structured summaries, validation status, and actionable failures.
  - [ ] Add dry-run evaluation for proposed mutations.
  - [ ] Enforce output-size limits and omit raw indexed geometry.
- [ ] Task: Define and test render, validation, and export service ports
  - [ ] Define domain-facing interfaces that tool handlers can call before the concrete renderer and exporter exist.
  - [ ] Use deterministic fakes to test orchestration, error propagation, and revision association.
  - [ ] Prevent adapters from bypassing domain validation.
- [ ] Task: Implement the thin local MCP adapter
  - [ ] Register the approved tool catalog using the MCP TypeScript SDK.
  - [ ] Translate MCP payloads and responses without duplicating domain logic.
  - [ ] Restrict project and output paths to the active workspace.
  - [ ] Verify the advertised catalog contains no arbitrary code, shell, unrestricted filesystem, UI automation, raw mesh, or network-retrieval tool.
- [ ] Task: Generate tool facts and run phase quality gates
  - [ ] Regenerate the public tool catalog and architecture facts.
  - [ ] Run handler, MCP adapter, security-boundary, coverage, type, lint, generate, and doctor checks.
  - [ ] Exercise the server with an MCP inspector or protocol-level integration fixture.
- [ ] Task: Measure - User Manual Verification 'Phase S4: Expose LLM Domain Tools' (Protocol in workflow.md)

## Phase S5: Render and Export Assets
_Story ref: spec.md#story-s5_

- [ ] Task: Define scene, render, pixel-metric, and GLB contracts
  - [ ] Define engine-neutral scene input and Three.js adapter boundaries.
  - [ ] Fix the MVP orthographic camera elevation, direction order, lighting, transparent background, 128x128 frame, padding, and ground-anchor rules.
  - [ ] Define contact-sheet metadata, pixel validation issues, and GLB export manifest.
  - [ ] Document pinned-reference versus cross-hardware render acceptance.
- [ ] Task: Write failing scene and camera-rig tests
  - [ ] Assert semantic parts become named scene nodes with correct transforms, materials, bounds, and visibility.
  - [ ] Assert one-, four-, and eight-direction camera order and framing.
  - [ ] Test stable ground-anchor and padding calculations across reference variants and poses.
- [ ] Task: Implement the Three.js scene compiler and inspector
  - [ ] Convert engine-neutral indexed geometry into Three.js buffer geometry only at the adapter boundary.
  - [ ] Build palette materials, named node hierarchy, lights, cameras, bounds, and optional port overlays.
  - [ ] Build the minimal vanilla-TypeScript inspector with 3D, contact-sheet, actual-size, and comparison modes.
  - [ ] Display revision, validation, triangle, bounds, and selected-part evidence beside the canvas.
- [ ] Task: Write failing browser sprite and pixel-analysis tests
  - [ ] Test transparent frame dimensions, direction labels, contact-sheet layout, and deterministic metadata.
  - [ ] Test occupied bounds, clipping, ground-anchor deviation, transparency, and minimum silhouette width.
  - [ ] Add pinned reference-environment fixtures without treating cross-GPU pixel differences as semantic failures.
- [ ] Task: Implement sprite rendering and contact sheets
  - [ ] Render through fixed Three.js render targets at delivery resolution.
  - [ ] Generate one-, four-, and eight-direction PNG frames and labeled contact sheets.
  - [ ] Preserve actual-resolution nearest-neighbor inspection and transparent backgrounds.
  - [ ] Associate outputs with asset and revision manifests.
- [ ] Task: Implement pixel validation and GLB export
  - [ ] Calculate the committed pixel metrics and return structured validation issues.
  - [ ] Export binary glTF using named nodes, MVP materials, transforms, and meters.
  - [ ] Reload exported GLBs in tests and reject unsupported content.
  - [ ] Keep output paths inside the active workspace and use collision-safe revision directories.
- [ ] Task: Wire concrete services into domain tools
  - [ ] Connect render preview, validate asset, and export asset handlers to the implemented services.
  - [ ] Add protocol-level success and failure integration tests.
  - [ ] Confirm the inspector and tool outputs evaluate the same canonical revision.
- [ ] Task: Generate output documentation and run phase quality gates
  - [ ] Generate camera, sprite-layout, validation-rule, tool, and export documentation.
  - [ ] Run unit, coverage, browser, GLB reload, type, lint, generate, and doctor checks.
  - [ ] Produce reference previews for manual verification without approving them automatically.
- [ ] Task: Measure - User Manual Verification 'Phase S5: Render and Export Assets' (Protocol in workflow.md)

## Phase S6: Verify Reference Vertical Slice
_Story ref: spec.md#story-s6_

- [ ] Task: Define the reference workflow and evidence manifest
  - [ ] Specify the exact clean-checkout commands, MCP requests, expected revisions, reference documents, outputs, metrics, and manual review points.
  - [ ] Define pass/fail evidence for the adventurer, crate, tree, and cottage.
  - [ ] Define the final scope audit against product exclusions and tool catalog.
- [ ] Task: Write failing end-to-end acceptance tests
  - [ ] Cover create, inspect, localized proportion patch, equipment, pose, validate, render, and export for the adventurer.
  - [ ] Cover shared-engine builds for crate, tree, and cottage.
  - [ ] Prove invalid and out-of-scope requests do not mutate the active revision or expose hidden capabilities.
- [ ] Task: Create committed reference documents and runner
  - [ ] Commit the canonical rustic adventurer, crate, tree, and cottage documents with fixed seeds.
  - [ ] Implement a non-interactive reference-build runner using only public domain handlers.
  - [ ] Produce revision manifests, semantic scene summaries, contact sheets, PNG frames, GLBs, and validation reports.
- [ ] Task: Execute the complete automated acceptance suite
  - [ ] Run a clean install followed by `pnpm check`, browser tests, reference builds, and GLB reload verification.
  - [ ] Confirm coverage exceeds 80% and generated facts are clean.
  - [ ] Resolve failures without adding capabilities outside the specification.
- [ ] Task: Audit product scope and architectural center mass
  - [ ] Compare dependencies, public tools, generators, templates, and adapters to `product.md`, `tech-stack.md`, and the specification exclusions.
  - [ ] Remove unused or speculative capabilities discovered during the audit.
  - [ ] Record justified deferrals in `tech-debt.md` or a subsequent proposed track rather than expanding this track.
- [ ] Task: Assemble the final verification dossier
  - [ ] Link commands, test results, coverage, architecture facts, tool catalog, validation reports, GLB manifests, and visual outputs.
  - [ ] Prepare actual-resolution and enlarged contact sheets for explicit user review.
  - [ ] Update metadata with actual task count and deviation notes before closeout.
- [ ] Task: Generate final facts and run doctor
  - [ ] Regenerate architecture, routes, tool catalog, template catalog, and output-contract documentation.
  - [ ] Run the final non-interactive doctor and prove no generated files are stale.
- [ ] Task: Measure - User Manual Verification 'Phase S6: Verify Reference Vertical Slice' (Protocol in workflow.md)
