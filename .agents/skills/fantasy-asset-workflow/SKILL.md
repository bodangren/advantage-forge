---
name: fantasy-asset-workflow
description: Safely create, revise, validate, export, animate, and visually review supported Fantasy Asset Forge assets through its public MCP tools. Use this skill whenever a user asks an LLM to make or modify a fantasy character, prop, building, tree, accessory, pose, sprite, contact sheet, temporal clip, atlas, or GLB in this repository, or asks whether such work is currently possible. It must preflight capability limits, preserve revision and delivery evidence, inspect every delivery-resolution frame, and distinguish the mechanically implemented temporal subset from accepted production motion while blocking unregistered anatomy, unsupported accessories, deforming animation, animated-GLB, and raw-mesh work honestly.
---

# Fantasy Asset Workflow

Use the public semantic tool surface to turn a bounded asset request into an
auditable revision and, when requested, a freshness-bound temporal render
delivery. Treat semantic correctness, motion correctness, and visual fidelity
as separate acceptance gates: a valid document or distinct byte sequence can
still be illegible or fail to animate at 128px.

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
calling `create_asset`. Creation supports either one fixed `adventurer`,
`crate`, `tree`, or `cottage` reference, or one novel identity whose kit,
family, and archetype are advertised by `list_kits`. `create_asset` has no
dry-run mode and accepts exactly one of `reference` or `identity`. Record the
returned initial revision as the baseline.

#### Novel identity and registered grammar planning

For a novel request, call `list_kits` first with the user-level brief. Continue
only when its registered-grammar preflight reports a supported archetype. Treat
the returned required/optional roles, default templates, material bindings,
required ports, and suggested operations as kit-owned facts. An unsupported
brief is a stop; do not rename a reference, invent an archetype, add source
fields, or approximate missing anatomy.

Initialize the exact advertised identity through `create_asset({ identity })`,
then inspect its `overview` completeness. For each planned role, submit the
complete returned task-level `composition` to `apply_operations` with the
current `expectedRevisionId` and `dryRun: true`. Inspect the compiled patch,
affected IDs, missing requirements, and unattached parts. Replay with only
`dryRun: false` changed, re-inspect, and repeat until completeness is
`complete`. Callers choose semantic IDs exposed by the plan but never author
transforms, material-slot schemas, raw document patches, source paths, or
unadvertised ports.

#### Reference-led visual convergence for novel characters

Before modeling a novel character for visual acceptance, require a
provenance-bound generated turnaround or reference target covering at minimum
front, three-quarter, side, and back views. A reduced view set is allowed only
when the owner explicitly approves it. Record the generator/provider,
prompt/inputs, output identity, provenance, and originality review, then obtain
explicit owner approval of the target before character modeling begins.

If no approved built-in image generator is callable, stop and report the
unresolved dependency. Do not silently choose MMX or any other provider. Once a
target is approved, iterate the semantic 3D assembly only through public MCP and
capture side-by-side Kimi review across the approved views. Transform-only
compacting, schema validity, clean alpha bounds, and deterministic bytes are
necessary evidence but cannot establish visual-identity convergence.

#### Accessory discovery and loadout planning

For adventurer equipment, call `search_accessories` with the inspected asset ID,
an explicit archetype ID, and only the filters required by the brief. Select a
returned candidate, then call `inspect_template` with its exact `templateId`.
Treat the returned `usage.placements`, `intendedOrientation`, `guidance`,
`visualChecks`, material options, compatibility result, and `exampleOperation`
as kit-owned instructions. Never add a caller-authored transform, quaternion,
part ID, connection ID, or port.

Plan the whole loadout before mutating. A candidate with
`replacementRequired: true` must use its returned `replace` example rather than
`equip`. If discovery reports an anatomy, archetype, handedness, slot, or port
conflict, stop and report the issue. `swapHand` moves one equipped item only to
the opposite empty hand; it does not exchange two occupied hands. For a stale
revision, re-inspect and re-plan. Treat a no-op as a rejected change, not a
successful revision.

Dry-run the exact returned `exampleOperation` through
`apply_accessory_operation`, inspect its exact part, connection, affected, and
removed IDs plus change preview, then replay the request with only `dryRun`
changed to `false`. Re-inspect the `parts` section to confirm `equipmentSlot`
and compare revisions before rendering.

### 4. Propose the smallest semantic change

Describe the intended public operation, target semantic IDs, expected visible
effect, and preservation set. Reuse IDs returned by inspection. Prefer localized
`apply_accessory_operation`, `apply_operations`, `connect_parts`, or `set_pose`
calls over broad changes. For accessories, use the task-level operation returned
by discovery. Never infer transforms, material slots, ports, generator kinds, or
part schemas that the public inspection responses did not establish.

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
and remaining budget. Then call `render_preview` and `export_asset` with the
same exact final `revisionId`. These producer responses are path-free status
records. Retrieve the canonical manifest with `get_interchange_manifest`, then
retrieve every source artifact and workflow-evidence record through bounded
`get_interchange_artifact_chunk` calls. Verify each `chunk_sha256`, reassemble
in offset order, and verify the full bytes against the manifest SHA-256 before
accepting delivery.

For a temporal request whose runtime preflight reports the required subset as
available, submit one bounded semantic `render_preview.animation` request for
the exact immutable revision. The caller supplies declared rigid joints, named
poses, clip timing/keyframes, requested camera directions, FPS, and seed; it
must not manufacture morphology, rig, equipment, clip, frame-plan, frame,
atlas, GLB, or delivery hashes. Retrieve the returned delivery by passing its
`deliveryId` to `get_interchange_manifest`, then retrieve every declared source
frame, derived atlas, and source GLB through bounded
`get_interchange_artifact_chunk` calls. Reassemble multi-chunk artifacts in
offset order and verify chunk and full-artifact digests. Eight camera directions
remain spatial views; temporal sample times are the animation frames.

Run the bundled audit-only verifier against trusted local manifests only when
local file access is separately available; this is not the public handoff:

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

For temporal delivery, additionally inspect every source frame at native
128x128, play each clip at its declared timing, pause and step every frame, and
check anticipation/contact/recovery, weight transfer, alternating limb motion,
loop seam, identity/equipment stability, locked camera scale, clipping, and
ground anchor. Distinct hashes prove only distinct bytes; they do not prove
readable motion. A derived atlas is never a substitute for reviewing every
source frame.

Apply every accessory candidate's returned `visualChecks` to all eight native
frames. For the rustic sword, confirm the blade reads down from the hand and
stays below and outside the torso silhouette. For a shield, confirm its broad
face is upright and vertical rather than lying flat like a tray. Inspect front,
back, and both side views for hand contact, body clipping, and accidental
occlusion; a valid attachment transform is not visual proof.

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
  visual fidelity is unacceptable. A novel character also fails when its
  approved reference target or side-by-side convergence evidence is missing.

Do not call a temporal sprite sequence, runtime atlas, unregistered identity or
anatomy, new accessory template, or external game-engine import complete until
the corresponding runtime capability says `supported` and the requested
evidence exists.

Current accessory operations are rigid attachments only. They do not provide
cloth or equipment physics, inventory/gameplay state, arbitrary uploaded meshes,
two-occupied-hand exchange, skeletal deformation, or temporally animated
accessories.
