# S2 Live Public-MCP Interchange Evidence

## Goal and demonstrated capability

This dossier records one representative Forge-to-Pixel pilot executed only
through the public MCP stdio boundary. The consumer created and validated
`adventurer.rustic`, pinned the exact revision for render and export, retrieved
the canonical interchange manifest, reassembled every allowlisted source
artifact and workflow-evidence record from bounded chunks, validated all
digests, and emitted an `education-app-pack-profile/v1` handoff.

The run demonstrates the static public interchange path and the downstream
completeness-profile handoff. It does not demonstrate a finished educational
theme pack, temporal animation records, browser-visible product acceptance, or
clean-clone reproducibility.

## Revision lineage

- Asset: `adventurer.rustic`
- Revision:
  `revision.ee5d0a35c6d53befb6422c9df637b7a2679adf57cb8913aeec793afb0b01df67`
- Manifest contract: `forge-asset-interchange-manifest/v1`
- Canonical manifest digest:
  `0d8c1380938e1bd5cbfb4c940b797727a01ba167884b222afcfe92485b49551d`
- External render profile: `fantasy.sprite.orthographic.v1@1.0.0`
- Style profile: `cute_chibi_v1@1.0.0`
- Downstream handoff contract: `education-app-pack-profile/v1`
- Handoff profile digest:
  `e071abd2f121fd40c40f976b3ed09c232a1e6f132a9ef53cabe2e14328184011`

## Mutation summary

The public ledger contains 17 successful calls:
`inspect_capabilities`, `create_asset`, `validate_asset`,
`render_preview`, `export_asset`, `get_interchange_manifest`, and 11
`get_interchange_artifact_chunk` calls. Render and export both named the exact
immutable revision. Retrieval used the public snake-case identity fields and
did not import Forge source, invoke an internal handler, or read the producer's
filesystem.

The sanitized ledger preserves operation arguments, outcomes, chunk digests,
artifact digests, offsets, and lengths while omitting base64 payloads and host
paths.

## Validation summary

- Manifest: 9 source artifacts plus 1 workflow-evidence record.
- Retrieval: 10 records, 11 chunks, 86,548 bytes.
- Every chunk digest verified before use.
- Every reassembled record digest matched its manifest-bound digest.
- All eight directional PNGs are 128x128 and transparent.
- The GLB is 60,320 bytes and was retrieved in two bounded chunks.
- The completeness profile names exactly the 9 source members, requires the
  `pilot.delivery` derived profile, and binds every member back to the Forge
  contract, asset, revision, manifest, artifact identity, and artifact digest.
- Two isolated fresh runtime roots produced byte-identical records, manifest,
  workflow evidence, and completeness profile. See
  [determinism.md](determinism.md).
- The repository artifact verifier and pinned Three.js GLTFLoader audit passed.
  See [verifier-glb-summary.md](verifier-glb-summary.md).

## Visual review summary

The first user-Chrome connection attempt stopped at the browser's manual
remote-debugging **Allow** action. Once resolved, Kimi completed the review and
closed the session. The exact-revision Forge inspector showed a 1310x755 3D
canvas, 19 parts, 1,448 triangles, and no alerts. The review switched between
**Contact Sheet** and **Actual 128px**; the latter showed eight 128x128
directional canvases.

The Pixel consumer rendered 8 of 8 images at 128x128 natural and display
dimensions with no overflow. The E and W profiles remain visibly thinner and
darker than the other views, so this pilot is not visual theme-pack acceptance.
See [visual-review.md](visual-review.md).

## Artifact summary

| Durable record | Purpose |
| --- | --- |
| [interchange-manifest.json](interchange-manifest.json) | Exact portable public manifest returned by Forge |
| [workflow-evidence.json](workflow-evidence.json) | Exact 316-byte manifest-bound workflow evidence |
| [public-call-ledger.json](public-call-ledger.json) | Sanitized 17-call public MCP ledger with chunk proofs |
| [education-app-pack-profile.json](education-app-pack-profile.json) | Exact downstream completeness-profile handoff |
| [determinism.md](determinism.md) | Two-fresh-runtime byte comparison |
| [verifier-glb-summary.md](verifier-glb-summary.md) | Artifact-verifier and representative GLTFLoader results |
| [visual-review.md](visual-review.md) | Exact-revision Forge and Pixel user-Chrome review |

Binary PNG and GLB payloads are not duplicated in this Measure directory. Their
portable identities, lengths, and digests are retained in the manifest,
ledger, and deterministic comparison.

## Limitations and verdict

**Verdict: S2 static public workflow and completeness-profile handoff proven,
with remaining gates.**

The two successful executions used isolated fresh runtime roots, but they were
not executions from two independently checked-out clean clones. The clean-clone
acceptance criterion therefore remains partial. Per-clause downstream failure
evidence, S3 claim-gate work, final theme-pack visual acceptance, and manual
Measure closeout remain pending.

The Three.js audit is a representative GLB-format import check only. Unity,
Godot, gameplay-runtime compatibility, temporal animation delivery, and final
theme-pack quality remain Not Assessed. Provenance records state
`project_generated` and `project_owned`; they are evidence labels, not a
legal guarantee.
