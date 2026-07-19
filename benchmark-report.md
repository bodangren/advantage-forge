# Fantasy Asset Forge MVP Benchmark Report

## 1. Executive Verdict

- Narrow MVP conformance: **Blocked**
- Broader product fitness: **Reject**
- Score: **68/100 diagnostic score**
- Tested commit: `4723e304324b5e28f70de2c39ed1d780c200c625`
- Evaluator model/client: Codex GPT-5; Playwright 1.61.1; manual JSON-RPC MCP client because no MCP-capable LLM client was configured
- Run ID: `20260717T104617Z`

The server and bounded asset compiler are serviceable for the narrow static MVP. Browser inspection, all four references, localized revision, validation, deterministic eight-direction rendering, GLB export, safety rejection, and persistence all worked. The benchmark cannot approve the LLM-first workflow because this environment had no evaluating MCP-capable LLM, and `inspect_asset` does not expose per-instance shape parameters needed to prove safe localized edits. Broader approval is rejected: the public API is limited to four committed references, exposes no animation/atlas workflow, and exported GLBs contain `animationCount: 0`.

## 2. Environment and Reproduction

| Item | Value |
| --- | --- |
| Source root | `/home/daniel-bo/Desktop/fantasy-asset-forge` |
| Benchmark clone | `/tmp/fantasy-asset-forge-benchmark-20260717T104617Z` |
| Evidence root | `benchmark-evidence/20260717T104617Z/` |
| OS | Linux, containerized Codex shell |
| Node | `v22.22.2` |
| pnpm | `11.8.0` |
| Browser | Playwright Chromium, headless, 1440×1100 |
| Inspector URL | `http://127.0.0.1:4175` |
| MCP server | `pnpm mcp`, `FORGE_INSPECTOR_URL=http://127.0.0.1:4175` |
| Start/end | 2026-07-17 UTC; exact command evidence is in the run directory |

Exact setup:

```bash
git clone --no-hardlinks /home/daniel-bo/Desktop/fantasy-asset-forge /tmp/fantasy-asset-forge-benchmark-20260717T104617Z
cd /tmp/fantasy-asset-forge-benchmark-20260717T104617Z
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 4175 --strictPort
```

Installation succeeded in 6.2 seconds. The clone began without `.forge/` or `artifacts/`. The source worktree already contained untracked `approval-and-benchmark.md`; the benchmark added only its requested report/evidence outputs.

Deviations:

- No MCP-capable evaluating LLM was available. MCP was launched and queried with a manual JSON-RPC client; those results are diagnostic evidence, not an LLM-autonomy pass.
- The documented `agent-browser` executable was not installed. Playwright was used directly through the repository’s installed browser stack; the project browser test passed.
- The protocol’s source-inspection restriction was not fully clean: package/docs and an initial source grep were read during harness orientation before the manual MCP exercise. No canonical reference JSON was used to construct the manual edit.
- No representative target game-engine import was available; GLB integrity was assessed from the product’s reload manifest only.

## 3. Automated Baseline

| Command | Exit status | Duration | Result summary | Evidence |
| --- | ---: | ---: | --- | --- |
| `pnpm check` | incomplete capture | 49s before harness termination | Formatting, typecheck, and lint wrapper reached successfully; final marker was not written. Independent sub-gates below completed. | `pnpm-check.log` |
| `pnpm format:check` | 0 | included | All files matched Prettier. | `pnpm-check.log` |
| `pnpm typecheck` | 0 | included | TypeScript build passed. | `pnpm-check.log` |
| `pnpm lint` | 0 | 60s | ESLint and dependency-cruiser passed; 50 modules / 83 dependencies, no violations. | `lint.log` |
| `pnpm test` | 0 | 20s | 18 files, 156 tests passed. | `pnpm-test.log` |
| `pnpm test:coverage` | 0 | 25s | 94.17% statements, 83.76% branches, 97.03% functions, 94.82% lines. | `test-coverage.log` |
| `pnpm build` | 0 | 6s | Vite build passed; one 797.75 kB minified chunk warning. | `build.log` |
| `pnpm test:browser` | 0 | 32s | One browser test passed in 25.3s. | `test-browser.log` |
| `pnpm reference:build` | 0 | 57s | Four references built through the public workflow. | `reference-build.log` |
| `pnpm generate` | 0 | 3s | Generated architecture/tool/output facts. | `generate.log` |
| `pnpm doctor` | 0 | 3s | Architecture doctor passed. | `doctor.log` |

