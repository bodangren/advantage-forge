# Tech Stack

## Decision Summary

The MVP is a strict TypeScript application with a shared deterministic asset engine, a local LLM tool adapter, and a browser renderer/inspector. Forge is the semantic 3D/raster producer; Pixel Art Generator is the named downstream educational-app pack assembler. Blender and all general-purpose DCC or game-engine runtimes are explicitly excluded.

## Runtime and Language

- **TypeScript 6.0.2, strict mode:** Shared contracts across documents, tools, geometry, rendering, validation, and export.
- **Node.js 22.22.2 or newer in the Node 22-24 range:** Local tool server, filesystem project storage, deterministic builds, tests, and CLI workflows.
- **Browser WebGL:** Interactive inspection and sprite rendering through the same scene compiler used by exports.
- **pnpm 11.8.0:** Dependency management and reproducible scripts.

## Core Libraries

- **Zod 4.4.3:** Closed runtime schemas for versioned asset documents and domain tool inputs/outputs.
- **Three.js 0.185.1:** Scene graph, constrained geometry output, materials, orthographic cameras, renderer targets, and GLB export/reload.
- **Model Context Protocol TypeScript SDK 1.29.0:** Thin local adapter exposing the project-owned domain tools. MCP is transport, not the asset model or engine.
- **Vite 8.1.4:** Minimal vanilla-TypeScript inspector application and development server. React is intentionally excluded from the MVP.

## Testing and Quality

- **Vitest 4.1.10:** Unit and contract tests for schemas, generators, port resolution, transforms, variants, and validation.
- **Playwright 1.61.1:** Browser rendering integration tests and deterministic reference workflow checks.
- **PNG pixel analysis utilities:** Project-owned checks for transparency, frame occupancy, ground anchor, silhouette width, and contact-sheet layout.
- **ESLint 10.7.0 and dependency-cruiser 18.1.0:** Code quality and enforceable module boundaries.
- **Prettier 3.9.5:** Mechanical formatting only.

## Storage and Formats

- **JSON:** Canonical asset, part-template, style, pose, and render-profile documents. JSON is selected over YAML so runtime schemas and tool payloads share one representation.
- **GLB/glTF 2.0:** The only MVP 3D delivery format.
- **PNG:** Transparent sprite frames and contact sheets.
- **Local filesystem:** Projects, revisions, previews, and exports. No database, authentication, hosted service, or cloud storage in the MVP.

## Public Interchange Boundary

- `forge-asset-interchange-manifest/v1` is the technically accepted static shared base contract. It is a closed Zod schema with canonical serialization and a SHA-256 digest pin; portable records include artifact digests, source revisions, profile ID/version, dimensions/media type, roles, and evidence references.
- `forge-temporal-render-artifacts/v1` is the mechanically implemented single-clip public temporal contract. It binds individual transparent 128x128 source frames, Forge-derived atlas metadata/bytes, exact source GLB, immutable asset/morphology/rig/equipment/clip/frame-plan identities, timing, metrics, and one canonical delivery ID. Every artifact is retrieved through bounded public chunks; atlas-only delivery is rejected. Production motion, the five-clip set, broader delivery-metadata reconciliation, Pixel admission/playback, and visual quality remain incomplete.
- Pixel Art Generator may consume, validate, and package only Forge public MCP responses and portable interchange artifacts; it may not recompute Forge animation atlases, import Forge source, call internal handlers, use absolute paths, or share mutable filesystem state.
- `education-app-pack-profile/v1` is implemented downstream as a validation contract, but complete pack assembly remains blocked on animation output and accepted production inputs.

## Novel Identity Contract

- `create_asset` accepts either a committed reference or a bounded novel-identity request. Novel initialization supports advertised rustic-humanoid and banded-container archetypes and produces a deterministic immutable skeleton.
- Novel documents carry closed origin, provenance, lineage, render/interchange profile, and completeness metadata. Incomplete identities are inspectable but fail validation and every artifact-producing operation with `INCOMPLETE_ASSET`.
- `asset.identity.initialize` and registered-grammar composition are supported for the advertised rustic humanoid and banded-container archetypes. Broad `asset.new_identity` remains partial because arbitrary anatomy, templates, generators, and raw-mesh composition are unavailable.
- Novel-character visual acceptance is reference-led: a provenance-bound generated turnaround/reference target must be explicitly owner-approved before modeling and reviewed side-by-side through Kimi. No image-generation provider is selected by this stack, and MMX is not implicitly authorized.

## Capability Contract

