# Test Strategy — Forge–Pixel Public MCP Interchange, Phase S1

## Supersession and status

This strategy supersedes the game-engine-first strategy introduced by `e91779f`. Its external importer matrix, Godot/Unity work, atlas assumptions, generated-document changes, and Red commands are not an active baseline and must not direct implementation.

Fantasy Asset Forge is the specialized semantic 3D/raster producer, and Pixel Art Generator is the named downstream educational-app pack assembler. Current external game-engine compatibility remains **Not Assessed**. The S1 contract and bounded S2 Forge retrieval foundation are implemented; downstream delivery and live acceptance are not claimed by this strategy.

The replacement strategy was accepted for the bounded S1 contract slice on 2026-07-22. Per owner direction, its immutable Git baseline is `e91779f52c88a733b70dbc139a2f4b3cb85c391f`; the pre-existing uncommitted planning rescope is preserved separately and is not implementation evidence. Red is `tests/contracts/interchange.test.ts`, initially failing 14/14 because the interchange exports did not exist. Green is the same focused command after implementing `src/contracts/interchange.ts`. No commit is created in this coordinated run by explicit owner direction.

## Phase S1 test scope

S1 defines the planned base contract with the exact ID `forge-asset-interchange-manifest/v1`. Tests must first fail for a closed-schema, canonically serialized, SHA-256 digest-pinned, portable manifest that requires:

- artifact digests and source revisions;
- profile ID/version, dimensions/media type, roles, and evidence references;
- individual transparent 128x128 PNG frames and GLBs as independently required Forge source-delivery artifacts; and
- deterministic contact sheets, atlases, and clip metadata as Forge-produced derived artifacts.

Tests must also prove the boundary used by the Pixel consumer fixture: consume, validate, and package Forge only through public MCP and portable artifacts; reject recomputing Forge animation atlases, Forge source imports, internal handler calls, absolute paths, and shared mutable filesystem state. The fixture may model `education-app-pack-profile/v1` handoff inputs, but must not assemble a pack or claim the downstream profile is implemented.

## Required failing-test categories

1. Reject unknown manifest fields, missing required records, nonportable evidence references, noncanonical serialization, and SHA-256 mismatches.
2. Reject source/derived misclassification, including an atlas or contact sheet presented as a Forge source delivery artifact, and reject atlas-only delivery as satisfying the source contract.
3. Require profile ID/version and assert `cute_chibi_v1` is the default planned profile.
4. Require `heroic_stylized_v1` review records to use originality/provenance language and reject copied franchise characters, symbols, costumes, names, and distinctive combinations. Do not encode legal guarantees.
5. Reject a Pixel fixture with a Forge source import, internal handler call, absolute path, or shared mutable filesystem dependency.
6. Verify clean-clone portability without network access or host-specific paths.

## Guardrails and closeout

- S1 adds no game-engine importer, engine SDK, source integration, or downstream pack assembly.
- Do not hand-edit generated documentation. This documentation-only rescope must not be treated as executable capability evidence.
- Preserve unrelated untracked `.opencode/`; do not stage, format, or otherwise touch it.
- Parent tasks stay partial until live public-MCP evidence, clean-clone determinism, downstream handoff, owner verification, and commit-state closeout are complete.

## S1 implementation boundary and handoff

- Focused command: `./node_modules/.bin/vitest run tests/contracts/interchange.test.ts`.
- Contract files: `src/contracts/interchange.ts`, its public export, the focused contract test, and `contract.md`.
- S1 implements only parsing, validation, canonical signed projection, SHA-256 verification, artifact classification, pinned revision identity, portable opaque references, and manifest-bound provenance.
- The existing 64 KiB MCP response limit prohibits assuming that raw GLB bytes fit in ordinary tool envelopes.
- The literal golden bytes and lowercase SHA-256 in the focused test are the shared Forge–Pixel compatibility fixture. Existing AssetDocument canonicalization is not the interchange algorithm.
- `e91779f` remains provenance for the superseded game-engine direction and the owner-directed Git baseline for this uncommitted slice; it is not a passing S1 implementation revision.

## S2 retrieval and registry evidence

- Handler/schema Red: `tests/tools/interchange-retrieval.test.ts` failed 12/12 because the public handlers were absent.
- Registry Red: `tests/services/interchange-artifacts.test.ts` failed 5/5 because the immutable service was absent.
- The initial Green was reopened by independent security audit after reproducing browser-controlled direction traversal, same-revision overwrite, raw producer exceptions, same-length corrupt chunks, and header-only artifact acceptance. Those findings are part of the Red evidence and invalidate the earlier 52/52 note as acceptance proof.
- Post-audit coordinated Green: browser service, immutable registry, retrieval handlers, MCP protocol, and semantic handler suites passed 43/43 on 2026-07-22, followed by a successful TypeScript project build. Independent primary coverage also passed 35/35 before handback for final re-review.
- Adversarial coverage rejects stale document/revision identities, incomplete registration, exact-revision directory escape and symlink traversal, browser-controlled direction/path injection, differing same-revision writes while preserving the accepted index, derived live roles, invalid ranges, service metadata drift, decoded-length and chunk-digest drift, post-index byte tamper, malformed/CRC-invalid/opaque PNGs, header-only or structurally invalid GLBs, renderer metadata identity overrides, raw producer exception leakage, and absolute paths in public producer responses.
- Live registered provenance evidence has manifest-pinned `byte_length` and SHA-256 and is retrievable through `get_interchange_artifact_chunk` with `record_kind: evidence`.
- Live pilot Red exposed internal render profile `sprite.default` being rejected despite exact external parameters. Focused registry Green passed 10/10 after adding an explicit exact-parameter alias plus drift and unknown-ID rejection tests; this does not complete the live pilot.
- Each chunk carries a self-digest, but end-to-end proof requires full ordered reassembly and SHA-256 comparison with the signed manifest record.
- Remaining S2 evidence: after independent re-review, run the real stdio MCP process through exact-revision render, export, manifest retrieval, full artifact/evidence chunk reconstruction, and Pixel consumption; then repeat from a clean clone and compare portable evidence byte-for-byte.
