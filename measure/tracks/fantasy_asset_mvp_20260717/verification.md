# Verification Dossier: Fantasy Asset Forge MVP

## Automated acceptance

Verified on 2026-07-17 in the repository's pinned Node/pnpm environment.

| Gate | Result |
|---|---|
| `pnpm format:check` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm lint` | Pass; no dependency-cruiser violations across 46 modules and 68 dependencies |
| `pnpm test:coverage` | Pass; 15 files and 128 tests |
| Coverage | 89.73% statements, 80.11% branches, 87.27% functions, 90.46% lines |
| `pnpm build` | Pass; Vite production bundle emitted |
| `pnpm test:browser` | Pass; inspector, 8 sprites, transparency, no clipping, actual-size view, semantic GLB reload, no console errors |
| `pnpm reference:build` | Pass; all four canonical references regenerated through public handlers |
| `pnpm generate` | Pass; architecture, route, kit, tool, and output facts regenerated |
| `pnpm doctor` | Pass; generated facts current and excluded dependencies absent |

The browser fallback was Playwright because the optional `agent-browser` executable was not installed in this environment. The shipped acceptance test itself is Playwright-based and exercised the real inspector and WebGL output.

## Reference evidence

| Asset | Revision | Frames | Clipped edges | Ground deviation range | GLB bytes | Semantic nodes after reload | Animations |
|---|---|---:|---:|---:|---:|---:|---:|
| Adventurer | `revision.53818aadc04450183639f332da418f42f95a2047847d6fcfdf40cc3f1e831523` | 8 | 0 | -13px to 4px | 59,356 | 20 plus loader scene | 0 |
| Crate | `revision.25e1507ca7683999ac7aec6bd1379cfea43e6231bf202286722dcc8765974299` | 8 | 0 | -1px to 1px | 11,400 | 4 plus loader scene | 0 |
| Tree | `revision.0ba16c54ec1ed088b820467b932c6838be3483274034e9175e0a86e2cc8bf591` | 8 | 0 | -7px to 1px | 18,256 | 9 plus loader scene | 0 |
| Cottage | `revision.51c51b351c59fb5a463e8304c16d1598d26ff6f7c29eea88fedd27af69890486` | 8 | 0 | 1px to 5px | 33,784 | 12 plus loader scene | 0 |

Every frame contains both occupied and transparent pixels. The camera uses conservative full-bounds framing, so asymmetric silhouettes can report a negative visible-pixel ground deviation while retaining zero clipping. No unsupported GLB animation was emitted.

Evidence:

- `reference-build.json`: public-handler request and response dossier.
- `../../../generated/architecture.json`: source-derived module facts.
- `../../../generated/tool-catalog.md`: exact ten-tool public surface.
- `../../../generated/kit-catalog.md`: 26 templates, palette, ports, and reference counts.
- `../../../generated/output-contracts.md`: fixed sprite and GLB delivery contract.
- `../../../../artifacts/reference/`: 32 individual sprites, four contact sheets, four GLBs, and manifests.
- `adventurer-contact-sheet.png`: inspector-level enlarged browser capture.

## Product scope audit

- Dependencies contain no Blender, `bpy`, React, game engine, database, cloud, physics, animation, CSG, texture, or alternate-export stack.
- The canonical value remains a strict semantic document and immutable content-addressed revisions.
- Exactly twelve bounded shape generators feed one engine-neutral indexed-geometry contract.
- The rustic kit is data and composition over the shared grammar; humanoid, prop, tree, and cottage do not own separate engines.
- Exactly ten public tools expose bounded semantic discovery, creation, patching, connection, pose, validation, render, and export operations.
- No public tool exposes shell, arbitrary code, unrestricted filesystem, network retrieval, UI automation, raw mesh mutation, or Blender.
- MCP is a thin adapter over transport-independent handlers.
- Output is limited to transparent PNG sprites/contact sheets and GLB in meters.
- No in-scope capability was deferred and no speculative capability was added.

## Subagent execution note

The implementation used two independently scoped roles requested by the project owner:

- Terra: contracts, canonical documents, revision system, scaffolding, generation, and doctor enforcement.
- Luna: bounded geometry generators, transforms, ports, assembly, variants, and poses.

The collaboration runtime accepted the role assignments but did not expose a model-selection or model-attestation control, so the requested `gpt-5.6terra` and `gpt-5.6-luna` identities could not be independently verified. Their work was integrated only after root-level tests and quality gates.

## Explicit owner review still required

Automated acceptance is complete. Measure closeout remains intentionally open until the project owner:

1. Opens the inspector with `pnpm dev --host 127.0.0.1 --port 4173`.
2. Reviews all four references in interactive 3D.
3. Reviews the enlarged eight-direction contact sheets.
4. Reviews the sprites in the `Actual 128px` view.
5. Confirms recognizable silhouettes, coherent rustic style, stable framing, and acceptable material separation.

After explicit approval, the six manual phase-verification tasks can be checkpointed and the track archived.
