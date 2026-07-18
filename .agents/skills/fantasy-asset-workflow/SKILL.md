---
name: fantasy-asset-workflow
description: Safely create, revise, validate, export, and visually review supported Fantasy Asset Forge assets through its public MCP tools. Use this skill whenever a user asks an LLM to make or modify a fantasy character, prop, building, tree, accessory, pose, sprite, contact sheet, or GLB in this repository, or asks whether such an asset or animation is currently possible. It must preflight capability limits, preserve revision evidence, inspect delivery-resolution fidelity, and block unsupported identities, accessories, temporal animation, atlases, anatomy, and raw-mesh work honestly.
---

# Fantasy Asset Workflow

Use the public semantic tool surface to turn a bounded asset request into an
auditable static revision. Treat semantic correctness and visual fidelity as
separate acceptance gates: a valid document can still be illegible at 128px.

## Non-negotiable boundary

- Keep all creation and mutation inside the public MCP tools. Do not read or
  inspect the source to discover a hidden route.
- Do not hand-author canonical JSON, edit revision storage, manufacture artifact
  evidence, post-process PNGs or GLBs, invoke shell/file-writing workarounds, or
  use raw mesh operations.
- Browser and image tools are for read-only visual inspection of artifacts and
  the inspector. They never replace `render_preview`, `export_asset`, or semantic
  mutation tools.
- Treat every tool envelope with `ok: false` as a stop. Report its issue and
  guidance; never claim that a rejected operation succeeded.

Read [current capabilities](references/current-capabilities.md) before planning.
Use its summary only as orientation; the runtime `inspect_capabilities` response
is authoritative for the current run.

Read [public call ledger](references/public-call-ledger.md) when preparing calls
or an unavailable-tool fallback. It records the exact public request field names
so a workflow report does not drift into plausible but invalid pseudo-schemas.

## Workflow

### 1. Normalize the goal

Record the requested reference family, identity, parts/accessories, pose,
materials, outputs, and whether the request implies time or multiple animation
frames. Separate must-haves from optional details. Do not silently substitute an
unrelated supported part for a missing one.

### 2. Preflight before any mutation

Call `inspect_capabilities` for every relevant capability ID. If IDs are
uncertain, call it without filters and select from `availableCapabilityIds`.

- `supported`: continue within the stated scope.
- `partial`: continue only when the requested subset is explicitly evidenced;
  otherwise stop before mutation.
- `unsupported`: stop before any mutation and report the missing capability.
- `not-assessed`: do not present the outcome as verified. Continue only if the
  unassessed item is not required for the requested verdict.

For temporal animation or atlas requests, also read
[animation handoff](references/animation-handoff.md). A request that mixes
supported and unsupported goals may continue only after the user accepts a
clearly named supported subset.

#### When the public MCP tools are unavailable

Stop before creation or mutation and give the workflow a `fail` or `blocked`
verdict. Do not treat the static capability orientation as runtime confirmation.
Provide an exact intended call ledger using the templates in
[public call ledger](references/public-call-ledger.md): keep known field names
literal and use visibly unresolved placeholders such as `<assetId from
inspect_asset>` only for response-derived values. For a proposed mutation, show
the complete `dryRun: true` request and say that the accepted dry-run request
must be replayed byte-for-byte except for `dryRun: false`.

Mark returned capability statuses, revisions, affected IDs, validation, artifact
paths, and visual observations as `Not assessed`; never write fake values merely
to make the report look complete. This fallback is useful planning evidence, not
delivery evidence.

### 3. Inspect the bounded baseline

Call `list_kits` and inspect relevant templates with `inspect_template` when a
part or port is involved. For an existing asset, call `inspect_asset` first for
`overview`, then the relevant `parts`, `connections`, `variants`, `poses`, and
`renderProfiles` pages. Follow `nextOffset` until the evidence needed for the
planned change is complete. Record the baseline `revisionId`.

