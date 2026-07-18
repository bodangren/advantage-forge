# Phase S4 Acceptance Contract

## Purpose

Phase S4 proves that a fresh LLM can complete the supported static workflow
through the public MCP server and that the committed reference build is
checkout-independent. It does not add accessories, identities, animation, or
another asset backend.

## Clean-clone contract

Run the following from a differently rooted clean clone at the S4 candidate
commit:

1. `env CI=true pnpm install --offline --frozen-lockfile`
2. `env CI=true pnpm check`
3. `pnpm test:coverage`
4. `pnpm build`
5. `pnpm test:browser`
6. `pnpm reference:build`
7. `pnpm generate`
8. `pnpm doctor`
9. Audit at least the final adventurer and crate artifact sets with
   `.agents/skills/fantasy-asset-workflow/scripts/verify-artifacts.mjs`.
10. Require `git status --porcelain` to be empty after all commands.

The reference build must write its deterministic dossier to
`measure/archive/fantasy_asset_mvp_20260717/reference-build.json`. Browser
reference evidence must use that archived track, not recreate
`measure/tracks/fantasy_asset_mvp_20260717/`.

### Persisted and returned paths

- Persisted render and GLB manifests store paths relative to their revision
  artifact directory: directional basenames such as `n.png`,
  `contact-sheet.png`, and `<asset-id>.glb`.
- The archived reference-build dossier stores repository-relative paths and no
  checkout root, process ID, or wall-clock timestamp.
- Public tool results may continue returning absolute paths that the immediate
  local caller can open.
- A build in another clone must leave committed manifests, canonical reference
  documents, archived evidence, and generated facts byte-identical.

Any tracked change, stale active-track output, absolute committed path, or
semantic revision drift fails this contract.

## Fresh LLM isolation contract

Use OpenCode non-interactively from a temporary client workspace containing
only:

- the `fantasy-asset-workflow` skill and its focused reference documents;
- the exact prompt below; and
- an `opencode.json` that starts the forge MCP command in the clean clone.

The client configuration sets all built-in permissions to `deny` and permits
only tools exposed by the configured forge MCP server. In particular, shell,
read, grep, glob, list, edit/write, patch, web/network, and external-directory
access remain denied. Do not use `--auto`. The server may access its own clone
to perform public operations; the LLM may not inspect that clone directly.

Record the client version, provider/model, session ID, sanitized configuration,
candidate commit, clone path, prompt hash, UTC start/end timestamps, elapsed
seconds, and process exit status. Credentials and provider tokens are never
copied into evidence.

## Seeded authoring request

Give the fresh client this request verbatim:

> Use only the configured Fantasy Asset Forge MCP tools and the supplied
> workflow instructions. Do not read or search project files, run shell
> commands, construct canonical asset JSON, edit source, post-process images,
> or use network tools. First inspect the exact current capabilities needed for
> the adventurer, localized revisions, immutable comparison, sword/shield
> equipment, static poses, directional sprites, contact sheets, and GLB. Create
> the adventurer reference. Inspect its overview, parts, variants, poses, and
> render profile with bounded public calls. Broaden only the torso by about ten
> percent from its inspected current width while preserving its inspected
> height, depth, bevel, materials, transforms, connections, and unrelated
> semantic IDs. Dry-run the exact localized operation, then apply the identical
> operation against the returned expected revision. Compare the baseline and
> broadened revisions. Dry-run and apply the `action` pose. Change the equipment
> state from its initial state to `unequipped`, using the same dry-run/apply and
> revision-binding discipline. Validate the final revision, render the
> directional sprites/contact sheet, and export GLB. Report the chronological
> revision lineage, exact affected and preserved IDs, validation, returned
> artifact paths, retries or corrections, and every limitation. Do not claim
> visual or importer evidence you could not directly observe.

### Required behavior

- Capability preflight happens before creation or mutation.
- The client obtains every mutation value and revision ID from public responses;
  it does not guess a canonical document.
- The localized dry run and apply use the same operation and expected revision.
- The torso edit preserves inspected non-width values and changes no unrelated
  semantic ID.
- Pose and equipment transitions are revision-bound and separately observable.
- `compare_revisions` records field changes plus affected and preserved IDs.
- Validation, render, and export succeed for the final immutable revision.
- Unsupported or unavailable evidence is labeled Partial, Fail, Blocked, or Not
  Assessed rather than manufactured.

## Transcript and evidence contract

Preserve evidence under `s4-evidence/<UTC-run-id>/`:

- `prompt.md`: exact prompt and SHA-256;
- `opencode-config.json`: sanitized client/MCP/permission configuration;
- `events.jsonl`: chronological raw OpenCode JSON events;
- `session.json`: exported OpenCode session;
- `run-metadata.json`: client/model/session/commit/timing/exit facts;
- `tool-ledger.json`: ordered tool name, arguments, result status, revision ID,
  affected IDs, retry/correction relationship, and elapsed offset;
- `semantic-comparison.json`: baseline-to-final public comparison response;
- `final-report.md`: the client's conclusion plus an independent evidence audit;
- render/GLB manifests, all eight native frames, contact sheet, final GLB, and
  SHA-256 inventory;
- screenshots of interactive 3D, the contact sheet, and actual 128x128 frames;
- `import-report.json`: representative importer evidence described below; and
- `clean-clone.log` plus final empty `git-status.txt`.

If the client cannot export a structured session or the run terminates early,
preserve the partial events and mark the missing fields Not Assessed. Never
reconstruct absent tool calls from the final prose.

## Visual acceptance

Review the final revision in interactive 3D, the complete directional contact
sheet, and every frame at actual 128x128. Record clipping, ground-anchor
deviation, framing, material separation, torso broadening, equipment state, and
identity consistency. Mechanical metrics do not override visible defects.

The requested final `unequipped` state means sword/shield visibility is checked
against the requested state, while the earlier equipped baseline remains the
comparison evidence. The known thin-sword limitation is not silently resolved
by this run.

## Representative importer

Use the pinned Three.js `GLTFLoader` as a representative GLB importer in an
audit-only script independent of the export call. Record:

- parser success and all thrown errors;
- scene up vector and Y-up interpretation;
- root bounds, meter-scale dimensions, and ground-plane position;
- sorted node and material names;
- semantic node count and missing/duplicate names;
- cameras, lights, skins, textures, and animations; and
- SHA-256 and byte length of the imported GLB.

This closes the representative-importer criterion only. Godot, Unity, another
game engine, and runtime gameplay integration remain Not Assessed unless direct
evidence is added later.

## Verdict

Phase S4 passes only when clean-clone, fresh-client, semantic, artifact, visual,
and representative-importer evidence all pass. A partial client run or dirty
reference build is preserved as evidence but does not close the track.
