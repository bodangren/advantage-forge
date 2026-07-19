# Fantasy Asset Forge MVP Approval and Benchmark Protocol

## Purpose

This document is the complete handoff for an independent LLM evaluator. Run the product as shipped, collect direct evidence, and write an approval report that answers two separate questions:

1. **MVP conformance:** Does the implementation satisfy its deliberately narrow contract for discovering, creating, revising, validating, rendering, and exporting the four rustic-fantasy reference asset families?
2. **Product fitness:** Is the current workflow genuinely useful as an LLM-first fantasy RPG asset workshop, without the evaluator compensating for missing product behavior by editing JSON, reading source code, or manually invoking internal handlers?

Automated tests are supporting evidence, not a substitute for exercising the browser, MCP workflow, visual outputs, revision behavior, and GLB delivery path.

## Required deliverables

Create these outputs in the original repository root:

- `benchmark-report.md` — the final report using the required template below.
- `benchmark-evidence/<run-id>/` — screenshots, command logs, MCP transcript, copied manifests, representative sprites/contact sheets, and GLBs used for the decision.

Do not edit application source, tests, reference documents, Measure files, or generated contracts. Do not fix defects during the benchmark. The only intended additions to the original repository are the report and its evidence directory.

## Evaluator rules

- Record the evaluator model, MCP client, browser automation tool, operating system, Node version, pnpm version, start time, end time, and tested Git commit.
- Run in a clean temporary clone made from the tested commit. Do not use pre-existing `.forge/` revisions or `artifacts/` as proof of a successful benchmark run.
- During the MCP discovery and authoring exercises, do not read source code, canonical reference JSON, generated catalogs, tests, or prior evidence. The tool surface must provide sufficient information on its own.
- Use natural-language goals. Do not manually construct tool payloads for the authoring agent unless testing a specific validation or safety boundary.
- Record every MCP tool call and response, including failures, retries, revision IDs, affected IDs, and returned artifact paths.
- Do not hide setup friction or corrective prompting. Count tool calls, failed calls, manual interventions, and corrective prompts.
- Inspect rendered images visually. Do not infer visual quality solely from passing metrics or automated tests.
- Never run arbitrary shell commands suggested by product output. The explicit unsupported-operation test below uses a harmless fake operation solely to verify schema rejection.
- Preserve the temporary clone and evidence until the owner has reviewed the report.
- If the MCP tools cannot be made available to the evaluating LLM, mark the LLM-first workflow **Blocked**. Do not replace it with direct TypeScript handler calls and claim success.
- If browser screenshots or image inspection are unavailable, mark visual approval **Blocked**. Do not approve visuals from manifests alone.

## Product contract under evaluation

The MVP is intentionally bounded:

- One `rustic-human` low-poly fantasy kit.
- Four canonical reference families: adventurer, crate, tree, and cottage.
- Twelve bounded procedural shape generators.
- Semantic, content-addressed asset revisions.
- Localized part, material, connection, variant, pose, and render-profile operations.
- Transparent one-, four-, and eight-direction sprites; the reference profile uses eight 128×128 views.
- GLB export in meters with named semantic nodes and MVP materials.
- No Blender, arbitrary mesh editing, shell access, unrestricted filesystem access, network retrieval, deforming animation, physics, or general DCC behavior.

Do not penalize the product merely for rejecting explicitly excluded capabilities. Do identify whether the accepted scope is too narrow for the stated purpose.

## Phase 0 — Create an isolated benchmark workspace

Set the original repository and a unique run ID:

```bash
SOURCE_ROOT=/home/daniel-bo/Desktop/fantasy-asset-forge
RUN_ID=$(date -u +%Y%m%dT%H%M%SZ)
BENCH_ROOT=/tmp/fantasy-asset-forge-benchmark-$RUN_ID
EVIDENCE_ROOT=$SOURCE_ROOT/benchmark-evidence/$RUN_ID
mkdir -p "$EVIDENCE_ROOT"
git -C "$SOURCE_ROOT" status -sb | tee "$EVIDENCE_ROOT/source-status-before.txt"
git -C "$SOURCE_ROOT" rev-parse HEAD | tee "$EVIDENCE_ROOT/tested-commit.txt"
git clone --no-hardlinks "$SOURCE_ROOT" "$BENCH_ROOT"
cd "$BENCH_ROOT"
```

