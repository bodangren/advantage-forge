# Fantasy Asset Workflow Report: Ranger loadout on fresh adventurer

## Goal and capability decision
- **Interpreted goal:** Build Ranger loadout (spear main-hand, leather armor body, quiver back, belt pouch waist) on fresh adventurer; verify via revision comparison, validation, sprites, GLB; action pose; then unequip.
- **Runtime statuses:** `asset.reference.adventurer` supported; `accessory.library`/`accessory.additional` supported; `revision.immutable`/`operation.inspect` supported; `animation.rigid_pose` supported; `output.sprite.directional`/`output.sprite.contact_sheet` supported; `output.glb` supported. `animation.temporal`, `output.sprite_atlas`, `asset.new_identity`, `anatomy.unsupported`, `operation.raw_mesh` unsupported (out of scope). `integration.game_engine_import` not-assessed.
- **Decision:** proceed.

## Revision lineage (chronological)
| # | Revision | State |
|---|---|---|
| 1 | `revision.88ac2bf6…f35d` | Baseline (created; sword+shield, idle) |
| 2 | `revision.10da601f…0965` | shield unequipped |
| 3 | `revision.6306980c…7833` | sword→spear replace |
| 4 | `revision.4cfbaa99…c08e` | armor equipped |
| 5 | `revision.94ccf4cb…3ed4` | quiver equipped |
| 6 | `revision.4b1069aa…1a9c` | pouch equipped = **equipped idle** |
| 7 | `revision.799894d7…edcc` | **equipped action** |
| 8 | `revision.4211c087…b1c3` | spear unequipped |
| 9 | `revision.828f3615…93c3` | armor unequipped |
| 10 | `revision.b9b9563e…c01c` | quiver unequipped |
| 11 | `revision.bcd6f5e2…27da` | pouch unequipped = **final (action, unequipped)** |

No revision conflicts.

## Public tool calls in order
1. `inspect_capabilities({})` → ok
2. `create_asset({reference:"adventurer"})` → baseline
3–8. `inspect_asset` overview, parts (19), connections (17), poses (idle/action), variants (6), renderProfiles (sprite.default) → ok
9–12. `search_accessories` archetypeId `ranger`: weapon/main-hand, armor/body, back-item/back, waist-item/waist → 1 candidate each
13–16. `inspect_template`: `equipment.spear`, `equipment.armor.leather`, `equipment.quiver`, `equipment.pouch.belt` → ok
17. `apply_accessory_operation` unequip `shield` dryRun, archetypeId `ranger` → **ok:false INVALID_ASSEMBLY** (shield supports only adventurer/guard/warrior)
18–53. See dry-run/apply pairs and outputs below.

## Dry-run/apply pairs (inputs identical except `dryRun` — verified byte-identical for each pair)
| Operation | Archetype | Dry-run | Apply revision | Affected / added / removed / connection IDs |
|---|---|---|---|---|
| unequip `shield` | adventurer* | ok, rev unchanged | `10da601f` | affected: shield, equip-shield, unequipped; removed: shield, equip-shield; conn: equip-shield |
| replace `sword`→`equipment.spear` (main-hand, iron.blued) | ranger | ok | `6306980c` | affected: sword, equip-sword, sprite.default; conn: equip-sword |
| equip `equipment.armor.leather` (body, leather.dark) | ranger | ok | `4cfbaa99` | added: accessory.body, connection.body; conn: connection.body |
| equip `equipment.quiver` (back, leather.tan) | ranger | ok | `94ccf4cb` | added: accessory.back, connection.back; conn: connection.back |
| equip `equipment.pouch.belt` (waist, leather.tan) | ranger | ok | `4b1069aa` | added: accessory.waist, connection.waist; conn: connection.waist |
| `set_pose` action | — | ok | `799894d7` | affected: action |
| unequip `sword` (spear) | ranger | ok | `4211c087` | removed: sword, equip-sword; affected +sprite.default, unequipped |
| unequip `accessory.body` | ranger | ok | `828f3615` | removed: accessory.body, connection.body |
| unequip `accessory.back` | ranger | ok | `b9b9563e` | removed: accessory.back, connection.back |
| unequip `accessory.waist` | ranger | ok | `bcd6f5e2` | removed: accessory.waist, connection.waist |