Documentation/path fidelity finding: `reference:build` wrote `/measure/tracks/fantasy_asset_mvp_20260717/` even though the committed track is archived under `/measure/archive/fantasy_asset_mvp_20260717/`; it also rewrote ten tracked reference manifest files. The post-command clone was dirty with those manifest changes plus the generated old-track directory. See `benchmark-status-after-commands.txt`, `benchmark-diff-stat.txt`, and `generated-diff.txt`.

## 4. Browser and Visual Evaluation

All four references were opened in 3D Inspector, Contact Sheet, and Actual 128px views. Browser capture had no failed requests or page errors. Headless WebGL emitted only expected GPU `ReadPixels` performance warnings.

### Adventurer

3D: **Pass.** Rustic Adventurer is recognizable, with 19 semantic parts, 1,440 triangles, bounds 1.36 × 3.02 × 0.68 m, 53 ports, equipped/idle initial state, and useful selected-part evidence. Torso exposed `neck`, `hip`, and both shoulder ports; sword exposed `grip` and `iron.weathered`.

Actual/contact sheet: **Pass with a readability caveat.** All eight directions are transparent, grounded at 0 px deviation, unclipped, and recognizable. Occupied sizes ranged from 24×96 px in E/W to 46×95 px in N. Sword/shield and the moss tunic remain distinguishable, though the side silhouettes are narrow at actual size.

Evidence: [3D](benchmark-evidence/20260717T104617Z/browser-adventurer-3d.png), [contact sheet](benchmark-evidence/20260717T104617Z/browser-adventurer-contact-sheet.png), [actual 128px](benchmark-evidence/20260717T104617Z/browser-adventurer-actual-128px.png), [torso/sword/orbit](benchmark-evidence/20260717T104617Z/browser-adventurer-torso-orbit.png), [action unequipped](benchmark-evidence/20260717T104617Z/browser-adventurer-action-unequipped.png), [compare](benchmark-evidence/20260717T104617Z/browser-adventurer-compare.png).

### Crate

3D: **Pass.** Iron-Banded Crate has 3 parts, 132 triangles, 53 ports, and clear body/band semantic separation.

Actual/contact sheet: **Pass.** All eight views are occupied, grounded, unclipped, and clearly read as a crate. Orthographic front/back views are intentionally simple; bands are clearest in N/W-facing views.

Evidence: [3D](benchmark-evidence/20260717T104617Z/browser-crate-3d.png), [contact sheet](benchmark-evidence/20260717T104617Z/browser-crate-contact-sheet.png), [actual 128px](benchmark-evidence/20260717T104617Z/browser-crate-actual-128px.png).

### Tree

3D: **Pass.** Roadside Tree has 8 parts, 438 triangles, explicit branch/crown/root semantic structure, and coherent dark wood/green foliage.

Actual/contact sheet: **Pass.** All eight views read as the same tree, with stable ground contact and no clipping. E/W silhouettes are narrow but branches remain visible.

Evidence: [3D](benchmark-evidence/20260717T104617Z/browser-tree-3d.png), [contact sheet](benchmark-evidence/20260717T104617Z/browser-tree-contact-sheet.png), [actual 128px](benchmark-evidence/20260717T104617Z/browser-tree-actual-128px.png).

### Cottage

3D: **Pass.** Timber Cottage has 11 parts, 364 triangles, and visibly distinguishable roof, chimney, door, windows, timber, and walls.

Actual/contact sheet: **Partial.** The eight views are stable, grounded, unclipped, and recognizable. Front/three-quarter views communicate door/windows/roof well; S/SW required-feature evidence falls to 12 px and some architectural features collapse into a simpler silhouette at actual resolution.

Evidence: [3D](benchmark-evidence/20260717T104617Z/browser-cottage-3d.png), [contact sheet](benchmark-evidence/20260717T104617Z/browser-cottage-contact-sheet.png), [actual 128px](benchmark-evidence/20260717T104617Z/browser-cottage-actual-128px.png).

## 5. MCP Discovery and Authoring Transcript

