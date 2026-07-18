# Verification: LLM Authoring Workflow Hardening

## Phase S1: Expose Complete Current State

Status: approved by the owner on 2026-07-17 after automated verification passed.

### Automated evidence

| Check                                               | Result                                                                                                                                              |
| --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red test run                                        | Expected failure: `inspect_asset` rejected section paging and `compareRevisions` did not exist                                                      |
| Focused handler and MCP tests                       | Pass; exact current state, deterministic paging, connection port state, immutable reads, semantic comparison, and the 64 KiB MCP budget are covered |
| Full unit suite                                     | Pass: 19 files, 161 tests                                                                                                                           |
| Full coverage                                       | Pass: 94.19% statements, 83.69% branches, 96.49% functions, 94.77% lines                                                                            |
| New semantic-diff module coverage                   | Pass: 98.78% statements, 96.22% branches, 100% functions, 98.70% lines                                                                              |
| `pnpm typecheck`                                    | Pass                                                                                                                                                |
| `pnpm lint`                                         | Pass; no dependency violations across 51 modules and 85 dependencies                                                                                |
| `pnpm generate`                                     | Pass; architecture, routes, and public tool catalog regenerated                                                                                     |
| `pnpm doctor`                                       | Pass                                                                                                                                                |
| `env CI=true pnpm check` in an isolated clean clone | Pass; formatting, typecheck, lint, 161 tests, generated-fact freshness, and doctor                                                                  |
| `pnpm check` in the working checkout                | Not used as clean proof: it stops at Prettier because the supplied untracked benchmark dossier contains 11 pre-existing formatting mismatches       |
| Browser/actual-resolution visual review             | Not applicable to S1; this phase changes read-only semantic inspection and comparison, not rendering or artifacts                                   |

### Scope evidence

- `inspect_asset` now has an overview plus bounded `parts`, `connections`, `variants`, `poses`, and `renderProfiles` sections.
- Part inspection distinguishes authored base state from active variant/pose effective state and includes resolved world transforms and port definitions.
- `compare_revisions` reports deterministic field-level changes, affected semantic IDs, preserved semantic IDs, totals, truncation, and `nextOffset`.
- Unknown fields, missing revision IDs, and out-of-range pages return actionable structured issues.
- No response exposes raw positions, normals, indices, shell, filesystem, Blender, or arbitrary-code controls.
- This phase adds no accessories, novel identities, temporal animation, atlas generation, or new geometry.

### Owner manual verification procedure

Using the repository MCP server and its existing `adventurer.rustic` revision history:

1. List tools and confirm `inspect_asset` and `compare_revisions` are public read-only operations.
2. Call `inspect_asset` with `section: "parts"` and `limit: 100`; confirm the 19-part page reports authored and effective shape, transform, material, visibility, handedness, joint, world-transform, and port state without raw geometry.
3. Call `inspect_asset` with `section: "connections"` and `limit: 1`; confirm `total`, `truncated`, and `nextOffset`, then inspect both endpoint part/port IDs, port frames/tags/acceptance/cardinality, and joint state.
4. Inspect `variants`, `poses`, and `renderProfiles`; confirm active IDs remain visible in every response and the returned values are sufficient to preserve current state.
5. Compare base revision `revision.710000881f0fa51b34ea4aa206228240c60d45121d07b0c176403f13288398f1` to current revision `revision.53818aadc04450183639f332da418f42f95a2047847d6fcfdf40cc3f1e831523`; confirm localized field changes and preserved IDs are both reported.
6. Request a second page using `nextOffset`, then try an out-of-range offset and an unknown field; confirm deterministic continuation and actionable rejection.

Owner decision: approved. No additional S1 inspection or comparison gap was identified.

## Phase S2: Publish Honest Capabilities

Status: approved by the owner on 2026-07-18 after automated verification passed.

### Automated evidence

| Check                                               | Result                                                                                                                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red test run                                        | Expected failure: `inspectCapabilities`, public registration, and the generated capability catalog did not exist                                                                          |
| Focused capability, handler, and MCP tests          | Pass: 16 tests before full-suite integration; filtering, unknown fields/IDs, supported static facts, explicit gaps, safe guidance, generated drift, and protocol registration are covered |
| Full unit suite                                     | Pass: 20 files, 165 tests                                                                                                                                                                 |
| Full coverage                                       | Pass: 94.29% statements, 83.59% branches, 96.70% functions, 94.84% lines                                                                                                                  |
| New `capabilities.ts` coverage                      | Pass: 100% statements, functions, and lines; 71.42% branches, with total new tools-module coverage above 87% statements                                                                   |
| `pnpm typecheck`                                    | Pass                                                                                                                                                                                      |
| `pnpm lint`                                         | Pass; no dependency violations across 52 modules and 91 dependencies                                                                                                                      |
| `pnpm generate`                                     | Pass; capability catalog added beside architecture, route, kit, tool, and output facts                                                                                                    |
| `pnpm doctor`                                       | Pass                                                                                                                                                                                      |
| `env CI=true pnpm check` in an isolated clean clone | Pass: formatting, typecheck, lint, 165 tests, generated-fact freshness, and doctor                                                                                                        |

