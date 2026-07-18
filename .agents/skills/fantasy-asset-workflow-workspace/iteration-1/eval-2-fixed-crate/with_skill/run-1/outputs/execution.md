# Fantasy Asset Workflow Report: Standard rustic crate delivery

## Goal and capability decision

- Interpreted goal: Create the unchanged, fixed-reference rustic crate currently registered by Fantasy Asset Forge and deliver its eight directional 128x128 transparent PNGs, labeled review contact sheet, and reload-verified GLB. The requested crate must retain the reference design; no identity, geometry, material, pose, or render-profile customization is requested.
- Required capability IDs and runtime statuses: Fixed reference asset creation for `crate`, directional PNG export, review contact-sheet rendering, GLB export, semantic inspection, validation, and immutable revision evidence are required. The skill's orientation document says these capabilities are supported, but the authoritative runtime statuses are **unverified** because `inspect_capabilities` could not be called in this evaluation.
- Supported subset accepted by user, if applicable: Not applicable. The whole request appears to fit the documented fixed-reference static-asset subset, but runtime confirmation is mandatory before creation.
- Decision before mutation: **blocked**. No live Fantasy Asset Forge MCP tools are available, so no create, render, export, or inspection call was executed. No artifact is claimed to exist.

### Intended public-tool call ledger

Every entry below is an intended MCP call, not an executed result. The client must first obtain the public tool schemas through MCP discovery. Runtime-returned IDs are represented by named bindings and must be copied exactly; they must not be guessed.

1. Capability preflight:

   ```json
   {"method":"tools/call","params":{"name":"inspect_capabilities","arguments":{}}}
   ```

   Expected binding: select the runtime entries governing fixed `crate` creation, semantic inspection/revisions, directional PNG rendering, contact-sheet rendering, and GLB export. Proceed only if each required entry is `supported`. Result: **unverified; not run**.

2. Discover public kits and canonical IDs:

   ```json
   {"method":"tools/call","params":{"name":"list_kits","arguments":{}}}
   ```

   Expected binding: `CRATE_REFERENCE_ID` is the exact runtime-returned ID for the fixed crate reference. Result: **unverified; not run**.

3. Inspect the crate template/reference if `list_kits` exposes a relevant template ID:

   ```json
   {"method":"tools/call","params":{"name":"inspect_template","arguments":{"templateId":"<CRATE_TEMPLATE_ID_FROM_LIST_KITS>"}}}
   ```

   If the discovered public schema uses a different field name, use that field exactly. Do not infer an ID or schema. Result: **unverified; not run**.

4. Create the fixed crate without design overrides:

   ```json
   {"method":"tools/call","params":{"name":"create_asset","arguments":{"referenceId":"<CRATE_REFERENCE_ID_FROM_LIST_KITS>"}}}
   ```

   The final argument key must match the discovered public `create_asset` schema. Bind `ASSET_ID` and `BASELINE_REVISION_ID` from the successful response. Creation has no dry-run mode. No optional identity, part, material, transform, pose, or render-profile fields may be added. Result: **unverified; not run**.

5. Inspect the created asset baseline, starting with overview and paging if the response requires it:

   ```json
   {"method":"tools/call","params":{"name":"inspect_asset","arguments":{"assetId":"<ASSET_ID>","section":"overview","offset":0}}}
   ```

   If relevant evidence is not present in the overview, repeat with the public `parts`, `connections`, `variants`, `poses`, and `renderProfiles` section values, following each `nextOffset`. Confirm that the inspected revision equals `BASELINE_REVISION_ID`. Results: **unverified; not run**.

6. Validate the unchanged initial revision:

   ```json
   {"method":"tools/call","params":{"name":"validate_asset","arguments":{"assetId":"<ASSET_ID>","revisionId":"<BASELINE_REVISION_ID>"}}}
   ```

   Result: **unverified; not run**.

7. Render the directional review output for that exact revision:

   ```json
   {"method":"tools/call","params":{"name":"render_preview","arguments":{"assetId":"<ASSET_ID>","revisionId":"<BASELINE_REVISION_ID>"}}}
   ```

   Record the returned render manifest, contact sheet, and all N/NE/E/SE/S/SW/W/NW 128x128 PNG paths. Result: **unverified; not run**.

8. Export the GLB for that exact revision:

   ```json
   {"method":"tools/call","params":{"name":"export_asset","arguments":{"assetId":"<ASSET_ID>","revisionId":"<BASELINE_REVISION_ID>"}}}
   ```

   Record the returned GLB and export-manifest paths. Result: **unverified; not run**.

9. When the returned manifest paths are locally readable, run the skill's audit-only verifier exactly once without moving or rewriting outputs:

   ```bash
   node .agents/skills/fantasy-asset-workflow/scripts/verify-artifacts.mjs \
     --render-manifest <RETURNED_RENDER_MANIFEST_PATH> \
     --glb-manifest <RETURNED_GLB_MANIFEST_PATH> \
     --expected-asset <ASSET_ID> \
     --expected-revision <BASELINE_REVISION_ID>
   ```

   Result: **unverified; not run**.