Redacted configuration: [mcp-config-redacted.json](benchmark-evidence/20260717T104617Z/mcp-config-redacted.json). Complete surface transcript: [mcp-surface-transcript.md](benchmark-evidence/20260717T104617Z/mcp-surface-transcript.md).

The MCP server exposed exactly the required ten tools and no shell, code execution, filesystem, network, Blender, UI automation, or raw-mesh tool. `list_kits` found one `rustic-human` kit with four references and 26 templates. `inspect_template` exposed generator parameters, bounds, material slots, and ports for `human.torso` and `equipment.sword`.

The fresh-LLM discovery exercise was **Not Assessed / Blocked** because no MCP-capable LLM client could be configured in this environment. The manual MCP discovery found the kit and templates without reading canonical JSON. `inspect_asset` successfully returned parts, template IDs, connections, variants, poses, and active state, but did not return instance shape parameters, material bindings, or per-part transforms. This is a successful tool call but an incomplete authoring summary.

The manual diagnostic authoring sequence used 14 public tool calls across baseline creation, inspection, validation, render/export, dry-run, apply, pose, variant, and safety checks. It needed one corrective prompt only for a client-side inline-script syntax error; that failed before any MCP process or product mutation.

## 6. Seeded Adventurer Result

- Baseline: `revision.8044813bcf514c8bea35331db437de0e5c1a2c7961e7b87ddc9a635b493b355b`; valid, 1,440 triangles, eight frames, 58,524-byte meter GLB.
- Dry-run: valid, no revision written, `affectedIds:["torso"]`; evidence is in `mcp-seeded-authoring-manual.json`.
- Local edit: `revision.4c9934c125803e27b434691860eb7d6d0007c0789ab50bea7d32d7b464efa849`, parent baseline, `affectedIds:["torso"]`.
- Pose: `revision.af72b437667174424f4c5493dbf0143d3a82cbcd40fa9eb3c4711c5b4984c08d`, `affectedIds:["action"]`.
- Variant: `revision.fda4025a45c6cf5590dbf57e2468f4d8ce1e08d0735a4b6337430953585bfcf7`, `affectedIds:["unequipped"]`.
- Final validation: valid, 1,396 triangles of 2,000; all eight frames occupied, transparent, grounded at 0 px deviation, unclipped, and torso evidence ≥8 px wide.
- Final GLB: 54,336 bytes, meter units, 18 semantic nodes after unequipping, material reload match, bounds match, no animations.

Baseline and final copied artifact directories: [MCP artifacts](benchmark-evidence/20260717T104617Z/mcp-artifacts/). The final contact sheet is [here](benchmark-evidence/20260717T104617Z/mcp-artifacts/revision.fda4025a45c6cf5590dbf57e2468f4d8ce1e08d0735a4b6337430953585bfcf7/contact-sheet.png); final manifest and GLB are in the same revision directory.

Locality is demonstrated by the server’s exact `affectedIds` and parent/current revision lineage. However, the LLM-facing surface does not make a before/after per-part parameter diff available, so unrelated-node preservation is not independently observable from `inspect_asset` alone.

## 7. Safety and Failure Behavior

| Test | Expected | Actual | Mutation occurred? | Result | Evidence |
| --- | --- | --- | --- | --- | --- |
| Stale revision | `REVISION_CONFLICT`, no write | Structured conflict with retry guidance; current stayed `fda402…` | No | Pass | `mcp-safety-manual.json` |
| Invalid part | Semantic rejection with path/guidance | `PATCH_REJECTED`, “Part missing.part was not found.” | No | Pass | `mcp-safety-manual.json` |
| Unsupported `runShell` | Schema rejection, no shell | MCP `-32602`, discriminator listed only closed operations | No | Pass | `mcp-safety-manual.json` |
| No-op torso edit | Clear no-op/rejection | `PATCH_REJECTED`, actual parameters returned, no revision | No | Pass | `mcp-safety-manual.json` |

## 8. Shared-Engine Reuse

| Asset | Revision | Validation | Render | GLB | Visual result | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Adventurer | `fda402…` | Valid, 1,396 tris | 8/8, unclipped | 54,336 B | Pass | Final action/unequipped diagnostic |
| Crate | `453647…` | Valid, 132 tris | 8/8, unclipped | 11,448 B | Pass | Same public workflow; iron/wood materials |
| Tree | `f3e0fc…` | Valid, 438 tris | 8/8, unclipped | 18,236 B | Pass | Same public workflow; wood/foliage materials |
| Cottage | `e8c3ab…` | Valid, 364 tris | 8/8, unclipped | 33,784 B | Pass/Partial | Same workflow; reverse views simplify architecture |