### Capability boundary to review

- Supported: adventurer, crate, tree, and cottage references; localized semantic revisions; sword and shield; static rigid poses; directional PNGs; review contact sheets; GLB.
- Partial: accessory authoring exists but only for the registered sword and shield.
- Unsupported: new identities, additional accessories, temporal animation, runtime sprite atlases, unregistered anatomy, skeletal deformation, and raw mesh operations.
- Not Assessed: representative external game-engine import remains unevidenced until S4.
- Guidance never recommends source inspection, hand-authored canonical JSON, unrestricted file access, shell access, or hidden tools.

### Owner manual verification procedure

1. Call `inspect_capabilities` with `{}` and confirm every fact has an ID, category, status, summary, executable evidence arrays, and guidance for every non-supported status.
2. Filter with `capabilityIds: ["accessory.additional", "animation.temporal", "integration.game_engine_import"]`; confirm the ordered result is unsupported, unsupported, and not-assessed with concrete next steps.
3. Confirm `accessory.sword` and `accessory.shield` cite registered templates and public tools, while `accessory.library` is explicitly partial.
4. Confirm the four reference asset facts, directional PNG/contact-sheet output, GLB output, static pose, localized revision, inspection, and immutable revision facts are supported.
5. Compare the runtime response with `measure/generated/capability-catalog.md`, README, product, and tech stack; confirm they make no broader claim.
6. Request an unknown capability and an unknown field; confirm `NOT_FOUND` and `UNKNOWN_FIELD` responses include stable paths and no mutation occurs.

Owner decision: approved. No additional S2 capability status, evidence, or limitation gap was identified.

## Phase S3: Guide Visual Authoring

Status: approved by the owner on 2026-07-18 after automated verification passed.

### Automated evidence

| Check                                         | Result                                                                                                                                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red/green skill contract                      | Pass: the contract first failed for missing workflow files and later for incomplete animation capability preflight; the implemented skill, exact public-call ledger, unavailable-MCP fallback, and five-capability animation handoff now pass                                         |
| Skill package validation                      | Pass: the skill-creator `quick_validate.py` validator accepted `.agents/skills/fantasy-asset-workflow`                                                                                                                                                                                |
| Focused skill and artifact-verifier tests     | Pass: 2 files, 5 tests; includes the audit-only verifier and workflow contract                                                                                                                                                                                                        |
| Paired skill benchmark, iteration 1           | Skill 80.8%, baseline 45.5%, delta +0.35 across four evals                                                                                                                                                                                                                            |
| Paired skill benchmark, iteration 2           | Skill 96.9%, baseline 39.3%, delta +0.58 across four evals; the remaining 7/8 animation-preflight miss was repaired afterward with a red/green contract regression while the benchmark result was preserved                                                                           |
| Benchmark provenance                          | Limited: one run per eval/configuration, no measured timing, and zero recorded tool calls; results measure the written intended workflows and unavailable-tool handling, not repeat-run stability or observed MCP execution                                                           |
| Committed crate artifact audit                | Pass: eight physical 128x128 PNGs, no manifest clipping, zero ground-anchor deviation, 512x292 contact sheet, GLB identity/header/length/reload invariants, and SHA-256 evidence                                                                                                      |
| Browser workflow exercise                     | Pass for mechanics via pinned Playwright fallback: interactive 3D, 4x2 contact sheet, and eight actual-size 128x128 canvases loaded with no console errors; 19 parts and 1,440 triangles were reported                                                                                |
| Preferred browser harness                     | Unavailable: installed entrypoint failed with `ModuleNotFoundError: No module named 'run'`; the fallback and screenshots are recorded in `s3-evidence/exercise.md`                                                                                                                    |
| Baseline adventurer visual fidelity           | Partial: framing, ground contact, clipping, and torso pixel metrics pass, but the thin sword is ambiguous at native size in multiple directions, especially edge-on                                                                                                                   |
| Full unit suite                               | Pass: 22 files, 170 tests                                                                                                                                                                                                                                                             |
| Full coverage                                 | Pass: 94.29% statements, 83.59% branches, 96.70% functions, 94.84% lines                                                                                                                                                                                                              |
| `pnpm typecheck`                              | Pass                                                                                                                                                                                                                                                                                  |
| `pnpm lint`                                   | Pass; no dependency violations across 52 modules and 91 dependencies                                                                                                                                                                                                                  |
| `pnpm build`                                  | Pass; Vite retained a non-blocking 800.16 kB chunk-size warning                                                                                                                                                                                                                       |
| Generated facts and `pnpm doctor`             | Pass; architecture, route, kit, tool, capability, and output facts are current, and the architecture doctor passed                                                                                                                                                                    |
| First clean-clone `env CI=true pnpm check`    | Failed honestly on tracked Prettier drift in `review-2026-07-18.md`; mechanical repair committed as `953e2dd`                                                                                                                                                                         |
| Repeated clean-clone `env CI=true pnpm check` | Pass after the repair: formatting, typecheck, lint, 170 tests, generated-fact freshness, and doctor                                                                                                                                                                                   |
| Clean-clone browser test                      | Pass: the repository inspector rendered semantic assets, transparent sprites, and valid GLB evidence                                                                                                                                                                                  |
| Clean-clone reference build                   | Generation completed and the crate verifier passed, but reproducibility failed: manifests changed only because they contain clone-root absolute paths, and the build/browser evidence was written under stale `fantasy_asset_mvp_20260717`; these are explicit S4 acceptance failures |

