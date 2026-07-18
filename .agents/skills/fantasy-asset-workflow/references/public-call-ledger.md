# Public call ledger

Use these exact request field names. Replace angle-bracket placeholders only
with values returned by earlier public calls. Never invent a semantic ID,
revision, full shape, transform, connection, pose, or path.

## Discovery and inspection

```text
inspect_capabilities({})
inspect_capabilities({ capabilityIds: [<IDs returned by the first call>] })
list_kits({})
inspect_template({ templateId: <registered template ID> })
inspect_asset({ assetId: <asset ID>, section: "overview", offset: 0, limit: 20 })
inspect_asset({ assetId: <asset ID>, section: "parts", offset: 0, limit: 100 })
```

Valid paged sections are `parts`, `connections`, `variants`, `poses`, and
`renderProfiles`. Follow the returned `nextOffset`; do not use guessed section
names such as `materials`, `transforms`, or `dimensions`.

## Fixed-reference creation

The creation enum is exactly `adventurer`, `crate`, `tree`, or `cottage`:

```text
create_asset({ reference: "crate" })
```

`create_asset` has no dry-run field. It returns the canonical asset ID and
initial revision. If the reference already exists, inspect and revise its current
revision rather than resetting it.

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
render_preview({ assetId: <asset ID> })
export_asset({ assetId: <asset ID> })
```

These output calls operate on the current revision. Before accepting their
results, confirm every returned envelope carries the expected final revision.
If the tools are unavailable, present these as intended calls and mark every
response-derived value and delivery verdict `Not assessed`.