Requirements:

- If the original worktree contains unrelated changes, record them and do not modify or include them in benchmark conclusions.
- Confirm the temporary clone has no `.forge/` or `artifacts/` state inherited from the source.
- Record `$RUN_ID`, `$BENCH_ROOT`, and `$EVIDENCE_ROOT` in the report.
- Do not delete `$BENCH_ROOT` after the run.

Capture the environment:

```bash
node --version | tee "$EVIDENCE_ROOT/node-version.txt"
pnpm --version | tee "$EVIDENCE_ROOT/pnpm-version.txt"
git status -sb | tee "$EVIDENCE_ROOT/benchmark-status-initial.txt"
git log -1 --oneline | tee "$EVIDENCE_ROOT/tested-log-entry.txt"
```

Install dependencies and preserve the log:

```bash
pnpm install --frozen-lockfile 2>&1 | tee "$EVIDENCE_ROOT/install.log"
```

If installation fails, capture the exact error and distinguish environmental failure from product failure.

## Phase 1 — Baseline quality and documented-command fidelity

Run the main non-interactive quality gate:

```bash
pnpm check 2>&1 | tee "$EVIDENCE_ROOT/pnpm-check.log"
```

Record each sub-gate, test count, failure, warning, and total elapsed time.

The README also advertises these commands. Run them independently and record their actual exit status:

```bash
pnpm test:coverage 2>&1 | tee "$EVIDENCE_ROOT/test-coverage.log"
pnpm build 2>&1 | tee "$EVIDENCE_ROOT/build.log"
pnpm test:browser 2>&1 | tee "$EVIDENCE_ROOT/test-browser.log"
pnpm reference:build 2>&1 | tee "$EVIDENCE_ROOT/reference-build.log"
```

Known issue to verify, not silently repair:

- The archived MVP track was moved from `measure/tracks/fantasy_asset_mvp_20260717/` to `measure/archive/fantasy_asset_mvp_20260717/`.
- The browser test and reference runner may still write to the old active-track path.
- The README may still describe the evidence dossier as active.

Report the observed behavior. A failing advertised command reduces repeatability and documentation-fidelity scores even if the core engine works.

After these commands, record:

```bash
git status -sb | tee "$EVIDENCE_ROOT/benchmark-status-after-commands.txt"
git diff --stat | tee "$EVIDENCE_ROOT/benchmark-diff-stat.txt"
```

Do not treat files produced by the commands themselves as unexpected dirt unless they modify tracked source or documentation.

## Phase 2 — Start the human inspection surface

Use a benchmark-specific loopback port. Prefer `4175`; select another unused loopback port if necessary and record it.

```bash
PORT=4175
pnpm dev --host 127.0.0.1 --port "$PORT" --strictPort >"$EVIDENCE_ROOT/dev-server.log" 2>&1 &
DEV_PID=$!
```

Wait for `http://127.0.0.1:$PORT` to respond. If the server does not become ready, capture the log and mark browser and render/export exercises blocked.

Do not start another server on the same port. Stop only the process started by this benchmark when cleanup is reached.

## Phase 3 — Browser baseline and visual approval

Open `http://127.0.0.1:<PORT>` with a real browser or browser-automation tool. Capture browser console errors and failed network requests throughout this phase.

### 3.1 Required interaction coverage

For each reference asset—adventurer, crate, tree, and cottage:

1. Open the asset in **3D Inspector**.
2. Orbit and zoom around it; inspect front, back, both sides, and a three-quarter view.
3. Select at least one meaningful semantic part.
4. Confirm the semantic evidence shows asset ID, revision, kit, part count, triangle count, bounds, selected part, template, ports, and materials.
5. Open **Contact Sheet** and inspect all eight directions.
6. Open **Actual 128px** and assess the delivered sprite size without browser enlargement.
7. Record clipping, ground alignment, transparent background, silhouette readability, material separation, and directional consistency.
8. Capture at least one 3D screenshot and one actual-resolution/contact-sheet screenshot per asset.

For the adventurer additionally:

1. Record the initial pose and variant.
2. Change to the other pose and to the equipped or unequipped variant opposite the initial state.
3. Use **Compare** and confirm that the before/after states are visibly distinguishable.
4. Select the torso and at least one equipment part; confirm named ports are presented.
5. Export the GLB through the browser and preserve the downloaded file.