### Workflow and evidence delivered

- The repository-local skill starts with machine-readable capability preflight, inspects before mutation, preserves response-derived revision and semantic IDs, dry-runs before applying, compares immutable revisions, validates, renders, exports, and reviews artifacts without source or canonical-document access.
- When MCP tools are unavailable, the skill records an exact intended public-call ledger with unresolved placeholders and reports runtime, revision, mutation, validation, visual, and artifact outcomes as not assessed instead of inventing them.
- Visual review requires three distinct surfaces: interactive 3D, the directional contact sheet, and every frame at native 128x128 size. Mechanical pixel metrics are evidence, not a substitute for visual judgment.
- The audit-only verifier reads manifests and artifacts, checks containment, dimensions, direction order, clipping/anchor metrics, GLB invariants, and hashes, and does not manufacture or modify product output.
- Two complete benchmark iterations preserve prompts, with-skill and baseline outputs, objective grading, analyzer notes, aggregate summaries, and static HTML viewers.

### Honest remaining gaps

- The accessory library remains limited to the registered sword and shield. Helmets, spears, axes, additional equipment, and their attachment/readability conventions still require a dedicated product track.
- Novel character identities and unregistered anatomy are unsupported; the workflow must block rather than approximate them from existing templates.
- Temporal animation, skeletal deformation, runtime sprite-atlas generation, and animated GLB export are unsupported. The skill supplies a future handoff contract but does not claim these outputs exist.
- The baseline sword is not consistently legible in the native directional frames, and the current torso-focused metric does not detect that equipment-readability failure.
- A fresh MCP-capable LLM has not yet executed the complete seeded request, and representative game-engine import remains not assessed. Both belong to S4.
- Reference manifests are not portable across clone roots, and reference/browser evidence still targets an archived track path. S4 must make a successful reference build leave the clean clone unchanged.
- The skill benchmark has one run per pairing and no observed MCP tool execution, so it supports workflow-quality comparison but not repeatability, runtime, or end-to-end acceptance claims.

### Owner manual verification procedure

1. Read `.agents/skills/fantasy-asset-workflow/SKILL.md` and its `current-capabilities.md`, `public-call-ledger.md`, `visual-review.md`, `evidence-report.md`, and `animation-handoff.md` references; confirm the workflow uses only public MCP operations and blocks unsupported work honestly.
2. Open `.agents/skills/fantasy-asset-workflow-workspace/iteration-2/review.html`; compare the four paired with-skill and baseline outputs, objective grading, and iteration-one comparison. Confirm the stated 96.9% versus 39.3% result is useful but does not overrule the one-run/no-runtime-tool caveats.
3. Review `s3-evidence/faf-s3-3d.png`, `s3-evidence/faf-s3-contact.png`, and `s3-evidence/faf-s3-actual.png` alongside `s3-evidence/exercise.md`; confirm the workflow surfaces the sword-readability limitation rather than calling mechanical metrics sufficient.
4. Inspect the artifact-verifier script and tests; confirm it is read-only and rejects identity, revision, containment, dimension, clipping, ground-anchor, GLB, and hash inconsistencies without post-processing output.
5. Confirm the product boundary is still accurate: sword/shield only, no novel identities, no helmet/spear/general accessory library, no temporal animation/atlas/animated GLB, and no proven external importer.
6. Decide whether the skill/evidence contract is acceptable for S3. If approved, record the owner decision and create the phase checkpoint; otherwise list the exact workflow or reporting changes required.

Owner decision: approved. No additional S3 workflow, evidence-contract, or limitation-reporting gap was identified.