*Correction: shield unequip required archetypeId `adventurer` per runtime guidance; retried once, then proceeded. No other retries.

## Comparison evidence
- **Baseline → equipped idle:** 26 changes, all explained (3 parts + 3 connections added, shield+equip-shield removed, sword→spear template/transform/material/slot, requiredFeaturePartIds +4, unequipped-variant shield override removed). Preserved: all anatomy, poses, variants, materials, templates.
- **Idle → action:** 1 change (`activePoseId` idle→action); everything else preserved.
- **Equipped action → unequipped:** 13 changes, all removals of the 4 accessories + connections + profile refs + sword variant override; anatomy/poses preserved.

## Validation evidence
- Equipped idle: **valid**; bounds min [-0.547,-0.695,-0.38] max [1.075,2.33,0.54]; **1547/2000 triangles** (453 remaining).
- Final unequipped action: **valid**; bounds min [-1.233,-0.680,-0.183] max [1.052,2.33,0.255]; **1396/2000** (604 remaining).

## Artifact evidence
**Equipped idle (`4b1069aa`):**
- Render manifest: `/tmp/faf-s4-k3-ranger-20260719T062928Z-runtime/artifacts/reference/adventurer.rustic/revision.4b1069aad420d1baf2cfe32efe1bc73fc87807bef15c94ac8358f232a67a1a9c/render-manifest.json`
- Contact sheet + frames n/ne/e/se/s/sw/w/nw.png (128×128) in same directory
- GLB: `…/adventurer.rustic.glb` (67,204 B), manifest `…/glb-manifest.json`; reload-verified: 22/22 nodes, materials match, max rotation deviation 4.2e-8 rad, bounds match
- Required-feature metrics: spear-tip, armor-shoulder, quiver-rim, pouch-flap, torso **pass in all 8 directions**; no clipped edges; ground anchor deviation 0px all directions

**Equipped action (`799894d7`):**
- Render manifest + contact sheet + 8 frames at `…/revision.799894d73dc40979b96a1bcd744a5c39bbf4cbd9980a9c07e501916256abedcc/`; all required features pass all 8 directions; no clipping; ground deviation 0px
- **GLB: FAILED** — `export_asset` timed out 4× (MCP error -32001); state re-inspected between attempts; no GLB/manifest produced for this revision

**Unequipped action (`bcd6f5e2`):** render manifest + contact sheet + 8 frames at `…/revision.bcd6f5e2…/`; torso feature passes all directions; no clipping.

## Visual evidence
Interactive 3D inspector, contact-sheet imagery, native 128×128 PNG inspection, and GLB importer audit: **Not Assessed** (not openable with the allowed tool set). Metric evidence only: zero clipped edges, ground anchor row 121 with 0px deviation in every direction and revision, all required-feature minimums met (area/width/occlusion/Oklab) in every direction. Audit-only verifier scripts: **Not Assessed** (shell use forbidden by task constraints).

## Limitations and verdict
- **Failed gate:** equipped-action GLB export (4 timeouts) — action-pose GLB evidence missing.
- Not Assessed: direct visual surfaces, importer audit, engine import, artifact-hash verification.
- Unsupported (out of scope, unchanged): temporal animation, atlases, cloth physics, gameplay inventory, novel identity/anatomy, raw mesh.
- All mutations were local, dry-run/apply pairs exact, comparisons clean, validations passed.

**Final verdict: partial** — full semantic, validation, comparison, and sprite evidence passes for all three states, but the equipped-action GLB artifact could not be delivered due to repeated export timeouts.