### 3.2 Visual questions

Answer each with `Pass`, `Partial`, `Fail`, or `Blocked`, followed by evidence:

- Is each asset immediately recognizable at normal 3D inspection scale?
- Is each asset recognizable in all eight 128×128 frames?
- Are the adventurer's pose and equipped/unequipped state legible at actual resolution?
- Are sword, shield, torso, limbs, crate straps, tree branches, cottage roof, door, window, and chimney materially distinguishable where applicable?
- Is the rustic visual language coherent across character, prop, vegetation, and structure?
- Are there clipped pixels, inconsistent ground anchors, unstable framing, empty frames, or insufficient transparency?
- Do any views collapse into ambiguous silhouettes?
- Would the outputs be usable without repainting for the evaluator's stated target game style?

Visual approval must be based on the screenshots and actual frames created during this run, not the archived approval dossier.

## Phase 4 — Connect an MCP-capable LLM

Configure the evaluating MCP client to launch the server from the temporary clone. Substitute the actual benchmark root and port:

```json
{
  "command": "pnpm",
  "args": ["mcp"],
  "cwd": "/tmp/fantasy-asset-forge-benchmark-<run-id>",
  "env": {
    "FORGE_INSPECTOR_URL": "http://127.0.0.1:<port>"
  }
}
```

If the client needs an absolute executable, use the value returned by `command -v pnpm`.

Verify that exactly these ten tools are exposed:

- `list_kits`
- `inspect_template`
- `inspect_asset`
- `create_asset`
- `apply_operations`
- `connect_parts`
- `set_pose`
- `validate_asset`
- `render_preview`
- `export_asset`

Fail the surface-area check if arbitrary shell, code execution, unrestricted filesystem, network retrieval, Blender, UI automation, or raw-mesh mutation is exposed as a public product tool.

Save the MCP configuration with secrets removed and begin a chronological transcript at:

```text
benchmark-evidence/<run-id>/mcp-transcript.md
```

## Phase 5 — MCP discovery benchmark

The evaluator must begin without reading product source or reference JSON. Give the authoring LLM this exact user-level request:

```text
Use the Fantasy Asset Forge tools to discover what asset kit and reference
families are available. Explain what can be created, inspect the templates you
would need for a humanoid torso and its equipment, and propose a concise plan
for producing a visibly broader, unarmed adventurer in an action pose. Do not
read repository files and do not make changes yet.
```

Record:

- Whether the LLM finds the kit without help.
- Which discovery tools it uses.
- Whether template inspection reveals generator parameters, allowed bounds, material slots, and ports.
- Whether asset inspection exposes enough current state to calculate a local change safely.
- Any information the LLM has to guess or obtain outside the public tools.
- Tool calls, failures, corrective prompts, elapsed time, and response sizes.

The benchmark must explicitly note that `inspect_asset` is successful even if it is too shallow for authoring. Tool success and workflow sufficiency are separate judgments.

## Phase 6 — Seeded asset authoring benchmark

Give the authoring LLM this request without supplying IDs, revision hashes, JSON schemas, or numeric shape values:

```text
Create a rustic adventurer. Before changing it, inspect, validate, render, and
export the baseline. Then make only the torso approximately 15 percent broader,
using a dry run first and preserving its existing generator kind, height, depth,
bevel, connections, and all unrelated parts. Apply the change only if the dry
run validates. Change the result to the action pose and unequipped state,
validate it, render all eight directions, and export the final GLB. Report every
revision ID, the exact affected semantic IDs, validation metrics, contact-sheet
path, and GLB path.
```

Do not help the LLM by reading `references/adventurer.asset.json`. If the public tools do not expose enough current shape or variant state to fulfill the request safely, record that as a product-workflow failure. Do not compensate with filesystem inspection until the independent authoring attempt is complete.

Required evidence:

- Baseline create response and revision.
- Baseline validation, render manifest, contact sheet, GLB, and GLB manifest.
- Dry-run response and proof that it wrote no revision.
- Applied edit response, parent/current revisions, and `affectedIds`.
- Evidence that unrelated semantic nodes were not changed, if the tool surface makes that observable.
- Pose/variant revision responses.
- Final validation response and pixel metrics.
- Final contact sheet and representative actual-resolution frames.
- Final GLB and manifest.
- Total tool calls, failed calls, corrective prompts, elapsed time, and any direct manual intervention.