10. Open the final-revision interactive 3D inspector, labeled contact sheet, and every returned directional PNG at native 128x128 resolution. This is read-only review; it must not replace the render/export calls. Result: **unverified; not performed**.

## Revision lineage

- Asset ID: Unverified; no `create_asset` response exists.
- Baseline revision ID: Unverified; no initial revision was created.
- Parent/intermediate revision IDs: Not applicable. The unchanged fixed reference requires no post-creation mutation.
- Final revision ID: Unverified. If execution succeeds without changes, the initial revision is also the final revision.
- Revision conflict or correction history: Not applicable; no mutation or revision conflict occurred.

## Mutation evidence

- Proposed public operation(s): `create_asset` using only the exact fixed crate reference returned by `list_kits`. No `apply_operations`, `connect_parts`, or `set_pose` call is proposed because the user explicitly requested no reference-design changes.
- Expected semantic IDs: `CRATE_REFERENCE_ID` from `list_kits`; `ASSET_ID` and `BASELINE_REVISION_ID` from `create_asset`. Values remain unverified.
- Dry-run result and revision ID: Not applicable. `create_asset` has no dry-run mode, and no post-creation mutation is requested.
- Applied result and affected IDs: Unverified; creation was not run. No affected-ID claim is made.
- `compare_revisions` affected IDs: Not applicable. There is only one intended immutable revision and no comparison pair.
- `compare_revisions` preserved IDs: Not applicable for the same reason.
- Explained field-level changes: Not applicable. The intended asset is the unchanged fixed reference.

## Validation evidence

- Validation result: Unverified; `validate_asset` was not available.
- Bounds: Unverified.
- Triangle count / budget / remaining: Unverified / unverified / unverified.
- Issues and guidance: The blocking issue is evaluation-tool availability, not a demonstrated product rejection. Re-run the intended ledger with a live MCP client, and stop on any `ok: false` envelope or non-supported required capability.

## Visual evidence

- Interactive 3D observations and identity evidence: Not assessed because no final asset, manifest, or inspector identity was produced. Required review would orbit the crate and check its silhouette, proportions, component intersections, material separation, ground contact, and correspondence to the unchanged fixed reference.
- Contact-sheet path and directional observations: Unverified path. Required review covers N, NE, E, SE, S, SW, W, and NW for consistent scale, framing, base anchor, silhouette, and directional continuity.
- Actual 128x128 frame paths inspected: None. Each of the eight returned PNGs must be opened at native 128x128 resolution, preferably with smoothing disabled.
- Clipping, ground, silhouette, accessory, framing, and material findings: Not assessed. Specifically verify that occupied pixels do not touch clipped edges, the crate base meets the declared ground row consistently, framing and scale remain stable, narrow slats or bands remain legible, and adjacent wood/metal or light/dark surfaces retain useful separation. Accessory visibility is not applicable because no accessory is requested.
- Corrective revision required or completed: Not assessed. If a visual failure can be corrected only by changing the fixed reference design, pause and ask whether that change is acceptable; do not silently revise the standard crate.

## Artifact evidence

- Render manifest path: Unverified; no render response.
- Contact-sheet path: Unverified; no render response.
- Directional frame paths and dimensions: Unverified. Required set is N, NE, E, SE, S, SW, W, and NW, each exactly 128x128 with transparency as declared by the render contract.
- GLB path and manifest path: Unverified; no export response.
- Audit-only verifier result and hashes: Unverified; verifier was not run because no manifests exist.
- Artifact/revision identity consistency: Unverified. Before delivery, every render/export manifest must name the same `ASSET_ID` and `BASELINE_REVISION_ID`, and the inspector must display that identity.

## Limitations and verdict

- Unsupported requirements: None identified from the orientation document; the request deliberately stays within the fixed crate reference. Runtime confirmation is still missing.
- Partial capabilities: The documented partial accessory library is irrelevant because the crate request includes no accessory.
- Not-assessed requirements: External game-engine import is not requested. Runtime capability status, semantic validation, artifact integrity, and all visual surfaces are not assessed in this evaluation because the MCP tools and artifacts were unavailable.
- Remaining visual or integration risks: The unchanged reference may still clip, float, lose narrow detail, show weak material separation, or vary by direction at native size. GLB identity, reload integrity, meter scale, orientation, nodes, and materials remain unverified. Internal reload would not prove external engine behavior.
- Final verdict: **fail**. The requested deliverables cannot be audited or delivered without runtime capability evidence, an actual created revision, validation, manifests, audit hashes, and three-surface visual review. This verdict is about missing execution evidence; it does not assert that the fixed crate capability itself is unsupported.