All four GLB manifests use meter units, semantic node names, material reload checks, and `animationCount: 0`. The browser and MCP artifacts show a coherent low-poly rustic palette across the families.

## 9. Product Breadth Diagnostic

Novel barrel creation was rejected at the public schema boundary: `create_asset.reference` accepts only `adventurer`, `crate`, `tree`, and `cottage`. There is no public operation that creates a new asset identity from a discoverable template grammar without manually constructing an entire document. This is acceptable for the deliberately narrow MVP, but it materially limits the broader promise of turning a new fantasy asset brief into an asset.

Evidence: [breadth boundary](benchmark-evidence/20260717T104617Z/mcp-breadth-animation-boundary.json).

## 10. Character Animation Sprite-Sheet Benchmark

Requested workflow:

> Create a simple, readable rustic fantasy character and use the available model and asset tools to produce five distinct sprite animations for that same character: idle, walking forward, walking right, attacking, and receiving damage. Deliver all five animations in one transparent sprite sheet plus machine-readable metadata identifying clip names, frame ranges, frame timing, loop behavior, cell size, and ground/pivot anchor. Keep the character’s identity, equipment, scale, palette, lighting, camera, and ground position consistent across every frame. Validate the result and report all source revisions and output paths. Do not fake animation by repeating an identical frame, and do not manually edit images or product source code.

The required LLM-to-tool transcript is **Blocked** because no evaluating MCP-capable LLM was available. Independent product evidence makes the capability result unambiguous: the public tool list has no animation, clip, atlas, or sheet tool; the render tool only produces eight static directional views; and the final GLB manifest has `animationCount: 0`.

The MiniMax-generated reference [aspirational sprite sheet](benchmark-evidence/20260717T104617Z/imagegen/aspirational-sprite-sheet_001.jpg) is included as a visual target only. It is a single JPEG with no transparency, cell metadata, frame timing, reliable row labels, or machine-readable clips; it is not a product output and is not credited toward the score. It usefully demonstrates why a deterministic semantic animation pipeline is preferable to asking an image model for an atlas directly: the generated sheet has inconsistent/blank cells and no trustworthy metadata.

Per-clip result:

| Clip | Result | Evidence |
| --- | --- | --- |
| `idle` | Fail — unsupported | No animation tool or clip metadata |
| `walk_forward` | Fail — unsupported | No temporal frame authoring |
| `walk_right` | Fail — unsupported | No temporal frame authoring |
| `attack` | Fail — unsupported | Static `action` pose is not an animation |
| `receive_damage` | Fail — unsupported | No hurt pose/clip or atlas output |

Overall animation result: **Fail — unsupported for broader product fitness; acceptable as an explicit exclusion from narrow MVP scope.** No frame uniqueness, loop seam, or timing test can be passed because no clips or metadata were produced.

## 11. Game-Readiness and Determinism

Static sprite contract evidence passed for the evaluated references: eight ordered directions, 128×128 frames, transparent pixels, occupied pixels, no clipped edges, stable ground pixel at 121 in the MCP manifests, and required feature evidence at least 3 px. The final adventurer’s torso evidence ranged from 8–18 px across directions; crate/tree/cottage manifests likewise passed their required feature checks.

GLB integrity passed product reload checks. The final adventurer has meter units, 18 semantic nodes, five materials after unequipping, zero transform/scale mismatch, matching bounds, and a nonempty 54,336-byte GLB. A real target-game import was not available, so external pipeline compatibility is **Not Assessed**.

Determinism/persistence passed: repeated validation summaries matched; repeated render manifests and contact sheets were byte-identical; repeated exports were byte-identical with SHA-256 `e281604e4169cfcf865feb02553a1c3ff77dfdb20a34c5caee6bcf08bc1f1dd1d`; and a restarted MCP server recovered `revision.fda4025a45c6cf5590dbf57e2468f4d8ce1e08d0735a4b6337430953585bfcf7`. Full comparison evidence is [mcp-determinism-persistence.json](benchmark-evidence/20260717T104617Z/mcp-determinism-persistence.json).

## 12. Scoring