Copy the baseline and final artifact directories returned by MCP into the evidence directory while preserving revision IDs in their paths.

## Phase 7 — Revision safety and failure behavior

Run all tests below and record the current revision before and after each one.

### 7.1 Stale revision

After a successful mutation, deliberately submit a harmless dry-run visibility or material change using the older baseline revision as `expectedRevisionId`.

Expected result:

- Structured `REVISION_CONFLICT` failure.
- No new revision.
- Current revision remains unchanged.
- Guidance tells the caller to inspect and retry against current state.

### 7.2 Invalid semantic identifier or part

Attempt a dry-run localized operation against a nonexistent part ID.

Expected result:

- Structured rejection with a semantic path and actionable guidance.
- No mutation.

### 7.3 Unsupported operation

Submit an `apply_operations` payload containing a harmless fake operation named `runShell` with a fake command such as `true`. This tests schema rejection only; no shell capability should exist or execute.

Expected result:

- Input rejected as unsupported.
- No mutation.
- No shell, code, filesystem, network, or UI side effect.

### 7.4 No-op edit

Repeat an already-applied localized shape or material change.

Expected result:

- Clear no-op/rejected response.
- No redundant revision.

## Phase 8 — Shared-engine reuse benchmark

Using MCP only, create the crate, tree, and cottage references. For each:

1. Inspect the asset.
2. Validate it.
3. Render all eight directions.
4. Export its GLB.
5. Record revision, triangle count and budget, contact-sheet path, GLB path, elapsed time, and any failures.
6. Inspect the actual sprites and GLB evidence rather than accepting the tool response alone.

Assess whether all four families visibly use one coherent material/style vocabulary and whether their tool workflow appears shared rather than special-cased.

## Phase 9 — Novel-asset boundary benchmark

Give the authoring LLM this exact request:

```text
Create a new standalone rustic barrel asset with its own asset identity, using
only the existing procedural grammar and rustic materials. It must not merely
rename or overwrite the crate, adventurer, tree, or cottage. Validate it, render
eight directions, and export a GLB. Stay within the fantasy RPG and low-poly
scope.
```

This is a diagnostic of broader product fitness, not an assumption that the narrow MVP contract already guarantees arbitrary asset creation.

Record:

- Whether the public API can create a new asset identity or only instantiate the four committed references.
- Whether the LLM can discover and assemble parts without reading source or manually writing a complete canonical document.
- Whether it attempts to misuse an existing reference to simulate success.
- The exact limitation or successful workflow.

Interpretation:

- Failure here does not automatically fail narrow MVP conformance.
- Failure here is a major limitation for the broader promise of turning a new fantasy asset brief into an asset.
- Do not award product-fitness credit for editing source, adding a new committed reference, or directly invoking internal APIs.

## Phase 10 — Character animation sprite-sheet benchmark

This is a required end-to-end product-fitness test. The current narrow MVP specification explicitly excludes authored animation clips and complete sprite animation atlases, so report the result in two ways:

- Do not treat an honest capability rejection as a retroactive failure of narrow MVP conformance.
- Do not grant broader product-fitness approval unless the requested animation workflow and deliverables actually succeed.

Give the authoring LLM this exact request without supplying frame transforms, pose JSON, internal schemas, or source-file guidance:

```text
Create a simple, readable rustic fantasy character and use the available model
and asset tools to produce five distinct sprite animations for that same
character:

1. idle
2. walking forward
3. walking right
4. attacking
5. receiving damage

Deliver all five animations in one transparent sprite sheet plus machine-readable
metadata identifying clip names, frame ranges, frame timing, loop behavior, cell
size, and ground/pivot anchor. Keep the character's identity, equipment, scale,
palette, lighting, camera, and ground position consistent across every frame.
Validate the result and report all source revisions and output paths. Do not fake
animation by repeating an identical frame, and do not manually edit images or
product source code.
```

### 10.1 Minimum delivery contract

The result must contain at least:

| Clip             | Minimum frames | Playback | Required visual evidence                                                               |
| ---------------- | -------------: | -------- | -------------------------------------------------------------------------------------- |
| `idle`           |              4 | Loop     | A stable breathing, weight-shift, or comparable readable idle cycle.                   |
| `walk_forward`   |              6 | Loop     | Alternating steps and forward locomotion intent, returning cleanly to the first frame. |
| `walk_right`     |              6 | Loop     | A readable rightward walk distinct from walking forward.                               |
| `attack`         |              6 | One-shot | Anticipation, attack/contact pose, and recovery.                                       |
| `receive_damage` |              4 | One-shot | Impact/recoil and recovery or settled hurt pose.                                       |

All cells must:

- Be transparent 128×128 PNG cells unless the model explicitly negotiates another supported delivery contract.
- Use a stable ground/pivot anchor and consistent camera framing.
- Preserve character identity, proportions, materials, and equipment except where the action itself requires movement.
- Avoid clipping, empty frames, unintended scale changes, sudden camera shifts, temporal jitter, and duplicated filler frames.
- Remain readable when viewed at actual sprite resolution.

The combined sheet must use a deterministic row or range layout and be accompanied by JSON metadata containing, at minimum:

- asset ID and source revision ID;
- sheet path, width, height, and cell dimensions;
- clip ID, start frame, frame count, frame duration or frames per second, and loop flag;
- per-frame rectangle or row/column coordinate;
- pivot or ground-anchor coordinate;
- direction/action labels.

### 10.2 Required evaluation procedure

1. Record the complete natural-language-to-tool transcript, including any truthful refusal or unsupported-capability response.
2. Do not create animation by manually editing canonical documents, calling internal handlers, writing a custom renderer, transforming PNGs after export, or modifying source/tests.
3. If the product supports the request, preserve every intermediate semantic revision and render.
4. Open the combined sheet at actual resolution and as an enlarged nearest-neighbor preview.
5. Extract each clip according to its metadata and play it at the declared timing.
6. Capture an animated preview or a frame-by-frame contact sheet for every clip.
7. Compare frame hashes and pixels to prove that motion is not identical-frame duplication.
8. Check loop seams for idle and both walk cycles.
9. Check anticipation/contact/recovery for attack and impact/recovery for receiving damage.
10. Confirm walking forward and walking right are directionally and temporally distinct.
11. Confirm no clip silently substitutes one of the existing static pose or eight-direction contact-sheet outputs for a real temporal animation.
12. Record tool calls, failed calls, correction cycles, elapsed generation time, output byte sizes, and all manual assistance.

### 10.3 Animation verdict

Rate each clip `Pass`, `Partial`, `Fail`, or `Blocked`, then give an overall animation result.

The animation benchmark fails if any of these are true:

- Any required clip is missing.
- A clip does not meet its minimum frame count.
- Frames are duplicated to simulate motion.
- The output is only a directional static contact sheet rather than animation over time.
- Character identity, equipment, scale, palette, camera, or ground anchor changes unintentionally between frames.
- The sprite sheet or machine-readable clip metadata is missing or inconsistent.
- Producing the result requires source edits, direct internal API calls, or manual image editing.
- The five clips cannot be generated and revised through the LLM-facing product workflow.

If the product clearly reports that animation is unsupported, score the capability as `Fail — unsupported` rather than claiming a broken or fabricated success. This honest limitation is acceptable evidence for narrow MVP scope but is a hard blocker for broader approval under this benchmark.

## Phase 11 — Game-readiness and output integrity

For at least the final adventurer and one non-character asset:

1. Inspect `render-manifest.json` and `glb-manifest.json`.
2. Confirm the artifact identity and revision match the MCP response.
3. Confirm eight transparent 128×128 frames exist in N, NE, E, SE, S, SW, W, NW order.
4. Confirm frames have occupied and transparent pixels, no clipped edges, ground deviation within the declared contract, and required-feature width of at least three pixels.
5. Confirm the GLB is nonempty, in meters, and includes expected named semantic nodes and materials.
6. Import the GLB into the actual target game engine or the evaluator's representative engine/toolchain if one is available.
7. Capture import screenshots and record scale, orientation, materials, node hierarchy, and errors.

If no representative game-engine import can be performed, mark real pipeline compatibility `Not Assessed` and make final approval conditional rather than inferring it from internal reload checks.

## Phase 12 — Determinism and repeatability

