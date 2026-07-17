# Tech Stack

## Decision Summary

The MVP is a strict TypeScript application with a shared deterministic asset engine, a local LLM tool adapter, and a browser renderer/inspector. Blender and all general-purpose DCC or game-engine runtimes are explicitly excluded.

## Runtime and Language

- **TypeScript, strict mode:** Shared contracts across documents, tools, geometry, rendering, validation, and export.
- **Node.js Active LTS:** Local tool server, filesystem project storage, deterministic builds, tests, and CLI workflows. Pin the exact version when implementation begins.
- **Browser WebGL:** Interactive inspection and sprite rendering through the same scene compiler used by exports.
- **pnpm:** Dependency management and reproducible scripts.

## Core Libraries

- **Zod:** Closed runtime schemas for versioned asset documents and domain tool inputs/outputs.
- **Three.js:** Scene graph, constrained geometry output, materials, orthographic cameras, browser rendering, render targets, and GLB export.
- **Model Context Protocol TypeScript SDK:** Thin local adapter exposing the project-owned domain tools. MCP is transport, not the asset model or engine.
- **Vite:** Minimal vanilla-TypeScript inspector application and development server. React is intentionally excluded from the MVP unless interaction complexity proves it necessary.

## Testing and Quality

- **Vitest:** Unit and contract tests for schemas, generators, port resolution, transforms, variants, and validation.
- **Playwright:** Browser rendering integration tests and deterministic reference workflow checks.
- **PNG pixel analysis utilities:** Project-owned checks for transparency, frame occupancy, ground anchor, silhouette width, and contact-sheet layout.
- **TypeScript compiler:** Strict type checking with no emit in CI.
- **ESLint and dependency-cruiser:** Code quality and enforceable module boundaries when implementation scaffolding is created.
- **Prettier:** Mechanical formatting only.

## Storage and Formats

- **JSON:** Canonical asset, part-template, style, pose, and render-profile documents. JSON is selected over YAML so runtime schemas and tool payloads share one representation.
- **GLB/glTF 2.0:** The only MVP 3D delivery format.
- **PNG:** Transparent sprite frames and contact sheets.
- **Local filesystem:** Projects, revisions, previews, and exports. No database, authentication, hosted service, or cloud storage in the MVP.

## Planned Module Boundaries

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
