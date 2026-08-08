# Public call ledger

Use these exact request field names. Replace angle-bracket placeholders only
with values returned by earlier public calls. Never invent a semantic ID,
revision, full shape, transform, connection, pose, or path.

## Discovery and inspection

```text
inspect_capabilities({})
inspect_capabilities({ capabilityIds: [<IDs returned by the first call>] })
list_kits({})
list_kits({ brief: "an iron-banded barrel" })
inspect_template({ templateId: <registered template ID> })
search_accessories({
  assetId: <asset ID>,
  archetypeId: <declared archetype ID>,
  query: { roles: [<required role>], slots: [<required slot>], offset: 0, limit: 20 }
})
inspect_asset({ assetId: <asset ID>, section: "overview", offset: 0, limit: 20 })
inspect_asset({ assetId: <asset ID>, section: "parts", offset: 0, limit: 100 })
```

Valid paged sections are `parts`, `connections`, `variants`, `poses`, and
`renderProfiles`. Follow the returned `nextOffset`; do not use guessed section
names such as `materials`, `transforms`, or `dimensions`.

Accessory filters are optional and bounded: `roles`, `slots`, `handedness`,
`compatibilityTags`, `compatibleAnatomy`, `compatibleArchetypes`,
`materialFamilies`, `offset`, and `limit`. Use only request-relevant filters.
The selected discovery item supplies `usage`, compatibility, material options,
and a complete `exampleOperation`; do not reconstruct these from source.

## Accessory task mutation

Copy a selected candidate's complete `exampleOperation` into the request. The
closed operation variants are `equip`, `replace`, `swapHand`, `recolor`, and
`unequip`:

```text
apply_accessory_operation({
  assetId: <asset ID from search_accessories>,
  expectedRevisionId: <baseline revisionId>,
  archetypeId: <same declared archetype ID>,
  operation: <complete exampleOperation returned by search_accessories>,
  dryRun: true
})
```

After checking the dry-run summary, replay the identical request with only
`dryRun: false` changed. Never add `transform`, `rotation`, `position`, `scale`,
`parentPartId`, `parentPortId`, or `connectionId`; placement is kit-owned. An
occupied slot requires the returned `replace` operation. A stale revision,
incompatible candidate, missing port, or no-op requires re-inspection or a stop,
not a generic-operation workaround.

## Fixed-reference creation

The creation enum is exactly `adventurer`, `crate`, `tree`, or `cottage`:

```text
create_asset({ reference: "crate" })
```

`create_asset` has no dry-run field. It returns the canonical asset ID and
initial revision. If the reference already exists, inspect and revise its current
revision rather than resetting it.

## Novel identity and registered composition

Use only a family and archetype returned by `list_kits`. Identity creation has
no dry-run field:

```text
create_asset({
  identity: {
    assetId: <new unused semantic ID>,
    name: <display name>,
    kitId: <advertised kit ID>,
    family: <advertised family>,
    archetypeId: <advertised archetype ID>,
    seed: <bounded integer seed>
  }
})
```

Inspect the initial revision's completeness, then copy one complete suggested
composition operation from the registered-grammar plan:

```text
apply_operations({
  assetId: <new asset ID>,
  expectedRevisionId: <current revision ID>,
  composition: {
    operation: "add_part",
    partId: <semantic part ID>,
    templateId: <default or compatible template ID from the plan>,
    role: <required or optional role from the plan>,
    attachment: {
      connectionId: <semantic connection ID>,
      parentPartId: <existing parent part ID>,
      parentPortId: <required parent port ID>,
      childPortId: <required child port ID>
    }
  },
  dryRun: true
})
```

After inspecting the compiled patch and completeness result, replay the request
with only `dryRun: false` changed. Re-inspect the new revision before planning
the next role. Never add transforms, material bindings, source/file fields,
unadvertised templates or ports, or both `patch` and `composition`.

## Localized mutation

`apply_operations` requires the current asset ID, the exact current revision,
one complete semantic patch, and an explicit dry-run flag:

```text
apply_operations({
  assetId: <asset ID from inspect_asset>,
  expectedRevisionId: <baseline revisionId>,
  patch: {
    operations: [
      {
        operation: "setPartShapeParameters",
        partId: <inspected part ID>,
        shape: <complete inspected shape with one bounded parameter changed>
      },
      {
        operation: "setPartTransform",
        partId: <inspected part ID>,
        transform: <complete inspected transform with one bounded value changed>
      }
    ]
  },
  dryRun: true
})
```

Never send partial `shape` or `transform` objects. Remove any operation the brief
does not need. After an accepted dry run, replay the identical request with only
`dryRun: false` changed. Do not rename `expectedRevisionId` to
`expectedRevision`.

Specialized mutation calls use the same precondition and dry-run discipline:

```text
connect_parts({
  assetId: <asset ID>,
  expectedRevisionId: <baseline revisionId>,
  connection: <complete inspected-compatible connection>,
  dryRun: true
})

set_pose({
  assetId: <asset ID>,
  expectedRevisionId: <baseline revisionId>,
  poseId: <declared pose ID>,
  dryRun: true
})
```

## Comparison, validation, and outputs

```text
compare_revisions({
  assetId: <asset ID>,
  baseRevisionId: <baseline revisionId>,
  targetRevisionId: <final revisionId>,
  offset: 0,
  limit: 100
})

validate_asset({ assetId: <asset ID> })
render_preview({ assetId: <asset ID>, revisionId: <final revisionId> })
export_asset({ assetId: <asset ID>, revisionId: <final revisionId> })
get_interchange_manifest({
  asset_id: <asset ID>,
  revision_id: <final revisionId>
})
get_interchange_artifact_chunk({
  asset_id: <asset ID>,
  revision_id: <final revisionId>,
  artifact_id: <manifest artifact or evidence ID>,
  record_kind: <artifact or evidence>,
  offset: <next byte offset>,
  length: <at most 32768>
})
```

These output calls require the exact revision. Producer calls return no host
paths. Verify every chunk digest, then verify each fully reassembled record
against its manifest digest before accepting delivery.
If the tools are unavailable, present these as intended calls and mark every
response-derived value and delivery verdict `Not assessed`.