For one unchanged revision:

1. Call validation twice and compare semantic summaries.
2. Render twice and compare manifest structure, metrics, frame dimensions, direction order, and artifact identity.
3. Export twice and compare GLB manifests and file hashes where the product contract permits deterministic equality.
4. Restart the MCP server, inspect the same current asset, and confirm the persisted revision is recovered.

Record exact differences. Do not require cross-GPU pixel identity if the environment changes, but do require stable semantic structure, metrics contract, revision identity, framing, and direction ordering.

## Phase 13 — Cleanup and final repository proof

Stop only the development server started by this benchmark:

```bash
kill "$DEV_PID"
```

Record the final state of both repositories:

```bash
git -C "$BENCH_ROOT" status -sb | tee "$EVIDENCE_ROOT/benchmark-status-final.txt"
git -C "$SOURCE_ROOT" status -sb | tee "$EVIDENCE_ROOT/source-status-final.txt"
```

Do not delete the temporary clone. Ensure the final report and all cited evidence exist under the original repository's `benchmark-evidence/<run-id>/` directory.

## Scoring rubric

Score each category with explicit evidence. Do not round individual category scores upward.

| Category                                      |  Weight | Full-credit standard                                                                                                                                                      |
| --------------------------------------------- | ------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LLM discovery and autonomy                    |      12 | A fresh LLM discovers capabilities and plans valid work without source access or schema coaching.                                                                         |
| Seeded creation and localized revision        |      18 | Baseline creation, dry-run, local edit, pose/variant change, validation, render, and export complete with correct revision lineage and affected IDs.                      |
| Revision safety and error recovery            |      10 | Stale, invalid, unsupported, and no-op requests fail structurally without mutation and are recoverable from returned guidance.                                            |
| Visual fitness at delivery resolution         |      17 | All references are recognizable, coherent, unclipped, grounded, directionally consistent, and readable at actual 128×128 size.                                            |
| 3D and static-sprite output integrity         |      13 | Manifests match revisions; GLBs have correct scale/nodes/materials; sprites meet mechanical contracts; representative pipeline import succeeds.                           |
| Shared-engine reuse                           |       5 | Adventurer, crate, tree, and cottage complete the same public workflow without bespoke manual intervention.                                                               |
| Determinism and persistence                   |       5 | Repeated evaluation is structurally stable and current revisions survive MCP restart.                                                                                     |
| Workflow usability and documentation fidelity |      10 | Setup is reproducible, advertised commands work, generated revisions are inspectable, and iteration does not require hidden filesystem/source knowledge.                  |
| Character animation sprite-sheet production   |      10 | The LLM creates the same simple character across five real temporal clips and delivers a valid transparent atlas plus clip metadata without source or manual image edits. |
| **Total**                                     | **100** |                                                                                                                                                                           |

Report the novel-barrel result separately as a **Product Breadth Diagnostic**. Score the required character animation test in the listed animation category. Do not add unlisted bonus points.

### Hard approval gates

Final approval is prohibited if any of these occur:

- The MCP-capable LLM cannot complete the seeded adventurer create/revise/validate/render/export flow.
- The localized edit mutates unrelated content without disclosure or revision evidence.
- Invalid, stale, or unsupported operations corrupt or silently replace the current revision.
- The evaluator cannot inspect real browser-rendered outputs.
- Reference sprites are materially unreadable, clipped, empty, or inconsistently grounded at 128×128.
- The exported GLB is missing, invalid, wrongly scaled, or lacks semantic node/material integrity.
- Passing the workflow requires editing product source or canonical reference JSON.
- A public tool exposes arbitrary shell/code execution, unrestricted filesystem/network access, Blender, or raw mesh mutation.

For the **broader product-fitness verdict**, approval is additionally prohibited if the LLM cannot create and deliver the required idle, walk-forward, walk-right, attack, and receive-damage animation clips as a valid sprite sheet with metadata. This animation gate does not apply to the separate narrow MVP-conformance verdict because animation was explicitly excluded from that original contract.

### Decision bands

- **Approve:** 85–100, every hard gate passes, and no Critical/High unresolved finding.
- **Approve with conditions:** 70–84, every hard gate passes, and limitations have concrete remediation and do not invalidate the narrow MVP.
- **Reject / not fit:** below 70, any hard gate fails, or a Critical/High issue makes the workflow unsafe or unusable.
- **Blocked:** the evaluator lacks required MCP, browser, image-inspection, or environment capabilities. Do not convert `Blocked` into approval.