| Category | Weight | Score | Evidence-based rationale |
| --- | ---: | ---: | --- |
| LLM discovery and autonomy | 12 | 0 | No evaluating MCP-capable LLM was available; manual discovery is not a substitute. |
| Seeded creation and localized revision | 18 | 14 | Manual MCP path completed with correct lineage, dry-run, affected IDs, pose, variant, render, and export; instance shape state is shallow and LLM autonomy was not assessed. |
| Revision safety and error recovery | 10 | 10 | Stale, invalid, unsupported, and no-op cases rejected without mutation and with guidance. |
| Visual fitness at delivery resolution | 17 | 16 | All references are recognizable, grounded, transparent, and unclipped; cottage reverse-view feature separation is weaker. |
| 3D and static-sprite output integrity | 13 | 12 | Manifests, meter GLBs, nodes/materials, reloads, and pixel contracts pass; real game-engine import was unavailable. |
| Shared-engine reuse | 5 | 5 | All four references used the same public workflow successfully. |
| Determinism and persistence | 5 | 5 | Byte-identical repeated render/export and restart recovery passed. |
| Workflow usability and documentation fidelity | 10 | 6 | Public surface is bounded and auditable, but no LLM client was available, `inspect_asset` is shallow, and reference-build paths are stale. |
| Character animation sprite-sheet production | 10 | 0 | Unsupported: no animation/atlas tools, clips, metadata, or animated GLB. |
| **Total** | **100** | **68** | Diagnostic score; hard gates still control the verdict. |

## 13. Findings

### High — LLM-first approval cannot be established in the tested environment

- Observed: no MCP-capable evaluating LLM/client was configured; all MCP authoring was performed by a manual JSON-RPC harness.
- Expected: a fresh LLM should discover and complete the seeded flow through the public MCP tools.
- Reproduction: use [mcp-config-redacted.json](benchmark-evidence/20260717T104617Z/mcp-config-redacted.json); no MCP client is available to launch it as an LLM tool provider.
- Evidence: `mcp-surface-transcript.md`, `mcp-discovery-manual.json`, `mcp-seeded-authoring-manual.json`.
- Impact: narrow conformance remains Blocked despite strong server-engine evidence.
- Remediation: run the same protocol with a real MCP-capable authoring LLM and preserve its chronological transcript.

### High — No animation or sprite-atlas authoring capability

- Observed: exactly ten tools are exposed; none handles animation clips, frame timing, atlas layout, or metadata; GLBs report zero animations.
- Expected: broader product fitness requires five distinct temporal clips in one transparent sheet with machine-readable metadata.
- Reproduction: query `tools/list`, inspect [mcp-breadth-animation-boundary.json](benchmark-evidence/20260717T104617Z/mcp-breadth-animation-boundary.json), and inspect final GLB manifests.
- Evidence: `mcp-surface-transcript.md`, `mcp-breadth-animation-boundary.json`, `mcp-artifacts/*/glb-manifest.json`.
- Impact: the product is not fit for an LLM-first animated character production promise.
- Remediation: add a bounded clip/pose-sequence model, deterministic atlas renderer, timing metadata, validation, and MCP tools for create/inspect/render/export of clips.

### High — New asset identity creation is limited to four committed references

- Observed: `create_asset` schema rejects `barrel`; no public discovery path assembles a new identity from templates.
- Expected: broader asset-workshop claims should support at least a bounded novel asset workflow.
- Reproduction: call `create_asset({"reference":"barrel"})`.
- Evidence: `mcp-breadth-animation-boundary.json`.
- Impact: novel fantasy briefs cannot be fulfilled without source/canonical-document knowledge.
- Remediation: expose a safe new-asset authoring path built from public template/port/material grammar, with bounded identity and validation rules.

### Medium — `inspect_asset` is insufficient for safe parameter-preserving edits

- Observed: it returns part/template IDs, connections, variants, and poses, but not instance shape parameters, transforms, material bindings, or full port state.
- Expected: an authoring LLM should calculate a local change and prove unrelated content is preserved from public state.
- Reproduction: call `inspect_asset({"assetId":"adventurer.rustic"})` and compare with `inspect_template("human.torso")`.
- Evidence: `mcp-discovery-manual.json`, `mcp-seeded-authoring-manual.json`.
- Impact: a caller must infer that the reference defaults equal the current instance state; that is unsafe after prior revisions.
- Remediation: add bounded per-part parameters, transforms, material bindings, visibility, and connection/port details to inspect output, with truncation controls.

