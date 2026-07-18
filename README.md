# Fantasy Asset Forge

Fantasy Asset Forge is an LLM-first, purpose-built system for creating stylized low-poly fantasy RPG assets from reusable parametric parts. Its canonical source is a semantic asset document; deterministic builds produce inspectable 3D scenes, GLB assets, and fixed-view transparent sprites without Blender or another general-purpose DCC backend.

The MVP contains one controlled rustic-fantasy kit, four reference assets, twelve bounded shape generators, twelve semantic LLM tools, an inspector, transparent eight-direction sprites, and GLB export. It intentionally is not a general modeling environment.

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

The public surface is deliberately small: `list_kits`, `inspect_capabilities`, `inspect_template`, `inspect_asset`, `compare_revisions`, `create_asset`, `apply_operations`, `connect_parts`, `set_pose`, `validate_asset`, `render_preview`, and `export_asset`.

## Capability preflight

Call `inspect_capabilities` before planning an asset request. Its generated and runtime facts use four explicit statuses:

- **Supported:** the four committed references, localized semantic revisions, the existing sword and shield, static rigid poses, directional transparent PNGs, review contact sheets, and reload-verified GLB.
- **Partial:** the accessory surface exists, but currently contains only the sword and shield.
- **Unsupported:** new asset identities, additional accessories such as helmets or alternate weapons, temporal animation, runtime sprite atlases, unregistered anatomy, skeletal deformation, and raw mesh editing.
- **Not Assessed:** Three.js `GLTFLoader` now passes as a representative format importer, but Unity, Godot, and gameplay-runtime integration remain unverified.

Do not compensate for an unsupported result by reading product source, hand-authoring canonical asset JSON, post-processing images, or using hidden filesystem or shell routes. The generated [capability catalog](measure/generated/capability-catalog.md) is derived from the same executable facts as the public tool.

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
