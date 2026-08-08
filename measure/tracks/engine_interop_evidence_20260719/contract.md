# Forge Asset Interchange Manifest v1

## Status and boundary

`forge-asset-interchange-manifest/v1` is implemented as a closed contract,
canonical signed projection, digest-verifying parser, and public MCP retrieval
surface. Forge now owns an immutable registry that is created only after the
same exact revision has complete render and GLB manifests. A real public MCP
render/export/retrieval run and clean-clone determinism evidence remain pending,
so Phase S2 is partial rather than accepted.

The contract describes one Forge-produced asset revision. It is not the
downstream `education-app-pack-profile/v1`, and it does not claim temporal
animation or atlas production.

## Identity layers

- `source.asset_id` and `source.revision_id` pin the producer asset document.
- Every artifact has its own `id`, digest, byte length, portable
  `reference`, and the same pinned `revision_id`.
- `style_profile` is either `cute_chibi_v1` or
  `heroic_stylized_v1`; it is distinct from the implemented
  `render_profile` `fantasy.sprite.orthographic.v1`.
- Both supported profile records use exact version `1.0.0`; v1 has no separate
  profile-version negotiation.
- A downstream theme or pack identity is not part of this producer manifest.

Forge authoring documents and render manifests may use the internal profile ID
`sprite.default`. The immutable registry maps that ID to external
`fantasy.sprite.orthographic.v1` version `1.0.0` only when width 128, height 128,
eight directions, 30-degree elevation, six-pixel padding, three-pixel minimum
feature size, and transparency all match exactly in both the authored profile
and render manifest. The external manifest always publishes the external ID;
unknown internal IDs or any parameter drift fail registration.

`reference` is a portable opaque retrieval key. It is relative POSIX syntax,
but it does not grant filesystem access and must not be interpreted as an
absolute host path or shared-filesystem contract.

## Artifact and provenance rules

Each manifest requires exactly eight unique 128x128 source PNG directions in
N, NE, E, SE, S, SW, W, NW plus an independently required source GLB.
Every directional frame declares `transparent: true`. Derived PNG records
declare `transparent` explicitly as either true or false; GLB and JSON records
must omit the raster transparency field.
Contact sheets, sprite atlases, and clip metadata are classified as optional
derived records; their presence in the schema does not claim that animation or
atlas output exists.
The browser producer still writes its local review contact sheet with capped,
immutable bytes, but S2 excludes that derived file from the public interchange
manifest, source-artifact structural validation, and chunk retrieval path. It
remains review-only until a later track defines live derived delivery.

The manifest has at least one evidence record and one closed provenance record
bound to the pinned source identity and all listed artifacts. Provenance records
source kind, workflow evidence, ownership, and a license label, with optional
creator and HTTP(S) source URL. Project-generated delivery must be labeled
`project_owned`. The heroic style additionally requires the exact
`original-project-owned-no-franchise-copy` attestation and a portable
originality/provenance evidence reference; that is evidence, not legal advice
or a clearance guarantee.

`provenance.workflow_reference` and a recorded heroic
`review.evidence_reference` must match an `evidence[].reference` carrying a
SHA-256 digest. An optional `source_url` is limited to 2048 characters, must be
a valid HTTP(S) URL with a nonempty hostname, and must not contain credentials.
An evidence record may declare a positive `byte_length`. Live registered
evidence always declares it so the same bounded chunk operation can retrieve
and independently verify those bytes without filesystem access.

## Public retrieval operations

- `render_preview` and `export_asset` require camel-case `assetId` and exact
  `revisionId`. Their public envelopes contain only revision-bound status, not
  browser-service paths or producer metadata.
- `get_interchange_manifest` requires snake-case `asset_id` and exact
  `revision_id`. It returns only a canonical digest-verified manifest for that
  immutable revision.
- `get_interchange_artifact_chunk` requires `asset_id`, `revision_id`,
  `artifact_id`, `offset`, and `length`. Optional `record_kind` defaults to
  `artifact` and is either `artifact` or `evidence`.
- Raw chunk length is at most 32768 bytes so the base64 envelope stays safely
  below the server's 64 KiB response cap.
- Both record kinds return `record_kind`, `asset_id`, `revision_id`,
  `artifact_id`, `artifact_sha256`, `chunk_sha256`, `offset`, `length`,
  `total`, and `bytes_base64`. The common ID/digest names make binding checks
  identical; `record_kind` prevents an evidence record from masquerading as an
  artifact.

The handler checks every response field and decoded byte length against the
signed manifest and request, and recomputes `chunk_sha256`. That proves chunk
self-consistency, not the full artifact digest. A consumer must retrieve every
range, reassemble in offset order, and hash the complete bytes against
`artifact_sha256` before admission. Unknown revisions and records, derived live
roles, invalid ranges, stale identities, digest drift, and service metadata
drift fail closed through the standard MCP error envelope. Live artifacts are
limited to source `directional_frame` PNG and `glb`; derived roles remain
fixture-only.

## Immutable registry rules

Registration validates the document's content-addressed revision before doing
work, then requires both exact-revision render and GLB manifests. It allowlists
all eight unique source frames and the GLB, hashes actual bytes, writes a
canonical immutable manifest and deterministic public-workflow evidence, and
refuses a conflicting repeated registration before changing any accepted byte.
PNG bytes are structurally decoded: chunk bounds and CRCs, terminal IEND,
non-interlaced 128x128 8-bit grayscale-alpha or RGBA scanlines, and at least one
non-opaque alpha pixel are required. GLB bytes require a valid chunk table and
JSON asset record and must reload through Three.js GLTFLoader. Every producer
write is immutable and every retrieval rechecks exact revision-directory
containment, symlink absence, full byte length, and SHA-256 before returning a
bounded path-free chunk.

## Canonical digest

To calculate `manifest_sha256`:

1. remove only the top-level `manifest_sha256` field;
2. recursively sort object keys in lexicographic order;
3. preserve declared array order;
4. encode compact JSON as UTF-8 with no trailing newline; and
5. attach the lowercase 64-hex SHA-256 digest.

The literal compatibility bytes and digest are pinned by
`tests/contracts/interchange.test.ts`. This algorithm is intentionally
independent of the canonical AssetDocument serializer, whose semantic-array
rules are not appropriate for ordered interchange artifacts and evidence.