If no asset exists, inspect capabilities, kits, and relevant templates before
calling `create_asset`. Creation is limited to the fixed `adventurer`, `crate`,
`tree`, or `cottage` reference; `create_asset` has no dry-run mode and cannot
assign a novel identity. Record the returned initial revision as the baseline.

### 4. Propose the smallest semantic change

Describe the intended public operation, target semantic IDs, expected visible
effect, and preservation set. Reuse IDs returned by inspection. Prefer localized
`apply_operations`, `connect_parts`, or `set_pose` calls over broad changes.
Never infer transforms, material slots, ports, generator kinds, or part schemas
that the public inspection responses did not establish.

### 5. Dry-run, then apply with a revision precondition

Submit the exact proposed mutation with `dryRun: true` and the baseline
`expectedRevisionId`. Confirm `ok`, the unchanged `revisionId`, and the returned
`affectedIds`. If the dry run fails or affects unexpected IDs, revise the plan
instead of applying it.

Repeat the same request with `dryRun: false` only after the dry-run evidence is
acceptable. Record the new revision and returned `affectedIds`. On
`REVISION_CONFLICT`, inspect the current revision and restart from the baseline
step; do not overwrite concurrent work.

### 6. Prove revision locality

Call `compare_revisions` with the baseline and final revision IDs. Page through
all reported changes when needed. Confirm the intended IDs appear in
`affectedIds`, unrelated IDs appear in `preservedIds`, and every field-level
change is explained. A surprising change is a failed review, even if validation
passes.

### 7. Validate, render, and export

Call `validate_asset`; record validation status, bounds, triangle count, budget,
and remaining budget. Then call `render_preview` and `export_asset` for the same
final revision. Record every returned manifest, contact-sheet, directional-frame,
and GLB path without rewriting or moving the product output.

Run the bundled audit-only verifier against returned manifests when local file
access is available:

```bash
node .agents/skills/fantasy-asset-workflow/scripts/verify-artifacts.mjs \
  --render-manifest <render-manifest.json> \
  --glb-manifest <glb-manifest.json> \
  --expected-asset <asset-id> \
  --expected-revision <revision-id>
```

The script only reads and hashes existing outputs. A verifier failure invalidates
artifact evidence; it does not authorize repairing artifacts outside MCP.

When a representative GLB importer audit is required and local file access is
available, run the independent pinned Three.js loader:

```bash
node .agents/skills/fantasy-asset-workflow/scripts/inspect-glb.mjs \
  --glb-manifest <glb-manifest.json> \
  --expected-asset <asset-id> \
  --expected-revision <revision-id>
```

Record its orientation, bounds, node, material, unsupported-content, byte, and
hash evidence. This is representative importer evidence only; do not infer
Godot, Unity, or gameplay-runtime compatibility from it.

### 8. Perform visual fidelity review

Read and follow [visual review](references/visual-review.md). Inspect all three:

1. the interactive 3D view,
2. the labeled eight-direction contact sheet, and
3. every actual 128x128 sprite at native resolution.

Check silhouette, clipping, framing, ground contact, accessory visibility,
directional consistency, and material separation. If a bounded semantic change
can correct a failure, return to step 4 and preserve another revision lineage.
Otherwise issue a partial or fail verdict with concrete visual evidence. Never
approve from an enlarged contact sheet alone.

### 9. Report evidence, not confidence

Use the exact structure in
[evidence report](references/evidence-report.md). Link claims to tool responses,
revision IDs, affected/preserved IDs, validation metrics, inspected views, and
artifact paths. State every unsupported or not-assessed requirement plainly.

## Verdict rules

- `pass`: capability, mutation locality, validation, artifact verification, and
  all three visual-review surfaces pass.
- `partial`: the supported subset is valid and reviewed, but a named optional or
  not-assessed requirement remains.
- `fail`: required capability is unsupported, mutation or comparison evidence is
  inconsistent, validation/artifact verification fails, or delivery-resolution
  visual fidelity is unacceptable.

Do not call a temporal sprite sequence, runtime atlas, novel character identity,
new accessory, or external game-engine import complete until the corresponding
runtime capability says `supported` and the requested evidence exists.
