# Verification Dossier: Fantasy Asset Forge MVP

## Automated acceptance

Verified on 2026-07-17 in the repository's pinned Node/pnpm environment.

| Gate                                             | Result                                                                                                                                                                                                                 |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm format:check`                              | Pass                                                                                                                                                                                                                   |
| `pnpm typecheck`                                 | Pass                                                                                                                                                                                                                   |
| `pnpm lint`                                      | Pass; no dependency-cruiser violations across 50 modules and 83 dependencies                                                                                                                                           |
| `pnpm test:coverage`                             | Pass; 18 files and 156 tests                                                                                                                                                                                           |
| Coverage                                         | 94.17% statements, 83.76% branches, 97.03% functions, 94.82% lines; browser-artifact adapter 80.21% statements and 81.6% lines                                                                                         |
| `pnpm build`                                     | Pass; Vite production bundle emitted                                                                                                                                                                                   |
| `pnpm test:browser`                              | Pass; source-isolated inspector, content revision IDs, safe document rendering, named port frames, semantic state comparison, 1/4/8 directions, named required-feature evidence, exact 128px view, and deep GLB parity |
| `pnpm reference:build`                           | Pass; all canonical references and three adventurer state/pose variants regenerated through public handlers                                                                                                            |
| `pnpm generate`                                  | Pass; architecture, route, kit, tool, and output facts regenerated                                                                                                                                                     |
| `pnpm doctor`                                    | Pass; generated facts current and excluded dependencies absent                                                                                                                                                         |
| `node scripts/generate-architecture.mjs --check` | Pass; source-derived architecture facts current                                                                                                                                                                        |

The committed Playwright runner starts an isolated Vite server on a process-specific port, so acceptance cannot silently reuse a stale human-facing development server. It exercises the real inspector, WebGL renderer, sprite pipeline, and GLB export/reload path.

## Reference evidence

| Asset/state                   | Revision                                                                    | Frames | Clipped edges | Ground deviation | Representative feature | Named feature | GLB bytes | Semantic nodes |
| ----------------------------- | --------------------------------------------------------------------------- | -----: | ------------: | ---------------: | ---------------------: | ------------: | --------: | -------------: |
| Adventurer, idle equipped     | `revision.8044813bcf514c8bea35331db437de0e5c1a2c7961e7b87ddc9a635b493b355b` |      8 |             0 |              0px |             5px to 7px |   9px to 18px |         — |              — |
| Adventurer, action equipped   | `revision.02ee4a5682675f49d494f6f99ea5cb1b9b5e1805ac0c30ee5b300ceaa7136561` |      8 |             0 |              0px |             4px to 6px |   8px to 16px |    58,936 |             20 |
| Adventurer, action unequipped | `revision.760a31918520da7b3ca40078cdc2f1f1575d6bb1a3173111bdc41b561c990ed6` |      8 |             0 |              0px |             4px to 5px |   8px to 17px |         — |              — |
| Crate                         | `revision.453647cfe7d1b945148666d971c21975926f2348ff00704d0d1faacdd431d3e6` |      8 |             0 |              0px |           40px to 80px | 71px to 104px |    11,448 |              4 |
| Tree                          | `revision.f3e0fc7bbc3c3a2d6fc99f2360d5082bd9413321f87306c8bec9f059e1ddcdfb` |      8 |             0 |              0px |             5px to 8px |   7px to 20px |    18,236 |              9 |
| Cottage                       | `revision.e8c3ab466df9cd4c960d7fcea8a944a63c6d92572832b6120d243c84afdcc1a0` |      8 |             0 |              0px |           12px to 73px |   9px to 12px |    33,784 |             12 |

Every frame contains both occupied and transparent pixels. All 48 frames have exact declared ground alignment and no clipped edge. Every profile-named semantic part has isolated silhouette evidence above the 3-pixel contract in every direction.

Every exported GLB passed deep reload comparison:

- the semantic node-name sets match exactly;
- world position, rotation, and scale match within `1e-5`;
- material-name sets and standard-material properties match, with zero measured property deviation;
- visible bounds and meter unit scale match their tolerance;
- animation, texture, unsupported material/shader, skin, camera, and light counts are all zero.

Root-level visual inspection found the four silhouettes and adventurer pose/equipment changes discernible after increasing palette separation and replacing the crate's horizontal slabs with a sharp body and vertical iron straps. This is implementation evidence, not owner approval; final visual taste remains an explicit owner gate.

Evidence:

- `reference-build.json`: public-handler requests, responses, and adventurer variant transitions.
- `../../../generated/architecture.json`: source-derived module facts.
- `../../../generated/tool-catalog.md`: exact ten-tool public surface.
- `../../../generated/kit-catalog.md`: 26 templates, palette, ports, and reference counts.
- `../../../generated/output-contracts.md`: fixed coordinate, sprite, pixel-validation, and GLB delivery contracts.
- `../../../../artifacts/reference/`: 48 individual sprites, six contact sheets, four GLBs, and per-revision manifests.
- `adventurer-contact-sheet.png`: enlarged inspector-level browser capture.

### Direct visual review

- [Adventurer — idle equipped](../../../artifacts/reference/adventurer.rustic/revision.8044813bcf514c8bea35331db437de0e5c1a2c7961e7b87ddc9a635b493b355b/contact-sheet.png)
- [Adventurer — action equipped](../../../artifacts/reference/adventurer.rustic/revision.02ee4a5682675f49d494f6f99ea5cb1b9b5e1805ac0c30ee5b300ceaa7136561/contact-sheet.png)
- [Adventurer — action unequipped](../../../artifacts/reference/adventurer.rustic/revision.760a31918520da7b3ca40078cdc2f1f1575d6bb1a3173111bdc41b561c990ed6/contact-sheet.png)
- [Iron-banded crate](../../../artifacts/reference/crate.rustic/revision.453647cfe7d1b945148666d971c21975926f2348ff00704d0d1faacdd431d3e6/contact-sheet.png)
- [Roadside tree](../../../artifacts/reference/tree.rustic/revision.f3e0fc7bbc3c3a2d6fc99f2360d5082bd9413321f87306c8bec9f059e1ddcdfb/contact-sheet.png)
- [Timber cottage](../../../artifacts/reference/cottage.rustic/revision.e8c3ab466df9cd4c960d7fcea8a944a63c6d92572832b6120d243c84afdcc1a0/contact-sheet.png)

## Product scope audit

- Dependencies contain no Blender, `bpy`, React, game engine, database, cloud, physics, animation, CSG, texture, or alternate-export stack.
- The canonical value is a strict semantic document with immutable content-addressed revisions.
- Exactly twelve bounded shape generators feed one engine-neutral indexed-geometry contract.
- The rustic kit is data and composition over the shared grammar; humanoid, prop, tree, and cottage use the same execution path.
- Runtime kit manifests, generator parameters, material references, port tags, variants, poses, and document references are schema-validated.
- Exactly ten public tools expose bounded discovery, creation, semantic mutation, connection, pose, validation, render, and export operations.
- Localized geometry edits use the closed `setPartShapeParameters` operation, and `validate_asset` enforces each document's explicit triangle budget.
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