### Medium — Advertised reference build writes stale archived paths and dirties tracked manifests

- Observed: `pnpm reference:build` succeeds but writes to the old active-track path and rewrites tracked manifest files.
- Expected: documented commands should target the archived track or a current evidence location and leave the clone clean where promised.
- Reproduction: run `pnpm reference:build` in the clean clone.
- Evidence: `reference-build.log`, `benchmark-status-after-commands.txt`, `benchmark-diff-stat.txt`.
- Impact: repeatability and closeout automation are weakened; a green command does not imply a clean reproducible checkout.
- Remediation: update the runner/README/Measure paths together and make generated reference manifests deterministic without tracked-file churn.

### Low — Browser asset views simplify narrow/reverse silhouettes

- Observed: adventurer E/W views are 24 px wide; cottage S/SW required-feature evidence drops to 12 px; some details collapse at actual resolution.
- Expected: required features should remain materially distinguishable in every delivered direction.
- Evidence: browser screenshots and `browser-assets.txt`; MCP render manifests.
- Impact: static assets are usable, but some game contexts may need larger sprites or directional-specific framing/detail.
- Remediation: tune render profiles or minimum-feature checks for the most important silhouette features.

## 14. Approval Conditions

Before narrow MVP approval:

1. Repeat the seeded workflow with a real MCP-capable LLM and capture the complete natural-language/tool transcript.
2. Extend `inspect_asset` enough for the LLM to preserve and verify current per-part parameters without filesystem/source knowledge.
3. Repair the archived-track/reference-build path drift and prove the documented command’s clean-state behavior.
4. Perform a representative target-game GLB import, or explicitly document the supported import contract and independent verification.

Before broader product approval, also deliver the five required temporal clips, transparent atlas, metadata, timing/loop validation, and a bounded novel-asset identity workflow. Animation is currently unsupported, so broader approval is not available.

## 15. Final Recommendation

Today the project is fit as a deterministic, constrained static rustic-fantasy asset compiler and inspector for its four committed reference families. It is not yet fit as a general LLM-first fantasy asset workshop, a novel-asset generator, or a character animation/sprite-atlas production system.

The smallest milestone that materially changes the narrow verdict is an actual MCP-client run with a fresh authoring LLM plus a richer `inspect_asset` response. The smallest milestone that changes the broader verdict is a bounded animation slice—one character, five clips, deterministic 128×128 atlas and metadata—implemented through public MCP tools and validated end to end.

## 16. Evidence Index

- Environment/status: `node-version.txt`, `pnpm-version.txt`, `tested-log-entry.txt`, `benchmark-status-initial.txt`, `benchmark-status-after-commands.txt`, `source-status-before.txt`, `tested-commit.txt`.
- Automated logs/results: `install.log`, `pnpm-check.log`, `lint.log`, `pnpm-test.log`, `test-coverage.log`, `build.log`, `test-browser.log`, `reference-build.log`, `generate.log`, `doctor.log`, and their `.result` files.
- Browser evidence: `browser-initial.png`, `browser-initial.txt`, `browser-controls.txt`, `browser-assets.txt`, all `browser-*-3d.png`, `browser-*-contact-sheet.png`, `browser-*-actual-128px.png`, and adventurer interaction screenshots/log.
- MCP surface/discovery: `mcp-config-redacted.json`, `mcp-surface-transcript.md`, `mcp-discovery-manual.json`.
- Seeded authoring/safety: `mcp-seeded-baseline-manual.json`, `mcp-seeded-authoring-manual.json`, `mcp-safety-manual.json`.
- Shared engine/breadth: `mcp-shared-engine-manual.json`, `mcp-breadth-animation-boundary.json`.
- Determinism: `mcp-determinism-persistence.json`.
- Preserved artifacts: `mcp-artifacts/` with baseline/final adventurer, crate, tree, and cottage sprites, contact sheets, manifests, and GLBs.
- Image-generation reference: `imagegen/aspirational-sprite-sheet_001.jpg`, `imagegen.log`.
- Full temporary clone preserved at `/tmp/fantasy-asset-forge-benchmark-20260717T104617Z`.