- `src/tools/capabilities.ts` derives the public capability manifest from the registered tool catalog, committed reference documents, template catalog, and render profile.
- `inspect_capabilities` returns schema-validated supported, partial, unsupported, and not-assessed facts through both in-process and MCP adapters.
- `measure/generated/capability-catalog.md` is generated from the same executable facts; human documentation must not claim more than that catalog.
- PNG contact sheets remain visual-review evidence. No atlas layout or temporal metadata is implied by the current renderer/exporter stack.
- The audit-only workflow uses the pinned Three.js `GLTFLoader` as a representative independent format importer. This does not establish Unity, Godot, or gameplay-runtime compatibility.

## Accessory Contract

- `PartTemplateDefinition.accessory` is optional for non-equipment templates and closed when present.
- Accessory metadata owns semantic role, a default and bounded compatible set among six equipment slots, attachment port IDs, handedness, compatibility tags, compatible anatomy/archetypes, rigid layering and intersection limits, declared local bounds, a triangle budget, allowed poses, and native-resolution required-feature evidence. Accessory instances may record an explicit equipment slot when ownership differs from the template default.
- Equipment remains data in `fantasy-kit`; slot resolution and compatibility are shared assembly behavior, not character-specific or MCP-specific logic.
- Existing `equipment.sword` and `equipment.shield` IDs migrate in place, preserving canonical identity and revision behavior.
- The initial accessory catalog adds fifteen data-only templates to the existing sword and round shield, yielding seventeen named accessories across all six slots. Every entry reuses the twelve-shape grammar; no generator or dependency is added.
- Public accessory discovery returns bounded compatibility, parameter, material, attachment, and required-feature facts without raw geometry payloads. A closed task-operation union covers equip, replace, swap hand, recolor, and unequip.
- Each accessory exposes kit-owned placement profiles with the exact attachment transform, intended orientation, usage guidance, and visual checks for every supported slot. LLM callers select the accessory and slot; they do not invent quaternions or hand offsets.
- Accessory mutations carry the current asset revision precondition and explicit dry-run flag. Successful results report exact added, removed, connection, and affected IDs; adapters do not reconstruct parts or transforms.

## Coordinate and Output Contract

The engine uses right-handed meter coordinates with +Y up, +X east, and +Z north. Serialized rotations are XYZW quaternions. The scene compiler, orthographic sprite renderer, and GLB exporter consume the same world transforms; adapters may not reinterpret axes or units. Sprite ground rows are normalized to the document render profile. GLB delivery is accepted only after reload confirms semantic IDs, materials, transforms, scale, and bounds and confirms the absence of out-of-scope animations, textures, shaders, skins, cameras, and lights.

## Module Boundaries

```text
src/
  contracts/       Versioned schemas and public domain types
  document/        Asset loading, patching, revisions, canonical serialization
  geometry/        Bounded procedural shape generators
  assembly/        Parts, ports, transforms, mirroring, joints, poses
  fantasy-kit/     Data-driven rustic fantasy templates and palettes
  scene/           Asset-document to Three.js scene compilation
  render/          Camera rigs, sprite frames, contact sheets, pixel checks
  export/          GLB and PNG delivery
  validation/      Mechanical and visual-contract validation
  tools/           Transport-agnostic domain tool handlers
  mcp/             Thin MCP adapter over tools
  inspector/       Minimal browser inspection and approval surface
```

Dependencies flow from adapters toward domain modules. `contracts` depends on no project module. `fantasy-kit` is data and template composition, not a second engine. `mcp` and `inspector` may call `tools`; domain modules never import an adapter.

The default novel-identity style profile is `cute_chibi_v1`. The secondary `heroic_stylized_v1` profile requires explicit originality/provenance review, is limited to broad readability ideas (exaggerated silhouettes, material/value separation, restrained detail), and prohibits copied franchise characters, symbols, costumes, names, and distinctive combinations without offering legal guarantees.

## Deliberately Rejected for MVP

- Blender and `bpy`.
- React and a general component framework until the vanilla inspector is insufficient.
- Native desktop shells.
- Server databases and cloud services.
- General CSG/boolean libraries; layered closed meshes are the default.
- General physics, animation, texture, shader, or CAD libraries.
- Multiple 3D exporters.

## Decision Triggers

- Add a robust boolean library only after a committed reference asset cannot be represented acceptably through direct profiles and intersecting closed parts.
- Add a UI framework only after measured inspector state complexity makes vanilla TypeScript a maintenance liability.
- Add skeletal deformation only after rigid-part reference animations fail an approved sprite requirement.
- Every trigger requires a prior update to this document and the active track.
