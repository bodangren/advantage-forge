# Fantasy Asset Workflow Report: Caster Reference Loadout

## Goal and capability decision
- Interpreted goal: fresh adventurer with cloth hood (head), staff (main hand), cape (back), belt pouch (waist); idle + action poses; 8-direction sprites, contact sheets, GLBs; then full unequip.
- Runtime statuses (inspect_capabilities): `asset.reference.adventurer`, `accessory.library`, `accessory.additional`, `revision.immutable`, `operation.inspect`, `animation.rigid_pose`, `output.sprite.directional`, `output.sprite.contact_sheet`, `output.glb` — all **supported**. `animation.temporal`, `output.sprite_atlas`, `asset.new_identity`, `anatomy.unsupported`, `operation.raw_mesh` — unsupported; `integration.game_engine_import` — not-assessed.
- Decision: proceed (all required capabilities supported).

## Revision lineage (chronological)
1. `revision.88ac2bf6…f35d` — baseline (create_asset)
2. `revision.10da601f…0965` — shield unequipped
3. `revision.3e2b76d3…cf6d` — sword→staff replace
4. `revision.610c1199…43cc` — hood equipped
5. `revision.c003dc8a…2367` — cape equipped
6. `revision.5018d05c…6992` — pouch equipped = **equipped idle**
7. `revision.6eda341a…c8e5` — pose action = **equipped action**
8. `revision.519b3353…429a` — hood unequipped
9. `revision.5059022b…6976` — staff unequipped
10. `revision.b9b9563e…c01c` — cape unequipped
11. `revision.bcd6f5e2…27da` — pouch unequipped = **unequipped action**

No revision conflicts. One correction: initial staff-replace and shield-unequip dry-runs under archetypeId `caster` failed (`ACCESSORY_ARCHETYPE_INCOMPATIBLE`; shield allows only adventurer/guard/warrior). Re-planned: shield removed first under archetypeId `adventurer`, then caster operations succeeded.

## Public tool calls in order
inspect_capabilities, list_kits, create_asset, inspect_asset (overview/parts/connections/poses/variants/renderProfiles), search_accessories ×4 (headwear/weapon/back-item/waist-item, archetypeId `caster`), inspect_template ×4 (hood.cloth, staff, cape, pouch.belt), apply_accessory_operation dry-run ×2 (failed, see correction), then 9 dry-run/apply pairs (unequip shield; replace staff; equip hood/cape/pouch; set_pose action dry-run/apply; unequip hood/staff/cape/pouch), inspect_asset (parts, renderProfiles post-equip), compare_revisions ×3, validate_asset, render_preview ×3, export_asset ×2.

## Dry-run/apply pairs
All 10 applied mutations were replayed byte-identical except `dryRun: true→false`, each against the same expectedRevisionId; every dry-run returned ok with unchanged revisionId and expected affectedIds.

- Shield unequip: affected `shield, equip-shield, unequipped`; removed `shield, equip-shield`; connection `equip-shield`.
- Staff replace (partId `sword`): affected `sword, equip-sword, sprite.default`; no adds/removes; template/material/transform changed to kit placement; joint fixed.
- Hood equip: added `accessory.head, connection.head`.
- Cape equip: added `accessory.back, connection.back`.
- Pouch equip: added `accessory.waist, connection.waist`.
- set_pose action: affected `action` only.
- Unequips: removed `accessory.head/connection.head`, `sword/equip-sword`, `accessory.back/connection.back`, `accessory.waist/connection.waist` (+ sprite.default requiredFeaturePartIds, unequipped variant cleanup).

## Comparison evidence
- Baseline→equipped idle: 24 changes; affected `accessory.back/.head/.waist, connection.back/.head/.waist, equip-shield, equip-sword, shield, sprite.default, sword, unequipped`; 94 preserved IDs incl. all anatomy, poses, variants, materials. All changes explained by the five mutations.
- Idle→action: 1 change — `$.activePoseId idle→action` only; everything else preserved.
- Equipped action→unequipped: 13 changes; only the four accessory parts, four connections, sprite.default feature list, and `unequipped` variant override removed; all anatomy preserved.

## Validation evidence
Equipped idle: **valid**; bounds min `[-0.7,-0.695,-0.38]`, max `[1.034,2.6,0.26]`; triangles **1576/2000**, remaining 424; 21 parts, no issues.

## Render/feature metrics (all 8 directions, both equipped revisions)
Every direction N/NE/E/SE/S/SW/W/NW: no clipped edges, groundAnchorDeviation 0px, and all required features pass — `staff-crook`, `hood-outline`, `cape-tail`, `pouch-flap`, `torso` (pixel areas, widths, occlusion ≤0.8, Oklab distance ≥0.05 all within contract). Unequipped action render: torso feature passes all 8 directions, no clipping. No failing direction in any render.

## Artifact evidence
- Equipped idle (`…5018d05c…`): render-manifest.json, contact-sheet.png, n/ne/e/se/s/sw/w/nw.png (128×128), adventurer.rustic.glb (66,216 B), glb-manifest.json — reload-verified, 22/22 semantic nodes, materials match, bounds match, 0 animations/skins/cameras.
- Equipped action (`…6eda341a…`): same file set (GLB 66,628 B), reload-verified identically.
- Unequipped action (`…bcd6f5e2…`): render-manifest, contact sheet, 8 frames.
- Root: `/tmp/faf-s4-k3-caster-20260719T062928Z-runtime/artifacts/reference/adventurer.rustic/<revisionId>/…`. Audit-only verifier scripts not run (shell tools not permitted); envelope-level manifest evidence recorded instead.

## Limitations
- Interactive 3D inspector, contact-sheet pixels, native 128×128 PNG viewing, and independent GLB importer audit: **Not Assessed** (no visual/importer tools in allowed set); feature/clip/ground claims rest on tool-returned metrics only.
- Temporal animation, sprite atlases, cloth physics, gameplay inventory, novel identity/anatomy: unsupported (unchanged). Unity/Godot/gameplay-runtime import: Not Assessed.

## Final verdict: **partial**
All semantic, mutation-locality, validation, comparison, and metric gates pass; the pass verdict is withheld only because the three direct visual/importer surfaces could not be inspected with the permitted tool set.
