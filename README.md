# Fantasy Asset Forge

Fantasy Asset Forge is an LLM-first, purpose-built system for creating stylized low-poly fantasy RPG assets from reusable parametric parts. Its canonical source is a semantic asset document; deterministic builds produce inspectable 3D scenes, GLB assets, and fixed-view transparent sprites without Blender or another general-purpose DCC backend.

The MVP contains one controlled rustic-fantasy kit, four reference assets, twelve bounded shape generators, sixteen public semantic tools, an inspector, transparent eight-direction sprites, and GLB export. It intentionally is not a general modeling environment.

## Start locally

```bash
pnpm install --frozen-lockfile
pnpm dev --host 127.0.0.1 --port 4173
```

Open `http://127.0.0.1:4173`. The inspector provides interactive 3D, an enlarged contact sheet, actual 128px frames, semantic scene evidence, and pixel-validation metrics.

## Build canonical references

```bash
pnpm reference:build
```

This runs the complete public-handler workflow for the adventurer, crate, tree, and cottage. Canonical JSON is written under `references/`; revision-associated PNG, contact-sheet, manifest, and GLB files are written under `artifacts/reference/`.
The deterministic run dossier is committed at
`measure/archive/fantasy_asset_mvp_20260717/reference-build.json`.

## Connect an MCP client

Keep the inspector server running on port 4173, then configure the MCP client to launch:

```json
{
  "command": "pnpm",
  "args": ["mcp"],
  "cwd": "<path-to-your-fantasy-asset-forge-checkout>",
  "env": {
    "FORGE_INSPECTOR_URL": "http://127.0.0.1:4173"
  }
}
```

The public surface is deliberately small and discoverable through MCP `tools/list`; it covers kit/capability/template/accessory discovery, asset inspection and comparison, reference or bounded novel-identity creation, semantic/accessory revisions, validation, rendering/export, and revision-pinned interchange retrieval.

## Capability preflight

Call `inspect_capabilities` before planning an asset request. Its generated and runtime facts use four explicit statuses:

- **Supported:** the four committed references, bounded novel-identity initialization and registered-grammar composition for the advertised humanoid and banded-container archetypes, the registered seventeen-accessory library, localized semantic revisions, static rigid poses, directional transparent PNGs, review contact sheets, reload-verified GLB, and revision-pinned public interchange retrieval.
- **Partial:** broad novel-identity authoring remains limited to the two advertised archetypes and registered grammar; arbitrary anatomy, templates, generators, and raw-mesh composition are unavailable. Mechanically valid novel-character output is not visually accepted without an owner-approved provenance-bound reference target and side-by-side Kimi convergence.
- **Unsupported:** temporal animation, runtime sprite atlases, unregistered anatomy, skeletal deformation, and raw mesh editing.
- **Not Assessed:** Three.js `GLTFLoader` now passes as a representative format importer, but Unity, Godot, and gameplay-runtime integration remain unverified.

Do not compensate for an unsupported result by reading product source, hand-authoring canonical asset JSON, post-processing images, or using hidden filesystem or shell routes. The generated [capability catalog](measure/generated/capability-catalog.md) is derived from the same executable facts as the public tool.

For a novel character intended as accepted art, generate and provenance-bind a
front/three-quarter/side/back turnaround or an explicitly approved reduced view
set before modeling. Obtain owner approval, then compare Forge renders
side-by-side through Kimi. No image provider is implicitly authorized; do not
silently use MMX. The first compacted novel guard was mechanically valid but
visually rejected, so transform-only compacting is not an acceptance route.

## Verify

```bash
pnpm check
pnpm test:coverage
pnpm build
pnpm test:browser
pnpm reference:build
```

See the generated contracts in `measure/generated/` and the completed evidence dossier in `measure/archive/llm_authoring_workflow_hardening_20260717/`.

## Scope

The canonical value is the semantic document and reusable part grammar. Blender, arbitrary mesh editing, code execution, shell access, unrestricted filesystems, network retrieval, general animation, physics, texture painting, and additional art directions are excluded from the MVP.