Give two verdicts even if they match:

1. **Narrow MVP conformance verdict**
2. **Broader LLM-first product-fitness verdict**

## Required benchmark report template

Write `benchmark-report.md` with exactly these top-level sections.

```markdown
# Fantasy Asset Forge MVP Benchmark Report

## 1. Executive Verdict

- Narrow MVP conformance: Approve | Approve with conditions | Reject | Blocked
- Broader product fitness: Approve | Approve with conditions | Reject | Blocked
- Score: <n>/100
- Tested commit: <sha>
- Evaluator model/client: <model and MCP client>
- Run ID: <run-id>
- One-paragraph rationale

## 2. Environment and Reproduction

- Environment table
- Exact setup commands
- Installation result and elapsed time
- Server and MCP configuration
- Deviations from this protocol

## 3. Automated Baseline

| Command | Exit status | Duration | Result summary | Evidence |
| ------- | ----------: | -------: | -------------- | -------- |

Include tracked-file changes and documentation/path-fidelity findings.

## 4. Browser and Visual Evaluation

### Adventurer

### Crate

### Tree

### Cottage

For each: 3D findings, actual-resolution findings, contact-sheet findings,
metrics, screenshots, and Pass/Partial/Fail/Blocked result.

## 5. MCP Discovery and Authoring Transcript

- Natural-language requests
- Ordered tool calls and summarized payloads/responses
- Revision lineage
- Affected IDs
- Failures, retries, manual help, and elapsed time
- Link to complete transcript evidence

## 6. Seeded Adventurer Result

- Baseline revision and outputs
- Dry-run evidence
- Final revision and outputs
- Locality/unaffected-node evidence
- Pose and variant evidence
- Before/after visual comparison
- Validation and GLB evidence

## 7. Safety and Failure Behavior

| Test | Expected | Actual | Mutation occurred? | Result | Evidence |
| ---- | -------- | ------ | ------------------ | ------ | -------- |

## 8. Shared-Engine Reuse

| Asset | Revision | Validation | Render | GLB | Visual result | Notes |
| ----- | -------- | ---------- | ------ | --- | ------------- | ----- |

## 9. Product Breadth Diagnostic

- Novel barrel result
- Exact API limitation or successful method
- Implication for product vision

## 10. Character Animation Sprite-Sheet Benchmark

- Exact natural-language request and tool transcript
- Character creation and source revision evidence
- Sprite sheet and metadata paths
- Per-clip frame counts, timing, loop behavior, and Pass/Partial/Fail/Blocked result
- Actual-resolution and enlarged visual evidence
- Frame-uniqueness and loop-seam evidence
- Identity, equipment, scale, palette, camera, and anchor consistency
- Manual assistance, retries, elapsed time, and unsupported-capability evidence
- Overall animation verdict

## 11. Game-Readiness and Determinism

- Sprite contract evidence
- GLB integrity and import evidence
- Repeat render/export comparison
- Restart/persistence result

## 12. Scoring

| Category | Weight | Score | Evidence-based rationale |
| -------- | -----: | ----: | ------------------------ |

## 13. Findings

List findings highest severity first. Each finding must include:

- Severity: Critical | High | Medium | Low
- Observed behavior
- Expected behavior
- Reproduction steps
- Evidence paths
- Product impact
- Recommended remediation

## 14. Approval Conditions

List every condition required before broader approval, or state `None`.

## 15. Final Recommendation

State what the project is fit for today, what it is not fit for, and the next
smallest milestone that would materially change the verdict.

## 16. Evidence Index

List every log, transcript, screenshot, manifest, sprite, GLB, and status proof
used in the report.
```

## Decision guidance

Avoid both forms of false confidence:

- Do not reject a constrained asset compiler merely because it is not Blender or a general modeling suite.
- Do not approve an LLM-first product solely because its internal engine and tests are strong while the actual LLM-to-inspection iteration loop is incomplete.

The central benchmark question is whether a normal LLM-guided creator can move from an in-scope fantasy request to a controlled revision and trustworthy game-ready evidence without hidden implementation knowledge.
