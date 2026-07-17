# Verification Dossier: Fantasy Asset Forge MVP

## Automated acceptance

Verified on 2026-07-17 in the repository's pinned Node/pnpm environment.

| Gate                                             | Result                                                                                                                                                                                                     |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`                              | Pass                                                                                                                                                                                                       |
| `pnpm typecheck`                                 | Pass                                                                                                                                                                                                       |
| `pnpm lint`                                      | Pass; no dependency-cruiser violations across 47 modules and 75 dependencies                                                                                                                               |
| `pnpm test:coverage`                             | Pass; 15 files and 140 tests                                                                                                                                                                               |
| Coverage                                         | 91.85% statements, 82.17% branches, 95.09% functions, 92.43% lines                                                                                                                                         |
| `pnpm build`                                     | Pass; Vite production bundle emitted                                                                                                                                                                       |
| `pnpm test:browser`                              | Pass; 3D inspector, selected-part evidence, comparison mode, 1/4/8 direction rendering, transparent sprites, exact ground alignment, no clipping, actual-size view, deep GLB reload, and no console errors |
| `pnpm reference:build`                           | Pass; all canonical references and three adventurer state/pose variants regenerated through public handlers                                                                                                |
| `pnpm generate`                                  | Pass; architecture, route, kit, tool, and output facts regenerated                                                                                                                                         |
| `pnpm doctor`                                    | Pass; generated facts current and excluded dependencies absent                                                                                                                                             |
| `node scripts/generate-architecture.mjs --check` | Pass; source-derived architecture facts current                                                                                                                                                            |

The browser fallback was Playwright because the optional `agent-browser` executable was not installed in this environment. The committed Playwright acceptance path exercised the real inspector, WebGL renderer, sprite pipeline, and GLB export/reload path.

## Reference evidence

| Asset/state                   | Revision                                                                    | Frames | Clipped edges | Ground deviation | Representative feature | GLB bytes | Semantic nodes |
| ----------------------------- | --------------------------------------------------------------------------- | -----: | ------------: | ---------------: | ---------------------: | --------: | -------------: |
| Adventurer, idle equipped     | `revision.69d8907b2aa68bdaf2742a1cb42fa135aabf64a2132c92c13784cb868a635a8b` |      8 |             0 |              0px |             5px to 7px |         — |              — |
| Adventurer, action equipped   | `revision.eb774603d901d84416d3e757610df39ab25e4b54a5179ef2102ce2ab3d0cfb3b` |      8 |             0 |              0px |             4px to 5px |    59,356 |             20 |
| Adventurer, action unequipped | `revision.45a7afc32a2778f8daf7136ad188f939826611c74a4d404883cc24a3d4de35bd` |      8 |             0 |              0px |             4px to 5px |         — |              — |
| Crate                         | `revision.e6b20ae75d9fd1b178818358520ab2c1c2ce07853f5f245fdce5d89ab99b41d6` |      8 |             0 |              0px |           11px to 80px |    11,400 |              4 |
| Tree                          | `revision.17ad4075ec857fb0c258b2a68615d2c1f75c990404c66169908ae8e976102007` |      8 |             0 |              0px |             5px to 8px |    18,256 |              9 |
| Cottage                       | `revision.b90dcab021f93c24da941ddba316a6f333df555c5b56b3ada999f9d319849a04` |      8 |             0 |              0px |           12px to 73px |    33,784 |             12 |

Every frame contains both occupied and transparent pixels. All 48 frames have exact declared ground alignment, no clipped edge, and representative feature width at or above the 3-pixel contract.

Every exported GLB passed deep reload comparison:

- the semantic node-name sets match exactly;
- world position, rotation, and scale match within `1e-5`;
- material-name sets match;
- visible bounds and meter unit scale match their tolerance;
- animation, texture, unsupported material/shader, skin, camera, and light counts are all zero.

Visual QA confirms that the adventurer, crate, tree, and cottage silhouettes are recognizable across all eight directions and that pose/equipment differences are visible. The deliberately dark rustic palette and material separation remain owner-judgement items.

Evidence:

- `reference-build.json`: public-handler requests, responses, and adventurer variant transitions.
- `../../../generated/architecture.json`: source-derived module facts.
- `../../../generated/tool-catalog.md`: exact ten-tool public surface.
- `../../../generated/kit-catalog.md`: 26 templates, palette, ports, and reference counts.
- `../../../generated/output-contracts.md`: fixed coordinate, sprite, pixel-validation, and GLB delivery contracts.
- `../../../../artifacts/reference/`: 48 individual sprites, six contact sheets, four GLBs, and per-revision manifests.
- `adventurer-contact-sheet.png`: enlarged inspector-level browser capture.

## Product scope audit

- Dependencies contain no Blender, `bpy`, React, game engine, database, cloud, physics, animation, CSG, texture, or alternate-export stack.
- The canonical value is a strict semantic document with immutable content-addressed revisions.
- Exactly twelve bounded shape generators feed one engine-neutral indexed-geometry contract.
- The rustic kit is data and composition over the shared grammar; humanoid, prop, tree, and cottage use the same execution path.
- Runtime kit manifests, generator parameters, material references, port tags, variants, poses, and document references are schema-validated.
- Exactly ten public tools expose bounded discovery, creation, semantic mutation, connection, pose, validation, render, and export operations.
- MCP is a response-budgeted thin adapter over transport-independent handlers.
- No public tool exposes shell, arbitrary code, unrestricted filesystem, network retrieval, UI automation, raw mesh mutation, or Blender.
- Revision and artifact paths reject traversal and symlink escapes; inspector URLs are credential-free loopback HTTP only.
- Output is limited to transparent PNG sprites/contact sheets and GLB in meters.
- Coordinate handedness, axes, quaternion order, ground plane, camera direction mapping, and mirror semantics are normative and generated into the output contract.

## Subagent execution note

The implementation used two independently scoped roles requested by the project owner:

- Terra: contracts, canonical documents, revision system, MCP protocol coverage, generated public routes, and response-budget enforcement.
- Luna: bounded geometry, transforms, ports, assembly, variants, poses, and the deep GLB parity design.

The collaboration runtime accepted the role assignments but did not expose model-selection or model-attestation controls, so the requested `gpt-5.6terra` and `gpt-5.6-luna` identities could not be independently verified. Their work was integrated only after root-level tests and quality gates.

## Explicit owner review still required

Automated acceptance is complete. Measure closeout remains intentionally open until the project owner:

1. Opens the inspector with `pnpm dev --host 127.0.0.1 --port 4173`.
2. Reviews all four references in interactive 3D.
3. Uses selected-part evidence and comparison mode.
4. Reviews the enlarged eight-direction contact sheets and the `Actual 128px` view.
5. Confirms recognizable silhouettes, coherent rustic style, stable framing, and acceptable material separation.

After explicit approval, the six manual phase-verification tasks can be checkpointed and the track archived.
